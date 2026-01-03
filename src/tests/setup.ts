import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi, beforeAll } from 'vitest';
import '@testing-library/jest-dom';

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

  // Mock fetch
  global.fetch = vi.fn();

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
