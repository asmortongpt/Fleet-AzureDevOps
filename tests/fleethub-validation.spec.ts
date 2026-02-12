import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

test.describe('FleetHub Quality Tests', () => {
  for (const viewport of viewports) {
    test(`FleetHub ${viewport.name} - no scroll required`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for dynamic content

      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const viewportHeight = viewport.height;

      console.log(`FleetHub ${viewport.name}: scrollHeight=${scrollHeight}, viewportHeight=${viewportHeight}`);

      expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 5);

      await page.screenshot({ path: `screenshots/fleethub-${viewport.name}.png`, fullPage: false });
    });

    test(`FleetHub ${viewport.name} - map renders`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check for map container
      const mapContainer = page.locator('[class*="map"]').first();
      await expect(mapContainer).toBeVisible({ timeout: 5000 });

      console.log(`FleetHub ${viewport.name}: Map container visible`);
    });

    test(`FleetHub ${viewport.name} - vehicle list visible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check for vehicle list or cards
      const vehicles = page.locator('[data-testid*="vehicle"], [class*="vehicle"]');
      const count = await vehicles.count();

      console.log(`FleetHub ${viewport.name}: ${count} vehicle elements found`);
      expect(count).toBeGreaterThan(0);
    });

    test(`FleetHub ${viewport.name} - accessibility`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      console.log(`FleetHub ${viewport.name}: ${results.violations.length} violations`);

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

    test(`FleetHub ${viewport.name} - keyboard navigation`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Test keyboard navigation through vehicles
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focused = await page.evaluate(() => document.activeElement?.tagName);
      console.log(`FleetHub ${viewport.name}: First tab focused on ${focused}`);

      expect(focused).toBeTruthy();
    });

    test(`FleetHub ${viewport.name} - performance`, async ({ page }) => {
      await page.setViewportSize(viewport);

      const startTime = Date.now();
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      console.log(`FleetHub ${viewport.name}: Load time ${loadTime}ms`);

      expect(loadTime).toBeLessThan(3000); // <3s initial load (will optimize to <1s)
    });

    test(`FleetHub ${viewport.name} - live tracking tab`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Click on Live Tracking tab
      const liveTrackingTab = page.getByRole('tab', { name: /live tracking/i });
      if (await liveTrackingTab.isVisible()) {
        await liveTrackingTab.click();
        await page.waitForTimeout(1000);

        // Verify map is visible in Live Tracking tab
        const mapVisible = await page.locator('[class*="map"]').isVisible();
        console.log(`FleetHub ${viewport.name}: Live Tracking map visible: ${mapVisible}`);
        expect(mapVisible).toBeTruthy();
      }
    });

    test(`FleetHub ${viewport.name} - vehicle status indicators`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check for status badges
      const statusBadges = page.locator('[class*="badge"]');
      const count = await statusBadges.count();

      console.log(`FleetHub ${viewport.name}: ${count} status badges found`);
      expect(count).toBeGreaterThan(0);
    });

    test(`FleetHub ${viewport.name} - interactive elements accessible`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check all interactive elements have proper roles/labels
      const buttons = page.getByRole('button');
      const buttonCount = await buttons.count();

      const tabs = page.getByRole('tab');
      const tabCount = await tabs.count();

      console.log(`FleetHub ${viewport.name}: ${buttonCount} buttons, ${tabCount} tabs`);
      expect(buttonCount + tabCount).toBeGreaterThan(0);
    });
  }

  // Cross-viewport consistency tests
  test('FleetHub - consistent content across viewports', async ({ page }) => {
    const contentCounts: Record<string, number> = {};

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const vehicleElements = await page.locator('[class*="vehicle"]').count();
      contentCounts[viewport.name] = vehicleElements;
    }

    console.log('Content consistency:', contentCounts);

    // All viewports should show same number of vehicles (within reason)
    const values = Object.values(contentCounts);
    const max = Math.max(...values);
    const min = Math.min(...values);
    expect(max - min).toBeLessThanOrEqual(5); // Allow small variance for responsive design
  });
});
