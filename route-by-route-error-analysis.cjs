const { chromium } = require('playwright');

(async () => {
  console.log('🔍 ROUTE-BY-ROUTE DETAILED ERROR ANALYSIS');
  console.log('=========================================\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const routeErrors = {};

  // Capture all console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const url = page.url();
      const route = url.split('localhost:5175')[1] || '/';
      if (!routeErrors[route]) routeErrors[route] = [];
      routeErrors[route].push(msg.text());
    }
  });

  page.on('pageerror', error => {
    const url = page.url();
    const route = url.split('localhost:5175')[1] || '/';
    if (!routeErrors[route]) routeErrors[route] = [];
    routeErrors[route].push(`PAGE ERROR: ${error.message}\n${error.stack}`);
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
    console.log('─'.repeat(50));

    try {
      await page.goto(`http://localhost:5175${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      await page.waitForTimeout(3000);

      // Check for error boundaries
      const errorBoundaryText = await page.locator('text=/error occurred/i').count();
      if (errorBoundaryText > 0) {
        console.log('   ❌ ERROR BOUNDARY TRIGGERED');
      }

      // Get unique errors for this route
      const routeKey = route.path;
      const errors = routeErrors[routeKey] || [];
      const uniqueErrors = [...new Set(errors)];

      console.log(`   Total Errors: ${uniqueErrors.length}`);

      if (uniqueErrors.length > 0) {
        console.log('\n   Top Errors:');
        uniqueErrors.slice(0, 3).forEach((err, i) => {
          const shortErr = err.substring(0, 150);
          console.log(`   ${i + 1}. ${shortErr}...`);
        });
      }

    } catch (error) {
      console.log(`   ❌ NAVIGATION ERROR: ${error.message}`);
    }
  }

  // Summary
  console.log('\n\n═══════════════════════════════════');
  console.log('📊 ERROR SUMMARY BY ROUTE');
  console.log('═══════════════════════════════════\n');

  Object.keys(routeErrors).forEach(route => {
    const uniqueErrors = [...new Set(routeErrors[route])];
    console.log(`${route}: ${uniqueErrors.length} unique errors`);
  });

  await browser.close();
})();
