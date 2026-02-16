import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge, DotBadge, StatusBadge } from './badge'

describe('Badge Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders badge with default variant', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      const { container } = render(<Badge>Test</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toBeInTheDocument()
      expect(badge?.textContent).toBe('Test')
    })

    it('renders all color variants correctly', () => {
      const variants = [
        'default',
        'secondary',
        'destructive',
        'success',
        'warning',
        'info',
        'outline',
        'ghost',
        'primary-subtle',
        'destructive-subtle',
        'success-subtle',
        'warning-subtle',
        'online',
        'offline',
        'pending',
        'error',
      ] as const

      variants.forEach(variant => {
        const { container } = render(<Badge variant={variant}>Test {variant}</Badge>)
        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toBeInTheDocument()
      })
    })

    it('renders all size variants', () => {
      const sizes = ['sm', 'default', 'lg'] as const

      sizes.forEach(size => {
        const { container } = render(<Badge size={size}>Test {size}</Badge>)
        const badge = container.querySelector('[data-slot="badge"]')
        expect(badge).toBeInTheDocument()
        expect(badge).toHaveClass('rounded-full')
      })
    })

    it('renders children content', () => {
      render(
        <Badge>
          <span>Icon</span>
          Label
        </Badge>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Label')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('custom-class')
    })

    it('renders as pill shape with rounded-full', () => {
      const { container } = render(<Badge>Pill</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('rounded-full')
    })

    it('renders as inline element with proper spacing', () => {
      const { container } = render(<Badge>Spacing</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('applies gap between content and SVG icons', () => {
      const { container } = render(
        <Badge>
          <span>Label</span>
          <svg />
        </Badge>
      )
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('gap-1.5')
    })
  })

  describe('Color Variants - Gradient Backgrounds', () => {
    it('applies CTA Orange gradient to default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#FF6B35]', 'to-[#FF8855]')
    })

    it('applies Blue Skies gradient to secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#41B2E3]', 'to-[#5BC0EB]')
    })

    it('applies Noon Red gradient to destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#DD3903]', 'to-[#FF3838]')
    })

    it('applies Emerald gradient to success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-emerald-500', 'to-emerald-600')
    })

    it('applies Golden Hour gradient to warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#F0A000]', 'to-[#FFB800]')
    })

    it('applies Blue Skies gradient to info variant', () => {
      const { container } = render(<Badge variant="info">Info</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#41B2E3]', 'to-[#5BC0EB]')
    })

    it('applies outline style with Blue Skies border', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('text-[#41B2E3]')
      expect(badge).toHaveClass('border-[#41B2E3]/30')
      expect(badge).toHaveClass('bg-transparent')
    })
  })

  describe('Status Variants with Animations', () => {
    it('applies online status styling with animation', () => {
      const { container } = render(<Badge variant="online">Online</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-emerald-500', 'to-emerald-600')
      expect(badge).toHaveClass('animate-pulse')
    })

    it('applies offline status styling', () => {
      const { container } = render(<Badge variant="offline">Offline</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('bg-muted')
      expect(badge).toHaveClass('text-muted-foreground')
    })

    it('applies pending status styling', () => {
      const { container } = render(<Badge variant="pending">Pending</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#F0A000]', 'to-[#FFB800]')
    })

    it('applies error status styling', () => {
      const { container } = render(<Badge variant="error">Error</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('from-[#DD3903]', 'to-[#FF3838]')
    })
  })

  describe('Shadow and Visual Effects', () => {
    it('applies shadow with brand color tint to default variant', () => {
      const { container } = render(<Badge variant="default">Shadowed</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('shadow-md')
      expect(badge).toHaveClass('shadow-[#FF6B35]/40')
    })

    it('applies shadow to secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Shadowed</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('shadow-md')
      expect(badge).toHaveClass('shadow-[#41B2E3]/40')
    })

    it('applies smooth transitions', () => {
      const { container } = render(<Badge>Transition</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('transition-all', 'duration-200')
    })

    it('has overflow hidden for proper clipping', () => {
      const { container } = render(<Badge>Overflow</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('overflow-hidden')
    })
  })

  describe('Size Variants', () => {
    it('applies small size styling', () => {
      const { container } = render(<Badge size="sm">Small</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('h-6', 'text-[10px]', 'px-2.5')
    })

    it('applies default size styling', () => {
      const { container } = render(<Badge size="default">Default</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('h-7', 'text-xs', 'px-3')
    })

    it('applies large size styling', () => {
      const { container } = render(<Badge size="lg">Large</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('h-8', 'text-sm', 'px-4')
    })
  })

  describe('Subtle Variants', () => {
    it('applies primary-subtle variant styling', () => {
      const { container } = render(<Badge variant="primary-subtle">Subtle</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('bg-[#FF6B35]/15')
      expect(badge).toHaveClass('text-[#FF6B35]')
    })

    it('applies destructive-subtle variant styling', () => {
      const { container } = render(<Badge variant="destructive-subtle">Subtle</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('bg-[#DD3903]/15')
      expect(badge).toHaveClass('text-[#DD3903]')
    })

    it('applies success-subtle variant styling', () => {
      const { container } = render(<Badge variant="success-subtle">Subtle</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('bg-emerald-500/15')
      expect(badge).toHaveClass('text-emerald-500')
    })

    it('applies warning-subtle variant styling', () => {
      const { container } = render(<Badge variant="warning-subtle">Subtle</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('bg-[#F0A000]/15')
      expect(badge).toHaveClass('text-[#F0A000]')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional HTML attributes', () => {
      const { container } = render(
        <Badge
          data-testid="custom-badge"
          aria-label="Custom label"
          title="Custom title"
        >
          Badge
        </Badge>
      )

      const badge = container.querySelector('[data-testid="custom-badge"]')
      expect(badge).toHaveAttribute('aria-label', 'Custom label')
      expect(badge).toHaveAttribute('title', 'Custom title')
    })

    it('applies custom className alongside variant classes', () => {
      const { container } = render(
        <Badge className="extra-class" variant="default">
          Badge
        </Badge>
      )

      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('extra-class')
      expect(badge).toHaveClass('from-[#FF6B35]')
    })
  })

  describe('Font and Text Styling', () => {
    it('applies bold font weight', () => {
      const { container } = render(<Badge>Bold</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('font-bold')
    })

    it('prevents text wrapping', () => {
      const { container } = render(<Badge>No Wrap</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('whitespace-nowrap')
    })

    it('constrains size and prevents shrinking', () => {
      const { container } = render(<Badge>Constrained</Badge>)
      const badge = container.querySelector('[data-slot="badge"]')
      expect(badge).toHaveClass('w-fit', 'shrink-0')
    })
  })

  describe('SVG Icon Handling', () => {
    it('renders SVG icons within badge', () => {
      const { container } = render(
        <Badge>
          <svg data-testid="test-icon" />
          Icon
        </Badge>
      )

      const svg = screen.getByTestId('test-icon')
      expect(svg).toBeInTheDocument()
      expect(svg).toBeVisible()
    })

    it('applies gap between content and SVG icons', () => {
      const { container } = render(
        <Badge>
          <svg data-testid="test-icon" />
          Label
        </Badge>
      )

      const badge = container.querySelector('[data-slot="badge"]')
      // Verify gap-1.5 is applied to the badge (which spaces content and SVG)
      expect(badge).toHaveClass('gap-1.5')
    })
  })
})

describe('DotBadge Component', () => {
  describe('Rendering', () => {
    it('renders nothing when count is 0', () => {
      const { container } = render(<DotBadge count={0} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).not.toBeInTheDocument()
    })

    it('renders nothing when count is undefined', () => {
      const { container } = render(<DotBadge />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).not.toBeInTheDocument()
    })

    it('renders count when provided', () => {
      render(<DotBadge count={5} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('renders with data-slot attribute', () => {
      const { container } = render(<DotBadge count={3} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toBeInTheDocument()
    })
  })

  describe('Count Display', () => {
    it('displays count when below max', () => {
      render(<DotBadge count={5} max={99} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays "max+" when count exceeds max', () => {
      render(<DotBadge count={150} max={99} />)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('uses default max of 99', () => {
      render(<DotBadge count={100} />)
      expect(screen.getByText('99+')).toBeInTheDocument()
    })

    it('respects custom max value', () => {
      render(<DotBadge count={15} max={10} />)
      expect(screen.getByText('10+')).toBeInTheDocument()
    })
  })

  describe('Variant Styling', () => {
    it('applies primary variant styling', () => {
      const { container } = render(<DotBadge count={1} variant="primary" />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('bg-primary')
    })

    it('applies destructive variant styling', () => {
      const { container } = render(<DotBadge count={1} variant="destructive" />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('bg-destructive')
    })

    it('applies success variant styling', () => {
      const { container } = render(<DotBadge count={1} variant="success" />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('bg-success')
    })

    it('applies warning variant styling', () => {
      const { container } = render(<DotBadge count={1} variant="warning" />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('bg-warning')
    })

    it('uses destructive as default variant', () => {
      const { container } = render(<DotBadge count={1} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('bg-destructive')
    })
  })

  describe('Styling', () => {
    it('applies circular shape with proper sizing', () => {
      const { container } = render(<DotBadge count={9} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('inline-flex', 'items-center', 'justify-center', 'rounded-full')
    })

    it('applies animation', () => {
      const { container } = render(<DotBadge count={1} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('animate-scale-in')
    })

    it('applies shadow', () => {
      const { container } = render(<DotBadge count={1} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('shadow-sm')
    })

    it('applies bold font', () => {
      const { container } = render(<DotBadge count={5} />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('font-bold')
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<DotBadge count={3} className="custom-class" />)
      const dotBadge = container.querySelector('[data-slot="dot-badge"]')
      expect(dotBadge).toHaveClass('custom-class')
    })
  })
})

describe('StatusBadge Component', () => {
  describe('Rendering', () => {
    it('renders with data-slot attribute', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toBeInTheDocument()
    })

    it('displays default label for online status', () => {
      render(<StatusBadge status="online" />)
      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('displays custom label', () => {
      render(<StatusBadge status="online" label="Available" />)
      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.queryByText('Online')).not.toBeInTheDocument()
    })

    it('displays status indicator dot', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toBeInTheDocument()
    })
  })

  describe('Status Variants', () => {
    it('renders online status with correct styling', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toHaveClass('bg-muted/50')
    })

    it('renders offline status', () => {
      render(<StatusBadge status="offline" />)
      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('renders busy status', () => {
      render(<StatusBadge status="busy" />)
      expect(screen.getByText('Busy')).toBeInTheDocument()
    })

    it('renders away status', () => {
      render(<StatusBadge status="away" />)
      expect(screen.getByText('Away')).toBeInTheDocument()
    })

    it('respects custom labels for all statuses', () => {
      const { rerender } = render(<StatusBadge status="online" label="Available" />)
      expect(screen.getByText('Available')).toBeInTheDocument()

      rerender(<StatusBadge status="offline" label="Not Available" />)
      expect(screen.getByText('Not Available')).toBeInTheDocument()

      rerender(<StatusBadge status="busy" label="In Meeting" />)
      expect(screen.getByText('In Meeting')).toBeInTheDocument()

      rerender(<StatusBadge status="away" label="Away" />)
      expect(screen.getByText('Away')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies base styling', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toHaveClass('inline-flex', 'items-center', 'gap-1.5', 'px-2.5', 'py-1', 'rounded-lg')
    })

    it('applies text styling', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toHaveClass('text-xs', 'font-medium')
    })

    it('applies background and foreground colors', () => {
      const { container } = render(<StatusBadge status="online" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toHaveClass('bg-muted/50', 'text-foreground')
    })
  })

  describe('Custom className', () => {
    it('applies custom className', () => {
      const { container } = render(<StatusBadge status="online" className="custom-class" />)
      const statusBadge = container.querySelector('[data-slot="status-badge"]')
      expect(statusBadge).toHaveClass('custom-class')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional HTML attributes', () => {
      const { container } = render(
        <StatusBadge
          status="online"
          data-testid="custom-status"
          aria-label="User status"
          title="Online status"
        />
      )

      const statusBadge = container.querySelector('[data-testid="custom-status"]')
      expect(statusBadge).toHaveAttribute('aria-label', 'User status')
      expect(statusBadge).toHaveAttribute('title', 'Online status')
    })
  })
})
