import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'ultrawide', width: 2560, height: 1440 }
];

const authPages = [
  { path: '/login', name: 'Login' },
  { path: '/sso-login', name: 'SSO Login' },
  { path: '/reset-password', name: 'Password Reset' }
];

for (const page of authPages) {
  for (const viewport of viewports) {
    test(`${page.name} - ${viewport.name} - no scroll required`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize(viewport);
      await browserPage.goto(`http://localhost:5173${page.path}`);

      // Wait for page to load
      await browserPage.waitForLoadState('networkidle');

      // Measure scroll height vs viewport height
      const scrollHeight = await browserPage.evaluate(() => document.documentElement.scrollHeight);
      const viewportHeight = viewport.height;

      console.log(`${page.name} ${viewport.name}: scrollHeight=${scrollHeight}, viewportHeight=${viewportHeight}`);

      expect(scrollHeight).toBeLessThanOrEqual(viewportHeight + 5); // Allow 5px tolerance

      // Take screenshot
      await browserPage.screenshot({
        path: `screenshots/${page.path.replace('/', '')}-${viewport.name}.png`,
        fullPage: false
      });
    });

    test(`${page.name} - ${viewport.name} - accessibility`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize(viewport);
      await browserPage.goto(`http://localhost:5173${page.path}`);
      await browserPage.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
        .analyze();

      console.log(`${page.name} ${viewport.name}: ${accessibilityScanResults.violations.length} violations`);

      if (accessibilityScanResults.violations.length > 0) {
        console.log('Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2));
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test(`${page.name} - ${viewport.name} - keyboard navigation`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize(viewport);
      await browserPage.goto(`http://localhost:5173${page.path}`);
      await browserPage.waitForLoadState('networkidle');

      // Tab through all interactive elements
      const focusableElements = [];
      let tabCount = 0;

      while (tabCount < 20) {
        await browserPage.keyboard.press('Tab');
        const focused = await browserPage.evaluate(() => ({
          tag: document.activeElement?.tagName,
          id: document.activeElement?.id,
          class: document.activeElement?.className
        }));

        if (focused.tag && focused.tag !== 'BODY') {
          focusableElements.push(focused);
          tabCount++;
        } else {
          break;
        }
      }

      console.log(`${page.name} ${viewport.name}: ${focusableElements.length} focusable elements`);

      // Should have at least 3 focusable elements (typical for auth pages)
      expect(focusableElements.length).toBeGreaterThanOrEqual(3);
    });

    test(`${page.name} - ${viewport.name} - color contrast`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize(viewport);
      await browserPage.goto(`http://localhost:5173${page.path}`);
      await browserPage.waitForLoadState('networkidle');

      // Check for AAA contrast violations
      const contrastResults = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2aaa'])
        .disableRules(['region', 'landmark-one-main', 'page-has-heading-one']) // Focus only on contrast
        .analyze();

      const contrastViolations = contrastResults.violations.filter(v =>
        v.id === 'color-contrast' || v.id === 'color-contrast-enhanced'
      );

      if (contrastViolations.length > 0) {
        console.log(`${page.name} ${viewport.name}: Contrast violations:`, JSON.stringify(contrastViolations, null, 2));
      }

      expect(contrastViolations.length).toBe(0);
    });
  }
}
