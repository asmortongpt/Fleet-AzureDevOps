#!/usr/bin/env node
import { chromium } from '@playwright/test';

async function testProdSite() {
  console.log('🧪 Testing production site rendering...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Listen for JavaScript errors
  page.on('pageerror', error => {
    logs.push(`[pageerror] ${error.message}\n${error.stack}`);
  });

  try {
    // Navigate to production
    console.log('📍 Navigating to http://20.161.96.87');
    await page.goto('http://20.161.96.87', {
      waitUntil: 'networkidle',
      timeout: 15000
    });

    // Wait for rendering
    await page.waitForTimeout(3000);

    // Get root div content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length : 0;
    });

    // Check for page structure
    const hasHeader = await page.locator('header').count() > 0;
    const hasNav = await page.locator('nav').count() > 0;
    const hasMain = await page.locator('main').count() > 0;

    console.log('\n📊 Results:');
    console.log(`  Root div content length: ${rootContent} characters`);
    console.log(`  Has header: ${hasHeader}`);
    console.log(`  Has nav: ${hasNav}`);
    console.log(`  Has main: ${hasMain}`);

    console.log('\n📋 Console Logs (all):');
    logs.forEach(log => console.log(`  ${log}`));

    // Take a screenshot
    await page.screenshot({ path: 'prod-site-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to prod-site-test.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProdSite().catch(console.error);
