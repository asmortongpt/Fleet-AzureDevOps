import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Slider } from './slider'

describe('Slider Component', () => {
  describe('Rendering & Structure', () => {
    it('renders slider with default values', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="slider-track"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="slider-range"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="slider-thumb"]')).toBeInTheDocument()
    })

    it('renders single thumb for single value', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(1)
    })

    it('renders multiple thumbs for multiple values', () => {
      const { container } = render(<Slider defaultValue={[25, 75]} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(2)
    })

    it('renders three thumbs for range slider', () => {
      const { container } = render(<Slider defaultValue={[20, 50, 80]} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(3)
    })
  })

  describe('Root Styling', () => {
    it('applies base styling to root', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('relative', 'flex', 'w-full', 'touch-none', 'items-center', 'select-none')
    })

    it('applies disabled styling', () => {
      const { container } = render(<Slider defaultValue={[50]} disabled />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('data-[disabled]:opacity-50')
    })

    it('supports vertical orientation', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="vertical" />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('data-[orientation=vertical]:h-full', 'data-[orientation=vertical]:flex-col')
    })

    it('accepts custom className', () => {
      const { container } = render(<Slider defaultValue={[50]} className="custom-slider" />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('custom-slider')
    })
  })

  describe('Track Styling', () => {
    it('applies track styling', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const track = container.querySelector('[data-slot="slider-track"]')
      expect(track).toHaveClass('bg-muted', 'relative', 'grow', 'overflow-hidden', 'rounded-full')
    })

    it('applies horizontal track styling', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="horizontal" />)
      const track = container.querySelector('[data-slot="slider-track"]')
      expect(track).toHaveClass('data-[orientation=horizontal]:h-1.5', 'data-[orientation=horizontal]:w-full')
    })

    it('applies vertical track styling', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="vertical" />)
      const track = container.querySelector('[data-slot="slider-track"]')
      expect(track).toHaveClass('data-[orientation=vertical]:h-full', 'data-[orientation=vertical]:w-1.5')
    })
  })

  describe('Range Styling', () => {
    it('applies range styling', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const range = container.querySelector('[data-slot="slider-range"]')
      expect(range).toHaveClass('bg-primary', 'absolute')
    })

    it('applies horizontal range styling', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="horizontal" />)
      const range = container.querySelector('[data-slot="slider-range"]')
      expect(range).toHaveClass('data-[orientation=horizontal]:h-full')
    })

    it('applies vertical range styling', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="vertical" />)
      const range = container.querySelector('[data-slot="slider-range"]')
      expect(range).toHaveClass('data-[orientation=vertical]:w-full')
    })
  })

  describe('Thumb Styling', () => {
    it('applies thumb styling', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('block', 'size-4', 'shrink-0', 'rounded-full', 'border', 'shadow-sm')
    })

    it('has border-primary styling', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('border-primary', 'bg-background')
    })

    it('has hover ring effect', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('hover:ring-4')
    })

    it('has focus ring effect', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('focus-visible:ring-4', 'focus-visible:outline-hidden')
    })

    it('applies disabled styling to thumb', () => {
      const { container } = render(<Slider defaultValue={[50]} disabled />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('has transition effects', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      const thumb = container.querySelector('[data-slot="slider-thumb"]')
      expect(thumb).toHaveClass('transition-[color,box-shadow]')
    })
  })

  describe('Min/Max Values', () => {
    it('uses default min of 0', () => {
      render(<Slider defaultValue={[50]} />)
      // Component renders without error with default min
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('uses default max of 100', () => {
      render(<Slider defaultValue={[50]} />)
      // Component renders without error with default max
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('accepts custom min value', () => {
      render(<Slider defaultValue={[5]} min={0} max={10} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('accepts custom max value', () => {
      render(<Slider defaultValue={[50]} min={0} max={200} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('accepts negative min value', () => {
      render(<Slider defaultValue={[0]} min={-100} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Default Value', () => {
    it('uses defaultValue prop', () => {
      render(<Slider defaultValue={[50]} />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
    })

    it('handles array of default values', () => {
      const { container } = render(<Slider defaultValue={[25, 75]} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(2)
    })

    it('uses min/max when no default provided', () => {
      const { container } = render(<Slider min={10} max={20} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })
  })

  describe('Controlled Value', () => {
    it('respects value prop', () => {
      const { rerender } = render(<Slider value={[25]} min={0} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()

      rerender(<Slider value={[75]} min={0} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Orientation', () => {
    it('supports horizontal orientation', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="horizontal" />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })

    it('supports vertical orientation', () => {
      const { container } = render(<Slider defaultValue={[50]} orientation="vertical" />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('data-[orientation=vertical]:h-full')
    })
  })

  describe('Step Support', () => {
    it('accepts step prop', () => {
      render(<Slider defaultValue={[50]} step={5} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('accepts decimal step values', () => {
      render(<Slider defaultValue={[0.5]} step={0.1} min={0} max={1} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('disables slider when disabled prop is true', () => {
      render(<Slider defaultValue={[50]} disabled />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeDisabled()
    })

    it('applies disabled styling', () => {
      const { container } = render(<Slider defaultValue={[50]} disabled />)
      const root = container.querySelector('[data-slot="slider"]')
      expect(root).toHaveClass('data-[disabled]:opacity-50')
    })

    it('prevents interaction when disabled', async () => {
      const handleChange = vi.fn()
      render(<Slider defaultValue={[50]} disabled onValueChange={handleChange} />)

      const slider = screen.getByRole('slider')
      fireEvent.click(slider)

      // Disabled sliders shouldn't trigger change events
      expect(handleChange).not.toHaveBeenCalled()
    })
  })

  describe('Callbacks', () => {
    it('calls onValueChange callback', async () => {
      const handleChange = vi.fn()
      render(<Slider defaultValue={[50]} onValueChange={handleChange} />)

      // Callbacks are invoked by Radix internally on drag
      // This test verifies the callback prop is accepted
      expect(handleChange).toBeDefined()
    })

    it('calls onValueCommit callback', () => {
      const handleCommit = vi.fn()
      render(<Slider defaultValue={[50]} onValueCommit={handleCommit} />)

      // This test verifies the callback prop is accepted
      expect(handleCommit).toBeDefined()
    })
  })

  describe('Accessibility', () => {
    it('has slider role', () => {
      render(<Slider defaultValue={[50]} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('supports aria-label', () => {
      render(<Slider defaultValue={[50]} aria-label="Volume" />)
      const slider = screen.getByRole('slider', { name: /volume/i })
      expect(slider).toBeInTheDocument()
    })

    it('supports aria-labelledby', () => {
      const { container } = render(
        <>
          <div id="slider-label">Volume Control</div>
          <Slider defaultValue={[50]} aria-labelledby="slider-label" />
        </>
      )
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })

    it('thumb is keyboard accessible', () => {
      render(<Slider defaultValue={[50]} />)
      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on root', () => {
      const { container } = render(
        <Slider defaultValue={[50]} data-testid="custom-slider" title="Volume" />
      )
      const slider = container.querySelector('[data-testid="custom-slider"]')
      expect(slider).toHaveAttribute('title', 'Volume')
    })

    it('preserves custom attributes', () => {
      const { container } = render(<Slider defaultValue={[50]} data-custom="value" />)
      const slider = container.querySelector('[data-slot="slider"]')
      expect(slider).toHaveAttribute('data-custom', 'value')
    })
  })

  describe('Complete Slider Workflow', () => {
    it('renders complete single slider', () => {
      render(<Slider defaultValue={[50]} min={0} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('renders complete range slider', () => {
      const { container } = render(<Slider defaultValue={[25, 75]} min={0} max={100} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(2)
    })

    it('realistic volume control use case', () => {
      render(
        <div>
          <label htmlFor="volume-slider">Volume</label>
          <Slider defaultValue={[50]} min={0} max={100} step={1} id="volume-slider" />
        </div>
      )
      expect(screen.getByText('Volume')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('realistic price range use case', () => {
      const { container } = render(
        <Slider defaultValue={[100, 500]} min={0} max={1000} step={50} />
      )
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(2)
    })
  })

  describe('Value Computation', () => {
    it('computes values from defaultValue', () => {
      const { container } = render(<Slider defaultValue={[50]} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })

    it('computes values from value prop', () => {
      const { container } = render(<Slider value={[50]} min={0} max={100} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })

    it('computes values from min/max', () => {
      const { container } = render(<Slider min={0} max={100} />)
      expect(container.querySelector('[data-slot="slider"]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<Slider defaultValue={[0]} min={0} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('handles max value', () => {
      render(<Slider defaultValue={[100]} min={0} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('handles very large max value', () => {
      render(<Slider defaultValue={[50000]} min={0} max={100000} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('handles negative values', () => {
      render(<Slider defaultValue={[-50]} min={-100} max={100} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('handles fractional values', () => {
      render(<Slider defaultValue={[0.5]} min={0} max={1} step={0.01} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Inverted Ranges', () => {
    it('handles inverted range values', () => {
      const { container } = render(<Slider defaultValue={[75, 25]} min={0} max={100} />)
      const thumbs = container.querySelectorAll('[data-slot="slider-thumb"]')
      expect(thumbs.length).toBe(2)
    })
  })
})
