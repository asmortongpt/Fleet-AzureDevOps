import { exec } from 'child_process';
import path from 'path';

import { datadogRum } from '@datadog/browser-rum';
import { captureException } from '@sentry/node';
import express, { Request, Response, NextFunction } from 'express';
// import memwatch from 'memwatch-next'; // Disabled - incompatible with Node.js v24


interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
}

interface RouteMemoryLimit {
  [route: string]: number;
}

const app = express();
const memoryLimits: RouteMemoryLimit = JSON.parse(process.env.ROUTE_MEMORY_LIMITS || '{}');
const circuitBreakerThreshold = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '80', 10);
const heapSnapshotDir = process.env.HEAP_SNAPSHOT_DIR || './heap_snapshots';
const fedRampComplianceNote = 'Ensure all data handling complies with FedRAMP requirements.';

// memwatch.on('leak', (info) => {
//   captureException(new Error(`Memory leak detected: ${info.reason}`));
// });

const takeHeapSnapshot = (snapshotName: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const snapshotPath = path.join(heapSnapshotDir, `${snapshotName}.heapsnapshot`);
    exec(`node --heap_snapshot_path=${heapSnapshotDir} -e "console.log('Heap snapshot taken')"`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
};

const compareHeapSnapshots = async (snapshot1: string, snapshot2: string): Promise<void> => {
  // Implement comparison logic here
};

const memoryTrackingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startMemoryUsage: MemoryUsage = process.memoryUsage();
  const routeLimit = memoryLimits[req.path];

  res.on('finish', async () => {
    const endMemoryUsage: MemoryUsage = process.memoryUsage();
    const memoryUsed = endMemoryUsage.heapUsed - startMemoryUsage.heapUsed;

    if (routeLimit && memoryUsed > routeLimit) {
      captureException(new Error(`Memory usage exceeded for route ${req.path}: ${memoryUsed} bytes`));
    }

    if ((endMemoryUsage.heapUsed / endMemoryUsage.heapTotal) * 100 > circuitBreakerThreshold) {
      await takeHeapSnapshot(`circuit_breaker_${Date.now()}`);
      captureException(new Error('Circuit breaker triggered due to high memory usage'));
    }

    datadogRum.addRumGlobalContext('memoryUsage', {
      route: req.path,
      memoryUsed,
      heapUsed: endMemoryUsage.heapUsed,
      heapTotal: endMemoryUsage.heapTotal,
    });
  });

  next();
};

app.use(memoryTrackingMiddleware);

app.get('/example', (req: Request, res: Response) => {
  res.send('Hello, world!');
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
  console.log(fedRampComplianceNote);
});