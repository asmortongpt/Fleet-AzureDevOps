/**
 * K6 Load Testing Script for CTAFleet API
 * Tests API performance under various load conditions
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 50 },   // Ramp up to 50 users over 5 minutes
    { duration: '10m', target: 100 }, // Maintain 100 users for 10 minutes
    { duration: '5m', target: 200 },  // Spike to 200 users
    { duration: '5m', target: 50 },   // Ramp down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% requests < 500ms, 99% < 1s
    'http_req_failed': ['rate<0.01'],                  // Error rate < 1%
    'errors': ['rate<0.05'],                           // Custom error rate < 5%
  },
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';

// Test data
let authToken = '';
let tenantId = '';

// Setup function - runs once before tests
export function setup() {
  // Login to get auth token
  const loginPayload = JSON.stringify({
    email: __ENV.TEST_EMAIL || 'test@example.com',
    password: __ENV.TEST_PASSWORD || 'TestPassword123!',
  });

  const loginResponse = http.post(`${BASE_URL}${API_VERSION}/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginData = JSON.parse(loginResponse.body);

  return {
    token: loginData.token || 'test-token',
    tenantId: loginData.tenant_id || 'test-tenant-id',
  };
}

// Main test function
export default function (data) {
  authToken = data.token;
  tenantId = data.tenantId;

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  };

  // Group 1: Vehicle Operations
  group('Vehicle Operations', () => {
    // List vehicles
    group('List Vehicles', () => {
      const response = http.get(`${BASE_URL}${API_VERSION}/vehicles?page=1&pageSize=20`, {
        headers,
      });

      const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'returns array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.data);
          } catch {
            return false;
          }
        },
      });

      errorRate.add(!success);
      apiResponseTime.add(response.timings.duration);
      requestCount.add(1);
    });

    sleep(1);

    // Get single vehicle
    group('Get Vehicle Details', () => {
      const vehicleId = 'test-vehicle-id'; // In real test, use dynamic ID
      const response = http.get(`${BASE_URL}${API_VERSION}/vehicles/${vehicleId}`, {
        headers,
      });

      check(response, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
        'response time < 300ms': (r) => r.timings.duration < 300,
      });

      apiResponseTime.add(response.timings.duration);
    });

    sleep(1);

    // Create vehicle
    group('Create Vehicle', () => {
      const newVehicle = {
        vehicle_number: `V-${Date.now()}`,
        vin: `1HGBH41JXMN${Math.floor(Math.random() * 100000)}`,
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        status: 'active',
        tenant_id: tenantId,
      };

      const response = http.post(
        `${BASE_URL}${API_VERSION}/vehicles`,
        JSON.stringify(newVehicle),
        { headers }
      );

      check(response, {
        'status is 201': (r) => r.status === 201,
        'response time < 800ms': (r) => r.timings.duration < 800,
        'returns created vehicle': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.id !== undefined;
          } catch {
            return false;
          }
        },
      });

      apiResponseTime.add(response.timings.duration);
    });
  });

  sleep(2);

  // Group 2: Driver Operations
  group('Driver Operations', () => {
    const response = http.get(`${BASE_URL}${API_VERSION}/drivers?page=1&pageSize=20`, {
      headers,
    });

    check(response, {
      'drivers list status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(1);

  // Group 3: Maintenance Operations
  group('Maintenance Operations', () => {
    const response = http.get(`${BASE_URL}${API_VERSION}/work-orders?status=open`, {
      headers,
    });

    check(response, {
      'work orders status is 200': (r) => r.status === 200,
      'response time < 600ms': (r) => r.timings.duration < 600,
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(1);

  // Group 4: Fuel Transactions
  group('Fuel Transactions', () => {
    const response = http.get(`${BASE_URL}${API_VERSION}/fuel-transactions?limit=50`, {
      headers,
    });

    check(response, {
      'fuel transactions status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(1);

  // Group 5: Reports and Analytics
  group('Reports and Analytics', () => {
    const response = http.get(
      `${BASE_URL}${API_VERSION}/reports/fleet-summary`,
      { headers }
    );

    check(response, {
      'reports status is 200': (r) => r.status === 200,
      'response time < 1500ms': (r) => r.timings.duration < 1500, // Reports can be slower
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(2);

  // Group 6: Search Operations
  group('Search Operations', () => {
    const searchQuery = 'Ford';
    const response = http.get(
      `${BASE_URL}${API_VERSION}/search?q=${searchQuery}&type=vehicle`,
      { headers }
    );

    check(response, {
      'search status is 200': (r) => r.status === 200,
      'response time < 800ms': (r) => r.timings.duration < 800,
      'returns results': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.results);
        } catch {
          return false;
        }
      },
    });

    apiResponseTime.add(response.timings.duration);
  });

  sleep(1);
}

// Teardown function - runs once after tests
export function teardown(data) {
  // Cleanup test data if needed
  console.log('Test completed successfully');
}

// Handle different test scenarios
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

// Spike test scenario
export const spikeTest = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '30s', target: 500 }, // Sudden spike
    { duration: '1m', target: 500 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 0 },
  ],
};

// Stress test scenario
export const stressTest = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '10m', target: 200 },
    { duration: '10m', target: 300 },
    { duration: '5m', target: 400 },
    { duration: '5m', target: 0 },
  ],
};

// Soak test scenario (endurance)
export const soakTest = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '2h', target: 50 }, // Maintain load for 2 hours
    { duration: '5m', target: 0 },
  ],
};
