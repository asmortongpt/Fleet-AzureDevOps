import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { config } from '../services/config';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { microsoftAuth } from '../services/microsoft-auth';
import { JWTPayload } from '../types';

const router = Router();

/**
 * POST /api/v1/auth/microsoft/login
 * Generate Microsoft OAuth authorization URL
 */
router.post('/microsoft/login', asyncHandler(async (_req: Request, res: Response) => {
  const state = Math.random().toString(36).substring(2, 15);
  const authUrl = microsoftAuth.getAuthorizationUrl(state);

  logger.info('Generated Microsoft OAuth URL');

  res.json({
    authUrl,
    state,
  });
}));

/**
 * GET /api/v1/auth/microsoft/callback
 * Handle Microsoft OAuth callback
 */
router.get('/microsoft/callback', asyncHandler(async (req: Request, res: Response) => {
  const { code, error, error_description } = req.query;

  // Check for OAuth errors
  if (error) {
    logger.error('OAuth callback error', { error, error_description });
    return res.redirect(`${config.frontendUrl}?error=${error}`);
  }

  if (!code || typeof code !== 'string') {
    logger.error('No authorization code in callback');
    return res.redirect(`${config.frontendUrl}?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await microsoftAuth.exchangeCodeForToken(code);

    // Get user profile from Microsoft Graph
    const profile = await microsoftAuth.getUserProfile(tokenResponse.access_token);

    // Determine email from profile
    const email = profile.mail || profile.userPrincipalName;
    if (!email) {
      throw new Error('No email found in user profile');
    }

    // Validate user domain
    if (!microsoftAuth.validateUserDomain(email)) {
      logger.warn('User from unauthorized domain attempted login', { email });
      return res.redirect(`${config.frontendUrl}?error=unauthorized_domain`);
    }

    // Find or create user
    let user = await db.findUserByMicrosoftId(profile.id);

    if (!user) {
      // Check if user exists with same email
      user = await db.findUserByEmail(email);

      if (user) {
        // Update existing user with Microsoft ID
        user = await db.updateUser(user.id, {
          microsoft_id: profile.id,
          display_name: profile.displayName,
        } as any);
        logger.info('Updated existing user with Microsoft ID', { userId: user.id, email });
      } else {
        // Create new user
        user = await db.createUser(email, profile.id, profile.displayName);
        logger.info('Created new user', { userId: user.id, email });
      }
    } else {
      // Update display name if changed
      if (user.display_name !== profile.displayName) {
        user = await db.updateUser(user.id, {
          display_name: profile.displayName,
        } as any);
      }
    }

    // Generate JWT token
    const jwtPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtToken = jwt.sign(jwtPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string | number,
    } as jwt.SignOptions);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Create session in database
    await db.createSession(user.id, jwtToken, expiresAt);

    logger.info('User logged in successfully', { userId: user.id, email });

    // Redirect to frontend with token
    res.redirect(`${config.frontendUrl}?token=${jwtToken}`);
  } catch (error) {
    logger.error('OAuth callback processing error', {
      error: error instanceof Error ? error.message : error,
    });
    res.redirect(`${config.frontendUrl}?error=auth_failed`);
  }
}));

/**
 * POST /api/v1/auth/logout
 * Invalidate user session
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    await db.deleteSession(token);
    logger.info('User logged out', { userId: req.user?.id });
  }

  res.json({ message: 'Logged out successfully' });
}));

/**
 * GET /api/v1/auth/verify
 * Verify JWT token and return user info
 */
router.get('/verify', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.display_name,
      role: req.user.role,
      tenantId: req.user.tenant_id,
    },
  });
}));

export default router;
