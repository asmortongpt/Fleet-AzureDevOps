#!/usr/bin/env node
import playwright from 'playwright';

console.log('\n🔍 Verifying browser content with auth bypass...\n');

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
  });

  try {
    // Test homepage
    console.log('📍 Testing: http://localhost:5173\n');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for auth bypass and React hydration

    const title = await page.title();
    const bodyText = await page.locator('body').textContent();
    const hasRoot = await page.locator('#root').count();
    const rootContent = await page.locator('#root').textContent();

    console.log(`📄 Page Title: ${title}`);
    console.log(`📏 Body Length: ${bodyText.length} characters`);
    console.log(`🎯 Root Element: ${hasRoot > 0 ? 'Found' : 'Missing'}`);
    console.log(`📏 Root Content Length: ${rootContent.length} characters`);

    // Check for key indicators
    const hasFleetText = bodyText.includes('Fleet') || bodyText.includes('fleet');
    const hasNavigation = bodyText.includes('Dashboard') || bodyText.includes('Vehicle');
    const hasAuth = bodyText.includes('Login') || bodyText.includes('Sign in');

    console.log(`\n🔍 Content Analysis:`);
    console.log(`  ✓ Contains "Fleet": ${hasFleetText}`);
    console.log(`  ✓ Has Navigation: ${hasNavigation}`);
    console.log(`  ⚠ Shows Login: ${hasAuth}`);

    // Show first 500 chars of visible text
    console.log(`\n📝 First 500 characters of page content:`);
    console.log(`${rootContent.substring(0, 500).replace(/\s+/g, ' ').trim()}\n`);

    // Check console for errors
    const errors = consoleMessages.filter(m => m.startsWith('error'));
    const warnings = consoleMessages.filter(m => m.startsWith('warning'));

    if (errors.length > 0) {
      console.log(`❌ Browser Errors (${errors.length}):`);
      errors.slice(0, 5).forEach(e => console.log(`  ${e}`));
    }

    if (warnings.length > 0) {
      console.log(`⚠️  Browser Warnings (${warnings.length}):`);
      warnings.slice(0, 3).forEach(w => console.log(`  ${w}`));
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/browser-verification.png', fullPage: true });
    console.log(`\n📸 Screenshot saved: test-results/browser-verification.png`);

    // Final assessment
    if (rootContent.length > 200 && !hasAuth) {
      console.log(`\n✅ SUCCESS: Page shows actual content (${rootContent.length} chars)\n`);
    } else if (hasAuth) {
      console.log(`\n⚠️  WARNING: Page showing login screen (auth bypass may not be working)\n`);
    } else {
      console.log(`\n❌ ERROR: Page appears to be blank (${rootContent.length} chars)\n`);
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
})();
