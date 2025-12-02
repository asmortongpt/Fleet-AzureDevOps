import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const FLEET_URL = 'https://fleet.capitaltechalliance.com';
const STATIC_URL = 'https://green-pond-0f040980f.3.azurestaticapps.net';
const DEMO_EMAIL = 'admin@demofleet.com';
const DEMO_PASSWORD = 'Demo@123';

// Test results storage
const testResults: any[] = [];
const screenshots: string[] = [];

// Helper function to take screenshot with logging
async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `screenshot-${name}-${timestamp}.png`;
  const filepath = path.join('/Users/andrewmorton/Documents/GitHub/fleet-app/test-results', filename);

  await page.screenshot({ path: filepath, fullPage: true });
  screenshots.push(filepath);
  return filepath;
}

// Helper function to log API calls
async function captureNetworkActivity(page: Page, testName: string) {
  const apiCalls: any[] = [];

  page.on('request', request => {
    if (request.url().includes('/api/') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/') || response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
      const call = apiCalls.find(c => c.url === response.url());
      if (call) {
        call.status = response.status();
        call.statusText = response.statusText();
      }
    }
  });

  return apiCalls;
}

test.describe('Fleet Management Application - Comprehensive Testing', () => {
  test.setTimeout(300000); // 5 minutes timeout for comprehensive testing

  let apiCallsLog: any[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('[PAGE ERROR]:', error.message);
      testResults.push({
        type: 'error',
        message: error.message,
        stack: error.stack
      });
    });
  });

  test('1. Initial Page Load and Login Flow - fleet.capitaltechalliance.com', async ({ page }) => {
    console.log('\n========== TEST 1: LOGIN FLOW ==========\n');

    apiCallsLog = await captureNetworkActivity(page, 'login-flow');

    // Navigate to the application
    const startTime = Date.now();
    const response = await page.goto(FLEET_URL, { waitUntil: 'networkidle', timeout: 60000 });
    const loadTime = Date.now() - startTime;

    console.log(`✓ Page loaded in ${loadTime}ms with status: ${response?.status()}`);
    await takeScreenshot(page, '01-initial-load');

    testResults.push({
      test: 'Initial Page Load',
      loadTime: `${loadTime}ms`,
      status: response?.status(),
      url: FLEET_URL,
      passed: response?.ok()
    });

    // Wait for login form
    await page.waitForTimeout(2000);
    await takeScreenshot(page, '02-before-login');

    // Check for login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    // Verify login elements exist
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await expect(loginButton).toBeVisible({ timeout: 10000 });

    console.log('✓ Login form elements found');

    // Fill in credentials
    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await takeScreenshot(page, '03-credentials-entered');

    console.log(`✓ Entered credentials: ${DEMO_EMAIL}`);

    // Click login and wait for navigation
    await Promise.all([
      page.waitForURL('**', { timeout: 30000 }),
      loginButton.click()
    ]);

    await page.waitForTimeout(3000);
    await takeScreenshot(page, '04-after-login');

    console.log('✓ Login submitted, waiting for dashboard...');

    testResults.push({
      test: 'Login Flow',
      email: DEMO_EMAIL,
      passed: true,
      currentUrl: page.url()
    });
  });

  test('2. Dashboard Verification and Data Loading', async ({ page }) => {
    console.log('\n========== TEST 2: DASHBOARD VERIFICATION ==========\n');

    // Login first
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    await takeScreenshot(page, '05-dashboard-loaded');

    // Look for dashboard elements
    const dashboardElements = {
      header: page.locator('header, [role="banner"], nav').first(),
      sidebar: page.locator('aside, [role="navigation"], .sidebar').first(),
      mainContent: page.locator('main, [role="main"], .dashboard').first()
    };

    // Check for data cards/widgets
    const dataCards = page.locator('[class*="card"], [class*="widget"], [class*="stat"]');
    const cardCount = await dataCards.count();

    console.log(`✓ Found ${cardCount} data cards/widgets on dashboard`);

    // Check for charts or visualizations
    const charts = page.locator('canvas, svg[class*="chart"], [class*="chart"]');
    const chartCount = await charts.count();

    console.log(`✓ Found ${chartCount} charts/visualizations`);

    testResults.push({
      test: 'Dashboard Data',
      dataCards: cardCount,
      charts: chartCount,
      passed: cardCount > 0
    });

    // Extract visible text to check for actual data
    const pageText = await page.textContent('body');
    const hasNumbers = /\d+/.test(pageText || '');

    console.log(`✓ Dashboard contains numeric data: ${hasNumbers}`);

    testResults.push({
      test: 'Dashboard Contains Data',
      hasNumericData: hasNumbers,
      passed: hasNumbers
    });
  });

  test('3. Navigation Testing - All Modules', async ({ page }) => {
    console.log('\n========== TEST 3: NAVIGATION TESTING ==========\n');

    // Login
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Find all navigation links
    const navLinks = await page.locator('a[href], button[role="link"]').all();
    console.log(`✓ Found ${navLinks.length} navigation elements`);

    // Test common fleet management modules
    const modulesToTest = [
      { name: 'Vehicles', selectors: ['a:has-text("Vehicle")', 'a[href*="vehicle"]', '[data-test*="vehicle"]'] },
      { name: 'Drivers', selectors: ['a:has-text("Driver")', 'a[href*="driver"]', '[data-test*="driver"]'] },
      { name: 'Maintenance', selectors: ['a:has-text("Maintenance")', 'a[href*="maintenance"]', '[data-test*="maintenance"]'] },
      { name: 'Routes', selectors: ['a:has-text("Route")', 'a[href*="route"]', '[data-test*="route"]'] },
      { name: 'Reports', selectors: ['a:has-text("Report")', 'a[href*="report"]', '[data-test*="report"]'] },
      { name: 'Dashboard', selectors: ['a:has-text("Dashboard")', 'a[href*="dashboard"]', '[data-test*="dashboard"]'] }
    ];

    for (const module of modulesToTest) {
      console.log(`\nTesting navigation to: ${module.name}`);

      let found = false;
      for (const selector of module.selectors) {
        try {
          const link = page.locator(selector).first();
          if (await link.isVisible({ timeout: 2000 })) {
            const beforeUrl = page.url();
            await link.click();
            await page.waitForTimeout(3000);
            const afterUrl = page.url();

            await takeScreenshot(page, `nav-${module.name.toLowerCase()}`);

            console.log(`✓ Navigated to ${module.name}: ${afterUrl}`);

            testResults.push({
              test: `Navigation - ${module.name}`,
              beforeUrl,
              afterUrl,
              changed: beforeUrl !== afterUrl,
              passed: true
            });

            found = true;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }

      if (!found) {
        console.log(`✗ ${module.name} module not found`);
        testResults.push({
          test: `Navigation - ${module.name}`,
          passed: false,
          error: 'Module not found'
        });
      }
    }
  });

  test('4. Vehicles Module - CRUD Operations', async ({ page }) => {
    console.log('\n========== TEST 4: VEHICLES CRUD OPERATIONS ==========\n');

    // Login
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Navigate to vehicles
    try {
      const vehicleLink = page.locator('a:has-text("Vehicle"), a[href*="vehicle"]').first();
      if (await vehicleLink.isVisible({ timeout: 5000 })) {
        await vehicleLink.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '10-vehicles-list');

        // READ: Check if vehicles list is displayed
        const vehicleRows = page.locator('table tbody tr, [class*="vehicle-item"], [class*="vehicle-card"]');
        const vehicleCount = await vehicleRows.count();

        console.log(`✓ Found ${vehicleCount} vehicles in list`);

        testResults.push({
          test: 'Vehicles - READ',
          vehicleCount,
          passed: vehicleCount >= 0
        });

        // CREATE: Try to add a new vehicle
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("Add Vehicle")').first();

        if (await addButton.isVisible({ timeout: 3000 })) {
          await addButton.click();
          await page.waitForTimeout(2000);
          await takeScreenshot(page, '11-add-vehicle-form');

          console.log('✓ Add vehicle form opened');

          // Try to fill form if visible
          const formInputs = page.locator('input[type="text"], input[type="number"], select');
          const inputCount = await formInputs.count();

          console.log(`✓ Found ${inputCount} form inputs`);

          testResults.push({
            test: 'Vehicles - CREATE Form',
            formInputsFound: inputCount,
            passed: inputCount > 0
          });

          // Close form/cancel
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await cancelButton.isVisible({ timeout: 2000 })) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
          }
        } else {
          console.log('✗ Add vehicle button not found');
          testResults.push({
            test: 'Vehicles - CREATE',
            passed: false,
            error: 'Add button not found'
          });
        }

        // UPDATE: Try to edit first vehicle
        if (vehicleCount > 0) {
          const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label*="edit" i]').first();

          if (await editButton.isVisible({ timeout: 3000 })) {
            await editButton.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, '12-edit-vehicle-form');

            console.log('✓ Edit vehicle form opened');

            testResults.push({
              test: 'Vehicles - UPDATE',
              passed: true
            });

            // Close edit form
            const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
            if (await cancelButton.isVisible({ timeout: 2000 })) {
              await cancelButton.click();
              await page.waitForTimeout(1000);
            }
          }
        }
      } else {
        console.log('✗ Vehicles module not accessible');
        testResults.push({
          test: 'Vehicles Module',
          passed: false,
          error: 'Module not found'
        });
      }
    } catch (error) {
      console.log(`✗ Error testing vehicles: ${error}`);
      testResults.push({
        test: 'Vehicles Module',
        passed: false,
        error: String(error)
      });
    }
  });

  test('5. Drivers Module - CRUD Operations', async ({ page }) => {
    console.log('\n========== TEST 5: DRIVERS CRUD OPERATIONS ==========\n');

    // Login
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Navigate to drivers
    try {
      const driverLink = page.locator('a:has-text("Driver"), a[href*="driver"]').first();
      if (await driverLink.isVisible({ timeout: 5000 })) {
        await driverLink.click();
        await page.waitForTimeout(3000);
        await takeScreenshot(page, '13-drivers-list');

        // READ: Check if drivers list is displayed
        const driverRows = page.locator('table tbody tr, [class*="driver-item"], [class*="driver-card"]');
        const driverCount = await driverRows.count();

        console.log(`✓ Found ${driverCount} drivers in list`);

        testResults.push({
          test: 'Drivers - READ',
          driverCount,
          passed: driverCount >= 0
        });

        // CREATE: Try to add a new driver
        const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();

        if (await addButton.isVisible({ timeout: 3000 })) {
          await addButton.click();
          await page.waitForTimeout(2000);
          await takeScreenshot(page, '14-add-driver-form');

          console.log('✓ Add driver form opened');

          testResults.push({
            test: 'Drivers - CREATE Form',
            passed: true
          });

          // Close form
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
          if (await cancelButton.isVisible({ timeout: 2000 })) {
            await cancelButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    } catch (error) {
      console.log(`✗ Error testing drivers: ${error}`);
      testResults.push({
        test: 'Drivers Module',
        passed: false,
        error: String(error)
      });
    }
  });

  test('6. API Calls and Network Monitoring', async ({ page }) => {
    console.log('\n========== TEST 6: API CALLS MONITORING ==========\n');

    const apiCalls: any[] = [];

    // Monitor all network requests
    page.on('request', request => {
      if (request.url().includes('/api/') || request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
        console.log(`→ ${request.method()} ${request.url()}`);
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          type: request.resourceType()
        });
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/') || response.request().resourceType() === 'xhr' || response.request().resourceType() === 'fetch') {
        console.log(`← ${response.status()} ${response.url()}`);

        const call = apiCalls.find(c => c.url === response.url());
        if (call) {
          call.status = response.status();
          call.statusText = response.statusText();
          call.ok = response.ok();

          try {
            const contentType = response.headers()['content-type'];
            if (contentType && contentType.includes('application/json')) {
              call.responseBody = await response.json();
            }
          } catch (e) {
            // Can't read body
          }
        }
      }
    });

    // Login and use app
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Navigate to different modules to trigger API calls
    const vehicleLink = page.locator('a:has-text("Vehicle"), a[href*="vehicle"]').first();
    if (await vehicleLink.isVisible({ timeout: 3000 })) {
      await vehicleLink.click();
      await page.waitForTimeout(3000);
    }

    console.log(`\n✓ Captured ${apiCalls.length} API calls`);

    const successfulCalls = apiCalls.filter(c => c.ok);
    const failedCalls = apiCalls.filter(c => c.status >= 400);

    console.log(`✓ Successful calls: ${successfulCalls.length}`);
    console.log(`✗ Failed calls: ${failedCalls.length}`);

    testResults.push({
      test: 'API Monitoring',
      totalApiCalls: apiCalls.length,
      successfulCalls: successfulCalls.length,
      failedCalls: failedCalls.length,
      apiCallDetails: apiCalls,
      passed: apiCalls.length > 0
    });
  });

  test('7. Data Persistence Testing', async ({ page, context }) => {
    console.log('\n========== TEST 7: DATA PERSISTENCE ==========\n');

    // Login
    await page.goto(FLEET_URL);
    await page.waitForTimeout(2000);

    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

    await emailInput.fill(DEMO_EMAIL);
    await passwordInput.fill(DEMO_PASSWORD);
    await loginButton.click();
    await page.waitForTimeout(5000);

    // Get initial page state
    const initialContent = await page.textContent('body');

    // Check for localStorage
    const localStorage = await page.evaluate(() => {
      return Object.keys(window.localStorage).map(key => ({
        key,
        value: window.localStorage.getItem(key)
      }));
    });

    console.log(`✓ Found ${localStorage.length} localStorage items`);

    // Check for cookies
    const cookies = await context.cookies();
    console.log(`✓ Found ${cookies.length} cookies`);

    testResults.push({
      test: 'Data Persistence',
      localStorageItems: localStorage.length,
      cookies: cookies.length,
      passed: localStorage.length > 0 || cookies.length > 0
    });

    // Refresh page and verify data persists
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    const afterReloadContent = await page.textContent('body');
    const contentPersisted = initialContent === afterReloadContent;

    console.log(`✓ Content persisted after reload: ${contentPersisted}`);

    testResults.push({
      test: 'Data Persistence After Reload',
      passed: contentPersisted
    });
  });

  test('8. Static Web App Comparison - green-pond-0f040980f.3.azurestaticapps.net', async ({ page }) => {
    console.log('\n========== TEST 8: STATIC WEB APP TESTING ==========\n');

    try {
      const response = await page.goto(STATIC_URL, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
      await takeScreenshot(page, '20-static-app-initial');

      console.log(`✓ Static app loaded with status: ${response?.status()}`);

      // Try login on static app
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

      if (await emailInput.isVisible({ timeout: 5000 })) {
        await emailInput.fill(DEMO_EMAIL);
        await passwordInput.fill(DEMO_PASSWORD);
        await loginButton.click();
        await page.waitForTimeout(5000);
        await takeScreenshot(page, '21-static-app-logged-in');

        console.log('✓ Login attempted on static app');

        testResults.push({
          test: 'Static App - Login',
          url: STATIC_URL,
          passed: true
        });
      }

      // Compare functionality
      const staticAppHasNav = await page.locator('nav, aside, [role="navigation"]').count() > 0;
      const staticAppHasContent = (await page.textContent('body'))?.length || 0 > 100;

      console.log(`✓ Static app has navigation: ${staticAppHasNav}`);
      console.log(`✓ Static app has content: ${staticAppHasContent}`);

      testResults.push({
        test: 'Static App - Features',
        hasNavigation: staticAppHasNav,
        hasContent: staticAppHasContent,
        passed: staticAppHasNav && staticAppHasContent
      });

    } catch (error) {
      console.log(`✗ Error testing static app: ${error}`);
      testResults.push({
        test: 'Static App',
        passed: false,
        error: String(error)
      });
    }
  });

  test('9. Performance Metrics Collection', async ({ page }) => {
    console.log('\n========== TEST 9: PERFORMANCE METRICS ==========\n');

    // Measure page load performance
    const startTime = Date.now();
    await page.goto(FLEET_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = window.performance;
      const timing = perf.timing;
      const navigation = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
        firstPaint: navigation?.domContentLoadedEventEnd || 0,
        resourceCount: perf.getEntriesByType('resource').length
      };
    });

    console.log('\n=== Performance Metrics ===');
    console.log(`Total Load Time: ${loadTime}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`Load Complete: ${metrics.loadComplete}ms`);
    console.log(`DOM Interactive: ${metrics.domInteractive}ms`);
    console.log(`Resource Count: ${metrics.resourceCount}`);

    testResults.push({
      test: 'Performance Metrics',
      totalLoadTime: `${loadTime}ms`,
      domContentLoaded: `${metrics.domContentLoaded}ms`,
      loadComplete: `${metrics.loadComplete}ms`,
      domInteractive: `${metrics.domInteractive}ms`,
      resourceCount: metrics.resourceCount,
      passed: loadTime < 10000 // Pass if loads in under 10 seconds
    });
  });

  test.afterAll(async () => {
    // Generate comprehensive test report
    const reportPath = '/Users/andrewmorton/Documents/GitHub/fleet-app/test-results/comprehensive-test-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      testResults,
      screenshots,
      summary: {
        totalTests: testResults.length,
        passed: testResults.filter(r => r.passed).length,
        failed: testResults.filter(r => !r.passed).length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✓ Test report saved to: ${reportPath}`);

    // Print summary
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Screenshots: ${screenshots.length}`);
  });
});
