import { test, expect } from '@playwright/test';

const BASE_URL = 'https://fleet.capitaltechalliance.com';

test.describe('Enterprise Endpoints - Authentication Required', () => {
  const endpoints = [
    { name: 'OSHA Compliance', path: '/api/osha-compliance' },
    { name: 'Communications', path: '/api/communications' },
    { name: 'Policy Templates', path: '/api/policy-templates' },
    { name: 'Documents', path: '/api/documents' }
  ];

  for (const endpoint of endpoints) {
    test(`${endpoint.name} endpoint should require authentication`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${endpoint.path}`);

      // Should return 401 status
      expect(response.status()).toBe(401);

      // Should return JSON with authentication error
      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toMatch(/authentication required/i);

      console.log(`✅ ${endpoint.name}: ${response.status()} - ${JSON.stringify(body)}`);
    });
  }

  test('All enterprise endpoints should be accessible simultaneously', async ({ request }) => {
    const promises = endpoints.map(endpoint =>
      request.get(`${BASE_URL}${endpoint.path}`)
    );

    const responses = await Promise.all(promises);

    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const endpoint = endpoints[i];

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty('error');
      expect(body.error).toMatch(/authentication required/i);

      console.log(`✅ ${endpoint.name} (concurrent): ${response.status()}`);
    }
  });

  test('Enterprise endpoints should return correct content-type', async ({ request }) => {
    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint.path}`);

      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');

      console.log(`✅ ${endpoint.name} content-type: ${contentType}`);
    }
  });

  test('Enterprise endpoints should not expose internal errors', async ({ request }) => {
    for (const endpoint of endpoints) {
      const response = await request.get(`${BASE_URL}${endpoint.path}`);

      const body = await response.json();

      // Should not expose stack traces or internal paths
      expect(JSON.stringify(body)).not.toContain('node_modules');
      expect(JSON.stringify(body)).not.toContain('dist/');
      expect(JSON.stringify(body)).not.toContain('Error:');

      console.log(`✅ ${endpoint.name}: No internal errors exposed`);
    }
  });

  test('Health endpoint should still be accessible', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status', 'healthy');

    console.log(`✅ Health endpoint: ${JSON.stringify(body)}`);
  });
});

test.describe('Enterprise Endpoints - Error Handling', () => {
  test('Invalid endpoint should return 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/nonexistent-endpoint`);

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body).toHaveProperty('error');

    console.log(`✅ 404 handling: ${JSON.stringify(body)}`);
  });

  test('Enterprise endpoints should handle OPTIONS requests (CORS)', async ({ request }) => {
    const endpoint = '/api/osha-compliance';
    const response = await request.fetch(`${BASE_URL}${endpoint}`, {
      method: 'OPTIONS'
    });

    // Should allow OPTIONS requests
    expect([200, 204]).toContain(response.status());

    console.log(`✅ CORS OPTIONS: ${response.status()}`);
  });
});

test.describe('Enterprise Endpoints - Response Time', () => {
  test('All endpoints should respond within acceptable time', async ({ request }) => {
    const maxResponseTime = 3000; // 3 seconds

    for (const endpoint of [
      '/api/osha-compliance',
      '/api/communications',
      '/api/policy-templates',
      '/api/documents'
    ]) {
      const startTime = Date.now();
      const response = await request.get(`${BASE_URL}${endpoint}`);
      const responseTime = Date.now() - startTime;

      expect(response.status()).toBe(401);
      expect(responseTime).toBeLessThan(maxResponseTime);

      console.log(`✅ ${endpoint}: ${responseTime}ms (< ${maxResponseTime}ms)`);
    }
  });
});
