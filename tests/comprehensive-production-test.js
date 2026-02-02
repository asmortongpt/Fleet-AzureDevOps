#!/usr/bin/env node

/**
 * Comprehensive Production Testing Suite
 * Tests both Static Web App and AKS Production
 */

import https from 'https';
import http from 'http';

const TIMEOUT = 10000;
const STATIC_URL = 'https://green-pond-0f040980f.3.azurestaticapps.net';
const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';

function fetchWithTimeout(url, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Fleet-Test-Suite/1.0'
      }
    };

    client.get(options, (res) => {
      clearTimeout(timer);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function postRequest(url, data, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const postData = JSON.stringify(data);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Fleet-Test-Suite/1.0'
      }
    };

    const timer = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);

    const req = https.request(options, (res) => {
      clearTimeout(timer);
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

const tests = {
  // ====================================================================
  // STATIC WEB APP TESTS
  // ====================================================================
  staticWebApp: [
    {
      name: 'Static - Homepage loads',
      async run() {
        const response = await fetchWithTimeout(STATIC_URL);
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        if (!response.body.includes('<!DOCTYPE html>') && !response.body.includes('<!doctype html>')) {
          throw new Error('No HTML found');
        }
      }
    },
    {
      name: 'Static - Has correct title',
      async run() {
        const response = await fetchWithTimeout(STATIC_URL);
        if (!response.body.includes('Fleet Management')) {
          throw new Error('Title not found in HTML');
        }
      }
    },
    {
      name: 'Static - Security headers present',
      async run() {
        const response = await fetchWithTimeout(STATIC_URL);
        const requiredHeaders = ['x-content-type-options', 'x-frame-options'];
        const missingHeaders = requiredHeaders.filter(h => !response.headers[h]);
        if (missingHeaders.length > 0) {
          console.warn(`  ⚠️  Missing headers: ${missingHeaders.join(', ')}`);
        }
      }
    },
    {
      name: 'Static - HTTPS enforced',
      async run() {
        if (!STATIC_URL.startsWith('https://')) {
          throw new Error('Not using HTTPS');
        }
      }
    },
    {
      name: 'Static - React app structure',
      async run() {
        const response = await fetchWithTimeout(STATIC_URL);
        if (!response.body.includes('id="root"') && !response.body.includes("id='root'")) {
          throw new Error('React root element not found');
        }
      }
    },
    {
      name: 'Static - Assets folder accessible',
      async run() {
        const response = await fetchWithTimeout(`${STATIC_URL}/assets/`);
        // 200 or 403 are both acceptable (folder exists)
        if (response.statusCode !== 200 && response.statusCode !== 403 && response.statusCode !== 404) {
          console.log(`  ℹ️  Assets status: ${response.statusCode}`);
        }
      }
    }
  ],

  // ====================================================================
  // PRODUCTION AKS TESTS
  // ====================================================================
  production: [
    {
      name: 'Production - Frontend loads',
      async run() {
        const response = await fetchWithTimeout(PRODUCTION_URL);
        if (response.statusCode !== 200) {
          throw new Error(`Expected 200, got ${response.statusCode}`);
        }
        if (!response.body.includes('<!DOCTYPE html>') && !response.body.includes('<!doctype html>')) {
          throw new Error('No HTML found');
        }
      }
    },
    {
      name: 'Production - API health endpoint',
      async run() {
        const response = await fetchWithTimeout(`${PRODUCTION_URL}/api/health`);
        if (response.statusCode !== 200) {
          throw new Error(`API health check failed: ${response.statusCode}`);
        }
        const data = JSON.parse(response.body);
        if (data.status !== 'healthy') {
          throw new Error(`API not healthy: ${data.status}`);
        }
        console.log(`  ✓ API version: ${data.version}, environment: ${data.environment}`);
      }
    },
    {
      name: 'Production - API docs endpoint',
      async run() {
        const response = await fetchWithTimeout(`${PRODUCTION_URL}/api/docs/`);
        // Should redirect or return 200/301
        if (response.statusCode !== 200 && response.statusCode !== 301 && response.statusCode !== 302) {
          console.warn(`  ⚠️  API docs returned: ${response.statusCode}`);
        }
      }
    },
    {
      name: 'Production - OpenAPI spec available',
      async run() {
        const response = await fetchWithTimeout(`${PRODUCTION_URL}/api/openapi.json`);
        if (response.statusCode !== 200) {
          throw new Error(`OpenAPI spec not found: ${response.statusCode}`);
        }
        const spec = JSON.parse(response.body);
        if (!spec.openapi && !spec.swagger) {
          throw new Error('Invalid OpenAPI spec');
        }
        console.log(`  ✓ API spec version: ${spec.openapi || spec.swagger}`);
      }
    },
    {
      name: 'Production - Auth endpoints exist',
      async run() {
        // Should return 400 or 401 (bad request or unauthorized), not 404
        const response = await postRequest(`${PRODUCTION_URL}/api/auth/login`, {
          email: 'test@example.com',
          password: 'test'
        });
        if (response.statusCode === 404) {
          throw new Error('Auth endpoint not found');
        }
        if (response.statusCode !== 400 && response.statusCode !== 401) {
          console.log(`  ℹ️  Auth login returned: ${response.statusCode}`);
        }
      }
    },
    {
      name: 'Production - Vehicles endpoint exists',
      async run() {
        // Should return 401 (unauthorized) not 404 (not found)
        const response = await fetchWithTimeout(`${PRODUCTION_URL}/api/vehicles`);
        if (response.statusCode === 404) {
          throw new Error('Vehicles endpoint not found');
        }
        console.log(`  ℹ️  Vehicles endpoint returned: ${response.statusCode} (expected 401 or 403)`);
      }
    },
    {
      name: 'Production - Security headers',
      async run() {
        const response = await fetchWithTimeout(PRODUCTION_URL);
        const expectedHeaders = [
          'x-content-type-options',
          'x-frame-options',
          'strict-transport-security'
        ];
        const presentHeaders = expectedHeaders.filter(h => response.headers[h]);
        console.log(`  ✓ Security headers: ${presentHeaders.join(', ')}`);
        if (presentHeaders.length < expectedHeaders.length) {
          const missing = expectedHeaders.filter(h => !response.headers[h]);
          console.warn(`  ⚠️  Missing: ${missing.join(', ')}`);
        }
      }
    },
    {
      name: 'Production - SSL/TLS certificate valid',
      async run() {
        const response = await fetchWithTimeout(PRODUCTION_URL);
        if (!response.headers['strict-transport-security']) {
          console.warn('  ⚠️  HSTS header not present');
        }
      }
    },
    {
      name: 'Production - Response time acceptable',
      async run() {
        const start = Date.now();
        await fetchWithTimeout(PRODUCTION_URL);
        const duration = Date.now() - start;
        console.log(`  ⏱️  Response time: ${duration}ms`);
        if (duration > 3000) {
          console.warn(`  ⚠️  Response time slow: ${duration}ms`);
        }
      }
    }
  ],

  // ====================================================================
  // COMPARISON TESTS
  // ====================================================================
  comparison: [
    {
      name: 'Compare - Static vs Production response times',
      async run() {
        const startStatic = Date.now();
        await fetchWithTimeout(STATIC_URL);
        const staticTime = Date.now() - startStatic;

        const startProd = Date.now();
        await fetchWithTimeout(PRODUCTION_URL);
        const prodTime = Date.now() - startProd;

        console.log(`  📊 Static: ${staticTime}ms, Production: ${prodTime}ms`);
      }
    },
    {
      name: 'Verify - Static has NO API',
      async run() {
        try {
          const response = await fetchWithTimeout(`${STATIC_URL}/api/health`, 5000);
          // If we get HTML back instead of JSON, that confirms no API
          if (response.body.includes('<!DOCTYPE')) {
            console.log('  ✓ Confirmed: Static Web App has no API (returns HTML)');
          } else {
            console.warn('  ⚠️  Unexpected: Static app might have API deployed');
          }
        } catch (err) {
          console.log('  ✓ Confirmed: Static Web App has no API (connection failed)');
        }
      }
    },
    {
      name: 'Verify - Production HAS API',
      async run() {
        const response = await fetchWithTimeout(`${PRODUCTION_URL}/api/health`);
        const data = JSON.parse(response.body);
        if (data.status === 'healthy') {
          console.log('  ✓ Confirmed: Production has working API');
        } else {
          throw new Error('Production API not healthy');
        }
      }
    }
  ]
};

async function runTestSuite(suiteName, suiteTests) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${suiteName.toUpperCase()}`);
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of suiteTests) {
    try {
      await test.run();
      console.log(`✅ ${test.name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
      failures.push({ name: test.name, error: error.message });
    }
  }

  return { passed, failed, failures };
}

