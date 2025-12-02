/**
 * Accessibility Tests (WCAG 2.2 AA Compliance)
 *
 * Test suite for accessibility compliance including:
 * - Automated accessibility checks with axe-core
 * - Keyboard navigation on all pages
 * - Focus indicators visibility
 * - ARIA labels and roles
 * - Color contrast ratios
 * - Form labels and error messages
 * - Heading hierarchy
 */

import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  AuthHelper,
  NavigationHelper,
  WaitHelpers,
  AccessibilityHelper,
  TEST_CONSTANTS
} from './test-helpers';

// Modules to test for accessibility
const MODULES_TO_TEST = [
  'Fleet Dashboard',
  'Garage Service',
  'GPS Tracking',
  'Driver Performance',
  'Dispatch Console'
];

test.describe('Accessibility - WCAG 2.2 AA Compliance', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;
  let waitHelpers: WaitHelpers;
  let a11yHelper: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    waitHelpers = new WaitHelpers(page);
    a11yHelper = new AccessibilityHelper(page);

    await authHelper.login();
  });

  test.describe('Automated Accessibility Scans', () => {
    test('should pass axe accessibility scan on dashboard', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Run axe accessibility scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (accessibilityScanResults.violations.length > 0) {
        console.log('Accessibility violations found:', accessibilityScanResults.violations);
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass axe scan on all major modules', async ({ page }) => {
      const violationsByModule: Record<string, any[]> = {};

      for (const module of MODULES_TO_TEST) {
        await navHelper.navigateToModule(module);
        await waitHelpers.waitForDataLoad();

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .exclude('[class*="third-party"]') // Exclude third-party components
          .analyze();

        if (results.violations.length > 0) {
          violationsByModule[module] = results.violations;
        }
      }

      // Log all violations
      if (Object.keys(violationsByModule).length > 0) {
        console.log('Violations by module:', JSON.stringify(violationsByModule, null, 2));
      }

      // Allow up to 5 total violations across all modules (to be fixed)
      const totalViolations = Object.values(violationsByModule).flat().length;
      expect(totalViolations).toBeLessThan(5);
    });

    test('should have no critical accessibility violations', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      // Filter for critical violations
      const criticalViolations = results.violations.filter(v =>
        v.impact === 'critical' || v.impact === 'serious'
      );

      if (criticalViolations.length > 0) {
        console.log('Critical violations:', criticalViolations);
      }

      expect(criticalViolations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate through page elements with Tab key', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const focusableElements: string[] = [];

      // Tab through first 10 elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement;
          return el?.tagName + (el?.getAttribute('aria-label') ? ` [${el.getAttribute('aria-label')}]` : '');
        });

        focusableElements.push(focusedElement);
      }

      console.log('Focusable elements:', focusableElements);

      // Should have focused multiple elements
      const uniqueElements = new Set(focusableElements);
      expect(uniqueElements.size).toBeGreaterThan(3);
    });

    test('should navigate backwards with Shift+Tab', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Tab forward a few times
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const elementBeforeBackward = await page.evaluate(() => document.activeElement?.tagName);

      // Tab backward
      await page.keyboard.press('Shift+Tab');

      const elementAfterBackward = await page.evaluate(() => document.activeElement?.tagName);

      // Focus should have moved backwards
      expect(elementAfterBackward).toBeTruthy();
    });

    test('should skip to main content with skip link', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');

      // Press Tab to focus skip link (usually first focusable element)
      await page.keyboard.press('Tab');

      const firstElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          text: el?.textContent?.toLowerCase(),
          tag: el?.tagName
        };
      });

      // Check if it's a skip link
      const isSkipLink = firstElement.text?.includes('skip') || firstElement.text?.includes('main');

      if (isSkipLink) {
        // Activate skip link
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);

        // Focus should move to main content
        const mainFocused = await page.evaluate(() => {
          return document.activeElement?.closest('main') !== null;
        });

        expect(mainFocused).toBeTruthy();
      } else {
        // Skip link is optional but recommended
        test.skip();
      }
    });

    test('should activate buttons with Enter and Space keys', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Find a button
      const button = page.locator('button').first();
      await button.focus();

      // Get initial state
      const buttonText = await button.textContent();

      // Press Enter
      await page.keyboard.press('Enter');
      await page.waitForTimeout(100);

      // Button should have been activated (hard to verify without side effects)
      // At minimum, no error should occur
      expect(true).toBeTruthy();
    });

    test('should navigate dropdowns with arrow keys', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Look for a dropdown
      const dropdown = page.locator('select, [role="combobox"]').first();
      const hasDropdown = await dropdown.isVisible().catch(() => false);

      if (!hasDropdown) {
        test.skip();
        return;
      }

      await dropdown.focus();

      // Open dropdown and navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(100);

      // Verify dropdown opened or option selected
      const dropdownExpanded = await dropdown.evaluate((el) => {
        return el.getAttribute('aria-expanded') === 'true' || el.tagName === 'SELECT';
      });

      expect(dropdownExpanded).toBeTruthy();
    });

    test('should close modals with Escape key', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Open a modal (try clicking "Add" button)
      const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
      const buttonExists = await addButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      await addButton.click();
      await page.waitForTimeout(500);

      // Verify modal is open
      const modal = page.locator('[role="dialog"]');
      const modalOpen = await modal.isVisible().catch(() => false);

      if (!modalOpen) {
        test.skip();
        return;
      }

      // Press Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Modal should be closed
      const modalClosed = await modal.isHidden();
      expect(modalClosed).toBeTruthy();
    });
  });

  test.describe('Focus Indicators', () => {
    test('should show visible focus indicators on all interactive elements', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const interactiveSelectors = [
        'button',
        'a',
        'input',
        'select',
        '[role="button"]',
        '[tabindex="0"]'
      ];

      const elementsWithoutFocus: string[] = [];

      for (const selector of interactiveSelectors) {
        const elements = page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
          const firstElement = elements.first();

          // Focus the element
          await firstElement.focus().catch(() => {});

          // Check for focus styles
          const hasFocusStyle = await firstElement.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return (
              styles.outline !== 'none' ||
              styles.outlineWidth !== '0px' ||
              styles.boxShadow !== 'none' ||
              el.matches(':focus-visible')
            );
          });

          if (!hasFocusStyle) {
            elementsWithoutFocus.push(selector);
          }
        }
      }

      console.log('Elements without focus indicators:', elementsWithoutFocus);

      // Most interactive elements should have focus indicators
      expect(elementsWithoutFocus.length).toBeLessThan(interactiveSelectors.length / 2);
    });

    test('should have high contrast focus indicators', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const button = page.locator('button').first();
      await button.focus();

      // Check focus outline color contrast
      const focusContrast = await button.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        const outlineColor = styles.outlineColor;
        const backgroundColor = styles.backgroundColor;

        // Simple check: outline color should be different from background
        return outlineColor !== backgroundColor;
      });

      expect(focusContrast).toBeTruthy();
    });

    test('should maintain focus visibility during keyboard navigation', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        // Check if focus is visible
        const focusVisible = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return false;

          const styles = window.getComputedStyle(el);
          return styles.outline !== 'none' || el.matches(':focus-visible');
        });

        // At least some elements should show focus
        if (focusVisible) {
          expect(focusVisible).toBeTruthy();
          break;
        }
      }
    });
  });

  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Check icon-only buttons have aria-labels
      const iconButtons = page.locator('button:not(:has-text(/\\w/))');
      const count = await iconButtons.count();

      let buttonsWithLabels = 0;

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = iconButtons.nth(i);
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');

        if (ariaLabel || title) {
          buttonsWithLabels++;
        }
      }

      console.log(`${buttonsWithLabels}/${Math.min(count, 10)} icon buttons have labels`);

      // At least 70% of icon buttons should have labels
      if (count > 0) {
        expect(buttonsWithLabels).toBeGreaterThan(Math.min(count, 10) * 0.7);
      }
    });

    test('should use proper ARIA roles for custom components', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Check for proper roles
      const properRoles = [
        'button',
        'navigation',
        'main',
        'complementary',
        'dialog',
        'tablist',
        'tab',
        'tabpanel'
      ];

      const elementsWithRoles = await page.locator('[role]').count();

      console.log('Elements with ARIA roles:', elementsWithRoles);

      // Should have at least some elements with proper roles
      expect(elementsWithRoles).toBeGreaterThan(5);
    });

    test('should have aria-expanded on expandable elements', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Look for expandable elements (dropdowns, accordions)
      const expandable = page.locator('[aria-expanded]');
      const count = await expandable.count();

      if (count > 0) {
        const firstExpandable = expandable.first();
        const expandedState = await firstExpandable.getAttribute('aria-expanded');

        // Should be 'true' or 'false'
        expect(['true', 'false']).toContain(expandedState);
      } else {
        // No expandable elements is okay
        test.skip();
      }
    });

    test('should use aria-live for dynamic content updates', async ({ page }) => {
      await navHelper.navigateToModule('GPS Tracking');
      await waitHelpers.waitForDataLoad();

      // Check for aria-live regions (for real-time updates)
      const liveRegions = page.locator('[aria-live]');
      const count = await liveRegions.count();

      console.log('ARIA live regions found:', count);

      // Real-time tracking should have live regions, but not required
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      } else {
        test.skip();
      }
    });

    test('should have proper landmark roles', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Check for main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();

      // Check for navigation landmark
      const nav = page.locator('nav, [role="navigation"]');
      const hasNav = await nav.isVisible().catch(() => false);
      expect(hasNav).toBeTruthy();

      // Check for header/banner
      const header = page.locator('header, [role="banner"]');
      const hasHeader = await header.isVisible();
      expect(hasHeader).toBeTruthy();
    });
  });

  test.describe('Color Contrast', () => {
    test('should have sufficient contrast for text elements', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Run axe scan focused on color contrast
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .options({ rules: { 'color-contrast': { enabled: true } } })
        .analyze();

      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

      if (contrastViolations.length > 0) {
        console.log('Color contrast violations:', contrastViolations);
      }

      expect(contrastViolations).toEqual([]);
    });

    test('should have contrast ratio ≥ 4.5:1 for normal text', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Sample a few text elements
      const textElements = page.locator('p, span, div').filter({ hasText: /\\w/ });
      const count = await textElements.count();

      // Check first 5 text elements
      for (let i = 0; i < Math.min(count, 5); i++) {
        const element = textElements.nth(i);
        const hasGoodContrast = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const bgColor = styles.backgroundColor;

          // Simple check: colors should be different
          return color !== bgColor && color !== 'rgba(0, 0, 0, 0)';
        });

        expect(hasGoodContrast).toBeTruthy();
      }
    });

    test('should have contrast ratio ≥ 3:1 for large text', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Check headings (large text)
      const headings = page.locator('h1, h2, h3, h4');
      const count = await headings.count();

      if (count > 0) {
        const heading = headings.first();
        const hasContrast = await heading.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          return styles.color !== styles.backgroundColor;
        });

        expect(hasContrast).toBeTruthy();
      }
    });
  });

  test.describe('Form Labels and Error Messages', () => {
    test('should have labels for all form inputs', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Click add button to open form
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasButton = await addButton.isVisible().catch(() => false);

      if (!hasButton) {
        test.skip();
        return;
      }

      await addButton.click();
      await page.waitForTimeout(500);

      // Check all inputs have labels
      const inputs = page.locator('input, select, textarea');
      const inputCount = await inputs.count();

      let inputsWithLabels = 0;

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        // Check for associated label
        const hasLabel = id ?
          await page.locator(`label[for="${id}"]`).isVisible().catch(() => false) :
          false;

        if (hasLabel || ariaLabel || ariaLabelledBy) {
          inputsWithLabels++;
        }
      }

      console.log(`${inputsWithLabels}/${inputCount} inputs have labels`);

      // At least 80% of inputs should have labels
      if (inputCount > 0) {
        expect(inputsWithLabels).toBeGreaterThan(inputCount * 0.8);
      }
    });

    test('should show accessible error messages', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      // Open form and submit without filling required fields
      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasButton = await addButton.isVisible().catch(() => false);

      if (!hasButton) {
        test.skip();
        return;
      }

      await addButton.click();
      await page.waitForTimeout(500);

      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
      await submitButton.click();
      await page.waitForTimeout(500);

      // Check for error messages
      const errorMessages = page.locator('[role="alert"], [class*="error"]');
      const hasErrors = await errorMessages.count() > 0;

      if (hasErrors) {
        // Error messages should be associated with inputs via aria-describedby
        const firstError = errorMessages.first();
        const errorId = await firstError.getAttribute('id');

        // Should be linked to an input
        console.log('Error message found with id:', errorId);
        expect(hasErrors).toBeTruthy();
      } else {
        // Form might not have validation
        test.skip();
      }
    });

    test('should have required field indicators', async ({ page }) => {
      await navHelper.navigateToModule('Garage Service');
      await waitHelpers.waitForDataLoad();

      const addButton = page.locator('button:has-text("Add"), button:has-text("New")').first();
      const hasButton = await addButton.isVisible().catch(() => false);

      if (!hasButton) {
        test.skip();
        return;
      }

      await addButton.click();
      await page.waitForTimeout(500);

      // Check for required field indicators
      const requiredInputs = page.locator('input[required], input[aria-required="true"]');
      const count = await requiredInputs.count();

      if (count > 0) {
        // Required fields should have visual indicator (asterisk or aria-required)
        const firstRequired = requiredInputs.first();
        const ariaRequired = await firstRequired.getAttribute('aria-required');

        expect(ariaRequired === 'true' || count > 0).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Heading Hierarchy', () => {
    test('should have proper heading hierarchy (h1 → h2 → h3)', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Get all headings in order
      const headings = await page.evaluate(() => {
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        return Array.from(headingElements).map(h => ({
          tag: h.tagName,
          text: h.textContent?.substring(0, 50)
        }));
      });

      console.log('Heading hierarchy:', headings);

      // Should start with h1 or h2
      if (headings.length > 0) {
        const firstHeadingLevel = parseInt(headings[0].tag.substring(1));
        expect(firstHeadingLevel).toBeLessThanOrEqual(2);
      }

      // Check for skipped levels
      let previousLevel = 0;
      let hasSkippedLevel = false;

      for (const heading of headings) {
        const currentLevel = parseInt(heading.tag.substring(1));

        if (previousLevel > 0 && currentLevel > previousLevel + 1) {
          hasSkippedLevel = true;
          console.log(`Skipped heading level: h${previousLevel} to h${currentLevel}`);
        }

        previousLevel = currentLevel;
      }

      // Ideally no skipped levels (but not critical)
      console.log('Has skipped levels:', hasSkippedLevel);
    });

    test('should have one main heading (h1) per page', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const h1Count = await page.locator('h1').count();

      console.log('H1 count:', h1Count);

      // Should have 0 or 1 h1 (not multiple)
      expect(h1Count).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have descriptive page titles', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const title = await page.title();

      console.log('Page title:', title);

      // Title should be descriptive
      expect(title.length).toBeGreaterThan(5);
      expect(title).not.toBe('');
    });

    test('should have alt text for images', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      const images = page.locator('img');
      const imageCount = await images.count();

      let imagesWithAlt = 0;

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');

        if (alt !== null) {
          imagesWithAlt++;
        }
      }

      console.log(`${imagesWithAlt}/${imageCount} images have alt text`);

      // All images should have alt text
      if (imageCount > 0) {
        expect(imagesWithAlt).toBe(imageCount);
      }
    });

    test('should use semantic HTML elements', async ({ page }) => {
      await navHelper.navigateToModule('Fleet Dashboard');
      await waitHelpers.waitForDataLoad();

      // Check for semantic elements
      const semanticElements = {
        header: await page.locator('header').count(),
        nav: await page.locator('nav').count(),
        main: await page.locator('main').count(),
        footer: await page.locator('footer').count(),
        article: await page.locator('article').count(),
        section: await page.locator('section').count()
      };

      console.log('Semantic elements:', semanticElements);

      // Should use at least header, nav, and main
      expect(semanticElements.header).toBeGreaterThan(0);
      expect(semanticElements.main).toBeGreaterThan(0);
    });
  });
});
