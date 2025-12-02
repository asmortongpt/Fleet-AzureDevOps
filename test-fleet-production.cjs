const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Fleet Management Production Tests...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const errors = [];
  const consoleLogs = [];

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (msg.type() === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    } else if (msg.type() === 'warning') {
      console.log('⚠️  Console Warning:', text);
    } else if (text.includes('demo') || text.includes('Demo')) {
      console.log('📊 Demo Mode:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('❌ Page Error:', error.message);
  });

  try {
    console.log('1️⃣  Navigating to production...');
    await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully\n');

    // Wait for app to initialize
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({ path: '/tmp/fleet-initial.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/fleet-initial.png\n');

    // Check for the specific error we're fixing
    const hasLengthError = errors.some(err =>
      err.includes("Cannot read properties of undefined (reading 'length')")
    );

    console.log('2️⃣  Checking for errors...');
    if (hasLengthError) {
      console.log('❌ FAILED: Found "length" error!');
    } else {
      console.log('✅ PASSED: No "length" errors detected');
    }

    // Check localStorage for demo mode
    const demoMode = await page.evaluate(() => {
      return localStorage.getItem('demo_mode');
    });

    console.log('\n3️⃣  Demo Mode Status:');
    console.log('   localStorage.demo_mode:', demoMode || 'null (using default)');
    console.log('   Expected: null or not "false" (demo mode enabled by default)');

    // Check for demo data logs
    const hasDemoLog = consoleLogs.some(log =>
      log.includes('demo data') || log.includes('Demo data') || log.includes('50 vehicles')
    );

    if (hasDemoLog) {
      console.log('✅ PASSED: Demo mode logs detected');
    } else {
      console.log('⚠️  WARNING: No demo mode logs found (may not be visible)');
    }

    // Check page title
    const title = await page.title();
    console.log('\n4️⃣  Page Title:', title);

    // Look for main content
    console.log('\n5️⃣  Checking page content...');
    const hasContent = await page.locator('body').isVisible();
    console.log('   Body visible:', hasContent ? '✅' : '❌');

    // Try to find navigation
    const navItems = await page.locator('nav a, [role="navigation"] a, button').count();
    console.log('   Navigation items found:', navItems);

    // Look for map elements
    const mapContainer = await page.locator('.leaflet-container, [class*="map"], #map').count();
    console.log('   Map containers found:', mapContainer);

    if (mapContainer > 0) {
      console.log('✅ PASSED: Map container detected');
      await page.screenshot({ path: '/tmp/fleet-with-map.png', fullPage: true });
      console.log('📸 Map screenshot saved: /tmp/fleet-with-map.png');
    }

    // Try clicking a few navigation items
    console.log('\n6️⃣  Testing navigation...');
    const clickableNav = await page.locator('nav a, button[role="tab"]').all();

    for (let i = 0; i < Math.min(3, clickableNav.length); i++) {
      try {
        const text = await clickableNav[i].textContent();
        await clickableNav[i].click();
        await page.waitForTimeout(1000);
        console.log(`   ✅ Clicked: ${text?.trim()}`);
      } catch (e) {
        console.log(`   ⚠️  Could not click nav item ${i + 1}`);
      }
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/fleet-final.png', fullPage: true });
    console.log('\n📸 Final screenshot saved: /tmp/fleet-final.png');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total errors captured: ${errors.length}`);
    console.log(`Length errors: ${hasLengthError ? '❌ FOUND' : '✅ NONE'}`);
    console.log(`Demo mode: ${demoMode !== 'false' ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`Map containers: ${mapContainer > 0 ? '✅ FOUND' : '⚠️  NOT VISIBLE'}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach((err, i) => console.log(`   ${i + 1}. ${err.substring(0, 100)}...`));
    }

    console.log('\n' + '='.repeat(60));

    if (!hasLengthError && demoMode !== 'false') {
      console.log('✅ ALL CRITICAL TESTS PASSED');
    } else {
      console.log('❌ SOME TESTS FAILED');
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
})();
