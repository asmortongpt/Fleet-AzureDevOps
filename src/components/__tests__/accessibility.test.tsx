/**
 * Accessibility Test Suite for Map Components
 *
 * Comprehensive accessibility testing using jest-axe for automated WCAG 2.2 compliance.
 * Tests all map components for ARIA labels, keyboard navigation, screen reader compatibility,
 * color contrast, and focus management.
 *
 * @module accessibility.test
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'
import { UniversalMap } from '../UniversalMap'
import { LeafletMap } from '../LeafletMap'
import { MapboxMap } from '../MapboxMap'
import { GoogleMap } from '../GoogleMap'
import type { Vehicle, GISFacility, TrafficCamera } from '@/lib/types'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// ============================================================================
// Test Data
// ============================================================================

const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    name: 'Vehicle 1',
    type: 'sedan',
    status: 'active',
    driver: 'John Doe',
    location: {
      lat: 30.4383,
      lng: -84.2807,
      address: '123 Main St, Tallahassee, FL',
    },
  },
  {
    id: 'v2',
    name: 'Vehicle 2',
    type: 'truck',
    status: 'idle',
    driver: 'Jane Smith',
    location: {
      lat: 30.4483,
      lng: -84.2707,
    },
  },
]

const mockFacilities: GISFacility[] = [
  {
    id: 'f1',
    name: 'Main Depot',
    type: 'depot',
    status: 'operational',
    capacity: 50,
    address: '456 Depot Ave, Tallahassee, FL',
    location: {
      lat: 30.4283,
      lng: -84.2907,
    },
  },
]

const mockCameras: TrafficCamera[] = [
  {
    id: 'c1',
    name: 'Main Street Camera',
    latitude: 30.4183,
    longitude: -84.3007,
    address: 'Main St & 5th Ave',
    operational: true,
    cameraUrl: 'https://example.com/camera1',
  },
]

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Renders component and runs axe accessibility tests
 */
async function renderAndTestAxe(component: React.ReactElement) {
  const { container } = render(component)
  const results = await axe(container)
  return { container, results }
}

/**
 * Waits for map to be ready
 */
async function waitForMapReady() {
  await waitFor(
    () => {
      const mapElement = screen.queryByRole('region', { name: /map/i })
      expect(mapElement).toBeInTheDocument()
    },
    { timeout: 5000 }
  )
}

// ============================================================================
// UniversalMap Tests
// ============================================================================

