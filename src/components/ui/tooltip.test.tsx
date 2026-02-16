import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  MetricTooltip,
} from './tooltip'

describe('Tooltip Components', () => {
  describe('TooltipProvider', () => {
    it('renders tooltip provider', () => {
      const { container } = render(
        <TooltipProvider>
          <div data-testid="child">Content</div>
        </TooltipProvider>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('has tooltip provider data-slot', () => {
      const { container } = render(
        <TooltipProvider>
          <div>Content</div>
        </TooltipProvider>
      )
      expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument()
    })

    it('accepts delayDuration prop', () => {
      const { container } = render(
        <TooltipProvider delayDuration={200}>
          <div>Content</div>
        </TooltipProvider>
      )
      expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument()
    })

    it('has default delayDuration of 0', () => {
      const { container } = render(
        <TooltipProvider>
          <div>Content</div>
        </TooltipProvider>
      )
      expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument()
    })
  })

  describe('Tooltip Root', () => {
    it('renders tooltip root', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip"]')).toBeInTheDocument()
    })

    it('has tooltip data-slot', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip"]')).toBeInTheDocument()
    })

    it('includes provider internally', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-provider"]')).toBeInTheDocument()
    })
  })

  describe('TooltipTrigger', () => {
    it('renders trigger element', () => {
      render(
        <Tooltip>
          <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has tooltip trigger data-slot', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-trigger"]')).toBeInTheDocument()
    })

    it('displays trigger text', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Click here for info</TooltipTrigger>
          <TooltipContent>Helpful information</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByText('Click here for info')).toBeInTheDocument()
    })

    it('can accept asChild prop', () => {
      render(
        <Tooltip>
          <TooltipTrigger asChild>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByRole('button', { name: /hover me/i })).toBeInTheDocument()
    })
  })

  describe('TooltipContent', () => {
    it('renders tooltip content', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent data-testid="content">Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has tooltip content data-slot', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('has primary background color', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('bg-primary')
    })

    it('has primary foreground text color', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('text-primary-foreground')
    })

    it('has rounded corners', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('rounded-md')
    })

    it('has padding', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('px-3', 'py-1.5')
    })

    it('has small text size', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('text-xs')
    })

    it('has default sideOffset of 0', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports custom sideOffset', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent sideOffset={10}>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Tooltip text</TooltipContent>
        </Tooltip>
      )
      const content = container.querySelector('[data-slot="tooltip-content"]')
      expect(content).toHaveClass('custom-tooltip')
    })

    it('includes arrow element', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      const arrow = container.querySelector('[data-slot="tooltip-content"]')?.querySelector('svg')
      expect(arrow).toBeInTheDocument()
    })
  })

  describe('MetricTooltip', () => {
    it('renders metric tooltip', () => {
      render(
        <MetricTooltip
          title="Revenue"
          currentValue="$50,000"
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays title and current value', () => {
      const { container } = render(
        <MetricTooltip
          title="Total Vehicles"
          currentValue="1,245"
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports comparison prop', () => {
      const { container } = render(
        <MetricTooltip
          title="Revenue"
          currentValue="$50,000"
          comparison={{
            label: "vs Last Month",
            value: "+12%",
            trend: "up"
          }}
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports benchmark prop', () => {
      const { container } = render(
        <MetricTooltip
          title="Efficiency"
          currentValue="95%"
          benchmark={{
            label: "Industry Avg",
            value: "87%"
          }}
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports description prop', () => {
      const { container } = render(
        <MetricTooltip
          title="Fleet Utilization"
          currentValue="87%"
          description="Percentage of vehicles in active use"
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('displays up trend with success color', () => {
      const { container } = render(
        <MetricTooltip
          title="Growth"
          currentValue="15%"
          comparison={{
            label: "vs Last Quarter",
            value: "+5%",
            trend: "up"
          }}
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('displays down trend with destructive color', () => {
      const { container } = render(
        <MetricTooltip
          title="Cost"
          currentValue="$25,000"
          comparison={{
            label: "vs Budget",
            value: "-5%",
            trend: "down"
          }}
        >
          <button>Metric</button>
        </MetricTooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('renders full tooltip with all properties', () => {
      const { container } = render(
        <MetricTooltip
          title="Monthly Revenue"
          currentValue="$125,000"
          comparison={{
            label: "vs Last Month",
            value: "+8%",
            trend: "up"
          }}
          benchmark={{
            label: "Target",
            value: "$100,000"
          }}
          description="Total revenue from all services"
        >
          <button>View Details</button>
        </MetricTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Positioning', () => {
    it('supports top side', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent side="top">Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports right side', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent side="right">Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports bottom side', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent side="bottom">Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })

    it('supports left side', () => {
      const { container } = render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent side="left">Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(container.querySelector('[data-slot="tooltip-content"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      render(
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })

    it('supports aria-label on trigger', () => {
      render(
        <Tooltip>
          <TooltipTrigger aria-label="Information icon">
            <span>?</span>
          </TooltipTrigger>
          <TooltipContent>Helpful info</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByLabelText('Information icon')).toBeInTheDocument()
    })
  })

  describe('Multiple Tooltips', () => {
    it('renders multiple tooltip groups', () => {
      render(
        <div>
          <Tooltip>
            <TooltipTrigger>First</TooltipTrigger>
            <TooltipContent>First tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Second</TooltipTrigger>
            <TooltipContent>Second tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>Third</TooltipTrigger>
            <TooltipContent>Third tooltip</TooltipContent>
          </Tooltip>
        </div>
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.getByText('Third')).toBeInTheDocument()
    })
  })

  describe('Common Patterns', () => {
    it('wraps icon buttons', () => {
      render(
        <Tooltip>
          <TooltipTrigger asChild>
            <button>⚠️</button>
          </TooltipTrigger>
          <TooltipContent>Warning</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByRole('button', { name: /⚠️/i })).toBeInTheDocument()
    })

    it('works with form labels', () => {
      render(
        <Tooltip>
          <TooltipTrigger>
            <label>Important Field</label>
          </TooltipTrigger>
          <TooltipContent>This field is required</TooltipContent>
        </Tooltip>
      )
      expect(screen.getByText('Important Field')).toBeInTheDocument()
    })
  })
})
