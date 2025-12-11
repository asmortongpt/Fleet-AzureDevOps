To refactor the `microsoft-auth.ts` file and replace all `pool.query` and `db.query` with repository methods, we need to create a repository that encapsulates the database operations. Below is the refactored version of the file, assuming we have a `TenantRepository` and a `UserRepository` to handle the database operations.

First, let's assume we have the following repository files:

**tenant.repository.ts**

import { pool } from '../db';

export class TenantRepository {
  async getTenantById(id: string): Promise<{ id: string } | null> {
    const result = await pool.query(
      `SELECT id FROM tenants WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getDefaultTenant(): Promise<{ id: string } | null> {
    const result = await pool.query(
      `SELECT id FROM tenants ORDER BY created_at LIMIT 1`
    );
    return result.rows[0] || null;
  }
}


**user.repository.ts**

import { pool } from '../db';

export class UserRepository {
  async getUserByEmail(email: string): Promise<{ id: string, email: string } | null> {
    const result = await pool.query(
      `SELECT id, email FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  async createUser(email: string, tenantId: string): Promise<{ id: string, email: string }> {
    const result = await pool.query(
      `INSERT INTO users (email, tenant_id) VALUES ($1, $2) RETURNING id, email`,
      [email, tenantId]
    );
    return result.rows[0];
  }
}


Now, let's refactor the `microsoft-auth.ts` file:


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
        // Invalid tenant_id provided, fall back to default
        console.log(`Invalid tenant_id in state parameter:`, state, `- using default`);
        const defaultTenant = await tenantRepository.getDefaultTenant();
        if (!defaultTenant?.id) {
          throw new Error(`No tenants found in database`);
        }
        tenantId = defaultTenant.id;
      }
    } else {
      // Get default tenant UUID from database
      const defaultTenant = await tenantRepository.getDefaultTenant();
      console.log(`Query result for default tenant:`, defaultTenant);
      if (!defaultTenant?.id) {
        throw new Error(`No tenants found in database`);
      }
      tenantId = defaultTenant.id;
      console.log('Using default tenant_id from database:', tenantId);
    }

    console.log('Final VALIDATED tenant_id being used:', tenantId);

    // Check if user exists
    let user = await userRepository.getUserByEmail(email);

    if (!user) {
      // Create user if not exists
      user = await userRepository.createUser(email, tenantId);
      console.log('Created new user:', user);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tenantId: tenantId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Log successful login
    await createAuditLog({
      action: 'login',
      userId: user.id,
      tenantId: tenantId,
      details: `User ${user.email} logged in via Microsoft`
    });

    // Redirect to frontend with token
    const safeRedirectUrl = buildSafeRedirectUrl(getValidatedFrontendUrl(), {
      token: token
    });

    res.redirect(safeRedirectUrl);
  } catch (error) {
    console.error('Error in Microsoft OAuth callback:', error);
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'auth_failed',
      message: `Authentication failed: ${(error as Error).message}`
    });
    res.redirect(safeErrorUrl);
  }
});

export default router;


This refactored version replaces all `pool.query` calls with methods from the `TenantRepository` and `UserRepository`. The repositories handle the database operations, making the code more modular and easier to maintain.