import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG AAA Accessibility Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    // Wait for app to load
    await page.waitForLoadState('networkidle');
  });

  test('should have 0 critical accessibility violations', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa', 'wcag21aaa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should meet color contrast requirements (WCAG AAA 7:1)', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast-enhanced'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have proper landmark structure', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['best-practice'])
      .analyze();

    const landmarkViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'landmark-one-main' || v.id === 'region'
    );

    expect(landmarkViolations).toEqual([]);
  });

  test('should verify gray text uses slate-700 (#334155)', async ({ page }) => {
    // Check that no text-gray-600 classes remain
    const grayTextElements = await page.locator('.text-gray-600').count();
    expect(grayTextElements).toBe(0);

    // Verify slate-700 is used instead
    const slateTextElements = await page.locator('.text-slate-700').count();
    expect(slateTextElements).toBeGreaterThan(0);
  });

  test('should verify links use blue-800 for proper contrast', async ({ page }) => {
    // Check that no text-blue-500 or text-blue-600 classes remain in links
    const lightBlueLinks = await page.locator('a.text-blue-500, a.text-blue-600').count();
    expect(lightBlueLinks).toBe(0);

    // Verify blue-800 is used for links
    const darkBlueLinks = await page.locator('a.text-blue-800').count();
    expect(darkBlueLinks).toBeGreaterThan(0);
  });

  test('should have skip link that works', async ({ page }) => {
    // Focus the skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();

    // Click skip link
    await skipLink.click();

    // Verify focus moved to main content
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('should have proper ARIA labels on floating UI elements', async ({ page }) => {
    // Verify Role Switcher has complementary role
    const roleSwitcher = page.locator('div[role="complementary"][aria-label="Role switcher"]');
    await expect(roleSwitcher).toBeVisible();

    // Verify Toast notifications have status role
    const toastStatus = page.locator('div[role="status"][aria-label*="otifications"]');
    await expect(toastStatus.first()).toBeInViewport();
  });

  test('should have no duplicate skip links', async ({ page }) => {
    const skipLinks = await page.locator('a[href="#main-content"]').count();
    expect(skipLinks).toBeLessThanOrEqual(1);
  });

  test('comprehensive accessibility report', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa', 'wcag21aaa', 'best-practice'])
      .analyze();

    console.log('Accessibility Scan Summary:');
    console.log(`Total violations: ${accessibilityScanResults.violations.length}`);
    console.log(`Total passes: ${accessibilityScanResults.passes.length}`);
    console.log(`Total incomplete: ${accessibilityScanResults.incomplete.length}`);

    if (accessibilityScanResults.violations.length > 0) {
      console.log('\nViolations:');
      accessibilityScanResults.violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations.length).toBe(0);
  });
});
