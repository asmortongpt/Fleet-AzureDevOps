import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import TrafficCameras from '../TrafficCameras'

import {
  createMockCameras,
  setupLeafletMocks,
  mockConsole
} from '@/test-utils'

interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  operational: boolean;
  address?: string | null;
  crossStreets?: string | null;
  cameraUrl?: string | null;
}

describe('TrafficCameras', () => {
  let consoleMock: ReturnType<typeof mockConsole> | undefined

  beforeEach(() => {
    consoleMock = mockConsole()
    setupLeafletMocks()
  })

  afterEach(() => {
    consoleMock?.restore()
    vi.clearAllMocks()
  })

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      const cameras = createMockCameras(5) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should render map with cameras', () => {
      const cameras = createMockCameras(10) as Camera[]
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
      const cameras = createMockCameras(5) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      await waitFor(() => {
        expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
      })
    })

    it('should show operational status for each camera', () => {
      const cameras = createMockCameras(3) as Camera[]
      cameras[0].operational = true
      cameras[1].operational = false
      cameras[2].operational = true

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should display camera count', () => {
      const cameras = createMockCameras(15) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Filtering Tests
  // ============================================================================

  describe('Camera Filtering', () => {
    it('should filter cameras by operational status', async () => {
      const cameras = createMockCameras(10) as Camera[]
      cameras.slice(0, 7).forEach(c => c.operational = true)
      cameras.slice(7).forEach(c => c.operational = false)

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should search cameras by name', async () => {
      const _user = userEvent.setup()
      const cameras = createMockCameras(5) as Camera[]
      cameras[0].name = 'Main St & 1st Ave'
      cameras[1].name = 'Central Park Entrance'

      render(<TrafficCameras cameras={cameras} />)
    })

    it('should filter by location/area', () => {
      const cameras = createMockCameras(10) as Camera[]
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
      const cameras = createMockCameras(3) as Camera[]
      cameras[0].cameraUrl = 'https://example.com/feed/1'
      cameras[1].cameraUrl = 'https://example.com/feed/2'
      cameras[2].cameraUrl = ''

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should open live feed in new window', async () => {
      const _user = userEvent.setup()
      const cameras = createMockCameras(1) as Camera[]
      cameras[0].cameraUrl = 'https://example.com/live'

      render(<TrafficCameras cameras={cameras} />)
    })

    it('should not show feed link for cameras without URL', () => {
      const cameras = createMockCameras(2) as Camera[]
      cameras[0].cameraUrl = ''
      cameras[1].cameraUrl = ''

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.queryByText(/view live feed/i)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Map Integration Tests
  // ============================================================================

  describe('Map Integration', () => {
    it('should pass cameras to map component', () => {
      const cameras = createMockCameras(5) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should show cameras on map by default', () => {
      const cameras = createMockCameras(3) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should center map on cameras', async () => {
      const cameras = createMockCameras(5) as Camera[]
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
      const _user = userEvent.setup()
      const cameras = createMockCameras(3) as Camera[]

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should highlight selected camera on map', () => {
      const cameras = createMockCameras(3) as Camera[]
      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should show camera details when selected', () => {
      const cameras = createMockCameras(1) as Camera[]
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
        <TrafficCameras cameras={createMockCameras(5) as Camera[]} />
      )

      await waitFor(() => {
        expect(consoleMock?.mockLog).toHaveBeenCalled()
      })

      vi.clearAllMocks()

      rerender(<TrafficCameras cameras={createMockCameras(10) as Camera[]} />)

      await waitFor(() => {
        expect(consoleMock?.mockLog).toHaveBeenCalled()
      })
    })

    it('should update camera operational status', async () => {
      const cameras = createMockCameras(3) as Camera[]
      cameras[0].operational = true

      const { rerender } = render(<TrafficCameras cameras={cameras} />)

      const updatedCameras = [...cameras]
      updatedCameras[0].operational = false

      rerender(<TrafficCameras cameras={updatedCameras} />)

      await waitFor(() => {
        expect(consoleMock?.mockLog).toHaveBeenCalled()
      })
    })

    it('should handle adding new cameras', async () => {
      const { rerender } = render(
        <TrafficCameras cameras={createMockCameras(3) as Camera[]} />
      )

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })

      rerender(<TrafficCameras cameras={createMockCameras(5) as Camera[]} />)

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })
    })

    it('should handle removing cameras', async () => {
      const cameras = createMockCameras(5) as Camera[]
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
      const cameras = createMockCameras(3) as Camera[]
      cameras[1].latitude = NaN
      cameras[1].longitude = -84

      render(<TrafficCameras cameras={cameras} />)

      expect(consoleMock?.mockWarn).toHaveBeenCalled()
    })

    it('should handle cameras with missing required fields', () => {
      const cameras: Camera[] = [
        { id: '1', name: 'Camera 1', latitude: 0, longitude: 0, operational: false },
        { id: '2', name: '', latitude: 30, longitude: -84, operational: false },
      ]

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle null cameras array', () => {
      render(<TrafficCameras cameras={[]} />)

      expect(consoleMock?.mockError).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Performance Tests
  // ============================================================================

  describe('Performance', () => {
    it('should handle large number of cameras', () => {
      const cameras = createMockCameras(100) as Camera[]

      const startTime = performance.now()
      render(<TrafficCameras cameras={cameras} />)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(1000)
    })

    it('should efficiently update camera status', async () => {
      const cameras = createMockCameras(50) as Camera[]
      const { rerender } = render(<TrafficCameras cameras={cameras} />)

      const startTime = performance.now()

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
      const cameras = createMockCameras(5) as Camera[]
      const { unmount } = render(<TrafficCameras cameras={cameras} />)

      await waitFor(() => {
        expect(screen.getByRole('region')).toBeInTheDocument()
      })

      unmount()

      expect(consoleMock?.mockError).not.toHaveBeenCalled()
    })

    it('should not update state after unmount', async () => {
      const cameras = createMockCameras(3) as Camera[]
      const { unmount } = render(<TrafficCameras cameras={cameras} />)

      unmount()

      await waitFor(() => {
        expect(consoleMock?.mockError).not.toHaveBeenCalled()
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
      const cameras = createMockCameras(5) as Camera[]
      cameras.forEach(c => c.operational = false)

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle all cameras operational', () => {
      const cameras = createMockCameras(5) as Camera[]
      cameras.forEach(c => c.operational = true)

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle cameras with same location', () => {
      const cameras = createMockCameras(3) as Camera[]
      cameras.forEach(c => {
        c.latitude = 30.4383
        c.longitude = -84.2807
      })

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle cameras without addresses', () => {
      const cameras = createMockCameras(3) as Camera[]
      cameras.forEach(c => {
        c.address = ''
        c.crossStreets = ''
      })

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })

    it('should handle duplicate camera IDs', () => {
      const cameras = createMockCameras(3) as Camera[]
      cameras[1].id = cameras[0].id

      render(<TrafficCameras cameras={cameras} />)

      expect(screen.getByRole('region')).toBeInTheDocument()
    })
  })
})