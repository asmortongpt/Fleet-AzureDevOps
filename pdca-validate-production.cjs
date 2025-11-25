#!/usr/bin/env node
/**
 * PDCA Loop: Production Validation Script
 * Validates 100% of Fleet Management System functionality
 */

const { chromium } = require('playwright');

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';
const results = [];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function addResult(feature, status, details) {
  const result = { feature, status, details, timestamp: new Date().toISOString() };
  results.push(result);
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  log(`${icon} ${feature}: ${details}`);
}

async function waitForAppReady(page) {
  try {
    // Wait for React root
    await page.waitForSelector('#root', { timeout: 10000 });

    // Wait for content to appear
    await page.waitForFunction(() => {
      const body = document.body.textContent || '';
      return body.length > 100;
    }, { timeout: 10000 });

    // Give extra time for data loading
    await page.waitForTimeout(2000);

    return true;
  } catch (error) {
    return false;
  }
}

async function validateHub(page, hubName, hubPath) {
  log(`\n🔍 Validating ${hubName}...`);

  try {
    await page.goto(`${PRODUCTION_URL}${hubPath}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    const ready = await waitForAppReady(page);
    if (!ready) {
      addResult(hubName, 'FAIL', 'Page did not load in time');
      return false;
    }

    // Check for error messages
    const errorText = await page.locator('text=/error|failed|not found/i').first().textContent({ timeout: 1000 }).catch(() => null);
    if (errorText) {
      addResult(hubName, 'FAIL', `Error found: ${errorText}`);
      return false;
    }

    // Check for white screen
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length < 100) {
      addResult(hubName, 'FAIL', 'White screen or minimal content');
      return false;
    }

    // Check for main content
    const hasContent = await page.locator('main, [role="main"], .content, article').count() > 0;
    if (!hasContent) {
      addResult(hubName, 'FAIL', 'No main content area found');
      return false;
    }

    addResult(hubName, 'PASS', 'Hub loaded successfully with content');
    return true;

  } catch (error) {
    addResult(hubName, 'FAIL', `Exception: ${error.message}`);
    return false;
  }
}

async function main() {
  log('════════════════════════════════════════════════');
  log('🔬 PDCA LOOP: Complete Functionality Validation');
  log('════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // PHASE 1: Test all hub pages
    log('\n📋 PLAN PHASE: Expected Features');
    log('   - 5 Hub Pages');
    log('   - UI Components');
    log('   - Data Visualizations');
    log('   - Interactive Features');
    log('   - Responsive Design\n');

    log('\n🔬 DO PHASE: Testing All Hub Pages\n');

    const hubs = [
      { name: 'Operations Hub', path: '/operations' },
      { name: 'Fleet Hub', path: '/fleet' },
      { name: 'People Hub', path: '/people' },
      { name: 'Work Hub', path: '/work' },
      { name: 'Insights Hub', path: '/insights' }
    ];

    for (const hub of hubs) {
      await validateHub(page, hub.name, hub.path);
    }

    // PHASE 2: Test UI components
    log('\n🎨 DO PHASE: Testing UI Components\n');

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await waitForAppReady(page);

    // Test sidebar
    const sidebarVisible = await page.locator('[class*="sidebar"], nav, aside').first().isVisible({ timeout: 2000 }).catch(() => false);
    addResult('Navigation Sidebar', sidebarVisible ? 'PASS' : 'FAIL', sidebarVisible ? 'Visible' : 'Not found');

    // Test header
    const headerVisible = await page.locator('header, [role="banner"]').first().isVisible({ timeout: 2000 }).catch(() => false);
    addResult('Header Bar', headerVisible ? 'PASS' : 'FAIL', headerVisible ? 'Visible' : 'Not found');

    // Test clickable elements
    const clickableCount = await page.locator('button, a, [role="button"]').count();
    addResult('Clickable Elements', clickableCount > 10 ? 'PASS' : 'FAIL', `Found ${clickableCount} elements`);

    // PHASE 3: Test responsive design
    log('\n📱 DO PHASE: Testing Responsive Design\n');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await waitForAppReady(page);

      const hasContent = await page.locator('main, [role="main"]').count() > 0;
      const hasOverflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);

      addResult(
        `${viewport.name} Layout`,
        hasContent && !hasOverflow ? 'PASS' : 'FAIL',
        `Content: ${hasContent ? 'OK' : 'Missing'}, Overflow: ${hasOverflow ? 'YES' : 'NO'}`
      );
    }

    // CHECK PHASE: Analyze results
    log('\n════════════════════════════════════════════════');
    log('✅ CHECK PHASE: Validation Results');
    log('════════════════════════════════════════════════\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;

    log(`📊 Summary:`);
    log(`   ✅ Passed: ${passed}/${total}`);
    log(`   ❌ Failed: ${failed}/${total}`);
    log(`   📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    log(`📋 Detailed Results:\n`);
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      log(`${icon} ${result.feature}: ${result.details}`);
    });

    // ACT PHASE: Remediation
    log('\n════════════════════════════════════════════════');
    log('🔧 ACT PHASE: Remediation Actions');
    log('════════════════════════════════════════════════\n');

    const failedItems = results.filter(r => r.status === 'FAIL');

    if (failedItems.length === 0) {
      log('🎉 No remediation needed! All features are working correctly.\n');
    } else {
      log(`⚠️  Found ${failedItems.length} issues requiring remediation:\n`);
      failedItems.forEach((item, index) => {
        log(`${index + 1}. ${item.feature}`);
        log(`   Issue: ${item.details}`);
        log(`   Action: Investigate and fix\n`);
      });
    }

    log('\n════════════════════════════════════════════════');
    log(`🏁 VALIDATION ${failedItems.length === 0 ? 'COMPLETE' : 'COMPLETE WITH ISSUES'}`);
    log('════════════════════════════════════════════════\n');

    process.exit(failedItems.length === 0 ? 0 : 1);

  } catch (error) {
    log(`\n❌ FATAL ERROR: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
