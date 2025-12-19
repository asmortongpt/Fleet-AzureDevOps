import memwatch from 'memwatch-next';

import { createLogger } from '../utils/logger';

const logger = createLogger('MemoryMonitor');

// Existing code (if any) would be here...

// Memory leak detection and heap statistics monitoring
memwatch.on('leak', (info) => {
  logger.error('Memory leak detected', info);
  if (global.appInsights) {
    global.appInsights.defaultClient.trackEvent({
      name: 'Memory Leak Detected',
      properties: info
    });
  }
});

memwatch.on('stats', (stats) => {
  logger.debug('Heap statistics', stats);
});