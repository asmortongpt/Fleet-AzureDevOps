import * as fs from 'fs';
import * as path from 'path';
import { writeHeapSnapshot } from 'v8';

import { datadogRum } from '@datadog/browser-rum';
import * as Sentry from '@sentry/node';
import * as memwatch from 'memwatch-next';

interface Config {
  heapUsageThreshold: number;
  heapGrowthThreshold: number;
  snapshotDir: string;
}

const config: Config = {
  heapUsageThreshold: parseFloat(process.env.HEAP_USAGE_THRESHOLD || '0.8'),
  heapGrowthThreshold: parseFloat(process.env.HEAP_GROWTH_THRESHOLD || '0.1'),
  snapshotDir: process.env.HEAP_SNAPSHOT_DIR || './heap-snapshots',
};

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

datadogRum.init({
  applicationId: process.env.DATADOG_APP_ID || '',
  clientToken: process.env.DATADOG_CLIENT_TOKEN || '',
  site: 'datadoghq.com',
  service: 'memory-monitoring-service',
  version: '1.0.0',
  sampleRate: 100,
  trackInteractions: true,
});

function ensureSnapshotDirExists(): void {
  if (!fs.existsSync(config.snapshotDir)) {
    fs.mkdirSync(config.snapshotDir, { recursive: true });
  }
}

function takeHeapSnapshot(label: string): void {
  const snapshotPath = path.join(config.snapshotDir, `heap-${label}-${Date.now()}.heapsnapshot`);
  writeHeapSnapshot(snapshotPath);
  Sentry.captureMessage(`Heap snapshot taken: ${snapshotPath}`);
}

function monitorMemoryUsage(): void {
  memwatch.on('stats', (stats) => {
    const heapUsage = stats.current_base / stats.estimated_base;
    if (heapUsage > config.heapUsageThreshold) {
      Sentry.captureMessage(`High heap usage detected: ${heapUsage}`);
      takeHeapSnapshot('high-usage');
    }
  });

  memwatch.on('leak', (info) => {
    Sentry.captureException(new Error(`Memory leak detected: ${info.reason}`));
    takeHeapSnapshot('leak-detected');
  });
}

function monitorHeapGrowth(): void {
  let lastHeapSize = 0;
  memwatch.on('stats', (stats) => {
    const heapGrowth = (stats.current_base - lastHeapSize) / lastHeapSize;
    lastHeapSize = stats.current_base;
    if (heapGrowth > config.heapGrowthThreshold) {
      Sentry.captureMessage(`Heap growth detected: ${heapGrowth}`);
      takeHeapSnapshot('heap-growth');
    }
  });
}

function initializeMonitoring(): void {
  ensureSnapshotDirExists();
  monitorMemoryUsage();
  monitorHeapGrowth();
}

initializeMonitoring();

// FedRAMP Compliance Note: Ensure all data transmitted to Sentry and Datadog is scrubbed of sensitive information. Use environment variables to manage sensitive configurations and ensure secure access controls are in place for any data storage and transmission.