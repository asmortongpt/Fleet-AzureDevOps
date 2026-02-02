/**
 * Test Helpers and Providers
 *
 * Comprehensive helpers for testing Fleet Management System components
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// ============================================================================
// Provider Wrappers
// ============================================================================

/**
 * Create a fresh QueryClient for each test
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: Infinity, // Keep cache forever in tests
        staleTime: Infinity, // Never mark as stale in tests
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component with all providers
 */
interface AllProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function AllProviders({ children, queryClient }: AllProvidersProps) {
  const client = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient,
    ...renderOptions
  }: RenderOptions & { queryClient?: QueryClient } = {}
) {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <AllProviders queryClient={queryClient}>{children}</AllProviders>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: queryClient || createTestQueryClient(),
  };
}

/**
 * Render hook with QueryClient provider
 */
export function createWrapper(queryClient?: QueryClient) {
  const client = queryClient || createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Create mock vehicle data
 */
export function createMockVehicle(overrides = {}) {
  return {
    id: 'vehicle-1',
    tenantId: 'tenant-1',
    number: 'V-001',
    type: 'sedan',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    vin: '1HGBH41JXMN109186',
    licensePlate: 'ABC-1234',
    status: 'active',
    location: {
      lat: 30.4383,
      lng: -84.2807,
      address: '123 Main St, Tallahassee, FL 32301',
    },
    region: 'North Florida',
    department: 'Operations',
    fuelLevel: 75,
    fuelType: 'gasoline',
    mileage: 15000,
    assignedDriver: 'John Doe',
    ownership: 'owned',
    lastService: '2024-01-15',
    nextService: '2024-07-15',
    alerts: [],
    ...overrides,
  };
}

/**
 * Create mock driver data
 */
export function createMockDriver(overrides = {}) {
  return {
    id: 'driver-1',
    tenantId: 'tenant-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '850-555-0100',
    licenseNumber: 'D1234567',
    licenseExpiry: '2026-12-31',
    status: 'active',
    assignedVehicle: 'vehicle-1',
    department: 'Operations',
    region: 'North Florida',
    ...overrides,
  };
}

/**
 * Create mock work order data
 */
export function createMockWorkOrder(overrides = {}) {
  return {
    id: 'wo-1',
    tenantId: 'tenant-1',
    vehicleId: 'vehicle-1',
    type: 'preventive',
    status: 'scheduled',
    priority: 'medium',
    description: 'Regular maintenance',
    scheduledDate: '2024-12-15',
    estimatedCost: 500,
    assignedTechnician: 'tech-1',
    facility: 'facility-1',
    ...overrides,
  };
}

/**
 * Create mock facility data
 */
export function createMockFacility(overrides = {}) {
  return {
    id: 'facility-1',
    tenantId: 'tenant-1',
    name: 'Main Depot',
    type: 'depot',
    location: {
      lat: 30.4383,
      lng: -84.2807,
    },
    address: '500 Depot Way, Tallahassee, FL 32301',
    region: 'North Florida',
    status: 'operational',
    capacity: 100,
    ...overrides,
  };
}

/**
 * Create mock user data
 */
export function createMockUser(overrides = {}) {
  return {
    id: 'user-1',
    tenantId: 'tenant-1',
    email: 'user@example.com',
    name: 'Test User',
    role: 'fleet-manager',
    permissions: ['read:vehicles', 'write:vehicles', 'read:drivers'],
    ...overrides,
  };
}

/**
 * Create multiple entities
 */
export function createMockEntities<T>(
  factory: (overrides?: any) => T,
  count: number,
  baseOverrides = {}
): T[] {
  return Array.from({ length: count }, (_, i) =>
    factory({ id: `entity-${i + 1}`, ...baseOverrides })
  );
}

// ============================================================================
// API Mocks
// ============================================================================

/**
 * Mock fetch response
 */
export function mockFetchResponse(data: any, options = {}) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
    ...options,
  } as Response);
}

/**
 * Mock fetch error
 */
export function mockFetchError(message: string, status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
  } as Response);
}

/**
 * Setup fetch mock with handlers
 */
export function setupFetchMock(handlers: Record<string, any> = {}) {
  const mockFetch = vi.fn((url: string, options?: RequestInit) => {
    const handler = handlers[url];
    if (handler) {
      return typeof handler === 'function' ? handler(url, options) : mockFetchResponse(handler);
    }
    return mockFetchError('Not found', 404);
  });

  global.fetch = mockFetch as any;
  return mockFetch;
}

// ============================================================================
// Local Storage Mocks
// ============================================================================

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  const mock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: mock,
  });

  return mock;
}

// ============================================================================
// WebSocket Mocks
// ============================================================================

/**
 * Mock WebSocket
 */
export function mockWebSocket() {
  const mockWS = {
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: WebSocket.OPEN,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
  };

  global.WebSocket = vi.fn(() => mockWS) as any;

  return mockWS;
}

// ============================================================================
// Timer Utilities
// ============================================================================

/**
 * Wait for promises to resolve
 */
export function waitForPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Wait for specific time
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Flush all pending promises and timers
 */
export async function flushPromises() {
  await new Promise((resolve) => setImmediate(resolve));
}

// ============================================================================
// Form Utilities
// ============================================================================

/**
 * Fill form field
 */
export async function fillField(
  element: HTMLElement,
  value: string,
  userEvent: any
) {
  await userEvent.clear(element);
  await userEvent.type(element, value);
}

/**
 * Submit form
 */
export async function submitForm(form: HTMLFormElement, userEvent: any) {
  await userEvent.click(form.querySelector('[type="submit"]')!);
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert loading state
 */
export function expectLoadingState(container: HTMLElement) {
  expect(
    container.querySelector('[role="status"]') ||
    container.textContent?.includes('Loading')
  ).toBeTruthy();
}

/**
 * Assert error state
 */
export function expectErrorState(container: HTMLElement, message?: string) {
  const errorElement = container.querySelector('[role="alert"]');
  expect(errorElement).toBeTruthy();
  if (message) {
    expect(errorElement?.textContent).toContain(message);
  }
}

/**
 * Assert empty state
 */
export function expectEmptyState(container: HTMLElement) {
  expect(
    container.textContent?.includes('No data') ||
    container.textContent?.includes('Empty')
  ).toBeTruthy();
}

// ============================================================================
// Re-export testing library utilities
// ============================================================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
export { renderHook, waitFor } from '@testing-library/react';
