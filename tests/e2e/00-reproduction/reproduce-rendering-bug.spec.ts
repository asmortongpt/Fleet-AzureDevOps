import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PASS 1: REPRODUCTION TEST
 * This test captures the BEFORE state and gathers evidence
 */

test.describe('PASS 1: Reproduction - Fleet Dashboard Rendering', () => {
  const evidence: any = {
    timestamp: new Date().toISOString(),
    consoleErrors: [],
    consoleWarnings: [],
    networkFailures: [],
    apiCalls: [],
    domState: {},
    screenshots: {}
  };

  test.beforeEach(async ({ page }) => {
    // Capture console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        evidence.consoleErrors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        evidence.consoleWarnings.push(text);
        console.log(`⚠️  CONSOLE WARNING: ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      evidence.consoleErrors.push(`PAGE ERROR: ${error.message}`);
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Capture network failures
    page.on('requestfailed', request => {
      evidence.networkFailures.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText
      });
      console.log(`❌ NETWORK FAIL: ${request.url()}`);
    });

    // Capture API calls
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('vehicles') || url.includes('data')) {
        evidence.apiCalls.push({
          url: url,
          status: response.status(),
          method: response.request().method(),
          contentType: response.headers()['content-type']
        });
        console.log(`📡 API: ${response.request().method()} ${url} - ${response.status()}`);
      }
    });
  });

  test('Reproduce: Fleet Dashboard - Capture BEFORE state', async ({ page }) => {
    console.log('\n' + '='.repeat(100));
    console.log('🔬 PASS 1: REPRODUCING BUG - GATHERING EVIDENCE');
    console.log('='.repeat(100) + '\n');

    // Navigate to app
    console.log('📍 Step 1: Navigate to Fleet Dashboard');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log(`✅ Page loaded: ${page.url()}\n`);

    // Wait for React to mount and stabilize
    await page.waitForTimeout(3000);

    // === DOM STATE ANALYSIS ===
    console.log('🔍 Step 2: Analyzing DOM State');

    const domState = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;

      // Get all text content
      const bodyText = body.innerText;

      // Count UI elements
      const buttons = document.querySelectorAll('button').length;
      const inputs = document.querySelectorAll('input').length;
      const tables = document.querySelectorAll('table').length;
      const tableRows = document.querySelectorAll('table tbody tr').length;

      // Check for specific data indicators
      const hasVehicleData = bodyText.includes('TML-') || bodyText.includes('VHL-');
      const hasZeroMessage = bodyText.includes('0 Total') || bodyText.includes('0 vehicles');
      const hasNoDataMessage = bodyText.toLowerCase().includes('no vehicles match');

      // Check for loading states
      const hasLoadingSpinner = document.querySelector('[class*="spin"], [class*="loading"]') !== null;

      // Get KPI values
      const kpiRegex = /(\d+)\s*(Total Vehicles|Active|In Service|Low Fuel|Warnings)/gi;
      const kpis: any = {};
      let match;
      while ((match = kpiRegex.exec(bodyText)) !== null) {
        kpis[match[2]] = parseInt(match[1]);
      }

      // Get localStorage
      const localStorage: any = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          localStorage[key] = window.localStorage.getItem(key);
        }
      }

      return {
        rootExists: !!root,
        rootChildrenCount: root?.children.length || 0,
        bodyTextLength: bodyText.length,
        bodyTextPreview: bodyText.substring(0, 500),
        buttons,
        inputs,
        tables,
        tableRows,
        hasVehicleData,
        hasZeroMessage,
        hasNoDataMessage,
        hasLoadingSpinner,
        kpis,
        localStorage
      };
    });

    evidence.domState = domState;

    console.log(`  Root element: ${domState.rootExists ? '✅' : '❌'}`);
    console.log(`  Root children: ${domState.rootChildrenCount}`);
    console.log(`  Buttons: ${domState.buttons}`);
    console.log(`  Inputs: ${domState.inputs}`);
    console.log(`  Tables: ${domState.tables}`);
    console.log(`  Table rows: ${domState.tableRows}`);
    console.log(`  Has vehicle data: ${domState.hasVehicleData ? '✅' : '❌'}`);
    console.log(`  Has "0" message: ${domState.hasZeroMessage ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  Has "no data" message: ${domState.hasNoDataMessage ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  KPIs found:`, domState.kpis);
    console.log(`  LocalStorage keys: ${Object.keys(domState.localStorage).length}`);
    Object.keys(domState.localStorage).forEach(key => {
      console.log(`    - ${key}: ${domState.localStorage[key]}`);
    });
    console.log('');

    // === SCREENSHOT CAPTURE ===
    console.log('📸 Step 3: Capturing screenshots (multiple viewports)');

    // Desktop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    const desktopPath = 'test-results/screenshots/BEFORE-desktop-1440x900.png';
    await page.screenshot({ path: desktopPath, fullPage: true });
    evidence.screenshots.desktop = desktopPath;
    console.log(`  ✅ Desktop: ${desktopPath}`);

    // Laptop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    const laptopPath = 'test-results/screenshots/BEFORE-laptop-1280x720.png';
    await page.screenshot({ path: laptopPath, fullPage: true });
    evidence.screenshots.laptop = laptopPath;
    console.log(`  ✅ Laptop: ${laptopPath}`);

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletPath = 'test-results/screenshots/BEFORE-tablet-768x1024.png';
    await page.screenshot({ path: tabletPath, fullPage: true });
    evidence.screenshots.tablet = tabletPath;
    console.log(`  ✅ Tablet: ${tabletPath}`);

    // Mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobilePath = 'test-results/screenshots/BEFORE-mobile-390x844.png';
    await page.screenshot({ path: mobilePath, fullPage: true });
    evidence.screenshots.mobile = mobilePath;
    console.log(`  ✅ Mobile: ${mobilePath}\n`);

    // === ERROR SUMMARY ===
    console.log('📊 Step 4: Error Summary');
    console.log(`  Console errors: ${evidence.consoleErrors.length}`);
    console.log(`  Console warnings: ${evidence.consoleWarnings.length}`);
    console.log(`  Network failures: ${evidence.networkFailures.length}`);
    console.log(`  API calls: ${evidence.apiCalls.length}\n`);

    if (evidence.consoleErrors.length > 0) {
      console.log('❌ CONSOLE ERRORS:');
      evidence.consoleErrors.slice(0, 10).forEach((err: string, idx: number) => {
        console.log(`  ${idx + 1}. ${err.substring(0, 150)}`);
      });
      console.log('');
    }

    if (evidence.apiCalls.length > 0) {
      console.log('📡 API CALLS:');
      evidence.apiCalls.forEach((call: any) => {
        const status = call.status >= 400 ? '❌' : '✅';
        console.log(`  ${status} ${call.method} ${call.url} - ${call.status}`);
      });
      console.log('');
    }

    // === SAVE EVIDENCE ===
    const evidencePath = 'test-results/PASS1-EVIDENCE.json';
    fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    console.log(`💾 Evidence saved: ${evidencePath}\n`);

    // === PRELIMINARY DIAGNOSIS ===
    console.log('='.repeat(100));
    console.log('🔬 PRELIMINARY DIAGNOSIS');
    console.log('='.repeat(100));

    if (domState.tableRows === 0 && domState.hasZeroMessage) {
      console.log('❌ CONFIRMED: No data loading - 0 vehicles displayed');
      console.log('   Symptoms:');
      console.log('   - Table has 0 rows');
      console.log('   - KPIs show 0 values');
      console.log('   - "No data" or "0 Total" messages present');
    }

    if (evidence.apiCalls.length === 0) {
      console.log('❌ CONFIRMED: No API calls being made');
      console.log('   - Data fetching not triggering');
    } else {
      const failedCalls = evidence.apiCalls.filter((c: any) => c.status >= 400);
      if (failedCalls.length > 0) {
        console.log(`❌ CONFIRMED: ${failedCalls.length} API calls failing`);
      }
    }

    if (evidence.consoleErrors.length > 0) {
      console.log(`❌ CONFIRMED: ${evidence.consoleErrors.length} console errors present`);
    }

    console.log('='.repeat(100) + '\n');

    // Assertions to mark test as expected failure (we're documenting the bug)
    expect(evidence.consoleErrors.length).toBe(0); // This will fail if there are errors
    expect(domState.tableRows).toBeGreaterThan(0); // This will fail if no data
    expect(domState.hasZeroMessage).toBe(false); // This will fail if showing 0
  });
});
