import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Toggle } from './toggle'

describe('Toggle Component', () => {
  describe('Rendering & Structure', () => {
    it('renders toggle button', () => {
      render(<Toggle>Toggle</Toggle>)
      expect(screen.getByRole('button', { name: /toggle/i })).toBeInTheDocument()
    })

    it('has data-slot attribute', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      expect(container.querySelector('[data-slot="toggle"]')).toBeInTheDocument()
    })

    it('renders with children', () => {
      render(<Toggle>Click me</Toggle>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('renders as button element', () => {
      render(<Toggle>Toggle</Toggle>)
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })
  })

  describe('Size Variants', () => {
    it('renders default size', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('h-10', 'w-10')
    })

    it('renders small size', () => {
      const { container } = render(<Toggle size="sm">Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('h-9', 'w-9')
    })

    it('renders large size', () => {
      const { container } = render(<Toggle size="lg">Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('h-11', 'w-11')
    })
  })

  describe('Variant Styling', () => {
    it('applies default variant styling', () => {
      const { container } = render(<Toggle variant="default">Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('bg-transparent')
    })

    it('applies outline variant styling', () => {
      const { container } = render(<Toggle variant="outline">Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('border', 'border-input')
    })

    it('supports multiple variants', () => {
      const variants = ['default', 'outline']
      variants.forEach(variant => {
        const { container } = render(<Toggle variant={variant as any}>Toggle</Toggle>)
        const toggle = container.querySelector('[data-slot="toggle"]')
        expect(toggle).toBeInTheDocument()
      })
    })
  })

  describe('Pressed State', () => {
    it('has pressed state styling', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground')
    })

    it('supports controlled pressed state', () => {
      const { rerender } = render(<Toggle pressed={false}>Toggle</Toggle>)
      let button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'false')

      rerender(<Toggle pressed={true}>Toggle</Toggle>)
      button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('supports default pressed state', () => {
      const { container } = render(<Toggle defaultPressed={true}>Toggle</Toggle>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Interactive Behavior', () => {
    it('toggles pressed state on click', async () => {
      const handleClick = vi.fn()
      render(<Toggle onClick={handleClick}>Toggle</Toggle>)

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalled()
    })

    it('calls onChange callback', async () => {
      const handleChange = vi.fn()
      render(
        <Toggle onPressedChange={handleChange}>
          Toggle
        </Toggle>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleChange).toHaveBeenCalled()
    })

    it('handles keyboard activation', async () => {
      render(<Toggle>Toggle</Toggle>)
      const button = screen.getByRole('button')

      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })

      expect(button).toHaveFocus()
    })
  })

  describe('Styling', () => {
    it('applies base styling', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-md', 'text-sm', 'font-medium')
    })

    it('applies hover styling', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('hover:bg-muted')
    })

    it('applies focus styling', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('applies disabled styling', () => {
      const { container } = render(<Toggle disabled>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('applies transition effects', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('transition-colors')
    })
  })

  describe('Disabled State', () => {
    it('disables toggle when disabled prop is true', () => {
      render(<Toggle disabled>Toggle</Toggle>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('prevents click when disabled', async () => {
      const handleClick = vi.fn()
      render(
        <Toggle disabled onClick={handleClick}>
          Toggle
        </Toggle>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Toggle>Toggle</Toggle>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has aria-pressed attribute', () => {
      render(<Toggle>Toggle</Toggle>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed')
    })

    it('supports aria-label', () => {
      const { container } = render(<Toggle aria-label="Bold text">B</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveAttribute('aria-label', 'Bold text')
    })

    it('shows focus ring', () => {
      const { container } = render(<Toggle>Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('focus-visible:ring-2')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional HTML attributes', () => {
      const { container } = render(
        <Toggle
          data-testid="custom-toggle"
          title="Click to toggle"
        >
          Toggle
        </Toggle>
      )
      const toggle = container.querySelector('[data-testid="custom-toggle"]')
      expect(toggle).toHaveAttribute('title', 'Click to toggle')
    })

    it('accepts custom className', () => {
      const { container } = render(<Toggle className="custom-class">Toggle</Toggle>)
      const toggle = container.querySelector('[data-slot="toggle"]')
      expect(toggle).toHaveClass('custom-class')
    })
  })

  describe('Complete Toggle Workflow', () => {
    it('renders toggle for text formatting', () => {
      render(<Toggle aria-label="Bold">B</Toggle>)
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument()
    })

    it('realistic editor use case', () => {
      render(
        <div>
          <Toggle aria-label="Bold">B</Toggle>
          <Toggle aria-label="Italic">I</Toggle>
          <Toggle aria-label="Underline">U</Toggle>
        </div>
      )
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument()
    })
  })

  describe('Icon Support', () => {
    it('renders with icon children', () => {
      render(
        <Toggle>
          <svg data-testid="icon" />
        </Toggle>
      )
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders with mixed icon and text content', () => {
      render(
        <Toggle>
          <span>Icon</span>
          <span>Text</span>
        </Toggle>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with no children', () => {
      const { container } = render(<Toggle />)
      expect(container.querySelector('[data-slot="toggle"]')).toBeInTheDocument()
    })

    it('renders with empty string children', () => {
      const { container } = render(<Toggle>{''}</Toggle>)
      expect(container.querySelector('[data-slot="toggle"]')).toBeInTheDocument()
    })

    it('handles rapid clicks', async () => {
      const handleChange = vi.fn()
      render(
        <Toggle onPressedChange={handleChange}>
          Toggle
        </Toggle>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)
      await userEvent.click(button)
      await userEvent.click(button)

      expect(handleChange).toHaveBeenCalledTimes(3)
    })
  })
})
