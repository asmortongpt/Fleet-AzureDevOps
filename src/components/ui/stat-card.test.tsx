import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  StatCard,
  ProgressRing,
  StatusDot,
  QuickStat,
  StatGrid,
  MetricBadge
} from './stat-card'
import { Heart, TrendingUp } from 'lucide-react'

describe('StatCard Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders stat card with title and value', () => {
      render(<StatCard title="Active Vehicles" value="1,234" />)
      expect(screen.getByText('Active Vehicles')).toBeInTheDocument()
      expect(screen.getByText('1,234')).toBeInTheDocument()
    })

    it('renders stat card with numeric value', () => {
      render(<StatCard title="Revenue" value={50000} />)
      expect(screen.getByText('50000')).toBeInTheDocument()
    })

    it('renders stat card with subtitle', () => {
      render(<StatCard title="Fleet Size" value="42" subtitle="Vehicles in operation" />)
      expect(screen.getByText('Vehicles in operation')).toBeInTheDocument()
    })

    it('renders stat card with description alias', () => {
      render(<StatCard title="Drivers" value="18" description="Active drivers" />)
      expect(screen.getByText('Active drivers')).toBeInTheDocument()
    })

    it('prefers description over subtitle when both provided', () => {
      render(<StatCard title="Test" value="100" subtitle="Subtitle" description="Description" />)
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.queryByText('Subtitle')).not.toBeInTheDocument()
    })

    it('renders stat card with icon', () => {
      const { container } = render(<StatCard title="Users" value="52" icon={<Heart data-testid="icon" />} />)
      expect(screen.getByTestId('icon')).toBeInTheDocument()
    })

    it('renders with proper structural hierarchy', () => {
      const { container } = render(<StatCard title="Title" value="Value" />)
      const card = container.querySelector('[role="button"], div')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('rounded-md', 'border')
    })
  })

  describe('Props & Configuration', () => {
    it('applies default variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('bg-card')
    })

    it('applies primary variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" variant="primary" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('bg-card')
      expect(card).toHaveClass('border-primary/20')
    })

    it('applies success variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" variant="success" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('border-success/20')
    })

    it('applies warning variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" variant="warning" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('border-warning/20')
    })

    it('applies danger variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" variant="danger" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('border-destructive/20')
    })

    it('applies info variant styling', () => {
      const { container } = render(<StatCard title="Test" value="123" variant="info" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('border-blue-500/20')
    })

    it('applies small size', () => {
      const { container } = render(<StatCard title="Test" value="123" size="sm" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('p-3')
    })

    it('applies default size', () => {
      const { container } = render(<StatCard title="Test" value="123" size="default" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('p-2')
    })

    it('applies large size', () => {
      const { container } = render(<StatCard title="Test" value="123" size="lg" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('p-5')
    })

    it('applies custom className', () => {
      const { container } = render(<StatCard title="Test" value="123" className="custom-class" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('Trend Indicators', () => {
    it('renders up trend with arrow and value', () => {
      render(<StatCard title="Sales" value="$10K" trend="up" trendValue="+15%" />)
      expect(screen.getByText('+15%')).toBeInTheDocument()
    })

    it('renders down trend with arrow and value', () => {
      render(<StatCard title="Costs" value="$5K" trend="down" trendValue="-8%" />)
      expect(screen.getByText('-8%')).toBeInTheDocument()
    })

    it('renders neutral trend', () => {
      render(<StatCard title="Metric" value="100" trend="neutral" trendValue="0%" />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('converts numeric change to percentage string when trend is set', () => {
      render(<StatCard title="Growth" value="50" trend="up" change={25} />)
      expect(screen.getByText('+25%')).toBeInTheDocument()
    })

    it('converts negative numeric change correctly when trend is set', () => {
      render(<StatCard title="Decline" value="50" trend="down" change={-10} />)
      expect(screen.getByText('-10%')).toBeInTheDocument()
    })

    it('prefers trendValue over change prop', () => {
      render(<StatCard title="Test" value="100" trend="up" change={50} trendValue="Custom" />)
      expect(screen.getByText('Custom')).toBeInTheDocument()
    })

    it('applies success color for up trend', () => {
      const { container } = render(<StatCard title="Test" value="100" trend="up" trendValue="+5%" />)
      const trendDiv = container.querySelector('div[class*="text-success"]')
      expect(trendDiv).toBeInTheDocument()
    })

    it('applies destructive color for down trend', () => {
      const { container } = render(<StatCard title="Test" value="100" trend="down" trendValue="-5%" />)
      const trendDiv = container.querySelector('div[class*="text-destructive"]')
      expect(trendDiv).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('becomes clickable when onClick is provided', () => {
      const handleClick = vi.fn()
      const { container } = render(<StatCard title="Test" value="100" onClick={handleClick} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveAttribute('role', 'button')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('handles click events', async () => {
      const handleClick = vi.fn()
      const { container } = render(<StatCard title="Test" value="100" onClick={handleClick} />)
      const card = container.querySelector('div[role="button"]')
      if (card) {
        fireEvent.click(card)
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('calls onClick on Enter key', () => {
      const handleClick = vi.fn()
      const { container } = render(<StatCard title="Test" value="100" onClick={handleClick} />)
      const card = container.querySelector('div[role="button"]')
      if (card) {
        fireEvent.keyDown(card, { key: 'Enter' })
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('calls onClick on Space key', () => {
      const handleClick = vi.fn()
      const { container } = render(<StatCard title="Test" value="100" onClick={handleClick} />)
      const card = container.querySelector('div[role="button"]')
      if (card) {
        fireEvent.keyDown(card, { key: ' ' })
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('does not call onClick on other keys', () => {
      const handleClick = vi.fn()
      const { container } = render(<StatCard title="Test" value="100" onClick={handleClick} />)
      const card = container.querySelector('div[role="button"]')
      if (card) {
        fireEvent.keyDown(card, { key: 'Escape' })
        expect(handleClick).not.toHaveBeenCalled()
      }
    })

    it('applies hover styling when clickable', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveClass('hover:-translate-y-0.5', 'hover:shadow-md')
    })

    it('applies active state styling', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveClass('active:translate-y-0', 'active:shadow-sm')
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label when clickable', () => {
      const { container } = render(<StatCard title="Revenue" value="$10K" onClick={() => {}} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Revenue'))
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('$10K'))
    })

    it('includes drilldown label in aria-label', () => {
      const { container } = render(
        <StatCard title="Test" value="100" onClick={() => {}} drilldownLabel="Explore" />
      )
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Explore'))
    })

    it('has default drilldown label', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('View Details'))
    })

    it('has focus ring on clickable card', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      const card = container.querySelector('div[role="button"]')
      expect(card).toHaveClass('focus-visible:ring-2')
    })

    it('does not have button role when not clickable', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('div')
      expect(card).not.toHaveAttribute('role', 'button')
    })

    it('does not have tabIndex when not clickable', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('div')
      const tabIndex = card?.getAttribute('tabIndex')
      expect(tabIndex).toBeNull()
    })
  })

  describe('Styling & Appearance', () => {
    it('has accent line at top', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const accentLine = container.querySelector('div[class*="absolute top-0"]')
      expect(accentLine).toBeInTheDocument()
      expect(accentLine).toHaveClass('h-0.5', 'bg-gradient-to-r')
    })

    it('has proper shadow and transitions', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('shadow-sm', 'transition-all', 'duration-300')
    })

    it('has rounded corners', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const card = container.querySelector('div[class*="border"]')
      expect(card).toHaveClass('rounded-md')
    })

    it('title has proper styling', () => {
      render(<StatCard title="Custom Title" value="100" />)
      const title = screen.getByText('Custom Title')
      expect(title).toHaveClass('font-semibold', 'text-muted-foreground', 'uppercase')
    })

    it('value has proper styling', () => {
      render(<StatCard title="Test" value="$1,000" />)
      const value = screen.getByText('$1,000')
      expect(value).toHaveClass('font-bold', 'tabular-nums')
    })
  })

  describe('Drilldown Indicator', () => {
    it('shows chevron when clickable', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      // ChevronRight icon should be rendered - check for the indicator div
      const indicator = container.querySelector('div[class*="absolute bottom-3"]')
      expect(indicator).toBeInTheDocument()
    })

    it('hides chevron when not clickable', () => {
      const { container } = render(<StatCard title="Test" value="100" />)
      const bottomChevron = container.querySelector('div[class*="absolute bottom"]')
      expect(bottomChevron).not.toBeInTheDocument()
    })

    it('chevron has proper hover styling', () => {
      const { container } = render(<StatCard title="Test" value="100" onClick={() => {}} />)
      const indicator = container.querySelector('div[class*="absolute bottom-3"]')
      expect(indicator).toHaveClass('opacity-0', 'group-hover:opacity-60')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty string value', () => {
      render(<StatCard title="Test" value="" />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('handles long title with truncation', () => {
      const { container } = render(
        <StatCard title="This is a very long title that should be truncated" value="100" />
      )
      const title = screen.getByText(/This is a very long title/)
      expect(title).toHaveClass('truncate')
    })

    it('handles zero value', () => {
      render(<StatCard title="Count" value={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles undefined trend', () => {
      render(<StatCard title="Test" value="100" trend={undefined} />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('handles special characters in value', () => {
      render(<StatCard title="Rate" value="€1,250.50" />)
      expect(screen.getByText('€1,250.50')).toBeInTheDocument()
    })

    it('does not render trend without trendValue', () => {
      const { container } = render(<StatCard title="Test" value="100" trend="up" />)
      // Should not render trend section if trendValue is undefined
      const trendDisplay = container.querySelector('div[class*="flex items-center gap-0.5"]')
      expect(trendDisplay).not.toBeInTheDocument()
    })

    it('handles change value of zero when trend is set', () => {
      render(<StatCard title="Test" value="100" trend="neutral" change={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })
  })

  describe('Icon Behavior', () => {
    it('displays icon in correct container', () => {
      const { container } = render(
        <StatCard title="Test" value="100" icon={<TrendingUp data-testid="trend-icon" />} />
      )
      expect(screen.getByTestId('trend-icon')).toBeInTheDocument()
    })

    it('applies hover scale effect to icon', () => {
      const { container } = render(
        <StatCard title="Test" value="100" icon={<Heart />} onClick={() => {}} />
      )
      const iconContainer = container.querySelector('div[class*="rounded-md shrink-0"]')
      expect(iconContainer).toHaveClass('group-hover:scale-110')
    })

    it('applies variant-specific icon background', () => {
      const { container } = render(
        <StatCard title="Test" value="100" icon={<Heart />} variant="success" />
      )
      const iconContainer = container.querySelector('div[class*="rounded-md shrink-0"]')
      expect(iconContainer?.className).toContain('bg-success/10')
    })

    it('applies variant-specific icon color', () => {
      const { container } = render(
        <StatCard title="Test" value="100" icon={<Heart />} variant="danger" />
      )
      const iconContainer = container.querySelector('div[class*="rounded-md shrink-0"]')
      expect(iconContainer?.className).toContain('text-destructive')
    })
  })
})

describe('ProgressRing Component', () => {
  describe('Rendering', () => {
    it('renders progress ring with SVG', () => {
      const { container } = render(<ProgressRing progress={75} />)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '80')
      expect(svg).toHaveAttribute('height', '80')
    })

    it('renders progress percentage text', () => {
      render(<ProgressRing progress={50} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<ProgressRing progress={75} label="Complete" />)
      expect(screen.getByText('Complete')).toBeInTheDocument()
    })

    it('renders with sublabel', () => {
      render(<ProgressRing progress={75} label="Complete" sublabel="In Progress" />)
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })
  })

  describe('Progress Calculation', () => {
    it('calculates correct stroke offset for 0%', () => {
      const { container } = render(<ProgressRing progress={0} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('calculates correct stroke offset for 50%', () => {
      const { container } = render(<ProgressRing progress={50} />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('calculates correct stroke offset for 100%', () => {
      const { container } = render(<ProgressRing progress={100} />)
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('renders progress over 100% as-is (SVG uses clamped, display shows raw)', () => {
      render(<ProgressRing progress={150} />)
      expect(screen.getByText('150%')).toBeInTheDocument()
    })

    it('renders negative progress as-is without clamping', () => {
      render(<ProgressRing progress={-50} />)
      expect(screen.getByText('-50%')).toBeInTheDocument()
    })
  })

  describe('Styling & Variants', () => {
    it('applies blue color by default', () => {
      const { container } = render(<ProgressRing progress={50} />)
      const circle = container.querySelector('circle[class*="stroke-primary"]')
      expect(circle).toBeInTheDocument()
    })

    it('applies green color variant', () => {
      const { container } = render(<ProgressRing progress={50} color="green" />)
      const circle = container.querySelector('circle[class*="stroke-success"]')
      expect(circle).toBeInTheDocument()
    })

    it('applies yellow color variant', () => {
      const { container } = render(<ProgressRing progress={50} color="yellow" />)
      const circle = container.querySelector('circle[class*="stroke-warning"]')
      expect(circle).toBeInTheDocument()
    })

    it('applies red color variant', () => {
      const { container } = render(<ProgressRing progress={50} color="red" />)
      const circle = container.querySelector('circle[class*="stroke-destructive"]')
      expect(circle).toBeInTheDocument()
    })

    it('applies custom size', () => {
      const { container } = render(<ProgressRing progress={50} size={120} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '120')
      expect(svg).toHaveAttribute('height', '120')
    })

    it('applies custom stroke width', () => {
      const { container } = render(<ProgressRing progress={50} strokeWidth={8} />)
      const circles = container.querySelectorAll('circle')
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '8')
      })
    })
  })

  describe('Accessibility', () => {
    it('displays progress as text content', () => {
      render(<ProgressRing progress={42} />)
      expect(screen.getByText('42%')).toBeInTheDocument()
    })

    it('label is readable', () => {
      render(<ProgressRing progress={50} label="Files Processed" />)
      expect(screen.getByText('Files Processed')).toBeInTheDocument()
    })
  })

  describe('SVG Structure', () => {
    it('renders background circle', () => {
      const { container } = render(<ProgressRing progress={50} />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThanOrEqual(2)
    })

    it('applies -rotate-90 to SVG', () => {
      const { container } = render(<ProgressRing progress={50} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('transform', '-rotate-90')
    })

    it('centers text content absolutely', () => {
      const { container } = render(<ProgressRing progress={50} />)
      const textContainer = container.querySelector('div[class*="absolute inset-0"]')
      expect(textContainer).toBeInTheDocument()
      expect(textContainer).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center')
    })
  })
})

describe('StatusDot Component', () => {
  describe('Rendering', () => {
    it('renders status dot', () => {
      const { container } = render(<StatusDot status="online" />)
      const spans = container.querySelectorAll('span')
      expect(spans.length).toBeGreaterThan(0)
    })

    it('renders online status', () => {
      const { container } = render(<StatusDot status="online" />)
      const dot = container.querySelector('span[class*="bg-success"]')
      expect(dot).toBeInTheDocument()
    })

    it('renders offline status', () => {
      const { container } = render(<StatusDot status="offline" />)
      const dot = container.querySelector('span[class*="bg-muted-foreground"]')
      expect(dot).toBeInTheDocument()
    })

    it('renders warning status', () => {
      const { container } = render(<StatusDot status="warning" />)
      const dot = container.querySelector('span[class*="bg-warning"]')
      expect(dot).toBeInTheDocument()
    })

    it('renders error status', () => {
      const { container } = render(<StatusDot status="error" />)
      const dot = container.querySelector('span[class*="bg-destructive"]')
      expect(dot).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<StatusDot status="online" label="Active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('applies small size', () => {
      const { container } = render(<StatusDot status="online" size="sm" />)
      const dot = container.querySelector('span[class*="h-1.5"]')
      expect(dot).toBeInTheDocument()
    })

    it('applies default size', () => {
      const { container } = render(<StatusDot status="online" size="default" />)
      const dot = container.querySelector('span[class*="h-2.5"]')
      expect(dot).toBeInTheDocument()
    })

    it('applies large size', () => {
      const { container } = render(<StatusDot status="online" size="lg" />)
      const dot = container.querySelector('span[class*="h-3"]')
      expect(dot).toBeInTheDocument()
    })
  })

  describe('Online Status Animation', () => {
    it('has ping animation for online status', () => {
      const { container } = render(<StatusDot status="online" />)
      const pingElement = container.querySelector('span[class*="animate-ping"]')
      expect(pingElement).toBeInTheDocument()
    })

    it('does not have ping animation for offline', () => {
      const { container } = render(<StatusDot status="offline" />)
      const pingElement = container.querySelector('span[class*="animate-ping"]')
      expect(pingElement).not.toBeInTheDocument()
    })

    it('does not have ping animation for warning', () => {
      const { container } = render(<StatusDot status="warning" />)
      const pingElement = container.querySelector('span[class*="animate-ping"]')
      expect(pingElement).not.toBeInTheDocument()
    })

    it('does not have ping animation for error', () => {
      const { container } = render(<StatusDot status="error" />)
      const pingElement = container.querySelector('span[class*="animate-ping"]')
      expect(pingElement).not.toBeInTheDocument()
    })
  })

  describe('Label Styling', () => {
    it('label has proper styling', () => {
      render(<StatusDot status="online" label="Connected" />)
      const label = screen.getByText('Connected')
      expect(label).toHaveClass('text-sm', 'text-muted-foreground', 'font-medium')
    })
  })
})

describe('QuickStat Component', () => {
  describe('Rendering', () => {
    it('renders label and value', () => {
      render(<QuickStat label="Total Users" value={152} />)
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('152')).toBeInTheDocument()
    })

    it('renders with string value', () => {
      render(<QuickStat label="Status" value="Active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('renders with numeric value', () => {
      render(<QuickStat label="Count" value={42} />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders without trend', () => {
      render(<QuickStat label="Metric" value="100" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })

    it('renders with up trend', () => {
      render(<QuickStat label="Growth" value="50" trend="up" />)
      expect(screen.getByText('Growth')).toBeInTheDocument()
    })

    it('renders with down trend', () => {
      render(<QuickStat label="Decline" value="50" trend="down" />)
      expect(screen.getByText('Decline')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('becomes clickable when onClick provided', () => {
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={() => {}} />
      )
      const stat = container.querySelector('div[role="button"]')
      expect(stat).toHaveAttribute('role', 'button')
      expect(stat).toHaveAttribute('tabIndex', '0')
    })

    it('handles click events', async () => {
      const handleClick = vi.fn()
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={handleClick} />
      )
      const stat = container.querySelector('div[role="button"]')
      if (stat) {
        fireEvent.click(stat)
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('handles Enter key', () => {
      const handleClick = vi.fn()
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={handleClick} />
      )
      const stat = container.querySelector('div[role="button"]')
      if (stat) {
        fireEvent.keyDown(stat, { key: 'Enter' })
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })

    it('handles Space key', () => {
      const handleClick = vi.fn()
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={handleClick} />
      )
      const stat = container.querySelector('div[role="button"]')
      if (stat) {
        fireEvent.keyDown(stat, { key: ' ' })
        expect(handleClick).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Styling', () => {
    it('applies hover styling when clickable', () => {
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={() => {}} />
      )
      const stat = container.querySelector('div[role="button"]')
      expect(stat).toHaveClass('hover:bg-muted/40', 'active:bg-muted/60')
    })

    it('applies focus ring when clickable', () => {
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={() => {}} />
      )
      const stat = container.querySelector('div[role="button"]')
      expect(stat).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring')
    })

    it('has border separator by default', () => {
      const { container } = render(<QuickStat label="Stat" value="100" />)
      const stat = container.querySelector('div')
      expect(stat).toHaveClass('border-b', 'border-border/50')
    })

    it('label has proper styling', () => {
      render(<QuickStat label="Test Label" value="100" />)
      const label = screen.getByText('Test Label')
      expect(label).toHaveClass('text-xs', 'text-muted-foreground')
    })

    it('value has proper styling', () => {
      render(<QuickStat label="Test" value="100" />)
      const value = screen.getByText('100')
      expect(value).toHaveClass('text-sm', 'font-semibold', 'tabular-nums')
    })
  })

  describe('Trend Icon Display', () => {
    it('shows up trend icon', () => {
      const { container } = render(<QuickStat label="Stat" value="100" trend="up" />)
      const upTrend = container.querySelector('span[class*="text-success"]')
      expect(upTrend).toBeInTheDocument()
    })

    it('shows down trend icon', () => {
      const { container } = render(<QuickStat label="Stat" value="100" trend="down" />)
      const downTrend = container.querySelector('span[class*="text-destructive"]')
      expect(downTrend).toBeInTheDocument()
    })

    it('shows chevron for clickable item', () => {
      const { container } = render(
        <QuickStat label="Stat" value="100" onClick={() => {}} />
      )
      const chevron = container.querySelector('svg[class*="text-muted-foreground"]')
      expect(chevron).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles long label with truncation', () => {
      render(<QuickStat label="This is a very long label" value="100" />)
      const label = screen.getByText(/This is a very long/)
      expect(label).toBeInTheDocument()
    })

    it('handles zero value', () => {
      render(<QuickStat label="Zero" value={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles special characters in value', () => {
      render(<QuickStat label="Currency" value="$1,000" />)
      expect(screen.getByText('$1,000')).toBeInTheDocument()
    })
  })
})

describe('StatGrid Component', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <StatGrid>
          <div data-testid="child">Child</div>
        </StatGrid>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <StatGrid>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
        </StatGrid>
      )
      expect(screen.getByTestId('child1')).toBeInTheDocument()
      expect(screen.getByTestId('child2')).toBeInTheDocument()
    })

    it('renders stat cards as children', () => {
      render(
        <StatGrid>
          <StatCard title="Card 1" value="100" />
          <StatCard title="Card 2" value="200" />
        </StatGrid>
      )
      expect(screen.getByText('Card 1')).toBeInTheDocument()
      expect(screen.getByText('Card 2')).toBeInTheDocument()
    })
  })

  describe('Props & Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <StatGrid className="custom-grid">
          <div>Child</div>
        </StatGrid>
      )
      const grid = container.querySelector('div[class*="custom-grid"]')
      expect(grid).toBeInTheDocument()
    })

    it('is a simple container div', () => {
      const { container } = render(
        <StatGrid>
          <div data-testid="child">Content</div>
        </StatGrid>
      )
      const grid = container.firstChild
      expect(grid?.nodeName).toBe('DIV')
    })
  })

  describe('Layout Support', () => {
    it('works with grid layout via className', () => {
      render(
        <StatGrid className="grid grid-cols-3 gap-4">
          <StatCard title="1" value="100" />
          <StatCard title="2" value="200" />
          <StatCard title="3" value="300" />
        </StatGrid>
      )
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})

describe('MetricBadge Component', () => {
  describe('Rendering', () => {
    it('renders value', () => {
      render(<MetricBadge value="42" />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })

    it('renders with label', () => {
      render(<MetricBadge value="42" label="items" />)
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('items')).toBeInTheDocument()
    })

    it('renders numeric value', () => {
      render(<MetricBadge value={123} />)
      expect(screen.getByText('123')).toBeInTheDocument()
    })

    it('renders string value', () => {
      render(<MetricBadge value="Active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies default variant', () => {
      const { container } = render(<MetricBadge value="100" variant="default" />)
      const badge = container.querySelector('div[class*="bg-muted"]')
      expect(badge).toHaveClass('bg-muted', 'text-muted-foreground')
    })

    it('applies success variant', () => {
      const { container } = render(<MetricBadge value="100" variant="success" />)
      const badge = container.querySelector('div[class*="bg-success"]')
      expect(badge).toHaveClass('bg-success/10', 'text-success')
    })

    it('applies warning variant', () => {
      const { container } = render(<MetricBadge value="100" variant="warning" />)
      const badge = container.querySelector('div[class*="bg-warning"]')
      expect(badge).toHaveClass('bg-warning/10', 'text-warning')
    })

    it('applies danger variant', () => {
      const { container } = render(<MetricBadge value="100" variant="danger" />)
      const badge = container.querySelector('div[class*="bg-destructive"]')
      expect(badge).toHaveClass('bg-destructive/10', 'text-destructive')
    })
  })

  describe('Styling', () => {
    it('has proper badge styling', () => {
      const { container } = render(<MetricBadge value="42" />)
      const badge = container.querySelector('div')
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'gap-1.5',
        'px-2.5',
        'py-1',
        'rounded-lg',
        'text-xs',
        'font-medium'
      )
    })

    it('value has proper styling', () => {
      render(<MetricBadge value="100" />)
      const value = screen.getByText('100')
      expect(value).toHaveClass('font-semibold', 'tabular-nums')
    })

    it('label has opacity styling', () => {
      render(<MetricBadge value="100" label="items" />)
      const label = screen.getByText('items')
      expect(label).toHaveClass('opacity-80')
    })

    it('applies custom className', () => {
      const { container } = render(
        <MetricBadge value="100" className="custom-badge" />
      )
      const badge = container.querySelector('div')
      expect(badge).toHaveClass('custom-badge')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero value', () => {
      render(<MetricBadge value={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('handles special characters in value', () => {
      render(<MetricBadge value="€1.5M" />)
      expect(screen.getByText('€1.5M')).toBeInTheDocument()
    })

    it('handles special characters in label', () => {
      render(<MetricBadge value="100" label="km/h" />)
      expect(screen.getByText('km/h')).toBeInTheDocument()
    })

    it('works without label', () => {
      render(<MetricBadge value="42" />)
      expect(screen.getByText('42')).toBeInTheDocument()
    })
  })
})
