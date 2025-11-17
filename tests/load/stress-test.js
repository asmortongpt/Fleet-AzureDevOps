/**
 * Fleet Management System - Stress Test
 *
 * This test pushes the system beyond normal capacity to find breaking points
 * Gradually increases load until system starts degrading
 *
 * Usage: k6 run stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const successRate = new Rate('success_rate');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp to 50 users
    { duration: '2m', target: 100 },   // Ramp to 100 users
    { duration: '2m', target: 200 },   // Ramp to 200 users - stress level
    { duration: '2m', target: 300 },   // Ramp to 300 users - breaking point
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(99)<2000'], // 99% under 2s
    'success_rate': ['rate>0.90'],       // 90% success rate minimum
  },
};

const BASE_URL = __ENV.API_URL || 'http://fleet-api-service:3000';

export default function () {
  const credentials = JSON.stringify({
    email: 'admin@demofleet.com',
    password: 'Demo@123',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, credentials, {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginOk = check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  successRate.add(loginOk);
  responseTime.add(loginRes.timings.duration);

  if (!loginOk) {
    sleep(1);
    return;
  }

  const token = loginRes.json('token');
  const authHeaders = {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  };

  // Simulate realistic workload
  const endpoints = [
    '/api/vehicles',
    '/api/drivers',
    '/api/work-orders',
    '/api/fuel-transactions',
    '/api/routes',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const res = http.get(`${BASE_URL}${endpoint}`, authHeaders);

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });

  successRate.add(ok);
  responseTime.add(res.timings.duration);

  sleep(Math.random() * 3);
}
