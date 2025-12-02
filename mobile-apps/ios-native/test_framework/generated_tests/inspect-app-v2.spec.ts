/**
 * Production App Inspection Script v2
 * Now with proper authentication handling
 */

import { test } from '@playwright/test';
import * as fs from 'fs';

test('Inspect Production App with Authentication', async ({ page }) => {
  console.log('🔍 Starting production app inspection with authentication...');

  // Navigate to production URL
  await page.goto('http://68.220.148.2', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('✅ Loaded production page');

  // Login with demo credentials
  console.log('🔐 Logging in with demo credentials...');
  await page.fill('input[type="email"], input[name="email"]', 'admin@demofleet.com');
  await page.fill('input[type="password"], input[name="password"]', 'Demo@123');
  await page.click('button:has-text("Sign In"), button[type="submit"]');

  // Wait for dashboard to load
  await page.waitForTimeout(3000);
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});

  console.log('✅ Logged in successfully');
  await page.screenshot({ path: 'test-results/screenshots/02-after-login.png', fullPage: true });

  // 1. Inspect navigation structure
  console.log('\n📋 Analyzing Navigation Structure...');
  const navStructure = await page.evaluate(() => {
    const results: any = {
      sidebar: null,
      navigation: [],
      allButtons: [],
      mainContent: null
    };

    // Find sidebar/nav
    const sidebar = document.querySelector('aside, nav[class*="sidebar"], [class*="Sidebar"], nav');
    if (sidebar) {
      results.sidebar = {
        tagName: sidebar.tagName,
        className: sidebar.className,
        id: sidebar.id,
        innerHTML: sidebar.innerHTML.substring(0, 1000)
      };

      // Find ALL clickable elements in sidebar
      const clickables = sidebar.querySelectorAll('button, a, [role="button"], [role="link"], div[onclick]');
      clickables.forEach((item) => {
        const text = item.textContent?.trim() || '';
        if (text.length > 0 && text.length < 100) {
          results.navigation.push({
            tagName: item.tagName,
            text: text,
            className: item.className,
            id: item.id,
            role: item.getAttribute('role'),
            ariaLabel: item.getAttribute('aria-label'),
            dataTestId: item.getAttribute('data-testid'),
            href: item.getAttribute('href'),
            onclick: item.getAttribute('onclick')
          });
        }
      });
    }

    // Get all buttons on page for reference
    const allButtons = Array.from(document.querySelectorAll('button'));
    results.allButtons = allButtons.slice(0, 50).map(btn => ({
      text: btn.textContent?.trim(),
      className: btn.className,
      id: btn.id,
      ariaLabel: btn.getAttribute('aria-label')
    }));

    // Get main content area info
    const main = document.querySelector('main, [role="main"], #app, #root > div');
    results.mainContent = {
      tagName: main?.tagName,
      className: main?.className,
      id: main?.id
    };

    return results;
  });

  console.log(`\n🎯 Found ${navStructure.navigation.length} navigation items`);
  navStructure.navigation.forEach((item: any, index: number) => {
    console.log(`  ${index + 1}. "${item.text}"`);
    console.log(`      Tag: ${item.tagName}, Class: ${item.className}`);
    if (item.dataTestId) console.log(`      data-testid: ${item.dataTestId}`);
  });

  // 2. Get page headings and structure
  const pageStructure = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
        tag: h.tagName,
        text: h.textContent?.trim(),
        className: h.className
      })),
      hasTable: !!document.querySelector('table'),
      hasCards: document.querySelectorAll('[class*="card"], [class*="Card"]').length > 0,
      cardCount: document.querySelectorAll('[class*="card"], [class*="Card"]').length
    };
  });

  console.log('\n📄 Current Page Structure:');
  console.log(`  URL: ${pageStructure.url}`);
  console.log(`  Title: ${pageStructure.title}`);
  console.log(`  Headings:`, pageStructure.headings);
  console.log(`  Has Table: ${pageStructure.hasTable}`);
  console.log(`  Has Cards: ${pageStructure.hasCards} (${pageStructure.cardCount} cards)`);

  // 3. Try clicking each navigation item
  console.log('\n🧭 Testing Navigation to Each Module...');
  const moduleResults = [];

  // Get unique navigation items (filter duplicates)
  const uniqueNavItems = navStructure.navigation.filter((item: any, index: number, self: any[]) =>
    index === self.findIndex((t: any) => t.text === item.text)
  );

  for (let i = 0; i < Math.min(uniqueNavItems.length, 15); i++) {
    const navItem = uniqueNavItems[i];
    console.log(`\n  [${i + 1}/${uniqueNavItems.length}] Testing: "${navItem.text}"`);

    try {
      // Build selector based on available attributes
      let selector = '';

      if (navItem.dataTestId) {
        selector = `[data-testid="${navItem.dataTestId}"]`;
      } else if (navItem.id && navItem.id.length > 0) {
        selector = `#${navItem.id}`;
      } else if (navItem.tagName === 'A' && navItem.href) {
        selector = `a[href="${navItem.href}"]`;
      } else {
        // Use combination of tag and text
        if (navItem.tagName === 'BUTTON') {
          selector = `aside button, nav button`;
        } else if (navItem.tagName === 'A') {
          selector = `aside a, nav a`;
        } else {
          selector = `aside *, nav *`;
        }
      }

      // Try to find and click the element
      const elements = await page.locator(selector).all();
      let clicked = false;

      for (const elem of elements) {
        const elemText = await elem.textContent();
        if (elemText?.trim() === navItem.text) {
          await elem.click({ timeout: 5000 });
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        throw new Error(`Could not find clickable element with text "${navItem.text}"`);
      }

      // Wait for navigation
      await page.waitForTimeout(2000);
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Capture new page state
      const newState = await page.evaluate(() => ({
        url: window.location.href,
        pathname: window.location.pathname,
        heading: document.querySelector('h1, h2, h3')?.textContent?.trim(),
        mainHeading: document.querySelector('h1')?.textContent?.trim(),
        secondaryHeading: document.querySelector('h2')?.textContent?.trim(),
        hasTable: !!document.querySelector('table'),
        tableRows: document.querySelector('table')?.querySelectorAll('tbody tr').length || 0,
        hasCards: document.querySelectorAll('[class*="card"], [class*="Card"]').length > 0,
        cardCount: document.querySelectorAll('[class*="card"], [class*="Card"]').length,
        hasForm: !!document.querySelector('form'),
        pageClasses: document.querySelector('main, [role="main"]')?.className || ''
      }));

      await page.screenshot({
        path: `test-results/screenshots/module-${String(i + 1).padStart(2, '0')}-${navItem.text.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: false
      });

      moduleResults.push({
        index: i + 1,
        moduleName: navItem.text,
        selector: selector,
        navItemDetails: navItem,
        pageState: newState,
        success: true
      });

      console.log(`    ✅ Success!`);
      console.log(`       URL: ${newState.url}`);
      console.log(`       Heading: ${newState.heading || newState.mainHeading}`);
      console.log(`       Table: ${newState.hasTable} (${newState.tableRows} rows)`);
      console.log(`       Cards: ${newState.hasCards} (${newState.cardCount} cards)`);

    } catch (error: any) {
      moduleResults.push({
        index: i + 1,
        moduleName: navItem.text,
        error: error.message,
        success: false
      });
      console.log(`    ❌ Failed: ${error.message}`);

      // Take screenshot of failure
      await page.screenshot({
        path: `test-results/screenshots/FAILED-module-${i + 1}-${navItem.text.replace(/[^a-zA-Z0-9]/g, '_')}.png`
      });
    }
  }

  // 4. Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    productionUrl: 'http://68.220.148.2',
    authentication: {
      required: true,
      credentials: 'admin@demofleet.com / Demo@123'
    },
    navigation: {
      totalItems: uniqueNavItems.length,
      sidebarStructure: navStructure.sidebar,
      navigationItems: uniqueNavItems
    },
    initialPage: pageStructure,
    moduleResults: moduleResults,
    summary: {
      totalModulesTested: moduleResults.length,
      successfulNavigations: moduleResults.filter(m => m.success).length,
      failedNavigations: moduleResults.filter(m => !m.success).length,
      successRate: `${Math.round((moduleResults.filter(m => m.success).length / moduleResults.length) * 100)}%`
    }
  };

  // Save comprehensive report
  const reportPath = 'test-results/production-app-analysis.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n\n═══════════════════════════════════════════════════════════');
  console.log('📊 INSPECTION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📁 Full Report: ${reportPath}`);
  console.log(`📸 Screenshots: test-results/screenshots/`);
  console.log(`✅ Success Rate: ${report.summary.successRate}`);
  console.log(`   Successful: ${report.summary.successfulNavigations}`);
  console.log(`   Failed: ${report.summary.failedNavigations}`);

  console.log('\n🎯 RECOMMENDED SELECTORS FOR TESTS:\n');
  moduleResults.forEach((result) => {
    if (result.success) {
      console.log(`Module: "${result.moduleName}"`);
      console.log(`  Primary Selector: ${result.selector}`);
      console.log(`  Fallback: button:text-is("${result.moduleName}"), a:text-is("${result.moduleName}")`);
      console.log(`  Expected URL Pattern: ${result.pageState.pathname}`);
      console.log(`  Expected Heading: "${result.pageState.heading || result.pageState.mainHeading}"`);
      console.log(`  Page Type: ${result.pageState.hasTable ? 'Table View' : result.pageState.hasCards ? `Card View (${result.pageState.cardCount} cards)` : 'Form/Other'}`);
      console.log('');
    }
  });

  console.log('═══════════════════════════════════════════════════════════\n');
});
