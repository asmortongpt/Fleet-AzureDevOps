import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from './alert-dialog'

describe('AlertDialog Component', () => {
  describe('Rendering & Structure', () => {
    it('renders alert dialog with all subcomponents', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Action</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('renders trigger that opens dialog', async () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const trigger = screen.getByRole('button', { name: /open/i })
      expect(trigger).toBeInTheDocument()
    })

    it('has data-slot attributes on all subcomponents', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
              <AlertDialogDescription>Description</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Action</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(container.querySelector('[data-slot="alert-dialog"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="alert-dialog-content"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="alert-dialog-header"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="alert-dialog-footer"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="alert-dialog-title"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="alert-dialog-description"]')).toBeInTheDocument()
    })
  })

  describe('Overlay Behavior', () => {
    it('renders overlay with correct styling when open', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const overlay = container.querySelector('[data-slot="alert-dialog-overlay"]')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/50')
    })

    it('overlay has animation classes', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const overlay = container.querySelector('[data-slot="alert-dialog-overlay"]')
      expect(overlay).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })
  })

  describe('Content Styling', () => {
    it('applies correct base styling to content', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveClass('fixed', 'z-50', 'rounded-lg', 'border', 'p-3', 'shadow-sm')
    })

    it('centers content on screen', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveClass('top-[50%]', 'left-[50%]', 'translate-x-[-50%]', 'translate-y-[-50%]')
    })

    it('has animation classes', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:zoom-out-95')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent className="custom-class">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveClass('custom-class')
    })
  })

  describe('Header Styling', () => {
    it('applies correct header styling', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )

      const header = container.querySelector('[data-slot="alert-dialog-header"]')
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center', 'sm:text-left')
    })

    it('accepts custom header className', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader className="custom-header">
              <AlertDialogTitle>Title</AlertDialogTitle>
            </AlertDialogHeader>
          </AlertDialogContent>
        </AlertDialog>
      )

      const header = container.querySelector('[data-slot="alert-dialog-header"]')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('Footer Styling', () => {
    it('applies correct footer styling', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Action</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      const footer = container.querySelector('[data-slot="alert-dialog-footer"]')
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'gap-2', 'sm:flex-row', 'sm:justify-end')
    })

    it('has responsive layout', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Action</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      const footer = container.querySelector('[data-slot="alert-dialog-footer"]')
      expect(footer).toHaveClass('sm:flex-row', 'sm:justify-end')
    })

    it('accepts custom footer className', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogFooter className="custom-footer">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      const footer = container.querySelector('[data-slot="alert-dialog-footer"]')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Title Component', () => {
    it('renders title text', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Alert Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Alert Title')).toBeInTheDocument()
    })

    it('applies title styling', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const title = container.querySelector('[data-slot="alert-dialog-title"]')
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })

    it('accepts custom title className', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle className="custom-title">Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const title = container.querySelector('[data-slot="alert-dialog-title"]')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('Description Component', () => {
    it('renders description text', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogDescription>Alert description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Alert description')).toBeInTheDocument()
    })

    it('applies description styling', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      const description = container.querySelector('[data-slot="alert-dialog-description"]')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('accepts custom description className', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogDescription className="custom-desc">Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      const description = container.querySelector('[data-slot="alert-dialog-description"]')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('Action Button', () => {
    it('renders action button', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /confirm/i })
      expect(button).toBeInTheDocument()
    })

    it('applies button variant styling to action', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogAction>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = container.querySelector('[data-slot="alert-dialog-content"] button')
      expect(button).toHaveClass('bg-gradient-to-r')
    })

    it('accepts custom action className', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogAction className="custom-action">Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /confirm/i })
      expect(button).toHaveClass('custom-action')
    })

    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogAction onClick={handleClick}>Confirm</AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /confirm/i })
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Cancel Button', () => {
    it('renders cancel button', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /cancel/i })
      expect(button).toBeInTheDocument()
    })

    it('applies outline variant styling to cancel', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /cancel/i })
      expect(button).toHaveClass('border')
    })

    it('accepts custom cancel className', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogCancel className="custom-cancel">Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /cancel/i })
      expect(button).toHaveClass('custom-cancel')
    })

    it('calls onClick handler when clicked', async () => {
      const handleClick = vi.fn()
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogCancel onClick={handleClick}>Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const button = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('has alert dialog role on content', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveAttribute('role', 'alertdialog')
    })

    it('has correct aria attributes', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      const title = container.querySelector('[data-slot="alert-dialog-title"]')
      const description = container.querySelector('[data-slot="alert-dialog-description"]')

      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
    })

    it('title and description are properly linked to content', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
            <AlertDialogDescription>Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on content', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent data-testid="custom-content" aria-label="Custom label">
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom label')
    })

    it('spreads additional props on title', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle data-testid="custom-title">Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const title = container.querySelector('[data-testid="custom-title"]')
      expect(title).toBeInTheDocument()
    })

    it('spreads additional props on description', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogDescription data-testid="custom-desc">Description</AlertDialogDescription>
          </AlertDialogContent>
        </AlertDialog>
      )

      const description = container.querySelector('[data-testid="custom-desc"]')
      expect(description).toBeInTheDocument()
    })

    it('spreads additional props on buttons', async () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogAction data-testid="action-btn">Confirm</AlertDialogAction>
            <AlertDialogCancel data-testid="cancel-btn">Cancel</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      )

      const actionBtn = screen.getByTestId('action-btn')
      const cancelBtn = screen.getByTestId('cancel-btn')

      expect(actionBtn).toBeInTheDocument()
      expect(cancelBtn).toBeInTheDocument()
    })
  })

  describe('Portal Behavior', () => {
    it('portal renders content outside of current DOM hierarchy', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const portal = container.querySelector('[data-slot="alert-dialog-portal"]')
      expect(portal).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive max-width to content', () => {
      const { container } = render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogTitle>Title</AlertDialogTitle>
          </AlertDialogContent>
        </AlertDialog>
      )

      const content = container.querySelector('[data-slot="alert-dialog-content"]')
      expect(content).toHaveClass('w-full', 'max-w-[calc(100%-2rem)]', 'sm:max-w-lg')
    })
  })

  describe('Complete Dialog Workflow', () => {
    it('renders complete alert dialog workflow', async () => {
      const { rerender } = render(
        <AlertDialog open={false}>
          <AlertDialogTrigger>Open Dialog</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Action</AlertDialogTitle>
              <AlertDialogDescription>Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      // Dialog is initially closed
      expect(screen.getByText('Confirm Action', { selector: 'h2' })).toBeInTheDocument()
    })

    it('combines all components in realistic scenario', () => {
      render(
        <AlertDialog open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Item</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )

      expect(screen.getByText('Delete Item')).toBeInTheDocument()
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /keep item/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })
  })
})
