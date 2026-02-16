import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Gauge, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const TEST_DURATION = __ENV.TEST_DURATION || '14m';
const THINK_TIME = __ENV.THINK_TIME || 1; // seconds between requests

// Custom Metrics
const vehicleListDuration = new Trend('vehicle_list_duration');
const vehicleListErrors = new Counter('vehicle_list_errors');
const driverListDuration = new Trend('driver_list_duration');
const driverListErrors = new Counter('driver_list_errors');
const dashboardDuration = new Trend('dashboard_duration');
const dashboardErrors = new Counter('dashboard_errors');
const httpErrors = new Rate('http_errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 200 },  // Ramp to 200 users
    { duration: '5m', target: 200 },  // Stay at 200 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: [
      'p(50) < 200',    // 50% of requests < 200ms
      'p(95) < 500',    // 95% of requests < 500ms
      'p(99) < 1000',   // 99% of requests < 1000ms
    ],
    http_req_failed: ['rate < 0.001'],  // Less than 0.1% errors
    http_errors: ['rate < 0.001'],
  ],
  thinkTime: THINK_TIME,
};

export default function () {
  const userId = `user-${__VU}`;

  group('Fleet Operations', () => {
    // List vehicles
    group('List Vehicles', () => {
      const res = http.get(`${BASE_URL}/api/vehicles?limit=20&offset=0`);
      vehicleListDuration.add(res.timings.duration);

      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'has data': (r) => r.json('data.length') > 0,
      });

      if (!passed) {
        vehicleListErrors.add(1);
        httpErrors.add(1);
      }
    });

    sleep(THINK_TIME);

    // Get vehicle details
    group('Vehicle Detail', () => {
      const res = http.get(`${BASE_URL}/api/vehicles/1`);

      check(res, {
        'status is 200': (r) => r.status === 200,
        'has id': (r) => r.json('data.id'),
        'has vin': (r) => r.json('data.vin'),
      });
    });

    sleep(THINK_TIME);

    // Search vehicles
    group('Search Vehicles', () => {
      const res = http.get(`${BASE_URL}/api/vehicles?search=fleet&limit=20`);

      check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });
    });

    sleep(THINK_TIME);
  });

  group('Driver Operations', () => {
    // List drivers
    group('List Drivers', () => {
      const res = http.get(`${BASE_URL}/api/drivers?limit=20&offset=0`);
      driverListDuration.add(res.timings.duration);

      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
        'has data': (r) => r.json('data.length') > 0,
      });

      if (!passed) {
        driverListErrors.add(1);
        httpErrors.add(1);
      }
    });

    sleep(THINK_TIME);

    // Get driver details
    group('Driver Detail', () => {
      const res = http.get(`${BASE_URL}/api/drivers/1`);

      check(res, {
        'status is 200': (r) => r.status === 200,
        'has name': (r) => r.json('data.firstName'),
      });
    });

    sleep(THINK_TIME);

    // Driver performance
    group('Driver Performance', () => {
      const res = http.get(`${BASE_URL}/api/drivers/1/performance`);

      check(res, {
        'status is 200 or 404': (r) => r.status === 200 || r.status === 404,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });
    });

    sleep(THINK_TIME);
  });

  group('Dashboard', () => {
    // Fleet dashboard
    group('Fleet Metrics', () => {
      const res = http.get(`${BASE_URL}/api/analytics/fleet-metrics`);
      dashboardDuration.add(res.timings.duration);

      const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
      });

      if (!passed) {
        dashboardErrors.add(1);
        httpErrors.add(1);
      }
    });

    sleep(THINK_TIME);

    // Real-time tracking
    group('Real-time Tracking', () => {
      const res = http.get(`${BASE_URL}/api/vehicles/telemetry/current`);

      check(res, {
        'status is 200': (r) => r.status === 200,
        'response time < 500ms': (r) => r.timings.duration < 500,
      });
    });

    sleep(THINK_TIME);
  });

  group('Mixed Operations', () => {
    // Simulate various endpoints
    const endpoints = [
      `${BASE_URL}/api/vehicles?limit=5`,
      `${BASE_URL}/api/drivers?limit=5`,
      `${BASE_URL}/api/compliance/summary`,
      `${BASE_URL}/api/alerts?limit=10`,
    ];

    endpoints.forEach((endpoint) => {
      const res = http.get(endpoint);

      check(res, {
        'status is 2xx or 4xx': (r) => r.status >= 200 && r.status < 500,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
      });

      sleep(0.5);
    });
  });
}

export function teardown(data) {
  console.log('=== Test Summary ===');
  console.log(`Total HTTP Errors: ${httpErrors}`);
  console.log(`Vehicle List Errors: ${vehicleListErrors.value}`);
  console.log(`Driver List Errors: ${driverListErrors.value}`);
  console.log(`Dashboard Errors: ${dashboardErrors.value}`);
}
