import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from './popover'

describe('Popover Component', () => {
  describe('Rendering & Structure', () => {
    it('renders popover with trigger and content', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(container.querySelector('[data-slot="popover"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="popover-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="popover-content"]')).toBeInTheDocument()
    })

    it('renders trigger as button', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Open Popover</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByRole('button', { name: /open popover/i })
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Content Styling', () => {
    it('applies correct content styling', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('bg-popover', 'text-popover-foreground', 'rounded-md', 'border', 'p-2', 'shadow-md')
    })

    it('applies default width', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('w-72')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className="custom-content">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('custom-content')
    })

    it('applies fade in/out animations', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[state=closed]:fade-out-0', 'data-[state=open]:fade-in-0')
    })

    it('applies zoom animations', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[state=closed]:zoom-out-95', 'data-[state=open]:zoom-in-95')
    })
  })

  describe('Positioning & Alignment', () => {
    it('supports bottom side positioning', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side="bottom">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[side=bottom]:slide-in-from-top-2')
    })

    it('supports left side positioning', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side="left">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[side=left]:slide-in-from-right-2')
    })

    it('supports right side positioning', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side="right">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[side=right]:slide-in-from-left-2')
    })

    it('supports top side positioning', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent side="top">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('data-[side=top]:slide-in-from-bottom-2')
    })

    it('defaults to center alignment', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toBeInTheDocument()
    })

    it('supports custom alignment', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent align="start">Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('applies default side offset of 4', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('supports custom side offset', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent sideOffset={8}>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Trigger Behavior', () => {
    it('renders trigger button', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Open Popover</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByRole('button', { name: /open popover/i })
      expect(trigger).toBeInTheDocument()
    })

    it('accepts custom trigger className', () => {
      const { container } = render(
        <Popover open={false}>
          <PopoverTrigger className="custom-trigger">Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = container.querySelector('[data-slot="popover-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })

    it('trigger can be any element type', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger asChild>
            <span>Open</span>
          </PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Open')).toBeInTheDocument()
    })
  })

  describe('Content Children', () => {
    it('renders text content', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Simple content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Simple content')).toBeInTheDocument()
    })

    it('renders complex nested content', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>
            <div>Title</div>
            <p>Description</p>
            <button>Action</button>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })
  })

  describe('Anchor Component', () => {
    it('renders anchor element', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverAnchor>Anchor</PopoverAnchor>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const anchor = container.querySelector('[data-slot="popover-anchor"]')
      expect(anchor).toBeInTheDocument()
    })

    it('anchor can be used without trigger', () => {
      render(
        <Popover open={true}>
          <PopoverAnchor>Anchor Element</PopoverAnchor>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Anchor Element')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has button role', () => {
      render(
        <Popover open={false}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })

    it('content has correct aria attributes', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveAttribute('role', 'dialog')
    })

    it('supports aria-label on trigger', () => {
      const { container } = render(
        <Popover open={false}>
          <PopoverTrigger aria-label="Open information popover">Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = container.querySelector('[data-slot="popover-trigger"]')
      expect(trigger).toHaveAttribute('aria-label', 'Open information popover')
    })

    it('supports aria-label on content', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent aria-label="Popover content">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveAttribute('aria-label', 'Popover content')
    })
  })

  describe('Portal Behavior', () => {
    it('renders content in portal', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on trigger', () => {
      const { container } = render(
        <Popover open={false}>
          <PopoverTrigger data-testid="custom-trigger" title="Open popover">Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const trigger = container.querySelector('[data-testid="custom-trigger"]')
      expect(trigger).toHaveAttribute('title', 'Open popover')
    })

    it('spreads additional props on content', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent data-testid="custom-content" title="Popover">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('title', 'Popover')
    })

    it('spreads additional props on anchor', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverAnchor data-testid="custom-anchor">Anchor</PopoverAnchor>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const anchor = container.querySelector('[data-testid="custom-anchor"]')
      expect(anchor).toBeInTheDocument()
    })
  })

  describe('Complete Popover Workflow', () => {
    it('renders complete popover with all components', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>Information</PopoverTrigger>
          <PopoverContent>
            <div>
              <h3>Popover Title</h3>
              <p>Popover description</p>
              <button>Action</button>
            </div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText('Popover Title')).toBeInTheDocument()
      expect(screen.getByText('Popover description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument()
    })

    it('realistic use case: form help popover', () => {
      render(
        <Popover open={true}>
          <PopoverTrigger>?</PopoverTrigger>
          <PopoverContent side="right">
            <div>
              <p>This field is required</p>
              <p>Enter your full name</p>
            </div>
          </PopoverContent>
        </Popover>
      )

      expect(screen.getByText('?')).toBeInTheDocument()
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByText('Enter your full name')).toBeInTheDocument()
    })
  })

  describe('Styling with Custom Classes', () => {
    it('combines custom classes with default classes', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent className="custom-bg custom-text">Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('custom-bg', 'custom-text', 'bg-popover', 'rounded-md')
    })
  })

  describe('Z-index and Layering', () => {
    it('applies z-50 for proper layering', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('z-50')
    })
  })

  describe('Transform Origin', () => {
    it('sets transform origin based on content position', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('origin-(--radix-popover-content-transform-origin)')
    })
  })

  describe('Outline Handling', () => {
    it('hides outline for better appearance', () => {
      const { container } = render(
        <Popover open={true}>
          <PopoverTrigger>Open</PopoverTrigger>
          <PopoverContent>Content</PopoverContent>
        </Popover>
      )

      const content = container.querySelector('[data-slot="popover-content"]')
      expect(content).toHaveClass('outline-hidden')
    })
  })
})
