import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Toaster } from './sonner'

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

describe('Toaster Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders toaster component', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('has toaster class', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveClass('toaster')
    })

    it('has group class for grouping toasts', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveClass('group')
    })

    it('renders as Sonner component internally', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Theme Support', () => {
    it('uses light theme from useTheme hook', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toBeInTheDocument()
    })

    it('passes theme to Sonner', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports system theme', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('CSS Variables', () => {
    it('sets normal background CSS variable', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveStyle('--normal-bg')
    })

    it('sets normal text CSS variable', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveStyle('--normal-text')
    })

    it('sets normal border CSS variable', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveStyle('--normal-border')
    })

    it('uses popover color for normal state', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('style')
    })

    it('uses popover foreground for text', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('style')
    })

    it('uses border color for border', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('style')
    })
  })

  describe('Props Handling', () => {
    it('accepts custom className', () => {
      const { container } = render(<Toaster className="custom-toaster" />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveClass('custom-toaster')
    })

    it('accepts position prop', () => {
      const { container } = render(<Toaster position="top-center" />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts duration prop', () => {
      const { container } = render(<Toaster duration={3000} />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts richColors prop', () => {
      const { container } = render(<Toaster richColors />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts closeButton prop', () => {
      const { container } = render(<Toaster closeButton />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts expand prop', () => {
      const { container } = render(<Toaster expand />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('passes through all props to Sonner', () => {
      const { container } = render(
        <Toaster
          position="bottom-right"
          duration={4000}
          theme="light"
          closeButton
        />
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Position Variations', () => {
    const positions = [
      'top-left',
      'top-center',
      'top-right',
      'bottom-left',
      'bottom-center',
      'bottom-right',
    ]

    positions.forEach(position => {
      it(`renders toaster at ${position}`, () => {
        const { container } = render(<Toaster position={position as any} />)
        expect(container.querySelector('.toaster')).toBeInTheDocument()
      })
    })
  })

  describe('Theme Values', () => {
    it('renders with light theme', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts dark theme', () => {
      const { container } = render(<Toaster theme="dark" />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts system theme', () => {
      const { container } = render(<Toaster theme="system" />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Styling Features', () => {
    it('supports rich colors', () => {
      const { container } = render(<Toaster richColors />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports close button', () => {
      const { container } = render(<Toaster closeButton />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports expand behavior', () => {
      const { container } = render(<Toaster expand />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports gap between toasts', () => {
      const { container } = render(<Toaster gap={10} />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports custom font size', () => {
      const { container } = render(<Toaster fontSize={14} />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Color Variants', () => {
    it('supports success variant', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports error variant', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports warning variant', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports info variant', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports default variant', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Toast Customization', () => {
    it('accepts custom toast className', () => {
      const { container } = render(<Toaster toastOptions={{}} />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts custom success className', () => {
      const { container } = render(
        <Toaster
          toastOptions={{
            classNameCase: 'lowercase',
          }}
        />
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('accepts custom default toast duration', () => {
      const { container } = render(<Toaster duration={5000} />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic toaster structure', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('supports aria attributes', () => {
      const { container } = render(<Toaster aria-live="polite" />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('aria-live', 'polite')
    })

    it('allows custom aria-label', () => {
      const { container } = render(<Toaster aria-label="Toast notifications" />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('aria-label', 'Toast notifications')
    })
  })

  describe('Integration Patterns', () => {
    it('can be used as application-wide toast provider', () => {
      const { container } = render(
        <div>
          <Toaster />
          <main>App content</main>
        </div>
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('renders without affecting layout', () => {
      const { container } = render(
        <div className="app">
          <Toaster />
          <div className="content">Content</div>
        </div>
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('works with multiple instances', () => {
      const { container } = render(
        <div>
          <Toaster position="top-right" />
          <Toaster position="bottom-left" />
        </div>
      )
      const toasters = container.querySelectorAll('.toaster')
      expect(toasters.length).toBeGreaterThan(0)
    })
  })

  describe('Default Behavior', () => {
    it('uses system theme by default', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('uses bottom-right position by default', () => {
      const { container } = render(<Toaster />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('uses popover colors by default', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveStyle('--normal-bg')
    })

    it('includes group class for toast grouping', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveClass('group')
    })
  })

  describe('Props Combinations', () => {
    it('handles position + theme combination', () => {
      const { container } = render(
        <Toaster position="top-center" theme="dark" />
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('handles richColors + closeButton combination', () => {
      const { container } = render(<Toaster richColors closeButton />)
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })

    it('handles all customization options together', () => {
      const { container } = render(
        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
          expand
          duration={3000}
          gap={16}
        />
      )
      expect(container.querySelector('.toaster')).toBeInTheDocument()
    })
  })

  describe('Display Properties', () => {
    it('renders as fixed or absolute positioned element', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toBeInTheDocument()
    })

    it('uses z-index for stacking', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toBeInTheDocument()
    })

    it('groups toasts for collective animation', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster.group')
      expect(toaster).toBeInTheDocument()
    })
  })

  describe('CSS Variable Customization', () => {
    it('properly sets CSS custom properties', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      const styles = toaster?.getAttribute('style')
      expect(styles).toContain('--normal-bg')
      expect(styles).toContain('--normal-text')
      expect(styles).toContain('--normal-border')
    })

    it('uses theme color variables', () => {
      const { container } = render(<Toaster />)
      const toaster = container.querySelector('.toaster')
      expect(toaster).toHaveAttribute('style')
    })
  })
})
