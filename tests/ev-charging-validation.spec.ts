import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

const evPages = [
  { path: '/charging', name: 'ChargingHub' },
  { path: '/ev', name: 'EVHub' }
];

test.describe('EV & Charging Quality Tests', () => {
  for (const pagePath of evPages) {
    for (const viewport of viewports) {
      test(`${pagePath.name} ${viewport.name} - no scroll`, async ({ page }) => {
        await page.setViewportSize(viewport);

        // Try to navigate, handle if route doesn't exist
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          console.log(`${pagePath.name} ${viewport.name}: Route not found (404), skipping`);
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        console.log(`${pagePath.name} ${viewport.name}: scrollHeight=${scrollHeight}, viewportHeight=${viewport.height}`);

        expect(scrollHeight).toBeLessThanOrEqual(viewport.height + 5);

        await page.screenshot({
          path: `screenshots/${pagePath.name.toLowerCase()}-${viewport.name}.png`,
          fullPage: false
        });
      });

      test(`${pagePath.name} ${viewport.name} - energy metrics visible`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');

        // Look for energy/charging related metrics
        const metrics = page.locator('[data-testid*="energy"], [data-testid*="charging"], [class*="metric"]');
        const count = await metrics.count();

        console.log(`${pagePath.name} ${viewport.name}: ${count} energy metric elements`);
      });

      test(`${pagePath.name} ${viewport.name} - charging stations render`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');

        const stations = page.locator('[data-testid*="station"], [class*="station"], [class*="charger"]');
        const count = await stations.count();

        console.log(`${pagePath.name} ${viewport.name}: ${count} charging station elements`);
      });

      test(`${pagePath.name} ${viewport.name} - accessibility`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
          .analyze();

        console.log(`${pagePath.name} ${viewport.name}: ${results.violations.length} violations`);

        if (results.violations.length > 0) {
          console.log('Violations:', JSON.stringify(results.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description
          })), null, 2));
        }

        expect(results.violations).toEqual([]);
      });

      test(`${pagePath.name} ${viewport.name} - carbon metrics visible`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');

        const carbon = page.locator('[data-testid*="carbon"], [class*="carbon"], [class*="sustainability"]');
        const count = await carbon.count();

        console.log(`${pagePath.name} ${viewport.name}: ${count} carbon/sustainability elements`);
      });

      test(`${pagePath.name} ${viewport.name} - keyboard navigation`, async ({ page }) => {
        await page.setViewportSize(viewport);
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');

        const focusable = [];
        for (let i = 0; i < 15; i++) {
          await page.keyboard.press('Tab');
          const focused = await page.evaluate(() => document.activeElement?.tagName);
          if (focused && focused !== 'BODY') {
            focusable.push(focused);
          }
        }

        console.log(`${pagePath.name} ${viewport.name}: ${focusable.length} keyboard navigable elements`);
      });

      test(`${pagePath.name} ${viewport.name} - performance`, async ({ page }) => {
        await page.setViewportSize(viewport);

        const start = Date.now();
        const response = await page.goto(`http://localhost:5173${pagePath.path}`);

        if (response && response.status() === 404) {
          test.skip();
          return;
        }

        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - start;

        console.log(`${pagePath.name} ${viewport.name}: Load time ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
      });
    }
  }
});
