/**
 * K6 Comprehensive Load Test Suite
 * Agent 5: Test Coverage & QA Specialist
 *
 * Tests the Fleet Management System under various load conditions:
 * - Baseline: 100 concurrent users
 * - Peak: 1000 concurrent users
 * - Spike: Instant 10x traffic increase
 * - Soak: 24-hour sustained load
 *
 * Run with:
 * k6 run k6-comprehensive-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const loginErrors = new Counter('login_errors');
const vehicleReadErrors = new Counter('vehicle_read_errors');
const dataCreationErrors = new Counter('data_creation_errors');
const slowRequests = new Counter('slow_requests');
const errorRate = new Rate('error_rate');
const apiResponseTime = new Trend('api_response_time');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TEST_MODE = __ENV.TEST_MODE || 'baseline'; // baseline, peak, spike, soak

// Load test configurations
export const options = getTestOptions(TEST_MODE);

function getTestOptions(mode) {
  const baseOptions = {
    thresholds: {
      http_req_duration: ['p(95)<500', 'p(99)<1000'],
      http_req_failed: ['rate<0.01'],
      error_rate: ['rate<0.01'],
      slow_requests: ['count<100'],
    },
    summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  };

  switch (mode) {
    case 'baseline':
      return {
        ...baseOptions,
        stages: [
          { duration: '5m', target: 50 },   // Ramp up to 50
          { duration: '2m', target: 100 },  // Ramp to 100
          { duration: '10m', target: 100 }, // Stay at 100
          { duration: '5m', target: 0 },    // Ramp down
        ],
        thresholds: {
          http_req_duration: ['p(95)<200', 'p(99)<500'],
          http_req_failed: ['rate<0.001'],
        },
      };

    case 'peak':
      return {
        ...baseOptions,
        stages: [
          { duration: '5m', target: 100 },   // Warm up
          { duration: '5m', target: 500 },   // Ramp to 500
          { duration: '5m', target: 1000 },  // Ramp to 1000
          { duration: '15m', target: 1000 }, // Stay at peak
          { duration: '5m', target: 0 },     // Ramp down
        ],
        thresholds: {
          http_req_duration: ['p(95)<500', 'p(99)<2000'],
          http_req_failed: ['rate<0.01'],
        },
      };

    case 'spike':
      return {
        ...baseOptions,
        stages: [
          { duration: '2m', target: 100 },   // Baseline
          { duration: '30s', target: 1000 }, // Spike!
          { duration: '5m', target: 1000 },  // Hold spike
          { duration: '2m', target: 100 },   // Return to baseline
          { duration: '5m', target: 100 },   // Recover
          { duration: '2m', target: 0 },     // Ramp down
        ],
        thresholds: {
          http_req_duration: ['p(95)<1000', 'p(99)<3000'],
          http_req_failed: ['rate<0.05'], // Allow 5% errors during spike
        },
      };

    case 'soak':
      return {
        ...baseOptions,
        stages: [
          { duration: '5m', target: 500 },     // Ramp up
          { duration: '24h', target: 500 },    // Soak for 24 hours
          { duration: '5m', target: 0 },       // Ramp down
        ],
        thresholds: {
          http_req_duration: ['p(95)<300', 'p(99)<1000'],
          http_req_failed: ['rate<0.01'],
        },
      };

    default:
      return baseOptions;
  }
}

// Test data
const TEST_USERS = [
  { email: 'fleet.manager@example.com', password: 'SecurePass123!' },
  { email: 'driver1@example.com', password: 'SecurePass123!' },
  { email: 'mechanic@example.com', password: 'SecurePass123!' },
];

// Setup: Run once per VU
export function setup() {
  console.log(`🚀 Starting ${TEST_MODE} load test against ${BASE_URL}`);
  console.log(`⏱️  Configuration: ${JSON.stringify(options.stages)}`);

  // Verify system is responsive
  const healthCheck = http.get(`${BASE_URL}/api/health`);
  check(healthCheck, {
    'system is healthy': (r) => r.status === 200,
  });

  return {
    startTime: new Date().toISOString(),
    testMode: TEST_MODE,
  };
}

// Main test scenario
export default function (data) {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  let authToken;

  // Group 1: Authentication
  group('Authentication', () => {
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'Login' },
    });

    const loginSuccess = check(loginRes, {
      'login successful': (r) => r.status === 200,
      'received auth token': (r) => r.json('token') !== undefined,
      'login duration < 500ms': (r) => r.timings.duration < 500,
    });

    if (!loginSuccess) {
      loginErrors.add(1);
      errorRate.add(1);
      return;
    }

    authToken = loginRes.json('token');
    apiResponseTime.add(loginRes.timings.duration);

    if (loginRes.timings.duration > 1000) {
      slowRequests.add(1);
    }
  });

  sleep(1);

  // Group 2: Read Operations (60% of traffic)
  group('Read Operations', () => {
    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    };

    // Get vehicles
    const vehiclesRes = http.get(`${BASE_URL}/api/vehicles`, {
      headers,
      tags: { name: 'Get Vehicles' },
    });

    const vehiclesSuccess = check(vehiclesRes, {
      'vehicles loaded': (r) => r.status === 200,
      'has vehicles array': (r) => Array.isArray(r.json('data')),
      'response time < 200ms': (r) => r.timings.duration < 200,
    });

    if (!vehiclesSuccess) {
      vehicleReadErrors.add(1);
      errorRate.add(1);
    }

    apiResponseTime.add(vehiclesRes.timings.duration);

    // Get maintenance records
    const maintenanceRes = http.get(`${BASE_URL}/api/maintenance`, {
      headers,
      tags: { name: 'Get Maintenance' },
    });

    check(maintenanceRes, {
      'maintenance loaded': (r) => r.status === 200,
    });

    // Get drivers
    const driversRes = http.get(`${BASE_URL}/api/drivers`, {
      headers,
      tags: { name: 'Get Drivers' },
    });

    check(driversRes, {
      'drivers loaded': (r) => r.status === 200,
    });

    // Dashboard analytics
    const analyticsRes = http.get(`${BASE_URL}/api/analytics/dashboard`, {
      headers,
      tags: { name: 'Get Analytics' },
    });

    check(analyticsRes, {
      'analytics loaded': (r) => r.status === 200,
      'analytics response < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(2);

  // Group 3: Write Operations (30% of traffic)
  if (Math.random() < 0.3) {
    group('Write Operations', () => {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      };

      // Create maintenance record
      const maintenancePayload = {
        vehicleId: Math.floor(Math.random() * 100) + 1,
        type: 'Oil Change',
        description: `Load test maintenance - ${Date.now()}`,
        scheduledDate: new Date().toISOString(),
        status: 'scheduled',
      };

      const createMaintenanceRes = http.post(
        `${BASE_URL}/api/maintenance`,
        JSON.stringify(maintenancePayload),
        {
          headers,
          tags: { name: 'Create Maintenance' },
        }
      );

      const createSuccess = check(createMaintenanceRes, {
        'maintenance created': (r) => r.status === 201,
        'has maintenance id': (r) => r.json('id') !== undefined,
      });

      if (!createSuccess) {
        dataCreationErrors.add(1);
        errorRate.add(1);
      }
    });
  }

  sleep(1);

  // Group 4: Search Operations (10% of traffic)
  if (Math.random() < 0.1) {
    group('Search Operations', () => {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
      };

      const searchRes = http.get(
        `${BASE_URL}/api/search?q=vehicle&type=all`,
        {
          headers,
          tags: { name: 'Global Search' },
        }
      );

      check(searchRes, {
        'search completed': (r) => r.status === 200,
        'search duration < 1s': (r) => r.timings.duration < 1000,
      });
    });
  }

  sleep(1);

  // Group 5: Document Operations (10% of traffic)
  if (Math.random() < 0.1) {
    group('Document Operations', () => {
      const headers = {
        'Authorization': `Bearer ${authToken}`,
      };

      const documentsRes = http.get(`${BASE_URL}/api/documents`, {
        headers,
        tags: { name: 'Get Documents' },
      });

      check(documentsRes, {
        'documents loaded': (r) => r.status === 200,
      });
    });
  }

  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}

// Teardown: Run once after all VUs complete
export function teardown(data) {
  console.log(`✅ ${TEST_MODE} load test completed`);
  console.log(`Started: ${data.startTime}`);
  console.log(`Ended: ${new Date().toISOString()}`);

  // Summary report
  console.log('\n📊 Test Summary:');
  console.log('==================');
  console.log(`Login Errors: ${loginErrors.value || 0}`);
  console.log(`Vehicle Read Errors: ${vehicleReadErrors.value || 0}`);
  console.log(`Data Creation Errors: ${dataCreationErrors.value || 0}`);
  console.log(`Slow Requests (>1s): ${slowRequests.value || 0}`);
}

/**
 * Example commands:
 *
 * Baseline test (100 users):
 * k6 run -e TEST_MODE=baseline -e BASE_URL=https://api.fleet.example.com k6-comprehensive-load-test.js
 *
 * Peak test (1000 users):
 * k6 run -e TEST_MODE=peak -e BASE_URL=https://api.fleet.example.com k6-comprehensive-load-test.js
 *
 * Spike test:
 * k6 run -e TEST_MODE=spike -e BASE_URL=https://api.fleet.example.com k6-comprehensive-load-test.js
 *
 * Soak test (24 hours):
 * k6 run -e TEST_MODE=soak -e BASE_URL=https://api.fleet.example.com k6-comprehensive-load-test.js
 *
 * With cloud results:
 * k6 cloud k6-comprehensive-load-test.js
 */
