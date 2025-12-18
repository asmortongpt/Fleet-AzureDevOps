import { Router, Request, Response } from 'express';
import * as msal from '@azure/msal-node';
import { pca, REDIRECT_URI } from '../config/azureAD';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../utils/jwt';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';
import { authLimiter } from '../middleware/security';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Initiate Azure AD login
router.get('/login', (req: Request, res: Response) => {
  const authCodeUrlParameters: msal.AuthorizationUrlRequest = {
    scopes: ['user.read', 'openid', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
    responseMode: msal.ResponseMode.QUERY,
  };

  pca
    .getAuthCodeUrl(authCodeUrlParameters)
    .then((response) => {
      logger.info('Auth URL generated successfully');
      res.redirect(response);
    })
    .catch((error) => {
      logger.error('Failed to generate auth URL', { error });
      res.status(500).json({ error: 'Failed to initiate login' });
    });
});

// Handle Azure AD callback
router.get('/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    logger.error('Azure AD auth error', { error, description: req.query.error_description });
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    logger.error('No authorization code received');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    const tokenRequest: msal.AuthorizationCodeRequest = {
      code,
      scopes: ['user.read', 'openid', 'profile', 'email'],
      redirectUri: REDIRECT_URI,
    };

    const response = await pca.acquireTokenByCode(tokenRequest);

    if (!response.account) {
      throw new Error('No account information in token response');
    }

    const userInfo = response.account;
    const payload = {
      userId: userInfo.homeAccountId,
      email: userInfo.username,
      name: userInfo.name,
      roles: ['user'], // Extend this based on Azure AD group claims
    };

    // Generate JWT tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis with 7-day expiry
    await redisClient.setex(
      `refresh:${payload.userId}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    // Store user session in Redis
    await redisClient.setex(
      `session:${payload.userId}`,
      24 * 60 * 60,
      JSON.stringify(payload)
    );

    // Set HTTP-only cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info('User authenticated successfully', { userId: payload.userId, email: payload.email });

    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    logger.error('Token exchange failed', { error });
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
});

// Refresh token endpoint
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = verifyToken(refreshToken);
    const storedToken = await redisClient.get(`refresh:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      logger.warn('Invalid refresh token attempt', { userId: decoded.userId });
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded);

    // Set new cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      domain: process.env.COOKIE_DOMAIN,
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    logger.info('Token refreshed successfully', { userId: decoded.userId });
    res.json({ success: true });
  } catch (error) {
    logger.error('Token refresh failed', { error });
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout endpoint
router.post('/logout', async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken;
  const refreshToken = req.cookies?.refreshToken;

  try {
    if (accessToken) {
      const decoded = verifyToken(accessToken);

      // Blacklist the access token
      await redisClient.setex(
        `blacklist:${accessToken}`,
        15 * 60, // 15 minutes (match token expiry)
        'true'
      );

      // Remove refresh token and session
      await redisClient.del(`refresh:${decoded.userId}`);
      await redisClient.del(`session:${decoded.userId}`);

      logger.info('User logged out successfully', { userId: decoded.userId });
    }

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user info
router.get('/me', async (req: Request, res: Response) => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = verifyToken(accessToken);

    // Check if session exists
    const session = await redisClient.get(`session:${decoded.userId}`);
    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    res.json({
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles,
    });
  } catch (error) {
    logger.error('Failed to get user info', { error });
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