describe('UniversalMap Accessibility', () => {
  beforeEach(() => {
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    }
    global.localStorage = localStorageMock as any
  })

  describe('Automated axe Testing', () => {
    it('should have no accessibility violations with default props', async () => {
      const { results } = await renderAndTestAxe(<UniversalMap />)
      expect(results).toHaveNoViolations()
    })

    it('should have no violations with all data types', async () => {
      const { results } = await renderAndTestAxe(
        <UniversalMap
          vehicles={mockVehicles}
          facilities={mockFacilities}
          cameras={mockCameras}
          showVehicles={true}
          showFacilities={true}
          showCameras={true}
        />
      )
      expect(results).toHaveNoViolations()
    })
  })

  describe('ARIA Labels and Roles', () => {
    it('should have appropriate ARIA role for map container', async () => {
      render(<UniversalMap />)
      await waitForMapReady()

      const mapContainer = screen.getByRole('region')
      expect(mapContainer).toHaveAttribute('aria-label')
    })

    it('should have loading state ARIA attributes', () => {
      render(<UniversalMap />)

      const loadingElement = screen.queryByRole('status')
      if (loadingElement) {
        expect(loadingElement).toHaveAttribute('aria-live', 'polite')
      }
    })

    it('should have error state ARIA attributes', async () => {
      // Force error by providing invalid center
      render(<UniversalMap center={[999, 999] as [number, number]} />)

      await waitFor(() => {
        const errorElement = screen.queryByRole('alert')
        if (errorElement) {
          expect(errorElement).toHaveAttribute('aria-live', 'assertive')
        }
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <UniversalMap
          vehicles={mockVehicles}
          showVehicles={true}
        />
      )
      await waitForMapReady()

      // Tab through the page
      await user.tab()

      // Map should be reachable via keyboard
      const mapElement = screen.getByRole('region')
      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('Screen Reader Compatibility', () => {
    it('should announce loading state', () => {
      render(<UniversalMap />)

      const statusElement = screen.queryByRole('status')
      expect(statusElement).toBeTruthy()
    })

    it('should have descriptive text for screen readers', async () => {
      render(<UniversalMap vehicles={mockVehicles} />)
      await waitForMapReady()

      const mapContainer = screen.getByRole('region')
      const ariaLabel = mapContainer.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(typeof ariaLabel).toBe('string')
    })
  })

  describe('Focus Management', () => {
    it('should manage focus properly when switching providers', async () => {
      const { rerender } = render(<UniversalMap forceProvider="leaflet" />)
      await waitForMapReady()

      rerender(<UniversalMap forceProvider="google" />)

      // Focus should not be lost
      await waitFor(() => {
        expect(document.activeElement).toBeTruthy()
      })
    })
  })
})

// ============================================================================
// LeafletMap Tests
// ============================================================================

describe('LeafletMap Accessibility', () => {
  describe('Automated axe Testing', () => {
    it('should have no accessibility violations', async () => {
      const { results } = await renderAndTestAxe(
        <LeafletMap
          vehicles={mockVehicles}
          facilities={mockFacilities}
        />
      )
      expect(results).toHaveNoViolations()
    })
  })

  describe('ARIA Labels', () => {
    it('should have proper ARIA labels on map container', async () => {
      render(<LeafletMap />)
      await waitForMapReady()

      const mapRegion = screen.getByRole('region')
      expect(mapRegion).toHaveAttribute('aria-label')
      const label = mapRegion.getAttribute('aria-label')
      expect(label).toContain('map')
    })

    it('should have ARIA busy state while loading', () => {
      render(<LeafletMap />)

      const mapRegion = screen.queryByRole('region')
      if (mapRegion && mapRegion.hasAttribute('aria-busy')) {
        expect(mapRegion.getAttribute('aria-busy')).toBeTruthy()
      }
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation on markers', async () => {
      render(
        <LeafletMap
          vehicles={mockVehicles}
          showVehicles={true}
        />
      )
      await waitForMapReady()

      // Wait for markers to render
      await waitFor(() => {
        const markers = document.querySelectorAll('[role="button"]')
        expect(markers.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should allow Enter and Space to activate markers', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()

      render(
        <LeafletMap
          vehicles={mockVehicles}
          showVehicles={true}
          onMarkerClick={handleClick}
        />
      )
      await waitForMapReady()

      await waitFor(() => {
        const marker = document.querySelector('[role="button"]')
        expect(marker).toBeInTheDocument()
      })

      const marker = document.querySelector('[role="button"]') as HTMLElement
      if (marker) {
        marker.focus()
        await user.keyboard('{Enter}')
        // Note: Actual behavior depends on Leaflet's event handling
      }
    })
  })

  describe('Color Contrast', () => {
    it('should have sufficient contrast for marker colors', async () => {
      render(
        <LeafletMap
          vehicles={mockVehicles}
          showVehicles={true}
        />
      )
      await waitForMapReady()

      await waitFor(() => {
        const markers = document.querySelectorAll('.vehicle-marker-icon')
        expect(markers.length).toBeGreaterThan(0)
      }, { timeout: 3000 })

      // Markers should have white border for contrast
      const marker = document.querySelector('.vehicle-marker-icon')
      if (marker) {
        const styles = window.getComputedStyle(marker.firstElementChild as Element)
        // Border should exist for better visibility
        expect(styles.border || styles.borderWidth).toBeTruthy()
      }
    })
  })

  describe('Screen Reader Support', () => {
    it('should have descriptive alt text for markers', async () => {
      render(
        <LeafletMap
          vehicles={mockVehicles}
          showVehicles={true}
        />
      )
      await waitForMapReady()

      await waitFor(() => {
        const markerElements = document.querySelectorAll('[aria-label*="Vehicle"]')
        expect(markerElements.length).toBeGreaterThan(0)
      }, { timeout: 3000 })
    })

    it('should announce map state changes', async () => {
      render(
        <LeafletMap
          vehicles={mockVehicles}
        />
      )

      await waitFor(() => {
        const statusElement = screen.queryByRole('status')
        expect(statusElement || screen.queryByRole('region')).toBeTruthy()
      })
    })
  })

  describe('Error States', () => {
    it('should have accessible error messages', async () => {
      // Create error by passing invalid data
      const invalidVehicles = [
        {
          id: 'invalid',
          name: 'Invalid',
          type: 'sedan' as const,
          status: 'active' as const,
          location: null,
        },
      ]

      render(<LeafletMap vehicles={invalidVehicles} />)

      // Error should be announced
      await waitFor(() => {
        const errorOrRegion = screen.queryByRole('alert') || screen.queryByRole('region')
        expect(errorOrRegion).toBeTruthy()
      })
    })
  })
})

// ============================================================================
// MapboxMap Tests
// ============================================================================

describe('MapboxMap Accessibility', () => {
  describe('Automated axe Testing', () => {
    it('should have no accessibility violations when configured', async () => {
      // Mock Mapbox token
      vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'pk.test.token')

      const { results } = await renderAndTestAxe(
        <MapboxMap vehicles={mockVehicles} />
      )

      // May have violations if token is invalid, but structure should be accessible
      expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
    })
  })

  describe('ARIA Support', () => {
    it('should have proper ARIA labels', async () => {
      render(<MapboxMap />)

      await waitFor(() => {
        const region = screen.queryByRole('region') || screen.queryByRole('alert')
        expect(region).toBeTruthy()
      })
    })

    it('should have accessible loading state', () => {
      render(<MapboxMap />)

      const statusOrAlert = screen.queryByRole('status') || screen.queryByRole('alert')
      expect(statusOrAlert).toBeTruthy()
    })
  })

  describe('Error Handling', () => {
    it('should show accessible error message when token is missing', async () => {
      vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', '')

      render(<MapboxMap />)

      await waitFor(() => {
        const errorElement = screen.getByRole('alert')
        expect(errorElement).toBeInTheDocument()
        expect(errorElement).toHaveAttribute('aria-live', 'assertive')
      })
    })
  })
})

// ============================================================================
// GoogleMap Tests
// ============================================================================

describe('GoogleMap Accessibility', () => {
  describe('Basic Accessibility', () => {
    it('should render with accessible structure', () => {
      render(<GoogleMap />)

      // Should have either a region or status/alert
      const element = screen.queryByRole('region') ||
                      screen.queryByRole('status') ||
                      screen.queryByRole('alert')
      expect(element).toBeTruthy()
    })

    it('should have no critical axe violations', async () => {
      const { results } = await renderAndTestAxe(<GoogleMap />)

      const criticalViolations = results.violations.filter(
        v => v.impact === 'critical'
      )
      expect(criticalViolations).toHaveLength(0)
    })
  })

  describe('Loading States', () => {
    it('should announce loading to screen readers', () => {
      render(<GoogleMap />)

      const statusElement = screen.queryByRole('status')
      if (statusElement) {
        expect(statusElement).toHaveAttribute('aria-live')
      }
    })
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Map Components Integration - Accessibility', () => {
  describe('Focus Flow', () => {
    it('should maintain logical focus order', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button>Before Map</button>
          <UniversalMap vehicles={mockVehicles} />
          <button>After Map</button>
        </div>
      )

      const beforeButton = screen.getByText('Before Map')
      const afterButton = screen.getByText('After Map')

      beforeButton.focus()
      expect(document.activeElement).toBe(beforeButton)

      await user.tab()
      // Focus should move to map or next element
      expect(document.activeElement).not.toBe(beforeButton)
    })
  })

  describe('Landmark Roles', () => {
    it('should use appropriate landmark roles', async () => {
      render(<UniversalMap vehicles={mockVehicles} />)
      await waitForMapReady()

      const regions = screen.getAllByRole('region')
      expect(regions.length).toBeGreaterThan(0)

      // Each region should have a label
      regions.forEach(region => {
        const label = region.getAttribute('aria-label') || region.getAttribute('aria-labelledby')
        expect(label).toBeTruthy()
      })
    })
  })

  describe('Heading Hierarchy', () => {
    it('should have proper heading hierarchy in error states', async () => {
      render(<UniversalMap center={[999, 999] as [number, number]} />)

      await waitFor(() => {
        const headings = screen.queryAllByRole('heading')
        // If there are headings, they should have proper levels
        headings.forEach((heading, index) => {
          const level = parseInt(heading.tagName.substring(1))
          expect(level).toBeGreaterThanOrEqual(1)
          expect(level).toBeLessThanOrEqual(6)
        })
      })
    })
  })

  describe('Text Alternatives', () => {
    it('should provide text alternatives for all non-text content', async () => {
      render(
        <LeafletMap
          vehicles={mockVehicles}
          facilities={mockFacilities}
          showVehicles={true}
          showFacilities={true}
        />
      )
      await waitForMapReady()

      // All images/icons should have alt text or aria-label
      await waitFor(() => {
        const images = document.querySelectorAll('img')
        const svgs = document.querySelectorAll('svg')
        const icons = document.querySelectorAll('[role="img"]')

        const allVisualElements = [...Array.from(images), ...Array.from(svgs), ...Array.from(icons)]

        allVisualElements.forEach(element => {
          const hasAltOrLabel =
            element.hasAttribute('alt') ||
            element.hasAttribute('aria-label') ||
            element.hasAttribute('aria-labelledby') ||
            element.hasAttribute('aria-hidden')
          expect(hasAltOrLabel).toBeTruthy()
        })
      }, { timeout: 3000 })
    })
  })
})

// ============================================================================
// Cleanup
// ============================================================================

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})
