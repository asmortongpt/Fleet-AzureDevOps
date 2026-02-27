import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * Concurrent Request Performance Tests
 * Tests API behavior under concurrent load
 */

interface ConcurrencyMetric {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  errorRate: number;
}

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

async function makeConcurrentRequests(
  endpoint: string,
  concurrency: number,
  iterations: number
): Promise<ConcurrencyMetric> {
  const times: number[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Create batches of concurrent requests
  for (let batch = 0; batch < iterations; batch++) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      const promise = (async () => {
        const startTime = performance.now();
        try {
          const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
            },
            signal: AbortSignal.timeout(10000),
          });

          const endTime = performance.now();
          const responseTime = endTime - startTime;
          times.push(responseTime);

          if (response.ok) {
            successCount++;
          } else {
            failureCount++;
          }
        } catch (error) {
          failureCount++;
        }
      })();

      promises.push(promise);
    }

    // Wait for all requests in batch to complete
    await Promise.all(promises);
  }

  times.sort((a, b) => a - b);
  const totalRequests = concurrency * iterations;
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

  return {
    totalRequests,
    successfulRequests: successCount,
    failedRequests: failureCount,
    avgTime,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p95Time: times[Math.floor(times.length * 0.95)],
    p99Time: times[Math.floor(times.length * 0.99)],
    errorRate: (failureCount / totalRequests) * 100,
  };
}

