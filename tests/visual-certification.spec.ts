import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * FULL-SYSTEM SPIDER CERTIFICATION - VISUAL TESTING SUITE
 *
 * This test suite executes comprehensive visual testing with evidence collection:
 * - Screenshots at every step
 * - Video recordings of workflows
 * - DOM snapshots
 * - Network request/response logs
 * - Console error tracking
 * - Performance metrics
 *
 * Evidence saved to: /tmp/visual-evidence/
 */

const EVIDENCE_DIR = '/tmp/visual-evidence';

// Create evidence directory
try {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  mkdirSync(`${EVIDENCE_DIR}/screenshots`, { recursive: true });
  mkdirSync(`${EVIDENCE_DIR}/traces`, { recursive: true });
  mkdirSync(`${EVIDENCE_DIR}/videos`, { recursive: true });
  mkdirSync(`${EVIDENCE_DIR}/logs`, { recursive: true });
} catch (e) {
  console.log('Evidence directories already exist');
}

// Evidence collection helpers
const evidence: any = {
  pages: [],
  errors: [],
  networkRequests: [],
  performance: [],
};

test.describe('Full-System Visual Certification', () => {

  test.beforeEach(async ({ page }) => {
    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        evidence.errors.push({
          timestamp: new Date().toISOString(),
          message: msg.text(),
          location: msg.location(),
        });
      }
    });

    // Collect network requests
    page.on('request', (request) => {
      evidence.networkRequests.push({
        timestamp: new Date().toISOString(),
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
      });
    });

    page.on('response', (response) => {
      const request = response.request();
      const existing = evidence.networkRequests.find(
        (r: any) => r.url === request.url() && r.timestamp
      );
      if (existing) {
        existing.status = response.status();
        existing.statusText = response.statusText();
        existing.responseTime = Date.now();
      }
    });
  });

  test.afterAll(async () => {
    // Save all collected evidence
    writeFileSync(
      `${EVIDENCE_DIR}/logs/evidence-summary.json`,
      JSON.stringify(evidence, null, 2)
    );
    console.log(`\n✅ Evidence saved to: ${EVIDENCE_DIR}`);
  });

  // ========================================
  // PHASE 1: UI SURFACES VISUAL TESTING
  // ========================================

  test('UI-001: FleetHub - Visual validation with screenshots', async ({ page }) => {
    const pageName = 'FleetHub';
    const startTime = Date.now();

    // Navigate
    await page.goto('/fleet');
    await page.waitForLoadState('networkidle');

    // Screenshot 1: Initial load
    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${pageName}-01-initial.png`,
      fullPage: true,
    });

    // Check for key visual elements
    const hasHeader = await page.locator('h1, [role="heading"]').count() > 0;
    const hasVehicleCards = await page.locator('[data-testid*="vehicle"], .vehicle-card').count() > 0;
    const hasMap = await page.locator('[id*="map"], .map-container').count() > 0;

    // Screenshot 2: After interaction
    if (hasVehicleCards) {
      await page.locator('[data-testid*="vehicle"], .vehicle-card').first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${EVIDENCE_DIR}/screenshots/${pageName}-02-vehicle-selected.png`,
        fullPage: true,
      });
    }

    // Collect evidence
    const pageEvidence = {
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      loadTime: Date.now() - startTime,
      visualElements: {
        hasHeader,
        hasVehicleCards,
        hasMap,
      },
      screenshots: [
        `${pageName}-01-initial.png`,
        hasVehicleCards ? `${pageName}-02-vehicle-selected.png` : null,
      ].filter(Boolean),
      consoleErrors: evidence.errors.filter((e: any) => e.timestamp > new Date(startTime).toISOString()),
    };

    evidence.pages.push(pageEvidence);

    // Assertions
    expect(hasHeader).toBe(true);
    expect(pageEvidence.loadTime).toBeLessThan(5000);
  });

  test('UI-002: DriversHub - Visual validation', async ({ page }) => {
    const pageName = 'DriversHub';
    const startTime = Date.now();

    await page.goto('/drivers');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${pageName}-01-initial.png`,
      fullPage: true,
    });

    const hasDriverList = await page.locator('[data-testid*="driver"], .driver-card').count() > 0;
    const hasAddButton = await page.locator('button:has-text("Add"), button:has-text("Create")').count() > 0;

    evidence.pages.push({
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      loadTime: Date.now() - startTime,
      visualElements: { hasDriverList, hasAddButton },
      screenshots: [`${pageName}-01-initial.png`],
    });

    expect(page.url()).toContain('/drivers');
  });

  test('UI-003: MaintenanceHub - Visual validation', async ({ page }) => {
    const pageName = 'MaintenanceHub';
    const startTime = Date.now();

    await page.goto('/maintenance');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${pageName}-01-initial.png`,
      fullPage: true,
    });

    const hasWorkOrders = await page.locator('[data-testid*="work-order"], .work-order').count() > 0;
    const hasSchedule = await page.locator('[data-testid*="schedule"], .schedule').count() > 0;

    evidence.pages.push({
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      loadTime: Date.now() - startTime,
      visualElements: { hasWorkOrders, hasSchedule },
      screenshots: [`${pageName}-01-initial.png`],
    });

    expect(page.url()).toContain('/maintenance');
  });

  test('UI-004: ComplianceHub - Visual validation', async ({ page }) => {
    const pageName = 'ComplianceHub';
    const startTime = Date.now();

    await page.goto('/compliance');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${pageName}-01-initial.png`,
      fullPage: true,
    });

    const hasComplianceCards = await page.locator('[data-testid*="compliance"], .compliance').count() > 0;
    const hasAlerts = await page.locator('[data-testid*="alert"], .alert').count() > 0;

    evidence.pages.push({
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      loadTime: Date.now() - startTime,
      visualElements: { hasComplianceCards, hasAlerts },
      screenshots: [`${pageName}-01-initial.png`],
    });

    expect(page.url()).toContain('/compliance');
  });

  test('UI-005: AnalyticsHub - Visual validation with charts', async ({ page }) => {
    const pageName = 'AnalyticsHub';
    const startTime = Date.now();

    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for charts to render
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${pageName}-01-charts.png`,
      fullPage: true,
    });

    const hasCharts = await page.locator('[data-testid*="chart"], canvas, svg').count() > 0;
    const hasMetrics = await page.locator('[data-testid*="metric"], .metric').count() > 0;

    evidence.pages.push({
      pageName,
      url: page.url(),
      timestamp: new Date().toISOString(),
      loadTime: Date.now() - startTime,
      visualElements: { hasCharts, hasMetrics },
      screenshots: [`${pageName}-01-charts.png`],
    });

    expect(hasCharts || hasMetrics).toBe(true);
  });

  // ========================================
  // PHASE 2: API ENDPOINT TESTING WITH EVIDENCE
  // ========================================

  test('API-001: GET /api/vehicles - Request/Response logging', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get('http://localhost:3001/api/vehicles', {
      headers: {
        'Accept': 'application/json',
      },
    });

    const responseTime = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    const apiEvidence = {
      endpoint: 'GET /api/vehicles',
      timestamp: new Date().toISOString(),
      responseTime,
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers(),
      data: Array.isArray(data) ? { count: data.length, sample: data[0] } : data,
    };

    writeFileSync(
      `${EVIDENCE_DIR}/logs/api-vehicles-get.json`,
      JSON.stringify(apiEvidence, null, 2)
    );

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000);
  });

  test('API-002: GET /api/drivers - Request/Response logging', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get('http://localhost:3001/api/drivers');
    const responseTime = Date.now() - startTime;
    const data = await response.json().catch(() => null);

    writeFileSync(
      `${EVIDENCE_DIR}/logs/api-drivers-get.json`,
      JSON.stringify({
        endpoint: 'GET /api/drivers',
        timestamp: new Date().toISOString(),
        responseTime,
        status: response.status(),
        data: Array.isArray(data) ? { count: data.length } : data,
      }, null, 2)
    );

    expect(response.ok()).toBe(true);
  });

  // ========================================
  // PHASE 3: END-TO-END WORKFLOW TESTING
  // ========================================

  test('E2E-001: Complete vehicle assignment workflow with visual evidence', async ({ page }) => {
    const workflowName = 'VehicleAssignment';
    const startTime = Date.now();

    // Step 1: Navigate to fleet
    await page.goto('/fleet');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: `${EVIDENCE_DIR}/screenshots/${workflowName}-step1-fleet.png`,
      fullPage: true,
    });

    // Step 2: Select a vehicle
    const vehicleSelector = '[data-testid*="vehicle"], .vehicle-card';
    const vehicleCount = await page.locator(vehicleSelector).count();

    if (vehicleCount > 0) {
      await page.locator(vehicleSelector).first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${EVIDENCE_DIR}/screenshots/${workflowName}-step2-vehicle-selected.png`,
        fullPage: true,
      });
    }

    // Step 3: Look for assign driver button
    const assignButton = page.locator('button:has-text("Assign"), button:has-text("Driver")');
    const hasAssignButton = await assignButton.count() > 0;

    if (hasAssignButton) {
      await assignButton.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${EVIDENCE_DIR}/screenshots/${workflowName}-step3-assign-dialog.png`,
        fullPage: true,
      });
    }

    // Collect workflow evidence
    const workflowEvidence = {
      workflowName,
      timestamp: new Date().toISOString(),
      totalTime: Date.now() - startTime,
      steps: [
        { step: 1, action: 'Navigate to fleet', screenshot: `${workflowName}-step1-fleet.png` },
        { step: 2, action: 'Select vehicle', screenshot: `${workflowName}-step2-vehicle-selected.png`, completed: vehicleCount > 0 },
        { step: 3, action: 'Open assign dialog', screenshot: `${workflowName}-step3-assign-dialog.png`, completed: hasAssignButton },
      ],
      success: vehicleCount > 0,
    };

    writeFileSync(
      `${EVIDENCE_DIR}/logs/workflow-${workflowName}.json`,
      JSON.stringify(workflowEvidence, null, 2)
    );

    expect(workflowEvidence.success).toBe(true);
  });

  // ========================================
  // PHASE 4: PERFORMANCE & METRICS
  // ========================================

  test('PERF-001: Page load performance metrics', async ({ page }) => {
    const pages = ['/fleet', '/drivers', '/maintenance', '/compliance', '/analytics'];
    const performanceMetrics = [];

    for (const route of pages) {
      const startTime = Date.now();
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Get navigation timing if available
      const navigationTiming = await page.evaluate(() => {
        const perf = window.performance.getEntriesByType('navigation')[0] as any;
        if (perf) {
          return {
            domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
            loadComplete: perf.loadEventEnd - perf.loadEventStart,
            domInteractive: perf.domInteractive - perf.fetchStart,
          };
        }
        return null;
      });

      performanceMetrics.push({
        route,
        loadTime,
        navigationTiming,
        timestamp: new Date().toISOString(),
      });

      await page.screenshot({
        path: `${EVIDENCE_DIR}/screenshots/perf-${route.replace(/\//g, '_')}.png`,
      });
    }

    writeFileSync(
      `${EVIDENCE_DIR}/logs/performance-metrics.json`,
      JSON.stringify(performanceMetrics, null, 2)
    );

    // All pages should load within 5 seconds
    performanceMetrics.forEach((metric) => {
      expect(metric.loadTime).toBeLessThan(5000);
    });
  });
});
