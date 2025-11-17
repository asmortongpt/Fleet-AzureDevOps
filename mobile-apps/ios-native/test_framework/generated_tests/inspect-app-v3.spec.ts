/**
 * Production App Inspection Script v3
 * Using the email/password demo credentials shown on login page
 */

import { test } from '@playwright/test';
import * as fs from 'fs';

test('Inspect Production App - Email Login Flow', async ({ page }) => {
  console.log('🔍 Starting production app inspection...');

  // Navigate to production URL
  await page.goto('http://68.220.148.2', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('✅ Loaded production page');

  await page.screenshot({ path: 'test-results/screenshots/00-login-page.png', fullPage: true });

  // Wait for login form to be visible
  await page.waitForSelector('input[type="email"], input[type="password"]', { timeout: 10000 });

  // Login with demo credentials (as shown on the page: admin@demofleet.com / Demo@123)
  console.log('🔐 Logging in with email/password...');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.fill('admin@demofleet.com');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('Demo@123');

  // Click the "Sign In" button (not the Microsoft SSO button)
  await page.locator('button:has-text("Sign In")').last().click();

  // Wait for navigation after login
  console.log('⏳ Waiting for dashboard to load...');
  await page.waitForTimeout(3000);

  // Try waiting for network to be idle or URL to change
  await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {}),
    page.waitForURL('**/', { timeout: 10000 }).catch(() => {}),
    page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {}),
    page.waitForSelector('aside, nav, [class*="sidebar"]', { timeout: 10000 }).catch(() => {})
  ]);

  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log(`✅ Current URL after login: ${currentUrl}`);

  await page.screenshot({ path: 'test-results/screenshots/01-after-login-dashboard.png', fullPage: true });

  // Check if we're still on Microsoft login page
  if (currentUrl.includes('microsoftonline.com') || currentUrl.includes('login.microsoft')) {
    console.log('⚠️  Still on Microsoft login page - SSO redirect occurred');
    console.log('   Attempting to go back and try different approach...');

    await page.goBack();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/screenshots/01b-back-to-login.png', fullPage: true });
  }

  // 1. Inspect current page structure
  console.log('\n📋 Analyzing Page Structure...');
  const pageAnalysis = await page.evaluate(() => {
    const results: any = {
      url: window.location.href,
      title: document.title,
      hasLoginForm: !!document.querySelector('input[type="password"]'),
      hasSidebar: !!document.querySelector('aside, nav[class*="sidebar"], [class*="Sidebar"]'),
      bodyClasses: document.body.className,
      rootElement: {
        id: document.getElementById('root')?.className || 'not found',
        children: document.getElementById('root')?.children.length || 0
      },
      allNavElements: [] as any[],
      allButtons: [] as any[],
      allHeadings: [] as any[]
    };

    // Find all potential navigation elements
    const navElements = document.querySelectorAll('aside *, nav *, [class*="sidebar"] *, [class*="Sidebar"] *');
    const uniqueTexts = new Set();

    navElements.forEach((elem) => {
      const text = elem.textContent?.trim() || '';
      if (text.length > 0 && text.length < 100 && !uniqueTexts.has(text)) {
        uniqueTexts.add(text);
        results.allNavElements.push({
          tag: elem.tagName,
          text: text,
          className: elem.className,
          id: elem.id
        });
      }
    });

    // Find all buttons
    document.querySelectorAll('button').forEach((btn, idx) => {
      if (idx < 30) {
        results.allButtons.push({
          text: btn.textContent?.trim(),
          className: btn.className,
          id: btn.id,
          ariaLabel: btn.getAttribute('aria-label')
        });
      }
    });

    // Find all headings
    document.querySelectorAll('h1, h2, h3, h4').forEach((h) => {
      results.allHeadings.push({
        tag: h.tagName,
        text: h.textContent?.trim(),
        className: h.className
      });
    });

    return results;
  });

  console.log('Current URL:', pageAnalysis.url);
  console.log('Page Title:', pageAnalysis.title);
  console.log('Has Login Form:', pageAnalysis.hasLoginForm);
  console.log('Has Sidebar:', pageAnalysis.hasSidebar);
  console.log('Root Element:', pageAnalysis.rootElement);
  console.log('\nHeadings found:', pageAnalysis.allHeadings.length);
  pageAnalysis.allHeadings.forEach((h: any) => console.log(`  ${h.tag}: ${h.text}`));

  console.log('\nButtons found:', pageAnalysis.allButtons.length);
  pageAnalysis.allButtons.slice(0, 15).forEach((btn: any, idx: number) =>
    console.log(`  ${idx + 1}. "${btn.text}" - ${btn.className}`)
  );

  console.log('\nNavigation elements found:', pageAnalysis.allNavElements.length);
  pageAnalysis.allNavElements.slice(0, 20).forEach((nav: any, idx: number) =>
    console.log(`  ${idx + 1}. [${nav.tag}] "${nav.text}"`)
  );

  // Save initial analysis
  const initialReport = {
    timestamp: new Date().toISOString(),
    url: pageAnalysis.url,
    analysis: pageAnalysis
  };

  fs.writeFileSync('test-results/initial-page-analysis.json', JSON.stringify(initialReport, null, 2));
  console.log('\n📁 Initial analysis saved to: test-results/initial-page-analysis.json');

  // If we successfully logged in (have sidebar), continue with navigation testing
  if (pageAnalysis.hasSidebar) {
    console.log('\n✅ Dashboard loaded successfully! Proceeding with navigation analysis...');

    const navStructure = await page.evaluate(() => {
      const sidebar = document.querySelector('aside, nav[class*="sidebar"], [class*="Sidebar"]');
      const navItems: any[] = [];

      if (sidebar) {
        // Get all clickable items in sidebar
        const clickables = sidebar.querySelectorAll('button, a, [role="button"], [onclick]');

        clickables.forEach((item) => {
          const text = item.textContent?.trim() || '';
          if (text.length > 0 && text.length < 100) {
            navItems.push({
              tag: item.tagName,
              text: text,
              className: item.className,
              id: item.id,
              role: item.getAttribute('role'),
              ariaLabel: item.getAttribute('aria-label'),
              dataTestId: item.getAttribute('data-testid'),
              href: item.getAttribute('href')
            });
          }
        });
      }

      return {
        sidebarHTML: sidebar?.outerHTML.substring(0, 2000) || 'No sidebar found',
        navItems: navItems
      };
    });

    console.log(`\n🎯 Found ${navStructure.navItems.length} navigation items in sidebar`);

    // Get unique nav items by text
    const uniqueNavItems = navStructure.navItems.filter((item: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t.text === item.text)
    );

    console.log(`\n📍 Unique Navigation Items: ${uniqueNavItems.length}`);
    uniqueNavItems.forEach((item: any, idx: number) => {
      console.log(`  ${idx + 1}. "${item.text}" [${item.tag}]`);
    });

    // Test clicking each navigation item
    console.log('\n🧭 Testing Navigation...');
    const moduleResults = [];

    for (let i = 0; i < Math.min(uniqueNavItems.length, 12); i++) {
      const navItem = uniqueNavItems[i];
      console.log(`\n  [${i + 1}/${uniqueNavItems.length}] Testing: "${navItem.text}"`);

      try {
        // Find and click the element by text
        const selector = navItem.tag === 'A' ? `aside a, nav a` : `aside button, nav button`;
        const elements = await page.locator(selector).all();

        let clicked = false;
        for (const elem of elements) {
          const text = await elem.textContent();
          if (text?.trim() === navItem.text) {
            await elem.click({ timeout: 5000 });
            clicked = true;
            break;
          }
        }

        if (!clicked) {
          throw new Error(`Could not find element with text "${navItem.text}"`);
        }

        await page.waitForTimeout(1500);
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

        const moduleState = await page.evaluate(() => ({
          url: window.location.href,
          pathname: window.location.pathname,
          hash: window.location.hash,
          h1: document.querySelector('h1')?.textContent?.trim(),
          h2: document.querySelector('h2')?.textContent?.trim(),
          h3: document.querySelector('h3')?.textContent?.trim(),
          hasTable: !!document.querySelector('table'),
          tableRows: document.querySelector('table tbody')?.querySelectorAll('tr').length || 0,
          hasCards: document.querySelectorAll('[class*="card"], [class*="Card"]').length > 0,
          cardCount: document.querySelectorAll('[class*="card"], [class*="Card"]').length
        }));

        await page.screenshot({
          path: `test-results/screenshots/nav-${String(i + 1).padStart(2, '0')}-${navItem.text.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
          fullPage: false
        });

        moduleResults.push({
          index: i + 1,
          moduleName: navItem.text,
          navItem: navItem,
          state: moduleState,
          success: true
        });

        console.log(`    ✅ Success!`);
        console.log(`       URL: ${moduleState.url}`);
        console.log(`       Heading: ${moduleState.h1 || moduleState.h2 || moduleState.h3}`);
        console.log(`       Content: ${moduleState.hasTable ? `Table (${moduleState.tableRows} rows)` : moduleState.hasCards ? `Cards (${moduleState.cardCount})` : 'Other'}`);

      } catch (error: any) {
        console.log(`    ❌ Failed: ${error.message}`);
        moduleResults.push({
          index: i + 1,
          moduleName: navItem.text,
          error: error.message,
          success: false
        });
      }
    }

    // Generate final report
    const finalReport = {
      timestamp: new Date().toISOString(),
      productionUrl: 'http://68.220.148.2',
      authMethod: 'Email/Password',
      credentials: 'admin@demofleet.com / Demo@123',
      navigation: {
        sidebarHTML: navStructure.sidebarHTML,
        totalUniqueItems: uniqueNavItems.length,
        items: uniqueNavItems
      },
      moduleResults: moduleResults,
      summary: {
        tested: moduleResults.length,
        successful: moduleResults.filter(m => m.success).length,
        failed: moduleResults.filter(m => !m.success).length,
        successRate: moduleResults.length > 0
          ? `${Math.round((moduleResults.filter(m => m.success).length / moduleResults.length) * 100)}%`
          : 'N/A'
      }
    };

    fs.writeFileSync('test-results/full-navigation-analysis.json', JSON.stringify(finalReport, null, 2));

    console.log('\n\n═══════════════════════════════════════════════════════════');
    console.log('📊 NAVIGATION ANALYSIS COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Success Rate: ${finalReport.summary.successRate}`);
    console.log(`   Tested: ${finalReport.summary.tested}`);
    console.log(`   Successful: ${finalReport.summary.successful}`);
    console.log(`   Failed: ${finalReport.summary.failed}`);
    console.log('\n🎯 SELECTOR RECOMMENDATIONS:\n');

    moduleResults.filter(m => m.success).forEach((result: any) => {
      console.log(`"${result.moduleName}"`);
      console.log(`  Selector: aside button:text-is("${result.moduleName}"), aside a:text-is("${result.moduleName}")`);
      console.log(`  URL: ${result.state.pathname}`);
      console.log(`  Heading: "${result.state.h1 || result.state.h2}"`);
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════\n');
  } else {
    console.log('\n⚠️  Could not access dashboard - still on login page');
    console.log('Please check authentication configuration');
  }
});
