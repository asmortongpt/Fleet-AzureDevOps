/**
 * Test Utilities for Map Components
 *
 * This file contains mocks, utilities, and helpers for testing map components
 * including Leaflet, Google Maps, and related integrations.
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { vi, expect } from 'vitest'
import { Vehicle, GISFacility, TrafficCamera } from '@/lib/types'

// ============================================================================
// Mock Data Factories
// ============================================================================

/**
 * Creates a mock vehicle with default values
 */
export function createMockVehicle(overrides?: Partial<Vehicle>): Vehicle {
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
      address: '123 Main St, Tallahassee, FL 32301'
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
    ...overrides
  }
}

/**
 * Creates multiple mock vehicles
 */
export function createMockVehicles(count: number, baseOverrides?: Partial<Vehicle>): Vehicle[] {
  return Array.from({ length: count }, (_, i) => createMockVehicle({
    id: `vehicle-${i + 1}`,
    number: `V-${String(i + 1).padStart(3, '0')}`,
    location: {
      lat: 30.4383 + (Math.random() - 0.5) * 0.1,
      lng: -84.2807 + (Math.random() - 0.5) * 0.1,
      address: `${100 + i} Test St, Tallahassee, FL 32301`
    },
    ...baseOverrides
  }))
}

/**
 * Creates a mock facility with default values
 */
export function createMockFacility(overrides?: Partial<GISFacility>): GISFacility {
  return {
    id: 'facility-1',
    name: 'Main Depot',
    type: 'depot',
    location: {
      lat: 30.4383,
      lng: -84.2807
    },
    address: '500 Depot Way, Tallahassee, FL 32301',
    region: 'North Florida',
    status: 'operational',
    ...overrides
  }
}

/**
 * Creates multiple mock facilities
 */
export function createMockFacilities(count: number): GISFacility[] {
  const types: GISFacility['type'][] = ['depot', 'office', 'service-center', 'fueling-station']
  return Array.from({ length: count }, (_, i) => createMockFacility({
    id: `facility-${i + 1}`,
    name: `Facility ${i + 1}`,
    type: types[i % types.length],
    location: {
      lat: 30.4383 + (Math.random() - 0.5) * 0.2,
      lng: -84.2807 + (Math.random() - 0.5) * 0.2
    }
  }))
}

/**
 * Creates a mock traffic camera with default values
 */
export function createMockCamera(overrides?: Partial<TrafficCamera>): TrafficCamera {
  return {
    id: 'camera-1',
    name: 'Main St & 1st Ave',
    latitude: 30.4383,
    longitude: -84.2807,
    address: 'Main St & 1st Ave, Tallahassee, FL',
    crossStreets: 'Main St & 1st Ave',
    operational: true,
    cameraUrl: 'https://example.com/camera/1',
    ...overrides
  }
}

/**
 * Creates multiple mock cameras
 */
export function createMockCameras(count: number): TrafficCamera[] {
  return Array.from({ length: count }, (_, i) => createMockCamera({
    id: `camera-${i + 1}`,
    name: `Camera ${i + 1}`,
    latitude: 30.4383 + (Math.random() - 0.5) * 0.1,
    longitude: -84.2807 + (Math.random() - 0.5) * 0.1,
    operational: i % 3 !== 0 // Make some cameras offline
  }))
}

// ============================================================================
// Leaflet Mocks
// ============================================================================

/**
 * Mock Leaflet library
 */
