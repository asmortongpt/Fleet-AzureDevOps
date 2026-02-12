// k6 Stress Test - Find System Breaking Point
// Run with: k6 run stress-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '5m', target: 100 },   // Stay at 100
    { duration: '2m', target: 200 },   // Ramp to 200
    { duration: '5m', target: 200 },   // Stay at 200
    { duration: '2m', target: 300 },   // Ramp to 300
    { duration: '5m', target: 300 },   // Stay at 300
    { duration: '2m', target: 400 },   // Ramp to 400 (likely breaking point)
    { duration: '5m', target: 400 },   // Stay at 400
    { duration: '5m', target: 0 },     // Ramp down
  ],

  thresholds: {
    // Allow higher error rates during stress test
    http_req_failed: ['rate<0.1'],
    http_req_duration: ['p(95)<2000'], // More lenient threshold
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

export default function () {
  const responses = http.batch([
    ['GET', `${BASE_URL}/api/products?page=1&limit=20`],
    ['GET', `${BASE_URL}/api/products?search=tire`],
    ['GET', `${BASE_URL}/health`],
  ]);

  responses.forEach((response) => {
    const success = check(response, {
      'status < 500': (r) => r.status < 500,
    });
    errorRate.add(!success);
  });

  sleep(1);
}

export function setup() {
  console.log('Starting STRESS test - finding breaking point');
  console.log(`Target: ${BASE_URL}`);
  console.log('Will ramp up to 400 concurrent users');
}
