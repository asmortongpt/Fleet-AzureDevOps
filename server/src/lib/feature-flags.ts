import { redis } from './cache';
import { pool } from './database';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userId?: string;
    }
  }
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  tenant_whitelist: number[];
  user_whitelist: number[];
  value?: boolean | string | number | Record<string, unknown>;
}

export class FeatureFlagService {
  async isEnabled(
    flagId: string,
    tenantId: number,
    userId?: number
  ): Promise<boolean> {
    const cacheKey = `feature_flag:${flagId}:${tenantId}`;

    // Check cache first
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached !== null) {
        return cached === 'true';
      }
    }

    // Fetch from database
    const result = await pool.query(
      `SELECT * FROM feature_flags WHERE id = $1`,
      [flagId]
    );

    if (result.rows.length === 0) {
      return false; // Flag doesn't exist
    }

    const flag: FeatureFlag = result.rows[0];

    // Check if globally disabled
    if (!flag.enabled) {
      if (redis) await redis.setex(cacheKey, 300, 'false');
      return false;
    }

    // Check tenant whitelist
    if (flag.tenant_whitelist.includes(tenantId)) {
      if (redis) await redis.setex(cacheKey, 300, 'true');
      return true;
    }

    // Check user whitelist
    if (userId && flag.user_whitelist.includes(userId)) {
      if (redis) await redis.setex(cacheKey, 300, 'true');
      return true;
    }

    // Check rollout percentage
    const hash = this.hashUser(tenantId, userId);
    const enabled = hash < flag.rollout_percentage;

    if (redis) await redis.setex(cacheKey, 300, enabled ? 'true' : 'false');
    return enabled;
  }

  private hashUser(tenantId: number, userId?: number): number {
    // Simple hash to deterministic 0-100 range
    const id = userId || tenantId;
    return (id * 31) % 100;
  }

  async getFlagValue<T>(
    flagId: string,
    tenantId: number,
    defaultValue: T,
    userId?: number
  ): Promise<T> {
    const enabled = await this.isEnabled(flagId, tenantId, userId);
    if (!enabled) return defaultValue;

    if (!pool) return defaultValue;

    const result = await pool.query(
      `SELECT value FROM feature_flags WHERE id = $1`,
      [flagId]
    );

    return (result.rows[0]?.value as T) || defaultValue;
  }

  async updateFlag(
    flagId: string,
    updates: Partial<FeatureFlag>
  ): Promise<void> {
    const { enabled, rollout_percentage, tenant_whitelist, user_whitelist, value } = updates;
    if (!pool) return;

    await pool.query(
      `UPDATE feature_flags SET enabled = $1, rollout_percentage = $2, tenant_whitelist = $3, user_whitelist = $4, value = $5 WHERE id = $6`,
      [enabled, rollout_percentage, tenant_whitelist, user_whitelist, value, flagId]
    );
    // Invalidate cache
    if (redis) {
      const keys = await redis.keys(`feature_flag:${flagId}:*`);
      if (keys.length > 0) await redis.del(...keys);
    }
  }
}

export const featureFlags = new FeatureFlagService();

// Middleware for multi-tenant isolation
export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantId = parseInt(req.headers['x-tenant-id'] as string, 10);
  if (isNaN(tenantId)) {
    res.status(400).send('Invalid tenant ID');
    return;
  }
  req.tenantId = String(tenantId);
  next();
}

// Admin route handler for updating feature flags
export async function updateFeatureFlagHandler(req: Request, res: Response): Promise<void> {
  const flagId = req.params.id;
  const updates = req.body as Partial<FeatureFlag>;

  try {
    await featureFlags.updateFlag(flagId, updates);
    res.status(200).send('Feature flag updated successfully');
  } catch (error) {
    res.status(500).send('Error updating feature flag');
  }
}