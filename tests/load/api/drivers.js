import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Metrics
const listDuration = new Trend('drivers_list_duration');
const listErrors = new Counter('drivers_list_errors');
const performanceDuration = new Trend('drivers_performance_duration');
const performanceErrors = new Counter('drivers_performance_errors');
const complianceDuration = new Trend('drivers_compliance_duration');
const complianceErrors = new Counter('drivers_compliance_errors');
const errorRate = new Rate('drivers_error_rate');

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Warm up
    { duration: '5m', target: 100 },  // Normal load
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: [
      'p(95) < 500',
      'p(99) < 1000',
    ],
    http_req_failed: ['rate < 0.001'],
  },
};

export default function () {
  group('Drivers - List', () => {
    const params = {
      limit: 20,
      offset: (__VU % 10) * 20,
    };

    const res = http.get(`${BASE_URL}/api/drivers`, {
      params: params,
    });

    listDuration.add(res.timings.duration);

    const passed = check(res, {
      'list: status 200': (r) => r.status === 200,
      'list: has data array': (r) => r.json('data') !== null,
      'list: response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (!passed) {
      listErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Drivers - Search', () => {
    const searchTerms = [
      'john',
      'jane',
      'driver',
      'smith',
      'test',
    ];

    const term = searchTerms[__VU % searchTerms.length];
    const res = http.get(`${BASE_URL}/api/drivers?search=${term}&limit=20`);

    check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: has data': (r) => r.json('data') !== null,
      'search: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  group('Drivers - Filter by Status', () => {
    const statuses = [
      'active',
      'inactive',
      'on-leave',
    ];

    const status = statuses[__VU % statuses.length];
    const res = http.get(
      `${BASE_URL}/api/drivers?status=${status}&limit=20`
    );

    check(res, {
      'filter: status 200': (r) => r.status === 200,
      'filter: has data': (r) => r.json('data') !== null,
    });
  });

  sleep(1);

  group('Drivers - Detail', () => {
    const driverId = (__VU % 50) + 1;
    const res = http.get(`${BASE_URL}/api/drivers/${driverId}`);

    check(res, {
      'detail: status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'detail: response time < 300ms': (r) => r.timings.duration < 300,
    });
  });

  sleep(1);

  group('Drivers - Performance Metrics', () => {
    const driverId = (__VU % 50) + 1;
    const res = http.get(`${BASE_URL}/api/drivers/${driverId}/performance`);

    performanceDuration.add(res.timings.duration);

    const passed = check(res, {
      'performance: status 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
      'performance: response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (!passed && res.status !== 404) {
      performanceErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Drivers - Compliance Status', () => {
    const driverId = (__VU % 50) + 1;
    const res = http.get(`${BASE_URL}/api/compliance/drivers/${driverId}`);

    complianceDuration.add(res.timings.duration);

    const passed = check(res, {
      'compliance: status 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
      'compliance: response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (!passed && res.status !== 404) {
      complianceErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Drivers - Violations', () => {
    const driverId = (__VU % 50) + 1;
    const res = http.get(
      `${BASE_URL}/api/drivers/${driverId}/violations?limit=20`
    );

    check(res, {
      'violations: status 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
      'violations: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  group('Drivers - Summary', () => {
    const res = http.get(`${BASE_URL}/api/drivers/summary`);

    check(res, {
      'summary: status 200': (r) => r.status === 200,
      'summary: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('=== Drivers API Test Summary ===');
  console.log(`List Errors: ${listErrors.value}`);
  console.log(`Performance Errors: ${performanceErrors.value}`);
  console.log(`Compliance Errors: ${complianceErrors.value}`);
  console.log(`Overall Error Rate: ${errorRate.value}`);
}
