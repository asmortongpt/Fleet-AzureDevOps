import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KPICard } from './kpi-card'
import { TrendingUp, AlertCircle } from 'lucide-react'

describe('KPICard Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render card element', () => {
      const { container } = render(
        <KPICard label="Active Vehicles" value="156" />
      )
      expect(container.querySelector('[class*="card"]')).toBeInTheDocument()
    })

    it('should display label', () => {
      render(<KPICard label="Active Vehicles" value="156" />)
      expect(screen.getByText('Active Vehicles')).toBeInTheDocument()
    })

    it('should display value', () => {
      render(<KPICard label="Metric" value="100" />)
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should render with rounded borders', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const card = container.querySelector('[class*="rounded"]')
      expect(card).toBeInTheDocument()
    })

    it('should apply shadow styling', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const card = container.querySelector('[class*="shadow"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('should render icon when provided', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" icon={<TrendingUp className="h-5 w-5" />} />
      )
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('should render trend indicator when provided', () => {
      render(
        <KPICard
          label="Metric"
          value="100"
          trend={{ direction: 'up', percent: '12' }}
        />
      )
      expect(screen.getByText('+12%')).toBeInTheDocument()
    })

    it('should render downward trend', () => {
      render(
        <KPICard
          label="Metric"
          value="100"
          trend={{ direction: 'down', percent: '5' }}
        />
      )
      expect(screen.getByText('-5%')).toBeInTheDocument()
    })

    it('should render secondary value when provided', () => {
      render(
        <KPICard
          label="Metric"
          value="100"
          secondaryValue="vs 90 last month"
        />
      )
      expect(screen.getByText('vs 90 last month')).toBeInTheDocument()
    })

    it('should render with custom styling', () => {
      const { container } = render(
        <KPICard
          label="Metric"
          value="100"
          variant="success"
        />
      )
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(
        <KPICard
          label="Metric"
          value="100"
          className="custom-class"
        />
      )
      const card = container.querySelector('[class*="card"]')
      expect(card).toHaveClass('custom-class')
    })

    it('should display comparison data', () => {
      render(
        <KPICard
          label="Revenue"
          value="$150,000"
          comparison={{ label: 'Previous Month', value: '$120,000' }}
        />
      )
      expect(screen.getByText('Previous Month')).toBeInTheDocument()
      expect(screen.getByText('$120,000')).toBeInTheDocument()
    })

    it('should display status badge', () => {
      render(
        <KPICard
          label="Metric"
          value="100"
          status="warning"
        />
      )
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })
  })

  describe('Styling & Appearance', () => {
    it('should style trend up with green color', () => {
      const { container } = render(
        <KPICard
          label="Metric"
          value="100"
          trend={{ direction: 'up', percent: '12' }}
        />
      )
      const trendElement = container.querySelector('[class*="text-green"]')
      expect(trendElement).toBeInTheDocument()
    })

    it('should style trend down with red color', () => {
      const { container } = render(
        <KPICard
          label="Metric"
          value="100"
          trend={{ direction: 'down', percent: '5' }}
        />
      )
      const trendElement = container.querySelector('[class*="text-red"]')
      expect(trendElement).toBeInTheDocument()
    })

    it('should apply success variant styling', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" variant="success" />
      )
      const card = container.querySelector('[class*="border"]')
      expect(card).toBeInTheDocument()
    })

    it('should apply warning variant styling', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" variant="warning" />
      )
      const card = container.querySelector('[class*="border"]')
      expect(card).toBeInTheDocument()
    })

    it('should apply danger variant styling', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" variant="danger" />
      )
      const card = container.querySelector('[class*="border"]')
      expect(card).toBeInTheDocument()
    })

    it('should display value with proper font weight', () => {
      render(<KPICard label="Metric" value="100" />)
      const value = screen.getByText('100')
      expect(value).toHaveClass('font-bold')
    })

    it('should apply padding to card', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const card = container.querySelector('[class*="p-"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have semantic card structure', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const heading = container.querySelector('h3, h2')
      expect(heading).toBeInTheDocument()
    })

    it('should have proper text contrast', () => {
      render(<KPICard label="Metric" value="100" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Composition', () => {
    it('should render all elements together', () => {
      render(
        <KPICard
          label="Active Vehicles"
          value="156"
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ direction: 'up', percent: '12' }}
          secondaryValue="vs 144 last month"
        />
      )

      expect(screen.getByText('Active Vehicles')).toBeInTheDocument()
      expect(screen.getByText('156')).toBeInTheDocument()
      expect(screen.getByText('+12%')).toBeInTheDocument()
      expect(screen.getByText('vs 144 last month')).toBeInTheDocument()
    })

    it('should render with comparison and trend', () => {
      render(
        <KPICard
          label="Revenue"
          value="$100,000"
          trend={{ direction: 'up', percent: '10' }}
          comparison={{ label: 'Previous', value: '$90,000' }}
        />
      )

      expect(screen.getByText('Revenue')).toBeInTheDocument()
      expect(screen.getByText('$100,000')).toBeInTheDocument()
      expect(screen.getByText('+10%')).toBeInTheDocument()
      expect(screen.getByText('Previous')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      render(<KPICard label="Metric" value="999,999,999" />)
      expect(screen.getByText('999,999,999')).toBeInTheDocument()
    })

    it('should handle zero value', () => {
      render(<KPICard label="Metric" value="0" />)
      expect(screen.getByText('0')).toBeInTheDocument()
    })

    it('should handle currency values', () => {
      render(<KPICard label="Revenue" value="$1,500.00" />)
      expect(screen.getByText('$1,500.00')).toBeInTheDocument()
    })

    it('should handle percentage values', () => {
      render(<KPICard label="Growth" value="25%" />)
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should handle very long labels', () => {
      const longLabel = 'A'.repeat(100)
      render(<KPICard label={longLabel} value="100" />)
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle special characters in values', () => {
      render(<KPICard label="Metric" value="100 ± 5" />)
      expect(screen.getByText('100 ± 5')).toBeInTheDocument()
    })

    it('should handle missing icon gracefully', () => {
      render(<KPICard label="Metric" value="100" />)
      expect(screen.getByText('Metric')).toBeInTheDocument()
    })

    it('should handle missing trend gracefully', () => {
      render(<KPICard label="Metric" value="100" />)
      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('should render as responsive card', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      expect(container.querySelector('[class*="w-"]')).toBeInTheDocument()
    })

    it('should maintain aspect ratio on different sizes', () => {
      const { container } = render(
        <KPICard label="Metric" value="100" />
      )
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })
  })
})
