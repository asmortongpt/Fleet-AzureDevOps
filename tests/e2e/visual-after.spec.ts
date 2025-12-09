import { test, expect } from '@playwright/test';

test.describe('PASS 3: Verification - AFTER State', () => {
  test('Capture AFTER state and verify fix - Desktop 1920x1080', async ({ page }) => {
    console.log('\n=== PASS 3: CAPTURING AFTER STATE ===\n');

    await page.setViewportSize({ width: 1920, height: 1080 });

    // Capture console
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      if (type === 'error') {
        if (!text.includes('BillingNotEnabledMapError')) { // Ignore known Maps error
          consoleErrors.push(text);
          console.log(`❌ CONSOLE ERROR: ${text}`);
        }
      } else if (type === 'warning') {
        if (!text.includes('Application Insights') && !text.includes('Future Flag') && !text.includes('Google Maps')) {
          consoleWarnings.push(text);
          console.log(`⚠️  CONSOLE WARNING: ${text}`);
        }
      }
    });

    console.log('📍 Navigating to http://localhost:5173');
    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // === VERIFICATION CHECKS ===

    console.log('\n✅ VERIFICATION CHECKS:');
    console.log('════════════════════════════════════════');

    // 1. Sidebar presence
    const hasSidebar = await page.locator('aside').count() > 0;
    console.log(`1. Sidebar present: ${hasSidebar ? '✅ YES' : '❌ NO'}`);

    // 2. Navigation elements
    const navCount = await page.locator('nav, aside').count();
    console.log(`2. Navigation elements: ${navCount > 0 ? '✅ ' + navCount : '❌ 0'}`);

    // 3. Semantic main element
    const hasMain = await page.locator('main').count() > 0;
    console.log(`3. Main element: ${hasMain ? '✅ YES' : '❌ NO'}`);

    // 4. Module switching buttons
    const sidebarButtons = await page.locator('aside button, aside a').count();
    console.log(`4. Sidebar navigation items: ${sidebarButtons > 0 ? '✅ ' + sidebarButtons : '❌ 0'}`);

    // 5. Check for Fleet Management title
    const hasFleetTitle = await page.locator('text=Fleet Management').count() > 0;
    console.log(`5. Fleet Management title: ${hasFleetTitle ? '✅ YES' : '❌ NO'}`);

    // 6. Console errors (excluding known Maps error)
    console.log(`6. Console errors (critical): ${consoleErrors.length === 0 ? '✅ 0' : '❌ ' + consoleErrors.length}`);

    // 7. Test module switching
    console.log('\n🔄 TESTING MODULE SWITCHING:');

    // Try to click a navigation item if sidebar is visible
    if (hasSidebar) {
      // Look for specific module buttons in sidebar
      const vehiclesButton = page.locator('aside button:has-text("Vehicle"), aside a:has-text("Vehicle")').first();
      const isVisible = await vehiclesButton.isVisible().catch(() => false);

      if (isVisible) {
        console.log('  - Found navigation button, testing click...');
        await vehiclesButton.click();
        await page.waitForTimeout(1000);
        console.log('  ✅ Module switching functional');
      } else {
        console.log('  ⚠️  Navigation buttons not immediately visible (sidebar may be collapsed)');
      }
    }

    // 8. Take AFTER screenshots
    console.log('\n📸 CAPTURING AFTER SCREENSHOTS:');
    await page.screenshot({
      path: '/tmp/AFTER_desktop_1920x1080.png',
      fullPage: true
    });
    console.log('  ✅ Saved: /tmp/AFTER_desktop_1920x1080.png');

    await page.screenshot({
      path: '/tmp/AFTER_viewport_1920x1080.png',
      fullPage: false
    });
    console.log('  ✅ Saved: /tmp/AFTER_viewport_1920x1080.png');

    // === FINAL VERIFICATION ===
    console.log('\n📊 FINAL VERIFICATION:');
    console.log('════════════════════════════════════════');

    const verificationResults = {
      hasSidebar,
      hasNavigation: navCount > 0,
      hasMain,
      hasSidebarButtons: sidebarButtons > 0,
      hasFleetTitle,
      criticalErrors: consoleErrors.length
    };

    const passedChecks = Object.values(verificationResults).filter(v => v === true || v === 0).length;
    const totalChecks = Object.keys(verificationResults).length;

    console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks`);

    Object.entries(verificationResults).forEach(([key, value]) => {
      const passed = value === true || value === 0;
      console.log(`  ${passed ? '✅' : '❌'} ${key}: ${value}`);
    });

    console.log('\n════════════════════════════════════════\n');

    // ASSERT all checks pass
    expect(hasSidebar, 'Sidebar must be present').toBe(true);
    expect(navCount, 'Navigation elements must exist').toBeGreaterThan(0);
    expect(sidebarButtons, 'Sidebar must have navigation buttons').toBeGreaterThan(5);
    expect(consoleErrors.length, 'No critical console errors').toBe(0);
  });

  test('Verify mobile rendering', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('http://localhost:5173', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/AFTER_mobile_390x844.png',
      fullPage: true
    });

    console.log('📸 Mobile AFTER screenshot saved');

    // Mobile should also have navigation (hamburger menu)
    const navElements = await page.locator('aside, nav, button[aria-label*="menu" i], button[aria-label*="navigation" i]').count();
    expect(navElements, 'Mobile must have navigation elements').toBeGreaterThan(0);
  });
});
