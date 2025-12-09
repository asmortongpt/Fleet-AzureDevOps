import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('STRICT QA INSPECTION - Complete Evidence Gathering', () => {
  test('Capture complete state with ALL console messages', async ({ page }) => {
    const evidence = {
      timestamp: new Date().toISOString(),
      consoleLog: [] as string[],
      consoleInfo: [] as string[],
      consoleWarn: [] as string[],
      consoleError: [] as string[],
      pageErrors: [] as string[],
      networkFails: [] as any[],
      networkSuccess: [] as any[],
      screenshots: {} as any
    };

    // Capture ALL console types
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const fullMsg = `[${type}] ${text}`;

      if (type === 'error') {
        evidence.consoleError.push(fullMsg);
        console.log(`❌ ERROR: ${text}`);
      } else if (type === 'warning' || type === 'warn') {
        evidence.consoleWarn.push(fullMsg);
        console.log(`⚠️  WARN: ${text}`);
      } else if (type === 'info') {
        evidence.consoleInfo.push(fullMsg);
      } else if (type === 'log') {
        evidence.consoleLog.push(fullMsg);
      } else {
        console.log(fullMsg);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      const msg = `PAGE ERROR: ${error.message}\nStack: ${error.stack}`;
      evidence.pageErrors.push(msg);
      console.log(`❌ ${msg}`);
    });

    // Capture network
    page.on('requestfailed', request => {
      evidence.networkFails.push({
        url: request.url(),
        method: request.method(),
        error: request.failure()?.errorText
      });
    });

    page.on('response', async response => {
      if (response.status() >= 200 && response.status() < 400) {
        evidence.networkSuccess.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    console.log('\n' + '='.repeat(100));
    console.log('STRICT QA INSPECTION - PASS 1');
    console.log('='.repeat(100) + '\n');

    console.log('📍 Step 1: Navigate to http://localhost:5173/');
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('⏳ Waiting 5 seconds for all initialization...');
    await page.waitForTimeout(5000);

    console.log('\n📸 Step 2: Capture screenshots');
    const screenshotDir = path.join(process.cwd(), 'test-results', 'qa-evidence');
    fs.mkdirSync(screenshotDir, { recursive: true });

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);
    const desktopPath = path.join(screenshotDir, 'CURRENT-STATE-desktop-1920x1080.png');
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log(`  ✅ Desktop screenshot: ${desktopPath}`);

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    const tabletPath = path.join(screenshotDir, 'CURRENT-STATE-tablet-768x1024.png');
    await page.screenshot({ path: tabletPath, fullPage: true });
    console.log(`  ✅ Tablet screenshot: ${tabletPath}`);

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    const mobilePath = path.join(screenshotDir, 'CURRENT-STATE-mobile-390x844.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log(`  ✅ Mobile screenshot: ${mobilePath}`);

    console.log('\n🔍 Step 3: Analyze DOM and computed styles');
    const domAnalysis = await page.evaluate(() => {
      const root = document.getElementById('root');
      const body = document.body;

      // Check for common UI elements
      const hasLogo = !!document.querySelector('[alt*="Fleet"], img[src*="logo"]');
      const hasSidebar = !!document.querySelector('nav, aside, [class*="sidebar"]');
      const hasTable = !!document.querySelector('table');
      const hasMap = !!document.querySelector('[class*="map"], #map, [id*="map"]');
      const hasKPIs = document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="kpi"]').length;

      // Get all visible text
      const allText = body.innerText || '';
      const hasFleetText = allText.includes('Fleet');
      const hasVehicleText = allText.includes('vehicle') || allText.includes('Vehicle');

      // Check for error indicators in DOM
      const hasErrorMessage = allText.toLowerCase().includes('error') ||
                             allText.toLowerCase().includes('failed') ||
                             allText.includes('404') ||
                             allText.includes('500');

      // Computed styles on root
      const rootStyles = root ? window.getComputedStyle(root) : null;

      return {
        rootExists: !!root,
        rootDisplay: rootStyles?.display || 'N/A',
        rootVisibility: rootStyles?.visibility || 'N/A',
        rootOpacity: rootStyles?.opacity || 'N/A',
        bodyBgColor: window.getComputedStyle(body).backgroundColor,
        hasLogo,
        hasSidebar,
        hasTable,
        hasMap,
        hasKPIs,
        hasFleetText,
        hasVehicleText,
        hasErrorMessage,
        visibleTextSample: allText.substring(0, 500)
      };
    });

    console.log('\n📊 DOM ANALYSIS:');
    console.log('  Root element exists:', domAnalysis.rootExists ? '✅' : '❌');
    console.log('  Root display:', domAnalysis.rootDisplay);
    console.log('  Root visibility:', domAnalysis.rootVisibility);
    console.log('  Root opacity:', domAnalysis.rootOpacity);
    console.log('  Body background:', domAnalysis.bodyBgColor);
    console.log('  Has logo:', domAnalysis.hasLogo ? '✅' : '❌');
    console.log('  Has sidebar:', domAnalysis.hasSidebar ? '✅' : '❌');
    console.log('  Has table:', domAnalysis.hasTable ? '✅' : '❌');
    console.log('  Has map:', domAnalysis.hasMap ? '✅' : '❌');
    console.log('  KPI count:', domAnalysis.hasKPIs);
    console.log('  Has "Fleet" text:', domAnalysis.hasFleetText ? '✅' : '❌');
    console.log('  Has "Vehicle" text:', domAnalysis.hasVehicleText ? '✅' : '❌');
    console.log('  Has error messages:', domAnalysis.hasErrorMessage ? '⚠️  YES' : '✅ NO');
    console.log('\n  Visible text sample (first 500 chars):');
    console.log('  ', domAnalysis.visibleTextSample);

    console.log('\n📋 CONSOLE MESSAGE SUMMARY:');
    console.log(`  Errors: ${evidence.consoleError.length}`);
    console.log(`  Warnings: ${evidence.consoleWarn.length}`);
    console.log(`  Info: ${evidence.consoleInfo.length}`);
    console.log(`  Log: ${evidence.consoleLog.length}`);
    console.log(`  Page Errors: ${evidence.pageErrors.length}`);
    console.log(`  Network Failures: ${evidence.networkFails.length}`);

    if (evidence.consoleError.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      evidence.consoleError.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    if (evidence.consoleWarn.length > 0) {
      console.log('\n⚠️  CONSOLE WARNINGS:');
      evidence.consoleWarn.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
    }

    if (evidence.pageErrors.length > 0) {
      console.log('\n❌ PAGE ERRORS:');
      evidence.pageErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    // Save evidence
    const evidencePath = path.join(screenshotDir, 'EVIDENCE.json');
    fs.writeFileSync(evidencePath, JSON.stringify({
      ...evidence,
      domAnalysis
    }, null, 2));
    console.log(`\n💾 Evidence saved: ${evidencePath}`);

    console.log('\n' + '='.repeat(100));
    console.log('VERDICT:');
    console.log('='.repeat(100));
    console.log(`Console Errors: ${evidence.consoleError.length} ${evidence.consoleError.length === 0 ? '✅' : '❌'}`);
    console.log(`Console Warnings: ${evidence.consoleWarn.length} ${evidence.consoleWarn.length === 0 ? '✅' : '❌'}`);
    console.log(`Page Errors: ${evidence.pageErrors.length} ${evidence.pageErrors.length === 0 ? '✅' : '❌'}`);
    console.log(`Network Failures: ${evidence.networkFails.length} ${evidence.networkFails.length === 0 ? '✅' : '❌'}`);
    console.log(`DOM Renders: ${domAnalysis.rootExists && domAnalysis.hasSidebar && domAnalysis.hasTable ? '✅' : '❌'}`);
    console.log('='.repeat(100) + '\n');

    // Assertions for test framework
    expect(evidence.consoleError.length, `Found ${evidence.consoleError.length} console errors`).toBe(0);
    expect(evidence.pageErrors.length, `Found ${evidence.pageErrors.length} page errors`).toBe(0);
    expect(domAnalysis.rootExists, 'Root element must exist').toBe(true);
  });
});
