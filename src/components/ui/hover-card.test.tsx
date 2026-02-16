import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HoverCard, HoverCardTrigger, HoverCardContent } from './hover-card'

describe('HoverCard Component', () => {
  describe('Rendering & Structure', () => {
    it('renders hover card with trigger and content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Hover me')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(container.querySelector('[data-slot="hover-card"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="hover-card-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="hover-card-content"]')).toBeInTheDocument()
    })

    it('renders trigger as interactive element', () => {
      render(
        <HoverCard open={false}>
          <HoverCardTrigger>Hover me</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })
  })

  describe('Content Styling', () => {
    it('applies content styling', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveClass('z-50', 'w-64', 'rounded-md', 'border', 'bg-popover', 'p-4', 'text-popover-foreground', 'shadow-md')
    })

    it('has animation classes', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent className="custom-content">Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveClass('custom-content')
    })

    it('has focus outline hidden', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveClass('outline-hidden')
    })
  })

  describe('Trigger Behavior', () => {
    it('renders trigger element', () => {
      render(
        <HoverCard open={false}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('accepts custom trigger className', () => {
      const { container } = render(
        <HoverCard open={false}>
          <HoverCardTrigger className="custom-trigger">Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const trigger = container.querySelector('[data-slot="hover-card-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('Content Children', () => {
    it('renders text content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Simple content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Simple content')).toBeInTheDocument()
    })

    it('renders complex nested content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>
            <div>
              <h4>Title</h4>
              <p>Description</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })

  describe('Positioning & Alignment', () => {
    it('supports side prop', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent side="left">Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('supports align prop', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent align="start">Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('supports sideOffset prop', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent sideOffset={8}>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Open/Close State', () => {
    it('respects open prop', () => {
      const { rerender } = render(
        <HoverCard open={false}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.queryByText('Content')).not.toBeInTheDocument()

      rerender(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('respects defaultOpen prop', () => {
      render(
        <HoverCard defaultOpen={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has proper accessibility', () => {
      render(
        <HoverCard open={false}>
          <HoverCardTrigger>Trigger</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('content has dialog role', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveAttribute('role', 'dialog')
    })

    it('supports aria-label on content', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent aria-label="User info">Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-slot="hover-card-content"]')
      expect(content).toHaveAttribute('aria-label', 'User info')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on trigger', () => {
      const { container } = render(
        <HoverCard open={false}>
          <HoverCardTrigger data-testid="custom-trigger" title="User">Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      const trigger = container.querySelector('[data-testid="custom-trigger"]')
      expect(trigger).toHaveAttribute('title', 'User')
    })

    it('spreads additional props on content', () => {
      const { container } = render(
        <HoverCard open={true}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent data-testid="custom-content" title="Info">Content</HoverCardContent>
        </HoverCard>
      )
      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('title', 'Info')
    })
  })

  describe('Complete HoverCard Workflow', () => {
    it('renders complete hover card', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>@username</HoverCardTrigger>
          <HoverCardContent>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">@username</h4>
              <p className="text-sm">The React Framework</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('@username')).toBeInTheDocument()
      expect(screen.getByText('The React Framework')).toBeInTheDocument()
    })

    it('realistic user info use case', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>@user</HoverCardTrigger>
          <HoverCardContent side="right">
            <div>
              <p>Name: John Doe</p>
              <p>Email: john@example.com</p>
              <p>Status: Online</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('@user')).toBeInTheDocument()
      expect(screen.getByText('Name: John Doe')).toBeInTheDocument()
    })
  })

  describe('Delay Props', () => {
    it('supports openDelay prop', () => {
      render(
        <HoverCard openDelay={200}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Hover')).toBeInTheDocument()
    })

    it('supports closeDelay prop', () => {
      render(
        <HoverCard open={true} closeDelay={200}>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with minimal props', () => {
      render(
        <HoverCard>
          <HoverCardTrigger>Hover</HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Hover')).toBeInTheDocument()
    })

    it('renders with complex trigger content', () => {
      render(
        <HoverCard open={true}>
          <HoverCardTrigger>
            <span>Icon</span>
            <span>Label</span>
          </HoverCardTrigger>
          <HoverCardContent>Content</HoverCardContent>
        </HoverCard>
      )
      expect(screen.getByText('Label')).toBeInTheDocument()
    })
  })
})
