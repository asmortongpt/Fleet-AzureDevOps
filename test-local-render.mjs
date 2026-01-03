#!/usr/bin/env node
import { chromium } from '@playwright/test';

async function testLocalRender() {
  console.log('🧪 Testing local production build rendering...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Listen for JavaScript errors
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });

  try {
    // Navigate to local preview
    console.log('📍 Navigating to http://localhost:4173');
    await page.goto('http://localhost:4173', {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Get root div content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.length : 0;
    });

    // Check for page structure
    const hasHeader = await page.locator('header').count() > 0;
    const hasNav = await page.locator('nav').count() > 0;
    const hasMain = await page.locator('main').count() > 0;

    // Get all errors
    console.log('\n📊 Results:');
    console.log(`  Root div content length: ${rootContent} characters`);
    console.log(`  Has header: ${hasHeader}`);
    console.log(`  Has nav: ${hasNav}`);
    console.log(`  Has main: ${hasMain}`);
    console.log(`  JavaScript errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors:');
      errors.forEach(err => console.log(`  - ${err}`));
    }

    // Take a screenshot
    await page.screenshot({ path: 'local-render-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to local-render-test.png');

    // Check success
    if (rootContent > 0 && errors.length === 0) {
      console.log('\n✅ SUCCESS: App renders correctly locally!');
      process.exit(0);
    } else if (rootContent > 0 && errors.length > 0) {
      console.log('\n⚠️  WARNING: App renders but has errors');
      process.exit(1);
    } else {
      console.log('\n❌ FAILURE: App does not render');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testLocalRender().catch(console.error);
