// k6 Load Testing Script for API Endpoints
// Run with: k6 run api-load-test.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successfulRequests = new Counter('successful_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],

  thresholds: {
    // HTTP errors should be less than 1%
    http_req_failed: ['rate<0.01'],

    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500'],

    // 99% of requests should be below 1000ms
    'http_req_duration{expected_response:true}': ['p(99)<1000'],

    // Custom error rate threshold
    errors: ['rate<0.01'],
  },
};

// Base URL (can be overridden with -e BASE_URL=...)
const BASE_URL = __ENV.BASE_URL || 'https://api.example.com';

// Test data
const productIds = ['550e8400-e29b-41d4-a716-446655440000']; // Replace with real IDs

export default function () {
  // Group 1: Product Listing
  group('Product Listing', function () {
    const listResponse = http.get(`${BASE_URL}/api/products?page=1&limit=20`, {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'ListProducts' },
    });

    const listSuccess = check(listResponse, {
      'status is 200': (r) => r.status === 200,
      'has products array': (r) => JSON.parse(r.body).products !== undefined,
      'has pagination': (r) => JSON.parse(r.body).pagination !== undefined,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    errorRate.add(!listSuccess);
    apiDuration.add(listResponse.timings.duration);

    if (listSuccess) {
      successfulRequests.add(1);
    }
  });

  sleep(1);

  // Group 2: Product Details
  group('Product Details', function () {
    if (productIds.length > 0) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const detailResponse = http.get(`${BASE_URL}/api/products/${productId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        tags: { name: 'GetProduct' },
      });

      const detailSuccess = check(detailResponse, {
        'status is 200': (r) => r.status === 200,
        'has product object': (r) => JSON.parse(r.body).product !== undefined,
        'response time < 300ms': (r) => r.timings.duration < 300,
      });

      errorRate.add(!detailSuccess);
      apiDuration.add(detailResponse.timings.duration);

      if (detailSuccess) {
        successfulRequests.add(1);
      }
    }
  });

  sleep(2);

  // Group 3: Search Products
  group('Product Search', function () {
    const searchTerms = ['tire', 'wheel', 'michelin', 'goodyear'];
    const searchTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const searchResponse = http.get(`${BASE_URL}/api/products?search=${searchTerm}&limit=10`, {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'SearchProducts' },
    });

    const searchSuccess = check(searchResponse, {
      'status is 200': (r) => r.status === 200,
      'response time < 800ms': (r) => r.timings.duration < 800,
    });

    errorRate.add(!searchSuccess);
    apiDuration.add(searchResponse.timings.duration);

    if (searchSuccess) {
      successfulRequests.add(1);
    }
  });

  sleep(1);
}

// Setup function - runs once before the test
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log('Test duration: ~18 minutes');
  console.log('Max concurrent users: 100');

  // Health check
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`Health check failed: ${healthCheck.status}`);
  }

  console.log('Health check passed ✓');
  return { startTime: new Date() };
}

// Teardown function - runs once after the test
export function teardown(data) {
  const endTime = new Date();
  const duration = (endTime - data.startTime) / 1000;
  console.log(`Test completed in ${duration.toFixed(2)} seconds`);
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data, null, 2),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  return `
${indent}Load Test Summary
${indent}================
${indent}
${indent}Total Requests: ${data.metrics.http_reqs.values.count}
${indent}Failed Requests: ${data.metrics.http_req_failed.values.passes}
${indent}Request Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)}/s
${indent}
${indent}Response Times:
${indent}  avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
${indent}  p50: ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms
${indent}  p95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
${indent}  p99: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms
${indent}  max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms
${indent}
${indent}Virtual Users:
${indent}  max: ${data.metrics.vus_max.values.max}
${indent}`;
}
