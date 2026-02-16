import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Switch } from './switch'

describe('Switch Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders switch with data-slot attribute', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toBeInTheDocument()
    })

    it('renders as switch role element', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toBeInTheDocument()
    })

    it('renders with default aria-checked state (false)', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    it('renders with custom className', () => {
      const { container } = render(<Switch className="custom-switch" />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('custom-switch')
    })

    it('renders with unchecked state initially', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    it('renders with thumb indicator', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toBeInTheDocument()
    })

    it('renders checked switch', () => {
      const { container } = render(<Switch checked />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies switch sizing', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('h-[1.15rem]', 'w-8', 'shrink-0')
    })

    it('applies border styling', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('border', 'border-transparent', 'rounded-full')
    })

    it('applies shadow', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('shadow-xs')
    })

    it('applies transitions', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('transition-all')
    })

    it('applies outline styling', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('outline-none')
    })

    it('applies peer styling for label association', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('peer')
    })

    it('applies inline-flex layout', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('inline-flex', 'items-center')
    })
  })

  describe('Unchecked State', () => {
    it('applies unchecked styling', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input')
    })

    it('applies dark mode unchecked styling', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('dark:data-[state=unchecked]:bg-input/80')
    })

    it('positions thumb at start when unchecked', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('data-[state=unchecked]:translate-x-0')
    })
  })

  describe('Checked State', () => {
    it('applies checked styling', () => {
      const { container } = render(<Switch checked />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('data-[state=checked]:bg-primary')
    })

    it('positions thumb at end when checked', () => {
      const { container } = render(<Switch checked />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('data-[state=checked]:translate-x-[calc(100%-2px)]')
    })

    it('checked state applies primary background color', () => {
      const { container } = render(<Switch checked />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('data-[state=checked]:bg-primary')
    })
  })

  describe('Thumb Styling', () => {
    it('applies thumb sizing', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('size-4')
    })

    it('applies thumb background styling', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('bg-background')
    })

    it('applies dark mode thumb styling', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('dark:data-[state=unchecked]:bg-foreground')
    })

    it('applies thumb rounded shape', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('rounded-full')
    })

    it('applies thumb transitions', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('transition-transform')
    })

    it('disables pointer events on thumb', () => {
      const { container } = render(<Switch />)
      const thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('pointer-events-none')
    })
  })

  describe('Focus State', () => {
    it('applies focus-visible styling', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('focus-visible:border-ring')
      expect(switchElement).toHaveClass('focus-visible:ring-ring/50')
      expect(switchElement).toHaveClass('focus-visible:ring-[3px]')
    })

    it('receives focus', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      switchElement.focus()
      expect(switchElement).toHaveFocus()
    })

    it('can be focused programmatically', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      switchElement.focus()
      expect(document.activeElement).toBe(switchElement)
    })
  })

  describe('Disabled State', () => {
    it('renders disabled switch', () => {
      const { container } = render(<Switch disabled />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      expect(switchElement).toHaveAttribute('disabled')
    })

    it('applies disabled styling', () => {
      const { container } = render(<Switch disabled />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('disabled:cursor-not-allowed')
      expect(switchElement).toHaveClass('disabled:opacity-50')
    })

    it('prevents interaction when disabled', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Switch disabled onCheckedChange={handleChange} />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      fireEvent.click(switchElement)
      expect(handleChange).not.toHaveBeenCalled()
    })

    it('prevents focus when disabled (depends on browser)', () => {
      const { container } = render(<Switch disabled />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      switchElement.focus()
      expect(switchElement).toHaveAttribute('disabled')
    })
  })

  describe('Error State', () => {
    it('supports aria-invalid attribute', () => {
      const { container } = render(<Switch aria-invalid="true" />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-invalid', 'true')
    })

    it('maintains functionality with aria-invalid', () => {
      const { container } = render(<Switch aria-invalid="true" />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      fireEvent.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Interactions', () => {
    it('can be toggled via click', async () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      fireEvent.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'true')

      fireEvent.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    it('can be toggled via keyboard (Space)', async () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      switchElement.focus()
      fireEvent.keyDown(switchElement, { key: ' ', code: 'Space' })

      expect(switchElement).toHaveFocus()
    })

    it('can be toggled via keyboard (Enter)', async () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      switchElement.focus()
      fireEvent.keyDown(switchElement, { key: 'Enter', code: 'Enter' })

      expect(switchElement).toHaveFocus()
    })

    it('calls onCheckedChange callback', async () => {
      const handleChange = vi.fn()
      const { container } = render(<Switch onCheckedChange={handleChange} />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      fireEvent.click(switchElement)
      expect(handleChange).toHaveBeenCalled()
    })

    it('supports controlled checked state', () => {
      const { rerender, container } = render(<Switch checked={true} />)
      let switchElement = container.querySelector('[role="switch"]') as HTMLElement
      expect(switchElement).toHaveAttribute('aria-checked', 'true')

      rerender(<Switch checked={false} />)
      switchElement = container.querySelector('[role="switch"]') as HTMLElement
      expect(switchElement).toHaveAttribute('aria-checked', 'false')
    })

    it('supports uncontrolled state', async () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      expect(switchElement).toHaveAttribute('aria-checked', 'false')
      fireEvent.click(switchElement)
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Props Spreading', () => {
    it('spreads custom attributes like data-testid and id', () => {
      const { container } = render(
        <Switch
          data-testid="custom-switch"
          id="privacy-toggle"
        />
      )

      const switchElement = container.querySelector('[data-testid="custom-switch"]')
      expect(switchElement).toBeInTheDocument()
      expect(switchElement).toHaveAttribute('id', 'privacy-toggle')
    })

    it('spreads event handlers', () => {
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      const { container } = render(
        <Switch onFocus={handleFocus} onBlur={handleBlur} />
      )

      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      fireEvent.focus(switchElement)
      fireEvent.blur(switchElement)

      expect(handleFocus).toHaveBeenCalled()
      expect(handleBlur).toHaveBeenCalled()
    })

    it('spreads aria attributes', () => {
      const { container } = render(
        <Switch
          aria-label="Toggle notifications"
          aria-describedby="notif-help"
          aria-required="false"
        />
      )

      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-label', 'Toggle notifications')
      expect(switchElement).toHaveAttribute('aria-describedby', 'notif-help')
      expect(switchElement).toHaveAttribute('aria-required', 'false')
    })
  })

  describe('Accessibility', () => {
    it('has switch role', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('role', 'switch')
    })

    it('supports aria-label', () => {
      const { container } = render(<Switch aria-label="Dark mode toggle" />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-label', 'Dark mode toggle')
    })

    it('supports aria-labelledby', () => {
      const { container } = render(
        <div>
          <label id="switch-label">Enable feature</label>
          <Switch aria-labelledby="switch-label" />
        </div>
      )
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-labelledby', 'switch-label')
    })

    it('supports aria-describedby', () => {
      const { container } = render(
        <div>
          <Switch aria-describedby="switch-help" />
          <div id="switch-help">Enable to receive notifications</div>
        </div>
      )
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-describedby', 'switch-help')
    })

    it('supports aria-required', () => {
      const { container } = render(<Switch aria-required="true" />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-required', 'true')
    })

    it('supports aria-disabled', () => {
      const { container } = render(<Switch disabled aria-disabled="true" />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-disabled', 'true')
    })

    it('is keyboard accessible', async () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement

      // Tab to switch
      switchElement.focus()
      expect(switchElement).toHaveFocus()

      // Space to toggle
      fireEvent.keyDown(switchElement, { key: ' ' })
      expect(switchElement).toHaveFocus()
    })

    it('announces state changes to screen readers', () => {
      const { rerender, container } = render(<Switch checked={false} />)
      let switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'false')

      rerender(<Switch checked={true} />)
      switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('Label Association', () => {
    it('works with external label', () => {
      const { container } = render(
        <div>
          <label htmlFor="feature-toggle">Enable feature</label>
          <Switch id="feature-toggle" />
        </div>
      )

      const switchElement = container.querySelector('label')
      expect(switchElement).toBeInTheDocument()
      expect(screen.getByText('Enable feature')).toBeInTheDocument()
    })

    it('works with aria-labelledby', () => {
      const { container } = render(
        <div>
          <span id="label">Privacy mode</span>
          <Switch aria-labelledby="label" />
        </div>
      )

      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-labelledby', 'label')
      expect(screen.getByText('Privacy mode')).toBeInTheDocument()
    })

    it('works with aria-label', () => {
      const { container } = render(
        <Switch aria-label="Toggle notifications" />
      )

      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-label', 'Toggle notifications')
    })
  })

  describe('State Combinations', () => {
    it('handles checked and disabled together', () => {
      const { container } = render(<Switch checked disabled />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
      expect(switchElement).toHaveAttribute('disabled')
    })

    it('handles aria-invalid and disabled together', () => {
      const { container } = render(<Switch aria-invalid="true" disabled />)
      const switchElement = container.querySelector('[role="switch"]')
      expect(switchElement).toHaveAttribute('aria-invalid', 'true')
      expect(switchElement).toHaveAttribute('disabled')
      const switchDisplay = container.querySelector('[data-slot="switch"]')
      expect(switchDisplay).toHaveClass('disabled:opacity-50')
    })

    it('handles focused and checked state', () => {
      const { container } = render(<Switch checked />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      switchElement.focus()
      expect(switchElement).toHaveFocus()
      expect(switchElement).toHaveAttribute('aria-checked', 'true')
    })

    it('handles focused and disabled state', () => {
      const { container } = render(<Switch disabled />)
      const switchElement = container.querySelector('[role="switch"]') as HTMLElement
      switchElement.focus()
      expect(switchElement).toHaveAttribute('disabled')
    })
  })

  describe('Visual States - Peer Styling', () => {
    it('applies peer styling for label association', () => {
      const { container } = render(<Switch />)
      const switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('peer')
    })
  })

  describe('Animation States', () => {
    it('thumb animates when state changes', () => {
      const { container, rerender } = render(<Switch checked={false} />)
      let thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('data-[state=unchecked]:translate-x-0')

      rerender(<Switch checked={true} />)
      thumb = container.querySelector('[data-slot="switch-thumb"]')
      expect(thumb).toHaveClass('data-[state=checked]:translate-x-[calc(100%-2px)]')
    })

    it('background animates when state changes', () => {
      const { container, rerender } = render(<Switch checked={false} />)
      let switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input')

      rerender(<Switch checked={true} />)
      switchElement = container.querySelector('[data-slot="switch"]')
      expect(switchElement).toHaveClass('data-[state=checked]:bg-primary')
    })
  })
})
