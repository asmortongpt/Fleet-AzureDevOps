import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { pool } from '../lib/database';
import { logger } from '../lib/logger';

interface User {
  id: string;
  tenantId: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    dbClient?: any;
  }
}

export async function tenantIsolation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn('Authorization header missing');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authorization header is required'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      logger.warn('JWT token missing');
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'JWT token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as User;
    const tenantId = decoded.tenantId;

    if (!tenantId) {
      logger.warn('Missing tenant_id in JWT', { userId: decoded.id });
      return res.status(403).json({
        error: 'Tenant isolation violation',
        message: 'No tenant context found'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('SET LOCAL app.current_tenant = $1', [tenantId]);
      req.dbClient = client;
      req.user = decoded;

      Logger.debug('Tenant context set', { tenantId, userId: decoded.id });
      next();
    } catch (error) {
      client.release();
      throw error;
    }
  } catch (error) {
    logger.error('Tenant isolation error', { error });
    res.status(500).json({
      error: 'Tenant isolation failed',
      message: 'Unable to establish tenant context'
    });
  }
}

export function tenantCleanup(req: Request, res: Response, next: NextFunction) {
  res.on('finish', () => {
    if (req.dbClient) {
      req.dbClient.release();
    }
  });
  next();
}