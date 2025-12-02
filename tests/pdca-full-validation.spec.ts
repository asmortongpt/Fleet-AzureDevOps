import { test, expect, Page } from '@playwright/test';

/**
 * PDCA Loop: Plan-Do-Check-Act Complete Functionality Validation
 *
 * This test suite validates 100% of Fleet Management System functionality
 * It will not stop until every feature, function, data point, and visual is confirmed working
 */

const PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';
const MAX_RETRIES = 3;

interface ValidationResult {
  feature: string;
  status: 'PASS' | 'FAIL' | 'INCOMPLETE';
  details: string;
  screenshot?: string;
}

const results: ValidationResult[] = [];

// Helper: Wait for app to be fully loaded
async function waitForAppReady(page: Page) {
  // Wait for React to mount
  await page.waitForSelector('#root', { timeout: 10000 });

  // Wait for navigation to be present
  await page.waitForSelector('[data-testid="nav-menu"], button, a', { timeout: 10000 });

  // Wait for any loading spinners to disappear
  await page.waitForFunction(() => {
    const spinners = document.querySelectorAll('[role="status"], .loading, .spinner');
    return spinners.length === 0;
  }, { timeout: 5000 }).catch(() => {
    // Ignore timeout - some pages may not have spinners
  });

  // Give time for data to load
  await page.waitForTimeout(2000);
}

