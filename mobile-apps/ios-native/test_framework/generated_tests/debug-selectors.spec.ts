/**
 * Debug test to inspect production DOM and capture actual selectors
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

test('Debug Production Selectors', async ({ page }) => {
  console.log('🔍 Inspecting production UI at http://68.220.148.2');

  await page.goto('http://68.220.148.2', { waitUntil: 'networkidle' });

  // Check login page structure
  console.log('\n📝 === LOGIN PAGE ANALYSIS ===');

  const loginPageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      hasEmailInput: !!document.querySelector('input[type="email"]'),
      hasPasswordInput: !!document.querySelector('input[type="password"]'),
      emailInputSelector: document.querySelector('input[type="email"]')?.outerHTML.substring(0, 200),
      passwordInputSelector: document.querySelector('input[type="password"]')?.outerHTML.substring(0, 200),
      allButtons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim(),
        type: b.type,
        classes: b.className
      })),
      formStructure: document.querySelector('form')?.outerHTML.substring(0, 500)
    };
  });

  console.log('Login page structure:', JSON.stringify(loginPageInfo, null, 2));

  // Try to login
  console.log('\n🔐 Attempting login...');

  const emailInput = page.locator('input[type="email"]');
  const passwordInput = page.locator('input[type="password"]');

  if (await emailInput.isVisible()) {
    await emailInput.fill('admin@demofleet.com');
    await passwordInput.fill('Demo@123');

    // Find the submit button (type="submit")
    const submitButton = page.locator('button[type="submit"]');
    console.log('Clicking submit button...');

    // Wait for possible navigation or loading state
    const [response] = await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
      submitButton.click()
    ]);

    console.log('Form submitted, waiting for page to load...');
    await page.waitForTimeout(5000);

    // Check for any error messages
    const errorMessage = await page.locator('[role="alert"], .error, [class*="error"]').textContent().catch(() => null);
    if (errorMessage) {
      console.log('⚠️  Error message found:', errorMessage);
    }
  }

  // Check if we're logged in
  const currentUrl = page.url();
  console.log('\n📍 Current URL after login:', currentUrl);

  if (currentUrl.includes('/login')) {
    console.log('❌ Still on login page - authentication may have failed');
    console.log('   Try checking the form submission or credentials');
  } else {
    console.log('✅ Successfully navigated away from login page');
  }

  // Analyze the dashboard/main page
  console.log('\n📊 === DASHBOARD/MAIN PAGE ANALYSIS ===');

  const dashboardInfo = await page.evaluate(() => {
    return {
      url: window.location.href,
      title: document.title,

      // Header analysis
      header: {
        exists: !!document.querySelector('header'),
        html: document.querySelector('header')?.outerHTML.substring(0, 500),
        h1Count: document.querySelectorAll('h1').length,
        h2Count: document.querySelectorAll('h2').length,
        h1Text: Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim()),
        h2Text: Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim())
      },

      // Sidebar/Navigation analysis
      navigation: {
        hasSidebar: !!document.querySelector('aside'),
        hasNav: !!document.querySelector('nav'),
        sidebarClasses: document.querySelector('aside')?.className,
        navClasses: document.querySelector('nav')?.className,
        navigationLinks: Array.from(document.querySelectorAll('aside button, aside a, nav button, nav a')).map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim(),
          classes: el.className.substring(0, 100),
          href: el.tagName === 'A' ? (el as HTMLAnchorElement).href : null
        })).slice(0, 20)
      },

      // Main content analysis
      main: {
        exists: !!document.querySelector('main'),
        classes: document.querySelector('main')?.className,
        directChildren: document.querySelector('main')?.children.length
      },

      // Table analysis (for vehicle list)
      tables: {
        count: document.querySelectorAll('table').length,
        headers: Array.from(document.querySelectorAll('table th, [role="columnheader"]')).map(th => th.textContent?.trim()),
        rowCount: document.querySelectorAll('table tbody tr, [role="row"]').length
      },

      // Button analysis
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.textContent?.trim().substring(0, 50),
        ariaLabel: b.getAttribute('aria-label'),
        classes: b.className.substring(0, 100)
      })).slice(0, 15),

      // Input analysis
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        name: i.name,
        placeholder: i.placeholder,
        id: i.id
      })).slice(0, 10)
    };
  });

  console.log('\nDashboard Structure:');
  console.log(JSON.stringify(dashboardInfo, null, 2));

  // Save to file for analysis
  fs.writeFileSync(
    'test-results/production-selectors-debug.json',
    JSON.stringify({
      loginPage: loginPageInfo,
      dashboard: dashboardInfo,
      timestamp: new Date().toISOString()
    }, null, 2)
  );

  console.log('\n💾 Saved detailed analysis to: test-results/production-selectors-debug.json');

  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-screenshot.png', fullPage: true });
  console.log('📸 Screenshot saved to: test-results/debug-screenshot.png');
});
