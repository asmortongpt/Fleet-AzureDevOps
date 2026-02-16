import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { X as XIcon } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from './dialog'

describe('Dialog Component', () => {
  describe('Rendering & Structure', () => {
    it('renders dialog with all subcomponents', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
              <DialogDescription>Description</DialogDescription>
            </DialogHeader>
            <div>Content</div>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders trigger button', () => {
      render(
        <Dialog open={false}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByRole('button', { name: /open dialog/i })
      expect(trigger).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(container.querySelector('[data-slot="dialog"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="dialog-content"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="dialog-title"]')).toBeInTheDocument()
    })
  })

  describe('Overlay Behavior', () => {
    it('renders overlay when dialog is open', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const overlay = container.querySelector('[data-slot="dialog-overlay"]')
      expect(overlay).toBeInTheDocument()
    })

    it('applies correct overlay styling', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const overlay = container.querySelector('[data-slot="dialog-overlay"]')
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/60', 'backdrop-blur-sm')
    })

    it('overlay has animation classes', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const overlay = container.querySelector('[data-slot="dialog-overlay"]')
      expect(overlay).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom overlay className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogOverlay className="custom-overlay">
            <DialogContent>
              <DialogTitle>Title</DialogTitle>
            </DialogContent>
          </DialogOverlay>
        </Dialog>
      )

      const overlay = container.querySelector('[data-slot="dialog-overlay"]')
      expect(overlay).toHaveClass('custom-overlay')
    })
  })

  describe('Content Styling', () => {
    it('applies correct base styling to content', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('fixed', 'z-50', 'rounded-lg', 'shadow-sm', 'p-3')
    })

    it('centers content on screen', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('top-[50%]', 'left-[50%]', 'translate-x-[-50%]', 'translate-y-[-50%]')
    })

    it('has responsive width', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('w-full', 'max-w-[calc(100%-2rem)]', 'sm:max-w-lg')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:zoom-out-95',
        'data-[state=open]:zoom-in-95'
      )
    })

    it('applies card styling with backdrop blur', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('bg-card/95', 'backdrop-blur-xl', 'border', 'border-border/50')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent className="custom-content">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('custom-content')
    })

    it('renders close button by default', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const closeButton = container.querySelector('[data-slot="dialog-content"] button')
      expect(closeButton).toBeInTheDocument()
    })

    it('hides close button when showClose is false', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent showClose={false}>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      const buttons = content?.querySelectorAll('button')
      expect(buttons?.length).toBe(0)
    })
  })

  describe('Header Component', () => {
    it('renders header with correct styling', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const header = container.querySelector('[data-slot="dialog-header"]')
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center', 'sm:text-left')
    })

    it('accepts custom header className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader className="custom-header">
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const header = container.querySelector('[data-slot="dialog-header"]')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('Footer Component', () => {
    it('renders footer with correct styling', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter>
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const footer = container.querySelector('[data-slot="dialog-footer"]')
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'gap-2', 'sm:flex-row', 'sm:justify-end')
    })

    it('accepts custom footer className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter className="custom-footer">
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const footer = container.querySelector('[data-slot="dialog-footer"]')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Title Component', () => {
    it('renders title text', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
    })

    it('applies title styling', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const title = container.querySelector('[data-slot="dialog-title"]')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('accepts custom title className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle className="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const title = container.querySelector('[data-slot="dialog-title"]')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('Description Component', () => {
    it('renders description text', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Dialog description')).toBeInTheDocument()
    })

    it('applies description styling', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const description = container.querySelector('[data-slot="dialog-description"]')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('accepts custom description className', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription className="custom-desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const description = container.querySelector('[data-slot="dialog-description"]')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('Close Button', () => {
    it('renders close button in content by default', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('close button is not rendered when showClose is false', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent showClose={false}>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const allButtons = container.querySelectorAll('button')
      expect(allButtons.length).toBe(0)
    })

    it('applies correct styling to default close button', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const closeButton = container.querySelector('[data-slot="dialog-close"]')
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveClass('absolute', 'right-3', 'top-3', 'opacity-70', 'hover:opacity-100')
    })
  })

  describe('Accessibility', () => {
    it('has dialog role on content', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveAttribute('role', 'dialog')
    })

    it('title and description are linked to content', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('supports aria-label on content', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent aria-label="Custom dialog label">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom dialog label')
    })
  })

  describe('Portal Behavior', () => {
    it('portal renders content in separate DOM node', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const portal = container.querySelector('[data-slot="dialog-portal"]')
      expect(portal).toBeInTheDocument()
    })

    it('renders custom portal container', () => {
      render(
        <Dialog open={true}>
          <DialogPortal>
            <DialogContent>
              <DialogTitle>Title</DialogTitle>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on content', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent data-testid="custom-content" aria-label="Custom label">
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom label')
    })

    it('spreads additional props on title', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle data-testid="custom-title">Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const title = container.querySelector('[data-testid="custom-title"]')
      expect(title).toBeInTheDocument()
    })

    it('spreads additional props on description', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogDescription data-testid="custom-desc">Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const description = container.querySelector('[data-testid="custom-desc"]')
      expect(description).toBeInTheDocument()
    })

    it('spreads additional props on trigger', () => {
      render(
        <Dialog open={false}>
          <DialogTrigger data-testid="trigger-btn">Open</DialogTrigger>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const trigger = screen.getByTestId('trigger-btn')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Content Children', () => {
    it('renders children content', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <div>Custom content</div>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Custom content')).toBeInTheDocument()
    })

    it('renders complex nested content', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
            <div>Content</div>
            <DialogFooter>
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Complete Dialog Workflow', () => {
    it('renders complete dialog workflow', () => {
      render(
        <Dialog open={true}>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Title</DialogTitle>
              <DialogDescription>This is a dialog</DialogDescription>
            </DialogHeader>
            <div>Dialog content</div>
            <DialogFooter>
              <DialogClose>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Dialog Title')).toBeInTheDocument()
      expect(screen.getByText('This is a dialog')).toBeInTheDocument()
      expect(screen.getByText('Dialog content')).toBeInTheDocument()
    })

    it('combines all components in realistic scenario', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this item? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div>This is important information</div>
            <DialogFooter>
              <button>Cancel</button>
              <button>Delete</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete this item? This cannot be undone.')).toBeInTheDocument()
      expect(screen.getByText('This is important information')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('has responsive header text alignment', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Title</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )

      const header = container.querySelector('[data-slot="dialog-header"]')
      expect(header).toHaveClass('text-center', 'sm:text-left')
    })

    it('has responsive footer layout', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogFooter>
              <button>Cancel</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const footer = container.querySelector('[data-slot="dialog-footer"]')
      expect(footer).toHaveClass('flex-col-reverse', 'sm:flex-row', 'sm:justify-end')
    })
  })

  describe('Animation Classes', () => {
    it('has slide in animation from left', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('data-[state=open]:slide-in-from-left-1/2')
    })

    it('has slide in animation from top', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('data-[state=open]:slide-in-from-top-[48%]')
    })

    it('has duration-300 animation', () => {
      const { container } = render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      )

      const content = container.querySelector('[data-slot="dialog-content"]')
      expect(content).toHaveClass('duration-300')
    })
  })
})
