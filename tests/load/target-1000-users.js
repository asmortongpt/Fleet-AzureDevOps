/**
 * Fleet Management System - Target Load Test (1,000 Concurrent Users)
 *
 * This test validates system performance at target production capacity
 * Target: P95 < 500ms with 1,000 concurrent users
 *
 * Usage: k6 run target-1000-users.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const loginSuccessRate = new Rate('login_success');
const apiResponseTime = new Trend('api_response_time');
const apiErrors = new Counter('api_errors');
const activeUsers = new Gauge('active_users');
const throughput = new Counter('successful_requests');

// Test configuration - Target 1,000 concurrent users
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '3m', target: 500 },   // Ramp to 500
    { duration: '2m', target: 1000 },  // Ramp to 1,000 (TARGET)
    { duration: '5m', target: 1000 },  // Hold at 1,000 for 5 minutes
    { duration: '2m', target: 500 },   // Ramp down
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    // CRITICAL: P95 must be under 500ms
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],

    // Error rate must be under 1%
    'http_req_failed': ['rate<0.01'],

    // Login success rate > 99%
    'login_success': ['rate>0.99'],

    // API response time thresholds
    'api_response_time': ['p(95)<500', 'p(99)<1000', 'avg<300'],

    // Throughput: minimum 100 req/s at peak
    'http_reqs': ['rate>100'],
  },
  ext: {
    loadimpact: {
      projectID: 3814175336427503121,
      name: 'Fleet 1K User Target Load Test',
    },
  },
};

// Configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:3000';
const DEMO_USERS = [
  { email: 'admin@demofleet.com', password: 'Demo@123', role: 'admin' },
  { email: 'manager@demofleet.com', password: 'Demo@123', role: 'fleet_manager' },
  { email: 'tech@demofleet.com', password: 'Demo@123', role: 'technician' },
  { email: 'driver1@demofleet.com', password: 'Demo@123', role: 'driver' },
  { email: 'driver2@demofleet.com', password: 'Demo@123', role: 'driver' },
  { email: 'driver3@demofleet.com', password: 'Demo@123', role: 'driver' },
  { email: 'driver4@demofleet.com', password: 'Demo@123', role: 'driver' },
  { email: 'driver5@demofleet.com', password: 'Demo@123', role: 'driver' },
];

// Session tokens cache (simulate realistic session management)
let sessionTokens = {};

// Helper function to login and get token
function login() {
  const user = DEMO_USERS[Math.floor(Math.random() * DEMO_USERS.length)];

  // Check if we already have a valid token for this user
  if (sessionTokens[user.email]) {
    return sessionTokens[user.email];
  }

  const payload = JSON.stringify({
    email: user.email,
    password: user.password,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'Login' },
  };

  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  const loginSuccess = check(res, {
    'login successful': (r) => r.status === 200,
    'has token': (r) => r.json('token') !== undefined,
    'login < 1s': (r) => r.timings.duration < 1000,
  });

  loginSuccessRate.add(loginSuccess);
  apiResponseTime.add(res.timings.duration);

  if (res.status !== 200) {
    apiErrors.add(1);
    console.error(`Login failed for ${user.email}: ${res.status}`);
    return null;
  }

  const token = res.json('token');
  sessionTokens[user.email] = token;
  return token;
}

// Main test scenario - Simulates realistic user behavior
export default function () {
  activeUsers.add(1);

  // Step 1: Login
  const token = login();

  if (!token) {
    sleep(1);
    activeUsers.add(-1);
    return;
  }

  const authParams = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  // Simulate realistic user workflow
  const workflow = Math.random();

  if (workflow < 0.4) {
    // 40% - Dashboard viewer workflow
    dashboardWorkflow(authParams);
  } else if (workflow < 0.7) {
    // 30% - Fleet manager workflow
    fleetManagerWorkflow(authParams);
  } else if (workflow < 0.9) {
    // 20% - Driver workflow
    driverWorkflow(authParams);
  } else {
    // 10% - Admin workflow
    adminWorkflow(authParams);
  }

  activeUsers.add(-1);
  sleep(Math.random() * 3 + 1); // 1-4 seconds think time
}

// Dashboard viewer workflow
function dashboardWorkflow(authParams) {
  group('Dashboard Workflow', () => {
    // View dashboard
    let res = http.get(`${BASE_URL}/api/vehicles`, authParams);
    checkResponse(res, 'Get vehicles');

    sleep(0.5);

    // View real-time map
    res = http.get(`${BASE_URL}/api/gps/current`, authParams);
    checkResponse(res, 'Get GPS data');

    sleep(0.5);

    // View metrics
    res = http.get(`${BASE_URL}/api/metrics/fleet-overview`, authParams);
    checkResponse(res, 'Get fleet metrics');
  });
}

// Fleet manager workflow
function fleetManagerWorkflow(authParams) {
  group('Fleet Manager Workflow', () => {
    // View vehicles
    let res = http.get(`${BASE_URL}/api/vehicles?limit=50`, authParams);
    checkResponse(res, 'Get vehicles list');

    const vehicles = res.json('data');
    if (vehicles && vehicles.length > 0) {
      sleep(0.5);

      // View vehicle details
      const vehicleId = vehicles[Math.floor(Math.random() * vehicles.length)].id;
      res = http.get(`${BASE_URL}/api/vehicles/${vehicleId}`, authParams);
      checkResponse(res, 'Get vehicle details');

      sleep(0.5);

      // View maintenance records
      res = http.get(`${BASE_URL}/api/maintenance?vehicle_id=${vehicleId}`, authParams);
      checkResponse(res, 'Get maintenance records');
    }

    sleep(0.5);

    // View work orders
    res = http.get(`${BASE_URL}/api/work-orders?status=open`, authParams);
    checkResponse(res, 'Get work orders');
  });
}

// Driver workflow
function driverWorkflow(authParams) {
  group('Driver Workflow', () => {
    // Get assigned vehicle
    let res = http.get(`${BASE_URL}/api/drivers/me`, authParams);
    checkResponse(res, 'Get driver profile');

    sleep(0.5);

    // Start trip
    res = http.post(
      `${BASE_URL}/api/trips`,
      JSON.stringify({
        vehicle_id: 1,
        purpose: 'delivery',
      }),
      authParams
    );
    checkResponse(res, 'Start trip');

    sleep(0.5);

    // Report fuel purchase
    res = http.get(`${BASE_URL}/api/fuel-transactions?limit=10`, authParams);
    checkResponse(res, 'Get fuel transactions');
  });
}

// Admin workflow
function adminWorkflow(authParams) {
  group('Admin Workflow', () => {
    // View all users
    let res = http.get(`${BASE_URL}/api/users`, authParams);
    checkResponse(res, 'Get users');

    sleep(0.5);

    // View system health
    res = http.get(`${BASE_URL}/api/health`, authParams);
    checkResponse(res, 'Get health status');

    sleep(0.5);

    // View reports
    res = http.get(`${BASE_URL}/api/reports/utilization`, authParams);
    checkResponse(res, 'Get utilization report');
  });
}

// Helper function to check response and record metrics
function checkResponse(res, name) {
  const success = check(res, {
    [`${name}: status 200`]: (r) => r.status === 200,
    [`${name}: response < 500ms`]: (r) => r.timings.duration < 500,
  });

  apiResponseTime.add(res.timings.duration);

  if (res.status === 200) {
    throughput.add(1);
  } else {
    apiErrors.add(1);
    console.error(`${name} failed: ${res.status}`);
  }
}

// Summary handler - Generate detailed reports
export function handleSummary(data) {
  console.log('\n====== FLEET 1K USER LOAD TEST RESULTS ======\n');

  const p95 = data.metrics.http_req_duration?.values['p(95)'] || 0;
  const p99 = data.metrics.http_req_duration?.values['p(99)'] || 0;
  const errorRate = data.metrics.http_req_failed?.values.rate || 0;

  // Determine pass/fail
  const p95Pass = p95 < 500;
  const p99Pass = p99 < 1000;
  const errorRatePass = errorRate < 0.01;

  const passed = p95Pass && p99Pass && errorRatePass;

  console.log(`✅ P95 Latency: ${p95.toFixed(2)}ms (Target: <500ms) - ${p95Pass ? 'PASS' : 'FAIL'}`);
  console.log(`${p99Pass ? '✅' : '❌'} P99 Latency: ${p99.toFixed(2)}ms (Target: <1000ms) - ${p99Pass ? 'PASS' : 'FAIL'}`);
  console.log(`${errorRatePass ? '✅' : '❌'} Error Rate: ${(errorRate * 100).toFixed(2)}% (Target: <1%) - ${errorRatePass ? 'PASS' : 'FAIL'}`);
  console.log(`\n${passed ? '✅ TEST PASSED' : '❌ TEST FAILED'}\n`);
  console.log('=============================================\n');

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    '/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results/1k-users-summary.json': JSON.stringify(data, null, 2),
    '/Users/andrewmorton/Documents/GitHub/Fleet/tests/load/results/1k-users-report.html': htmlReport(data),
  };
}
