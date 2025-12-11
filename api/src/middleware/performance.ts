import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// Performance monitoring middleware
export function performanceMonitoring(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Add X-Response-Time header
    res.setHeader('X-Response-Time', `${duration}ms`);

    // Log slow requests (>1000ms threshold)
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        method: req.method,
        path: req.path,
        duration,
        threshold: 1000,
        status: res.statusCode
      });
    }

    // Send metrics to Application Insights if available
    if (global.appInsights) {
      global.appInsights.defaultClient.trackMetric({
        name: 'API Response Time',
        value: duration,
        properties: {
          method: req.method,
          path: req.path,
          status: res.statusCode.toString()
        }
      });
    }

    // Track request count
    if (global.appInsights) {
      global.appInsights.defaultClient.trackMetric({
        name: 'API Request Count',
        value: 1,
        properties: {
          method: req.method,
          path: req.path,
          status: res.statusCode.toString()
        }
      });
    }
  });

  next();
}

// Memory usage tracking
export function trackMemoryUsage() {
  const usage = process.memoryUsage();
  const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  logger.debug('Memory usage', {
    heapUsedMB,
    heapTotalMB,
    percentUsed,
    rss: Math.round(usage.rss / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024)
  });

  // Send to Application Insights
  if (global.appInsights) {
    global.appInsights.defaultClient.trackMetric({
      name: 'Heap Memory Used (MB)',
      value: heapUsedMB
    });
    global.appInsights.defaultClient.trackMetric({
      name: 'Heap Memory Percent',
      value: percentUsed
    });
  }

  // Warn if memory usage is high
  if (percentUsed > 80) {
    logger.warn('High memory usage detected', {
      percentUsed,
      heapUsedMB,
      heapTotalMB
    });
  }
}
