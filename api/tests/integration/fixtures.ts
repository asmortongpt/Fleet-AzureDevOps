/**
 * Test Fixtures and Factory Functions
 *
 * Provides reusable test data generators and fixtures
 * for integration testing.
 */

import { v4 as uuidv4 } from 'uuid'
import { TEST_TENANT, TEST_USERS, TEST_VEHICLES, generateTestToken } from './setup'

// Re-export setup utilities
export { TEST_TENANT, TEST_USERS, TEST_VEHICLES, generateTestToken }
export { generateExpiredToken, generateRefreshToken } from './setup'

/**
 * Create a custom user fixture
 */
export function createUserFixture(overrides: Partial<typeof TEST_USERS.admin> = {}) {
  const id = overrides.id || uuidv4()
  return {
    id,
    tenant_id: overrides.tenant_id || TEST_TENANT.id,
    email: overrides.email || `user-${id.slice(0, 8)}@test.fleet.local`,
    first_name: overrides.first_name || 'Test',
    last_name: overrides.last_name || 'User',
    role: overrides.role || 'viewer',
    is_active: overrides.is_active ?? true,
    password: overrides.password || 'TestPass123!',
    scope_level: overrides.scope_level || 'own'
  }
}

/**
 * Create a custom vehicle fixture
 */
export function createVehicleFixture(overrides: Partial<typeof TEST_VEHICLES.vehicle1> = {}) {
  const id = overrides.id || uuidv4()
  const vinSuffix = Math.random().toString(36).substring(2, 10).toUpperCase()
  return {
    id,
    tenant_id: overrides.tenant_id || TEST_TENANT.id,
    vin: overrides.vin || `TESTVIN${vinSuffix}`,
    license_plate: overrides.license_plate || `TST-${vinSuffix.slice(0, 4)}`,
    make: overrides.make || 'TestMake',
    model: overrides.model || 'TestModel',
    year: overrides.year || new Date().getFullYear(),
    color: overrides.color || 'White',
    current_mileage: overrides.current_mileage || 0,
    status: overrides.status || 'active'
  }
}

/**
 * Get authentication headers for a user
 */
export function getAuthHeaders(user: typeof TEST_USERS[keyof typeof TEST_USERS]) {
  const token = generateTestToken(user)
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Get authorization header with a custom token
 */
export function getAuthHeaderWithToken(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Invalid credentials for testing
 */
export const INVALID_CREDENTIALS = {
  wrongPassword: {
    email: TEST_USERS.admin.email,
    password: 'WrongPassword123!'
  },
  nonExistentUser: {
    email: 'nonexistent@test.fleet.local',
    password: 'SomePassword123!'
  },
  invalidEmail: {
    email: 'not-an-email',
    password: 'SomePassword123!'
  },
  missingPassword: {
    email: TEST_USERS.admin.email
  },
  missingEmail: {
    password: 'SomePassword123!'
  },
  emptyCredentials: {
    email: '',
    password: ''
  },
  weakPassword: {
    email: 'test@test.fleet.local',
    password: '123'
  }
}

/**
 * Invalid vehicle data for testing
 */
export const INVALID_VEHICLE_DATA = {
  missingVin: {
    license_plate: 'INV-001',
    make: 'Test',
    model: 'Invalid',
    year: 2023
  },
  invalidVin: {
    vin: 'SHORT',
    license_plate: 'INV-002',
    make: 'Test',
    model: 'Invalid',
    year: 2023
  },
  invalidYear: {
    vin: 'INVALIDYEAR12345',
    license_plate: 'INV-003',
    make: 'Test',
    model: 'Invalid',
    year: 1800 // Too old
  },
  emptyData: {}
}

/**
 * Valid registration data for testing
 */
export const VALID_REGISTRATION_DATA = {
  email: `newuser-${Date.now()}@test.fleet.local`,
  password: 'SecurePass123!',
  first_name: 'New',
  last_name: 'User'
}

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    logout: '/api/v1/auth/logout',
    refresh: '/api/v1/auth/refresh',
    me: '/api/v1/auth/me',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password'
  },
  // Vehicle endpoints
  vehicles: {
    base: '/api/v1/vehicles',
    byId: (id: string) => `/api/v1/vehicles/${id}`
  },
  // Health endpoints
  health: {
    simple: '/api/health',
    status: '/api/status',
    microsoft: '/api/v1/health/microsoft',
    microsoftSimple: '/api/v1/health/microsoft/simple',
    microsoftMetrics: '/api/v1/health/microsoft/metrics',
    readiness: '/api/readiness'
  }
}

/**
 * HTTP status codes for reference
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}

/**
 * Pagination defaults
 */
export const PAGINATION_DEFAULTS = {
  page: 1,
  limit: 50
}

/**
 * Rate limiting configuration (for testing)
 */
export const RATE_LIMIT_CONFIG = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 attempts per window
  },
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 registrations per hour
  },
  global: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 requests per minute
  }
}
