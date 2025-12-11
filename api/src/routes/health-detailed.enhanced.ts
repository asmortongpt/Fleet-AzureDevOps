Here's the complete refactored version of the `health-detailed.enhanced.ts` file, replacing all `pool.query` and `db.query` calls with repository methods:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import os from 'os';
import redis from 'redis';
import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csurf from 'csurf';
import { z } from 'zod';
import { checkDiskSpace } from 'check-disk-space';
import { AzureMonitor } from './AzureMonitor';
import { RedisClientType } from 'redis';
import { csrfProtection } from '../middleware/csrf';

// Import repositories
import { DatabaseRepository } from '../repositories/DatabaseRepository';
import { CacheRepository } from '../repositories/CacheRepository';

const router = express.Router();
const execAsync = promisify(require('child_process').exec);

// Initialize repositories
const databaseRepository: DatabaseRepository = container.resolve('DatabaseRepository');
const cacheRepository: CacheRepository = container.resolve('CacheRepository');

router.use(helmet());
router.use(express.json());
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  })
);
router.use(csurf());

const requireAdmin = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const publicKey = process.env.PUBLIC_KEY || '';
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

    const userSchema = z.object({
      role: z.string(),
    });

    const userInfo = userSchema.parse(decoded);
    if (userInfo.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }

    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired token',
    });
  }
};

router.get('/health', requireAdmin, async (req: Request, res: Response) => {
  const healthCheck = await performHealthCheck();
  res.json(healthCheck);
});

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    [key: string]: ComponentHealth;
  };
  summary: {
    healthy: number;
    degraded: number;
    critical: number;
    total: number;
  };
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  latency?: number;
}

async function performHealthCheck(): Promise<SystemHealth> {
  const databaseHealth = await checkDatabase();
  const azureAdHealth = await AzureMonitor.checkAzureAD();
  const applicationInsightsHealth = await AzureMonitor.checkApplicationInsights();
  const cacheHealth = await checkCache();
  const diskHealth = await checkDisk();
  const memoryHealth = checkMemory();
  const apiPerformanceHealth = await checkApiPerformance();

  const components = {
    database: databaseHealth,
    azureAd: azureAdHealth,
    applicationInsights: applicationInsightsHealth,
    cache: cacheHealth,
    disk: diskHealth,
    memory: memoryHealth,
    apiPerformance: apiPerformanceHealth,
  };

  const summary = Object.values(components).reduce(
    (acc, component) => {
      acc[component.status]++;
      acc.total++;
      return acc;
    },
    { healthy: 0, degraded: 0, critical: 0, total: 0 }
  );

  return {
    status: determineOverallStatus(summary),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.VERSION || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    components,
    summary,
  };
}

function determineOverallStatus(summary: {
  healthy: number;
  degraded: number;
  critical: number;
  total: number;
}): 'healthy' | 'degraded' | 'critical' {
  if (summary.critical > 0) return 'critical';
  if (summary.degraded > 0) return 'degraded';
  return 'healthy';
}

async function checkDatabase(): Promise<ComponentHealth> {
  try {
    const startTime = Date.now();
    const result = await databaseRepository.checkConnection();
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (result) {
      return {
        status: 'healthy',
        message: 'Database connection successful',
        latency,
      };
    } else {
      return {
        status: 'critical',
        message: 'Database connection failed',
        latency,
      };
    }
  } catch (error) {
    return {
      status: 'critical',
      message: `Database check failed: ${(error as Error).message}`,
    };
  }
}

async function checkCache(): Promise<ComponentHealth> {
  try {
    const startTime = Date.now();
    const result = await cacheRepository.checkConnection();
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (result) {
      return {
        status: 'healthy',
        message: 'Cache connection successful',
        latency,
      };
    } else {
      return {
        status: 'degraded',
        message: 'Cache connection failed',
        latency,
      };
    }
  } catch (error) {
    return {
      status: 'degraded',
        message: `Cache check failed: ${(error as Error).message}`,
    };
  }
}

async function checkDisk(): Promise<ComponentHealth> {
  try {
    const diskSpace = await checkDiskSpace('/');
    const freeSpacePercentage = (diskSpace.free / diskSpace.size) * 100;

    if (freeSpacePercentage < 10) {
      return {
        status: 'critical',
        message: `Disk space critical: ${freeSpacePercentage.toFixed(2)}% free`,
      };
    } else if (freeSpacePercentage < 20) {
      return {
        status: 'degraded',
        message: `Disk space low: ${freeSpacePercentage.toFixed(2)}% free`,
      };
    } else {
      return {
        status: 'healthy',
        message: `Disk space healthy: ${freeSpacePercentage.toFixed(2)}% free`,
      };
    }
  } catch (error) {
    return {
      status: 'critical',
      message: `Disk check failed: ${(error as Error).message}`,
    };
  }
}

function checkMemory(): ComponentHealth {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemoryPercentage = ((totalMemory - freeMemory) / totalMemory) * 100;

  if (usedMemoryPercentage > 90) {
    return {
      status: 'critical',
      message: `Memory usage critical: ${usedMemoryPercentage.toFixed(2)}% used`,
    };
  } else if (usedMemoryPercentage > 80) {
    return {
      status: 'degraded',
      message: `Memory usage high: ${usedMemoryPercentage.toFixed(2)}% used`,
    };
  } else {
    return {
      status: 'healthy',
      message: `Memory usage normal: ${usedMemoryPercentage.toFixed(2)}% used`,
    };
  }
}

async function checkApiPerformance(): Promise<ComponentHealth> {
  try {
    const startTime = Date.now();
    await execAsync('curl -s -o /dev/null -w "%{http_code} %{time_total}" https://api.example.com/health');
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (latency < 500) {
      return {
        status: 'healthy',
        message: 'API performance is good',
        latency,
      };
    } else if (latency < 1000) {
      return {
        status: 'degraded',
        message: 'API performance is slow',
        latency,
      };
    } else {
      return {
        status: 'critical',
        message: 'API performance is very slow',
        latency,
      };
    }
  } catch (error) {
    return {
      status: 'critical',
      message: `API performance check failed: ${(error as Error).message}`,
    };
  }
}

export default router;


In this refactored version, I've made the following changes:

1. Imported the `DatabaseRepository` and `CacheRepository` from their respective files.
2. Initialized the repositories using the dependency injection container.
3. Replaced the `pool.query` and `db.query` calls in the `checkDatabase` and `checkCache` functions with calls to the respective repository methods:
   - `databaseRepository.checkConnection()` replaces the database query.
   - `cacheRepository.checkConnection()` replaces the cache query.

These changes implement the repository pattern, abstracting the database and cache operations into separate classes. This improves the code's maintainability, testability, and allows for easier switching between different database or cache systems in the future.