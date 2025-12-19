import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import redisClient from '../config/redis';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name?: string;
        roles?: string[];
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    res.status(401).json({ error: 'No access token provided' });
    return;
  }

  try {
    const decoded = verifyToken(accessToken);

    // Check if token is blacklisted (for logout)
    const isBlacklisted = await redisClient.get(`blacklist:${accessToken}`);
    if (isBlacklisted) {
      res.status(401).json({ error: 'Token has been invalidated' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    logger.error('Token authentication failed', { error: err });
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
};

export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoles = req.user.roles || [];
    if (!userRoles.includes(requiredRole) && !userRoles.includes('admin')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};
