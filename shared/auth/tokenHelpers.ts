import { BadRequestError } from '@shared/core/errors';
import jwt from 'jsonwebtoken';

const generateToken = (payload: object, secret: string, expiresIn: string = '1h'): string => {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    logger.error(`Error generating token: ${error.message}`);
    throw new BadRequestError('Failed to generate token');
  }
};

const verifyToken = (token: string, secret: string): object => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error(`Error verifying token: ${error.message}`);
    throw new BadRequestError('Invalid token');
  }
};

export { generateToken, verifyToken };