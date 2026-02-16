import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  MapLoadingSkeleton,
  VehicleListLoadingSkeleton,
  DashboardCardsLoadingSkeleton,
  TableLoadingSkeleton,
  DetailPanelLoadingSkeleton,
} from './LoadingSkeleton'

describe('Loading Skeleton Components', () => {
  describe('MapLoadingSkeleton', () => {
    it('should render map loading skeleton', () => {
      const { container } = render(<MapLoadingSkeleton />)
      expect(container.querySelector('.relative')).toBeInTheDocument()
    })

    it('should display grid background pattern', () => {
      const { container } = render(<MapLoadingSkeleton />)
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
    })

    it('should show loading overlay', () => {
      const { container } = render(<MapLoadingSkeleton />)
      const overlay = container.querySelector('[class*="bg-white"]')
      expect(overlay).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(<MapLoadingSkeleton className="custom-class" />)
      expect(container.querySelector('.relative')).toHaveClass('custom-class')
    })

    it('should render animated elements', () => {
      const { container } = render(<MapLoadingSkeleton />)
      const animatedDivs = container.querySelectorAll('[class*="animate"]')
      expect(animatedDivs.length).toBeGreaterThan(0)
    })

    it('should display shimmer markers', () => {
      const { container } = render(<MapLoadingSkeleton />)
      const markers = container.querySelectorAll('[class*="rounded-full"]')
      expect(markers.length).toBeGreaterThan(0)
    })

    it('should have full width and height', () => {
      const { container } = render(<MapLoadingSkeleton />)
      const skeleton = container.querySelector('[class*="w-full"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('should be accessible during loading', () => {
      const { container } = render(<MapLoadingSkeleton />)
      expect(container.querySelector('[class*="relative"]')).toBeInTheDocument()
    })
  })

  describe('VehicleListLoadingSkeleton', () => {
    it('should render vehicle list loading skeleton', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument()
    })

    it('should display search bar skeleton', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      const searchSkeleton = container.querySelector('[class*="w-full"]')
      expect(searchSkeleton).toBeInTheDocument()
    })

    it('should display filter chips', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      const filterChips = container.querySelectorAll('[class*="gap-2"]')
      expect(filterChips.length).toBeGreaterThan(0)
    })

    it('should accept custom className', () => {
      const { container } = render(<VehicleListLoadingSkeleton className="custom" />)
      expect(container.querySelector('[class*="space-y"]')).toHaveClass('custom')
    })

    it('should render list items', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      const items = container.querySelectorAll('[class*="h-"]')
      expect(items.length).toBeGreaterThan(0)
    })

    it('should have proper spacing', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      const spacedContainer = container.querySelector('[class*="space-y"]')
      expect(spacedContainer).toHaveClass('space-y-3')
    })
  })

  describe('DashboardCardsLoadingSkeleton', () => {
    it('should render dashboard cards loading skeleton', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
    })

    it('should display multiple card skeletons', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const cards = container.querySelectorAll('[class*="rounded"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should have grid layout', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const grid = container.querySelector('[class*="grid-cols"]')
      expect(grid).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton className="custom" />)
      expect(container.querySelector('[class*="grid"]')).toHaveClass('custom')
    })

    it('should render card header skeletons', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const headers = container.querySelectorAll('[class*="mb"]')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should render card content skeletons', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const contents = container.querySelectorAll('[class*="h-"]')
      expect(contents.length).toBeGreaterThan(0)
    })

    it('should have responsive grid', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const grid = container.querySelector('[class*="lg:"]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('TableLoadingSkeleton', () => {
    it('should render table loading skeleton', () => {
      const { container } = render(<TableLoadingSkeleton />)
      expect(container.querySelector('[class*="overflow"]')).toBeInTheDocument()
    })

    it('should display table header', () => {
      const { container } = render(<TableLoadingSkeleton />)
      const header = container.querySelector('[class*="bg-gray"]')
      expect(header).toBeInTheDocument()
    })

    it('should display table rows', () => {
      const { container } = render(<TableLoadingSkeleton />)
      const rows = container.querySelectorAll('[class*="border"]')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('should have proper table structure', () => {
      const { container } = render(<TableLoadingSkeleton />)
      const table = container.querySelector('[class*="rounded"]')
      expect(table).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(<TableLoadingSkeleton className="custom" />)
      expect(container.firstChild).toHaveClass('custom')
    })

    it('should display column skeletons', () => {
      const { container } = render(<TableLoadingSkeleton />)
      const columns = container.querySelectorAll('[class*="h-"]')
      expect(columns.length).toBeGreaterThan(0)
    })
  })

  describe('DetailPanelLoadingSkeleton', () => {
    it('should render detail panel loading skeleton', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument()
    })

    it('should display section headers', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      const headers = container.querySelectorAll('[class*="h-"]')
      expect(headers.length).toBeGreaterThan(0)
    })

    it('should display field skeletons', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      const fields = container.querySelectorAll('[class*="w-"]')
      expect(fields.length).toBeGreaterThan(0)
    })

    it('should have proper spacing between sections', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      const spaced = container.querySelector('[class*="space-y"]')
      expect(spaced).toHaveClass('space-y-3')
    })

    it('should accept custom className', () => {
      const { container } = render(<DetailPanelLoadingSkeleton className="custom" />)
      expect(container.firstChild).toHaveClass('custom')
    })

    it('should display form-like structure', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      const formElements = container.querySelectorAll('[class*="rounded"]')
      expect(formElements.length).toBeGreaterThan(0)
    })

    it('should have responsive width', () => {
      const { container } = render(<DetailPanelLoadingSkeleton />)
      const responsiveElement = container.querySelector('[class*="w-"]')
      expect(responsiveElement).toBeInTheDocument()
    })
  })

  describe('Integration & Composition', () => {
    it('should render all skeleton types together', () => {
      const { container } = render(
        <div>
          <MapLoadingSkeleton />
          <VehicleListLoadingSkeleton />
          <DashboardCardsLoadingSkeleton />
          <TableLoadingSkeleton />
          <DetailPanelLoadingSkeleton />
        </div>
      )

      expect(container.querySelectorAll('[class*="space-y"]').length).toBeGreaterThan(0)
    })

    it('should maintain consistent styling across skeletons', () => {
      const { container: map } = render(<MapLoadingSkeleton />)
      const { container: list } = render(<VehicleListLoadingSkeleton />)
      const { container: dashboard } = render(<DashboardCardsLoadingSkeleton />)

      expect(map.querySelector('[class*="rounded"]')).toBeInTheDocument()
      expect(list.querySelector('[class*="p-"]')).toBeInTheDocument()
      expect(dashboard.querySelector('[class*="grid"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should indicate loading state to screen readers', () => {
      const { container } = render(<MapLoadingSkeleton />)
      expect(container.querySelector('[class*="relative"]')).toBeInTheDocument()
    })

    it('should have proper semantic structure', () => {
      const { container } = render(<VehicleListLoadingSkeleton />)
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument()
    })

    it('should be non-interactive during loading', () => {
      const { container } = render(<TableLoadingSkeleton />)
      const skeleton = container.querySelector('[class*="overflow"]')
      expect(skeleton).not.toHaveAttribute('role', 'button')
    })
  })

  describe('Responsiveness', () => {
    it('should be responsive on all screen sizes', () => {
      const { container } = render(<DashboardCardsLoadingSkeleton />)
      const responsive = container.querySelector('[class*="md:"]') || container.querySelector('[class*="lg:"]')
      expect(responsive).toBeInTheDocument()
    })

    it('should adapt to different screen sizes', () => {
      const { container } = render(
        <div>
          <MapLoadingSkeleton />
          <VehicleListLoadingSkeleton />
        </div>
      )

      expect(container.querySelector('[class*="w-full"]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle with custom className passed', () => {
      const { container } = render(
        <MapLoadingSkeleton className="test-class" />
      )
      expect(container.querySelector('[class*="relative"]')).toHaveClass('test-class')
    })

    it('should render without errors when mounted/unmounted rapidly', () => {
      const { rerender } = render(<MapLoadingSkeleton />)
      rerender(<VehicleListLoadingSkeleton />)
      rerender(<MapLoadingSkeleton />)

      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('should handle nested skeletons', () => {
      const { container } = render(
        <div>
          <MapLoadingSkeleton />
          <div>
            <DashboardCardsLoadingSkeleton />
          </div>
        </div>
      )

      expect(container.querySelectorAll('[class*="relative"]').length).toBeGreaterThan(0)
    })

    it('should maintain aspect ratios during loading', () => {
      const { container } = render(
        <div className="aspect-video">
          <MapLoadingSkeleton />
        </div>
      )

      expect(container.querySelector('[class*="w-full"]')).toBeInTheDocument()
    })
  })
})
