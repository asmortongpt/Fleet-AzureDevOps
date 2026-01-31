import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

test.describe('ComplianceHub Quality Tests', () => {
  for (const viewport of viewports) {
    test(`ComplianceHub ${viewport.name} - no scroll`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      console.log(`ComplianceHub ${viewport.name}: scrollHeight=${scrollHeight}, viewportHeight=${viewport.height}`);

      expect(scrollHeight).toBeLessThanOrEqual(viewport.height + 5);

      await page.screenshot({ path: `screenshots/compliancehub-${viewport.name}.png`, fullPage: false });
    });

    test(`ComplianceHub ${viewport.name} - metrics visible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');

      // Look for compliance metrics
      const metrics = page.locator('[data-testid*="metric"], [class*="metric"], [class*="card"]');
      const count = await metrics.count();

      console.log(`ComplianceHub ${viewport.name}: ${count} metric elements`);
      expect(count).toBeGreaterThan(0);
    });

    test(`ComplianceHub ${viewport.name} - charts render`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');

      // Check for SVG charts (Recharts)
      const charts = page.locator('svg.recharts-surface, svg[class*="chart"]');
      const count = await charts.count();

      console.log(`ComplianceHub ${viewport.name}: ${count} charts rendered`);
    });

    test(`ComplianceHub ${viewport.name} - accessibility`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
        .analyze();

      console.log(`ComplianceHub ${viewport.name}: ${results.violations.length} violations`);

      if (results.violations.length > 0) {
        console.log('Violations:', JSON.stringify(results.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length
        })), null, 2));
      }

      expect(results.violations).toEqual([]);
    });

    test(`ComplianceHub ${viewport.name} - data tables accessible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');

      // Check for tables with proper structure
      const tables = page.locator('table');
      const tableCount = await tables.count();

      if (tableCount > 0) {
        const firstTable = tables.first();
        const headers = firstTable.locator('th');
        const headerCount = await headers.count();

        console.log(`ComplianceHub ${viewport.name}: ${tableCount} tables, ${headerCount} headers in first table`);
        expect(headerCount).toBeGreaterThan(0);
      }
    });

    test(`ComplianceHub ${viewport.name} - keyboard navigation`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');

      const focusable = [];
      for (let i = 0; i < 15; i++) {
        await page.keyboard.press('Tab');
        const focused = await page.evaluate(() => document.activeElement?.tagName);
        if (focused && focused !== 'BODY') {
          focusable.push(focused);
        }
      }

      console.log(`ComplianceHub ${viewport.name}: ${focusable.length} keyboard navigable elements`);
      expect(focusable.length).toBeGreaterThan(0);
    });

    test(`ComplianceHub ${viewport.name} - performance`, async ({ page }) => {
      await page.setViewportSize(viewport);

      const start = Date.now();
      await page.goto('http://localhost:5173/compliance');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;

      console.log(`ComplianceHub ${viewport.name}: Load time ${loadTime}ms`);
      expect(loadTime).toBeLessThan(3000);
    });
  }
});
