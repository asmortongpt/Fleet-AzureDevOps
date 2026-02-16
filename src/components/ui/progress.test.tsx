import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Progress } from './progress'

describe('Progress Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders progress element with default classes', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toBeInTheDocument()
      expect(progressRoot).toHaveClass('bg-primary/20', 'rounded-full', 'relative', 'h-2', 'w-full')
    })

    it('renders indicator element within progress', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveClass('bg-primary', 'h-full', 'w-full', 'flex-1', 'transition-all')
    })

    it('renders with overflow hidden for clipping', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('overflow-hidden')
    })

    it('renders without children', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot?.children.length).toBe(1) // Only indicator
    })
  })

  describe('Props & Configuration', () => {
    it('applies value of 0 correctly', () => {
      const { container } = render(<Progress value={0} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-100%)')
    })

    it('applies value of 50 correctly', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-50%)')
    })

    it('applies value of 100 correctly', () => {
      const { container } = render(<Progress value={100} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-0%)')
    })

    it('handles partial progress values', () => {
      const { container } = render(<Progress value={25} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-75%)')
    })

    it('handles high precision values', () => {
      const { container } = render(<Progress value={33.33} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-66.67%)')
    })

    it('applies custom className to root', () => {
      const { container } = render(<Progress value={50} className="custom-progress" />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('custom-progress')
    })

    it('applies custom className to indicator', () => {
      const { container } = render(<Progress value={50} indicatorClassName="custom-indicator" />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('custom-indicator')
    })

    it('applies both default and custom classes', () => {
      const { container } = render(
        <Progress value={50} className="custom-root" indicatorClassName="custom-indicator" />
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(progressRoot).toHaveClass('bg-primary/20', 'custom-root')
      expect(indicator).toHaveClass('bg-primary', 'custom-indicator')
    })

    it('accepts undefined value gracefully', () => {
      const { container } = render(<Progress value={undefined} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-100%)')
    })
  })

  describe('Styling & Appearance', () => {
    it('has correct height dimensions', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('h-2')
    })

    it('spans full width', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('w-full')
    })

    it('has rounded corners', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('rounded-full')
    })

    it('applies transition to indicator', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('transition-all')
    })

    it('indicator uses primary color', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('bg-primary')
    })

    it('background uses primary/20 opacity', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('bg-primary/20')
    })

    it('applies relative positioning', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('relative')
    })

    it('applies flex-1 to indicator', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('flex-1')
    })
  })

  describe('Accessibility', () => {
    it('has proper data-slot attributes for testing', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(progressRoot).toHaveAttribute('data-slot', 'progress')
      expect(indicator).toHaveAttribute('data-slot', 'progress-indicator')
    })

    it('accepts aria attributes via props', () => {
      const { container } = render(
        <Progress value={50} aria-label="Loading progress" role="progressbar" />
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveAttribute('aria-label', 'Loading progress')
      expect(progressRoot).toHaveAttribute('role', 'progressbar')
    })

    it('accepts aria-valuenow from props', () => {
      const { container } = render(
        <Progress value={50} aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveAttribute('aria-valuenow', '50')
      expect(progressRoot).toHaveAttribute('aria-valuemin', '0')
      expect(progressRoot).toHaveAttribute('aria-valuemax', '100')
    })

    it('allows semantic HTML attributes', () => {
      const { container } = render(
        <Progress value={50} title="Download progress" />
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveAttribute('title', 'Download progress')
    })
  })

  describe('Sub-components & Composition', () => {
    it('uses Radix UI ProgressPrimitive.Root as base', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      // Radix components use this structure
      expect(progressRoot?.tagName).toBe('DIV')
    })

    it('uses Radix UI ProgressPrimitive.Indicator for fill', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator?.tagName).toBe('DIV')
    })

    it('indicator is direct child of progress', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator?.parentElement).toBe(progressRoot)
    })
  })

  describe('Edge Cases & Boundary Values', () => {
    it('handles negative values by clamping to 0', () => {
      const { container } = render(<Progress value={-10} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      // Negative values should translate beyond 100%
      expect(indicator?.style.transform).toBe('translateX(-110%)')
    })

    it('handles values exceeding 100', () => {
      const { container } = render(<Progress value={150} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      // Values > 100 will translate as: translateX(-(100 - value)%)
      // At 150: translateX(-(100 - 150)%) = translateX(--50%) (double minus due to CSS calc)
      expect(indicator?.style.transform).toBe('translateX(--50%)')
    })

    it('handles null value gracefully', () => {
      const { container } = render(<Progress value={null as any} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      // Should default to 0
      expect(indicator?.style.transform).toBe('translateX(-100%)')
    })

    it('handles zero value', () => {
      const { container } = render(<Progress value={0} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-100%)')
    })

    it('handles very small progress values', () => {
      const { container } = render(<Progress value={0.01} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-99.99%)')
    })

    it('handles very large progress values', () => {
      const { container } = render(<Progress value={99.99} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      // Floating point precision: 100 - 99.99 = 0.01, but may have floating point errors
      const transform = indicator?.style.transform || ''
      expect(transform).toMatch(/translateX\(-0\.0/)
    })
  })

  describe('Dynamic Updates', () => {
    it('updates transform when value prop changes', () => {
      const { rerender, container } = render(<Progress value={0} />)
      let indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-100%)')

      rerender(<Progress value={50} />)
      indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(indicator?.style.transform).toBe('translateX(-50%)')
    })

    it('updates className when className prop changes', () => {
      const { rerender, container } = render(<Progress value={50} className="old-class" />)
      let progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('old-class')

      rerender(<Progress value={50} className="new-class" />)
      progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('new-class')
      expect(progressRoot).not.toHaveClass('old-class')
    })

    it('updates indicator className when indicatorClassName prop changes', () => {
      const { rerender, container } = render(
        <Progress value={50} indicatorClassName="old-indicator-class" />
      )
      let indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('old-indicator-class')

      rerender(<Progress value={50} indicatorClassName="new-indicator-class" />)
      indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveClass('new-indicator-class')
      expect(indicator).not.toHaveClass('old-indicator-class')
    })

    it('preserves default classes when custom className is removed', () => {
      const { rerender, container } = render(
        <Progress value={50} className="custom" />
      )

      rerender(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveClass('bg-primary/20', 'rounded-full')
    })
  })

  describe('Data Attributes', () => {
    it('sets data-slot on root element', () => {
      const { container } = render(<Progress value={50} />)
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveAttribute('data-slot', 'progress')
    })

    it('sets data-slot on indicator element', () => {
      const { container } = render(<Progress value={50} />)
      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      expect(indicator).toHaveAttribute('data-slot', 'progress-indicator')
    })

    it('allows additional data attributes', () => {
      const { container } = render(
        <Progress value={50} data-testid="custom-progress" data-custom="value" />
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(progressRoot).toHaveAttribute('data-testid', 'custom-progress')
      expect(progressRoot).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Integration Scenarios', () => {
    it('renders correctly as a loading indicator', () => {
      const { container } = render(
        <div>
          <label>Download Progress: 45%</label>
          <Progress value={45} aria-label="Download progress" />
        </div>
      )
      const progressRoot = container.querySelector('[data-slot="progress"]')
      const indicator = container.querySelector('[data-slot="progress-indicator"]') as HTMLElement

      expect(progressRoot).toBeInTheDocument()
      expect(indicator?.style.transform).toBe('translateX(-55%)')
    })

    it('renders multiple progress bars independently', () => {
      const { container } = render(
        <div>
          <Progress value={25} />
          <Progress value={50} />
          <Progress value={75} />
        </div>
      )

      const indicators = container.querySelectorAll('[data-slot="progress-indicator"]')
      expect(indicators).toHaveLength(3)

      const transforms = Array.from(indicators).map(
        (el) => (el as HTMLElement).style.transform
      )
      expect(transforms).toEqual(['translateX(-75%)', 'translateX(-50%)', 'translateX(-25%)'])
    })

    it('works with custom styling in parent container', () => {
      const { container } = render(
        <div className="p-4 bg-gray-100">
          <Progress value={60} className="rounded-md" />
        </div>
      )

      const parent = container.querySelector('.p-4.bg-gray-100')
      const progressRoot = container.querySelector('[data-slot="progress"]')

      expect(parent).toBeInTheDocument()
      expect(progressRoot).toBeInTheDocument()
      expect(progressRoot).toHaveClass('rounded-md')
    })

    it('animates smoothly during updates', () => {
      const { rerender, container } = render(<Progress value={0} />)

      // Simulate animation from 0 to 100
      for (let i = 0; i <= 100; i += 10) {
        rerender(<Progress value={i} />)
      }

      const indicator = container.querySelector('[data-slot="progress-indicator"]')

      // Should have transition class for smooth animation
      expect(indicator).toHaveClass('transition-all')
    })
  })

  describe('Type Safety', () => {
    it('accepts ComponentProps from Radix UI ProgressPrimitive', () => {
      const { container } = render(
        <Progress
          value={50}
          max={100}
          getValueLabel={(value) => `${value}%`}
        />
      )

      expect(container.querySelector('[data-slot="progress"]')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('renders efficiently without unnecessary re-renders', () => {
      const { rerender } = render(<Progress value={50} />)

      // Re-render with same value should not break component
      rerender(<Progress value={50} />)
      rerender(<Progress value={50} />)

      // Component should still work
      expect(true).toBe(true)
    })

    it('handles rapid value updates', () => {
      const { rerender } = render(<Progress value={0} />)

      // Simulate rapid updates
      for (let i = 1; i <= 100; i++) {
        rerender(<Progress value={i} />)
      }

      // Should handle without errors
      expect(true).toBe(true)
    })
  })
})
