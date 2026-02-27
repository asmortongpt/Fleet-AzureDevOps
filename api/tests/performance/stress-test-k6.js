import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * k6 Stress Testing Script
 * Tests system limits and breaking points
 *
 * Run with: k6 run stress-test-k6.js
 * This progressively increases load to find system limits
 */

const errorRate = new Rate('stress_errors');
const requestDuration = new Trend('stress_request_duration');
const breaksCount = new Counter('stress_breaks');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Stress test stages - ramp up aggressively
export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 200 },
    { duration: '1m', target: 500 },
    { duration: '1m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    stress_errors: ['rate<0.5'], // Allow up to 50% error rate
    stress_request_duration: ['p(95)<5000'], // Allow longer response times
  },
};

export default function () {
  const endpoints = [
    '/api/v1/vehicles?limit=100',
    '/api/v1/drivers?limit=100',
    '/api/v1/fleet',
    '/api/v1/gps/track',
    '/api/v1/costs/summary',
    '/api/v1/fuel/transactions',
    '/api/v1/maintenance/records',
    '/api/v1/health',
  ];

  // Randomly select endpoint
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

  const startTime = Date.now();
  const res = http.get(`${BASE_URL}${endpoint}`, { timeout: '30s' });
  const duration = Date.now() - startTime;

  requestDuration.add(duration);

  // Check response
  const isSuccess = res.status === 200;
  if (!isSuccess) {
    errorRate.add(1);
    if (res.status === 0 || res.status === 503) {
      breaksCount.add(1);
    }
  }

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has body': (r) => r.body.length > 0,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  sleep(0.1);
}

export function handleSummary(data) {
  const summary = {
    'Total Requests': data.metrics.request_count
      ? Object.values(data.metrics.request_count.values).reduce((a, b) => a + b, 0)
      : 0,
    'Total Errors': data.metrics.stress_errors
      ? Math.round(
          (Object.values(data.metrics.stress_errors.values).reduce((a, b) => a + b, 0) /
            Object.values(data.metrics.request_count.values).reduce((a, b) => a + b, 0)) *
            100
        )
      : 0,
    'Breaks': data.metrics.stress_breaks
      ? Object.values(data.metrics.stress_breaks.values).reduce((a, b) => a + b, 0)
      : 0,
  };

  console.log('\n=== STRESS TEST SUMMARY ===');
  console.log(`Total Requests: ${summary['Total Requests']}`);
  console.log(`Error Rate: ${summary['Total Errors']}%`);
  console.log(`Connection Breaks: ${summary['Breaks']}`);

  return {
    'stdout': JSON.stringify(summary, null, 2),
  };
}
