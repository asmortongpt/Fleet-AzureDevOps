import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface ModuleTestResult {
  name: string;
  present: boolean;
  functional: boolean;
  error?: string;
}

interface TestResults {
  modules: ModuleTestResult[];
  quickStats: { label: string; present: boolean }[];
  quickActions: { label: string; present: boolean }[];
  overallCompletion: number;
  timestamp: string;
}

async function verifyOperationsHub() {
  console.log('Starting Operations Hub verification...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results: TestResults = {
    modules: [],
    quickStats: [],
    quickActions: [],
    overallCompletion: 0,
    timestamp: new Date().toISOString()
  };

  try {
    // Navigate to Operations Hub
    console.log('Navigating to http://localhost:5175/operations');
    await page.goto('http://localhost:5175/operations', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Take screenshot of initial state (Overview)
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-overview.png',
      fullPage: true
    });
    console.log('Screenshot saved: operations-hub-overview.png');

    // Test Module 1: Overview Dashboard
    console.log('\n1. Testing Overview Dashboard...');
    const overviewButton = page.locator('button:has-text("Overview Dashboard")');
    const overviewVisible = await overviewButton.isVisible();
    results.modules.push({
      name: 'Overview Dashboard',
      present: overviewVisible,
      functional: overviewVisible
    });
    console.log(`   ${overviewVisible ? '✅' : '❌'} Overview Dashboard: ${overviewVisible ? 'Present' : 'Missing'}`);

    // Test Module 2: Dispatch Management
    console.log('\n2. Testing Dispatch Management...');
    const dispatchButton = page.locator('button:has-text("Dispatch Management")');
    const dispatchVisible = await dispatchButton.isVisible();

    if (dispatchVisible) {
      await dispatchButton.click();
      await page.waitForTimeout(1500);

      // Check for Dispatch Console elements
      const dispatchConsolePresent = await page.locator('text=Dispatch Radio Console').isVisible().catch(() => false);

      await page.screenshot({
        path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-dispatch.png',
        fullPage: true
      });
      console.log('   Screenshot saved: operations-hub-dispatch.png');

      results.modules.push({
        name: 'Dispatch Management',
        present: true,
        functional: dispatchConsolePresent,
        error: dispatchConsolePresent ? undefined : 'Dispatch Console not rendering'
      });
      console.log(`   ${dispatchConsolePresent ? '✅' : '⚠️'} Dispatch Management: ${dispatchConsolePresent ? 'Functional' : 'Partial'}`);
    } else {
      results.modules.push({
        name: 'Dispatch Management',
        present: false,
        functional: false
      });
      console.log('   ❌ Dispatch Management: Missing');
    }

    // Test Module 3: Live Tracking
    console.log('\n3. Testing Live Tracking...');
    const trackingButton = page.locator('button:has-text("Live Tracking")');
    const trackingVisible = await trackingButton.isVisible();

    if (trackingVisible) {
      await trackingButton.click();
      await page.waitForTimeout(1500);

      // Check for GPS Tracking elements
      const gpsPresent = await page.locator('.leaflet-container, canvas').isVisible().catch(() => false);

      await page.screenshot({
        path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-tracking.png',
        fullPage: true
      });
      console.log('   Screenshot saved: operations-hub-tracking.png');

      results.modules.push({
        name: 'Live Tracking',
        present: true,
        functional: gpsPresent,
        error: gpsPresent ? undefined : 'GPS map not rendering'
      });
      console.log(`   ${gpsPresent ? '✅' : '⚠️'} Live Tracking: ${gpsPresent ? 'Functional' : 'Partial'}`);
    } else {
      results.modules.push({
        name: 'Live Tracking',
        present: false,
        functional: false
      });
      console.log('   ❌ Live Tracking: Missing');
    }

    // Test Module 4: Fuel Management
    console.log('\n4. Testing Fuel Management...');
    const fuelButton = page.locator('button:has-text("Fuel Management")');
    const fuelVisible = await fuelButton.isVisible();

    if (fuelVisible) {
      await fuelButton.click();
      await page.waitForTimeout(1500);

      // Check for Fuel Management elements
      const fuelPresent = await page.locator('text=/Fuel|MPG|Gallons/i').first().isVisible().catch(() => false);

      await page.screenshot({
        path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-fuel.png',
        fullPage: true
      });
      console.log('   Screenshot saved: operations-hub-fuel.png');

      results.modules.push({
        name: 'Fuel Management',
        present: true,
        functional: fuelPresent,
        error: fuelPresent ? undefined : 'Fuel Management not rendering'
      });
      console.log(`   ${fuelPresent ? '✅' : '⚠️'} Fuel Management: ${fuelPresent ? 'Functional' : 'Partial'}`);
    } else {
      results.modules.push({
        name: 'Fuel Management',
        present: false,
        functional: false
      });
      console.log('   ❌ Fuel Management: Missing');
    }

    // Test Module 5: Asset Management
    console.log('\n5. Testing Asset Management...');
    const assetButton = page.locator('button:has-text("Asset Management")');
    const assetVisible = await assetButton.isVisible();

    if (assetVisible) {
      await assetButton.click();
      await page.waitForTimeout(1500);

      // Check for Asset Management elements
      const assetPresent = await page.locator('text=/Asset|Inventory|Equipment/i').first().isVisible().catch(() => false);

      await page.screenshot({
        path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-assets.png',
        fullPage: true
      });
      console.log('   Screenshot saved: operations-hub-assets.png');

      results.modules.push({
        name: 'Asset Management',
        present: true,
        functional: assetPresent,
        error: assetPresent ? undefined : 'Asset Management not rendering'
      });
      console.log(`   ${assetPresent ? '✅' : '⚠️'} Asset Management: ${assetPresent ? 'Functional' : 'Partial'}`);
    } else {
      results.modules.push({
        name: 'Asset Management',
        present: false,
        functional: false
      });
      console.log('   ❌ Asset Management: Missing');
    }

    // Back to overview for sidebar checks
    const overviewButtonCheck = page.locator('button:has-text("Overview Dashboard")');
    if (await overviewButtonCheck.isVisible()) {
      await overviewButtonCheck.click();
      await page.waitForTimeout(1000);
    }

    // Test Quick Stats in Right Sidebar
    console.log('\n6. Testing Quick Stats...');
    const quickStatsLabels = ['Active Vehicles', 'Pending Dispatches', "Today's Routes", 'Fuel Alerts'];
    for (const label of quickStatsLabels) {
      const present = await page.locator(`text="${label}"`).isVisible().catch(() => false);
      results.quickStats.push({ label, present });
      console.log(`   ${present ? '✅' : '❌'} ${label}: ${present ? 'Present' : 'Missing'}`);
    }

    // Test Quick Actions in Right Sidebar
    console.log('\n7. Testing Quick Actions...');
    const quickActionsLabels = ['Quick Dispatch', 'View All Routes', 'Fuel Report', 'Asset Check'];
    for (const label of quickActionsLabels) {
      const present = await page.locator(`button:has-text("${label}")`).isVisible().catch(() => false);
      results.quickActions.push({ label, present });
      console.log(`   ${present ? '✅' : '❌'} ${label}: ${present ? 'Present' : 'Missing'}`);
    }

    // Calculate overall completion
    const modulesPresentCount = results.modules.filter(m => m.present).length;
    const modulesFunctionalCount = results.modules.filter(m => m.functional).length;
    const quickStatsCount = results.quickStats.filter(s => s.present).length;
    const quickActionsCount = results.quickActions.filter(a => a.present).length;

    const totalItems = results.modules.length + results.quickStats.length + results.quickActions.length;
    const completedItems = modulesFunctionalCount + quickStatsCount + quickActionsCount;

    results.overallCompletion = Math.round((completedItems / totalItems) * 100);

    console.log('\n' + '='.repeat(60));
    console.log('OPERATIONS HUB VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`\nModules Present: ${modulesPresentCount}/${results.modules.length}`);
    console.log(`Modules Functional: ${modulesFunctionalCount}/${results.modules.length}`);
    console.log(`Quick Stats: ${quickStatsCount}/${results.quickStats.length}`);
    console.log(`Quick Actions: ${quickActionsCount}/${results.quickActions.length}`);
    console.log(`\nOVERALL COMPLETION: ${results.overallCompletion}%`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('Error during verification:', error);
    await page.screenshot({
      path: '/Users/andrewmorton/Documents/GitHub/Fleet/screenshots/operations-hub-error.png',
      fullPage: true
    });
  } finally {
    await browser.close();
  }

  // Save results to JSON
  writeFileSync(
    '/Users/andrewmorton/Documents/GitHub/Fleet/operations-hub-verification-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('Results saved to: operations-hub-verification-results.json\n');

  return results;
}

// Run the verification
verifyOperationsHub().catch(console.error);
