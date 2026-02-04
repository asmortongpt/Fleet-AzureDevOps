import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';

// Extend expect with jest-axe matchers for accessibility testing
expect.extend(toHaveNoViolations);

// ============================================================================
// Global Test Setup
// ============================================================================

// Cleanup after each test
afterEach(() => {
  cleanup();
  // Clear all mocks
  vi.clearAllMocks();
  // Clear localStorage
  localStorage.clear();
  // Clear sessionStorage
  sessionStorage.clear();
});

// Setup global mocks before all tests
beforeAll(() => {
  // Mock window.matchMedia (required for responsive components)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock IntersectionObserver (required for lazy loading)
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  } as any;

  // Mock ResizeObserver (required for responsive components)
  global.ResizeObserver = class ResizeObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    unobserve() {}
  } as any;

  // Mock scrollTo
  window.scrollTo = vi.fn();

  // NOTE: Do not globally mock fetch. Many tests (and app code paths) expect a real fetch
  // implementation. Individual tests should stub fetch explicitly as needed.

  // jsdom doesn't implement canvas; axe-core uses it for some rules (e.g., color-contrast).
  if (typeof HTMLCanvasElement !== 'undefined' && !('getContext' in HTMLCanvasElement.prototype)) {
    // no-op
  }
  if (typeof HTMLCanvasElement !== 'undefined') {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      value: vi.fn(() => ({
        // minimal 2d context surface for axe-core
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        getImageData: vi.fn(() => ({ data: [] })),
        putImageData: vi.fn(),
        createImageData: vi.fn(),
        setTransform: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        closePath: vi.fn(),
        stroke: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        transform: vi.fn(),
        rect: vi.fn(),
        clip: vi.fn(),
      })),
    });
  }

  // jsdom throws if getComputedStyle is called with a pseudo-element argument.
  // axe-core calls it with (elt, pseudoElt) for some rules; treat it as a no-op on the pseudo arg.
  if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).getComputedStyle = (elt: Element, _pseudoElt?: string) => originalGetComputedStyle(elt);
  }

  // Prevent jsdom from throwing "Not implemented: navigation" when tests click <a href="...">.
  // Default navigation is irrelevant to unit tests and can create noisy stderr and dangling timers.
  if (typeof HTMLAnchorElement !== 'undefined') {
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      this.dispatchEvent(event);
    });
  }

  // Suppress console errors in tests (optional - remove if you want to see errors)
  // console.error = vi.fn();
  // console.warn = vi.fn();
});

// ============================================================================
// Custom Matchers
// ============================================================================

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid date`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid date`,
        pass: false,
      };
    }
  },

  toBeValidCoordinates(received: any) {
    const pass =
      typeof received === 'object' &&
      typeof received.lat === 'number' &&
      typeof received.lng === 'number' &&
      received.lat >= -90 && received.lat <= 90 &&
      received.lng >= -180 && received.lng <= 180;

    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be valid coordinates`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be valid coordinates`,
        pass: false,
      };
    }
  },
});
