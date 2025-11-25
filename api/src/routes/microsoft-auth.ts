import express, { Request, Response } from 'express'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import pool from '../config/database'
import { createAuditLog } from '../middleware/audit'
import { getValidatedFrontendUrl, buildSafeRedirectUrl } from '../utils/redirect-validator'

const router = express.Router()

// Azure AD Configuration
// IMPORTANT: These env vars come from Azure Key Vault via CSI Driver
const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '80fe6628-1dc4-41fe-894f-919b12ecc994',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
  redirectUri: process.env.AZURE_AD_REDIRECT_URI || process.env.MICROSOFT_REDIRECT_URI || 'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback'
}

/**
 * GET /api/auth/microsoft/callback
 * OAuth2 callback endpoint - exchanges authorization code for access token
 */
router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query

    if (!code || typeof code !== 'string') {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: 'No authorization code received'
      })
      return res.redirect(safeErrorUrl)
    }

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: AZURE_AD_CONFIG.clientId,
        client_secret: AZURE_AD_CONFIG.clientSecret,
        code: code,
        redirect_uri: AZURE_AD_CONFIG.redirectUri,
        grant_type: 'authorization_code',
        scope: 'openid profile email User.Read'
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const { access_token } = tokenResponse.data

    // Get user info from Microsoft Graph API
    const userInfoResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    })

    const microsoftUser = userInfoResponse.data
    const email = microsoftUser.mail || microsoftUser.userPrincipalName

    // Get tenant_id - ALWAYS query database to ensure it exists
    let tenantId: string

    if (state && state !== '1') {
      // Validate that the provided tenant_id actually exists in database
      const tenantCheckResult = await pool.query(
        'SELECT id FROM tenants WHERE id = $1',
        [state]
      )

      if (tenantCheckResult.rows.length > 0) {
        tenantId = tenantCheckResult.rows[0].id
        console.log('Using validated tenant_id from state parameter:', tenantId)
      } else {
        // Invalid tenant_id provided, fall back to default
        console.log('Invalid tenant_id in state parameter:', state, '- using default')
        const defaultTenantResult = await pool.query(
          `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
        )
        if (!defaultTenantResult.rows[0]?.id) {
          throw new Error('No tenants found in database')
        }
        tenantId = defaultTenantResult.rows[0].id
      }
    } else {
      // Get default tenant UUID from database
      const defaultTenantResult = await pool.query(
        `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
      )
      console.log('Query result for default tenant:', defaultTenantResult.rows)
      if (!defaultTenantResult.rows[0]?.id) {
        throw new Error('No tenants found in database')
      }
      tenantId = defaultTenantResult.rows[0].id
      console.log('Using default tenant_id from database:', tenantId)
    }

    console.log('Final VALIDATED tenant_id being used:', tenantId)

    // Check if user exists
    let userResult = await pool.query(
      `SELECT
      id,
      tenant_id,
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      role,
      is_active,
      failed_login_attempts,
      account_locked_until,
      last_login_at,
      mfa_enabled,
      mfa_secret,
      created_at,
      updated_at FROM users WHERE email = $1 AND tenant_id = $2`,
      [email.toLowerCase(), tenantId]
    )

    let user
    if (userResult.rows.length === 0) {
      // Create new user with Microsoft SSO
      const insertResult = await pool.query(
        `INSERT INTO users (
          tenant_id, email, first_name, last_name,
          role, is_active, password_hash, sso_provider, sso_provider_id
        ) VALUES ($1, $2, $3, $4, $5, true, 'SSO', 'microsoft', $6)
        RETURNING *`,
        [
          tenantId,
          email.toLowerCase(),
          microsoftUser.givenName || 'User',
          microsoftUser.surname || '',
          'viewer', // Default role for new SSO users
          microsoftUser.id
        ]
      )
      user = insertResult.rows[0]

      await createAuditLog(
        tenantId,
        user.id,
        'CREATE',
        'users',
        user.id,
        { email, sso_provider: 'microsoft' },
        req.ip || null,
        req.get('User-Agent') || null,
        'success',
        'User created via Microsoft SSO'
      )
    } else {
      user = userResult.rows[0]

      // Update last login
      await pool.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = $1',
        [user.id]
      )
    }

    // Create audit log for successful login
    await createAuditLog(
      user.tenant_id,
      user.id,
      'LOGIN',
      'users',
      user.id,
      { email, sso_provider: 'microsoft' },
      req.ip || null,
      req.get('User-Agent') || null,
      'success',
      'Microsoft SSO login successful'
    )

    // SECURITY: Generate JWT token with validated secret
    // JWT_SECRET must be set and must be at least 32 characters
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET environment variable is not set')
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'config_error',
        message: 'Server authentication configuration error'
      })
      return res.redirect(safeErrorUrl)
    }

    if (process.env.JWT_SECRET.length < 32) {
      console.error('FATAL: JWT_SECRET must be at least 32 characters')
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'config_error',
        message: 'Server authentication configuration error'
      })
      return res.redirect(safeErrorUrl)
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenant_id: user.tenant_id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    // SECURITY FIX: Store JWT in httpOnly cookie instead of URL parameter (CWE-598)
    // Tokens in URLs are:
    // - Logged in browser history
    // - Exposed in HTTP referrer headers
    // - Visible in server logs
    // - Can be leaked through browser extensions
    //
    // httpOnly cookies are:
    // - Not accessible to JavaScript (prevents XSS attacks)
    // - Not logged in browser history
    // - Automatically sent with requests to the same domain
    // - More secure for storing authentication tokens
    res.cookie('auth_token', token, {
      httpOnly: true,     // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === 'production', // Only sent over HTTPS in production
      sameSite: 'lax',    // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiration)
      path: '/'           // Available throughout the application
    })

    // SECURITY FIX (CWE-601): Validate frontend URL before redirect
    // Also pass token in URL for SPA compatibility (hash fragment for security)
    try {
      const frontendUrl = getValidatedFrontendUrl()
      // Pass token as query param for SPA to read and store
      const safeCallbackUrl = buildSafeRedirectUrl(`${frontendUrl}/auth/callback`, { token })
      res.redirect(safeCallbackUrl)
    } catch (error: any) {
      console.error('Frontend URL validation failed:', error.message)
      res.redirect('/login?error=config_error&message=Invalid+frontend+configuration')
    }

  } catch (error: any) {
    console.error('Microsoft OAuth error:', error.response?.data || error.message)

    const errorMessage = error.response?.data?.error_description || error.message || 'Authentication failed'
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'auth_failed',
      message: errorMessage
    })
    res.redirect(safeErrorUrl)
  }
})

