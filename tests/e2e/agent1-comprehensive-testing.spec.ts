/**
 * Agent 1: Comprehensive Feature Testing & Validation
 *
 * MISSION: Test ALL application features and identify issues
 *
 * This test suite covers:
 * 1. Google Maps Integration (loading, markers, geocoding, CSP)
 * 2. Dashboard & UI (stats, drilldowns, theme, accessibility)
 * 3. API Endpoints (health, vehicles, drivers, maintenance, WebSocket)
 * 4. 3D Garage Feature (models, damage overlay, controls)
 * 5. Performance (page load, bundle size, API response times)
 *
 * Test Methodology: Playwright E2E on production URLs
 * Output: JSON report with screenshots, metrics, and severity levels
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import AxeBuilder from '@axe-core/playwright';
import { test, expect, Page } from '@playwright/test';

// Test Configuration
const PRODUCTION_URLS = [
  'http://20.161.96.87',
  'https://fleet.capitaltechalliance.com'
];

const TEST_URL = process.env.TEST_URL || PRODUCTION_URLS[0];

// Evidence collection
const EVIDENCE_DIR = path.join(process.cwd(), 'agent1-test-evidence');
const RUN_ID = `agent1-run-${Date.now()}`;
const RUN_DIR = path.join(EVIDENCE_DIR, RUN_ID);

interface TestIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  feature: string;
  description: string;
  evidence?: string[];
  timestamp: string;
}

interface FeatureTestResult {
  feature: string;
  passed: boolean;
  tests: number;
  failed: number;
  issues: TestIssue[];
  performanceMetrics?: Record<string, number>;
  screenshots: string[];
}

const testResults: FeatureTestResult[] = [];
const allIssues: TestIssue[] = [];
const evidenceFiles: { path: string; hash: string }[] = [];

// Helper functions
async function saveEvidence(filename: string, content: Buffer | string, subdir?: string): Promise<string> {
  const dir = subdir ? path.join(RUN_DIR, subdir) : RUN_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const filepath = path.join(dir, filename);
  const buffer = typeof content === 'string' ? Buffer.from(content) : content;
  fs.writeFileSync(filepath, buffer);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  evidenceFiles.push({ path: filepath.replace(EVIDENCE_DIR + '/', ''), hash });
  return filepath.replace(EVIDENCE_DIR + '/', '');
}

async function captureScreenshot(page: Page, name: string): Promise<string> {
  const screenshot = await page.screenshot({ fullPage: true });
  return saveEvidence(`${name}.png`, screenshot, 'screenshots');
}

function addIssue(issue: TestIssue) {
  allIssues.push(issue);
}

// Setup
test.beforeAll(async () => {
  if (!fs.existsSync(RUN_DIR)) {
    fs.mkdirSync(RUN_DIR, { recursive: true });
    ['screenshots', 'api-results', 'performance', 'accessibility', 'maps', '3d-garage'].forEach(dir => {
      fs.mkdirSync(path.join(RUN_DIR, dir), { recursive: true });
    });
  }
});

test.describe('Feature Test 1: Google Maps Integration', () => {
  let featureResult: FeatureTestResult;

  test.beforeEach(async () => {
    featureResult = {
      feature: 'Google Maps Integration',
      passed: true,
      tests: 0,
      failed: 0,
      issues: [],
      screenshots: []
    };
  });

  test('Google Maps API key is configured correctly', async ({ page }) => {
    featureResult.tests++;

    // Check environment configuration
    const hasApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY?.startsWith('AIzaSy');

    if (!hasApiKey) {
      addIssue({
        severity: 'critical',
        category: 'Configuration',
        feature: 'Google Maps',
        description: 'Google Maps API key is not configured or invalid',
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
      featureResult.passed = false;
    }

    await saveEvidence('google-maps-config.json', JSON.stringify({
      apiKeyPresent: hasApiKey,
      apiKeyPrefix: process.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'missing'
    }, null, 2), 'maps');

    expect(hasApiKey).toBe(true);
  });

  test('Google Maps loads on dashboard', async ({ page }) => {
    featureResult.tests++;
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('maps')) {
        errors.push(msg.text());
      }
    });

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const screenshot = await captureScreenshot(page, '01-maps-dashboard-load');
    featureResult.screenshots.push(screenshot);

    // Check for map elements
    const mapElements = [
      'div[role="region"][aria-label*="Map"]',
      '.google-map',
      '[class*="gm-"]',
      'canvas',
      '.leaflet-container'
    ];

    let mapFound = false;
    for (const selector of mapElements) {
      const element = await page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        mapFound = true;
        break;
      }
    }

    if (!mapFound) {
      addIssue({
        severity: 'high',
        category: 'UI',
        feature: 'Google Maps',
        description: 'No map element found on dashboard',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    if (errors.length > 0) {
      addIssue({
        severity: 'medium',
        category: 'Console Errors',
        feature: 'Google Maps',
        description: `Map-related console errors: ${errors.join('; ')}`,
        timestamp: new Date().toISOString()
      });
    }

    await saveEvidence('maps-load-test.json', JSON.stringify({
      mapFound,
      errors,
      checkedSelectors: mapElements
    }, null, 2), 'maps');
  });

  test('Vehicle markers display on map', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for markers to load

    const screenshot = await captureScreenshot(page, '02-maps-vehicle-markers');
    featureResult.screenshots.push(screenshot);

    // Check for marker elements
    const markerCount = await page.evaluate(() => {
      const selectors = [
        '[class*="marker"]',
        '[class*="Marker"]',
        'img[src*="marker"]',
        '.leaflet-marker-icon'
      ];
      let count = 0;
      selectors.forEach(selector => {
        count += document.querySelectorAll(selector).length;
      });
      return count;
    });

    await saveEvidence('vehicle-markers.json', JSON.stringify({
      markerCount,
      timestamp: new Date().toISOString()
    }, null, 2), 'maps');

    if (markerCount === 0) {
      addIssue({
        severity: 'medium',
        category: 'Data',
        feature: 'Google Maps',
        description: 'No vehicle markers found on map',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
    }
  });

  test('CSP allows Google Maps domains', async ({ page }) => {
    featureResult.tests++;

    const response = await page.goto(TEST_URL);
    const headers = response?.headers() || {};
    const csp = headers['content-security-policy'] || '';

    const requiredDomains = [
      'maps.googleapis.com',
      'maps.gstatic.com',
      '*.google.com'
    ];

    const missingDomains = requiredDomains.filter(domain =>
      !csp.includes(domain) && !csp.includes('*')
    );

    if (missingDomains.length > 0 && csp.length > 0) {
      addIssue({
        severity: 'high',
        category: 'Security',
        feature: 'Google Maps',
        description: `CSP may block Google Maps domains: ${missingDomains.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    await saveEvidence('maps-csp-check.json', JSON.stringify({
      cspPresent: csp.length > 0,
      requiredDomains,
      missingDomains
    }, null, 2), 'maps');
  });

  test.afterAll(async () => {
    featureResult.issues = allIssues.filter(i => i.feature === 'Google Maps');
    featureResult.passed = featureResult.failed === 0;
    testResults.push(featureResult);
  });
});

test.describe('Feature Test 2: Dashboard & UI', () => {
  let featureResult: FeatureTestResult;

  test.beforeEach(async () => {
    featureResult = {
      feature: 'Dashboard & UI',
      passed: true,
      tests: 0,
      failed: 0,
      issues: [],
      screenshots: []
    };
  });

  test('Dashboard loads with all stat cards', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const screenshot = await captureScreenshot(page, '03-dashboard-stats');
    featureResult.screenshots.push(screenshot);

    // Find stat cards
    const statCards = await page.locator('[class*="stat"], [class*="metric"], [class*="card"]').count();

    // Check for specific stats
    const expectedStats = ['vehicles', 'drivers', 'maintenance', 'fuel'];
    const foundStats = await page.evaluate((stats) => {
      const text = document.body.innerText.toLowerCase();
      return stats.filter(stat => text.includes(stat));
    }, expectedStats);

    if (statCards === 0) {
      addIssue({
        severity: 'critical',
        category: 'UI',
        feature: 'Dashboard',
        description: 'No stat cards found on dashboard',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    await saveEvidence('dashboard-stats.json', JSON.stringify({
      statCards,
      expectedStats,
      foundStats
    }, null, 2), 'screenshots');
  });

  test('Fleet logo displays correctly', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const screenshot = await captureScreenshot(page, '04-fleet-logo');
    featureResult.screenshots.push(screenshot);

    const logo = await page.locator('img[alt*="Fleet"], img[alt*="logo"], [class*="logo"]').first();
    const logoVisible = await logo.isVisible().catch(() => false);

    if (!logoVisible) {
      addIssue({
        severity: 'low',
        category: 'Branding',
        feature: 'Dashboard',
        description: 'Fleet logo not visible',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
    }
  });

  test('Professional theme is applied', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const screenshot = await captureScreenshot(page, '05-theme');
    featureResult.screenshots.push(screenshot);

    const themeColors = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = window.getComputedStyle(root);
      return {
        background: styles.getPropertyValue('background-color'),
        primary: styles.getPropertyValue('--primary') || 'not-set',
        hasTheme: document.body.className.includes('theme') ||
                  document.documentElement.className.includes('theme')
      };
    });

    await saveEvidence('theme-check.json', JSON.stringify(themeColors, null, 2), 'screenshots');
  });

  test('Drilldown functionality works', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    // Try to find and click drilldown elements
    const drilldownSelectors = [
      'button[class*="drill"]',
      '[role="button"]',
      'a[href*="details"]',
      '.clickable'
    ];

    let drilldownFound = false;
    for (const selector of drilldownSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        await element.click().catch(() => {});
        await page.waitForTimeout(1000);
        drilldownFound = true;
        break;
      }
    }

    const screenshot = await captureScreenshot(page, '06-drilldown');
    featureResult.screenshots.push(screenshot);

    if (!drilldownFound) {
      addIssue({
        severity: 'medium',
        category: 'Interaction',
        feature: 'Dashboard',
        description: 'No drilldown elements found or clickable',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
    }
  });

  test('Responsive design - Mobile', async ({ page }) => {
    featureResult.tests++;

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const screenshot = await captureScreenshot(page, '07-responsive-mobile');
    featureResult.screenshots.push(screenshot);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const hasOverflow = bodyWidth > 385; // 10px tolerance

    if (hasOverflow) {
      addIssue({
        severity: 'medium',
        category: 'Responsive',
        feature: 'Dashboard',
        description: `Horizontal overflow on mobile (${bodyWidth}px > 375px)`,
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }
  });

  test('WCAG 2.1 AA Accessibility', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const criticalViolations = axeResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    await saveEvidence('accessibility-report.json', JSON.stringify({
      total: axeResults.violations.length,
      critical: criticalViolations.length,
      violations: axeResults.violations.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      }))
    }, null, 2), 'accessibility');

    if (criticalViolations.length > 0) {
      addIssue({
        severity: 'high',
        category: 'Accessibility',
        feature: 'Dashboard',
        description: `${criticalViolations.length} critical accessibility violations found`,
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }
  });

  test.afterAll(async () => {
    featureResult.issues = allIssues.filter(i => i.feature === 'Dashboard');
    featureResult.passed = featureResult.failed === 0;
    testResults.push(featureResult);
  });
});

test.describe('Feature Test 3: API Endpoints & WebSocket', () => {
  let featureResult: FeatureTestResult;

  test.beforeEach(async () => {
    featureResult = {
      feature: 'API Endpoints',
      passed: true,
      tests: 0,
      failed: 0,
      issues: [],
      screenshots: [],
      performanceMetrics: {}
    };
  });

  test('Health endpoint responds', async ({ request }) => {
    featureResult.tests++;

    const healthPaths = ['/api/health', '/health', '/api/status'];
    const results: Record<string, any> = {};

    for (const path of healthPaths) {
      const start = Date.now();
      try {
        const response = await request.get(path, { timeout: 5000 });
        results[path] = {
          status: response.status(),
          ok: response.ok(),
          responseTime: Date.now() - start
        };
      } catch (e) {
        results[path] = {
          error: 'Failed to connect',
          responseTime: Date.now() - start
        };
      }
    }

    const anySuccess = Object.values(results).some((r: any) => r.ok);

    if (!anySuccess) {
      addIssue({
        severity: 'critical',
        category: 'API',
        feature: 'API Endpoints',
        description: 'No health endpoint responding',
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    await saveEvidence('health-endpoints.json', JSON.stringify(results, null, 2), 'api-results');
  });

  test('Vehicles endpoint', async ({ request }) => {
    featureResult.tests++;

    const start = Date.now();
    try {
      const response = await request.get('/api/vehicles', { timeout: 5000 });
      const responseTime = Date.now() - start;

      featureResult.performanceMetrics!['vehicles-api-response'] = responseTime;

      const result = {
        status: response.status(),
        ok: response.ok(),
        responseTime,
        hasData: false
      };

      if (response.ok()) {
        const data = await response.json().catch(() => null);
        result.hasData = Array.isArray(data) && data.length > 0;
      }

      await saveEvidence('vehicles-endpoint.json', JSON.stringify(result, null, 2), 'api-results');

      if (!response.ok()) {
        addIssue({
          severity: 'high',
          category: 'API',
          feature: 'API Endpoints',
          description: `Vehicles endpoint returned ${response.status()}`,
          timestamp: new Date().toISOString()
        });
        featureResult.failed++;
      }
    } catch (e) {
      addIssue({
        severity: 'critical',
        category: 'API',
        feature: 'API Endpoints',
        description: 'Vehicles endpoint failed to respond',
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }
  });

  test('Drivers endpoint', async ({ request }) => {
    featureResult.tests++;

    const start = Date.now();
    try {
      const response = await request.get('/api/drivers', { timeout: 5000 });
      const responseTime = Date.now() - start;

      featureResult.performanceMetrics!['drivers-api-response'] = responseTime;

      await saveEvidence('drivers-endpoint.json', JSON.stringify({
        status: response.status(),
        responseTime
      }, null, 2), 'api-results');
    } catch (e) {
      // Non-critical - may not be implemented
    }
  });

  test('WebSocket connection', async ({ page }) => {
    featureResult.tests++;

    const wsMessages: any[] = [];
    let wsConnected = false;

    page.on('websocket', ws => {
      wsConnected = true;
      ws.on('framereceived', event => {
        wsMessages.push({
          payload: event.payload,
          timestamp: new Date().toISOString()
        });
      });
    });

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for WS connection

    await saveEvidence('websocket-connection.json', JSON.stringify({
      connected: wsConnected,
      messagesReceived: wsMessages.length
    }, null, 2), 'api-results');

    if (!wsConnected) {
      addIssue({
        severity: 'medium',
        category: 'Real-time',
        feature: 'API Endpoints',
        description: 'WebSocket connection not established',
        timestamp: new Date().toISOString()
      });
    }
  });

  test.afterAll(async () => {
    featureResult.issues = allIssues.filter(i => i.feature === 'API Endpoints');
    featureResult.passed = featureResult.failed === 0;
    testResults.push(featureResult);
  });
});

test.describe('Feature Test 4: 3D Garage', () => {
  let featureResult: FeatureTestResult;

  test.beforeEach(async () => {
    featureResult = {
      feature: '3D Garage',
      passed: true,
      tests: 0,
      failed: 0,
      issues: [],
      screenshots: []
    };
  });

  test('3D Garage page loads', async ({ page }) => {
    featureResult.tests++;

    await page.goto(`${TEST_URL}/garage`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const screenshot = await captureScreenshot(page, '08-3d-garage');
    featureResult.screenshots.push(screenshot);

    const has3DCanvas = await page.locator('canvas').count() > 0;

    if (!has3DCanvas) {
      addIssue({
        severity: 'medium',
        category: 'Feature',
        feature: '3D Garage',
        description: '3D canvas not found on garage page',
        evidence: [screenshot],
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    await saveEvidence('3d-garage-load.json', JSON.stringify({
      canvasFound: has3DCanvas,
      url: page.url()
    }, null, 2), '3d-garage');
  });

  test('3D models load without errors', async ({ page }) => {
    featureResult.tests++;
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto(`${TEST_URL}/garage`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const webglErrors = errors.filter(e =>
      e.toLowerCase().includes('webgl') ||
      e.toLowerCase().includes('three') ||
      e.toLowerCase().includes('3d')
    );

    if (webglErrors.length > 0) {
      addIssue({
        severity: 'high',
        category: 'Rendering',
        feature: '3D Garage',
        description: `3D rendering errors: ${webglErrors.slice(0, 3).join('; ')}`,
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    await saveEvidence('3d-errors.json', JSON.stringify({
      totalErrors: errors.length,
      webglErrors
    }, null, 2), '3d-garage');
  });

  test.afterAll(async () => {
    featureResult.issues = allIssues.filter(i => i.feature === '3D Garage');
    featureResult.passed = featureResult.failed === 0;
    testResults.push(featureResult);
  });
});

test.describe('Feature Test 5: Performance', () => {
  let featureResult: FeatureTestResult;

  test.beforeEach(async () => {
    featureResult = {
      feature: 'Performance',
      passed: true,
      tests: 0,
      failed: 0,
      issues: [],
      screenshots: [],
      performanceMetrics: {}
    };
  });

  test('Page load performance', async ({ page }) => {
    featureResult.tests++;

    const startTime = Date.now();
    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');
    const totalLoadTime = Date.now() - startTime;

    const metrics = await page.evaluate(() => {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart,
        firstPaint: paint.find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        transferSize: navigation?.transferSize || 0,
        domNodes: document.querySelectorAll('*').length
      };
    });

    featureResult.performanceMetrics = {
      totalLoadTime,
      ...metrics
    };

    // Performance thresholds
    const THRESHOLDS = {
      maxLoadTime: 10000,
      maxFCP: 3000,
      maxDOMNodes: 5000
    };

    if (totalLoadTime > THRESHOLDS.maxLoadTime) {
      addIssue({
        severity: 'high',
        category: 'Performance',
        feature: 'Performance',
        description: `Page load time ${totalLoadTime}ms exceeds threshold ${THRESHOLDS.maxLoadTime}ms`,
        timestamp: new Date().toISOString()
      });
      featureResult.failed++;
    }

    if (metrics.firstContentfulPaint > THRESHOLDS.maxFCP && metrics.firstContentfulPaint !== 0) {
      addIssue({
        severity: 'medium',
        category: 'Performance',
        feature: 'Performance',
        description: `First Contentful Paint ${metrics.firstContentfulPaint}ms exceeds ${THRESHOLDS.maxFCP}ms`,
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.domNodes > THRESHOLDS.maxDOMNodes) {
      addIssue({
        severity: 'low',
        category: 'Performance',
        feature: 'Performance',
        description: `DOM nodes ${metrics.domNodes} exceeds recommended ${THRESHOLDS.maxDOMNodes}`,
        timestamp: new Date().toISOString()
      });
    }

    await saveEvidence('performance-metrics.json', JSON.stringify({
      metrics,
      thresholds: THRESHOLDS,
      passed: totalLoadTime <= THRESHOLDS.maxLoadTime
    }, null, 2), 'performance');
  });

  test('Memory usage', async ({ page }) => {
    featureResult.tests++;

    await page.goto(TEST_URL);
    await page.waitForLoadState('networkidle');

    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore - performance.memory is Chrome-specific
      const mem = (performance as any).memory;
      if (mem) {
        return {
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize,
          jsHeapSizeLimit: mem.jsHeapSizeLimit,
          usedMB: Math.round(mem.usedJSHeapSize / 1024 / 1024)
        };
      }
      return null;
    });

    if (memoryInfo) {
      featureResult.performanceMetrics!['memoryUsedMB'] = memoryInfo.usedMB;

      if (memoryInfo.usedMB > 100) {
        addIssue({
          severity: 'medium',
          category: 'Performance',
          feature: 'Performance',
          description: `High memory usage: ${memoryInfo.usedMB}MB`,
          timestamp: new Date().toISOString()
        });
      }

      await saveEvidence('memory-usage.json', JSON.stringify(memoryInfo, null, 2), 'performance');
    }
  });

  test.afterAll(async () => {
    featureResult.issues = allIssues.filter(i => i.feature === 'Performance');
    featureResult.passed = featureResult.failed === 0;
    testResults.push(featureResult);
  });
});

// Generate final report
test.afterAll(async () => {
  const summary = {
    runId: RUN_ID,
    timestamp: new Date().toISOString(),
    testUrl: TEST_URL,
    totalFeatures: testResults.length,
    passedFeatures: testResults.filter(r => r.passed).length,
    failedFeatures: testResults.filter(r => !r.passed).length,
    totalTests: testResults.reduce((sum, r) => sum + r.tests, 0),
    totalIssues: allIssues.length,
    issuesBySeverity: {
      critical: allIssues.filter(i => i.severity === 'critical').length,
      high: allIssues.filter(i => i.severity === 'high').length,
      medium: allIssues.filter(i => i.severity === 'medium').length,
      low: allIssues.filter(i => i.severity === 'low').length
    },
    features: testResults,
    issues: allIssues,
    evidenceFiles: evidenceFiles.length
  };

  // Save comprehensive report
  fs.writeFileSync(
    path.join(RUN_DIR, 'AGENT1_COMPREHENSIVE_REPORT.json'),
    JSON.stringify(summary, null, 2)
  );

  // Create human-readable summary
  const readableReport = `
# Agent 1: Comprehensive Feature Testing Report
Run ID: ${RUN_ID}
Timestamp: ${new Date().toISOString()}
Test URL: ${TEST_URL}

## Summary
- Total Features Tested: ${summary.totalFeatures}
- Passed: ${summary.passedFeatures}
- Failed: ${summary.failedFeatures}
- Total Tests: ${summary.totalTests}
- Total Issues: ${summary.totalIssues}

## Issues by Severity
- Critical: ${summary.issuesBySeverity.critical}
- High: ${summary.issuesBySeverity.high}
- Medium: ${summary.issuesBySeverity.medium}
- Low: ${summary.issuesBySeverity.low}

## Feature Results
${testResults.map(f => `
### ${f.feature}
- Status: ${f.passed ? 'PASSED' : 'FAILED'}
- Tests: ${f.tests}
- Failed: ${f.failed}
- Issues: ${f.issues.length}
- Screenshots: ${f.screenshots.length}
${f.performanceMetrics ? `- Performance Metrics: ${JSON.stringify(f.performanceMetrics, null, 2)}` : ''}
`).join('\n')}

## Critical Issues
${allIssues.filter(i => i.severity === 'critical').map(i =>
  `- [${i.category}] ${i.feature}: ${i.description}`
).join('\n')}

## High Priority Issues
${allIssues.filter(i => i.severity === 'high').map(i =>
  `- [${i.category}] ${i.feature}: ${i.description}`
).join('\n')}

## Evidence Files
Total evidence files: ${evidenceFiles.length}
Location: ${RUN_DIR}
`;

  fs.writeFileSync(
    path.join(RUN_DIR, 'AGENT1_REPORT.md'),
    readableReport
  );

  // Console output
  console.log('\n' + '='.repeat(80));
  console.log('AGENT 1: COMPREHENSIVE FEATURE TESTING REPORT');
  console.log('='.repeat(80));
  console.log(`Run ID: ${RUN_ID}`);
  console.log(`Test URL: ${TEST_URL}`);
  console.log(`Features Tested: ${summary.totalFeatures}`);
  console.log(`Passed: ${summary.passedFeatures} | Failed: ${summary.failedFeatures}`);
  console.log(`Total Issues: ${summary.totalIssues}`);
  console.log(`  Critical: ${summary.issuesBySeverity.critical}`);
  console.log(`  High: ${summary.issuesBySeverity.high}`);
  console.log(`  Medium: ${summary.issuesBySeverity.medium}`);
  console.log(`  Low: ${summary.issuesBySeverity.low}`);
  console.log('='.repeat(80));

  testResults.forEach(feature => {
    console.log(`${feature.passed ? '✅' : '❌'} ${feature.feature}: ${feature.tests} tests, ${feature.failed} failed`);
  });

  console.log('='.repeat(80));
  console.log(`📁 Evidence: ${RUN_DIR}`);
  console.log('='.repeat(80));
});
