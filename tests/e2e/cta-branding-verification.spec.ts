import { test, expect } from '@playwright/test';

test('CTA Fleet branding - Page title verification', async ({ page }) => {
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Check page title
  const title = await page.title();
  console.log(`\n✅ Page Title: ${title}`);
  expect(title).toContain('CTA Fleet');
  expect(title).toContain('Intelligent Performance');

  // Check for CTA and FLEET text on page
  const ctaCount = await page.locator('text=/CTA/i').count();
  const fleetCount = await page.locator('text=/FLEET/i').count();

  console.log(`✅ "CTA" text found: ${ctaCount} times`);
  console.log(`✅ "FLEET" text found: ${fleetCount} times`);

  expect(ctaCount).toBeGreaterThan(0);
  expect(fleetCount).toBeGreaterThan(0);

  // Take screenshot
  await page.screenshot({
    path: '/tmp/cta-branding-verification.png',
    fullPage: true
  });

  console.log(`✅ Screenshot saved to /tmp/cta-branding-verification.png`);
  console.log(`✅ CTA Branding verification COMPLETE`);
});
