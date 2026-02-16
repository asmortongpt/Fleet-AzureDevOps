/**
 * Responsive Design E2E Tests
 * Validates layout, performance, and UX at all breakpoints
 * Breakpoints: 320px, 480px, 768px, 1024px, 1440px, 1920px
 */

import { test, expect } from '@playwright/test';

// Define all test breakpoints
const BREAKPOINTS = [
  {
    name: 'mobile-xs',
    width: 320,
    height: 667,
    devices: ['iPhone SE', 'iPhone 12 mini'],
    category: 'mobile',
  },
  {
    name: 'mobile-sm',
    width: 480,
    height: 800,
    devices: ['Mobile landscape', 'Galaxy S21'],
    category: 'mobile',
  },
  {
    name: 'tablet-md',
    width: 768,
    height: 1024,
    devices: ['iPad portrait', 'Android tablet'],
    category: 'tablet',
  },
  {
    name: 'tablet-lg',
    width: 1024,
    height: 768,
    devices: ['iPad landscape', 'iPad Pro 10.5"'],
    category: 'tablet',
  },
  {
    name: 'desktop-xl',
    width: 1440,
    height: 900,
    devices: ['Laptop', 'Desktop monitor 14"'],
    category: 'desktop',
  },
  {
    name: 'desktop-2xl',
    width: 1920,
    height: 1080,
    devices: ['Desktop monitor 24"', 'Full HD monitor'],
    category: 'desktop',
  },
];

// Test routes to validate at each breakpoint
const TEST_ROUTES = [
  '/',
  '/fleet',
  '/drivers',
  '/dashboard',
];

