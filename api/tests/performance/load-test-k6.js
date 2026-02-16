import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

/**
 * k6 Load Testing Script
 * Tests API under concurrent user load
 *
 * Run with: k6 run load-test-k6.js
 * Or with custom parameters: k6 run -u 100 -d 5m load-test-k6.js
 */

// Custom metrics
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration');
const requestCount = new Counter('request_count');
const activeConnections = new Gauge('active_connections');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Test stages - ramp up, stay, ramp down
export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '3m', target: 50 }, // Ramp down to 50 users
    { duration: '1m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    errors: ['rate<0.1'], // error rate must be less than 10%
    request_duration: ['p(95)<1000', 'p(99)<2000'], // 95% must be under 1s, 99% under 2s
  },
};

// Helper function to make requests
function makeRequest(method, endpoint, body = null, tags = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(AUTH_TOKEN && { Authorization: `Bearer ${AUTH_TOKEN}` }),
  };

  const params = { tags: tags, timeout: '10s' };
  const startTime = Date.now();
  const res =
    method === 'GET'
      ? http.get(url, params)
      : method === 'POST'
        ? http.post(url, JSON.stringify(body), { ...params, headers })
        : method === 'PUT'
          ? http.put(url, JSON.stringify(body), { ...params, headers })
          : http.del(url, params);

  const duration = Date.now() - startTime;
  requestDuration.add(duration, { endpoint: endpoint.split('/')[1] });
  requestCount.add(1, { endpoint: endpoint.split('/')[1] });

  return res;
}

export default function () {
  // Track active connections
  activeConnections.set(__VU);

  // Test vehicle endpoints
  group('Vehicle Endpoints', function () {
    // List vehicles
    let res = makeRequest('GET', '/api/v1/vehicles?limit=50', null, {
      endpoint: 'list_vehicles',
    });

    check(res, {
      'vehicles list status is 200': (r) => r.status === 200,
      'vehicles list has body': (r) => r.body.length > 0,
      'vehicles list response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }

    sleep(1);

    // Get vehicle details (if ID exists in response)
    try {
      const vehicleId = 1; // Use a valid ID from your test data
      res = makeRequest('GET', `/api/v1/vehicles/${vehicleId}`, null, {
        endpoint: 'get_vehicle',
      });

      check(res, {
        'vehicle detail status is 200': (r) => r.status === 200,
        'vehicle detail response time < 300ms': (r) => r.timings.duration < 300,
      });

      if (res.status !== 200) {
        errorRate.add(1);
      }
    } catch (e) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test driver endpoints
  group('Driver Endpoints', function () {
    const res = makeRequest('GET', '/api/v1/drivers?limit=50', null, {
      endpoint: 'list_drivers',
    });

    check(res, {
      'drivers list status is 200': (r) => r.status === 200,
      'drivers list has body': (r) => r.body.length > 0,
      'drivers list response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test GPS tracking endpoints
  group('GPS Tracking', function () {
    const res = makeRequest('GET', '/api/v1/gps/track?limit=50', null, {
      endpoint: 'gps_track',
    });

    check(res, {
      'gps track status is 200': (r) => r.status === 200,
      'gps track response time < 300ms': (r) => r.timings.duration < 300,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test fuel transactions
  group('Fuel Transactions', function () {
    const res = makeRequest('GET', '/api/v1/fuel/transactions?limit=50', null, {
      endpoint: 'fuel_transactions',
    });

    check(res, {
      'fuel transactions status is 200': (r) => r.status === 200,
      'fuel transactions response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test maintenance records
  group('Maintenance Records', function () {
    const res = makeRequest(
      'GET',
      '/api/v1/maintenance/records?limit=50',
      null,
      { endpoint: 'maintenance_records' }
    );

    check(res, {
      'maintenance records status is 200': (r) => r.status === 200,
      'maintenance records response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test search endpoint
  group('Search', function () {
    const res = makeRequest('GET', '/api/v1/search?q=vehicle', null, {
      endpoint: 'search',
    });

    check(res, {
      'search status is 200': (r) => r.status === 200 || r.status === 400,
      'search response time < 1000ms': (r) => r.timings.duration < 1000,
    });

    if (res.status !== 200 && res.status !== 400) {
      errorRate.add(1);
    }

    sleep(1);
  });

  // Test health check
  group('Health Check', function () {
    const res = makeRequest('GET', '/api/v1/health', null, {
      endpoint: 'health',
    });

    check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });

    if (res.status !== 200) {
      errorRate.add(1);
    }
  });

  sleep(2);
}
