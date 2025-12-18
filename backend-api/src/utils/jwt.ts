import jwt from 'jsonwebtoken';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET as string;
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

if (!JWT_SECRET) {
  logger.error('JWT_SECRET is not defined in environment variables');
  throw new Error('JWT_SECRET must be defined');
}

export interface JwtPayload {
  userId: string;
  email: string;
  name?: string;
  roles?: string[];
}

export const generateAccessToken = (user: JwtPayload): string => {
  return jwt.sign(
    {
      id: user.userId,
      email: user.email,
      name: user.name,
      roles: user.roles || ['user']
    },
    JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY } as jwt.SignOptions
  ) as string;
};

export const generateRefreshToken = (user: JwtPayload): string => {
  return jwt.sign(
    {
      id: user.userId,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRY } as jwt.SignOptions
  ) as string;
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.id,
      email: decoded.email,
      name: decoded.name,
      roles: decoded.roles
    };
  } catch (error) {
    logger.error('Token verification failed', { error });
    throw error;
  }
};
