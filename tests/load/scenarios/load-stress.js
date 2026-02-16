import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const THINK_TIME = __ENV.THINK_TIME || 0.2;

// Metrics
const responseTime = new Trend('response_time');
const stressErrors = new Counter('stress_errors');
const errorRate = new Rate('error_rate');
const p99ResponseTime = new Trend('p99_response_time');

export const options = {
  stages: [
    { duration: '30s', target: 100 },    // Ramp up: 100 users
    { duration: '1m', target: 500 },     // Increase: 500 users
    { duration: '2m', target: 1000 },    // Heavy stress: 1000 users
    { duration: '3m', target: 1000 },    // Sustain: 1000 users
    { duration: '2m', target: 0 },       // Cool down
  ],
  thresholds: {
    http_req_duration: [
      'p(50) < 500',     // Median < 500ms (degraded performance expected)
      'p(95) < 2000',    // 95% < 2000ms
      'p(99) < 3000',    // 99% < 3000ms (critical threshold)
    ],
    http_req_failed: ['rate < 0.05'],   // Allow 5% errors under extreme stress
    error_rate: ['rate < 0.05'],
  },
};

export default function () {
  // Distribute load across endpoints
  const endpoints = [
    { name: 'Vehicles List', url: `${BASE_URL}/api/vehicles?limit=20` },
    { name: 'Drivers List', url: `${BASE_URL}/api/drivers?limit=20` },
    { name: 'Alerts', url: `${BASE_URL}/api/alerts?limit=30` },
    { name: 'Compliance', url: `${BASE_URL}/api/compliance/summary` },
    { name: 'Dashboard', url: `${BASE_URL}/api/analytics/fleet-metrics` },
    { name: 'Telemetry', url: `${BASE_URL}/api/vehicles/telemetry/current` },
  ];

  // Select endpoint based on VU to distribute load
  const endpoint = endpoints[__VU % endpoints.length];

  group(`Stress Test - ${endpoint.name}`, () => {
    const res = http.get(endpoint.url);
    responseTime.add(res.timings.duration);
    p99ResponseTime.add(res.timings.duration);

    const passed = check(res, {
      'status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'status is not 5xx': (r) => r.status < 500,
    });

    if (!passed) {
      stressErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(THINK_TIME);

  // Secondary request to different endpoint
  group('Secondary Request', () => {
    const secondaryEndpoint = endpoints[(__VU + 1) % endpoints.length];
    const res = http.get(secondaryEndpoint.url);

    check(res, {
      'status is 2xx or 3xx': (r) => r.status < 400,
    });
  });

  sleep(THINK_TIME);
}

export function teardown(data) {
  console.log('=== Stress Test Summary ===');
  console.log(`Total Errors: ${stressErrors.value}`);
  console.log(`Error Rate: ${errorRate.value}`);
  console.log(`Peak Users: 1000`);
}