/**
 * GET /api/auth/microsoft
 * Initiates Microsoft OAuth flow (main endpoint)
 */
router.get('/microsoft', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.query

    // Get tenant_id - either from query param or default tenant from database
    let state: string
    if (tenant_id && typeof tenant_id === 'string') {
      state = tenant_id
    } else {
      // Get default tenant UUID from database
      const defaultTenantResult = await pool.query(
        `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
      )
      if (!defaultTenantResult.rows[0]?.id) {
        const safeErrorUrl = buildSafeRedirectUrl('/login', {
          error: 'config_error',
          message: 'No tenants configured in system'
        })
        return res.redirect(safeErrorUrl)
      }
      state = defaultTenantResult.rows[0].id
    }

    const authUrl = `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${AZURE_AD_CONFIG.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(AZURE_AD_CONFIG.redirectUri)}` +
      `&response_mode=query` +
      '&scope=${encodeURIComponent('openid profile email User.Read')}' +
      `&state=${state}` +
      `&prompt=select_account`

    res.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Microsoft OAuth:', error.message)
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'auth_failed',
      message: 'Failed to initiate authentication'
    })
    res.redirect(safeErrorUrl)
  }
})

/**
 * GET /api/auth/microsoft/login
 * Alias for /microsoft endpoint (for compatibility)
 */
router.get('/microsoft/login', async (req: Request, res: Response) => {
  try {
    const { tenant_id } = req.query

    // Get tenant_id - either from query param or default tenant from database
    let state: string
    if (tenant_id && typeof tenant_id === 'string') {
      state = tenant_id
    } else {
      // Get default tenant UUID from database
      const defaultTenantResult = await pool.query(
        `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
      )
      if (!defaultTenantResult.rows[0]?.id) {
        const safeErrorUrl = buildSafeRedirectUrl('/login', {
          error: 'config_error',
          message: 'No tenants configured in system'
        })
        return res.redirect(safeErrorUrl)
      }
      state = defaultTenantResult.rows[0].id
    }

    const authUrl = `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${AZURE_AD_CONFIG.clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(AZURE_AD_CONFIG.redirectUri)}` +
      `&response_mode=query` +
      '&scope=${encodeURIComponent('openid profile email User.Read')}' +
      `&state=${state}` +
      `&prompt=select_account`

    res.redirect(authUrl)
  } catch (error: any) {
    console.error('Error initiating Microsoft OAuth:', error.message)
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'auth_failed',
      message: 'Failed to initiate authentication'
    })
    res.redirect(safeErrorUrl)
  }
})

export default router