export const mockLeaflet = {
  version: '1.9.4',
  map: vi.fn((element: HTMLElement, options?: any) => ({
    setView: vi.fn().mockReturnThis(),
    fitBounds: vi.fn().mockReturnThis(),
    setZoom: vi.fn().mockReturnThis(),
    getZoom: vi.fn().mockReturnValue(13),
    getCenter: vi.fn().mockReturnValue({ lat: 30.4383, lng: -84.2807 }),
    setCenter: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    off: vi.fn(),
    on: vi.fn(),
    whenReady: vi.fn((callback: Function) => {
      setTimeout(callback, 0)
    }),
    invalidateSize: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    hasLayer: vi.fn().mockReturnValue(false),
    eachLayer: vi.fn(),
    clearLayers: vi.fn(),
    getBounds: vi.fn().mockReturnValue({
      getNorthEast: vi.fn().mockReturnValue({ lat: 30.5, lng: -84.2 }),
      getSouthWest: vi.fn().mockReturnValue({ lat: 30.3, lng: -84.4 })
    }),
    panTo: vi.fn(),
    flyTo: vi.fn(),
    _container: element
  })),
  tileLayer: vi.fn((url: string, options?: any) => ({
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  })),
  marker: vi.fn((latlng: [number, number], options?: any) => ({
    addTo: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
    setIcon: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    openPopup: vi.fn().mockReturnThis(),
    closePopup: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn(),
    remove: vi.fn(),
    setMap: vi.fn(),
    getLatLng: vi.fn().mockReturnValue({ lat: latlng[0], lng: latlng[1] })
  })),
  layerGroup: vi.fn(() => ({
    addTo: vi.fn().mockReturnThis(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    clearLayers: vi.fn(),
    remove: vi.fn(),
    eachLayer: vi.fn()
  })),
  divIcon: vi.fn((options: any) => ({
    options,
    createIcon: vi.fn(),
    createShadow: vi.fn()
  })),
  Icon: {
    Default: {
      mergeOptions: vi.fn()
    }
  },
  LatLngBounds: vi.fn(() => ({
    extend: vi.fn(),
    isValid: vi.fn().mockReturnValue(true),
    getNorthEast: vi.fn().mockReturnValue({ lat: 30.5, lng: -84.2 }),
    getSouthWest: vi.fn().mockReturnValue({ lat: 30.3, lng: -84.4 })
  }))
}

/**
 * Setup Leaflet mocks for testing
 */
export function setupLeafletMocks() {
  // Mock the Leaflet module import
  vi.mock('leaflet', () => ({
    default: mockLeaflet,
    ...mockLeaflet
  }))

  // Mock Leaflet CSS import
  vi.mock('leaflet/dist/leaflet.css', () => ({}))

  // Mock Leaflet images
  vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '/marker-icon.png' }))
  vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '/marker-icon-2x.png' }))
  vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '/marker-shadow.png' }))

  return mockLeaflet
}

// ============================================================================
// Google Maps Mocks
// ============================================================================

/**
 * Mock Google Maps API
 */
export const mockGoogleMaps = {
  Map: vi.fn((element: HTMLElement, options?: any) => ({
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    getZoom: vi.fn().mockReturnValue(13),
    getCenter: vi.fn().mockReturnValue({ lat: () => 30.4383, lng: () => -84.2807 }),
    setMapTypeId: vi.fn(),
    fitBounds: vi.fn(),
    getBounds: vi.fn().mockReturnValue({
      contains: vi.fn().mockReturnValue(true),
      getNorthEast: vi.fn().mockReturnValue({ lat: () => 30.5, lng: () => -84.2 }),
      getSouthWest: vi.fn().mockReturnValue({ lat: () => 30.3, lng: () => -84.4 })
    }),
    panTo: vi.fn(),
    _element: element
  })),
  Marker: vi.fn((options?: any) => ({
    setMap: vi.fn(),
    setPosition: vi.fn(),
    setIcon: vi.fn(),
    setTitle: vi.fn(),
    getPosition: vi.fn().mockReturnValue({
      lat: () => options?.position?.lat || 30.4383,
      lng: () => options?.position?.lng || -84.2807
    }),
    addListener: vi.fn((event: string, callback: Function) => {
      // Return a listener object that can be removed
      return { remove: vi.fn() }
    }),
    remove: vi.fn()
  })),
  InfoWindow: vi.fn((options?: any) => ({
    open: vi.fn(),
    close: vi.fn(),
    setContent: vi.fn(),
    getContent: vi.fn().mockReturnValue(options?.content || '')
  })),
  LatLngBounds: vi.fn(() => ({
    extend: vi.fn(),
    contains: vi.fn().mockReturnValue(true),
    getNorthEast: vi.fn().mockReturnValue({ lat: () => 30.5, lng: () => -84.2 }),
    getSouthWest: vi.fn().mockReturnValue({ lat: () => 30.3, lng: () => -84.4 })
  })),
  event: {
    addListener: vi.fn((instance: any, event: string, callback: Function) => ({
      remove: vi.fn()
    })),
    addListenerOnce: vi.fn((instance: any, event: string, callback: Function) => ({
      remove: vi.fn()
    })),
    removeListener: vi.fn(),
    clearInstanceListeners: vi.fn(),
    trigger: vi.fn()
  },
  SymbolPath: {
    CIRCLE: 0,
    FORWARD_CLOSED_ARROW: 1,
    FORWARD_OPEN_ARROW: 2,
    BACKWARD_CLOSED_ARROW: 3,
    BACKWARD_OPEN_ARROW: 4
  },
  MapTypeId: {
    ROADMAP: 'roadmap',
    SATELLITE: 'satellite',
    HYBRID: 'hybrid',
    TERRAIN: 'terrain'
  }
}

