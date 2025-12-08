import * as fs from 'fs';
import * as path from 'path';

import { datadogRum } from '@datadog/browser-rum';
import * as Sentry from '@sentry/node';
import * as heapdump from 'heapdump';
import * as memwatch from 'memwatch-next';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Initialize Datadog RUM
datadogRum.init({
  applicationId: process.env.DATADOG_APP_ID,
  clientToken: process.env.DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'your-service-name',
  version: '1.0.0',
  sampleRate: 100,
  trackInteractions: true,
});

// Configuration
const LEAK_THRESHOLD = parseInt(process.env.LEAK_THRESHOLD || '50', 10);
const SNAPSHOT_DIR = process.env.SNAPSHOT_DIR || './snapshots';
const CLEANUP_INTERVAL = parseInt(process.env.CLEANUP_INTERVAL || '3600000', 10);

// Ensure snapshot directory exists
if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR);
}

// Monitor memory usage
memwatch.on('leak', (info) => {
  Sentry.captureMessage('Memory leak detected', {
    level: 'warning',
    extra: info,
  });
  datadogRum.addError('Memory leak detected', { info });
  takeHeapSnapshot();
});

memwatch.on('stats', (stats) => {
  if (stats.estimated_base > LEAK_THRESHOLD) {
    Sentry.captureMessage('Potential memory leak detected', {
      level: 'info',
      extra: stats,
    });
    datadogRum.addError('Potential memory leak detected', { stats });
  }
});

// Take heap snapshot
function takeHeapSnapshot() {
  const snapshotPath = path.join(SNAPSHOT_DIR, `heap-${Date.now()}.heapsnapshot`);
  heapdump.writeSnapshot(snapshotPath, (err, filename) => {
    if (err) {
      Sentry.captureException(err);
      datadogRum.addError('Heap snapshot error', { error: err });
    } else {
      Sentry.captureMessage('Heap snapshot taken', {
        level: 'info',
        extra: { filename },
      });
      datadogRum.addAction('Heap snapshot taken', { filename });
    }
  });
}

// Automatic cleanup of old snapshots
setInterval(() => {
  fs.readdir(SNAPSHOT_DIR, (err, files) => {
    if (err) {
      Sentry.captureException(err);
      datadogRum.addError('Snapshot cleanup error', { error: err });
      return;
    }

    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(SNAPSHOT_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          Sentry.captureException(err);
          datadogRum.addError('File stat error', { error: err });
          return;
        }

        if (now - stats.mtimeMs > CLEANUP_INTERVAL) {
          fs.unlink(filePath, (err) => {
            if (err) {
              Sentry.captureException(err);
              datadogRum.addError('File deletion error', { error: err });
            } else {
              Sentry.captureMessage('Old heap snapshot deleted', {
                level: 'info',
                extra: { filePath },
              });
              datadogRum.addAction('Old heap snapshot deleted', { filePath });
            }
          });
        }
      });
    });
  });
}, CLEANUP_INTERVAL);

// FedRAMP Compliance Notes
// - Ensure all data sent to Sentry and Datadog is sanitized and does not include PII.
// - Use secure environment variable management for sensitive data such as DSN and tokens.
// - Regularly review and audit access to monitoring and logging systems.