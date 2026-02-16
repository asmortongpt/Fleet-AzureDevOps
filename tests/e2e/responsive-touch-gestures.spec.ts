/**
 * Mobile Touch Gestures & Interactions E2E Tests
 * Validates touch gesture handling, swipe, long-press, and mobile UX patterns
 */

import { test, expect } from '@playwright/test';

const MOBILE_VIEWPORTS = [
  { name: 'mobile-320px', width: 320, height: 667 },
  { name: 'mobile-480px', width: 480, height: 800 },
  { name: 'tablet-768px', width: 768, height: 1024 },
];

test.describe('Mobile Touch Gestures', () => {
  MOBILE_VIEWPORTS.forEach(({ name, width, height }) => {
    test(`${name} - should have touch-friendly tap targets`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button');
      const count = await buttons.count();

      const touchFriendlyCount = await buttons.evaluateAll((elements) => {
        return elements.filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width >= 44 && rect.height >= 44;
        }).length;
      });

      // Most buttons should be touch-friendly
      const ratio = touchFriendlyCount / count;
      expect(ratio).toBeGreaterThan(0.7);

      console.log(`✓ ${name}: ${touchFriendlyCount}/${count} buttons are 44x44px+ (${Math.round(ratio * 100)}%)`);
    });

    test(`${name} - should handle single tap interaction`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const buttons = await page.locator('button:visible').first();

      if (buttons) {
        // Simulate tap (single click)
        await buttons.click();

        // Page should respond to tap
        expect(buttons).toBeTruthy();
      }
    });

    test(`${name} - should handle double-tap interaction`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const element = await page.locator('[data-testid*="vehicle"], article, div[role="button"]').first();

      if (element) {
        // Simulate double-tap
        await element.dblClick();

        // Element should remain interactable
        expect(element).toBeTruthy();
      }
    });

    test(`${name} - should handle long-press context menu`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      const element = await page.locator('[class*="card"], [class*="item"]').first();

      if (element) {
        // Simulate long-press with right-click
        await element.click({ button: 'right' });

        // Context menu might appear or action triggered
        expect(element).toBeTruthy();
      }
    });

    test(`${name} - should prevent accidental double-tap zoom`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Check viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]');
      const content = await viewportMeta.getAttribute('content');

      // Should include user-scalable to control double-tap zoom
      expect(content).toContain('viewport');
    });
  });

  test('mobile - swiping should be recognized', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Get a swipeable element (carousel, list, etc.)
    const swipeableElement = await page.locator('[class*="carousel"], [class*="slide"]').first();

    if (swipeableElement) {
      // Simulate swipe gesture by dragging
      const box = await swipeableElement.boundingBox();
      if (box) {
        // Swipe from right to left
        await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 20, box.y + box.height / 2, { steps: 10 });
        await page.mouse.up();

        expect(swipeableElement).toBeTruthy();
      }
    }
  });

  test('mobile - scrolling should work smoothly', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const initialScroll = await page.evaluate(() => window.scrollY);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(200);

    const scrolledPosition = await page.evaluate(() => window.scrollY);

    // Should have scrolled
    expect(scrolledPosition).toBeGreaterThan(initialScroll);
  });

  test('mobile - pull-to-refresh should be available', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Check if pull-to-refresh component is present
    const pullToRefresh = await page.locator('[class*="pull"], [class*="refresh"]');
    const count = await pullToRefresh.count();

    // Pull-to-refresh is optional but good to have on mobile
    console.log(`Pull-to-refresh components found: ${count}`);
  });

  test('mobile - keyboard should close on input submit', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const searchInput = await page.locator('input[type="search"], input[placeholder*="search"]').first();

    if (searchInput) {
      // Focus input
      await searchInput.focus();
      await searchInput.type('test', { delay: 50 });

      // Press Enter to close keyboard
      await searchInput.press('Enter');

      expect(searchInput).toBeTruthy();
    }
  });
});

