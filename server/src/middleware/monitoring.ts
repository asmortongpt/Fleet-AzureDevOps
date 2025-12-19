import { Request, Response, NextFunction } from 'express';

interface RequestMetric {
  path: string;
  method: string;
  timestamp: number;
  duration?: number;
  statusCode?: number;
}

const metrics: RequestMetric[] = [];
const MAX_METRICS = 1000;

export function monitorRequests(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();

  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;

    const metric: RequestMetric = {
      path: req.path,
      method: req.method,
      timestamp: startTime,
      duration,
      statusCode: res.statusCode
    };

    metrics.push(metric);

    // Keep only last MAX_METRICS entries
    if (metrics.length > MAX_METRICS) {
      metrics.shift();
    }

    return originalSend.call(this, data);
  };

  next();
}

export function getMetrics(): RequestMetric[] {
  return metrics;
}

export function getAverageResponseTime(): number {
  if (metrics.length === 0) return 0;

  const validMetrics = metrics.filter(m => m.duration !== undefined);
  if (validMetrics.length === 0) return 0;

  const total = validMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
  return total / validMetrics.length;
}
