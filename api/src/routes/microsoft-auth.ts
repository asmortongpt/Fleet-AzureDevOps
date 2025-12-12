import axios from 'axios';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { createAuditLog } from '../middleware/audit';
import { getValidatedFrontendUrl, buildSafeRedirectUrl } from '../utils/redirect-validator';
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';

const router = express.Router();

// Azure AD Configuration
// IMPORTANT: These env vars come from Azure Key Vault via CSI Driver
const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '80fe6628-1dc4-41fe-894f-919b12ecc994',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
  redirectUri: process.env.AZURE_AD_REDIRECT_URI || process.env.MICROSOFT_REDIRECT_URI || 'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback'
};

const tenantRepository = new TenantRepository();
const userRepository = new UserRepository();

/**
 * GET /api/auth/microsoft/callback
 * OAuth2 callback endpoint - exchanges authorization code for access token
 */
router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: `No authorization code received`
      });
      return res.redirect(safeErrorUrl);
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
    );

    const { access_token } = tokenResponse.data;

    // Get user info from Microsoft Graph API
    const userInfoResponse = await axios.get(`https://graph.microsoft.com/v1.0/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const microsoftUser = userInfoResponse.data;
    const email = microsoftUser.mail || microsoftUser.userPrincipalName;

    // Get tenant_id - ALWAYS query database to ensure it exists
    let tenantId: string;

    if (state && state !== `1`) {
      // Validate that the provided tenant_id actually exists in database
      const tenant = await tenantRepository.getTenantById(state as string);

      if (tenant) {
        tenantId = tenant.id;
        console.log(`Using validated tenant_id from state parameter:`, tenantId);
      } else {
        // SECURITY FIX: Reject invalid tenant instead of falling back (CRIT-006)
        console.error('SECURITY: Invalid tenant_id in OAuth state:', state);
        const safeErrorUrl = buildSafeRedirectUrl('/login', {
          error: 'invalid_tenant',
          message: 'Organization not found or access denied'
        });
        return res.redirect(safeErrorUrl);
      }
    } else {
      // SECURITY FIX: Require explicit tenant selection (CRIT-006)
      console.error('SECURITY: No tenant_id provided in OAuth state');
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'tenant_required',
        message: 'Please select your organization before logging in'
      });
      return res.redirect(safeErrorUrl);
    }

    // Check if user exists in database
    let user = await userRepository.getUserByEmail(email);

    if (!user) {
      // Create new user if not found
      user = await userRepository.createUser(email, tenantId);
      console.log(`Created new user:`, user);
    } else {
      console.log(`Found existing user:`, user);
    }

    // SECURITY FIX: Remove weak fallback (CRIT-002)
    // Generate JWT token
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error('FATAL: JWT_SECRET must be set with at least 32 characters');
      throw new Error('Server configuration error: JWT_SECRET not properly configured');
    }
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: tenantId
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h'
      }
    );

    // Set JWT token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    // Log successful login
    createAuditLog({
      action: 'login',
      userId: user.id,
      tenantId: tenantId,
      details: `User ${user.email} logged in via Microsoft`
    });

    // Redirect to frontend
    const safeRedirectUrl = getValidatedFrontendUrl('/dashboard');
    res.redirect(safeRedirectUrl);
  } catch (error) {
    console.error('Error in Microsoft OAuth2 callback:', error);
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'auth_failed',
      message: 'An error occurred during authentication'
    });
    res.redirect(safeErrorUrl);
  }
});

export default router;