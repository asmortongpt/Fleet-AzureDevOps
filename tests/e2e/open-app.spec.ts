import { test } from '@playwright/test';

test('Open CTA Fleet application', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Take full page screenshot
  await page.screenshot({
    path: '/tmp/cta-fleet-app-screenshot.png',
    fullPage: true
  });

  console.log('\n✅ Application opened successfully!');
  console.log(`📄 Page Title: ${await page.title()}`);
  console.log(`📱 URL: ${page.url()}`);

  // Get page dimensions
  const viewport = page.viewportSize();
  console.log(`📐 Viewport: ${viewport?.width}x${viewport?.height}`);

  // Count interactive elements
  const buttons = await page.locator('button').count();
  const links = await page.locator('a').count();
  console.log(`🔘 Buttons: ${buttons}`);
  console.log(`🔗 Links: ${links}`);

  // Get heading structure
  const h1 = await page.locator('h1').count();
  const h2 = await page.locator('h2').count();
  console.log(`📋 Headings: H1(${h1}) H2(${h2})`);

  // Keep page open for 30 seconds so you can see it
  console.log('\n🖥️  Browser is now open. Waiting 30 seconds...');
  await page.waitForTimeout(30000);

  console.log('✅ Browser view complete!');
});
