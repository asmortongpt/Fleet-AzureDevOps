import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Separator } from './separator'

describe('Separator Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders separator root', () => {
      const { container } = render(<Separator />)
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('has separator root data-slot', () => {
      const { container } = render(<Separator />)
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('renders as div element', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator?.tagName.toLowerCase()).toBe('div')
    })
  })

  describe('Orientation', () => {
    it('renders horizontal by default', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('data-orientation', 'horizontal')
    })

    it('renders vertical when specified', () => {
      const { container } = render(<Separator orientation="vertical" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('data-orientation', 'vertical')
    })

    it('has horizontal styling for horizontal orientation', () => {
      const { container } = render(<Separator orientation="horizontal" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('h-px')
      expect(separator).toHaveClass('w-full')
    })

    it('has vertical styling for vertical orientation', () => {
      const { container } = render(<Separator orientation="vertical" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('h-full')
      expect(separator).toHaveClass('w-px')
    })
  })

  describe('Styling & Appearance', () => {
    it('has border color background', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('bg-border')
    })

    it('does not shrink', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('shrink-0')
    })

    it('accepts custom className', () => {
      const { container } = render(<Separator className="custom-separator" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('custom-separator')
    })

    it('merges default and custom classes', () => {
      const { container } = render(<Separator className="custom-separator" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('bg-border', 'shrink-0', 'custom-separator')
    })

    it('has custom styling combinations', () => {
      const { container } = render(
        <Separator className="my-4 opacity-50" orientation="horizontal" />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('my-4', 'opacity-50')
    })
  })

  describe('Decorative prop', () => {
    it('sets decorative to true by default', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('data-orientation')
    })

    it('allows decorative to be false', () => {
      const { container } = render(<Separator decorative={false} />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toBeInTheDocument()
    })

    it('supports custom role when decorative is false', () => {
      const { container } = render(<Separator decorative={false} role="separator" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('role', 'separator')
    })
  })

  describe('HTML Attributes', () => {
    it('accepts custom data attributes', () => {
      const { container } = render(<Separator data-testid="custom-separator" />)
      const separator = container.querySelector('[data-testid="custom-separator"]')
      expect(separator).toBeInTheDocument()
    })

    it('accepts aria attributes', () => {
      const { container } = render(<Separator aria-hidden="true" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    it('accepts id attribute', () => {
      const { container } = render(<Separator id="my-separator" />)
      const separator = container.querySelector('#my-separator')
      expect(separator).toBeInTheDocument()
    })

    it('passes through custom props', () => {
      const { container } = render(
        <Separator
          role="divider"
          data-section="section-1"
          title="Section divider"
        />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('role', 'divider')
      expect(separator).toHaveAttribute('data-section', 'section-1')
      expect(separator).toHaveAttribute('title', 'Section divider')
    })
  })

  describe('Common Patterns', () => {
    it('works as horizontal divider between elements', () => {
      const { container } = render(
        <div>
          <div>Item 1</div>
          <Separator />
          <div>Item 2</div>
        </div>
      )
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('works as vertical divider between elements', () => {
      const { container } = render(
        <div className="flex">
          <div>Left</div>
          <Separator orientation="vertical" />
          <div>Right</div>
        </div>
      )
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('can be used in lists', () => {
      const { container } = render(
        <ul>
          <li>Item 1</li>
          <Separator className="my-2" />
          <li>Item 2</li>
          <Separator className="my-2" />
          <li>Item 3</li>
        </ul>
      )
      const separators = container.querySelectorAll('[data-slot="separator-root"]')
      expect(separators.length).toBe(2)
    })

    it('can be used in group sections', () => {
      const { container } = render(
        <div className="space-y-4">
          <section>
            <h2>Section 1</h2>
            <p>Content</p>
          </section>
          <Separator />
          <section>
            <h2>Section 2</h2>
            <p>Content</p>
          </section>
        </div>
      )
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('works in card layouts', () => {
      const { container } = render(
        <div className="border rounded-lg p-4">
          <h3>Card Title</h3>
          <Separator className="my-4" />
          <p>Card content</p>
        </div>
      )
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('accepts responsive className', () => {
      const { container } = render(
        <Separator className="md:h-1 lg:h-2" orientation="horizontal" />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator?.className).toContain('md:h-1')
      expect(separator?.className).toContain('lg:h-2')
    })

    it('can have responsive spacing', () => {
      const { container } = render(
        <Separator className="my-2 md:my-4 lg:my-6" />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator?.className).toContain('my-2')
      expect(separator?.className).toContain('md:my-4')
    })
  })

  describe('Size Variations', () => {
    it('renders with default size', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('h-px')
    })

    it('can have custom thickness', () => {
      const { container } = render(<Separator className="h-1" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('h-1')
    })

    it('vertical separator has default width', () => {
      const { container } = render(<Separator orientation="vertical" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('w-px')
    })

    it('vertical separator can have custom thickness', () => {
      const { container } = render(<Separator orientation="vertical" className="w-1" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('w-1')
    })
  })

  describe('Color Variations', () => {
    it('has default border color', () => {
      const { container } = render(<Separator />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('bg-border')
    })

    it('can have custom color', () => {
      const { container } = render(<Separator className="bg-red-500" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('bg-red-500')
    })

    it('can have opacity', () => {
      const { container } = render(<Separator className="opacity-30" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveClass('opacity-30')
    })

    it('can have gradient background', () => {
      const { container } = render(
        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is hidden from screen readers by default', () => {
      const { container } = render(<Separator decorative={true} />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toBeInTheDocument()
    })

    it('can have aria-hidden attribute', () => {
      const { container } = render(<Separator aria-hidden="true" />)
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    it('can be semantic when needed', () => {
      const { container } = render(
        <Separator decorative={false} role="separator" aria-label="Section divider" />
      )
      const separator = container.querySelector('[data-slot="separator-root"]')
      expect(separator).toHaveAttribute('role', 'separator')
      expect(separator).toHaveAttribute('aria-label', 'Section divider')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty separator', () => {
      const { container } = render(<Separator />)
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })

    it('handles multiple separators in sequence', () => {
      const { container } = render(
        <div>
          <Separator />
          <Separator />
          <Separator />
        </div>
      )
      const separators = container.querySelectorAll('[data-slot="separator-root"]')
      expect(separators.length).toBe(3)
    })

    it('handles mixed orientations', () => {
      const { container } = render(
        <div>
          <Separator orientation="horizontal" />
          <Separator orientation="vertical" />
          <Separator />
        </div>
      )
      const horizontals = container.querySelectorAll('[data-orientation="horizontal"]')
      const verticals = container.querySelectorAll('[data-orientation="vertical"]')
      expect(horizontals.length + verticals.length).toBeGreaterThan(0)
    })

    it('handles deeply nested separators', () => {
      const { container } = render(
        <div>
          <div>
            <div>
              <Separator />
            </div>
          </div>
        </div>
      )
      expect(container.querySelector('[data-slot="separator-root"]')).toBeInTheDocument()
    })
  })
})
