/**
 * UniversalMap Component Tests
 *
 * Comprehensive test suite for the UniversalMap component including:
 * - Provider selection and switching
 * - Error handling and fallback mechanisms
 * - Loading states
 * - Prop validation
 * - Cleanup and memory leak prevention
 * - Integration with child map components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import {
  UniversalMap,
  getMapProvider,
  setMapProvider,
  isMapProviderAvailable,
  getAvailableProviders,
  resetMapProvider,
  type MapProvider
} from '../UniversalMap'
import {
  createMockVehicles,
  createMockFacilities,
  createMockCameras,
  mockEnvVariables,
  mockLocalStorage,
  setupLeafletMocks,
  setupGoogleMapsMocks,
  mockConsole
} from '@/test-utils'

describe('UniversalMap', () => {
  let envMock: ReturnType<typeof mockEnvVariables>
  let storageMock: ReturnType<typeof mockLocalStorage>
  let consoleMock: ReturnType<typeof mockConsole>

  beforeEach(() => {
    // Setup mocks
    envMock = mockEnvVariables({
      VITE_GOOGLE_MAPS_API_KEY: 'test-key-123'
    })
    storageMock = mockLocalStorage()
    consoleMock = mockConsole()
    setupLeafletMocks()
    setupGoogleMapsMocks()

    // Clear any existing provider preference
    storageMock.clear()
  })

  afterEach(() => {
    consoleMock.restore()
    vi.clearAllMocks()
  })

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<UniversalMap />)
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render with default props', () => {
      const { container } = render(<UniversalMap />)
      expect(container.querySelector('.relative.w-full.h-full')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<UniversalMap className="custom-map-class" />)
      expect(container.querySelector('.custom-map-class')).toBeInTheDocument()
    })

    it('should render loading state initially', () => {
      render(<UniversalMap />)
      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Provider Selection Tests
  // ============================================================================

  describe('Provider Selection', () => {
    it('should default to Leaflet when no preference is set', () => {
      render(<UniversalMap />)
      const provider = getMapProvider()
      expect(provider).toBe('leaflet')
    })

    it('should use Google Maps when API key is available and preference is set', () => {
      storageMock.setItem('fleet_map_provider', 'google')
      render(<UniversalMap />)

      waitFor(() => {
        const provider = getMapProvider()
        expect(provider).toBe('google')
      })
    })

    it('should fallback to Leaflet when Google Maps API key is missing', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })
      storageMock.setItem('fleet_map_provider', 'google')

      render(<UniversalMap />)
      const provider = getMapProvider()
      expect(provider).toBe('leaflet')
    })

    it('should respect forceProvider prop', () => {
      render(<UniversalMap forceProvider="leaflet" />)
      expect(getMapProvider()).toBe('leaflet')
    })

    it('should switch providers when localStorage changes', async () => {
      const { rerender } = render(<UniversalMap />)

      // Simulate storage event
      storageMock.setItem('fleet_map_provider', 'google')
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'fleet_map_provider',
        newValue: 'google',
        oldValue: 'leaflet'
      }))

      await waitFor(() => {
        rerender(<UniversalMap />)
        expect(screen.getByText(/Google Maps/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  // ============================================================================
  // Data Rendering Tests
  // ============================================================================

  describe('Data Rendering', () => {
    it('should render with vehicles', async () => {
      const vehicles = createMockVehicles(5)
      render(<UniversalMap vehicles={vehicles} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should render with facilities', async () => {
      const facilities = createMockFacilities(3)
      render(<UniversalMap facilities={facilities} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should render with cameras', async () => {
      const cameras = createMockCameras(4)
      render(<UniversalMap cameras={cameras} showCameras={true} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should render with all marker types', async () => {
      const vehicles = createMockVehicles(2)
      const facilities = createMockFacilities(2)
      const cameras = createMockCameras(2)

      render(
        <UniversalMap
          vehicles={vehicles}
          facilities={facilities}
          cameras={cameras}
          showVehicles={true}
          showFacilities={true}
          showCameras={true}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should show clustering badge when marker count exceeds threshold', async () => {
      const vehicles = createMockVehicles(150)

      render(
        <UniversalMap
          vehicles={vehicles}
          enableClustering={true}
          clusterThreshold={100}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Clustering/i)).toBeInTheDocument()
        expect(screen.getByText(/150/)).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Prop Validation Tests
  // ============================================================================

  describe('Prop Validation', () => {
    it('should handle invalid center coordinates', () => {
      const invalidCenter: [number, number] = [91, -84] // Invalid latitude

      render(<UniversalMap center={invalidCenter} />)

      expect(consoleMock.mockWarn).toHaveBeenCalledWith(
        expect.stringContaining('Invalid center coordinates')
      )
    })

    it('should clamp zoom level to valid range', () => {
      render(<UniversalMap zoom={25} />) // zoom > 20

      // Should use clamped value (20)
      expect(consoleMock.mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('zoom')
      )
    })

    it('should handle negative zoom', () => {
      render(<UniversalMap zoom={-5} />)

      // Should use clamped value (1)
      expect(consoleMock.mockWarn).not.toHaveBeenCalledWith(
        expect.stringContaining('zoom')
      )
    })

    it('should validate coordinates format', () => {
      const vehicles = createMockVehicles(1)
      vehicles[0].location = { lat: NaN, lng: -84, address: 'Test' }

      render(<UniversalMap vehicles={vehicles} />)

      // Should filter out invalid vehicles
      expect(consoleMock.mockWarn).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Callback Tests
  // ============================================================================

  describe('Callbacks', () => {
    it('should call onMapReady when map loads', async () => {
      const onMapReady = vi.fn()

      render(<UniversalMap onMapReady={onMapReady} />)

      await waitFor(() => {
        expect(onMapReady).toHaveBeenCalledWith('leaflet')
      }, { timeout: 3000 })
    })

    it('should call onMapError when error occurs', async () => {
      const onMapError = vi.fn()

      // Force an error by providing invalid config
      setupLeafletMocks()
      vi.mocked(mockLeaflet.map).mockImplementation(() => {
        throw new Error('Map initialization failed')
      })

      render(<UniversalMap onMapError={onMapError} />)

      await waitFor(() => {
        expect(onMapError).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should pass correct provider to callbacks', async () => {
      const onMapReady = vi.fn()

      render(<UniversalMap forceProvider="google" onMapReady={onMapReady} />)

      await waitFor(() => {
        expect(onMapReady).toHaveBeenCalledWith('google')
      }, { timeout: 3000 })
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error boundary when map fails to load', async () => {
      // Simulate Leaflet failure
      vi.mock('leaflet', () => {
        throw new Error('Leaflet not available')
      })

      render(<UniversalMap />)

      await waitFor(() => {
        expect(screen.getByText(/Map Failed to Load/i)).toBeInTheDocument()
      })
    })

    it('should attempt fallback from Google to Leaflet on error', async () => {
      const onMapError = vi.fn()

      // Simulate Google Maps error
      setupGoogleMapsMocks()
      vi.mocked(mockGoogleMaps.Map).mockImplementation(() => {
        throw new Error('Google Maps error')
      })

      render(
        <UniversalMap
          forceProvider="google"
          onMapError={onMapError}
        />
      )

      await waitFor(() => {
        expect(consoleMock.mockWarn).toHaveBeenCalledWith(
          expect.stringContaining('falling back to Leaflet')
        )
      }, { timeout: 3000 })
    })

    it('should show reload button on error', async () => {
      vi.mock('leaflet', () => {
        throw new Error('Fatal error')
      })

      render(<UniversalMap />)

      await waitFor(() => {
        const reloadButton = screen.getByText(/Reload Page/i)
        expect(reloadButton).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  describe('Loading States', () => {
    it('should show loading overlay initially', () => {
      render(<UniversalMap />)
      expect(screen.getByText(/Loading/i)).toBeInTheDocument()
    })

    it('should show appropriate loading message for provider', () => {
      render(<UniversalMap forceProvider="google" />)
      expect(screen.getByText(/Google Maps/i)).toBeInTheDocument()
    })

    it('should hide loading overlay when map is ready', async () => {
      render(<UniversalMap />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  // ============================================================================
  // Cleanup and Memory Tests
  // ============================================================================

  describe('Cleanup and Memory Management', () => {
    it('should cleanup on unmount', async () => {
      const { unmount } = render(<UniversalMap />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })

      unmount()

      // Verify cleanup happened
      expect(consoleMock.mockLog).toHaveBeenCalledWith(
        expect.stringContaining('Cleaning up')
      )
    })

    it('should remove event listeners on unmount', async () => {
      const { unmount } = render(<UniversalMap />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })

      const removeEventListener = vi.spyOn(window, 'removeEventListener')
      unmount()

      expect(removeEventListener).toHaveBeenCalledWith('storage', expect.any(Function))
    })

    it('should not update state after unmount', async () => {
      const { unmount } = render(<UniversalMap />)

      unmount()

      // Try to trigger state update after unmount
      window.dispatchEvent(new StorageEvent('storage'))

      // Should not throw error
      expect(consoleMock.mockError).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Development Mode Tests
  // ============================================================================

  describe('Development Mode Features', () => {
    it('should show provider badge in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const { container } = render(<UniversalMap />)

      expect(container.textContent).toMatch(/Leaflet|Google Maps/)

      process.env.NODE_ENV = originalEnv
    })

    it('should hide provider badge in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const { container } = render(<UniversalMap />)

      // Badge should not be visible
      const badge = container.querySelector('.absolute.top-4.right-4.z-40.bg-black')
      expect(badge).not.toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })
})

// ============================================================================
// Public API Tests
// ============================================================================

describe('UniversalMap Public API', () => {
  let storageMock: ReturnType<typeof mockLocalStorage>

  beforeEach(() => {
    storageMock = mockLocalStorage()
    mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: 'test-key' })
  })

  describe('getMapProvider', () => {
    it('should return current provider', () => {
      expect(getMapProvider()).toBe('leaflet')
    })

    it('should return provider from localStorage', () => {
      storageMock.setItem('fleet_map_provider', 'google')
      expect(getMapProvider()).toBe('google')
    })
  })

  describe('setMapProvider', () => {
    it('should set provider preference', () => {
      const result = setMapProvider('google', false)
      expect(result).toBe(true)
      expect(storageMock.setItem).toHaveBeenCalledWith('fleet_map_provider', 'google')
    })

    it('should reject invalid provider', () => {
      const result = setMapProvider('invalid' as MapProvider, false)
      expect(result).toBe(false)
    })

    it('should reject Google without API key', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })
      const result = setMapProvider('google', false)
      expect(result).toBe(false)
    })

    it('should reload page when requested', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})

      setMapProvider('google', true)

      expect(reloadSpy).toHaveBeenCalled()
      reloadSpy.mockRestore()
    })
  })

  describe('isMapProviderAvailable', () => {
    it('should return true for Leaflet always', () => {
      expect(isMapProviderAvailable('leaflet')).toBe(true)
    })

    it('should return true for Google when API key exists', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: 'test-key' })
      expect(isMapProviderAvailable('google')).toBe(true)
    })

    it('should return false for Google without API key', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })
      expect(isMapProviderAvailable('google')).toBe(false)
    })

    it('should return false for invalid provider', () => {
      expect(isMapProviderAvailable('invalid' as MapProvider)).toBe(false)
    })
  })

  describe('getAvailableProviders', () => {
    it('should always include Leaflet', () => {
      const providers = getAvailableProviders()
      expect(providers).toContain('leaflet')
    })

    it('should include Google when API key exists', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: 'test-key' })
      const providers = getAvailableProviders()
      expect(providers).toContain('google')
      expect(providers).toHaveLength(2)
    })

    it('should only return Leaflet without Google API key', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })
      const providers = getAvailableProviders()
      expect(providers).toEqual(['leaflet'])
    })
  })

  describe('resetMapProvider', () => {
    it('should reset to Leaflet', () => {
      storageMock.setItem('fleet_map_provider', 'google')
      resetMapProvider(false)

      expect(storageMock.setItem).toHaveBeenCalledWith('fleet_map_provider', 'leaflet')
    })

    it('should reload page when requested', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})

      resetMapProvider(true)

      expect(reloadSpy).toHaveBeenCalled()
      reloadSpy.mockRestore()
    })
  })
})
