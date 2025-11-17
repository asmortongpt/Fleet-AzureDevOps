/**
 * Fleet Management System - Spike Test
 *
 * Tests system behavior under sudden traffic spikes
 * Simulates scenarios like: Black Friday, marketing campaign, DDoS attack
 *
 * Usage: k6 run spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal load
    { duration: '10s', target: 500 },  // SPIKE! 50x increase
    { duration: '1m', target: 500 },   // Maintain spike
    { duration: '30s', target: 10 },   // Drop back to normal
    { duration: '30s', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // Allow higher latency during spike
    'http_req_failed': ['rate<0.05'],    // Up to 5% errors acceptable
  },
};

const BASE_URL = __ENV.API_URL || 'http://fleet-api-service:3000';

export default function () {
  // Test health endpoint during spike
  const healthRes = http.get(`${BASE_URL}/api/health`);

  check(healthRes, {
    'health check responds': (r) => r.status === 200,
    'health check fast': (r) => r.timings.duration < 1000,
  });

  // Try to login (most auth systems get hit hard during attacks)
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: 'admin@demofleet.com',
      password: 'Demo@123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'login responds': (r) => r.status !== 0,
    'login not timing out': (r) => r.timings.duration < 5000,
  });

  sleep(0.5);
}
