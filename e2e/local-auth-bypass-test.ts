/**
 * Local browser testing with auth bypass
 * Tests all major routes with VITE_SKIP_AUTH=true
 */
import { chromium, type Page, type ConsoleMessage } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = '/tmp/fleet-cta-screenshots/auth-bypass';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  screenshot?: string;
}

const results: TestResult[] = [];
const consoleErrors: string[] = [];
const jsErrors: string[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✅ ${name}`);
  } catch (err: any) {
    results.push({ name, passed: false, error: err.message });
    console.log(`  ❌ ${name}: ${err.message}`);
  }
}

async function main() {
  console.log('\n🧪 Fleet-CTA Auth-Bypass Browser Test\n');

  const fs = await import('fs');
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Track console errors
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      consoleErrors.push(text);
      // Track JS runtime errors specifically
      if (text.includes('TypeError') || text.includes('ReferenceError') ||
          text.includes('SyntaxError') || text.includes('Cannot read') ||
          text.includes('is not a function') || text.includes('is not defined')) {
        jsErrors.push(text);
      }
    }
  });

  page.on('pageerror', (err) => {
    jsErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // =========================================================================
  // Test each major route
  // =========================================================================
  const routes = [
    { path: '/', name: 'Home Dashboard', slug: 'home' },
    { path: '/fleet', name: 'Fleet Hub', slug: 'fleet' },
    { path: '/operations', name: 'Operations Hub', slug: 'operations' },
    { path: '/drivers', name: 'Drivers', slug: 'drivers' },
    { path: '/maintenance', name: 'Maintenance', slug: 'maintenance' },
    { path: '/costs', name: 'Cost Analytics', slug: 'costs' },
    { path: '/compliance', name: 'Compliance & Safety', slug: 'compliance' },
    { path: '/charging', name: 'Charging Hub', slug: 'charging' },
    { path: '/reports', name: 'Reports Hub', slug: 'reports' },
    { path: '/settings', name: 'Settings', slug: 'settings' },
    { path: '/fleet-analytics', name: 'Fleet Analytics', slug: 'fleet-analytics' },
    { path: '/vehicle-inventory', name: 'Vehicle Inventory', slug: 'vehicle-inventory' },
    { path: '/procurement', name: 'Procurement Hub', slug: 'procurement' },
  ];

  for (const route of routes) {
    console.log(`\n📄 Testing: ${route.name} (${route.path})`);

    await test(`${route.name} - loads without crash`, async () => {
      const response = await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      });
      if (!response || response.status() >= 500) {
        throw new Error(`HTTP ${response?.status()}`);
      }
    });

    await test(`${route.name} - renders content (not blank)`, async () => {
      await page.waitForTimeout(3000); // Wait for React + data loading

      const rootInfo = await page.evaluate(() => {
        const root = document.getElementById('root');
        if (!root) return { exists: false, html: 0, text: '', visible: false };
        const rect = root.getBoundingClientRect();
        return {
          exists: true,
          html: root.innerHTML.length,
          text: root.innerText.substring(0, 500),
          visible: rect.height > 0,
          childCount: root.children.length
        };
      });

      if (!rootInfo.exists) throw new Error('No #root element');
      if (rootInfo.html < 100) throw new Error(`Root nearly empty (${rootInfo.html} chars)`);
      if (!rootInfo.visible) throw new Error('Root element not visible');

      // Check for blank/white page - if text is very short, it's likely blank
      const hasContent = rootInfo.text.trim().length > 20;
      if (!hasContent) {
        throw new Error(`Page appears blank. Text: "${rootInfo.text.trim().substring(0, 100)}"`);
      }
    });

    // Take screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${route.slug}.png`,
      fullPage: true
    });

    await test(`${route.name} - no React error boundary`, async () => {
      const hasError = await page.evaluate(() => {
        const body = document.body.innerText;
        return body.includes('Something went wrong') ||
          body.includes('Error boundary') ||
          body.includes('Unhandled Runtime Error') ||
          body.includes('Application error');
      });
      if (hasError) throw new Error('Error boundary visible on page');
    });
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`\nTests: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Console errors: ${consoleErrors.length} | JS errors: ${jsErrors.length}`);

  if (failed > 0) {
    console.log('\n❌ FAILURES:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ${r.name}: ${r.error}`);
    });
  }

  if (jsErrors.length > 0) {
    console.log('\n🔴 JS RUNTIME ERRORS:');
    jsErrors.slice(0, 15).forEach(e => console.log(`  ${e.substring(0, 200)}`));
  }

  console.log(`\n📸 Screenshots: ${SCREENSHOT_DIR}/`);
  console.log('='.repeat(60));

  // Keep open briefly for inspection
  await page.waitForTimeout(3000);
  await browser.close();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
