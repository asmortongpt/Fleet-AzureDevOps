/**
 * Visual Testing Utilities for Percy Integration
 *
 * Provides common utilities for visual regression testing including:
 * - Breakpoint definitions (mobile, tablet, desktop)
 * - Percy snapshot helpers
 * - Component rendering utilities
 * - Animation/transition disabling for consistent snapshots
 */

import { Page, expect } from '@playwright/test';

/**
 * Breakpoint definitions for responsive testing
 */
export const BREAKPOINTS = {
  mobile: {
    name: 'Mobile (375px)',
    width: 375,
    height: 812,
  },
  tablet: {
    name: 'Tablet (768px)',
    width: 768,
    height: 1024,
  },
  desktop: {
    name: 'Desktop (1920px)',
    width: 1920,
    height: 1080,
  },
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Disables animations and transitions for consistent visual snapshots
 */
export async function disableAnimations(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Disable all CSS animations and transitions
    const style = document.createElement('style');
    style.textContent = `
      * {
        animation: none !important;
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition: none !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);

    // Prevent requestAnimationFrame from running
    let rafId = 0;
    const rafFunctions: FrameRequestCallback[] = [];

    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      rafFunctions.push(callback);
      callback(performance.now());
      return ++rafId;
    };

    window.cancelAnimationFrame = () => {};
  });
}

/**
 * Waits for all animations to complete (if not disabled)
 */
export async function waitForAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      let animationFrames = 0;
      const maxFrames = 60;

      const checkComplete = () => {
        animationFrames++;
        if (animationFrames >= maxFrames) {
          resolve();
        } else {
          requestAnimationFrame(checkComplete);
        }
      };

      requestAnimationFrame(checkComplete);
    });
  });
}

/**
 * Waits for all network requests to complete
 */
export async function waitForNetworkIdle(
  page: Page,
  timeout: number = 5000
): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout });
  } catch {
    // Network idle timeout is not critical for visual tests
  }
}

/**
 * Waits for all images to load
 */
export async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
    return Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) {
              resolve();
            } else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );
  });
}

/**
 * Percy snapshot configuration
 */
export interface PerrySnapshotOptions {
  name: string;
  breakpoints?: Breakpoint[];
  waitForSelector?: string;
  additionalPadding?: number;
  minHeight?: number;
  enableJavaScript?: boolean;
}

/**
 * Takes a Percy snapshot with consistent settings
 */
export async function takePerrySnapshot(
  page: Page,
  options: PerrySnapshotOptions
): Promise<void> {
  const {
    name,
    breakpoints = ['mobile', 'tablet', 'desktop'],
    waitForSelector,
    additionalPadding = 0,
    minHeight = 600,
    enableJavaScript = true,
  } = options;

  // Wait for specific element if provided
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {
      // Element not found, continue anyway
    });
  }

  // Wait for network and animations
  await waitForNetworkIdle(page);
  await disableAnimations(page);
  await waitForAnimations(page);

  // Ensure minimum viewport height
  const currentSize = page.viewportSize();
  if (currentSize && currentSize.height < minHeight) {
    await page.setViewportSize({ width: currentSize.width, height: minHeight });
  }

  // Take snapshots at each breakpoint
  for (const breakpoint of breakpoints) {
    const bp = BREAKPOINTS[breakpoint];
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(500); // Wait for layout shift

    // Use Percy's snapshot API if available
    if ((page.context() as any).percy?.snapshot) {
      await (page.context() as any).percy.snapshot(
        `${name} - ${bp.name}`,
        {
          widths: [bp.width],
          minHeight: bp.height,
          clientInfo: `@percy/playwright`,
        }
      );
    } else {
      // Fallback: Use Playwright's built-in screenshot
      await page.screenshot({
        path: `test-results/visual/${name.toLowerCase().replace(/\s+/g, '-')}-${breakpoint}.png`,
        fullPage: true,
      });
    }
  }

  // Reset viewport to default
  await page.setViewportSize(BREAKPOINTS.desktop);
}

/**
 * Loads a component in isolation for testing
 */
export async function loadComponent(
  page: Page,
  componentPath: string
): Promise<void> {
  const baseUrl = process.env.VITE_API_URL || 'http://localhost:5173';
  await page.goto(`${baseUrl}/__storybook?path=${componentPath}`, {
    waitUntil: 'networkidle',
  });
}

/**
 * Tests a component across breakpoints
 */
export async function testComponentAcrossBreakpoints(
  page: Page,
  componentName: string,
  breakpoints: Breakpoint[] = ['mobile', 'tablet', 'desktop']
): Promise<void> {
  for (const breakpoint of breakpoints) {
    const bp = BREAKPOINTS[breakpoint];
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.waitForTimeout(300);

    await takePerrySnapshot(page, {
      name: `${componentName} - ${bp.name}`,
      breakpoints: [breakpoint],
    });
  }
}

/**
 * Hides specific selectors before snapshot (useful for timestamps, random data, etc.)
 */
export async function hideSelectors(
  page: Page,
  selectors: string[]
): Promise<void> {
  for (const selector of selectors) {
    await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      elements.forEach((el) => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    }, selector);
  }
}

/**
 * Shows previously hidden selectors
 */
export async function showSelectors(
  page: Page,
  selectors: string[]
): Promise<void> {
  for (const selector of selectors) {
    await page.evaluate((sel) => {
      const elements = document.querySelectorAll(sel);
      elements.forEach((el) => {
        (el as HTMLElement).style.visibility = 'visible';
      });
    }, selector);
  }
}

/**
 * Scrolls to and highlights an element
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);

  await page.waitForTimeout(500); // Wait for scroll animation
}

/**
 * Fills form fields with test data
 */
export async function fillFormFields(
  page: Page,
  fields: Record<string, string>
): Promise<void> {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
}

/**
 * Gets the visual state of a component
 */
export async function getComponentState(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel) as HTMLElement;
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);

    return {
      isVisible: rect.width > 0 && rect.height > 0,
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      display: styles.display,
      opacity: styles.opacity,
    };
  }, selector);
}

/**
 * Compares two colors for visual consistency
 */
export function areColorsEqual(color1: string, color2: string): boolean {
  // Normalize colors to RGB format and compare
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  ctx.fillStyle = color1;
  const rgb1 = ctx.fillStyle;

  ctx.fillStyle = color2;
  const rgb2 = ctx.fillStyle;

  return rgb1 === rgb2;
}

/**
 * Retry taking snapshot if it fails
 */
export async function takeSnapshotWithRetry(
  page: Page,
  options: PerrySnapshotOptions,
  maxRetries: number = 3
): Promise<void> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await takePerrySnapshot(page, options);
      return;
    } catch (error) {
      lastError = error as Error;
      await page.waitForTimeout(500 * (i + 1)); // Exponential backoff
    }
  }

  throw lastError || new Error('Failed to take snapshot after retries');
}
