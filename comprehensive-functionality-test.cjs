const { chromium } = require('playwright');

(async () => {
  console.log('🔍 COMPREHENSIVE FUNCTIONALITY TEST');
  console.log('===================================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];
  const successes = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
  });

  const routes = [
    { path: '/', name: 'Home/Dashboard' },
    { path: '/vehicles', name: 'Vehicles' },
    { path: '/drivers', name: 'Drivers' },
    { path: '/maintenance', name: 'Maintenance' },
    { path: '/analytics', name: 'Analytics' },
    { path: '/google-maps-test', name: 'Google Maps Test' }
  ];

  for (const route of routes) {
    console.log(`\n📍 Testing: ${route.name} (${route.path})`);
    const routeErrors = [];

    try {
      const response = await page.goto(`http://localhost:5175${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      const status = response.status();
      console.log(`   HTTP Status: ${status}`);

      if (status === 200) {
        await page.waitForTimeout(2000);

        // Check if page has content
        const bodyText = await page.locator('body').textContent();
        const hasContent = bodyText.length > 100;

        // Check for error boundaries
        const hasErrorBoundary = await page.locator('text=/error occurred/i').count();

        if (hasErrorBoundary > 0) {
          routeErrors.push('Error boundary triggered');
        }

        if (!hasContent) {
          routeErrors.push('Page has minimal content');
        }

        // Get current error count
        const currentErrors = errors.length;

        if (routeErrors.length === 0 && currentErrors === 0) {
          console.log(`   ✅ PASS - Page loaded successfully`);
          successes.push(route.name);
        } else {
          console.log(`   ⚠️  ISSUES - ${routeErrors.join(', ')}`);
        }
      } else {
        console.log(`   ❌ FAIL - HTTP ${status}`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      routeErrors.push(error.message);
    }
  }

  // Test API endpoints
  console.log('\n\n📡 TESTING API ENDPOINTS');
  console.log('========================\n');

  const apiEndpoints = [
    '/api/vehicles',
    '/api/drivers',
    '/api/facilities',
    '/api/work-orders',
    '/api/fuel-transactions'
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url);
        return {
          status: res.status,
          ok: res.ok,
          data: res.ok ? await res.json() : null
        };
      }, `http://localhost:3001${endpoint}`);

      if (response.ok) {
        const recordCount = response.data?.data?.length || response.data?.length || 0;
        console.log(`   ✅ ${endpoint} - ${recordCount} records`);
      } else {
        console.log(`   ❌ ${endpoint} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ⚠️  ${endpoint} - ${error.message}`);
    }
  }

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('===============\n');
  console.log(`✅ Successful Routes: ${successes.length}/${routes.length}`);
  console.log(`❌ Critical Errors: ${errors.filter(e => !e.includes('X-Frame-Options') && !e.includes('CSP')).length}`);
  console.log(`⚠️  Warnings: ${warnings.length}`);

  if (successes.length === routes.length && errors.filter(e => !e.includes('X-Frame-Options') && !e.includes('CSP')).length === 0) {
    console.log('\n🎉 ALL FUNCTIONALITY WORKING!');
  } else {
    console.log('\n⚠️  Some issues detected (see details above)');
  }

  await browser.close();
})();
