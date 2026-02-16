import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const THINK_TIME = __ENV.THINK_TIME || 1;

// Metrics for endurance testing
const responseTime = new Trend('response_time');
const enduranceErrors = new Counter('endurance_errors');
const errorRate = new Rate('error_rate');
const memoryUsage = new Gauge('memory_usage');
const connectionCount = new Gauge('connection_count');

export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Warm up
    { duration: '60m', target: 100 },  // 1 hour sustained load
    { duration: '5m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: [
      'p(50) < 200',     // Median response time
      'p(95) < 500',     // 95th percentile
      'p(99) < 1000',    // 99th percentile (should be stable)
    ],
    http_req_failed: ['rate < 0.001'],  // < 0.1% errors
    error_rate: ['rate < 0.001'],
  },
};

let requestCounter = 0;
let errorCounter = 0;

export default function () {
  requestCounter++;

  // Log progress every 100 requests per VU
  if (requestCounter % 100 === 0) {
    console.log(
      `VU ${__VU}: ${requestCounter} requests, ${errorCounter} errors`
    );
  }

  group('Endurance - Vehicle Operations', () => {
    // List vehicles
    const res1 = http.get(`${BASE_URL}/api/vehicles?limit=20&offset=0`);
    responseTime.add(res1.timings.duration);

    const passed1 = check(res1, {
      'list vehicles: status 200': (r) => r.status === 200,
      'list vehicles: response time < 500ms': (r) =>
        r.timings.duration < 500,
    });

    if (!passed1) {
      errorCounter++;
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    sleep(THINK_TIME);

    // Get vehicle detail
    const res2 = http.get(`${BASE_URL}/api/vehicles/1`);
    responseTime.add(res2.timings.duration);

    check(res2, {
      'vehicle detail: status 200': (r) => r.status === 200,
    });

    sleep(THINK_TIME);
  });

  group('Endurance - Driver Operations', () => {
    // List drivers
    const res3 = http.get(`${BASE_URL}/api/drivers?limit=20&offset=0`);
    responseTime.add(res3.timings.duration);

    const passed3 = check(res3, {
      'list drivers: status 200': (r) => r.status === 200,
      'list drivers: response time < 500ms': (r) =>
        r.timings.duration < 500,
    });

    if (!passed3) {
      errorCounter++;
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }

    sleep(THINK_TIME);

    // Driver performance
    const res4 = http.get(`${BASE_URL}/api/drivers/1/performance`);
    responseTime.add(res4.timings.duration);

    check(res4, {
      'driver performance: status 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    sleep(THINK_TIME);
  });

  group('Endurance - Dashboard', () => {
    // Fleet metrics
    const res5 = http.get(`${BASE_URL}/api/analytics/fleet-metrics`);
    responseTime.add(res5.timings.duration);

    check(res5, {
      'dashboard: status 200': (r) => r.status === 200,
      'dashboard: response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    sleep(THINK_TIME);

    // Real-time data
    const res6 = http.get(`${BASE_URL}/api/vehicles/telemetry/current`);
    responseTime.add(res6.timings.duration);

    check(res6, {
      'telemetry: status 200': (r) => r.status === 200,
    });

    sleep(THINK_TIME);
  });

  group('Endurance - Mixed Operations', () => {
    // Simulate varied request patterns
    const operations = [
      `${BASE_URL}/api/vehicles?limit=10`,
      `${BASE_URL}/api/drivers?limit=10`,
      `${BASE_URL}/api/compliance/summary`,
      `${BASE_URL}/api/alerts?limit=15`,
    ];

    for (const operation of operations) {
      const res = http.get(operation);
      responseTime.add(res.timings.duration);

      check(res, {
        'mixed: status 2xx': (r) => r.status >= 200 && r.status < 300,
      });

      sleep(0.5);
    }
  });
}

export function teardown(data) {
  console.log('=== Endurance Test Summary ===');
  console.log(`Total Errors: ${errorCounter}`);
  console.log(`Error Rate: ${errorRate.value}`);
  console.log(`Total Requests: ${requestCounter}`);
  console.log('Note: Memory leaks should be < 50MB over 1 hour');
}
