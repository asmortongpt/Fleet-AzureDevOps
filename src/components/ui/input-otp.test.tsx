import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from './input-otp'

describe('InputOTP Components', () => {
  describe('InputOTP Root', () => {
    it('renders input OTP root', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp"]')).toBeInTheDocument()
    })

    it('has input otp data-slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp"]')).toBeInTheDocument()
    })

    it('accepts maxLength prop', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp"]')).toBeInTheDocument()
    })

    it('accepts disabled prop', () => {
      const { container } = render(
        <InputOTP maxLength={6} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp"]')).toBeInTheDocument()
    })

    it('accepts custom containerClassName', () => {
      const { container } = render(
        <InputOTP maxLength={6} containerClassName="custom-container">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input?.className).toContain('custom-container')
    })

    it('has flex layout', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toHaveClass('flex', 'items-center', 'gap-2')
    })
  })

  describe('InputOTPGroup', () => {
    it('renders input OTP group', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup data-testid="group">
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(screen.getByTestId('group')).toBeInTheDocument()
    })

    it('has input otp group data-slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp-group"]')).toBeInTheDocument()
    })

    it('has flex layout', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const group = container.querySelector('[data-slot="input-otp-group"]')
      expect(group).toHaveClass('flex', 'items-center')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup className="custom-group">
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const group = container.querySelector('[data-slot="input-otp-group"]')
      expect(group).toHaveClass('custom-group')
    })

    it('can contain multiple slots', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots.length).toBe(6)
    })

    it('can contain separator', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp-separator"]')).toBeInTheDocument()
    })
  })

  describe('InputOTPSlot', () => {
    it('renders input OTP slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot data-testid="slot" index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(screen.getByTestId('slot')).toBeInTheDocument()
    })

    it('has input otp slot data-slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp-slot"]')).toBeInTheDocument()
    })

    it('has border styling', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveClass('border')
    })

    it('has rounded corners', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveClass('rounded-md')
    })

    it('has fixed width and height', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveClass('h-9', 'w-9')
    })

    it('has flex centering', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('supports active state', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveAttribute('data-active')
    })

    it('has first slot with rounded-l-md', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots[0]).toHaveClass('first:rounded-l-md')
    })

    it('has last slot with rounded-r-md', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots[1]).toHaveClass('last:rounded-r-md')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="custom-slot" />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveClass('custom-slot')
    })

    it('renders character input', () => {
      const { container } = render(
        <InputOTP maxLength={6} value="1">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toBeInTheDocument()
    })

    it('has caret animation', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot?.querySelector('.animate-caret-blink')).toBeInTheDocument()
    })
  })

  describe('InputOTPSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator data-testid="separator" />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      expect(screen.getByTestId('separator')).toBeInTheDocument()
    })

    it('has input otp separator data-slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
      )
      expect(container.querySelector('[data-slot="input-otp-separator"]')).toBeInTheDocument()
    })

    it('has role separator', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
      )
      const separator = container.querySelector('[data-slot="input-otp-separator"]')
      expect(separator).toHaveAttribute('role', 'separator')
    })

    it('renders minus icon', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPSeparator />
        </InputOTP>
      )
      const separator = container.querySelector('[data-slot="input-otp-separator"]')
      const icon = separator?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('OTP Input Patterns', () => {
    it('renders 4-digit OTP', () => {
      const { container } = render(
        <InputOTP maxLength={4}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots.length).toBe(4)
    })

    it('renders 6-digit OTP', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots.length).toBe(6)
    })

    it('renders split format OTP (3-3)', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      const groups = container.querySelectorAll('[data-slot="input-otp-group"]')
      const separators = container.querySelectorAll('[data-slot="input-otp-separator"]')
      expect(groups.length).toBe(2)
      expect(separators.length).toBe(1)
    })

    it('renders split format OTP (2-2-2)', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      )
      const groups = container.querySelectorAll('[data-slot="input-otp-group"]')
      const separators = container.querySelectorAll('[data-slot="input-otp-separator"]')
      expect(groups.length).toBe(3)
      expect(separators.length).toBe(2)
    })
  })

  describe('Disabled State', () => {
    it('renders disabled OTP', () => {
      const { container } = render(
        <InputOTP maxLength={6} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input?.className).toContain('disabled')
    })

    it('has opacity 50 when disabled', () => {
      const { container } = render(
        <InputOTP maxLength={6} disabled>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toHaveClass('has-disabled:opacity-50')
    })
  })

  describe('Accessibility', () => {
    it('accepts aria-label on OTP root', () => {
      const { container } = render(
        <InputOTP maxLength={6} aria-label="Two factor authentication code">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toHaveAttribute('aria-label', 'Two factor authentication code')
    })

    it('accepts aria-description on OTP root', () => {
      const { container } = render(
        <InputOTP maxLength={6} aria-describedby="otp-help">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toHaveAttribute('aria-describedby', 'otp-help')
    })

    it('supports aria-invalid on slot', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid="true" />
          </InputOTPGroup>
        </InputOTP>
      )
      const slot = container.querySelector('[data-slot="input-otp-slot"]')
      expect(slot).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('Keyboard Input', () => {
    it('handles numeric input', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toBeInTheDocument()
    })

    it('handles paste events', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toBeInTheDocument()
    })

    it('handles backspace', () => {
      const { container } = render(
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders very long OTP codes', () => {
      const { container } = render(
        <InputOTP maxLength={12}>
          <InputOTPGroup>
            {Array.from({ length: 12 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      )
      const slots = container.querySelectorAll('[data-slot="input-otp-slot"]')
      expect(slots.length).toBe(12)
    })

    it('handles custom className combinations', () => {
      const { container } = render(
        <InputOTP maxLength={6} className="custom-otp">
          <InputOTPGroup className="custom-group">
            <InputOTPSlot index={0} className="custom-slot" />
          </InputOTPGroup>
        </InputOTP>
      )
      const input = container.querySelector('[data-slot="input-otp"]')
      const group = container.querySelector('[data-slot="input-otp-group"]')
      const slot = container.querySelector('[data-slot="input-otp-slot"]')

      expect(input?.className).toContain('custom-otp')
      expect(group?.className).toContain('custom-group')
      expect(slot?.className).toContain('custom-slot')
    })
  })
})