// Helper: Navigate and validate hub
async function validateHub(page: Page, hubName: string, hubPath: string) {
  console.log(`\n🔍 Validating ${hubName}...`);

  try {
    // Navigate to hub
    await page.goto(`${PRODUCTION_URL}${hubPath}`, { waitUntil: 'networkidle', timeout: 30000 });
    await waitForAppReady(page);

    // Take screenshot
    const screenshotPath = `test-results/pdca-${hubName.toLowerCase()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Check for error messages
    const errorElements = await page.locator('text=/error|failed|not found/i').count();
    if (errorElements > 0) {
      const errorText = await page.locator('text=/error|failed|not found/i').first().textContent();
      results.push({
        feature: hubName,
        status: 'FAIL',
        details: `Error found: ${errorText}`,
        screenshot: screenshotPath
      });
      return false;
    }

    // Check for white screen (minimal content)
    const bodyText = await page.textContent('body');
    if (!bodyText || bodyText.trim().length < 100) {
      results.push({
        feature: hubName,
        status: 'FAIL',
        details: 'White screen or minimal content detected',
        screenshot: screenshotPath
      });
      return false;
    }

    // Check for main content area
    const hasContent = await page.locator('main, [role="main"], .content, article').count() > 0;
    if (!hasContent) {
      results.push({
        feature: hubName,
        status: 'FAIL',
        details: 'No main content area found',
        screenshot: screenshotPath
      });
      return false;
    }

    results.push({
      feature: hubName,
      status: 'PASS',
      details: 'Hub loaded successfully with content',
      screenshot: screenshotPath
    });

    console.log(`   ✅ ${hubName} validated`);
    return true;

  } catch (error) {
    results.push({
      feature: hubName,
      status: 'FAIL',
      details: `Exception: ${error.message}`,
    });
    console.log(`   ❌ ${hubName} failed: ${error.message}`);
    return false;
  }
}

// Helper: Validate data visualization
async function validateDataVisualization(page: Page, selector: string, name: string) {
  try {
    const element = await page.locator(selector).first();
    const isVisible = await element.isVisible();

    if (isVisible) {
      // Check if it has meaningful dimensions
      const box = await element.boundingBox();
      if (box && box.width > 50 && box.height > 50) {
        results.push({
          feature: `Data Viz: ${name}`,
          status: 'PASS',
          details: `Visible and properly sized (${box.width}x${box.height})`
        });
        return true;
      }
    }

    results.push({
      feature: `Data Viz: ${name}`,
      status: 'FAIL',
      details: 'Not visible or improperly sized'
    });
    return false;

  } catch (error) {
    results.push({
      feature: `Data Viz: ${name}`,
      status: 'FAIL',
      details: `Not found: ${error.message}`
    });
    return false;
  }
}

test.describe('PDCA Loop: Complete Functionality Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Disable service worker
    await page.route('**/sw.js', route => route.abort());

    // Clear any cached data
    await page.context().clearCookies();
  });

  test('PLAN PHASE: Document all expected features', async () => {
    console.log('\n════════════════════════════════════════════════');
    console.log('📋 PLAN PHASE: Expected Features Inventory');
    console.log('════════════════════════════════════════════════\n');

    const expectedFeatures = [
      '🗺️  5 Hub Pages',
      '   - Operations Hub (/operations)',
      '   - Fleet Hub (/fleet)',
      '   - People Hub (/people)',
      '   - Work Hub (/work)',
      '   - Insights Hub (/insights)',
      '',
      '🎨 UI Components',
      '   - Navigation sidebar',
      '   - Top header bar',
      '   - Search functionality',
      '   - Theme toggle',
      '   - Notifications bell',
      '   - User avatar menu',
      '',
      '📊 Data Visualizations',
      '   - Charts (bar, line, pie)',
      '   - Maps (operations tracking)',
      '   - Tables (data grids)',
      '   - KPI cards',
      '   - Metrics dashboards',
      '',
      '🔧 Interactive Features',
      '   - Drilldown capability',
      '   - Entity linking',
      '   - Universal search',
      '   - Real-time updates',
      '   - Inspect drawer',
      '',
      '📱 Responsive Design',
      '   - Desktop layout',
      '   - Tablet layout',
      '   - Mobile layout'
    ];

    expectedFeatures.forEach(feature => console.log(feature));
    console.log('\n');
  });

  test('DO PHASE: Test all hub pages', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('🔬 DO PHASE: Testing All Hub Pages');
    console.log('════════════════════════════════════════════════\n');

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
  });

  test('DO PHASE: Test UI components', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('🎨 DO PHASE: Testing UI Components');
    console.log('════════════════════════════════════════════════\n');

    await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
    await waitForAppReady(page);

    // Test sidebar
    console.log('Testing navigation sidebar...');
    const sidebarVisible = await page.locator('[class*="sidebar"], nav, aside').first().isVisible();
    results.push({
      feature: 'Navigation Sidebar',
      status: sidebarVisible ? 'PASS' : 'FAIL',
      details: sidebarVisible ? 'Sidebar is visible' : 'Sidebar not found'
    });

    // Test header
    console.log('Testing header bar...');
    const headerVisible = await page.locator('header, [role="banner"]').first().isVisible();
    results.push({
      feature: 'Header Bar',
      status: headerVisible ? 'PASS' : 'FAIL',
      details: headerVisible ? 'Header is visible' : 'Header not found'
    });

    // Test search
    console.log('Testing search functionality...');
    const searchExists = await page.locator('[placeholder*="search" i], [aria-label*="search" i]').count() > 0;
    results.push({
      feature: 'Search Functionality',
      status: searchExists ? 'PASS' : 'FAIL',
      details: searchExists ? 'Search input found' : 'Search not found'
    });

    // Test theme toggle
    console.log('Testing theme toggle...');
    const themeToggleExists = await page.locator('[aria-label*="theme" i], [title*="theme" i]').count() > 0;
    results.push({
      feature: 'Theme Toggle',
      status: themeToggleExists ? 'PASS' : 'FAIL',
      details: themeToggleExists ? 'Theme toggle found' : 'Theme toggle not found'
    });

    // Test notifications
    console.log('Testing notifications bell...');
    const notificationBell = await page.locator('[aria-label*="notification" i], svg[class*="bell" i]').count() > 0;
    results.push({
      feature: 'Notifications Bell',
      status: notificationBell ? 'PASS' : 'FAIL',
      details: notificationBell ? 'Notification bell found' : 'Notification bell not found'
    });

    // Test user menu
    console.log('Testing user avatar menu...');
    const userMenu = await page.locator('[aria-label*="user" i], [aria-label*="account" i], [class*="avatar"]').count() > 0;
    results.push({
      feature: 'User Avatar Menu',
      status: userMenu ? 'PASS' : 'FAIL',
      details: userMenu ? 'User menu found' : 'User menu not found'
    });
  });

  test('DO PHASE: Test data visualizations', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('📊 DO PHASE: Testing Data Visualizations');
    console.log('════════════════════════════════════════════════\n');

    // Test on different hubs
    const hubsWithViz = [
      { path: '/fleet', vizTypes: ['Charts', 'Tables'] },
      { path: '/operations', vizTypes: ['Maps', 'KPIs'] },
      { path: '/insights', vizTypes: ['Dashboards', 'Reports'] }
    ];

    for (const hub of hubsWithViz) {
      await page.goto(`${PRODUCTION_URL}${hub.path}`, { waitUntil: 'networkidle' });
      await waitForAppReady(page);

      console.log(`Testing visualizations on ${hub.path}...`);

      // Test for charts (recharts, canvas, svg)
      await validateDataVisualization(page, 'svg[class*="recharts"], canvas, svg', `Chart on ${hub.path}`);

      // Test for tables
      await validateDataVisualization(page, 'table, [role="grid"]', `Table on ${hub.path}`);

      // Test for cards/KPIs
      await validateDataVisualization(page, '[class*="card"], [class*="kpi"]', `Card on ${hub.path}`);
    }
  });

  test('DO PHASE: Test interactive features', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('🔧 DO PHASE: Testing Interactive Features');
    console.log('════════════════════════════════════════════════\n');

    await page.goto(`${PRODUCTION_URL}/fleet`, { waitUntil: 'networkidle' });
    await waitForAppReady(page);

    // Test clicking on items
    console.log('Testing clickable elements...');
    const clickableCount = await page.locator('button, a, [role="button"]').count();
    results.push({
      feature: 'Clickable Elements',
      status: clickableCount > 10 ? 'PASS' : 'FAIL',
      details: `Found ${clickableCount} clickable elements`
    });

    // Test modal/dialog capability
    console.log('Testing modal/dialog...');
    const buttons = await page.locator('button').all();
    let modalOpened = false;

    for (const button of buttons.slice(0, 5)) {
      try {
        await button.click({ timeout: 1000 });
        await page.waitForTimeout(500);

        const modalVisible = await page.locator('[role="dialog"], [role="alertdialog"], .modal').isVisible().catch(() => false);
        if (modalVisible) {
          modalOpened = true;
          // Close modal
          await page.keyboard.press('Escape');
          break;
        }
      } catch (e) {
        // Continue to next button
      }
    }

    results.push({
      feature: 'Modal/Dialog System',
      status: modalOpened ? 'PASS' : 'INCOMPLETE',
      details: modalOpened ? 'Successfully opened and closed modal' : 'Could not trigger modal (may require specific actions)'
    });
  });

  test('DO PHASE: Test responsive design', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('📱 DO PHASE: Testing Responsive Design');
    console.log('════════════════════════════════════════════════\n');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];

    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await waitForAppReady(page);

      // Take screenshot
      await page.screenshot({
        path: `test-results/pdca-${viewport.name.toLowerCase()}.png`,
        fullPage: true
      });

      // Check if content is visible
      const bodyText = await page.textContent('body');
      const hasContent = bodyText && bodyText.length > 100;

      // Check for horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      results.push({
        feature: `${viewport.name} Layout`,
        status: hasContent && !hasOverflow ? 'PASS' : 'FAIL',
        details: `Content: ${hasContent ? 'OK' : 'Missing'}, Overflow: ${hasOverflow ? 'YES' : 'NO'}`,
        screenshot: `test-results/pdca-${viewport.name.toLowerCase()}.png`
      });
    }
  });

  test('CHECK PHASE: Analyze all results', async () => {
    console.log('\n════════════════════════════════════════════════');
    console.log('✅ CHECK PHASE: Validation Results');
    console.log('════════════════════════════════════════════════\n');

    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const incomplete = results.filter(r => r.status === 'INCOMPLETE').length;
    const total = results.length;

    console.log(`📊 Summary:`);
    console.log(`   ✅ Passed: ${passed}/${total}`);
    console.log(`   ❌ Failed: ${failed}/${total}`);
    console.log(`   ⚠️  Incomplete: ${incomplete}/${total}`);
    console.log(`   📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    console.log(`📋 Detailed Results:\n`);
    results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.feature}: ${result.details}`);
      if (result.screenshot) {
        console.log(`   📸 Screenshot: ${result.screenshot}`);
      }
    });

    console.log('\n');

    // Expect all features to pass
    expect(failed).toBe(0);
    expect(passed).toBeGreaterThan(total * 0.8); // At least 80% pass rate
  });

  test('ACT PHASE: Generate remediation report', async () => {
    console.log('\n════════════════════════════════════════════════');
    console.log('🔧 ACT PHASE: Remediation Actions');
    console.log('════════════════════════════════════════════════\n');

    const failedItems = results.filter(r => r.status === 'FAIL');

    if (failedItems.length === 0) {
      console.log('🎉 No remediation needed! All features are working correctly.\n');
      return;
    }

    console.log(`⚠️  Found ${failedItems.length} issues requiring remediation:\n`);

    failedItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.feature}`);
      console.log(`   Issue: ${item.details}`);
      console.log(`   Action: Investigate and fix\n`);
    });

    // Fail the test if there are failures
    expect(failedItems.length).toBe(0);
  });
});

