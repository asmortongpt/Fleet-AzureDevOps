/**
 * Full App Spider - Real Data, Real Findings
 *
 * Visits every route in the Fleet CTA app with SKIP_AUTH=true,
 * captures screenshots, console errors, network failures,
 * and reports real issues for fixing.
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// All routes organized by category
const ROUTES = {
  'Dashboards': [
    '/dashboard',
    '/live-fleet-dashboard',
    '/executive-dashboard',
    '/premium-fleet-dashboard',
    '/admin-dashboard',
  ],
  'Consolidated Hubs': [
    '/fleet-hub-consolidated',
    '/compliance-hub-consolidated',
    '/procurement-hub-consolidated',
    '/communication-hub-consolidated',
    '/admin-hub-consolidated',
  ],
  'Hub Aliases': [
    '/fleet',
    '/operations',
    '/maintenance',
    '/drivers',
    '/assets',
    '/safety',
    '/compliance',
    '/financial',
    '/procurement',
    '/communication',
    '/admin',
    '/integrations',
  ],
  'Workspaces': [
    '/operations-workspace',
    '/fleet-workspace',
    '/drivers-workspace',
    '/maintenance-workspace',
    '/analytics-workspace',
    '/compliance-workspace',
  ],
  'Fleet & Vehicles': [
    '/garage',
    '/virtual-garage',
    '/vehicle-telemetry',
    '/gps-tracking',
    '/vehicle-showroom',
    '/showroom',
    '/3d-garage',
  ],
  'Maintenance': [
    '/predictive',
    '/maintenance-scheduling',
    '/maintenance-request',
  ],
  'Fuel': [
    '/fuel',
    '/fuel-purchasing',
    '/fuel-management',
  ],
  'Routes & Logistics': [
    '/routes',
    '/route-optimization',
    '/dispatch-console',
    '/task-management',
  ],
  'Analytics & Reports': [
    '/analytics',
    '/custom-reports',
    '/workbench',
    '/comprehensive',
    '/cost-analysis',
    '/endpoint-monitor',
    '/mileage',
  ],
  'Procurement & Financial': [
    '/vendor-management',
    '/parts-inventory',
    '/purchase-orders',
    '/invoices',
    '/receipt-processing',
  ],
  'Compliance & Safety': [
    '/osha-forms',
    '/video-telematics',
    '/incident-management',
    '/documents',
    '/document-qa',
    '/policy-engine',
    '/policy-management',
    '/safety-alerts',
    '/hos',
    '/hours-of-service',
    '/incidents',
    '/heavy-equipment',
  ],
  'EV & Charging': [
    '/ev-charging',
    '/charging-hub',
    '/charging',
    '/ev-hub',
    '/ev',
  ],
  'Integrations & Maps': [
    '/gis-map',
    '/map-settings',
    '/map-layers',
    '/traffic-cameras',
    '/geofences',
    '/teams-integration',
    '/email-center',
    '/arcgis-integration',
  ],
  'Communication': [
    '/communication-log',
    '/ai-assistant',
  ],
  'Personal Use & Billing': [
    '/personal-use',
    '/personal-use-policy',
    '/reimbursement-queue',
    '/charges-billing',
  ],
  'Tools & Admin': [
    '/form-builder',
    '/notifications',
    '/push-notification-admin',
    '/fleet-optimizer',
    '/asset-management',
    '/equipment-dashboard',
    '/profile',
    '/settings',
    '/driver-mgmt',
    '/driver-scorecard',
    '/create-damage-report',
    '/damage-report-create',
  ],
};

interface PageResult {
  route: string;
  category: string;
  status: 'ok' | 'error' | 'warning';
  loadTimeMs: number;
  consoleErrors: string[];
  consoleWarnings: string[];
  networkFailures: string[];
  screenshotPath: string;
  title: string;
  hasContent: boolean;
  visibleText: string;
  issues: string[];
}

const results: PageResult[] = [];
const screenshotDir = path.join(process.cwd(), 'test-results', 'spider-screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

test.afterAll(async () => {
  // Write comprehensive report
  const reportPath = path.join(process.cwd(), 'test-results', 'spider-report.json');
  const errorPages = results.filter(r => r.status === 'error');
  const warningPages = results.filter(r => r.status === 'warning');
  const okPages = results.filter(r => r.status === 'ok');

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      ok: okPages.length,
      warnings: warningPages.length,
      errors: errorPages.length,
      avgLoadTimeMs: Math.round(results.reduce((s, r) => s + r.loadTimeMs, 0) / results.length),
      slowestPages: [...results].sort((a, b) => b.loadTimeMs - a.loadTimeMs).slice(0, 10).map(r => ({
        route: r.route,
        loadTimeMs: r.loadTimeMs,
      })),
    },
    errors: errorPages.map(r => ({
      route: r.route,
      category: r.category,
      issues: r.issues,
      consoleErrors: r.consoleErrors,
      networkFailures: r.networkFailures,
    })),
    warnings: warningPages.map(r => ({
      route: r.route,
      category: r.category,
      issues: r.issues,
      consoleWarnings: r.consoleWarnings.slice(0, 5),
    })),
    allResults: results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('SPIDER REPORT SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total pages: ${results.length}`);
  console.log(`  OK: ${okPages.length}`);
  console.log(`  Warnings: ${warningPages.length}`);
  console.log(`  Errors: ${errorPages.length}`);
  console.log(`Avg load time: ${report.summary.avgLoadTimeMs}ms`);

  if (errorPages.length > 0) {
    console.log('\nERROR PAGES:');
    errorPages.forEach(r => {
      console.log(`  ${r.route} — ${r.issues.join('; ')}`);
    });
  }

  if (warningPages.length > 0) {
    console.log('\nWARNING PAGES:');
    warningPages.forEach(r => {
      console.log(`  ${r.route} — ${r.issues.join('; ')}`);
    });
  }

  console.log(`\nFull report: ${reportPath}`);
  console.log(`Screenshots: ${screenshotDir}/`);
});

// Create one test per category for parallel execution
for (const [category, routes] of Object.entries(ROUTES)) {
  test.describe(category, () => {
    for (const route of routes) {
      test(`spider ${route}`, async ({ page }) => {
        const result = await spiderPage(page, route, category);
        results.push(result);

        // Soft assertions - don't fail test but record issues
        if (result.consoleErrors.length > 0) {
          console.log(`[CONSOLE ERRORS] ${route}: ${result.consoleErrors.length} errors`);
          result.consoleErrors.forEach(e => console.log(`  ${e.substring(0, 200)}`));
        }
        if (result.networkFailures.length > 0) {
          console.log(`[NETWORK FAILURES] ${route}: ${result.networkFailures.join(', ')}`);
        }

        // Page should at least load (not crash)
        expect(result.loadTimeMs).toBeLessThan(30000);
      });
    }
  });
}

async function spiderPage(page: Page, route: string, category: string): Promise<PageResult> {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const networkFailures: string[] = [];
  const issues: string[] = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      // Filter out known noise
      if (!text.includes('favicon.ico') &&
          !text.includes('DevTools') &&
          !text.includes('Download the React DevTools') &&
          !text.includes('[HMR]') &&
          !text.includes('Manifest:')) {
        consoleErrors.push(text);
      }
    } else if (msg.type() === 'warning') {
      if (!text.includes('[HMR]') && !text.includes('DevTools')) {
        consoleWarnings.push(text);
      }
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    const url = request.url();
    if (!url.includes('favicon') && !url.includes('hot-update') && !url.includes('sockjs')) {
      networkFailures.push(`${request.method()} ${url} — ${request.failure()?.errorText || 'unknown'}`);
    }
  });

  // Capture uncaught errors
  page.on('pageerror', error => {
    consoleErrors.push(`[UNCAUGHT] ${error.message}`);
  });

  const startTime = Date.now();
  let title = '';
  let hasContent = false;
  let visibleText = '';

  try {
    const response = await page.goto(route, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    // Wait for React to render
    await page.waitForTimeout(2000);

    // Try to wait for network idle (but don't fail if it times out)
    try {
      await page.waitForLoadState('networkidle', { timeout: 8000 });
    } catch {
      // Some pages have persistent connections (WebSocket, polling)
    }

    const loadTimeMs = Date.now() - startTime;
    title = await page.title();

    // Check if the page rendered real content (not blank / not error)
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    visibleText = bodyText.substring(0, 500);
    hasContent = bodyText.trim().length > 50;

    // Check for common error patterns in page content
    const lowerText = bodyText.toLowerCase();
    if (lowerText.includes('something went wrong') || lowerText.includes('error boundary')) {
      issues.push('Error boundary triggered');
    }
    if (lowerText.includes('page not found') || lowerText.includes('404')) {
      issues.push('404 / Page not found');
    }
    if (lowerText.includes('cannot read properties') || lowerText.includes('undefined is not')) {
      issues.push('JS runtime error visible on page');
    }
    if (!hasContent) {
      issues.push('Page appears blank or nearly empty');
    }

    // Check for broken images
    const brokenImages = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      let broken = 0;
      imgs.forEach(img => {
        if (img.naturalWidth === 0 && img.src && !img.src.includes('data:')) broken++;
      });
      return broken;
    });
    if (brokenImages > 0) {
      issues.push(`${brokenImages} broken image(s)`);
    }

    // Take screenshot
    const screenshotName = route.replace(/\//g, '_').replace(/^_/, '') || 'root';
    const screenshotPath = path.join(screenshotDir, `${screenshotName}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Determine status
    let status: 'ok' | 'error' | 'warning' = 'ok';
    if (consoleErrors.length > 0 || networkFailures.length > 0 || issues.some(i =>
      i.includes('Error boundary') || i.includes('runtime error') || i.includes('blank')
    )) {
      status = 'error';
    } else if (consoleWarnings.length > 3 || issues.length > 0) {
      status = 'warning';
    }

    // Add console error count as issue
    if (consoleErrors.length > 0) {
      issues.push(`${consoleErrors.length} console error(s)`);
    }
    if (networkFailures.length > 0) {
      issues.push(`${networkFailures.length} network failure(s)`);
    }

    return {
      route,
      category,
      status,
      loadTimeMs,
      consoleErrors,
      consoleWarnings,
      networkFailures,
      screenshotPath,
      title,
      hasContent,
      visibleText,
      issues,
    };
  } catch (error) {
    const loadTimeMs = Date.now() - startTime;
    const screenshotName = route.replace(/\//g, '_').replace(/^_/, '') || 'root';
    const screenshotPath = path.join(screenshotDir, `${screenshotName}.png`);

    try { await page.screenshot({ path: screenshotPath, fullPage: true }); } catch {}

    issues.push(`Navigation error: ${String(error).substring(0, 200)}`);

    return {
      route,
      category,
      status: 'error',
      loadTimeMs,
      consoleErrors,
      consoleWarnings,
      networkFailures,
      screenshotPath,
      title,
      hasContent: false,
      visibleText: '',
      issues,
    };
  }
}
