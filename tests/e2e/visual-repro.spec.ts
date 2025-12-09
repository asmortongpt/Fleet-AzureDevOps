import { test, expect } from '@playwright/test';

test.describe('PASS 1: Evidence Gathering - BEFORE State', () => {
  test('Capture BEFORE state - Desktop 1920x1080', async ({ page }) => {
    console.log('\n=== PASS 1: CAPTURING BEFORE STATE ===\n');

    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console logs
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        consoleErrors.push(text);
        console.log(`❌ CONSOLE ERROR: ${text}`);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.log(`⚠️  CONSOLE WARNING: ${text}`);
      } else {
        consoleLogs.push(text);
      }
    });

    // Navigate to app
    console.log('📍 Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for stable page
    await page.waitForTimeout(3000);

    // === EVIDENCE COLLECTION ===

    // 1. DOM Structure
    console.log('\n📊 DOM STRUCTURE:');
    const domStructure = await page.evaluate(() => {
      return {
        hasRoot: !!document.getElementById('root'),
        hasSidebar: !!document.querySelector('aside'),
        hasNav: !!document.querySelector('nav'),
        hasMain: !!document.querySelector('main'),
        navigationElements: document.querySelectorAll('nav, aside').length,
        buttons: document.querySelectorAll('button').length,
        headers: document.querySelectorAll('h1, h2, h3').length,
        tables: document.querySelectorAll('table').length
      };
    });

    console.log('  - Has Root:', domStructure.hasRoot);
    console.log('  - Has Sidebar:', domStructure.hasSidebar);
    console.log('  - Has Nav:', domStructure.hasNav);
    console.log('  - Has Main:', domStructure.hasMain);
    console.log('  - Navigation Elements:', domStructure.navigationElements);
    console.log('  - Buttons:', domStructure.buttons);
    console.log('  - Tables:', domStructure.tables);

    // 2. Visible Text
    const visibleText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('\n📝 VISIBLE TEXT (first 500 chars):');
    console.log(visibleText);

    // 3. Console Error Count
    console.log('\n🔍 CONSOLE ANALYSIS:');
    console.log(`  - Errors: ${consoleErrors.length}`);
    console.log(`  - Warnings: ${consoleWarnings.length}`);
    console.log(`  - Info logs: ${consoleLogs.length}`);

    // 4. Check for expected navigation items
    const hasModuleSwitching = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasDrivers: text.includes('driver'),
        hasMaintenance: text.includes('maintenance'),
        hasFuel: text.includes('fuel'),
        hasRoutes: text.includes('route'),
        hasVehicles: text.includes('vehicle')
      };
    });

    console.log('\n🔎 MODULE ACCESSIBILITY:');
    console.log('  - Drivers module accessible:', hasModuleSwitching.hasDrivers);
    console.log('  - Maintenance module accessible:', hasModuleSwitching.hasMaintenance);
    console.log('  - Fuel module accessible:', hasModuleSwitching.hasFuel);
    console.log('  - Routes module accessible:', hasModuleSwitching.hasRoutes);

    // 5. Take screenshots
    console.log('\n📸 CAPTURING SCREENSHOTS:');
    await page.screenshot({
      path: '/tmp/BEFORE_desktop_1920x1080.png',
      fullPage: true
    });
    console.log('  ✅ Saved: /tmp/BEFORE_desktop_1920x1080.png');

    await page.screenshot({
      path: '/tmp/BEFORE_viewport_1920x1080.png',
      fullPage: false
    });
    console.log('  ✅ Saved: /tmp/BEFORE_viewport_1920x1080.png');

    // === EVIDENCE SUMMARY ===
    console.log('\n📋 EVIDENCE SUMMARY:');
    console.log('════════════════════════════════════════');

    const criticalIssues: string[] = [];

    if (!domStructure.hasSidebar) {
      criticalIssues.push('❌ CRITICAL: No sidebar navigation element');
    }
    if (!domStructure.hasNav) {
      criticalIssues.push('❌ CRITICAL: No nav element');
    }
    if (!domStructure.hasMain) {
      criticalIssues.push('⚠️  WARNING: No main semantic element');
    }
    if (domStructure.navigationElements === 0) {
      criticalIssues.push('❌ CRITICAL: Zero navigation elements in DOM');
    }
    if (consoleErrors.length > 2) {
      criticalIssues.push(`⚠️  WARNING: ${consoleErrors.length} console errors`);
    }

    criticalIssues.forEach(issue => console.log(issue));

    console.log('\n✅ PASS 1 COMPLETE - Evidence captured');
    console.log('════════════════════════════════════════\n');

    // Store evidence for assertions
    await page.evaluate((evidence) => {
      (window as any).__TEST_EVIDENCE__ = evidence;
    }, {
      domStructure,
      consoleErrors: consoleErrors.length,
      consoleWarnings: consoleWarnings.length,
      criticalIssues: criticalIssues.length
    });

    // Soft assertions - don't fail test, just document
    expect(criticalIssues.length).toBeGreaterThan(0); // We expect issues in BEFORE state
  });

  test('Capture BEFORE state - Mobile 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/BEFORE_mobile_390x844.png',
      fullPage: true
    });

    console.log('📸 Mobile BEFORE screenshot saved');
  });
});
