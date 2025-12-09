import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('PASS 3: Verification - Fleet Dashboard After Fix', () => {
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
    // Capture console messages
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
    });

    // Capture API calls
    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('vehicles') || url.includes('data')) {
        evidence.apiCalls.push({
          url: url,
          status: response.status(),
          method: response.request().method()
        });
      }
    });
  });

  test('Verify: Fleet Dashboard - Capture AFTER state (post-fix)', async ({ page }) => {
    console.log('\n====================================================================================================');
    console.log('🔬 PASS 3: VERIFICATION - AFTER FIX');
    console.log('====================================================================================================\n');

    console.log('📍 Step 1: Navigate to Fleet Dashboard');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // Wait for map and telemetry initialization
    console.log('✅ Page loaded: http://localhost:5173/\n');

    console.log('🔍 Step 2: Analyzing DOM State');
    const domState = await page.evaluate(() => {
      const root = document.getElementById('root');
      const buttons = document.querySelectorAll('button');
      const tables = document.querySelectorAll('table');
      const rows = document.querySelectorAll('table tbody tr');

      // Check for KPIs
      const kpis: any = {};
      document.querySelectorAll('[class*="stat-"]').forEach(el => {
        const label = el.textContent?.match(/([A-Za-z\s]+)/)?.[0]?.trim();
        const value = parseInt(el.textContent?.match(/\d+/)?.[0] || '0');
        if (label) kpis[label] = value;
      });

      return {
        rootExists: !!root,
        rootChildren: root?.children.length || 0,
        buttonCount: buttons.length,
        tableCount: tables.length,
        tableRowCount: rows.length,
        hasVehicleData: rows.length > 0,
        hasZeroMessage: document.body.textContent?.includes('0') || false,
        hasNoDataMessage: document.body.textContent?.toLowerCase().includes('no data') || false,
        kpis,
        localStorage: Object.keys(window.localStorage).length
      };
    });

    evidence.domState = domState;
    console.log('  Root element:', domState.rootExists ? '✅' : '❌');
    console.log('  Root children:', domState.rootChildren);
    console.log('  Buttons:', domState.buttonCount);
    console.log('  Tables:', domState.tableCount);
    console.log('  Table rows:', domState.tableRowCount);
    console.log('  Has vehicle data:', domState.hasVehicleData ? '✅' : '❌');
    console.log('  Has "0" message:', domState.hasZeroMessage ? '⚠️  YES' : '✅ NO');
    console.log('  Has "no data" message:', domState.hasNoDataMessage ? '❌ YES' : '✅ NO');
    console.log('  KPIs found:', domState.kpis);
    console.log('  LocalStorage keys:', domState.localStorage);
    console.log('');

    console.log('📸 Step 3: Capturing AFTER screenshots');
    const screenshotsDir = path.join(process.cwd(), 'test-results', 'screenshots');
    fs.mkdirSync(screenshotsDir, { recursive: true });

    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    const desktopPath = path.join(screenshotsDir, 'AFTER-desktop-1440x900.png');
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log('  ✅ Desktop:', desktopPath);

    // Laptop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);
    const laptopPath = path.join(screenshotsDir, 'AFTER-laptop-1280x720.png');
    await page.screenshot({ path: laptopPath, fullPage: false });
    console.log('  ✅ Laptop:', laptopPath);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletPath = path.join(screenshotsDir, 'AFTER-tablet-768x1024.png');
    await page.screenshot({ path: tabletPath, fullPage: false });
    console.log('  ✅ Tablet:', tabletPath);

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobilePath = path.join(screenshotsDir, 'AFTER-mobile-390x844.png');
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log('  ✅ Mobile:', mobilePath);
    console.log('');

    console.log('📊 Step 4: Error Summary');
    console.log('  Console errors:', evidence.consoleErrors.length);
    console.log('  Console warnings:', evidence.consoleWarnings.length);
    console.log('  Network failures:', evidence.networkFailures.length);
    console.log('  API calls:', evidence.apiCalls.length);
    console.log('');

    if (evidence.consoleErrors.length > 0) {
      console.log('❌ CONSOLE ERRORS:');
      evidence.consoleErrors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
      console.log('');
    }

    if (evidence.consoleWarnings.length > 0) {
      console.log('⚠️  CONSOLE WARNINGS:');
      evidence.consoleWarnings.forEach((warn: string, i: number) => {
        console.log(`  ${i + 1}. ${warn.substring(0, 200)}`);
      });
      console.log('');
    }

    // Save evidence
    const evidencePath = path.join(process.cwd(), 'test-results', 'PASS3-AFTER-EVIDENCE.json');
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    console.log('💾 Evidence saved:', evidencePath);
    console.log('');

    console.log('====================================================================================================');
    console.log('🎯 VERIFICATION RESULT');
    console.log('====================================================================================================');

    // Expected: 0 errors
    if (evidence.consoleErrors.length === 0) {
      console.log('✅ SUCCESS: 0 console errors detected');
    } else {
      console.log(`❌ FAILURE: ${evidence.consoleErrors.length} console errors still present`);
    }

    // Expected: ≤4 warnings (only Google Maps deprecation warnings acceptable)
    if (evidence.consoleWarnings.length <= 4) {
      console.log(`✅ SUCCESS: ${evidence.consoleWarnings.length} console warnings (acceptable if only Google Maps deprecation)`);
    } else {
      console.log(`⚠️  WARNING: ${evidence.consoleWarnings.length} console warnings (expected ≤4)`);
    }

    console.log('====================================================================================================\n');

    // Assertions
    expect(evidence.consoleErrors.length, `Expected 0 console errors but found ${evidence.consoleErrors.length}`).toBe(0);
    expect(domState.rootExists, 'Root element should exist').toBe(true);
    expect(domState.tableRowCount, 'Should have vehicle data in table').toBeGreaterThan(0);
  });
});
