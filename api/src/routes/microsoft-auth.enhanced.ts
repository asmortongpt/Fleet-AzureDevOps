import express, { Request, Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { createAuditLog } from '../middleware/audit';
import { getValidatedFrontendUrl, buildSafeRedirectUrl } from '../utils/redirect-validator';
import { z } from 'zod';

const router = express.Router();

const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || '80fe6628-1dc4-41fe-894f-919b12ecc994',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
  redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback'
};

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional()
});

router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const queryResult = callbackQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: `Invalid query parameters`
      });
      return res.redirect(safeErrorUrl);
    }

    const { code, state } = queryResult.data;

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

    const userInfoResponse = await axios.get(`https://graph.microsoft.com/v1.0/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const microsoftUser = userInfoResponse.data;
    const email = microsoftUser.mail || microsoftUser.userPrincipalName;

    let tenantId: string;

    if (state && state !== `1`) {
      const tenantCheckResult = await pool.query(
        `SELECT id FROM tenants WHERE id = $1`,
        [state]
      );

      if (tenantCheckResult.rows.length > 0) {
        tenantId = tenantCheckResult.rows[0].id;
        console.log(`Using validated tenant_id from state parameter:`, tenantId);
      } else {
        const safeErrorUrl = buildSafeRedirectUrl('/login', {
          error: 'auth_failed',
          message: `Invalid tenant ID`
        });
        return res.redirect(safeErrorUrl);
      }
    } else {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: `Tenant ID not provided`
      });
      return res.redirect(safeErrorUrl);
    }

    // Additional security, error handling, and user management logic here
    // ...

    res.redirect(getValidatedFrontendUrl('/dashboard'));
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'server_error',
      message: `Internal server error`
    });
    return res.redirect(safeErrorUrl);
  }
});

export default router;