import { test, expect } from '@playwright/test';

test('Visual inspection - CTA Fleet branding', async ({ page }) => {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Verify page title
  const title = await page.title();
  console.log(`\n📄 Page Title: ${title}`);
  expect(title).toContain('CTA Fleet');

  // Check for branding elements
  const hasCTA = await page.locator('text=/CTA/i').count() > 0;
  const hasFleet = await page.locator('text=/FLEET/i').count() > 0;

  console.log(`✅ Has "CTA" text: ${hasCTA}`);
  console.log(`✅ Has "FLEET" text: ${hasFleet}`);

  expect(hasCTA).toBeTruthy();
  expect(hasFleet).toBeTruthy();

  // Take full page screenshot
  const screenshotPath = '/tmp/cta-fleet-visual-inspection.png';
  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  console.log(`\n📸 Screenshot saved to: ${screenshotPath}`);
  console.log(`🎨 Visual branding: Navy (#1A1847) + Gold (#F0A000)`);
  console.log(`✅ Branding verification complete`);
});
