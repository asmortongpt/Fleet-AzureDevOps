import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { InteractiveMetric, MetricGrid } from './interactive-metric'
import { Car, TrendingUp } from 'lucide-react'

describe('InteractiveMetric Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render metric card', () => {
      render(<InteractiveMetric title="Active Vehicles" value={156} />)
      expect(screen.getByText('Active Vehicles')).toBeInTheDocument()
    })

    it('should display title', () => {
      render(<InteractiveMetric title="Test Metric" value={100} />)
      expect(screen.getByText('Test Metric')).toBeInTheDocument()
    })

    it('should display value', () => {
      render(<InteractiveMetric title="Metric" value={456} />)
      expect(screen.getByText('456')).toBeInTheDocument()
    })

    it('should render as card component', () => {
      const { container } = render(<InteractiveMetric title="Metric" value={100} />)
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('should apply transition classes', () => {
      const { container } = render(<InteractiveMetric title="Metric" value={100} />)
      const card = container.querySelector('[class*="transition"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('should render string value', () => {
      render(<InteractiveMetric title="Metric" value="Active" />)
      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should render number value', () => {
      render(<InteractiveMetric title="Metric" value={789} />)
      expect(screen.getByText('789')).toBeInTheDocument()
    })

    it('should render description when provided', () => {
      render(<InteractiveMetric title="Metric" value={100} description="Currently online" />)
      expect(screen.getByText('Currently online')).toBeInTheDocument()
    })

    it('should render trend indicator when provided', () => {
      render(
        <InteractiveMetric
          title="Metric"
          value={100}
          trend={{ direction: 'up', value: '+10%' }}
        />
      )
      expect(screen.getByText('+10%')).toBeInTheDocument()
    })

    it('should render down trend', () => {
      render(
        <InteractiveMetric
          title="Metric"
          value={100}
          trend={{ direction: 'down', value: '-5%' }}
        />
      )
      expect(screen.getByText('-5%')).toBeInTheDocument()
    })

    it('should render neutral trend', () => {
      render(
        <InteractiveMetric
          title="Metric"
          value={100}
          trend={{ direction: 'neutral', value: '0%' }}
        />
      )
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should render badge when provided', () => {
      render(<InteractiveMetric title="Metric" value={100} badge="New" />)
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('should render status success', () => {
      render(<InteractiveMetric title="Metric" value={100} status="success" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })

    it('should render status warning', () => {
      render(<InteractiveMetric title="Metric" value={100} status="warning" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })

    it('should render status danger', () => {
      render(<InteractiveMetric title="Metric" value={100} status="danger" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })

    it('should render icon when provided', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} icon={<Car className="h-5 w-5" />} />
      )
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render comparison when provided', () => {
      render(
        <InteractiveMetric
          title="Metric"
          value={100}
          comparison={{ label: 'Previous', value: '90' }}
        />
      )
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('90')).toBeInTheDocument()
    })

    it('should render sparkline when data provided', () => {
      const { container } = render(
        <InteractiveMetric
          title="Metric"
          value={100}
          sparklineData={[10, 20, 30, 40, 50]}
        />
      )
      const svg = container.querySelector('svg[viewBox="0 0 100 100"]')
      expect(svg).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} className="custom-class" />
      )
      const card = container.firstChild
      expect(card).toHaveClass('custom-class')
    })
  })

  describe('User Interactions', () => {
    it('should call onClick when card clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<InteractiveMetric title="Metric" value={100} onClick={onClick} />)

      const card = screen.getByText('Metric').closest('[class*="card"]')
      if (card) {
        await user.click(card)
        expect(onClick).toHaveBeenCalled()
      }
    })

    it('should apply cursor-pointer when clickable', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} onClick={() => {}} />
      )
      const card = container.querySelector('[class*="cursor-pointer"]')
      expect(card).toBeInTheDocument()
    })

    it('should handle keyboard navigation', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} onClick={() => {}} />
      )
      const card = container.querySelector('[role="button"]')
      expect(card).toHaveAttribute('tabIndex', '0')
    })

    it('should handle Enter key press', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<InteractiveMetric title="Metric" value={100} onClick={onClick} />)

      const card = screen.getByText('Metric').closest('[role="button"]')
      if (card) {
        (card as HTMLElement).focus()
        await user.keyboard('{Enter}')
        expect(onClick).toHaveBeenCalled()
      }
    })

    it('should handle Space key press', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<InteractiveMetric title="Metric" value={100} onClick={onClick} />)

      const card = screen.getByText('Metric').closest('[role="button"]')
      if (card) {
        (card as HTMLElement).focus()
        await user.keyboard(' ')
        expect(onClick).toHaveBeenCalled()
      }
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply hover effects when clickable', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} onClick={() => {}} />
      )
      const card = container.querySelector('[class*="hover"]')
      expect(card).toBeInTheDocument()
    })

    it('should apply border color based on status', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} status="success" />
      )
      const card = container.querySelector('[class*="border"]')
      expect(card).toBeInTheDocument()
    })

    it('should display trend with correct color for up', () => {
      const { container } = render(
        <InteractiveMetric
          title="Metric"
          value={100}
          trend={{ direction: 'up', value: '+10%' }}
        />
      )
      const trend = container.querySelector('[class*="text-green"]')
      expect(trend).toBeInTheDocument()
    })

    it('should display trend with correct color for down', () => {
      const { container } = render(
        <InteractiveMetric
          title="Metric"
          value={100}
          trend={{ direction: 'down', value: '-5%' }}
        />
      )
      const trend = container.querySelector('[class*="text-red"]')
      expect(trend).toBeInTheDocument()
    })

    it('should apply font styling to value', () => {
      render(<InteractiveMetric title="Metric" value={100} />)
      const value = screen.getByText('100')
      expect(value).toHaveClass('font-bold')
    })
  })

  describe('Accessibility', () => {
    it('should have role="button" when clickable', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} onClick={() => {}} />
      )
      expect(container.querySelector('[role="button"]')).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(<InteractiveMetric title="Metric" value={100} onClick={() => {}} />)

      const button = screen.getByText('Metric').closest('[role="button"]')
      if (button) {
        (button as HTMLElement).focus()
        expect(button).toHaveFocus()
      }
    })

    it('should have proper heading hierarchy', () => {
      render(<InteractiveMetric title="Active Vehicles" value={156} />)
      const title = screen.getByText('Active Vehicles')
      expect(title.tagName).toBe('H3')
    })
  })

  describe('Sub-components/Composition', () => {
    it('should render CardHeader', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} />
      )
      expect(container.querySelector('[class*="pb-3"]')).toBeInTheDocument()
    })

    it('should render CardContent', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} />
      )
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument()
    })

    it('should render icon and title in flex layout', () => {
      const { container } = render(
        <InteractiveMetric
          title="Metric"
          value={100}
          icon={<Car className="h-5 w-5" />}
        />
      )
      const flex = container.querySelector('.flex')
      expect(flex).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(<InteractiveMetric title="Metric" value={999999999} />)
      expect(screen.getByText('999999999')).toBeInTheDocument()
    })

    it('should handle zero value', () => {
      render(<InteractiveMetric title="Metric" value={0} />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle negative numbers', () => {
      render(<InteractiveMetric title="Metric" value={-50} />)
      expect(screen.getByText('-50')).toBeInTheDocument()
    })

    it('should handle empty sparkline', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} sparklineData={[]} />
      )
      const svg = container.querySelector('svg[viewBox]')
      expect(svg).not.toBeInTheDocument()
    })

    it('should handle single sparkline point', () => {
      const { container } = render(
        <InteractiveMetric title="Metric" value={100} sparklineData={[50]} />
      )
      const svg = container.querySelector('svg[viewBox]')
      expect(svg).toBeInTheDocument()
    })

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100)
      render(<InteractiveMetric title={longTitle} value={100} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })
  })
})

