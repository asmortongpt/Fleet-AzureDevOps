import { describe, it, expect, beforeAll, afterAll } from 'vitest';

/**
 * API Endpoint Performance Benchmarks
 * Tests response times for critical endpoints
 *
 * Target baselines:
 * - List endpoints: < 500ms
 * - Detail endpoints: < 300ms
 * - Search: < 1000ms
 * - Creation: < 500ms
 * - Updates: < 500ms
 */

interface EndpointMetric {
  endpoint: string;
  method: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  p99Time: number;
  requestCount: number;
  errorCount: number;
}

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || '';

// Helper to measure endpoint performance
async function measureEndpoint(
  method: string,
  path: string,
  iterations: number = 10,
  body?: any
): Promise<EndpointMetric> {
  const times: number[] = [];
  let errorCount = 0;

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    try {
      const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;
      times.push(responseTime);

      if (!response.ok) {
        errorCount++;
      }
    } catch (error) {
      errorCount++;
    }
  }

  times.sort((a, b) => a - b);

  const endpoint: EndpointMetric = {
    endpoint: path,
    method,
    avgTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: times[0],
    maxTime: times[times.length - 1],
    p95Time: times[Math.floor(times.length * 0.95)],
    p99Time: times[Math.floor(times.length * 0.99)],
    requestCount: iterations,
    errorCount,
  };

  return endpoint;
}

describe('API Endpoint Performance Benchmarks', () => {
  let results: EndpointMetric[] = [];

  it('should measure vehicles list endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/vehicles', 10);
    results.push(metric);

    console.log('Vehicles List Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
    expect(metric.p99Time).toBeLessThan(1000);
    expect(metric.errorCount).toBe(0);
  });

  it('should measure drivers list endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/drivers', 10);
    results.push(metric);

    console.log('Drivers List Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
    expect(metric.p99Time).toBeLessThan(1000);
  });

  it('should measure fleet list endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/fleet', 10);
    results.push(metric);

    console.log('Fleet List Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure GPS tracking endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/gps/track', 10);
    results.push(metric);

    console.log('GPS Tracking Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(300);
  });

  it('should measure telematics data endpoint performance', async () => {
    const metric = await measureEndpoint(
      'GET',
      '/api/v1/telematics/current',
      10
    );
    results.push(metric);

    console.log('Telematics Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure fuel transactions endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/fuel/transactions', 10);
    results.push(metric);

    console.log('Fuel Transactions Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure maintenance records endpoint performance', async () => {
    const metric = await measureEndpoint(
      'GET',
      '/api/v1/maintenance/records',
      10
    );
    results.push(metric);

    console.log('Maintenance Records Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure costs endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/costs/summary', 10);
    results.push(metric);

    console.log('Costs Summary Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(500);
  });

  it('should measure search endpoint performance', async () => {
    const metric = await measureEndpoint(
      'GET',
      '/api/v1/search?q=test',
      10
    );
    results.push(metric);

    console.log('Search Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(1000);
  });

  it('should measure health check endpoint performance', async () => {
    const metric = await measureEndpoint('GET', '/api/v1/health', 20);
    results.push(metric);

    console.log('Health Check Endpoint:', metric);
    expect(metric.avgTime).toBeLessThan(100);
  });

  it('should generate performance report', () => {
    console.log('\n=== API ENDPOINT PERFORMANCE REPORT ===\n');

    const sortedResults = [...results].sort((a, b) => b.avgTime - a.avgTime);

    sortedResults.forEach((metric) => {
      const status =
        metric.avgTime < 300
          ? '✓'
          : metric.avgTime < 500
            ? '⚠'
            : '✗';

      console.log(
        `${status} ${metric.method.padEnd(6)} ${metric.endpoint.padEnd(40)}`
      );
      console.log(
        `    Avg: ${metric.avgTime.toFixed(2)}ms | Min: ${metric.minTime.toFixed(2)}ms | Max: ${metric.maxTime.toFixed(2)}ms`
      );
      console.log(
        `    P95: ${metric.p95Time.toFixed(2)}ms | P99: ${metric.p99Time.toFixed(2)}ms | Errors: ${metric.errorCount}/${metric.requestCount}`
      );
    });

    const avgResponseTime =
      results.reduce((a, b) => a + b.avgTime, 0) / results.length;
    console.log(`\nOverall Average Response Time: ${avgResponseTime.toFixed(2)}ms`);

    const slowEndpoints = results.filter((m) => m.avgTime > 500);
    if (slowEndpoints.length > 0) {
      console.log(`\nSlow Endpoints (> 500ms):`);
      slowEndpoints.forEach((m) => {
        console.log(`  - ${m.endpoint}: ${m.avgTime.toFixed(2)}ms`);
      });
    }
  });
});
