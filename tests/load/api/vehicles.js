import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Metrics
const listDuration = new Trend('vehicles_list_duration');
const listErrors = new Counter('vehicles_list_errors');
const searchDuration = new Trend('vehicles_search_duration');
const searchErrors = new Counter('vehicles_search_errors');
const detailDuration = new Trend('vehicles_detail_duration');
const detailErrors = new Counter('vehicles_detail_errors');
const errorRate = new Rate('vehicles_error_rate');

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
  group('Vehicles - List', () => {
    const params = {
      limit: 20,
      offset: (__VU % 10) * 20, // Paginate across VUs
    };

    const res = http.get(`${BASE_URL}/api/vehicles`, {
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

  group('Vehicles - Search', () => {
    const searchTerms = [
      'fleet',
      'transit',
      'delivery',
      'service',
      'test',
    ];

    const term = searchTerms[__VU % searchTerms.length];
    const res = http.get(`${BASE_URL}/api/vehicles?search=${term}&limit=20`);

    searchDuration.add(res.timings.duration);

    const passed = check(res, {
      'search: status 200': (r) => r.status === 200,
      'search: response time < 500ms': (r) => r.timings.duration < 500,
    });

    if (!passed) {
      searchErrors.add(1);
      errorRate.add(1);
    } else {
      errorRate.add(0);
    }
  });

  sleep(1);

  group('Vehicles - Filter by Status', () => {
    const statuses = [
      'active',
      'inactive',
      'maintenance',
    ];

    const status = statuses[__VU % statuses.length];
    const res = http.get(
      `${BASE_URL}/api/vehicles?status=${status}&limit=20`
    );

    check(res, {
      'filter: status 200': (r) => r.status === 200,
      'filter: has data': (r) => r.json('data') !== null,
    });
  });

  sleep(1);

  group('Vehicles - Detail', () => {
    const vehicleId = (__VU % 50) + 1; // Cycle through vehicle IDs
    const res = http.get(`${BASE_URL}/api/vehicles/${vehicleId}`);

    detailDuration.add(res.timings.duration);

    const passed = check(res, {
      'detail: status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'detail: response time < 300ms': (r) => r.timings.duration < 300,
    });

    if (!passed) {
      detailErrors.add(1);
      errorRate.add(1);
    } else {
      if (res.status !== 404) {
        errorRate.add(0);
      }
    }
  });

  sleep(1);

  group('Vehicles - Telemetry', () => {
    const vehicleId = (__VU % 50) + 1;
    const res = http.get(`${BASE_URL}/api/vehicles/${vehicleId}/telemetry`);

    check(res, {
      'telemetry: status 200 or 404': (r) =>
        r.status === 200 || r.status === 404,
      'telemetry: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);

  group('Vehicles - Geofence Alerts', () => {
    const res = http.get(`${BASE_URL}/api/vehicles/geofence/alerts?limit=20`);

    check(res, {
      'geofence: status 200': (r) => r.status === 200,
      'geofence: response time < 500ms': (r) => r.timings.duration < 500,
    });
  });

  sleep(1);
}

export function teardown(data) {
  console.log('=== Vehicles API Test Summary ===');
  console.log(`List Errors: ${listErrors.value}`);
  console.log(`Search Errors: ${searchErrors.value}`);
  console.log(`Detail Errors: ${detailErrors.value}`);
  console.log(`Overall Error Rate: ${errorRate.value}`);
}
