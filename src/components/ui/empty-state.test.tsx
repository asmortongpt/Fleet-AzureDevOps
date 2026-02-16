import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState Component', () => {
  describe('Rendering', () => {
    it('should render empty state container', () => {
      const { container } = render(<EmptyState title="No data" />)
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument()
    })

    it('should display title', () => {
      render(<EmptyState title="No results" />)
      expect(screen.getByText('No results')).toBeInTheDocument()
    })

    it('should display description when provided', () => {
      render(<EmptyState title="Empty" description="No items found" />)
      expect(screen.getByText('No items found')).toBeInTheDocument()
    })

    it('should render action button when provided', () => {
      render(
        <EmptyState
          title="Empty"
          actionLabel="Create New"
          onAction={() => {}}
        />
      )
      expect(screen.getByText('Create New')).toBeInTheDocument()
    })

    it('should render icon', () => {
      const { container } = render(<EmptyState title="Empty" />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have centered layout', () => {
      const { container } = render(<EmptyState title="Empty" />)
      const flex = container.querySelector('[class*="flex"]')
      expect(flex).toHaveClass('items-center')
      expect(flex).toHaveClass('justify-center')
    })

    it('should have vertical layout', () => {
      const { container } = render(<EmptyState title="Empty" />)
      const flex = container.querySelector('[class*="flex"]')
      expect(flex).toHaveClass('flex-col')
    })

    it('should have proper spacing', () => {
      const { container } = render(<EmptyState title="Empty" />)
      const spaced = container.querySelector('[class*="space-y"]')
      expect(spaced).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100)
      render(<EmptyState title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very long description', () => {
      const longDesc = 'B'.repeat(200)
      render(<EmptyState title="Title" description={longDesc} />)
      expect(screen.getByText(longDesc.substring(0, 100))).toBeInTheDocument()
    })

    it('should work without optional props', () => {
      const { container } = render(<EmptyState title="Minimal" />)
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