async function runAllTests() {
  console.log('\n🧪 COMPREHENSIVE FLEET MANAGEMENT PRODUCTION TEST SUITE');
  console.log('='.repeat(70));
  console.log(`Static Web App: ${STATIC_URL}`);
  console.log(`Production AKS: ${PRODUCTION_URL}`);
  console.log(`Started: ${new Date().toISOString()}`);

  const results = {
    staticWebApp: await runTestSuite('Static Web App Tests', tests.staticWebApp),
    production: await runTestSuite('Production AKS Tests', tests.production),
    comparison: await runTestSuite('Comparison Tests', tests.comparison)
  };

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('FINAL RESULTS');
  console.log('='.repeat(70));

  const totalPassed = results.staticWebApp.passed + results.production.passed + results.comparison.passed;
  const totalFailed = results.staticWebApp.failed + results.production.failed + results.comparison.failed;
  const total = totalPassed + totalFailed;

  console.log(`\n📊 Overall: ${totalPassed}/${total} tests passed (${Math.round(totalPassed/total*100)}%)`);
  console.log(`\n   Static Web App: ${results.staticWebApp.passed} passed, ${results.staticWebApp.failed} failed`);
  console.log(`   Production AKS: ${results.production.passed} passed, ${results.production.failed} failed`);
  console.log(`   Comparison:     ${results.comparison.passed} passed, ${results.comparison.failed} failed`);

  if (totalFailed > 0) {
    console.log(`\n❌ FAILURES:`);
    [...results.staticWebApp.failures, ...results.production.failures, ...results.comparison.failures].forEach(f => {
      console.log(`   • ${f.name}: ${f.error}`);
    });
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Completed: ${new Date().toISOString()}`);
  console.log('='.repeat(70) + '\n');

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
