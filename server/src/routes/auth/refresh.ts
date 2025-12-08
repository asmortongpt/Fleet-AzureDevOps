import express, { Request, Response, NextFunction } from 'express';

import { User } from '../../models/user';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../services/authService';
import { getLogger } from '../../utils/logger';

const router = express.Router();
const logger = getLogger('auth-refresh');

// Ensure TypeScript strict mode is enabled in tsconfig.json

// FedRAMP Compliance Note: Ensure all logs do not contain sensitive user information.

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      logger.warn('Refresh token not provided');
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify the refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      logger.warn('Invalid refresh token');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`User not found for ID: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access and refresh tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    // FedRAMP Compliance Note: Ensure tokens are securely stored and transmitted.
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

    logger.info(`Tokens refreshed for user ID: ${userId}`);
  } catch (error) {
    logger.error('Error refreshing token', error);
    // FedRAMP Compliance Note: Ensure error messages do not expose sensitive information.
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;