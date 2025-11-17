/**
 * Fleet Management System - Baseline Load Test
 *
 * This test establishes baseline performance metrics for the API
 * Tests: Authentication, Read operations, Basic CRUD
 *
 * Usage: k6 run baseline-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const apiResponseTime = new Trend('api_response_time');
const apiErrors = new Counter('api_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 25 },  // Ramp up to 25 users
    { duration: '2m', target: 25 },   // Stay at 25 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% of requests must complete below 500ms
    'http_req_failed': ['rate<0.01'],    // Error rate must be less than 1%
    'login_success': ['rate>0.95'],      // Login success rate must be > 95%
  },
};

// Configuration
const BASE_URL = __ENV.API_URL || 'http://fleet-api-service:3000';
const DEMO_USERS = [
  { email: 'admin@demofleet.com', password: 'Demo@123', role: 'admin' },
  { email: 'manager@demofleet.com', password: 'Demo@123', role: 'fleet_manager' },
  { email: 'tech@demofleet.com', password: 'Demo@123', role: 'technician' },
  { email: 'driver1@demofleet.com', password: 'Demo@123', role: 'driver' },
];

// Helper function to login and get token
function login() {
  const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  const loginSuccess = check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
  });

  loginSuccessRate.add(loginSuccess);
  apiResponseTime.add(res.timings.duration);

  if (res.status !== 200) {
    apiErrors.add(1);
    console.error(`Login failed for ${user.email}: ${res.status}`);
    return null;
  }

  return res.json('token');
}

// Main test scenario
export default function () {
  // Step 1: Login
  const token = login();

  if (!token) {
    sleep(1);
    return;
  }

  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Step 2: Get vehicles list
  let res = http.get(`${BASE_URL}/api/vehicles`, authParams);
  check(res, {
    'vehicles list status 200': (r) => r.status === 200,
    'vehicles response time < 500ms': (r) => r.timings.duration < 500,
    'has vehicles data': (r) => r.json('data') !== undefined,
  });
  apiResponseTime.add(res.timings.duration);
  if (res.status >= 400) apiErrors.add(1);

  sleep(1);

  // Step 3: Get a single vehicle
  const vehicles = res.json('data');
  if (vehicles && vehicles.length > 0) {
    const vehicleId = vehicles[0].id;
    res = http.get(`${BASE_URL}/api/vehicles/${vehicleId}`, authParams);
    check(res, {
      'single vehicle status 200': (r) => r.status === 200,
      'vehicle response time < 300ms': (r) => r.timings.duration < 300,
    });
    apiResponseTime.add(res.timings.duration);
    if (res.status >= 400) apiErrors.add(1);
  }

  sleep(1);

  // Step 4: Get drivers list
  res = http.get(`${BASE_URL}/api/drivers`, authParams);
  check(res, {
    'drivers list status 200': (r) => r.status === 200,
    'drivers response time < 500ms': (r) => r.timings.duration < 500,
  });
  apiResponseTime.add(res.timings.duration);
  if (res.status >= 400) apiErrors.add(1);

  sleep(1);

  // Step 5: Get work orders
  res = http.get(`${BASE_URL}/api/work-orders`, authParams);
  check(res, {
    'work orders status 200': (r) => r.status === 200,
    'work orders response time < 500ms': (r) => r.timings.duration < 500,
  });
  apiResponseTime.add(res.timings.duration);
  if (res.status >= 400) apiErrors.add(1);

  sleep(2);
}

// Summary handler
export function handleSummary(data) {
  return {
    '/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/baseline-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors !== false;

  let summary = '\n';
  summary += indent + '====== BASELINE LOAD TEST SUMMARY ======\n\n';

  if (data.metrics.http_req_duration) {
    summary += indent + 'Response Time:\n';
    summary += indent + `  min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
    summary += indent + `  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += indent + `  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;
  }

  if (data.metrics.http_reqs) {
    summary += indent + 'Requests:\n';
    summary += indent + `  total: ${data.metrics.http_reqs.values.count}\n`;
    summary += indent + `  rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s\n\n`;
  }

  if (data.metrics.http_req_failed) {
    summary += indent + 'Success Rate:\n';
    const successRate = ((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2);
    summary += indent + `  ${successRate}%\n\n`;
  }

  summary += indent + '========================================\n';

  return summary;
}
