import { test, expect } from '@playwright/test';

test.describe('Production Site Fresh Test', () => {
  test('should load production site without white screen', async ({ page }) => {
    // Set up console logging
    const consoleMessages: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      console.log(`[BROWSER ${msg.type()}]`, msg.text());
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('[PAGE ERROR]', error.message);
    });

    // Navigate to production
    console.log('🌐 Navigating to production site...');
    const response = await page.goto('https://fleet.capitaltechalliance.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Check HTTP status
    console.log(`📊 HTTP Status: ${response?.status()}`);
    expect(response?.status()).toBe(200);

    // Wait for React to render
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/production-test.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/production-test.png');

    // Check if page has content
    const bodyText = await page.textContent('body');
    console.log(`📝 Body text length: ${bodyText?.length || 0}`);

    // Check for white screen indicators
    const html = await page.content();
    const hasReactRoot = html.includes('id="root"');
    const rootHasContent = await page.locator('#root').count() > 0;
    const rootContent = rootHasContent ? await page.locator('#root').innerHTML() : '';

    console.log('✅ Diagnostic Results:');
    console.log(`  - Has React root: ${hasReactRoot}`);
    console.log(`  - Root exists: ${rootHasContent}`);
    console.log(`  - Root content length: ${rootContent.length}`);
    console.log(`  - JavaScript errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('❌ JavaScript Errors Found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Check for specific error indicators
    const hasMapError = errors.some(e =>
      e.includes('Map is not a constructor') ||
      e.includes('Map') ||
      e.includes('is not iterable')
    );

    if (hasMapError) {
      console.log('❌ FOUND MAP-RELATED ERROR!');
      throw new Error('Map constructor error detected');
    }

    // Check if content loaded
    if (rootContent.length < 100) {
      console.log('❌ WHITE SCREEN DETECTED - Root has no content');
      throw new Error(`White screen: root only has ${rootContent.length} characters`);
    }

    console.log('✅ SUCCESS - Site loaded with content!');
    console.log(`   Root has ${rootContent.length} characters of content`);

    // Verify key elements exist
    const hasNavigation = await page.locator('nav, header, [role="navigation"]').count() > 0;
    console.log(`  - Has navigation: ${hasNavigation}`);

    expect(rootContent.length).toBeGreaterThan(100);
    expect(errors.length).toBe(0);
  });
});
