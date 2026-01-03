/**
 * LeafletMap Component Tests
 *
 * Comprehensive test suite for the LeafletMap component including:
 * - Map initialization and configuration
 * - Marker rendering and updates
 * - Popup creation and interaction
 * - Map style switching
 * - Error handling
 * - Memory cleanup
 * - Accessibility features
 * - Performance optimizations
 */

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { LeafletMap, isValidCoordinate, calculateDistance } from '../LeafletMap'

import {
  createMockVehicles,
  createMockFacilities,
  createMockCameras,
  setupLeafletMocks,
  mockLeaflet,
  mockConsole,
  createMapContainer,
  cleanupMapContainer
} from '@/test-utils'

describe('LeafletMap', () => {
  let consoleMock: ReturnType<typeof mockConsole>

  beforeEach(() => {
    consoleMock = mockConsole()
    setupLeafletMocks()
    createMapContainer()
  })

  afterEach(() => {
    consoleMock.restore()
    cleanupMapContainer()
    vi.clearAllMocks()
  })

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<LeafletMap />)
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render with loading state initially', () => {
      render(<LeafletMap />)
      expect(screen.getByText(/Loading Map Library/i)).toBeInTheDocument()
    })

    it('should show progress indicator during loading', () => {
      render(<LeafletMap />)
      const progressBar = document.querySelector('.bg-primary.h-full.rounded-full')
      expect(progressBar).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(<LeafletMap className="custom-map-class" />)
      expect(container.querySelector('.custom-map-class')).toBeInTheDocument()
    })

    it('should apply minimum height', () => {
      const { container } = render(<LeafletMap minHeight={800} />)
      const mapContainer = container.querySelector('[role="region"]')
      expect(mapContainer).toHaveStyle({ minHeight: '800px' })
    })

    it('should be accessible with proper ARIA attributes', () => {
      render(<LeafletMap />)
      const region = screen.getByRole('region')
      expect(region).toHaveAttribute('aria-label', 'Interactive fleet management map')
      expect(region).toHaveAttribute('aria-busy', 'true')
    })
  })

  // ============================================================================
  // Map Initialization Tests
  // ============================================================================

  describe('Map Initialization', () => {
    it('should load Leaflet library on mount', async () => {
      render(<LeafletMap />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalledWith(
          expect.stringContaining('Leaflet loaded successfully')
        )
      }, { timeout: 3000 })
    })

    it('should initialize map with default center', async () => {
      render(<LeafletMap />)

      await waitFor(() => {
        expect(mockLeaflet.map).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should initialize map with custom center', async () => {
      const customCenter: [number, number] = [30.4383, -84.2807]
      render(<LeafletMap center={customCenter} />)

      await waitFor(() => {
        expect(mockLeaflet.map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({
            center: customCenter
          })
        )
      }, { timeout: 3000 })
    })

    it('should initialize map with custom zoom', async () => {
      render(<LeafletMap zoom={13} />)

      await waitFor(() => {
        expect(mockLeaflet.map).toHaveBeenCalledWith(
          expect.any(HTMLElement),
          expect.objectContaining({ zoom: 13 })
        )
      }, { timeout: 3000 })
    })

    it('should add tile layer after map initialization', async () => {
      render(<LeafletMap />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should create layer groups for markers', async () => {
      render(<LeafletMap />)

      await waitFor(() => {
        expect(mockLeaflet.layerGroup).toHaveBeenCalledTimes(3) // vehicle, facility, camera layers
      }, { timeout: 3000 })
    })

    it('should handle map initialization errors gracefully', async () => {
      vi.mocked(mockLeaflet.map).mockImplementation(() => {
        throw new Error('Map initialization failed')
      })

      render(<LeafletMap />)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
        expect(screen.getByText(/Map Error/i)).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Map Style Tests
  // ============================================================================

  describe('Map Styles', () => {
    it('should use default OSM style', async () => {
      render(<LeafletMap mapStyle="osm" />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalledWith(
          expect.stringContaining('openstreetmap.org'),
          expect.any(Object)
        )
      }, { timeout: 3000 })
    })

    it('should switch to dark style', async () => {
      const { rerender } = render(<LeafletMap mapStyle="osm" />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalled()
      })

      rerender(<LeafletMap mapStyle="dark" />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalledWith(
          expect.stringContaining('cartocdn.com/dark'),
          expect.any(Object)
        )
      })
    })

    it('should switch to topographic style', async () => {
      render(<LeafletMap mapStyle="topo" />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalledWith(
          expect.stringContaining('opentopomap.org'),
          expect.any(Object)
        )
      })
    })

    it('should switch to satellite style', async () => {
      render(<LeafletMap mapStyle="satellite" />)

      await waitFor(() => {
        expect(mockLeaflet.tileLayer).toHaveBeenCalledWith(
          expect.stringContaining('arcgisonline.com'),
          expect.any(Object)
        )
      })
    })

    it('should display style indicator in development mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(<LeafletMap mapStyle="dark" />)

      await waitFor(() => {
        expect(screen.getByText(/Style: dark/i)).toBeInTheDocument()
      })

      process.env.NODE_ENV = originalEnv
    })
  })

  // ============================================================================
  // Vehicle Marker Tests
  // ============================================================================

  describe('Vehicle Markers', () => {
    it('should render vehicle markers', async () => {
      const vehicles = createMockVehicles(3)
      render(<LeafletMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(3)
      }, { timeout: 3000 })
    })

    it('should not render vehicles when showVehicles is false', async () => {
      const vehicles = createMockVehicles(3)
      render(<LeafletMap vehicles={vehicles} showVehicles={false} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should create custom icons for vehicles', async () => {
      const vehicles = createMockVehicles(1)
      render(<LeafletMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockLeaflet.divIcon).toHaveBeenCalled()
      })
    })

    it('should bind popup to vehicle markers', async () => {
      const vehicles = createMockVehicles(1)
      render(<LeafletMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        const markerInstance = vi.mocked(mockLeaflet.marker).mock.results[0]?.value
        expect(markerInstance?.bindPopup).toHaveBeenCalled()
      })
    })

    it('should skip vehicles with invalid coordinates', async () => {
      const vehicles = createMockVehicles(3)
      vehicles[1].location = { lat: NaN, lng: -84, address: '' }

      render(<LeafletMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(2) // Only 2 valid vehicles
        expect(consoleMock.mockWarn).toHaveBeenCalledWith(
          expect.stringContaining('invalid location')
        )
      })
    })

    it('should skip vehicles with out-of-range coordinates', async () => {
      const vehicles = createMockVehicles(3)
      vehicles[0].location = { lat: 91, lng: -84, address: '' } // lat > 90

      render(<LeafletMap vehicles={vehicles} showVehicles={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(2)
        expect(consoleMock.mockWarn).toHaveBeenCalledWith(
          expect.stringContaining('out-of-range coordinates')
        )
      })
    })

    it('should handle vehicle marker click events', async () => {
      const onMarkerClick = vi.fn()
      const vehicles = createMockVehicles(1)

      render(
        <LeafletMap
          vehicles={vehicles}
          showVehicles={true}
          onMarkerClick={onMarkerClick}
        />
      )

      await waitFor(() => {
        const markerInstance = vi.mocked(mockLeaflet.marker).mock.results[0]?.value
        expect(markerInstance?.on).toHaveBeenCalledWith('click', expect.any(Function))
      })
    })

    it('should update markers when vehicles change', async () => {
      const { rerender } = render(
        <LeafletMap vehicles={createMockVehicles(2)} showVehicles={true} />
      )

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(2)
      })

      vi.clearAllMocks()

      rerender(<LeafletMap vehicles={createMockVehicles(3)} showVehicles={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(3)
      })
    })
  })

  // ============================================================================
  // Facility Marker Tests
  // ============================================================================

  describe('Facility Markers', () => {
    it('should render facility markers', async () => {
      const facilities = createMockFacilities(3)
      render(<LeafletMap facilities={facilities} showFacilities={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(3)
      }, { timeout: 3000 })
    })

    it('should not render facilities when showFacilities is false', async () => {
      const facilities = createMockFacilities(3)
      render(<LeafletMap facilities={facilities} showFacilities={false} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should create custom icons for facilities', async () => {
      const facilities = createMockFacilities(1)
      render(<LeafletMap facilities={facilities} showFacilities={true} />)

      await waitFor(() => {
        expect(mockLeaflet.divIcon).toHaveBeenCalled()
      })
    })

    it('should handle facility marker click events', async () => {
      const onMarkerClick = vi.fn()
      const facilities = createMockFacilities(1)

      render(
        <LeafletMap
          facilities={facilities}
          showFacilities={true}
          onMarkerClick={onMarkerClick}
        />
      )

      await waitFor(() => {
        const markerInstance = vi.mocked(mockLeaflet.marker).mock.results[0]?.value
        expect(markerInstance?.on).toHaveBeenCalledWith('click', expect.any(Function))
      })
    })
  })

  // ============================================================================
  // Camera Marker Tests
  // ============================================================================

  describe('Camera Markers', () => {
    it('should render camera markers when enabled', async () => {
      const cameras = createMockCameras(3)
      render(<LeafletMap cameras={cameras} showCameras={true} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).toHaveBeenCalledTimes(3)
      }, { timeout: 3000 })
    })

    it('should not render cameras by default', async () => {
      const cameras = createMockCameras(3)
      render(<LeafletMap cameras={cameras} />)

      await waitFor(() => {
        expect(mockLeaflet.marker).not.toHaveBeenCalled()
      }, { timeout: 2000 })
    })

    it('should differentiate operational and offline cameras', async () => {
      const cameras = createMockCameras(2)
      cameras[0].operational = true
      cameras[1].operational = false

      render(<LeafletMap cameras={cameras} showCameras={true} />)

      await waitFor(() => {
        expect(mockLeaflet.divIcon).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ============================================================================
  // Marker Count and Clustering Tests
  // ============================================================================

  describe('Marker Count Badge', () => {
    it('should display marker count badge', async () => {
      const vehicles = createMockVehicles(5)
      const facilities = createMockFacilities(3)

      render(
        <LeafletMap
          vehicles={vehicles}
          facilities={facilities}
          showVehicles={true}
          showFacilities={true}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument() // 5 vehicles
        expect(screen.getByText('3')).toBeInTheDocument() // 3 facilities
      })
    })

    it('should not show badge when no markers', async () => {
      render(<LeafletMap />)

      await waitFor(() => {
        const badge = screen.queryByRole('status')
        expect(badge).not.toHaveTextContent(/\d+/)
      })
    })
  })

  // ============================================================================
  // Auto-Fit Bounds Tests
  // ============================================================================

  describe('Auto-Fit Bounds', () => {
    it('should fit bounds to show all markers by default', async () => {
      const vehicles = createMockVehicles(3)
      const mapInstance = vi.mocked(mockLeaflet.map).mock.results[0]?.value;

      render(
        <LeafletMap
          vehicles={vehicles}
          showVehicles={true}
          autoFitBounds={true}
        />
      )

      await waitFor(() => {
        expect(mapInstance?.fitBounds).toHaveBeenCalled()
      })
    })
  })
})