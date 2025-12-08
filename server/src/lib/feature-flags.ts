import { cache } from './cache';
import { pool } from './database';

import express, { Request, Response, NextFunction } from 'express';

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
    const cached = await cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
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
      await cache.setex(cacheKey, 300, 'false');
      return false;
    }

    // Check tenant whitelist
    if (flag.tenant_whitelist.includes(tenantId)) {
      await cache.setex(cacheKey, 300, 'true');
      return true;
    }

    // Check user whitelist
    if (userId && flag.user_whitelist.includes(userId)) {
      await cache.setex(cacheKey, 300, 'true');
      return true;
    }

    // Check rollout percentage
    const hash = this.hashUser(tenantId, userId);
    const enabled = hash < flag.rollout_percentage;

    await cache.setex(cacheKey, 300, enabled ? 'true' : 'false');
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
    userId?: number,
    defaultValue: T
  ): Promise<T> {
    const enabled = await this.isEnabled(flagId, tenantId, userId);
    if (!enabled) return defaultValue;

    const result = await pool.query(
      `SELECT value FROM feature_flags WHERE id = $1`,
      [flagId]
    );

    return result.rows[0]?.value as T || defaultValue;
  }

  async updateFlag(
    flagId: string,
    updates: Partial<FeatureFlag>
  ): Promise<void> {
    const { enabled, rollout_percentage, tenant_whitelist, user_whitelist, value } = updates;
    await pool.query(
      `UPDATE feature_flags SET enabled = $1, rollout_percentage = $2, tenant_whitelist = $3, user_whitelist = $4, value = $5 WHERE id = $6`,
      [enabled, rollout_percentage, tenant_whitelist, user_whitelist, value, flagId]
    );
    // Invalidate cache
    await cache.del(`feature_flag:${flagId}`);
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
  req.tenantId = tenantId;
  next();
}

// Express route example for admin API
import express from 'express';
const app = express();

app.use(express.json());
app.use(tenantMiddleware);

app.post('/admin/feature-flags/:id', async (req, res) => {
  const flagId = req.params.id;
  const updates = req.body as Partial<FeatureFlag>;

  try {
    await featureFlags.updateFlag(flagId, updates);
    res.status(200).send('Feature flag updated successfully');
  } catch (error) {
    res.status(500).send('Error updating feature flag');
  }
});

// Frontend hook for flag checks
import { useContext, useEffect, useState } from 'react';

import { FeatureFlagContext } from './FeatureFlagContext';

export function useFeatureFlag(flagId: string, defaultValue: boolean): boolean {
  const { tenantId, userId } = useContext(FeatureFlagContext);
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultValue);

  useEffect(() => {
    async function checkFlag() {
      const enabled = await featureFlags.isEnabled(flagId, tenantId, userId);
      setIsEnabled(enabled);
    }
    checkFlag();
  }, [flagId, tenantId, userId]);

  return isEnabled;
}