describe('Concurrent Request Performance', () => {
  it('should handle 10 concurrent requests', async () => {
    const metric = await makeConcurrentRequests('/api/v1/vehicles', 10, 1);

    console.log('10 Concurrent Requests:', metric);
    expect(metric.errorRate).toBeLessThan(5);
    expect(metric.avgTime).toBeLessThan(1000);
  });

  it('should handle 50 concurrent requests', async () => {
    const metric = await makeConcurrentRequests('/api/v1/vehicles', 50, 1);

    console.log('50 Concurrent Requests:', metric);
    expect(metric.errorRate).toBeLessThan(5);
    expect(metric.avgTime).toBeLessThan(2000);
  });

  it('should handle 100 concurrent requests', async () => {
    const metric = await makeConcurrentRequests('/api/v1/vehicles', 100, 1);

    console.log('100 Concurrent Requests:', metric);
    expect(metric.errorRate).toBeLessThan(10);
    expect(metric.avgTime).toBeLessThan(3000);
  });

  it('should handle 200 concurrent requests', async () => {
    const metric = await makeConcurrentRequests('/api/v1/vehicles', 200, 1);

    console.log('200 Concurrent Requests:', metric);
    expect(metric.errorRate).toBeLessThan(15);
    expect(metric.avgTime).toBeLessThan(5000);
  });

  it('should handle sustained concurrent load', async () => {
    const metric = await makeConcurrentRequests('/api/v1/vehicles', 50, 5);

    console.log('Sustained 50 Concurrent (5 iterations):', metric);
    expect(metric.errorRate).toBeLessThan(5);
    expect(metric.p99Time).toBeLessThan(3000);
  });

  it('should handle mixed endpoint concurrent requests', async () => {
    const endpoints = [
      '/api/v1/vehicles',
      '/api/v1/drivers',
      '/api/v1/gps/track',
      '/api/v1/fuel/transactions',
      '/api/v1/maintenance/records',
    ];

    const results: { endpoint: string; metric: ConcurrencyMetric }[] = [];

    for (const endpoint of endpoints) {
      const metric = await makeConcurrentRequests(endpoint, 20, 1);
      results.push({ endpoint, metric });
    }

    console.log('Mixed Endpoint Results:');
    results.forEach(({ endpoint, metric }) => {
      console.log(`  ${endpoint}: ${metric.avgTime.toFixed(2)}ms avg`);
    });

    // All should have reasonable error rates
    results.forEach(({ metric }) => {
      expect(metric.errorRate).toBeLessThan(10);
    });
  });

  it('should measure connection pooling efficiency', async () => {
    // First request to establish connection
    const warmup = await makeConcurrentRequests('/api/v1/vehicles', 5, 1);
    console.log('Warmup (connection pool setup):', warmup);

    // Sustained requests should be faster
    const sustained = await makeConcurrentRequests('/api/v1/vehicles', 50, 3);
    console.log('Sustained Concurrent (50x3):', sustained);

    expect(sustained.avgTime).toBeLessThan(2000);
    expect(sustained.errorRate).toBeLessThan(5);
  });

  it('should handle burst traffic', async () => {
    // Simulate burst by making many concurrent requests in sequence
    const burst1 = await makeConcurrentRequests('/api/v1/vehicles', 100, 1);
    await new Promise((r) => setTimeout(r, 500)); // Brief pause
    const burst2 = await makeConcurrentRequests('/api/v1/vehicles', 100, 1);
    await new Promise((r) => setTimeout(r, 500));
    const burst3 = await makeConcurrentRequests('/api/v1/vehicles', 100, 1);

    console.log('Burst 1:', burst1);
    console.log('Burst 2:', burst2);
    console.log('Burst 3:', burst3);

    // All bursts should handle traffic reasonably
    [burst1, burst2, burst3].forEach((metric) => {
      expect(metric.errorRate).toBeLessThan(10);
    });
  });

  it('should measure per-endpoint concurrency limits', async () => {
    const endpoints = [
      { path: '/api/v1/vehicles', name: 'Vehicles' },
      { path: '/api/v1/drivers', name: 'Drivers' },
      { path: '/api/v1/gps/track', name: 'GPS' },
      { path: '/api/v1/health', name: 'Health' },
    ];

    console.log('\n=== Endpoint Concurrency Limits ===\n');

    for (const { path, name } of endpoints) {
      const metric = await makeConcurrentRequests(path, 100, 1);

      const status =
        metric.errorRate < 5
          ? '✓'
          : metric.errorRate < 10
            ? '⚠'
            : '✗';

      console.log(
        `${status} ${name.padEnd(15)} - Avg: ${metric.avgTime.toFixed(2)}ms, Error Rate: ${metric.errorRate.toFixed(1)}%`
      );
    }
  });

  it('should track concurrent request patterns', async () => {
    const concurrencyLevels = [10, 25, 50, 100];
    const results: { concurrency: number; metric: ConcurrencyMetric }[] = [];

    console.log('\n=== Concurrency Scaling ===\n');

    for (const level of concurrencyLevels) {
      const metric = await makeConcurrentRequests(
        '/api/v1/vehicles',
        level,
        1
      );
      results.push({ concurrency: level, metric });

      console.log(
        `${level.toString().padEnd(4)} users: Avg ${metric.avgTime.toFixed(2)}ms | P99 ${metric.p99Time.toFixed(2)}ms | Errors ${metric.errorRate.toFixed(1)}%`
      );
    }

    // Check for scaling degradation
    if (results.length > 1) {
      const lastResult = results[results.length - 1].metric;
      expect(lastResult.errorRate).toBeLessThan(20);
    }
  });

  it('should measure request timeout behavior', async () => {
    let timeouts = 0;
    let successes = 0;

    const promises = [];
    for (let i = 0; i < 20; i++) {
      const promise = (async () => {
        try {
          const response = await Promise.race([
            fetch(`${BASE_URL}/api/v1/vehicles`, {
              headers: {
                'Content-Type': 'application/json',
                ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
              },
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            ),
          ]);

          if (response instanceof Response && response.ok) {
            successes++;
          }
        } catch (error) {
          if ((error as Error).message === 'Timeout') {
            timeouts++;
          }
        }
      })();

      promises.push(promise);
    }

    await Promise.all(promises);

    console.log(`Timeouts: ${timeouts}/20`);
    console.log(`Successes: ${successes}/20`);

    // Should have minimal timeouts
    expect(timeouts).toBeLessThan(3);
  });
});