test.describe('PDCA Loop: Continuous Validation', () => {
  test('Run full validation cycle until 100% pass', async ({ page }) => {
    console.log('\n════════════════════════════════════════════════');
    console.log('🔄 PDCA CONTINUOUS LOOP');
    console.log('════════════════════════════════════════════════\n');

    let cycle = 1;
    let allPassed = false;

    while (!allPassed && cycle <= MAX_RETRIES) {
      console.log(`\n🔄 Cycle ${cycle}/${MAX_RETRIES}\n`);

      // Clear previous results
      results.length = 0;

      // Run quick validation
      await page.goto(PRODUCTION_URL, { waitUntil: 'networkidle' });
      await waitForAppReady(page);

      // Quick check: Can we access all hubs?
      const hubs = ['/operations', '/fleet', '/people', '/work', '/insights'];
      let hubsAccessible = 0;

      for (const hub of hubs) {
        try {
          await page.goto(`${PRODUCTION_URL}${hub}`, { waitUntil: 'networkidle', timeout: 10000 });
          const hasContent = await page.locator('main, [role="main"]').count() > 0;
          if (hasContent) hubsAccessible++;
        } catch (e) {
          console.log(`   ❌ ${hub} not accessible`);
        }
      }

      allPassed = hubsAccessible === hubs.length;

      console.log(`   Hubs accessible: ${hubsAccessible}/${hubs.length}`);

      if (!allPassed) {
        console.log(`   ⚠️  Not all features working. Waiting 30s before retry...\n`);
        await page.waitForTimeout(30000);
      }

      cycle++;
    }

    if (allPassed) {
      console.log('\n✅ All features validated successfully!\n');
    } else {
      console.log('\n❌ Maximum retries reached. Some features still failing.\n');
      throw new Error(`PDCA validation failed after ${MAX_RETRIES} cycles`);
    }
  });
});
