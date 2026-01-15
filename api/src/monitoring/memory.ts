import { logger } from '../middleware/logger';

// Memory monitoring configuration
const MEMORY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const HIGH_MEMORY_THRESHOLD = 80; // 80% heap usage

// Initialize memory monitoring
export function initMemoryMonitoring() {
  logger.info('Initializing memory monitoring', {
    interval: `${MEMORY_CHECK_INTERVAL / 1000}s`,
    threshold: `${HIGH_MEMORY_THRESHOLD}%`
  });

  // Monitor heap usage periodically
  setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const percentUsed = Math.round((usage.heapUsed / usage.heapTotal) * 100);

    logger.debug('Memory usage snapshot', {
      heapUsedMB,
      heapTotalMB,
      percentUsed,
      rss: Math.round(usage.rss / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024)
    });

    // Alert on high memory usage
    if (percentUsed > HIGH_MEMORY_THRESHOLD) {
      logger.warn('High memory usage detected', {
        percentUsed,
        heapUsedMB,
        heapTotalMB,
        threshold: HIGH_MEMORY_THRESHOLD
      });

      // Send alert to Application Insights
      if (global.appInsights) {
        global.appInsights.defaultClient.trackEvent({
          name: 'High Memory Usage Alert',
          properties: {
            percentUsed: percentUsed.toString(),
            heapUsedMB: heapUsedMB.toString(),
            threshold: HIGH_MEMORY_THRESHOLD.toString()
          }
        });
      }
    }

    // Send metrics to Application Insights
    if (global.appInsights) {
      global.appInsights.defaultClient.trackMetric({
        name: 'Heap Memory Used (MB)',
        value: heapUsedMB
      });
      global.appInsights.defaultClient.trackMetric({
        name: 'Heap Memory Percent',
        value: percentUsed
      });
      global.appInsights.defaultClient.trackMetric({
        name: 'RSS Memory (MB)',
        value: Math.round(usage.rss / 1024 / 1024)
      });
    }
  }, MEMORY_CHECK_INTERVAL);

  // Monitor garbage collection (if available)
  if (global.gc) {
    logger.info('GC monitoring available');
  } else {
    logger.warn('GC monitoring not available (run with --expose-gc)');
  }
}

// Force garbage collection (for debugging)
export function forceGC() {
  if (global.gc) {
    logger.info('Forcing garbage collection');
    global.gc();
  } else {
    logger.warn('Cannot force GC (run with --expose-gc)');
  }
}

// Get current memory stats
export function getMemoryStats() {
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    percentUsed: Math.round((usage.heapUsed / usage.heapTotal) * 100),
    rss: Math.round(usage.rss / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024)
  };
}
