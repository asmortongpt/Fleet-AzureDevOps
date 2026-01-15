/**
 * Centralized Test Fixtures
 * Provides standardized mock data factories for consistent testing across the codebase
 */

import { vi } from 'vitest';

// ============================================================================
// Vehicle Fixtures
// ============================================================================

export const createMockVehicle = (overrides?: Partial<any>) => ({
  id: 'test-vehicle-1',
  vehicle_number: 'V-123',
  make: 'Ford',
  model: 'F-150',
  year: 2023,
  vin: '1FTFW1E50KFA12345',
  status: 'active',
  odometer: 15000,
  color: 'White',
  license_plate: 'ABC123',
  fuel_type: 'gasoline',
  department_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockVehicleList = (count: number = 3) =>
  Array.from({ length: count }, (_, i) =>
    createMockVehicle({
      id: `test-vehicle-${i + 1}`,
      vehicle_number: `V-${100 + i}`,
      odometer: 15000 + i * 1000,
    })
  );

// ============================================================================
// User Fixtures
// ============================================================================

export const createMockUser = (overrides?: Partial<any>) => ({
  id: 'test-user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  department_id: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockAdmin = (overrides?: Partial<any>) =>
  createMockUser({ id: 'test-admin-1', email: 'admin@example.com', role: 'admin', ...overrides });

// ============================================================================
// Driver Fixtures
// ============================================================================

export const createMockDriver = (overrides?: Partial<any>) => ({
  id: 'test-driver-1',
  name: 'John Doe',
  license_number: 'DL123456',
  license_expiry: '2025-12-31',
  phone: '555-0100',
  email: 'driver@example.com',
  status: 'active',
  ...overrides,
});

// ============================================================================
// Maintenance Fixtures
// ============================================================================

export const createMockMaintenanceRecord = (overrides?: Partial<any>) => ({
  id: 'test-maintenance-1',
  vehicle_id: 'test-vehicle-1',
  type: 'scheduled',
  description: 'Oil change',
  cost: 50.0,
  odometer: 15000,
  performed_at: '2024-01-15T10:00:00Z',
  performed_by: 'test-mechanic-1',
  status: 'completed',
  ...overrides,
});

// ============================================================================
// GPS/Location Fixtures
// ============================================================================

export const createMockLocation = (overrides?: Partial<any>) => ({
  lat: 30.2672,
  lng: -97.7431,
  timestamp: Date.now(),
  speed: 0,
  heading: 0,
  accuracy: 10,
  ...overrides,
});

export const createMockGPSData = (overrides?: Partial<any>) => ({
  vehicle_id: 'test-vehicle-1',
  location: createMockLocation(),
  status: 'moving',
  ignition: true,
  fuel_level: 75,
  battery: 12.6,
  ...overrides,
});

// ============================================================================
// API Response Fixtures
// ============================================================================

export const createMockAPIResponse = <T>(data: T, overrides?: Partial<any>) => ({
  success: true,
  data,
  message: 'Success',
  timestamp: new Date().toISOString(),
  ...overrides,
});

export const createMockAPIError = (message: string = 'An error occurred', code: number = 500) => ({
  success: false,
  error: message,
  code,
  timestamp: new Date().toISOString(),
});

// ============================================================================
// WebSocket Message Fixtures
// ============================================================================

export const createMockWebSocketMessage = (type: string, data: any) => ({
  type,
  data,
  timestamp: Date.now(),
  id: Math.random().toString(36).substr(2, 9),
});

// ============================================================================
// Mock Functions
// ============================================================================

export const createMockHandlers = () => ({
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onCreate: vi.fn(),
  onView: vi.fn(),
  onViewDetails: vi.fn(),
  onCancel: vi.fn(),
  onSave: vi.fn(),
  onSubmit: vi.fn(),
});

// ============================================================================
// Mock Fetch Responses
// ============================================================================

export const createMockFetchResponse = (data: any, ok: boolean = true, status: number = 200) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers({
    'Content-Type': 'application/json',
  }),
});

// ============================================================================
// Date/Time Fixtures
// ============================================================================

export const MOCK_DATES = {
  now: '2024-01-15T12:00:00Z',
  yesterday: '2024-01-14T12:00:00Z',
  tomorrow: '2024-01-16T12:00:00Z',
  lastWeek: '2024-01-08T12:00:00Z',
  nextWeek: '2024-01-22T12:00:00Z',
  lastMonth: '2023-12-15T12:00:00Z',
  nextMonth: '2024-02-15T12:00:00Z',
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a consistent timestamp for testing
 */
export const getMockTimestamp = (offset: number = 0) =>
  new Date('2024-01-15T12:00:00Z').getTime() + offset;

/**
 * Creates a mock delay for async testing
 */
export const mockDelay = (ms: number = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));
