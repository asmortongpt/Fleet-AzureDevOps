import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const THINK_TIME = __ENV.THINK_TIME || 0.5;

// Metrics
const responseTime = new Trend('response_time');
const spikeErrors = new Counter('spike_errors');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Baseline: 50 users
    { duration: '30s', target: 500 },  // Spike: sudden jump to 500 users
    { duration: '1m', target: 50 },    // Recovery: back to baseline
  ],
  thresholds: {
    http_req_duration: [
      'p(50) < 300',     // Median < 300ms during spike
      'p(95) < 1000',    // 95% < 1000ms (higher during spike)
      'p(99) < 2000',    // 99% < 2000ms
    ],
    http_req_failed: ['rate < 0.01'],  // Allow 1% errors during spike
    error_rate: ['rate < 0.01'],
  },
};

export default function () {
  // Heavy hit on list endpoints during spike
  group('Spike Endpoint - Vehicles', () => {
    const res = http.get(`${BASE_URL}/api/vehicles?limit=20`);
    responseTime.add(res.timings.duration);

    const passed = check(res, {
      'status is 200': (r) => r.status === 200,
      'has data': (r) => r.json('data.length') >= 0,
    });

    if (!passed) {
      spikeErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(THINK_TIME);

  group('Spike Endpoint - Drivers', () => {
    const res = http.get(`${BASE_URL}/api/drivers?limit=20`);
    responseTime.add(res.timings.duration);

    const passed = check(res, {
      'status is 200': (r) => r.status === 200,
      'has data': (r) => r.json('data.length') >= 0,
    });

    if (!passed) {
      spikeErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(THINK_TIME);

  group('Spike Endpoint - Dashboard', () => {
    const res = http.get(`${BASE_URL}/api/analytics/fleet-metrics`);
    responseTime.add(res.timings.duration);

    const passed = check(res, {
      'status is 200': (r) => r.status === 200,
    });

    if (!passed) {
      spikeErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(THINK_TIME);

  // Mixed spike endpoints
  group('Mixed Spike Requests', () => {
    const endpoints = [
      `${BASE_URL}/api/vehicles?limit=10`,
      `${BASE_URL}/api/drivers?limit=10`,
      `${BASE_URL}/api/alerts?limit=20`,
    ];

    for (const endpoint of endpoints) {
      const res = http.get(endpoint);
      responseTime.add(res.timings.duration);

      const passed = check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
      });

      if (!passed) {
        errorRate.add(1);
      } else {
        errorRate.add(0);
      }

      sleep(0.2);
    }
  });
}

export function teardown(data) {
  console.log('=== Spike Test Summary ===');
  console.log(`Total Errors: ${spikeErrors.value}`);
  console.log(`Error Rate: ${errorRate.value}`);
}
