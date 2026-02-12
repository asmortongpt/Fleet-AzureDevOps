/**
 * Local browser testing script
 * Tests the Fleet-CTA app in a real browser via Playwright
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = '/tmp/fleet-cta-screenshots';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];
const consoleErrors: string[] = [];
const networkErrors: string[] = [];

async function runTest(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message, duration: Date.now() - start });
    console.log(`❌ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n🚀 Fleet-CTA Local Browser Test Suite\n');
  console.log(`Frontend: ${BASE_URL}`);
  console.log(`Backend:  ${API_URL}\n`);

  // Create screenshot directory
  const fs = await import('fs');
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });

  // Set auth bypass for local testing
  const page = await context.newPage();

  // Collect console errors
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // Collect network errors
  page.on('requestfailed', (request) => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText || 'unknown'}`);
  });

  // =========================================================================
  // TEST 1: Frontend loads
  // =========================================================================
  await runTest('Frontend loads at localhost:5173', async () => {
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    if (!response || response.status() >= 400) {
      throw new Error(`HTTP ${response?.status()}`);
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-initial-load.png`, fullPage: true });
  });

  // =========================================================================
  // TEST 2: Login page renders
  // =========================================================================
  await runTest('Login page renders correctly', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-login-page.png`, fullPage: true });
    // Check for login form elements
    const body = await page.textContent('body');
    if (!body || body.length < 10) {
      throw new Error('Login page body is empty');
    }
  });

  // =========================================================================
  // TEST 3: Navigate to main routes (with auth bypass for local dev)
  // =========================================================================
  const routes = [
    { path: '/', name: 'Home/Dashboard' },
    { path: '/fleet', name: 'Fleet Hub' },
    { path: '/operations', name: 'Fleet Operations' },
    { path: '/maintenance', name: 'Maintenance Hub' },
    { path: '/costs', name: 'Cost Analytics' },
    { path: '/compliance', name: 'Compliance & Safety' },
    { path: '/drivers', name: 'Drivers' },
    { path: '/charging', name: 'Charging Hub' },
    { path: '/reports', name: 'Reports Hub' },
    { path: '/settings', name: 'Settings' },
  ];

  for (const route of routes) {
    await runTest(`Route: ${route.name} (${route.path})`, async () => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      if (!response || response.status() >= 500) {
        throw new Error(`HTTP ${response?.status()}`);
      }
      // Wait a moment for React to render
      await page.waitForTimeout(2000);
      const screenshotName = route.path.replace(/\//g, '-').replace(/^-/, '') || 'home';
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-route-${screenshotName}.png`,
        fullPage: true
      });
      // Check that the page has content
      const bodyText = await page.textContent('body');
      if (!bodyText || bodyText.trim().length < 5) {
        throw new Error('Page appears blank');
      }
    });
  }

  // =========================================================================
  // TEST 4: Check for white screen of death (WSOD)
  // =========================================================================
  await runTest('No white screen of death on main pages', async () => {
    for (const route of ['/', '/fleet', '/costs', '/drivers']) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2000);
      const rootContent = await page.evaluate(() => {
        const root = document.getElementById('root');
        return root ? root.innerHTML.length : 0;
      });
      if (rootContent < 50) {
        throw new Error(`WSOD detected on ${route} (root innerHTML length: ${rootContent})`);
      }
    }
  });

  // =========================================================================
  // TEST 5: API proxy works through Vite
  // =========================================================================
  await runTest('API proxy: /api/health resolves through Vite', async () => {
    const response = await page.goto(`${BASE_URL}/api/health`, { timeout: 10000 });
    if (!response) throw new Error('No response');
    const text = await response.text();
    if (!text.includes('"status"')) {
      throw new Error(`Unexpected response: ${text.substring(0, 100)}`);
    }
  });

  // =========================================================================
  // TEST 6: Check React error boundaries
  // =========================================================================
  await runTest('No React error boundaries triggered', async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const errorBoundary = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[class*="error-boundary"], [data-testid="error-boundary"]');
      const bodyText = document.body.innerText;
      const hasReactError = bodyText.includes('Something went wrong') ||
        bodyText.includes('Error: Minified React error') ||
        bodyText.includes('Unhandled Runtime Error');
      return { count: errorElements.length, hasReactError };
    });
    if (errorBoundary.count > 0 || errorBoundary.hasReactError) {
      throw new Error(`Error boundary detected: ${JSON.stringify(errorBoundary)}`);
    }
  });

  // =========================================================================
  // TEST 7: JavaScript bundle loads without errors
  // =========================================================================
  await runTest('No critical JS bundle load failures', async () => {
    const criticalErrors = consoleErrors.filter(e =>
      e.includes('SyntaxError') ||
      e.includes('ReferenceError') ||
      e.includes('TypeError') ||
      e.includes('ChunkLoadError') ||
      e.includes('Failed to fetch dynamically imported module')
    );
    if (criticalErrors.length > 0) {
      throw new Error(`Critical JS errors: ${criticalErrors.join('; ')}`);
    }
  });

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`\nConsole Errors: ${consoleErrors.length}`);
  console.log(`Network Errors: ${networkErrors.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
  }

  if (consoleErrors.length > 0) {
    console.log('\n⚠️ CONSOLE ERRORS (first 10):');
    consoleErrors.slice(0, 10).forEach(e => console.log(`  ${e}`));
  }

  if (networkErrors.length > 0) {
    console.log('\n⚠️ NETWORK ERRORS (first 10):');
    networkErrors.slice(0, 10).forEach(e => console.log(`  ${e}`));
  }

  console.log(`\n📸 Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('='.repeat(60));

  // Keep browser open for 5 seconds for visual inspection
  console.log('\nBrowser staying open for 5 seconds for visual inspection...');
  await page.waitForTimeout(5000);

  await browser.close();

  // Exit with error code if tests failed
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
