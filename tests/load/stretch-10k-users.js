/**
 * Fleet Management System - Stretch Load Test (10,000 Concurrent Users)
 *
 * This test validates system scalability under extreme load
 * Stretch Goal: P95 < 1000ms with 10,000 concurrent users
 *
 * Usage: k6 run stretch-10k-users.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const apiResponseTime = new Trend('api_response_time');
const apiErrors = new Counter('api_errors');

// Test configuration - Stretch goal: 10,000 concurrent users
export const options = {
  stages: [
    { duration: '5m', target: 1000 },   // Warm up to 1K
    { duration: '5m', target: 5000 },   // Ramp to 5K
    { duration: '3m', target: 10000 },  // Ramp to 10K (STRETCH)
    { duration: '5m', target: 10000 },  // Hold at 10K for 5 minutes
    { duration: '3m', target: 5000 },   // Ramp down
    { duration: '2m', target: 0 },      // Cool down
  ],
  thresholds: {
    // Relaxed thresholds for extreme load
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'],
    'http_req_failed': ['rate<0.05'],  // Allow up to 5% errors
    'login_success': ['rate>0.95'],
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

// Simplified workflow for extreme load
export default function () {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'admin@demofleet.com',
      password: 'Demo@123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const loginSuccess = check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  loginSuccessRate.add(loginSuccess);
  apiResponseTime.add(loginRes.timings.duration);

  if (!loginSuccess) {
    sleep(1);
    return;
  }

  const token = loginRes.json('token');
  const authParams = {
    headers: { 'Authorization': `Bearer ${token}` },
  };

  // Read-only operations (most scalable)
  const endpoints = [
    '/api/vehicles',
    '/api/health',
    '/api/metrics/fleet-overview',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, authParams);

  const success = check(res, {
    'status 200': (r) => r.status === 200,
  });

  apiResponseTime.add(res.timings.duration);

  if (!success) {
    apiErrors.add(1);
  }

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;

  console.log('\n====== 10K USER STRETCH TEST RESULTS ======\n');
  console.log(`P95 Latency: ${p95.toFixed(2)}ms`);
  console.log(`Error Rate: ${(errorRate * 100).toFixed(2)}%`);
  console.log('==========================================\n');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    '/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results/10k-users-summary.json': JSON.stringify(data, null, 2),
  };
}
