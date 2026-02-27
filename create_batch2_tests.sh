#!/bin/bash

# Create validation-indicator test
cat > /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components/ui/validation-indicator.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ValidationIndicator } from './validation-indicator'

describe('ValidationIndicator Component', () => {
  describe('Rendering', () => {
    it('should render valid state', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render invalid state', () => {
      const { container } = render(<ValidationIndicator state="invalid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render idle state', () => {
      const { container } = render(<ValidationIndicator state="idle" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with message', () => {
      render(<ValidationIndicator state="invalid" message="Error text" />)
      expect(screen.getByText('Error text')).toBeInTheDocument()
    })

    it('should have icon for each state', () => {
      const { container: validContainer } = render(<ValidationIndicator state="valid" />)
      expect(validContainer.querySelector('svg')).toBeInTheDocument()

      const { container: invalidContainer } = render(<ValidationIndicator state="invalid" />)
      expect(invalidContainer.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply success color for valid state', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      const icon = container.querySelector('[class*="text-green"]')
      expect(icon).toBeInTheDocument()
    })

    it('should apply error color for invalid state', () => {
      const { container } = render(<ValidationIndicator state="invalid" />)
      const icon = container.querySelector('[class*="text-red"]')
      expect(icon).toBeInTheDocument()
    })

    it('should have appropriate size classes', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-4')
      expect(icon).toHaveClass('w-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle long error messages', () => {
      const longMsg = 'A'.repeat(100)
      render(<ValidationIndicator state="invalid" message={longMsg} />)
      expect(screen.getByText(longMsg)).toBeInTheDocument()
    })

    it('should handle missing message', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle all state variants', () => {
      const states = ['valid', 'invalid', 'idle'] as const
      states.forEach(state => {
        const { unmount } = render(<ValidationIndicator state={state} />)
        expect(document.body).toContainElement(document.body.firstChild)
        unmount()
      })
    })
  })
})
EOF

# Create empty-state test
cat > /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components/ui/empty-state.test.tsx << 'EOF'
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
EOF

# Create pagination test
cat > /Users/andrewmorton/Documents/GitHub/Fleet-CTA/src/components/ui/pagination.test.tsx << 'EOF'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination'

describe('Pagination Component', () => {
  describe('Rendering', () => {
    it('should render pagination nav', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
          </PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('should render pagination content', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Test</PaginationContent>
        </Pagination>
      )
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should render pagination item', () => {
      const { container } = render(
        <PaginationItem><button>1</button></PaginationItem>
      )
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should render pagination link', () => {
      render(
        <PaginationLink href="#1">
          1
        </PaginationLink>
      )
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should render previous button', () => {
      render(
        <PaginationPrevious href="#" />
      )
      const prev = screen.getByRole('link')
      expect(prev).toBeInTheDocument()
    })

    it('should render next button', () => {
      render(
        <PaginationNext href="#" />
      )
      const next = screen.getByRole('link')
      expect(next).toBeInTheDocument()
    })

    it('should render ellipsis', () => {
      const { container } = render(
        <PaginationEllipsis />
      )
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have flex layout', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument()
    })

    it('should have proper spacing', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('[class*="gap"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have nav role', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('should have aria-label on nav', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('aria-label')
    })

    it('should hide ellipsis from screen readers', () => {
      const { container } = render(
        <PaginationEllipsis />
      )
      const ellipsis = container.querySelector('[aria-hidden="true"]')
      expect(ellipsis).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle many pagination items', () => {
      const items = Array.from({ length: 10 }, (_, i) => (
        <PaginationItem key={i}>
          <PaginationLink href={`#${i}`}>{i + 1}</PaginationLink>
        </PaginationItem>
      ))

      render(
        <Pagination>
          <PaginationContent>{items}</PaginationContent>
        </Pagination>
      )

      Array.from({ length: 10 }, (_, i) => {
        expect(screen.getByText(String(i + 1))).toBeInTheDocument()
      })
    })
  })
})
EOF

echo "Phase 2b test files created successfully"
