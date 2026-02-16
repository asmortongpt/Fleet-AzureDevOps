import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Sheet, SheetTrigger, SheetContent, SheetClose, SheetPortal, SheetOverlay, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from './sheet'

describe('Sheet Component', () => {
  describe('Rendering & Structure', () => {
    it('renders sheet with trigger and content', () => {
      render(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      expect(container.querySelector('[data-slot="sheet"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="sheet-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="sheet-content"]')).toBeInTheDocument()
    })

    it('renders trigger as button', () => {
      render(
        <Sheet open={false}>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const trigger = screen.getByRole('button', { name: /open sheet/i })
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Overlay Behavior', () => {
    it('renders overlay when sheet is open', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const overlay = container.querySelector('[data-slot="sheet-overlay"]')
      expect(overlay).toBeInTheDocument()
    })

    it('applies correct overlay styling', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const overlay = container.querySelector('[data-slot="sheet-overlay"]')
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const overlay = container.querySelector('[data-slot="sheet-overlay"]')
      expect(overlay).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom overlay className', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetOverlay className="custom-overlay">
            <SheetContent>Content</SheetContent>
          </SheetOverlay>
        </Sheet>
      )
      const overlay = container.querySelector('[data-slot="sheet-overlay"]')
      expect(overlay).toHaveClass('custom-overlay')
    })
  })

  describe('Content Styling - Directional Support', () => {
    it('applies base content styling', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('bg-background', 'fixed', 'z-50', 'flex', 'flex-col', 'gap-2', 'shadow-sm')
    })

    it('defaults to right side positioning', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('inset-y-0', 'right-0', 'h-full', 'w-3/4', 'border-l', 'sm:max-w-sm')
    })

    it('supports left side positioning', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent side="left">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('inset-y-0', 'left-0', 'h-full', 'w-3/4', 'border-r', 'sm:max-w-sm')
    })

    it('supports top side positioning', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent side="top">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('inset-x-0', 'top-0', 'h-auto', 'border-b')
    })

    it('supports bottom side positioning', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent side="bottom">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('inset-x-0', 'bottom-0', 'h-auto', 'border-t')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent className="custom-content">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('Close Button', () => {
    it('renders close button by default', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const closeButton = container.querySelector('[data-slot="sheet-content"] button')
      expect(closeButton).toBeInTheDocument()
    })

    it('applies correct close button styling', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const closeButton = container.querySelector('[data-slot="sheet-content"] button')
      expect(closeButton).toHaveClass('absolute', 'top-4', 'right-4', 'rounded-xs', 'opacity-70')
    })

    it('has hover effect on close button', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const closeButton = container.querySelector('[data-slot="sheet-content"] button')
      expect(closeButton).toHaveClass('hover:opacity-100')
    })

    it('renders close button with X icon', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const svg = container.querySelector('[data-slot="sheet-content"] svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('size-4')
    })

    it('has sr-only text for accessibility', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const srText = container.querySelector('[data-slot="sheet-content"] .sr-only')
      expect(srText).toBeInTheDocument()
      expect(srText).toHaveTextContent('Close')
    })
  })

  describe('Trigger Behavior', () => {
    it('renders trigger button', () => {
      render(
        <Sheet open={false}>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const trigger = screen.getByRole('button', { name: /open sheet/i })
      expect(trigger).toBeInTheDocument()
    })

    it('accepts custom trigger className', () => {
      const { container } = render(
        <Sheet open={false}>
          <SheetTrigger className="custom-trigger">Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const trigger = container.querySelector('[data-slot="sheet-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('SheetClose Component', () => {
    it('renders close element', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetClose>Close</SheetClose>
          </SheetContent>
        </Sheet>
      )
      const close = container.querySelector('[data-slot="sheet-close"]')
      expect(close).toBeInTheDocument()
    })

    it('accepts custom close className', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetClose className="custom-close">Close</SheetClose>
          </SheetContent>
        </Sheet>
      )
      const close = container.querySelector('[data-slot="sheet-close"]')
      expect(close).toHaveClass('custom-close')
    })
  })

  describe('Portal & Overlay Components', () => {
    it('renders portal', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetPortal>
            <SheetContent>Content</SheetContent>
          </SheetPortal>
        </Sheet>
      )
      const portal = container.querySelector('[data-slot="sheet-portal"]')
      expect(portal).toBeInTheDocument()
    })

    it('renders custom overlay', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetPortal>
            <SheetOverlay className="custom" />
            <SheetContent>Content</SheetContent>
          </SheetPortal>
        </Sheet>
      )
      const overlay = container.querySelector('[data-slot="sheet-overlay"]')
      expect(overlay).toHaveClass('custom')
    })
  })

  describe('Content Children', () => {
    it('renders text content', () => {
      render(
        <Sheet open={true}>
          <SheetContent>Simple content</SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Simple content')).toBeInTheDocument()
    })

    it('renders complex nested content', () => {
      render(
        <Sheet open={true}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Title</SheetTitle>
              <SheetDescription>Description</SheetDescription>
            </SheetHeader>
            <div>Body</div>
            <SheetFooter>
              <button>Cancel</button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Body')).toBeInTheDocument()
    })
  })

  describe('Header & Footer Components', () => {
    it('renders header component', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetHeader>Header</SheetHeader>
          </SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Header')).toBeInTheDocument()
    })

    it('renders footer component', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>
            <SheetFooter>Footer</SheetFooter>
          </SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has button role', () => {
      render(
        <Sheet open={false}>
          <SheetTrigger>Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })

    it('content has dialog role', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveAttribute('role', 'dialog')
    })

    it('supports aria-label on content', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent aria-label="Custom sheet label">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom sheet label')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on trigger', () => {
      const { container } = render(
        <Sheet open={false}>
          <SheetTrigger data-testid="custom-trigger" title="Open sheet">Open</SheetTrigger>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const trigger = container.querySelector('[data-testid="custom-trigger"]')
      expect(trigger).toHaveAttribute('title', 'Open sheet')
    })

    it('spreads additional props on content', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent data-testid="custom-content" title="Sheet">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('title', 'Sheet')
    })
  })

  describe('Complete Sheet Workflow', () => {
    it('renders complete sheet with all components', () => {
      render(
        <Sheet open={true}>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Sheet Title</SheetTitle>
              <SheetDescription>This is a sheet</SheetDescription>
            </SheetHeader>
            <div>Sheet content</div>
            <SheetFooter>
              <SheetClose>Close</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Sheet Title')).toBeInTheDocument()
      expect(screen.getByText('This is a sheet')).toBeInTheDocument()
      expect(screen.getByText('Sheet content')).toBeInTheDocument()
    })

    it('realistic use case: navigation sheet', () => {
      render(
        <Sheet open={true} side="left">
          <SheetTrigger>Menu</SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <nav>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
            </nav>
          </SheetContent>
        </Sheet>
      )
      expect(screen.getByText('Navigation')).toBeInTheDocument()
    })
  })

  describe('Animations & Transitions', () => {
    it('has smooth transitions', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('transition', 'ease-in-out')
    })

    it('has different durations for open/close', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('data-[state=closed]:duration-300', 'data-[state=open]:duration-500')
    })

    it('has slide animations for right side', () => {
      const { container } = render(
        <Sheet open={true} side="right">
          <SheetContent side="right">Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('data-[state=closed]:slide-out-to-right', 'data-[state=open]:slide-in-from-right')
    })
  })

  describe('Z-index Layering', () => {
    it('applies z-50 for proper layering', () => {
      const { container } = render(
        <Sheet open={true}>
          <SheetContent>Content</SheetContent>
        </Sheet>
      )
      const content = container.querySelector('[data-slot="sheet-content"]')
      expect(content).toHaveClass('z-50')
    })
  })
})