/**
 * Setup Google Maps mocks for testing
 */
export function setupGoogleMapsMocks() {
  // Mock window.google.maps
  Object.defineProperty(window, 'google', {
    writable: true,
    value: {
      maps: mockGoogleMaps
    }
  })

  return mockGoogleMaps
}

// ============================================================================
// Environment Variable Mocks
// ============================================================================

/**
 * Mock environment variables for testing
 */
export function mockEnvVariables(env: Record<string, string> = {}) {
  const defaultEnv = {
    VITE_GOOGLE_MAPS_API_KEY: 'test-google-maps-api-key',
    VITE_MAPBOX_ACCESS_TOKEN: 'test-mapbox-token',
    ...env
  }

  vi.stubGlobal('import.meta', {
    env: defaultEnv
  })

  return defaultEnv
}

// ============================================================================
// LocalStorage Mocks
// ============================================================================

/**
 * Mock localStorage for testing
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {}

  const localStorageMock = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null)
  }

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    value: localStorageMock
  })

  return localStorageMock
}

// ============================================================================
// Custom Render
// ============================================================================

/**
 * Custom render function with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options })
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Wait for async operations to complete
 */
export async function waitForAsync(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Simulate user waiting for element to appear
 */
export async function waitForElement(callback: () => HTMLElement | null, timeout = 3000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    const element = callback()
    if (element) return element
    await waitForAsync(50)
  }

  throw new Error('Element not found within timeout')
}

/**
 * Mock console methods to suppress expected errors/warnings in tests
 */
export function mockConsole() {
  const originalError = console.error
  const originalWarn = console.warn
  const originalLog = console.log

  return {
    mockError: vi.spyOn(console, 'error').mockImplementation(() => {}),
    mockWarn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    mockLog: vi.spyOn(console, 'log').mockImplementation(() => {}),
    restore: () => {
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
    }
  }
}

/**
 * Create a mock map container element
 */
export function createMapContainer(): HTMLDivElement {
  const container = document.createElement('div')
  container.id = 'map-container'
  container.style.width = '800px'
  container.style.height = '600px'
  document.body.appendChild(container)
  return container
}

/**
 * Clean up map container
 */
export function cleanupMapContainer() {
  const container = document.getElementById('map-container')
  if (container) {
    document.body.removeChild(container)
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that coordinates are valid
 */
export function expectValidCoordinates(lat: number, lng: number) {
  expect(lat).toBeGreaterThanOrEqual(-90)
  expect(lat).toBeLessThanOrEqual(90)
  expect(lng).toBeGreaterThanOrEqual(-180)
  expect(lng).toBeLessThanOrEqual(180)
}

/**
 * Assert that a map instance was created
 */
export function expectMapCreated(mapMock: any) {
  expect(mapMock).toHaveBeenCalled()
}

/**
 * Assert that markers were added
 */
export function expectMarkersAdded(markerMock: any, count: number) {
  expect(markerMock).toHaveBeenCalledTimes(count)
}

// ============================================================================
// Exports
// ============================================================================

export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
