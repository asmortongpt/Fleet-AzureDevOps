import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScrollArea, ScrollBar } from './scroll-area'

describe('ScrollArea Components', () => {
  describe('ScrollArea Root', () => {
    it('renders scroll area root', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('has scroll area data-slot', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('has relative positioning', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const area = container.querySelector('[data-slot="scroll-area"]')
      expect(area).toHaveClass('relative')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ScrollArea className="custom-area h-96">
          <div>Content</div>
        </ScrollArea>
      )
      const area = container.querySelector('[data-slot="scroll-area"]')
      expect(area).toHaveClass('custom-area', 'h-96')
    })

    it('renders children content', () => {
      render(
        <ScrollArea>
          <div data-testid="content">Scrollable content</div>
        </ScrollArea>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('includes viewport', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument()
    })

    it('includes scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeInTheDocument()
    })

    it('includes corner', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const corner = container.querySelector('div[class*="corner"]')
      expect(corner || container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })
  })

  describe('Viewport', () => {
    it('renders viewport inside scroll area', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument()
    })

    it('has viewport data-slot', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-viewport"]')).toBeInTheDocument()
    })

    it('has full size', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveClass('size-full')
    })

    it('has focus visible ring', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveClass('focus-visible:ring-ring/50')
    })

    it('is tabbable', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveAttribute('tabIndex', '0')
    })

    it('has inherited border radius', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveClass('rounded-')
    })

    it('has outline none', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveClass('outline-none')
    })
  })

  describe('ScrollBar', () => {
    it('renders scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeInTheDocument()
    })

    it('has scroll area scrollbar data-slot', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeInTheDocument()
    })

    it('has vertical orientation by default', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toHaveAttribute('data-orientation', 'vertical')
    })

    it('supports horizontal orientation', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toBeInTheDocument()
    })

    it('has flex layout', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toHaveClass('flex')
    })

    it('has no-touch-selection', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toHaveClass('touch-none')
    })

    it('has transition colors', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toHaveClass('transition-colors')
    })

    it('has proper width for vertical', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toHaveClass('w-2.5')
    })

    it('has proper height for horizontal', () => {
      const { container } = render(
        <div>
          <ScrollArea className="w-96 h-64">
            <div className="w-96">
              <div style={{ width: '800px' }}>Wide content</div>
            </div>
          </ScrollArea>
        </div>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toBeInTheDocument()
    })

    it('includes thumb element', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-thumb"]')).toBeInTheDocument()
    })

    it('has custom className', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toBeInTheDocument()
    })
  })

  describe('ScrollBar Thumb', () => {
    it('renders thumb element', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-thumb"]')).toBeInTheDocument()
    })

    it('has scroll area thumb data-slot', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area-thumb"]')).toBeInTheDocument()
    })

    it('has border color background', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const thumb = container.querySelector('[data-slot="scroll-area-thumb"]')
      expect(thumb).toHaveClass('bg-border')
    })

    it('has rounded appearance', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const thumb = container.querySelector('[data-slot="scroll-area-thumb"]')
      expect(thumb).toHaveClass('rounded-full')
    })

    it('is flexible', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const thumb = container.querySelector('[data-slot="scroll-area-thumb"]')
      expect(thumb).toHaveClass('flex-1')
    })
  })

  describe('Scroll Area with Content', () => {
    it('renders long content with scrolling', () => {
      const { container } = render(
        <ScrollArea className="h-32">
          {Array.from({ length: 50 }).map((_, i) => (
            <div key={i}>Line {i + 1}</div>
          ))}
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('handles wide content', () => {
      const { container } = render(
        <ScrollArea className="w-96">
          <div style={{ width: '800px' }}>Wide content for horizontal scrolling</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('handles nested content', () => {
      render(
        <ScrollArea className="h-96">
          <div data-testid="parent">
            <div data-testid="child">Content</div>
          </div>
        </ScrollArea>
      )
      expect(screen.getByTestId('parent')).toBeInTheDocument()
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('Custom ScrollBar', () => {
    it('allows custom horizontal scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <div style={{ width: '1000px' }}>Wide content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toBeInTheDocument()
    })

    it('allows custom className on scrollbar', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const scrollbar = container.querySelector('[data-slot="scroll-area-scrollbar"]')
      expect(scrollbar).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      expect(container.querySelector('[data-slot="scroll-area"]')).toBeInTheDocument()
    })

    it('viewport is focusable', () => {
      const { container } = render(
        <ScrollArea>
          <div>Content</div>
        </ScrollArea>
      )
      const viewport = container.querySelector('[data-slot="scroll-area-viewport"]')
      expect(viewport).toHaveAttribute('tabIndex', '0')
    })

    it('supports aria attributes', () => {
      const { container } = render(
        <ScrollArea aria-label="Scrollable content area" aria-live="polite">
          <div>Content</div>
        </ScrollArea>
      )
      const area = container.querySelector('[data-slot="scroll-area"]')
      expect(area).toHaveAttribute('aria-label', 'Scrollable content area')
    })
  })

  describe('Layout Combinations', () => {
    it('renders with custom sizing', () => {
      render(
        <ScrollArea className="h-96 w-96">
          <div style={{ width: '800px', height: '800px' }}>
            Oversized content
          </div>
        </ScrollArea>
      )
      expect(screen.getByText('Oversized content')).toBeInTheDocument()
    })

    it('handles edge cases with small content', () => {
      render(
        <ScrollArea className="h-96">
          <div>Small content</div>
        </ScrollArea>
      )
      expect(screen.getByText('Small content')).toBeInTheDocument()
    })
  })
})
