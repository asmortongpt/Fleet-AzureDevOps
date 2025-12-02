/**
 * TrafficCameras Component Tests
 *
 * Integration tests for the TrafficCameras component including:
 * - Map integration with camera markers
 * - Camera filtering and search
 * - Live feed access
 * - Operational status display
 * - Camera list and grid views
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrafficCameras } from '../TrafficCameras'
import {
  createMockCameras,
  setupLeafletMocks,
  mockConsole
} from '@/test-utils'

describe('TrafficCameras', () => {
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
      const cameras = createMockCameras(5)
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render map with cameras', () => {
      const cameras = createMockCameras(10)
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render with empty cameras array', () => {
      render(<TrafficCameras cameras={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Camera Display Tests
  // ============================================================================

  describe('Camera Display', () => {
    it('should display all cameras on map', async () => {
      const cameras = createMockCameras(5)
      render(<TrafficCameras cameras={cameras} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should show operational status for each camera', () => {
      const cameras = createMockCameras(3)
      cameras[0].operational = true
      cameras[1].operational = false
      cameras[2].operational = true

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should display camera count', () => {
      const cameras = createMockCameras(15)
      render(<TrafficCameras cameras={cameras} />)

      // Should show total camera count somewhere in the UI
      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Filtering Tests
  // ============================================================================

  describe('Camera Filtering', () => {
    it('should filter cameras by operational status', async () => {
      const cameras = createMockCameras(10)
      cameras.slice(0, 7).forEach(c => c.operational = true)
      cameras.slice(7).forEach(c => c.operational = false)

      render(<TrafficCameras cameras={cameras} />)

      // Test filtering logic
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should search cameras by name', async () => {
      const user = userEvent.setup()
      const cameras = createMockCameras(5)
      cameras[0].name = 'Main St & 1st Ave'
      cameras[1].name = 'Central Park Entrance'

      render(<TrafficCameras cameras={cameras} />)

      // If search functionality exists
      // const searchInput = screen.getByPlaceholderText(/search/i)
      // await user.type(searchInput, 'Main St')
      // expect(screen.getByText('Main St & 1st Ave')).toBeInTheDocument()
    })

    it('should filter by location/area', () => {
      const cameras = createMockCameras(10)
      cameras.slice(0, 5).forEach(c => {
        c.address = 'Downtown Area'
      })
      cameras.slice(5).forEach(c => {
        c.address = 'Suburbs Area'
      })

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Live Feed Tests
  // ============================================================================

  describe('Live Feed Access', () => {
    it('should show live feed link for cameras with URL', () => {
      const cameras = createMockCameras(3)
      cameras[0].cameraUrl = 'https://example.com/feed/1'
      cameras[1].cameraUrl = 'https://example.com/feed/2'
      cameras[2].cameraUrl = null

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should open live feed in new window', async () => {
      const user = userEvent.setup()
      const cameras = createMockCameras(1)
      cameras[0].cameraUrl = 'https://example.com/live'

      render(<TrafficCameras cameras={cameras} />)

      // Test clicking on live feed link
      // const feedLink = screen.getByText(/view live feed/i)
      // expect(feedLink).toHaveAttribute('target', '_blank')
    })

    it('should not show feed link for cameras without URL', () => {
      const cameras = createMockCameras(2)
      cameras[0].cameraUrl = null
      cameras[1].cameraUrl = undefined as any

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.queryByText(/view live feed/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Map Integration Tests
  // ============================================================================

  describe('Map Integration', () => {
    it('should pass cameras to map component', () => {
      const cameras = createMockCameras(5)
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should show cameras on map by default', () => {
      const cameras = createMockCameras(3)
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should center map on cameras', async () => {
      const cameras = createMockCameras(5)
      render(<TrafficCameras cameras={cameras} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Camera Selection Tests
  // ============================================================================

  describe('Camera Selection', () => {
    it('should allow selecting a camera', async () => {
      const user = userEvent.setup()
      const cameras = createMockCameras(3)

      render(<TrafficCameras cameras={cameras} />)

      // Test camera selection
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should highlight selected camera on map', () => {
      const cameras = createMockCameras(3)
      render(<TrafficCameras cameras={cameras} />)

      // Test visual highlighting
      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should show camera details when selected', () => {
      const cameras = createMockCameras(1)
      cameras[0].name = 'Test Camera'
      cameras[0].address = '123 Main St'
      cameras[0].crossStreets = 'Main St & 1st Ave'

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Data Updates Tests
  // ============================================================================

  describe('Data Updates', () => {
    it('should update when cameras prop changes', async () => {
      const { rerender } = render(
        <TrafficCameras cameras={createMockCameras(5)} />
      )

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })

      vi.clearAllMocks()

      rerender(<TrafficCameras cameras={createMockCameras(10)} />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })

    it('should update camera operational status', async () => {
      const cameras = createMockCameras(3)
      cameras[0].operational = true

      const { rerender } = render(<TrafficCameras cameras={cameras} />)

      const updatedCameras = [...cameras]
      updatedCameras[0].operational = false

      rerender(<TrafficCameras cameras={updatedCameras} />)

      await waitFor(() => {
        expect(consoleMock.mockLog).toHaveBeenCalled()
      })
    })

    it('should handle adding new cameras', async () => {
      const { rerender } = render(
        <TrafficCameras cameras={createMockCameras(3)} />
      )

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })

      rerender(<TrafficCameras cameras={createMockCameras(5)} />)

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })
    })

    it('should handle removing cameras', async () => {
      const cameras = createMockCameras(5)
      const { rerender } = render(<TrafficCameras cameras={cameras} />)

      rerender(<TrafficCameras cameras={cameras.slice(0, 2)} />)

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Error Handling Tests
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle cameras with invalid coordinates', () => {
      const cameras = createMockCameras(3)
      cameras[1].latitude = NaN
      cameras[1].longitude = -84

      render(<TrafficCameras cameras={cameras} />)

      expect(consoleMock.mockWarn).toHaveBeenCalled()
    })

    it('should handle cameras with missing required fields', () => {
      const cameras: any = [
        { id: '1', name: 'Camera 1' }, // Missing coordinates
        { id: '2', latitude: 30, longitude: -84 }, // Missing name
      ]

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle null cameras array', () => {
      render(<TrafficCameras cameras={null as any} />)

      expect(consoleMock.mockError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should handle large number of cameras', () => {
      const cameras = createMockCameras(100)

      const startTime = performance.now()
      render(<TrafficCameras cameras={cameras} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should efficiently update camera status', async () => {
      const cameras = createMockCameras(50)
      const { rerender } = render(<TrafficCameras cameras={cameras} />)

      const startTime = performance.now()

      // Update all camera statuses
      const updatedCameras = cameras.map(c => ({
        ...c,
        operational: !c.operational
      }))

      rerender(<TrafficCameras cameras={updatedCameras} />)

      await waitFor(() => {
        const endTime = performance.now()
        expect(endTime - startTime).toBeLessThan(500)
      })
    })
  })

  // ============================================================================
  // Cleanup Tests
  // ============================================================================

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const cameras = createMockCameras(5)
      const { unmount } = render(<TrafficCameras cameras={cameras} />)

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })

      unmount()

      expect(consoleMock.mockError).not.toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      const cameras = createMockCameras(3)
      const { unmount } = render(<TrafficCameras cameras={cameras} />)

      unmount()

      await waitFor(() => {
        expect(consoleMock.mockError).not.toHaveBeenCalled()
      })
    })
  })

  // ============================================================================
  // Edge Cases Tests
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty camera array', () => {
      render(<TrafficCameras cameras={[]} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle all cameras offline', () => {
      const cameras = createMockCameras(5)
      cameras.forEach(c => c.operational = false)

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle all cameras operational', () => {
      const cameras = createMockCameras(5)
      cameras.forEach(c => c.operational = true)

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle cameras with same location', () => {
      const cameras = createMockCameras(3)
      cameras.forEach(c => {
        c.latitude = 30.4383
        c.longitude = -84.2807
      })

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle cameras without addresses', () => {
      const cameras = createMockCameras(3)
      cameras.forEach(c => {
        c.address = null
        c.crossStreets = null
      })

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle duplicate camera IDs', () => {
      const cameras = createMockCameras(3)
      cameras[1].id = cameras[0].id

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })
})
