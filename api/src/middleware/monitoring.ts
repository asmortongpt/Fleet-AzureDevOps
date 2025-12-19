import { performance } from 'perf_hooks';

import { Request, Response, NextFunction } from 'express';

import { sanitizeForLog } from '../utils/logSanitizer';

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: Date;
}

const metrics: RequestMetrics[] = [];

export function monitorRequests(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();

  res.on('finish', () => {
    const duration = performance.now() - start;

    metrics.push({
      path: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date()
    });

    // Keep only last 1000 requests
    if (metrics.length > 1000) {
      metrics.shift();
    }

    // Log slow requests
    // SECURITY FIX (P0): Sanitize request details to prevent log injection (CWE-117)
    // Fingerprint: e3f7a9b2c6d4e8f1
    if (duration > 1000) {
      console.warn('Slow request detected', {
        method: req.method,
        path: sanitizeForLog(req.path, 100),
        duration: duration.toFixed(2) + 'ms'
      });
    }
  });

  next();
}

export function getMetrics(): RequestMetrics[] {
  return metrics;
}

export function getAverageResponseTime(): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
  return sum / metrics.length;
}
