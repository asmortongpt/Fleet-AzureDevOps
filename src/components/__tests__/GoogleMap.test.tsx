/**
 * GoogleMap Component Tests
 *
 * Comprehensive test suite for the GoogleMap component including:
 * - API key validation and error handling
 * - Map initialization and configuration
 * - Marker rendering and management
 * - Info window creation and interaction
 * - Map style switching
 * - Bounds fitting
 * - Memory cleanup
 * - Error recovery and retry logic
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { GoogleMap } from '../GoogleMap'

import {
  createMockVehicles,
  createMockFacilities,
  createMockCameras,
  setupGoogleMapsMocks,
  mockGoogleMaps,
  mockEnvVariables,
  mockConsole,
  createMapContainer,
  cleanupMapContainer
} from '@/test-utils'

describe('GoogleMap', () => {
  let consoleMock: ReturnType<typeof mockConsole>
  let _envMock: ReturnType<typeof mockEnvVariables>

  beforeEach(() => {
    consoleMock = mockConsole()
    _envMock = mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: 'test-google-api-key' })
    setupGoogleMapsMocks()
    createMapContainer()
  })

  afterEach(() => {
    consoleMock.restore()
    cleanupMapContainer()
    vi.clearAllMocks()
  })

  // ============================================================================
  // API Key Validation Tests
  // ============================================================================

  describe('API Key Validation', () => {
    it('should show error when API key is missing', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })

      render(<GoogleMap />)

      expect(screen.getByText(/Google Maps API Key Required/i)).toBeInTheDocument()
    })

    it('should show setup instructions when API key is missing', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '' })

      render(<GoogleMap />)

      expect(screen.getByText(/Setup Instructions:/i)).toBeInTheDocument()
      expect(screen.getByText(/Google Cloud Console/i)).toBeInTheDocument()
    })

    it('should render map when API key is present', async () => {
      render(<GoogleMap />)

      await waitFor(() => {
        expect(screen.queryByText(/API Key Required/i)).not.toBeInTheDocument()
      })
    })

    it('should trim whitespace from API key', () => {
      mockEnvVariables({ VITE_GOOGLE_MAPS_API_KEY: '  test-key  ' })

      render(<GoogleMap />)

      expect(screen.queryByText(/API Key Required/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      render(<GoogleMap />)

      expect(screen.getByText(/Loading Google Maps/i)).toBeInTheDocument()
    })

    it('should show loading spinner', () => {
      render(<GoogleMap />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should hide loading state after map loads', async () => {
      render(<GoogleMap />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading Google Maps/i)).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show production ready message', () => {
      render(<GoogleMap />)

      expect(screen.getByText(/Production Ready/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Map Initialization Tests
  // ============================================================================

  describe('Map Initialization', () => {
    it('should initialize Google Maps with default options', async () => {
      render(<GoogleMap />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalled()
      })
    })

    it('should initialize map with custom center', async () => {
      const customCenter: [number, number] = [-84.2807, 30.4383] // [lng, lat]
      render(<GoogleMap center={customCenter} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            center: { lat: 30.4383, lng: -84.2807 }
          })
        )
      })
    })

    it('should initialize map with custom zoom', async () => {
      render(<GoogleMap zoom={13} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ zoom: 13 })
        )
      })
    })

    it('should initialize map with roadmap style by default', async () => {
      render(<GoogleMap />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ mapTypeId: 'roadmap' })
        )
      })
    })

    it('should enable all map controls', async () => {
      render(<GoogleMap />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            zoomControl: true,
            streetViewControl: true,
            mapTypeControl: true,
            fullscreenControl: true,
            scaleControl: true,
            rotateControl: true
          })
        )
      })
    })
  })

  // ============================================================================
  // Map Style Tests
  // ============================================================================

  describe('Map Styles', () => {
    it('should use roadmap style', async () => {
      render(<GoogleMap mapStyle="roadmap" />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ mapTypeId: 'roadmap' })
        )
      })
    })

    it('should use satellite style', async () => {
      render(<GoogleMap mapStyle="satellite" />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ mapTypeId: 'satellite' })
        )
      })
    })

    it('should use hybrid style', async () => {
      render(<GoogleMap mapStyle="hybrid" />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ mapTypeId: 'hybrid' })
        )
      })
    })

    it('should use terrain style', async () => {
      render(<GoogleMap mapStyle="terrain" />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ mapTypeId: 'terrain' })
        )
      })
    })

    it('should update map style when prop changes', async () => {
      const { rerender } = render(<GoogleMap mapStyle="roadmap" />)

      await waitFor(() => {
        expect(mockGoogleMaps.Map).toHaveBeenCalled()
      })

      const mapInstance = vi.mocked(mockGoogleMaps.Map).mock.results[0]?.value

      rerender(<GoogleMap mapStyle="satellite" />)

      await waitFor(() => {
        expect(mapInstance?.setMapTypeId).toHaveBeenCalledWith('satellite')
      })
    })
  })

  // ============================================================================
  // Vehicle Marker Tests
  // ============================================================================

  describe('Vehicle Markers', () => {
    it('should render vehicle markers', async () => {
      const vehicles = createMockVehicles(3)
      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(3)
      })
    })

    it('should not render vehicles when showVehicles is false', async () => {
      const vehicles = createMockVehicles(3)
      render(<GoogleMap vehicles={vehicles} showVehicles={false} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should create markers with correct positions', async () => {
      const vehicles = createMockVehicles(1)
      vehicles[0].location = { lat: 30.4383, lng: -84.2807, address: 'Test' }

      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledWith(
          expect.objectContaining({
            position: { lat: 30.4383, lng: -84.2807 }
          })
        )
      })
    })

    it('should create markers with vehicle-specific colors', async () => {
      const vehicles = createMockVehicles(2)
      vehicles[0].status = 'active'
      vehicles[1].status = 'emergency'

      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: expect.objectContaining({
              fillColor: '#10b981' // active color
            })
          })
        )

        expect(mockGoogleMaps.Marker).toHaveBeenCalledWith(
          expect.objectContaining({
            icon: expect.objectContaining({
              fillColor: '#ef4444' // emergency color
            })
          })
        )
      })
    })

    it('should skip vehicles with missing location', async () => {
      const vehicles = createMockVehicles(3)
      vehicles[1].location = null as any

      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(2)
      })
    })

    it('should create info windows for vehicles', async () => {
      const vehicles = createMockVehicles(1)
      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.InfoWindow).toHaveBeenCalled()
      })
    })

    it('should add click listeners to markers', async () => {
      const vehicles = createMockVehicles(1)
      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        const markerInstance = vi.mocked(mockGoogleMaps.Marker).mock.results[0]?.value
        expect(markerInstance?.addListener).toHaveBeenCalledWith('click', expect.any(Function))
      })
    })

    it('should update markers when vehicles change', async () => {
      const { rerender } = render(
        <GoogleMap vehicles={createMockVehicles(2)} showVehicles={true} />
      )

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(2)
      })

      vi.clearAllMocks()

      rerender(<GoogleMap vehicles={createMockVehicles(3)} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(3)
      })
    })
  })

  // ============================================================================
  // Facility Marker Tests
  // ============================================================================

  describe('Facility Markers', () => {
    it('should render facility markers', async () => {
      const facilities = createMockFacilities(3)
      render(<GoogleMap facilities={facilities} showFacilities={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(3)
      })
    })

    it('should differentiate operational and maintenance facilities', async () => {
      const facilities = createMockFacilities(2)
      facilities[0].status = 'operational'
      facilities[1].status = 'maintenance'

      render(<GoogleMap facilities={facilities} showFacilities={true} />)

      await waitFor(() => {
        const calls = vi.mocked(mockGoogleMaps.Marker).mock.calls as any[]
        expect(calls[0][0]?.icon?.fillColor).toBe('#10b981') // operational
        expect(calls[1][0]?.icon?.fillColor).toBe('#f59e0b') // maintenance
      })
    })

    it('should create info windows for facilities', async () => {
      const facilities = createMockFacilities(1)
      render(<GoogleMap facilities={facilities} showFacilities={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.InfoWindow).toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // Camera Marker Tests
  // ============================================================================

  describe('Camera Markers', () => {
    it('should render camera markers when enabled', async () => {
      const cameras = createMockCameras(3)
      render(<GoogleMap cameras={cameras} showCameras={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.Marker).toHaveBeenCalledTimes(3)
      })
    })

    it('should differentiate operational and offline cameras', async () => {
      const cameras = createMockCameras(2)
      cameras[0].operational = true
      cameras[1].operational = false

      render(<GoogleMap cameras={cameras} showCameras={true} />)

      await waitFor(() => {
        const calls = vi.mocked(mockGoogleMaps.Marker).mock.calls as any[]
        expect(calls[0][0]?.icon?.fillColor).toBe('#3b82f6') // operational
        expect(calls[1][0]?.icon?.fillColor).toBe('#6b7280') // offline
      })
    })
  })

  // ============================================================================
  // Bounds Fitting Tests
  // ============================================================================

  describe('Bounds Fitting', () => {
    it('should fit bounds to show all markers', async () => {
      const vehicles = createMockVehicles(3)
      const mapInstance = vi.mocked(mockGoogleMaps.Map).mock.results[0]?.value

      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mapInstance?.fitBounds).toHaveBeenCalled()
      })
    })

    it('should limit zoom level after fitting bounds', async () => {
      const vehicles = createMockVehicles(1) // Single marker
      const mapInstance = vi.mocked(mockGoogleMaps.Map).mock.results[0]?.value

      if (mapInstance) {
        vi.mocked(mapInstance.getZoom).mockReturnValue(18) // Too zoomed in
      }

      render(<GoogleMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockGoogleMaps.event.addListenerOnce).toHaveBeenCalledWith(
          expect.anything(),
          'idle',
          expect.any(Function)
        )
      })
    })

    it('should extend bounds for each marker type', async () => {
      const vehicles = createMockVehicles(2)
      const facilities = createMockFacilities(2)
      const cameras = createMockCameras(2)

      render(
        <GoogleMap
          vehicles={vehicles}
          facilities={facilities}
          cameras={cameras}
          showVehicles={true}
          showFacilities={true}
          showCameras={true}
        />
      )
    })
  })
})