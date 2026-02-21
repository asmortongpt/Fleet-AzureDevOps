/**
 * API Endpoint Health Tests
 * Verifies all REST API endpoints return 200 with success: true
 * MUST run with a fresh backend (before page-heavy test suites)
 * to avoid DB connection pool exhaustion.
 */
import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

const endpoints = [
  { path: '/api/vehicles', name: 'Vehicles' },
  { path: '/api/drivers', name: 'Drivers' },
  { path: '/api/work-orders', name: 'Work orders' },
  { path: '/api/communications', name: 'Communications' },
  { path: '/api/policies', name: 'Policies' },
  { path: '/api/safety-policies', name: 'Safety policies' },
  { path: '/api/compliance-records', name: 'Compliance records' },
  { path: '/api/tracking-devices', name: 'Tracking devices' },
  { path: '/api/policy-violations', name: 'Policy violations' },
  { path: '/api/security-events', name: 'Security events' },
  { path: '/api/fuel-transactions', name: 'Fuel transactions' },
  { path: '/api/routes', name: 'Routes' },
  { path: '/api/inspections', name: 'Inspections' },
  { path: '/api/incidents', name: 'Incidents' },
  { path: '/api/maintenance-schedules', name: 'Maintenance schedules' },
  { path: '/api/health', name: 'Health' },
];

test.describe('API Endpoint Health', () => {
  for (const ep of endpoints) {
    test(`${ep.name} endpoint returns data`, async ({ request }) => {
      const response = await request.get(`${API_URL}${ep.path}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    });
  }
});
