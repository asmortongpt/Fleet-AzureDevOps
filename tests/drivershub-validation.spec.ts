import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

test.describe('DriversHub Quality Tests', () => {
  for (const viewport of viewports) {
    test(`DriversHub ${viewport.name} - no scroll`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      console.log(`DriversHub ${viewport.name}: scrollHeight=${scrollHeight}, viewportHeight=${viewport.height}`);

      expect(scrollHeight).toBeLessThanOrEqual(viewport.height + 5);

      await page.screenshot({ path: `screenshots/drivershub-${viewport.name}.png`, fullPage: false });
    });

    test(`DriversHub ${viewport.name} - drivers visible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');

      const drivers = page.locator('[data-testid*="driver"], [class*="driver"]');
      const count = await drivers.count();

      console.log(`DriversHub ${viewport.name}: ${count} driver elements`);
      expect(count).toBeGreaterThan(0);
    });

    test(`DriversHub ${viewport.name} - HOS data visible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');

      // Look for HOS-related content
      const hosElements = page.locator('[class*="hos"], [data-testid*="hos"]');
      const count = await hosElements.count();

      console.log(`DriversHub ${viewport.name}: ${count} HOS elements`);
    });

    test(`DriversHub ${viewport.name} - accessibility`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
        .analyze();

      console.log(`DriversHub ${viewport.name}: ${results.violations.length} violations`);

      if (results.violations.length > 0) {
        console.log('Violations:', JSON.stringify(results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description
        })), null, 2));
      }

      expect(results.violations).toEqual([]);
    });

    test(`DriversHub ${viewport.name} - keyboard navigation`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');

      // Tab through elements
      const focusable = [];
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => ({
          tag: document.activeElement?.tagName,
          text: document.activeElement?.textContent?.substring(0, 30)
        }));
        if (focused.tag && focused.tag !== 'BODY') {
          focusable.push(focused);
        }
      }

      console.log(`DriversHub ${viewport.name}: ${focusable.length} focusable elements`);
      expect(focusable.length).toBeGreaterThan(0);
    });

    test(`DriversHub ${viewport.name} - performance`, async ({ page }) => {
      await page.setViewportSize(viewport);

      const start = Date.now();
      await page.goto('http://localhost:5173/drivers');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;

      console.log(`DriversHub ${viewport.name}: Load time ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });
  }
});
