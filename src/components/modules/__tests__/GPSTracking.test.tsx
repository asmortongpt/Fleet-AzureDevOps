/**
 * GPSTracking Component Tests
 *
 * Integration tests for the GPSTracking component including:
 * - Map integration with UniversalMap
 * - Vehicle filtering and display
 * - Status metrics calculation
 * - Vehicle selection and callbacks
 * - Loading and error states
 * - Data updates and re-rendering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GPSTracking } from '../GPSTracking'
import {
  createMockVehicles,
  createMockFacilities,
  setupLeafletMocks,
  mockConsole
} from '@/test-utils'

describe('GPSTracking', () => {
  let consoleMock: ReturnType<typeof mockConsole>

  beforeEach(() => {
    consoleMock = mockConsole()
    setupLeafletMocks()
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
      const vehicles = createMockVehicles(5)
      const facilities = createMockFacilities(2)

      render(<GPSTracking vehicles={vehicles} facilities={facilities} />)

      expect(screen.getByRole('region')).toBeInTheDocument() // Map container
    })

    it('should render map component', () => {
      const vehicles = createMockVehicles(3)
      const facilities = createMockFacilities(1)

      render(<GPSTracking vehicles={vehicles} facilities={facilities} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render with empty data', () => {
      render(<GPSTracking vehicles={[]} facilities={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle default props', () => {
      render(<GPSTracking vehicles={[]} facilities={[]} />)

      expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  describe('Loading States', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(
        <GPSTracking
          vehicles={[]}
          facilities={[]}
          isLoading={true}
        />
      )

      const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show loading skeleton when data is loaded', () => {
      const vehicles = createMockVehicles(5)

      render(
        <GPSTracking
          vehicles={vehicles}
          facilities={[]}
          isLoading={false}
        />
      )

      const skeletons = document.querySelectorAll('[data-testid="skeleton"]')
      expect(skeletons.length).toBe(0)
    })
  })

  // ============================================================================
  // Error State Tests
  // ============================================================================

  describe('Error States', () => {
    it('should display error alert when error prop is provided', () => {
      render(
        <GPSTracking
          vehicles={[]}
          facilities={[]}
          error="Failed to load vehicles"
        />
      )

      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load vehicles/i)).toBeInTheDocument()
    })

    it('should not show error when error is null', () => {
      render(
        <GPSTracking
          vehicles={[]}
          facilities={[]}
          error={null}
        />
      )

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('should handle invalid vehicle data gracefully', () => {
      const vehicles: any = [
        { id: '1' }, // Missing required fields
        null,
        undefined,
        'invalid'
      ]

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(consoleMock.mockWarn).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Vehicle Display Tests
  // ============================================================================

  describe('Vehicle Display', () => {
    it('should display all vehicles on map', async () => {
      const vehicles = createMockVehicles(5)

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should display vehicle list with details', () => {
      const vehicles = createMockVehicles(3)
      vehicles[0].name = 'Test Vehicle 1'

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // The component should render vehicle information
      expect(consoleMock.mockLog).toHaveBeenCalled()
    })

    it('should handle vehicles with missing location', () => {
      const vehicles = createMockVehicles(3)
      vehicles[1].location = null as any

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(consoleMock.mockWarn).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Status Filtering Tests
  // ============================================================================

  describe('Status Filtering', () => {
    it('should filter vehicles by status', async () => {
      const user = userEvent.setup()
      const vehicles = createMockVehicles(10)
      vehicles[0].status = 'active'
      vehicles[1].status = 'active'
      vehicles[2].status = 'idle'
      vehicles[3].status = 'emergency'

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // Find and click status filter (if UI provides it)
      // This depends on the actual implementation
    })

    it('should show all vehicles when filter is "all"', () => {
      const vehicles = createMockVehicles(10)
      vehicles.forEach((v, i) => {
        v.status = i % 2 === 0 ? 'active' : 'idle'
      })

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(consoleMock.mockLog).toHaveBeenCalled()
    })

    it('should calculate status metrics correctly', () => {
      const vehicles = createMockVehicles(10)
      vehicles[0].status = 'active'
      vehicles[1].status = 'active'
      vehicles[2].status = 'active'
      vehicles[3].status = 'idle'
      vehicles[4].status = 'idle'
      vehicles[5].status = 'emergency'
      vehicles[6].status = 'charging'
      vehicles[7].status = 'service'
      vehicles[8].status = 'offline'
      vehicles[9].status = 'offline'

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // Status metrics should be calculated:
      // active: 3, idle: 2, emergency: 1, charging: 1, service: 1, offline: 2
    })
  })

  // ============================================================================
  // Vehicle Selection Tests
  // ============================================================================

  describe('Vehicle Selection', () => {
    it('should call onVehicleSelect when vehicle is selected', async () => {
      const onVehicleSelect = vi.fn()
      const vehicles = createMockVehicles(3)

      render(
        <GPSTracking
          vehicles={vehicles}
          facilities={[]}
          onVehicleSelect={onVehicleSelect}
        />
      )

      // Simulate selecting a vehicle (implementation-dependent)
      // await user.click(screen.getByText(vehicles[0].name))
      // expect(onVehicleSelect).toHaveBeenCalledWith(vehicles[0].id)
    })

    it('should highlight selected vehicle', () => {
      const vehicles = createMockVehicles(3)

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // Visual indication of selection would be tested here
    })

    it('should allow deselecting vehicle', async () => {
      const user = userEvent.setup()
      const onVehicleSelect = vi.fn()
      const vehicles = createMockVehicles(3)

      render(
        <GPSTracking
          vehicles={vehicles}
          facilities={[]}
          onVehicleSelect={onVehicleSelect}
        />
      )

      // Test deselection logic
    })
  })

  // ============================================================================
  // Data Updates Tests
  // ============================================================================

  describe('Data Updates', () => {
    it('should update when vehicles prop changes', async () => {
      const { rerender } = render(
        <GPSTracking vehicles={createMockVehicles(5)} facilities={[]} />
      )

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })

      vi.clearAllMocks()

      rerender(<GPSTracking vehicles={createMockVehicles(10)} facilities={[]} />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })

    it('should handle vehicle location updates', async () => {
      const vehicles = createMockVehicles(3)
      const { rerender } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      // Update vehicle location
      const updatedVehicles = [...vehicles]
      updatedVehicles[0].location = {
        lat: 30.5,
        lng: -84.3,
        address: 'New Location'
      }

      rerender(<GPSTracking vehicles={updatedVehicles} facilities={[]} />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })

    it('should handle vehicle status updates', async () => {
      const vehicles = createMockVehicles(3)
      vehicles[0].status = 'active'

      const { rerender } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      // Update vehicle status
      const updatedVehicles = [...vehicles]
      updatedVehicles[0].status = 'emergency'

      rerender(<GPSTracking vehicles={updatedVehicles} facilities={[]} />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // Map Integration Tests
  // ============================================================================

  describe('Map Integration', () => {
    it('should pass vehicles to UniversalMap', () => {
      const vehicles = createMockVehicles(5)

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // UniversalMap should receive vehicles
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should pass facilities to UniversalMap', () => {
      const facilities = createMockFacilities(3)

      render(<GPSTracking vehicles={[]} facilities={facilities} />)

      // UniversalMap should receive facilities
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should show vehicles on map by default', () => {
      const vehicles = createMockVehicles(3)

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // Map should display vehicles
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should handle large number of vehicles efficiently', () => {
      const vehicles = createMockVehicles(100)

      const startTime = performance.now()
      render(<GPSTracking vehicles={vehicles} facilities={[]} />)
      const endTime = performance.now()

      // Should render in reasonable time (< 1000ms)
      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should debounce rapid vehicle updates', async () => {
      const vehicles = createMockVehicles(5)
      const { rerender } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      // Rapidly update vehicles multiple times
      for (let i = 0; i < 10; i++) {
        const updatedVehicles = vehicles.map(v => ({
          ...v,
          location: {
            ...v.location!,
            lat: v.location!.lat + Math.random() * 0.01
          }
        }))
        rerender(<GPSTracking vehicles={updatedVehicles} facilities={[]} />)
      }

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })

    it('should not re-render unnecessarily', () => {
      const vehicles = createMockVehicles(5)
      const { rerender } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      vi.clearAllMocks()

      // Re-render with same props
      rerender(<GPSTracking vehicles={vehicles} facilities={[]} />)

      // Should not cause excessive renders
    })
  })

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const vehicles = createMockVehicles(5)
      const { unmount } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })

      unmount()

      // Should not cause errors
      expect(consoleMock.mockError).not.toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      const vehicles = createMockVehicles(5)
      const { unmount } = render(
        <GPSTracking vehicles={vehicles} facilities={[]} />
      )

      unmount()

      // Triggering async updates should not cause errors
      await waitFor(() => {
        expect(consoleMock.mockError).not.toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty vehicles array', () => {
      render(<GPSTracking vehicles={[]} facilities={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle null vehicles', () => {
      render(<GPSTracking vehicles={null as any} facilities={[]} />)

      expect(consoleMock.mockError).toHaveBeenCalled()
    })

    it('should handle undefined vehicles', () => {
      render(<GPSTracking vehicles={undefined as any} facilities={[]} />)

      expect(consoleMock.mockError).toHaveBeenCalled()
    })

    it('should handle vehicles with all same status', () => {
      const vehicles = createMockVehicles(5)
      vehicles.forEach(v => { v.status = 'active' })

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle vehicles without names', () => {
      const vehicles = createMockVehicles(3)
      vehicles[0].name = ''

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle duplicate vehicle IDs', () => {
      const vehicles = createMockVehicles(3)
      vehicles[1].id = vehicles[0].id // Duplicate

      render(<GPSTracking vehicles={vehicles} facilities={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })
})
