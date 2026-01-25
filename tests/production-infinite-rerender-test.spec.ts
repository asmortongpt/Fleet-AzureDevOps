import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const PRODUCTION_URLS = [
  'https://gray-flower-03a2a730f.3.azurestaticapps.net',
  'https://fleet.capitaltechalliance.com'
];

const ROUTES = [
  { path: '/', name: 'Home/Dashboard' },
  { path: '/fleet', name: 'Fleet Hub' },
  { path: '/operations', name: 'Operations Hub' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reservations', name: 'Reservations' },
  { path: '/policy-hub', name: 'Policy Hub' },
  { path: '/documents', name: 'Documents' },
  { path: '/documents-hub', name: 'Documents Hub' },
  { path: '/configuration', name: 'Configuration' },
  { path: '/cta-configuration-hub', name: 'CTA Configuration' }
];

const RESULTS_DIR = '/tmp/production-test-results';

test.describe('Production Infinite Re-Render Verification', () => {
  let consoleErrors: Array<{ type: string; message: string; timestamp: number }> = [];
  let testResults: any = {
    deploymentInfo: {},
    infiniteRerenderTests: [],
    routeTests: [],
    performanceMetrics: [],
    timestamp: new Date().toISOString()
  };

  test.beforeAll(async () => {
    // Create results directory
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
  });

  test.afterAll(async () => {
    // Write comprehensive test results
    const reportPath = path.join(RESULTS_DIR, 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n\n=== TEST RESULTS SAVED TO: ${reportPath} ===\n\n`);
  });

  test('Phase 1: Verify Deployment Information', async ({ page }) => {
    const baseUrl = PRODUCTION_URLS[0];

    console.log('\n=== PHASE 1: DEPLOYMENT VERIFICATION ===\n');

    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const headers = response?.headers();

    const deploymentInfo = {
      url: baseUrl,
      date: headers?.['date'] || 'unknown',
      cacheControl: headers?.['cache-control'] || 'unknown',
      status: response?.status() || 0,
      statusText: response?.statusText() || 'unknown'
    };

    // Extract build hash from page content
    const content = await page.content();
    const buildHashMatch = content.match(/index-([^.]+)\.js/);
    deploymentInfo['buildHash'] = buildHashMatch ? buildHashMatch[0] : 'unknown';

    console.log('Deployment Info:', JSON.stringify(deploymentInfo, null, 2));
    testResults.deploymentInfo = deploymentInfo;

    // Screenshot of initial page
    const screenshotPath = path.join(RESULTS_DIR, 'phase1-deployment.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    expect(response?.ok()).toBeTruthy();
  });

  for (const url of PRODUCTION_URLS) {
    for (const route of ROUTES) {
      test(`Phase 2: [${url}]${route.path} - Check for Infinite Re-Render Bug`, async ({ page }) => {
        const fullUrl = `${url}${route.path}`;
        console.log(`\n=== Testing: ${route.name} at ${fullUrl} ===\n`);

        // Reset console error tracking
        consoleErrors = [];
        let rerenderCount = 0;
        let maxUpdateDepthErrors = 0;

        // Track console messages
        page.on('console', (msg) => {
          const text = msg.text();
          const type = msg.type();

          // Track all errors and warnings
          if (type === 'error' || type === 'warning') {
            consoleErrors.push({
              type,
              message: text,
              timestamp: Date.now()
            });

            // Specific check for infinite re-render
            if (text.includes('Maximum update depth exceeded')) {
              maxUpdateDepthErrors++;
              console.error(`🚨 INFINITE RE-RENDER DETECTED: ${text}`);
            }
          }

          // Log all console activity for debugging
          console.log(`[${type.toUpperCase()}] ${text}`);
        });

        // Track page errors
        page.on('pageerror', (error) => {
          console.error(`[PAGE ERROR] ${error.message}`);
          consoleErrors.push({
            type: 'pageerror',
            message: error.message,
            timestamp: Date.now()
          });
        });

        const startTime = Date.now();

        try {
          // Navigate to page
          const response = await page.goto(fullUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
          });

          expect(response?.ok()).toBeTruthy();

          // Wait and monitor for 30 seconds as specified
          console.log('Monitoring page for 30 seconds...');
          await page.waitForTimeout(30000);

          const loadTime = Date.now() - startTime;

          // Take screenshot
          const screenshotPath = path.join(
            RESULTS_DIR,
            `phase2-${url.includes('gray-flower') ? 'azure' : 'custom'}-${route.path.replace(/\//g, '_') || 'home'}.png`
          );
          await page.screenshot({ path: screenshotPath, fullPage: true });

          // Check if page has content (not blank)
          const bodyText = await page.textContent('body');
          const hasContent = bodyText && bodyText.trim().length > 100;

          // Performance metrics
          const performanceMetrics = await page.evaluate(() => {
            const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            return {
              domContentLoaded: perf?.domContentLoadedEventEnd - perf?.domContentLoadedEventStart,
              loadComplete: perf?.loadEventEnd - perf?.loadEventStart,
              domInteractive: perf?.domInteractive - perf?.fetchStart,
            };
          });

          const routeTestResult = {
            url: fullUrl,
            route: route.path,
            name: route.name,
            passed: maxUpdateDepthErrors === 0 && hasContent,
            loadTime,
            maxUpdateDepthErrors,
            totalConsoleErrors: consoleErrors.filter(e => e.type === 'error').length,
            totalConsoleWarnings: consoleErrors.filter(e => e.type === 'warning').length,
            hasContent,
            screenshotPath,
            performanceMetrics,
            consoleErrors: consoleErrors.slice(0, 10) // First 10 errors
          };

          testResults.infiniteRerenderTests.push(routeTestResult);

          console.log('\n=== TEST RESULT ===');
          console.log(`Route: ${route.name}`);
          console.log(`Load Time: ${loadTime}ms`);
          console.log(`Max Update Depth Errors: ${maxUpdateDepthErrors}`);
          console.log(`Console Errors: ${consoleErrors.filter(e => e.type === 'error').length}`);
          console.log(`Has Content: ${hasContent}`);
          console.log(`Status: ${routeTestResult.passed ? '✅ PASS' : '❌ FAIL'}`);
          console.log('===================\n');

          // CRITICAL ASSERTION: Zero infinite re-render errors
          expect(maxUpdateDepthErrors, `${route.name} should have ZERO "Maximum update depth exceeded" errors`).toBe(0);
          expect(hasContent, `${route.name} should display content`).toBeTruthy();
          expect(loadTime, `${route.name} should load within 30 seconds`).toBeLessThan(30000);

        } catch (error) {
          const errorResult = {
            url: fullUrl,
            route: route.path,
            name: route.name,
            passed: false,
            error: error.message,
            maxUpdateDepthErrors,
            consoleErrors
          };
          testResults.infiniteRerenderTests.push(errorResult);
          throw error;
        }
      });
    }
  }

  test('Phase 3: SSO Authentication Flow (Configuration Check)', async ({ page }) => {
    console.log('\n=== PHASE 3: SSO AUTHENTICATION VERIFICATION ===\n');

    const baseUrl = PRODUCTION_URLS[1]; // Use custom domain
    const ssoResults = {
      loginPageLoads: false,
      authEndpointStatus: null,
      expectedRedirectUri: 'https://fleet.capitaltechalliance.com/auth/callback',
      notes: []
    };

    try {
      // Check if login page loads
      const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      ssoResults.loginPageLoads = response?.ok() || false;

      // Check /.auth/me endpoint (Azure Static Web App auth endpoint)
      try {
        const authResponse = await page.goto(`${baseUrl}/.auth/me`);
        ssoResults.authEndpointStatus = authResponse?.status();
        const authData = await page.textContent('body');
        console.log('Auth endpoint response:', authData);
      } catch (authError) {
        console.log('Auth endpoint error:', authError.message);
        ssoResults.notes.push(`Auth endpoint error: ${authError.message}`);
      }

      // Take screenshot
      const screenshotPath = path.join(RESULTS_DIR, 'phase3-sso-check.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      testResults.ssoCheck = ssoResults;
      console.log('SSO Results:', JSON.stringify(ssoResults, null, 2));

    } catch (error) {
      console.error('SSO check error:', error.message);
      testResults.ssoCheck = { ...ssoResults, error: error.message };
    }
  });

  test('Phase 4: Performance Metrics', async ({ page }) => {
    console.log('\n=== PHASE 4: PERFORMANCE METRICS ===\n');

    const baseUrl = PRODUCTION_URLS[0];
    await page.goto(`${baseUrl}/fleet`, { waitUntil: 'networkidle' });

    // Get detailed performance metrics
    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      return {
        navigation: {
          redirectTime: perf.redirectEnd - perf.redirectStart,
          dnsTime: perf.domainLookupEnd - perf.domainLookupStart,
          tcpTime: perf.connectEnd - perf.connectStart,
          requestTime: perf.responseStart - perf.requestStart,
          responseTime: perf.responseEnd - perf.responseStart,
          domProcessing: perf.domComplete - perf.domLoading,
          loadComplete: perf.loadEventEnd - perf.loadEventStart,
        },
        paint: paintEntries.map(entry => ({
          name: entry.name,
          startTime: entry.startTime
        })),
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        } : null
      };
    });

    testResults.performanceMetrics = metrics;
    console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));

    // Performance assertions
    expect(metrics.navigation.domProcessing).toBeLessThan(5000);
    expect(metrics.navigation.responseTime).toBeLessThan(2000);
  });
});
