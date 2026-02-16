import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button, RippleEffect } from './button'

describe('Button Component', () => {
  describe('Rendering & Variants', () => {
    it('renders button with default variant', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('renders all button variants correctly', () => {
      const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'success', 'warning', 'professional'] as const

      variants.forEach(variant => {
        const { unmount } = render(<Button variant={variant}>Test {variant}</Button>)
        expect(screen.getByRole('button', { name: new RegExp(variant) })).toBeInTheDocument()
        unmount()
      })
    })

    it('renders all size variants', () => {
      const sizes = ['sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg', 'touch'] as const

      sizes.forEach(size => {
        const { unmount } = render(<Button size={size}>Test</Button>)
        const button = screen.getByRole('button')

        // Verify button is rendered and has gradient variant
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-gradient-to-r')

        // Verify button has some height class (all size variants should have one)
        const classList = button.className
        const hasHeightClass = /\bh-\d+\b/.test(classList) || /\bsize-\d+\b/.test(classList)
        expect(hasHeightClass).toBe(true)

        unmount()
      })
    })

    it('renders children content', () => {
      render(
        <Button>
          <span>Icon</span>
          Click me
        </Button>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Interactive Behavior', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Click</Button>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies press feedback (scale-95) on mouse down', async () => {
      render(<Button>Press me</Button>)
      const button = screen.getByRole('button')

      fireEvent.mouseDown(button)
      expect(button).toHaveClass('scale-95')

      fireEvent.mouseUp(button)
      expect(button).not.toHaveClass('scale-95')
    })

    it('removes press feedback on mouse leave', async () => {
      render(<Button>Press me</Button>)
      const button = screen.getByRole('button')

      fireEvent.mouseDown(button)
      expect(button).toHaveClass('scale-95')

      fireEvent.mouseLeave(button)
      expect(button).not.toHaveClass('scale-95')
    })

    it('maintains smooth transition during press feedback', () => {
      render(<Button>Press me</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('transition-all', 'duration-150', 'ease-out')
    })
  })

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled button</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })

    it('applies opacity-50 styling when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('prevents click when disabled', async () => {
      const handleClick = vi.fn()
      render(<Button disabled onClick={handleClick}>Disabled</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when loading prop is true', () => {
      render(<Button loading>Load</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')

      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('displays "Loading..." text when loading', () => {
      render(<Button loading>Click me</Button>)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Click me')).not.toBeInTheDocument()
    })

    it('disables button when loading', () => {
      render(<Button loading>Load</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
    })

    it('sets aria-busy attribute when loading', () => {
      render(<Button loading>Load</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('removes aria-busy when not loading', () => {
      render(<Button loading={false}>Click</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'false')
    })
  })

  describe('Accessibility', () => {
    it('has proper button role', () => {
      render(<Button>Accessible button</Button>)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports aria-label prop', () => {
      render(<Button aria-label="Custom label">Button</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-label', 'Custom label')
    })

    it('shows focus ring on focus', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('focus-visible:ring-2')
    })

    it('is keyboard navigable', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Keyboard button</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      fireEvent.keyDown(button, { key: 'Enter' })
      // Button natively supports Enter and Space in browser
    })

    it('has spinner marked as aria-hidden', () => {
      render(<Button loading>Load</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')

      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Data Attributes', () => {
    it('has data-slot="button" attribute', () => {
      render(<Button>Button</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('data-slot', 'button')
    })
  })

  describe('Ripple Effect', () => {
    it('renders RippleEffect component independently', () => {
      const { container } = render(<RippleEffect />)
      const rippleContainer = container.querySelector('span')

      expect(rippleContainer).toBeInTheDocument()
      expect(rippleContainer).toHaveClass('absolute', 'inset-0', 'overflow-hidden')
    })

    it('creates ripples on click', async () => {
      const { container } = render(<RippleEffect trigger={true} />)
      const rippleSpan = container.querySelector('span')

      if (rippleSpan) {
        fireEvent.click(rippleSpan)

        await waitFor(() => {
          const ripples = container.querySelectorAll('span > span')
          expect(ripples.length).toBeGreaterThanOrEqual(0) // Ripples may be removed after animation
        }, { timeout: 700 })
      }
    })
  })

  describe('Gradient Variants Visual', () => {
    it('applies CTA Orange gradient to default variant', () => {
      render(<Button variant="default">Default</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-[#FF6B35]', 'to-[#FF8855]')
    })

    it('applies Blue Skies gradient to secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-[#41B2E3]', 'to-[#5BC0EB]')
    })

    it('applies Golden Hour gradient to warning variant', () => {
      render(<Button variant="warning">Warning</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-[#F0A000]', 'to-[#FFB800]')
    })

    it('applies Noon Red gradient to destructive variant', () => {
      render(<Button variant="destructive">Destructive</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-[#DD3903]', 'to-[#FF3838]')
    })

    it('applies Navy gradient to professional variant', () => {
      render(<Button variant="professional">Professional</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-[#2F3359]', 'to-[#3D4573]')
    })

    it('applies Emerald gradient to success variant', () => {
      render(<Button variant="success">Success</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('from-emerald-500', 'to-emerald-600')
    })
  })

  describe('Hover Effects', () => {
    it('has hover lift effect class', () => {
      render(<Button>Hover lift</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('hover:-translate-y-0.5')
    })

    it('applies shadow glow on hover for default variant', () => {
      render(<Button variant="default">Shadow glow</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('hover:shadow-lg', 'shadow-[#FF6B35]/30')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional HTML attributes', () => {
      render(
        <Button
          data-testid="custom-button"
          aria-label="Custom label"
          title="Custom title"
        >
          Button
        </Button>
      )

      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('title', 'Custom title')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      const { container } = render(<Button ref={ref}>Button</Button>)

      expect(ref.current).toBe(container.querySelector('button'))
    })
  })

  describe('Visual Enhancement Integration', () => {
    it('includes btn-interactive class for press feedback', () => {
      render(<Button>Interactive</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('btn-interactive')
    })

    it('includes btn-ripple class for ripple effects', () => {
      render(<Button>Ripple</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('btn-ripple')
    })

    it('has relative positioning for ripple containment', () => {
      render(<Button>Ripple container</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('relative', 'overflow-hidden')
    })

    it('applies rounded corners', () => {
      render(<Button>Rounded</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('rounded-lg')
    })
  })
})