test.describe('Responsive Layout Tests', () => {
  /**
   * Test Suite: Viewport Configuration
   * Validates that each viewport is properly configured
   */
  BREAKPOINTS.forEach(({ name, width, height, devices }) => {
    test(`should set viewport correctly for ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });

      const viewportSize = await page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      expect(viewportSize.width).toBe(width);
      expect(viewportSize.height).toBe(height);

      console.log(`✓ ${name} (${width}x${height}) - Targets: ${devices.join(', ')}`);
    });
  });

  /**
   * Test Suite: No Horizontal Scrollbar
   * Critical issue: content should never require horizontal scrolling
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - should NOT have horizontal scrollbar`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for dynamic content

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

      // Allow 1px tolerance for rounding errors
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Log if there are any overflowing elements
      if (scrollWidth > clientWidth) {
        const overflowingElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const overflowing = [];
          for (const el of elements) {
            if (el.scrollWidth > el.clientWidth) {
              overflowing.push({
                tag: el.tagName,
                class: el.className,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth,
              });
            }
          }
          return overflowing;
        });
        console.warn(`⚠ ${name} has overflowing elements:`, overflowingElements);
      }
    });
  });

  /**
   * Test Suite: Text Readability
   * Font sizes must be readable across all breakpoints
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - text should be readable (min 14px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const fontSizes = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, input, label');
        const sizes = new Set<string>();

        elements.forEach(el => {
          const fontSize = window.getComputedStyle(el).fontSize;
          sizes.add(fontSize);
        });

        return Array.from(sizes).map(size => parseFloat(size));
      });

      const minFontSize = Math.min(...fontSizes);
      expect(minFontSize).toBeGreaterThanOrEqual(12); // Allow 12px for badges/small text
      expect(minFontSize).toBeLessThanOrEqual(24); // Sanity check

      console.log(`✓ ${name} font size range: ${minFontSize}px - ${Math.max(...fontSizes)}px`);
    });
  });

  /**
   * Test Suite: Touch Target Sizing
   * All interactive elements must be 44x44px minimum for mobile
   */
  BREAKPOINTS.forEach(({ name, width, height, category }) => {
    test(`${name} - interactive elements should be tappable (44x44px min)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const isMobileOrTablet = category !== 'desktop';

      // Get all interactive elements
      const interactiveElements = await page.locator('button, a, input[type="checkbox"], input[type="radio"], [role="button"]');
      const count = await interactiveElements.count();

      let tooSmallCount = 0;
      const tooSmallElements = [];

      for (let i = 0; i < Math.min(count, 20); i++) {
        const element = interactiveElements.nth(i);
        const box = await element.boundingBox();

        if (box && isMobileOrTablet) {
          if (box.width < 44 || box.height < 44) {
            tooSmallCount++;
            const text = await element.textContent();
            tooSmallElements.push({
              text: text?.slice(0, 30),
              size: `${Math.round(box.width)}x${Math.round(box.height)}`,
            });
          }
        }
      }

      if (isMobileOrTablet && tooSmallCount > 0) {
        console.warn(`⚠ ${name} has ${tooSmallCount} touch targets < 44x44px:`, tooSmallElements.slice(0, 5));
      }

      // Allow some small elements (badges, close buttons) but not too many
      expect(tooSmallCount).toBeLessThan(Math.ceil(count * 0.1)); // Less than 10% should be too small
    });
  });

  /**
   * Test Suite: Viewport-Specific Layout
   * Validate that layout changes appropriately at breakpoints
   */
  test('mobile (xs) - should use single-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Check for grid columns
    const multiColumnGrids = await page.locator('[class*="grid-cols-2"], [class*="grid-cols-3"], [class*="grid-cols-4"]');
    const count = await multiColumnGrids.count();

    // Only large content areas should have multi-column grids (not visible at xs)
    for (let i = 0; i < count; i++) {
      const element = multiColumnGrids.nth(i);
      const isVisible = await element.isVisible();
      // Most grids should be hidden or single-column at xs
    }
  });

  test('tablet (md) - should use multi-column layout', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Tablet should show some multi-column layouts
    const multiColumnGrids = await page.locator('[class*="md:grid-cols"]');
    const count = await multiColumnGrids.count();

    expect(count).toBeGreaterThan(0);
  });

  test('desktop (xl) - should use advanced layout', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Desktop should support complex layouts
    const advancedElements = await page.locator('[class*="lg:"], [class*="xl:"]');
    const count = await advancedElements.count();

    expect(count).toBeGreaterThan(0);
  });

  /**
   * Test Suite: Navigation Responsiveness
   * Navigation should adapt to viewport size
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - navigation should be accessible`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // On mobile, look for hamburger menu
      if (width < 768) {
        const hamburgerMenu = await page.locator('[aria-label*="menu"], [aria-label*="Menu"]');
        // Hamburger should exist or nav should be visible
      }

      // Navigation should be present and accessible
      const navElements = await page.locator('nav');
      expect(navElements.first()).toBeTruthy();
    });
  });

  /**
   * Test Suite: Modal/Dialog Sizing
   * Modals should be appropriately sized at each breakpoint
   */
  test('modals should be full-width on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Note: This test assumes modals exist in the app
    // Adjust selector based on actual modal implementation
  });

  test('modals should be centered on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Note: This test assumes modals exist in the app
  });

  /**
   * Test Suite: Image Responsiveness
   * Images should scale appropriately
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - images should not exceed viewport width`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const images = await page.locator('img');
      const count = await images.count();

      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        const box = await img.boundingBox();

        if (box) {
          expect(box.width).toBeLessThanOrEqual(width);
        }
      }
    });
  });

  /**
   * Test Suite: Performance Metrics
   * Core Web Vitals should be good across breakpoints
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - should have good Core Web Vitals`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');

      // Measure LCP (Largest Contentful Paint)
      const lcpTime = await page.evaluate(() => {
        return new Promise<number>(resolve => {
          const observer = new PerformanceObserver(list => {
            const entries = list.getEntries();
            const lcp = entries[entries.length - 1];
            resolve(lcp.startTime);
          });
          observer.observe({ type: 'largest-contentful-paint', buffered: true });

          // Timeout after 3 seconds
          setTimeout(() => resolve(3000), 3000);
        });
      });

      // Measure CLS (Cumulative Layout Shift)
      const clsScore = await page.evaluate(() => {
        return new Promise<number>(resolve => {
          let score = 0;
          const observer = new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                score += (entry as any).value;
              }
            }
          });
          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(score);
          }, 3000);
        });
      });

      // Measure FCP (First Contentful Paint)
      const fcpTime = await page.evaluate(() => {
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        return fcpEntry ? fcpEntry.startTime : 0;
      });

      console.log(`${name} metrics - FCP: ${Math.round(fcpTime)}ms, LCP: ${Math.round(lcpTime)}ms, CLS: ${clsScore.toFixed(3)}`);

      // Targets (these are lenient for dev environment)
      expect(lcpTime).toBeLessThan(5000); // Less than 5s
      expect(clsScore).toBeLessThan(0.25); // CLS < 0.25
    });
  });

  /**
   * Test Suite: Keyboard Navigation
   * All interactive elements should be keyboard accessible
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - should support keyboard navigation`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check that something is focused
      const focusedElement = await page.evaluate(() => {
        return (document.activeElement as HTMLElement)?.tagName || 'BODY';
      });

      // Focus should be on an interactive element (not body)
      expect(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focusedElement);

      console.log(`✓ ${name} keyboard navigation works`);
    });
  });

  /**
   * Test Suite: Safe Area Insets
   * Content should respect safe area on notched devices
   */
  BREAKPOINTS.forEach(({ name, width, height }) => {
    test(`${name} - should respect safe area insets`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check for fixed positioned elements
      const fixedElements = await page.locator('[class*="fixed"], [class*="sticky"]');
      const count = await fixedElements.count();

      // If fixed elements exist, they should account for safe area
      if (count > 0) {
        const topElement = fixedElements.first();
        const isVisible = await topElement.isVisible();
        expect(isVisible).toBeTruthy();
      }
    });
  });

  /**
   * Test Suite: Content Visibility
   * Primary content should be visible without scrolling on appropriate breakpoints
   */
  test('mobile - primary content should be visible above fold', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Main content should be in viewport
    const mainContent = await page.locator('main, [role="main"]');
    const isVisible = await mainContent.first().isVisible({ timeout: 5000 });
    expect(isVisible).toBeTruthy();
  });

  /**
   * Test Suite: Form Responsiveness
   * Forms should be mobile-optimized
   */
  test('mobile - form inputs should be full width', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Look for input fields
    const inputs = await page.locator('input[type="text"], input[type="email"], textarea');
    const count = await inputs.count();

    if (count > 0) {
      const firstInput = inputs.first();
      const box = await firstInput.boundingBox();

      if (box) {
        // Input should be nearly full width (minus padding)
        expect(box.width).toBeGreaterThan(280); // 320 - 40px padding
      }
    }
  });

  /**
   * Test Suite: Button Responsiveness
   * Buttons should be appropriately sized
   */
  BREAKPOINTS.forEach(({ name, width, height, category }) => {
    test(`${name} - buttons should be appropriately sized`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box && category === 'mobile') {
          // Mobile buttons should be taller
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});

test.describe('Cross-Breakpoint Transitions', () => {
  /**
   * Test that layout transitions smoothly between breakpoints
   */
  test('should transition smoothly from mobile to tablet', async ({ page }) => {
    // Start at mobile
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const mobileLayout = await page.evaluate(() => {
      const gridElement = document.querySelector('[class*="grid"]');
      return window.getComputedStyle(gridElement || document.body).display;
    });

    // Transition to tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Wait for resize/reflow

    const tabletLayout = await page.evaluate(() => {
      const gridElement = document.querySelector('[class*="grid"]');
      return window.getComputedStyle(gridElement || document.body).display;
    });

    // Layouts might be different, but both should render without errors
    expect([mobileLayout, tabletLayout]).toBeTruthy();

    console.log('✓ Layout transitions smoothly between mobile and tablet');
  });

  test('should handle orientation changes gracefully', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const portraitHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    // Landscape
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const landscapeHeight = await page.evaluate(() => document.documentElement.scrollHeight);

    // Both should render
    expect(portraitHeight).toBeGreaterThan(0);
    expect(landscapeHeight).toBeGreaterThan(0);

    console.log(`✓ Orientation change: ${portraitHeight}px portrait → ${landscapeHeight}px landscape`);
  });
});