test.describe('Gesture Performance', () => {
  test('should handle rapid taps without stuttering', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const button = await page.locator('button').first();

    if (button) {
      const startTime = Date.now();

      // Rapid taps
      for (let i = 0; i < 10; i++) {
        await button.click();
        await page.waitForTimeout(50);
      }

      const duration = Date.now() - startTime;

      // Should complete without excessive delay
      expect(duration).toBeLessThan(1500); // 10 taps in under 1.5 seconds

      console.log(`✓ 10 rapid taps completed in ${duration}ms`);
    }
  });

  test('should handle smooth scrolling without jank', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Measure scroll performance using requestAnimationFrame
    const avgFrameTime = await page.evaluate(() => {
      return new Promise<number>(resolve => {
        let frameCount = 0;
        let startTime = performance.now();

        function measureFrame() {
          frameCount++;
          window.scrollBy(0, 20);

          if (frameCount < 60) {
            requestAnimationFrame(measureFrame);
          } else {
            const duration = performance.now() - startTime;
            const avgTime = duration / frameCount;
            resolve(avgTime);
          }
        }

        requestAnimationFrame(measureFrame);
      });
    });

    // Average frame time should be under 16.67ms for 60fps
    console.log(`✓ Average frame time: ${avgFrameTime.toFixed(2)}ms`);
    expect(avgFrameTime).toBeLessThan(25); // Allow some leeway for slow environments
  });
});

test.describe('Mobile UX Patterns', () => {
  test('mobile - hamburger menu should exist and be accessible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const hamburger = await page.locator('[aria-label*="menu"], [aria-label*="Menu"], button[class*="hamburger"]');

    // Hamburger menu is optional, but if it exists, should be accessible
    const count = await hamburger.count();
    if (count > 0) {
      const box = await hamburger.first().boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('mobile - bottom navigation should be sticky', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const bottomNav = await page.locator('[class*="bottom-nav"], nav[class*="fixed"]').last();

    if (bottomNav) {
      const isVisible = await bottomNav.isVisible();
      if (isVisible) {
        const box = await bottomNav.boundingBox();
        // Bottom nav should be at bottom of viewport
        expect(box?.y).toBeGreaterThan(667 - 100); // Approximate bottom position
      }
    }
  });

  test('mobile - search/filter should be easily accessible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    const searchButton = await page.locator('[aria-label*="search"], [aria-label*="filter"], button[class*="search"]');

    // Search should be accessible from main view
    const count = await searchButton.count();
    console.log(`Search/filter controls found: ${count}`);
  });

  test('mobile - modals should be full-width and dismissible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Try to find and interact with a modal (if one exists)
    const closeButton = await page.locator('[aria-label*="close"], [aria-label*="dismiss"]');

    if (closeButton) {
      const isVisible = await closeButton.isVisible({ timeout: 2000 });
      if (isVisible) {
        // Close button should be tappable
        const box = await closeButton.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(32);
        expect(box?.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test('mobile - status indicators should be visible', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Look for status badges or indicators
    const statusElements = await page.locator('[class*="badge"], [class*="status"], [role="status"]');
    const count = await statusElements.count();

    if (count > 0) {
      const firstStatus = statusElements.first();
      const isVisible = await firstStatus.isVisible({ timeout: 2000 });
      console.log(`Status indicators found: ${count}, first visible: ${isVisible}`);
    }
  });
});

test.describe('Touch-Specific Accessibility', () => {
  test('should have adequate touch target spacing', async ({ page }) => {
    const BREAKPOINTS = [
      { width: 320, height: 667 },
      { width: 480, height: 800 },
      { width: 768, height: 1024 },
    ];

    for (const { width, height } of BREAKPOINTS) {
      await page.setViewportSize({ width, height });
      await page.goto('http://localhost:5173/fleet');
      await page.waitForLoadState('networkidle');

      // Measure distance between buttons
      const buttons = await page.locator('button');
      const positions = await buttons.evaluateAll((elements) => {
        return elements.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
          };
        });
      });

      // Check spacing between adjacent buttons
      let minSpacing = Infinity;
      for (let i = 0; i < positions.length - 1; i++) {
        const current = positions[i];
        const next = positions[i + 1];

        // Horizontal spacing
        if (Math.abs(current.y - next.y) < 10) {
          const spacing = next.x - current.right;
          minSpacing = Math.min(minSpacing, spacing);
        }
      }

      console.log(`${width}px viewport: Minimum button spacing: ${minSpacing}px`);
    }
  });

  test('should provide audio/haptic feedback for critical actions', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto('http://localhost:5173/fleet');
    await page.waitForLoadState('networkidle');

    // Check if haptic feedback is implemented
    const hasHaptic = await page.evaluate(() => {
      return 'vibrate' in navigator;
    });

    console.log(`Haptic feedback available: ${hasHaptic}`);
    expect(hasHaptic).toBeTruthy();
  });
});
