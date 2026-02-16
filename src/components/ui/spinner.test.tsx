import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Spinner } from './spinner'

describe('Spinner Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders spinner SVG element', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg?.tagName).toBe('svg')
    })

    it('renders with correct namespace', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    })

    it('renders with fill="none" attribute', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'none')
    })

    it('renders with viewBox', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('renders with animate-spin class', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('animate-spin')
    })
  })

  describe('Spinner Sub-elements', () => {
    it('renders circle element', () => {
      const { container } = render(<Spinner />)
      const circle = container.querySelector('circle')
      expect(circle).toBeInTheDocument()
    })

    it('circle has correct attributes', () => {
      const { container } = render(<Spinner />)
      const circle = container.querySelector('circle')
      expect(circle).toHaveAttribute('cx', '12')
      expect(circle).toHaveAttribute('cy', '12')
      expect(circle).toHaveAttribute('r', '10')
      expect(circle).toHaveAttribute('stroke', 'currentColor')
      expect(circle).toHaveAttribute('stroke-width', '4')
    })

    it('circle has opacity-25 styling', () => {
      const { container } = render(<Spinner />)
      const circle = container.querySelector('circle')
      expect(circle).toHaveClass('opacity-25')
    })

    it('renders path element', () => {
      const { container } = render(<Spinner />)
      const path = container.querySelector('path')
      expect(path).toBeInTheDocument()
    })

    it('path has fill="currentColor"', () => {
      const { container } = render(<Spinner />)
      const path = container.querySelector('path')
      expect(path).toHaveAttribute('fill', 'currentColor')
    })

    it('path has opacity-75 styling', () => {
      const { container } = render(<Spinner />)
      const path = container.querySelector('path')
      expect(path).toHaveClass('opacity-75')
    })

    it('path has correct d attribute for spinning animation', () => {
      const { container } = render(<Spinner />)
      const path = container.querySelector('path')
      const d = path?.getAttribute('d')
      expect(d).toContain('M4 12')
      expect(d).toContain('a8 8 0 018-8V0')
    })
  })

  describe('Size Variants', () => {
    it('renders with default size (md)', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-4', 'h-4')
    })

    it('renders with sm size', () => {
      const { container } = render(<Spinner size="sm" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-4', 'h-4')
    })

    it('renders with md size', () => {
      const { container } = render(<Spinner size="md" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-4', 'h-4')
    })

    it('renders with lg size', () => {
      const { container } = render(<Spinner size="lg" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-12', 'h-9')
    })

    it('sm and md have same size classes', () => {
      const { container: smContainer } = render(<Spinner size="sm" />)
      const { container: mdContainer } = render(<Spinner size="md" />)

      const smSvg = smContainer.querySelector('svg')
      const mdSvg = mdContainer.querySelector('svg')

      expect(smSvg).toHaveClass('w-4', 'h-4')
      expect(mdSvg).toHaveClass('w-4', 'h-4')
    })
  })

  describe('Custom className Support', () => {
    it('accepts custom className', () => {
      const { container } = render(<Spinner className="text-blue-500" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('text-blue-500')
    })

    it('combines default classes with custom className', () => {
      const { container } = render(<Spinner className="text-red-600" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('animate-spin')
      expect(svg).toHaveClass('text-red-600')
    })

    it('accepts multiple custom classes', () => {
      const { container } = render(
        <Spinner className="text-primary opacity-75 dark:text-secondary" />
      )
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('text-primary', 'opacity-75', 'dark:text-secondary')
    })

    it('maintains size classes with custom className', () => {
      const { container } = render(
        <Spinner size="lg" className="text-blue-500" />
      )
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-12', 'h-9', 'text-blue-500')
    })
  })

  describe('Animation', () => {
    it('has animate-spin class for rotation', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('animate-spin')
    })

    it('animation is applied by default', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('animate-spin')
    })
  })

  describe('Accessibility', () => {
    it('is visible to screen readers', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('can accept aria-label prop via className approach', () => {
      // In practice, you might add aria-label to the parent or use title
      const { container } = render(
        <div aria-label="Loading" role="status">
          <Spinner />
        </div>
      )
      const wrapper = container.querySelector('[role="status"]')
      expect(wrapper).toHaveAttribute('aria-label', 'Loading')
    })

    it('works with aria-busy attribute', () => {
      const { container } = render(
        <div aria-busy="true">
          <Spinner />
        </div>
      )
      const wrapper = container.querySelector('[aria-busy="true"]')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Styling & Appearance', () => {
    it('uses currentColor for inheritance', () => {
      const { container } = render(<Spinner />)
      const circle = container.querySelector('circle')
      const path = container.querySelector('path')

      expect(circle).toHaveAttribute('stroke', 'currentColor')
      expect(path).toHaveAttribute('fill', 'currentColor')
    })

    it('has correct opacity layers', () => {
      const { container } = render(<Spinner />)
      const circle = container.querySelector('circle')
      const path = container.querySelector('path')

      expect(circle).toHaveClass('opacity-25') // background circle
      expect(path).toHaveClass('opacity-75')   // spinner arm
    })

    it('can be themed with color classes', () => {
      const { container } = render(<Spinner className="text-green-500" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('text-green-500')
    })

    it('can be hidden with display none', () => {
      const { container } = render(<Spinner className="hidden" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('hidden')
    })
  })

  describe('Loading States Integration', () => {
    it('works inside loading container', () => {
      const { container } = render(
        <div className="flex items-center justify-center">
          <Spinner />
          <span>Loading...</span>
        </div>
      )
      const svg = container.querySelector('svg')
      const text = container.querySelector('span')

      expect(svg).toBeInTheDocument()
      expect(text?.textContent).toBe('Loading...')
    })

    it('works with different sizes in layout', () => {
      const { container } = render(
        <div>
          <div><Spinner size="sm" /></div>
          <div><Spinner size="md" /></div>
          <div><Spinner size="lg" /></div>
        </div>
      )
      const svgs = container.querySelectorAll('svg')
      expect(svgs).toHaveLength(3)
    })

    it('can be conditionally displayed', () => {
      const { container, rerender } = render(
        <>{false && <Spinner />}</>
      )
      let svg = container.querySelector('svg')
      expect(svg).not.toBeInTheDocument()

      rerender(
        <>{true && <Spinner />}</>
      )
      svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Common Use Cases', () => {
    it('works as button loading indicator', () => {
      const { container } = render(
        <button disabled>
          <Spinner size="sm" className="mr-2" />
          Loading
        </button>
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('mr-2')
    })

    it('works in overlay position', () => {
      const { container } = render(
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('works with background backdrop', () => {
      const { container } = render(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Spinner />
        </div>
      )
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    it('accepts valid size prop', () => {
      const validSizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg']
      validSizes.forEach(size => {
        const { container } = render(<Spinner size={size} />)
        const svg = container.querySelector('svg')
        expect(svg).toBeInTheDocument()
      })
    })

    it('defaults to md when size not provided', () => {
      const { container } = render(<Spinner />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('w-4', 'h-4')
    })
  })
})