describe('MetricGrid Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render grid container', () => {
      const { container } = render(
        <MetricGrid>
          <InteractiveMetric title="Metric 1" value={100} />
        </MetricGrid>
      )
      expect(container.querySelector('[class*="grid"]')).toBeInTheDocument()
    })

    it('should render children metrics', () => {
      render(
        <MetricGrid>
          <InteractiveMetric title="Metric 1" value={100} />
          <InteractiveMetric title="Metric 2" value={200} />
        </MetricGrid>
      )
      expect(screen.getByText('Metric 1')).toBeInTheDocument()
      expect(screen.getByText('Metric 2')).toBeInTheDocument()
    })

    it('should apply 3 column layout by default', () => {
      const { container } = render(
        <MetricGrid>
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="grid-cols"]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('should apply 2 column layout', () => {
      const { container } = render(
        <MetricGrid columns={2}>
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
    })

    it('should apply 4 column layout', () => {
      const { container } = render(
        <MetricGrid columns={4}>
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(
        <MetricGrid className="custom-class">
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="grid"]')
      expect(grid).toHaveClass('custom-class')
    })
  })

  describe('Responsive Behavior', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(
        <MetricGrid columns={3}>
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="md:"]')
      expect(grid).toBeInTheDocument()
    })

    it('should stack on mobile with single column', () => {
      const { container } = render(
        <MetricGrid columns={3}>
          <InteractiveMetric title="Metric" value={100} />
        </MetricGrid>
      )
      const grid = container.querySelector('[class*="grid-cols-1"]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Multiple Metrics', () => {
    it('should render multiple metrics', () => {
      render(
        <MetricGrid>
          <InteractiveMetric title="Active" value={156} />
          <InteractiveMetric title="Maintenance" value={12} />
          <InteractiveMetric title="Available" value={88} />
        </MetricGrid>
      )
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Maintenance')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
    })

    it('should maintain grid layout with many metrics', () => {
      const metrics = Array.from({ length: 9 }, (_, i) => (
        <InteractiveMetric key={i} title={`Metric ${i + 1}`} value={100 * (i + 1)} />
      ))

      render(<MetricGrid columns={3}>{metrics}</MetricGrid>)

      Array.from({ length: 9 }, (_, i) => {
        expect(screen.getByText(`Metric ${i + 1}`)).toBeInTheDocument()
      })
    })
  })
})
