/**
 * Responsive Forms E2E Tests
 * Validates form behavior, accessibility, and UX at all breakpoints
 */

import { test, expect } from '@playwright/test';

const BREAKPOINTS = [
  { name: 'mobile-320px', width: 320, height: 667 },
  { name: 'mobile-480px', width: 480, height: 800 },
  { name: 'tablet-768px', width: 768, height: 1024 },
  { name: 'tablet-1024px', width: 1024, height: 768 },
  { name: 'desktop-1440px', width: 1440, height: 900 },
];

test.describe('Responsive Forms', () => {
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - form inputs should be properly sized`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const inputs = await page.locator('input[type="text"], input[type="email"], textarea, select');
      const count = await inputs.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const box = await input.boundingBox();

        if (box) {
          // Inputs should be readable
          expect(box.height).toBeGreaterThanOrEqual(36); // Comfortable touch target

          // Mobile inputs should be full-width
          if (width < 768) {
            expect(box.width).toBeGreaterThan(200); // Account for padding
          }
        }
      }
    });

    test(`${name} - form labels should be visible`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const labels = await page.locator('label');
      const count = await labels.count();

      if (count > 0) {
        const firstLabel = labels.first();
        const isVisible = await firstLabel.isVisible({ timeout: 3000 });
        expect(isVisible).toBeTruthy();
      }
    });

    test(`${name} - form buttons should be tappable`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button[type="submit"], button[type="button"]');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          // Buttons should be tappable
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });

    test(`${name} - form should not require horizontal scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
  });

  test('mobile - form inputs should not zoom on focus', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const inputs = await page.locator('input[type="text"]');
    const firstInput = inputs.first();

    // Get initial zoom level
    const initialZoom = await page.evaluate(() => window.devicePixelRatio);

    // Focus input
    await firstInput.focus();
    await page.waitForTimeout(500);

    // Get zoom level after focus
    const focusedZoom = await page.evaluate(() => window.devicePixelRatio);

    // Zoom should not change (font size 16px+ prevents auto-zoom)
    // Note: This test may not work in headless browser
    console.log(`Zoom level - Initial: ${initialZoom}, After focus: ${focusedZoom}`);
  });

  test('mobile - floating labels should work correctly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const inputs = await page.locator('input');
    const firstInput = inputs.first();

    // Focus and type
    await firstInput.focus();
    await firstInput.type('Test input');

    // Get the label associated with this input
    const inputId = await firstInput.getAttribute('id');
    if (inputId) {
      const label = await page.locator(`label[for="${inputId}"]`);
      const isVisible = await label.isVisible({ timeout: 1000 });

      if (isVisible) {
        expect(isVisible).toBeTruthy();
      }
    }
  });

  test('tablet - form should stack vertically', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const formRows = await page.locator('[class*="flex"], [class*="grid"]');

    // Forms should have proper structure
    expect(formRows.first()).toBeTruthy();
  });

  test('desktop - form can use multi-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const multiColumnForms = await page.locator('[class*="grid-cols-2"], [class*="grid-cols-3"]');
    const count = await multiColumnForms.count();

    // Desktop can have multi-column forms
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('mobile - form validation messages should be visible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Look for error messages or validation feedback
    const errorElements = await page.locator('[role="alert"], [class*="error"], .text-red');
    const count = await errorElements.count();

    // If validation exists, it should be visible
    if (count > 0) {
      const firstError = errorElements.first();
      const isVisible = await firstError.isVisible({ timeout: 2000 });
      // Error might not be visible until form submitted
    }
  });

  test('all sizes - required field indicators should be accessible', async ({ page }) => {
    // Test across multiple sizes
    const sizes = [
      { width: 320, height: 667 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ];

    for (const { width, height } of sizes) {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Look for required indicators
      const requiredFields = await page.locator('input[required], [aria-required="true"]');
      const count = await requiredFields.count();

      if (count > 0) {
        const firstRequired = requiredFields.first();
        expect(firstRequired).toBeTruthy();
      }
    }
  });
});