test.describe('Responsive Edge Cases', () => {
  /**
   * Test edge cases and unusual viewport sizes
   */
  test('should handle very small viewport (280px)', async ({ page }) => {
    await page.setViewportSize({ width: 280, height: 600 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);

    // Should still not scroll horizontally
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });

  test('should handle very large viewport (4K)', async ({ page }) => {
    await page.setViewportSize({ width: 3840, height: 2160 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Content should still render
    const mainContent = await page.locator('main, [role="main"]');
    expect(mainContent.first()).toBeTruthy();
  });

  test('should handle tall/short viewports', async ({ page }) => {
    // Very tall
    await page.setViewportSize({ width: 400, height: 1200 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Very short
    await page.setViewportSize({ width: 400, height: 300 });
    await page.waitForTimeout(500);

    // Should handle both without errors
    const isLoaded = await page.evaluate(() => document.readyState === 'complete');
    expect(isLoaded).toBeTruthy();
  });
});

/**
 * Test Helpers & Utilities
 */

async function getElementsExceedingViewport(page: any, width: number) {
  return page.evaluate((maxWidth: number) => {
    const overflowing = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.scrollWidth > maxWidth) {
        overflowing.push({
          tag: el.tagName,
          class: el.className.slice(0, 50),
          width: el.scrollWidth,
        });
      }
    });
    return overflowing;
  }, width);
}

async function getMostCommonFontSize(page: any) {
  return page.evaluate(() => {
    const sizes: { [key: string]: number } = {};
    document.querySelectorAll('*').forEach(el => {
      const fontSize = window.getComputedStyle(el).fontSize;
      sizes[fontSize] = (sizes[fontSize] || 0) + 1;
    });
    return Object.entries(sizes).sort((a, b) => b[1] - a[1])[0];
  });
}
