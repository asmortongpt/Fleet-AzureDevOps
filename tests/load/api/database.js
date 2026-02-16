import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Metrics
const largeQueryDuration = new Trend('large_query_duration');
const largeQueryErrors = new Counter('large_query_errors');
const concurrentUpdateDuration = new Trend('concurrent_update_duration');
const concurrentUpdateErrors = new Counter('concurrent_update_errors');
const aggregationDuration = new Trend('aggregation_duration');
const aggregationErrors = new Counter('aggregation_errors');
const errorRate = new Rate('db_error_rate');

export const options = {
  stages: [
    { duration: '1m', target: 30 },   // Warm up
    { duration: '5m', target: 60 },   // Database load
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: [
      'p(95) < 1000',  // Database queries can be slower
      'p(99) < 2000',
    ],
    http_req_failed: ['rate < 0.01'],
  },
};

export default function () {
  group('Database - Large Result Set', () => {
    // Request large paginated result
    const res = http.get(`${BASE_URL}/api/vehicles?limit=100&offset=0`);
    largeQueryDuration.add(res.timings.duration);

    const passed = check(res, {
      'large_query: status 200': (r) => r.status === 200,
      'large_query: response time < 1000ms': (r) => r.timings.duration < 1000,
      'large_query: has data': (r) => r.json('data') !== null,
    });

    if (!passed) {
      largeQueryErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Database - Complex Aggregation', () => {
    // Fleet metrics requires complex database aggregation
    const res = http.get(`${BASE_URL}/api/analytics/fleet-metrics`);
    aggregationDuration.add(res.timings.duration);

    const passed = check(res, {
      'aggregation: status 200': (r) => r.status === 200,
      'aggregation: response time < 1500ms': (r) =>
        r.timings.duration < 1500,
    });

    if (!passed) {
      aggregationErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Database - Concurrent List Requests', () => {
    // Multiple concurrent requests simulating connection pool pressure
    const responses = [];

    for (let i = 0; i < 3; i++) {
      const res = http.get(
        `${BASE_URL}/api/vehicles?limit=20&offset=${i * 20}`
      );
      responses.push(res);
    }

    // Check all responses
    for (const res of responses) {
      check(res, {
        'concurrent: status 200': (r) => r.status === 200,
      });
    }
  });

  sleep(1);

  group('Database - Sorted and Filtered Results', () => {
    // Query with sorting and filtering
    const res = http.get(
      `${BASE_URL}/api/drivers?status=active&sort=firstName&limit=50`
    );

    check(res, {
      'sorted_filtered: status 200': (r) => r.status === 200,
      'sorted_filtered: has data': (r) => r.json('data') !== null,
      'sorted_filtered: response time < 1000ms': (r) =>
        r.timings.duration < 1000,
    });
  });

  sleep(1);

  group('Database - Mixed Read/Write Patterns', () => {
    // Simulate read operations (all tests are read-only for safety)
    const readOps = [
      `${BASE_URL}/api/vehicles?limit=20`,
      `${BASE_URL}/api/drivers?limit=20`,
      `${BASE_URL}/api/compliance/summary`,
      `${BASE_URL}/api/analytics/fleet-metrics`,
    ];

    for (const op of readOps) {
      const res = http.get(op);

      check(res, {
        'read: status 2xx': (r) => r.status >= 200 && r.status < 300,
      });

      sleep(0.5);
    }
  });

  sleep(1);

  group('Database - Stress Index Usage', () => {
    // Test endpoints that use indexes heavily
    const indexedQueries = [
      `${BASE_URL}/api/vehicles?status=active`,
      `${BASE_URL}/api/drivers?status=active`,
      `${BASE_URL}/api/vehicles?vin=TEST`,
    ];

    for (const query of indexedQueries) {
      const res = http.get(query);

      check(res, {
        'index: status 200 or 404': (r) => r.status === 200 || r.status === 404,
        'index: response time < 500ms': (r) => r.timings.duration < 500,
      });

      sleep(0.5);
    }
  });

  sleep(1);
}

export function teardown(data) {
  console.log('=== Database Load Test Summary ===');
  console.log(`Large Query Errors: ${largeQueryErrors.value}`);
  console.log(`Concurrent Update Errors: ${concurrentUpdateErrors.value}`);
  console.log(`Aggregation Errors: ${aggregationErrors.value}`);
  console.log(`Overall DB Error Rate: ${errorRate.value}`);
  console.log('Note: Monitor connection pool usage during test');
}
