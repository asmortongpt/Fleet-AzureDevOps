/**
 * Production App Inspection Script
 *
 * This script analyzes the production Fleet Management app structure
 * to identify correct selectors and navigation patterns.
 */

import { test } from '@playwright/test';
import * as fs from 'fs';

test('Inspect Production App Structure', async ({ page }) => {
  console.log('🔍 Starting production app inspection...');

  // Navigate to production URL
  await page.goto('http://68.220.148.2', { waitUntil: 'networkidle', timeout: 30000 });

  // Take initial screenshot
  await page.screenshot({ path: 'test-results/screenshots/01-homepage.png', fullPage: true });
  console.log('✅ Homepage loaded and screenshot captured');

  // Wait for app to load
  await page.waitForTimeout(2000);

  // 1. Inspect navigation structure
  console.log('\n📋 Analyzing Navigation Structure...');
  const navStructure = await page.evaluate(() => {
    const results: any = {
      sidebar: null,
      navigation: [],
      buttons: [],
      links: []
    };

    // Find sidebar
    const sidebar = document.querySelector('aside, nav[class*="sidebar"], [class*="nav"]');
    if (sidebar) {
      results.sidebar = {
        tagName: sidebar.tagName,
        className: sidebar.className,
        id: sidebar.id,
        html: sidebar.innerHTML.substring(0, 500)
      };

      // Find navigation items
      const navItems = sidebar.querySelectorAll('button, a, [role="button"], [role="link"]');
      navItems.forEach((item, index) => {
        if (index < 20) { // Limit to first 20 items
          results.navigation.push({
            tagName: item.tagName,
            text: item.textContent?.trim(),
            className: item.className,
            role: item.getAttribute('role'),
            ariaLabel: item.getAttribute('aria-label'),
            dataTestId: item.getAttribute('data-testid'),
            href: item.getAttribute('href')
          });
        }
      });
    }

    // Find all buttons on page
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, index) => {
      if (index < 30) { // Limit to first 30 buttons
        results.buttons.push({
          text: btn.textContent?.trim(),
          className: btn.className,
          id: btn.id,
          type: btn.getAttribute('type'),
          ariaLabel: btn.getAttribute('aria-label'),
          dataTestId: btn.getAttribute('data-testid')
        });
      }
    });

    // Find all links
    const links = document.querySelectorAll('a');
    links.forEach((link, index) => {
      if (index < 30) { // Limit to first 30 links
        results.links.push({
          text: link.textContent?.trim(),
          href: link.getAttribute('href'),
          className: link.className,
          ariaLabel: link.getAttribute('aria-label')
        });
      }
    });

    return results;
  });

  console.log('\n🎯 Navigation Items Found:', navStructure.navigation.length);
  navStructure.navigation.forEach((item: any, index: number) => {
    console.log(`  ${index + 1}. "${item.text}" [${item.tagName}] - class: ${item.className}`);
  });

  // 2. Inspect main content area
  console.log('\n📄 Analyzing Main Content Area...');
  const contentStructure = await page.evaluate(() => {
    const main = document.querySelector('main, [role="main"], #app, #root');
    return {
      tagName: main?.tagName,
      className: main?.className,
      id: main?.id,
      hasTable: !!document.querySelector('table'),
      hasCards: !!document.querySelector('[class*="card"]'),
      headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
        tag: h.tagName,
        text: h.textContent?.trim()
      }))
    };
  });

  console.log('Main Content:', contentStructure);
  console.log('Headings:', contentStructure.headings);

  // 3. Test navigation to each module
  console.log('\n🧭 Testing Navigation to Each Module...');
  const modules = navStructure.navigation.filter((item: any) =>
    item.text && item.text.length > 0 && item.text.length < 50
  );

  const moduleResults = [];

  for (let i = 0; i < Math.min(modules.length, 10); i++) {
    const module = modules[i];
    console.log(`\n  Testing module: "${module.text}"`);

    try {
      // Try to click the navigation item
      if (module.ariaLabel) {
        await page.click(`[aria-label="${module.ariaLabel}"]`, { timeout: 5000 });
      } else if (module.dataTestId) {
        await page.click(`[data-testid="${module.dataTestId}"]`, { timeout: 5000 });
      } else {
        // Try by text content
        await page.click(`aside button:has-text("${module.text}")`, { timeout: 5000 }).catch(async () => {
          await page.click(`aside a:has-text("${module.text}")`, { timeout: 5000 }).catch(async () => {
            await page.click(`nav button:has-text("${module.text}")`, { timeout: 5000 });
          });
        });
      }

      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

      // Capture the resulting page state
      const pageState = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        heading: document.querySelector('h1, h2')?.textContent?.trim(),
        hasTable: !!document.querySelector('table'),
        hasCards: !!document.querySelector('[class*="card"]'),
        hasForm: !!document.querySelector('form')
      }));

      await page.screenshot({
        path: `test-results/screenshots/module-${i + 1}-${module.text.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
        fullPage: false
      });

      moduleResults.push({
        moduleName: module.text,
        selector: module,
        pageState,
        success: true
      });

      console.log(`    ✅ Success - URL: ${pageState.url}, Heading: ${pageState.heading}`);

    } catch (error: any) {
      moduleResults.push({
        moduleName: module.text,
        selector: module,
        error: error.message,
        success: false
      });
      console.log(`    ❌ Failed - ${error.message}`);
    }
  }

  // 4. Inspect authentication state
  console.log('\n🔐 Checking Authentication State...');
  const authState = await page.evaluate(() => {
    const hasLoginForm = !!document.querySelector('form input[type="password"]');
    const hasUserMenu = !!document.querySelector('button[class*="avatar"], [class*="user-menu"]');
    const hasLogoutButton = !!document.querySelector('button:has-text("Sign out"), button:has-text("Logout")');

    return {
      hasLoginForm,
      hasUserMenu,
      hasLogoutButton,
      cookies: document.cookie
    };
  });

  console.log('Auth State:', authState);

  // 5. Save comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    url: 'http://68.220.148.2',
    navStructure,
    contentStructure,
    authState,
    moduleResults,
    summary: {
      totalModules: modules.length,
      successfulNavigations: moduleResults.filter(m => m.success).length,
      failedNavigations: moduleResults.filter(m => !m.success).length
    }
  };

  // Write report to file
  const reportPath = 'test-results/app-structure-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n📊 Inspection Complete!');
  console.log(`📁 Report saved to: ${reportPath}`);
  console.log(`📸 Screenshots saved to: test-results/screenshots/`);
  console.log(`\n✅ Successfully navigated to: ${report.summary.successfulNavigations}/${report.summary.totalModules} modules`);

  // Print recommended selectors
  console.log('\n🎯 RECOMMENDED SELECTORS FOR TESTS:');
  moduleResults.forEach((result, index) => {
    if (result.success) {
      console.log(`\n  Module: "${result.moduleName}"`);
      console.log(`    Selector: aside button:has-text("${result.moduleName}")`);
      console.log(`    Expected URL: ${result.pageState.url}`);
      console.log(`    Expected Heading: ${result.pageState.heading}`);
    }
  });
});
