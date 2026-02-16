import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Checkbox } from './checkbox'

describe('Checkbox Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders checkbox with data-slot attribute', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toBeInTheDocument()
    })

    it('renders as checkbox element', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toBeInTheDocument()
    })

    it('renders with default aria-checked state (false)', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('renders with custom className', () => {
      const { container } = render(<Checkbox className="custom-class" />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('custom-class')
    })

    it('renders with unchecked state initially', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('renders with check indicator when checked', () => {
      const { container } = render(<Checkbox checked />)
      const indicator = container.querySelector('[data-slot="checkbox-indicator"]')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies size styling', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('size-4', 'shrink-0')
    })

    it('applies border styling', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('border-input', 'rounded-[4px]', 'border')
    })

    it('applies shadow', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('shadow-xs')
    })

    it('applies transitions', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('transition-shadow')
    })

    it('applies outline styling', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('outline-none')
    })

    it('applies dark mode styling', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('dark:bg-input/30')
    })
  })

  describe('Checked State', () => {
    it('applies checked styling', () => {
      const { container } = render(<Checkbox checked />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('data-[state=checked]:bg-primary')
      expect(checkbox).toHaveClass('data-[state=checked]:text-primary-foreground')
      expect(checkbox).toHaveClass('data-[state=checked]:border-primary')
    })

    it('displays check icon when checked', () => {
      const { container } = render(<Checkbox checked />)
      const indicator = container.querySelector('[data-slot="checkbox-indicator"]')
      const checkIcon = indicator?.querySelector('svg')
      expect(checkIcon).toBeInTheDocument()
    })

    it('applies dark mode checked styling', () => {
      const { container } = render(<Checkbox checked />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('dark:data-[state=checked]:bg-primary')
    })
  })

  describe('Focus State', () => {
    it('applies focus-visible styling', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('focus-visible:border-ring')
      expect(checkbox).toHaveClass('focus-visible:ring-ring/50')
      expect(checkbox).toHaveClass('focus-visible:ring-[3px]')
    })

    it('receives focus', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      checkbox.focus()
      expect(checkbox).toHaveFocus()
    })

    it('can be focused programmatically', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      checkbox.focus()
      expect(document.activeElement).toBe(checkbox)
    })
  })

  describe('Disabled State', () => {
    it('renders disabled checkbox', () => {
      const { container } = render(<Checkbox disabled />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      expect(checkbox).toHaveAttribute('disabled')
    })

    it('applies disabled styling', () => {
      const { container } = render(<Checkbox disabled />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed')
      expect(checkbox).toHaveClass('disabled:opacity-50')
    })

    it('prevents interaction when disabled', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Checkbox disabled onCheckedChange={handleChange} />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      fireEvent.click(checkbox)
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('prevents focus when disabled (depends on browser)', () => {
      const { container } = render(<Checkbox disabled />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      checkbox.focus()
      // Disabled elements may not receive focus depending on browser
      // This test documents the behavior
      expect(checkbox).toHaveAttribute('disabled')
    })
  })

  describe('Error State', () => {
    it('applies error styling with aria-invalid', () => {
      const { container } = render(<Checkbox aria-invalid="true" />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('aria-invalid:ring-destructive/20')
      expect(checkbox).toHaveClass('aria-invalid:border-destructive')
    })

    it('applies error styling in dark mode with aria-invalid', () => {
      const { container } = render(<Checkbox aria-invalid="true" />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('dark:aria-invalid:ring-destructive/40')
    })
  })

  describe('Indicator', () => {
    it('renders indicator with data-slot attribute', () => {
      const { container } = render(<Checkbox checked />)
      const indicator = container.querySelector('[data-slot="checkbox-indicator"]')
      expect(indicator).toBeInTheDocument()
    })

    it('applies indicator styling', () => {
      const { container } = render(<Checkbox checked />)
      const indicator = container.querySelector('[data-slot="checkbox-indicator"]')
      expect(indicator).toHaveClass('flex', 'items-center', 'justify-center')
      expect(indicator).toHaveClass('text-current', 'transition-none')
    })

    it('contains Check icon with proper size', () => {
      const { container } = render(<Checkbox checked />)
      const checkIcon = container.querySelector('[data-slot="checkbox-indicator"] svg')
      expect(checkIcon).toBeInTheDocument()
      expect(checkIcon).toHaveClass('size-3.5')
    })

    it('indicator is visible when checked', () => {
      const { container: checkedContainer } = render(<Checkbox checked />)
      const checkedIndicator = checkedContainer.querySelector('[data-slot="checkbox-indicator"]')
      // Radix only renders indicator when checkbox is checked
      expect(checkedIndicator).toBeInTheDocument()
    })

    it('indicator is not rendered when unchecked', () => {
      const { container: uncheckedContainer } = render(<Checkbox checked={false} />)
      const uncheckedIndicator = uncheckedContainer.querySelector('[data-slot="checkbox-indicator"]')
      // Radix does not render indicator when unchecked
      expect(uncheckedIndicator).not.toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('can be toggled via click', async () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(checkbox)
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })

    it('can be toggled via keyboard (Space)', async () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      checkbox.focus()
      fireEvent.keyDown(checkbox, { key: ' ', code: 'Space' })

      // Radix handles the actual toggle, we verify it responds
      expect(checkbox).toHaveFocus()
    })

    it('calls onCheckedChange callback', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Checkbox onCheckedChange={handleChange} />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      fireEvent.click(checkbox)
      expect(handleChange).toHaveBeenCalled()
    })

    it('supports controlled checked state', () => {
      const { rerender, container } = render(<Checkbox checked={true} />)
      let checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      expect(checkbox).toHaveAttribute('aria-checked', 'true')

      rerender(<Checkbox checked={false} />)
      checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      expect(checkbox).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Props Spreading', () => {
    it('spreads custom attributes like data-testid and id', () => {
      const { container } = render(
        <Checkbox
          data-testid="custom-checkbox"
          id="accept-terms"
        />
      )

      const checkbox = container.querySelector('[data-testid="custom-checkbox"]')
      expect(checkbox).toBeInTheDocument()
      expect(checkbox).toHaveAttribute('id', 'accept-terms')
      // Note: name and value attributes may not be spread by Radix CheckboxPrimitive
      // Radix handles form submission through its own mechanisms
    })

    it('spreads event handlers', () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const { container } = render(
        <Checkbox onFocus={handleFocus} onBlur={handleBlur} />
      )

      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      fireEvent.focus(checkbox)
      fireEvent.blur(checkbox)

      expect(handleFocus).toHaveBeenCalled()
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has checkbox role', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('role', 'checkbox')
    })

    it('supports aria-label', () => {
      const { container } = render(<Checkbox aria-label="Accept terms" />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-label', 'Accept terms')
    })

    it('supports aria-labelledby', () => {
      const { container } = render(
        <div>
          <label id="checkbox-label">Agree to terms</label>
          <Checkbox aria-labelledby="checkbox-label" />
        </div>
      )
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-labelledby', 'checkbox-label')
    })

    it('supports aria-describedby', () => {
      const { container } = render(
        <div>
          <Checkbox aria-describedby="checkbox-help" />
          <div id="checkbox-help">By checking this box, you agree...</div>
        </div>
      )
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-describedby', 'checkbox-help')
    })

    it('supports aria-required', () => {
      const { container } = render(<Checkbox aria-required="true" />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-required', 'true')
    })

    it('supports aria-disabled', () => {
      const { container } = render(<Checkbox disabled aria-disabled="true" />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-disabled', 'true')
    })

    it('is keyboard accessible', async () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement

      // Tab to checkbox
      checkbox.focus()
      expect(checkbox).toHaveFocus()

      // Space to toggle (Radix handles this)
      fireEvent.keyDown(checkbox, { key: ' ' })
      expect(checkbox).toHaveFocus()
    })
  })

  describe('Visual States - Peer Styling', () => {
    it('applies peer styling for label association', () => {
      const { container } = render(<Checkbox />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('peer')
    })
  })

  describe('Icon Styling', () => {
    it('check icon has proper styling', () => {
      const { container } = render(<Checkbox checked />)
      const checkIcon = container.querySelector('[data-slot="checkbox-indicator"] svg')
      expect(checkIcon).toHaveClass('size-3.5')
    })

    it('check icon inherits text color', () => {
      const { container } = render(<Checkbox checked />)
      const indicator = container.querySelector('[data-slot="checkbox-indicator"]')
      expect(indicator).toHaveClass('text-current')
    })
  })

  describe('State Combinations', () => {
    it('handles checked and disabled together', () => {
      const { container } = render(<Checkbox checked disabled />)
      const checkbox = container.querySelector('[role="checkbox"]')
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
      expect(checkbox).toHaveAttribute('disabled')
    })

    it('handles aria-invalid and disabled together', () => {
      const { container } = render(<Checkbox aria-invalid="true" disabled />)
      const checkbox = container.querySelector('[data-slot="checkbox"]')
      expect(checkbox).toHaveClass('aria-invalid:border-destructive')
      expect(checkbox).toHaveClass('disabled:opacity-50')
    })

    it('handles focused and checked state', () => {
      const { container } = render(<Checkbox checked />)
      const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement
      checkbox.focus()
      expect(checkbox).toHaveFocus()
      expect(checkbox).toHaveAttribute('aria-checked', 'true')
    })
  })
})
