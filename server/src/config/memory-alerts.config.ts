// Import necessary modules and types
import { exec } from 'child_process';

// import { datadogRum } from '@datadog/browser-rum'; // Browser-only, not for Node.js
import * as Sentry from '@sentry/node';
// import memwatch from 'memwatch-next'; // Package not available

import { logger } from '../utils/logger';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Note: Datadog RUM is for browser environments only
// For backend monitoring, use @datadog/dd-trace instead
// datadogRum.init(...) - commented out as it's not compatible with Node.js

// Configurable thresholds
const MEMORY_GROWTH_THRESHOLD = parseFloat(process.env.MEMORY_GROWTH_THRESHOLD!) || 1.5;
const HEAP_DIFF_THRESHOLD = parseFloat(process.env.HEAP_DIFF_THRESHOLD!) || 1024 * 1024 * 10; // 10 MB

// FedRAMP compliance notes: Ensure all data handling complies with FedRAMP standards.

// Function to generate heap snapshot
function generateHeapSnapshot(): void {
  exec('node --inspect-brk -e "require(\'v8\').writeHeapSnapshot()"', (error, stdout, stderr) => {
    if (error) {
      console.error(`Heap snapshot error: ${stderr}`);
      Sentry.captureException(error);
    } else {
      console.log(`Heap snapshot generated: ${stdout}`);
    }
  });
}

// Monitor memory usage using Node.js built-in process.memoryUsage()
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

  logger.info('Memory usage', {
    heapUsed: `${heapUsedMB.toFixed(2)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`,
  });

  // Check if heap usage exceeds threshold
  if (heapUsedMB > 500) { // 500 MB threshold
    logger.warn('High memory usage detected', { heapUsedMB });
    Sentry.captureMessage('High memory usage detected', {
      level: 'warning',
      extra: { heapUsedMB, memUsage },
    });

    // Generate heap snapshot if memory is critically high
    if (heapUsedMB > 1000) { // 1 GB critical threshold
      generateHeapSnapshot();
    }
  }
}, 60000); // Check every minute

// Ensure non-blocking monitoring
process.nextTick(() => {
  logger.info('Memory monitoring initialized');
});