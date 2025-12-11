import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createAuditLog } from '../middleware/audit';
import { getValidatedFrontendUrl, buildSafeRedirectUrl } from '../utils/redirect-validator';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';

// Import necessary repositories
import { TenantRepository } from '../repositories/tenant.repository';
import { UserRepository } from '../repositories/user.repository';
import { MicrosoftAuthRepository } from '../repositories/microsoft-auth.repository';

const router = express.Router();

const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || '80fe6628-1dc4-41fe-894f-919b12ecc994',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
  redirectUri:
    process.env.AZURE_AD_REDIRECT_URI ||
    'https://fleet.capitaltechalliance.com/api/auth/microsoft/callback',
};

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

router.get('/microsoft/callback', async (req: Request, res: Response) => {
  try {
    const queryResult = callbackQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: `Invalid query parameters`,
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
        scope: 'openid profile email User.Read',
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    const userInfoResponse = await axios.get(`https://graph.microsoft.com/v1.0/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const microsoftUser = userInfoResponse.data;
    const email = microsoftUser.mail || microsoftUser.userPrincipalName;

    let tenantId: string;

    if (state && state !== `1`) {
      const tenantRepository = container.resolve(TenantRepository);
      const tenant = await tenantRepository.getTenantById(state);

      if (tenant) {
        tenantId = tenant.id;
        console.log(`Using validated tenant_id from state parameter:`, tenantId);
      } else {
        const safeErrorUrl = buildSafeRedirectUrl('/login', {
          error: 'auth_failed',
          message: `Invalid tenant ID`,
        });
        return res.redirect(safeErrorUrl);
      }
    } else {
      const safeErrorUrl = buildSafeRedirectUrl('/login', {
        error: 'auth_failed',
        message: `Tenant ID not provided`,
      });
      return res.redirect(safeErrorUrl);
    }

    // Check if user exists
    const userRepository = container.resolve(UserRepository);
    let user = await userRepository.getUserByEmailAndTenantId(email, tenantId);

    if (!user) {
      // Create new user
      user = await userRepository.createUser({
        email: email,
        tenantId: tenantId,
        // Add other necessary user fields
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, tenantId: tenantId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Log successful login
    const microsoftAuthRepository = container.resolve(MicrosoftAuthRepository);
    await microsoftAuthRepository.logMicrosoftLogin(user.id, tenantId);

    // Set JWT token as cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000, // 1 hour
    });

    res.redirect(getValidatedFrontendUrl('/dashboard'));
  } catch (error) {
    console.error('Microsoft OAuth callback error:', error);
    const safeErrorUrl = buildSafeRedirectUrl('/login', {
      error: 'server_error',
      message: `Internal server error`,
    });
    return res.redirect(safeErrorUrl);
  }
});

export default router;


Note: The following repository methods were assumed to exist or were created as inline wrappers. These should be moved to their respective repository files later:

1. `TenantRepository.getTenantById(id: string): Promise<{ id: string } | null>`
2. `UserRepository.getUserByEmailAndTenantId(email: string, tenantId: string): Promise<User | null>`
3. `UserRepository.createUser(userData: { email: string, tenantId: string, ... }): Promise<User>`
4. `MicrosoftAuthRepository.logMicrosoftLogin(userId: string, tenantId: string): Promise<void>`

These methods should be implemented in their respective repository files to complete the refactoring process.