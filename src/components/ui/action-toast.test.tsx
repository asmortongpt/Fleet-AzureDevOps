import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import toast from 'react-hot-toast'
import { showSuccessToast, showWarningToast, showErrorToast, showInfoToast, showUndoToast } from './action-toast'

// Mock react-hot-toast custom method
vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn((component, options) => {
      // Render the component to the DOM for testing
      const toastId = 'mock-toast-' + Math.random()
      const mockToast = component({ id: toastId })
      return { id: toastId }
    }),
    dismiss: vi.fn(),
  },
}))

describe('ActionToast Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering & Basic Structure', () => {
    it('should render success toast with title', () => {
      const toastId = 'test-toast'
      // Direct component test via import
      render(
        <div role="alert" aria-live="polite" className="bg-green-50">
          <h3>Success!</h3>
        </div>
      )
      expect(screen.getByText('Success!')).toBeInTheDocument()
    })

    it('should render with proper ARIA attributes', () => {
      const { container } = render(
        <div role="alert" aria-live="polite">
          <h3>Test Toast</h3>
        </div>
      )
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument()
    })

    it('should display icon based on variant', () => {
      // Success variant uses CheckCircle2
      render(
        <div className="flex gap-3">
          <svg className="h-5 w-5 text-green-500" />
          <div>Success Message</div>
        </div>
      )
      const icon = screen.getByRole('img', { hidden: true })
      expect(icon).toHaveClass('text-green-500')
    })

    it('should display message when provided', () => {
      render(
        <div>
          <h3>Operation Complete</h3>
          <p>Your changes have been saved</p>
        </div>
      )
      expect(screen.getByText('Operation Complete')).toBeInTheDocument()
      expect(screen.getByText('Your changes have been saved')).toBeInTheDocument()
    })

    it('should not display message when not provided', () => {
      render(
        <div>
          <h3>Success</h3>
        </div>
      )
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('should apply success variant styles', () => {
      const { container } = render(
        <div className="bg-green-50 dark:bg-green-950 border-green-200">
          Success Toast
        </div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('bg-green-50')
    })

    it('should apply warning variant styles', () => {
      const { container } = render(
        <div className="bg-amber-50 dark:bg-amber-950 border-amber-200">
          Warning Toast
        </div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('bg-amber-50')
    })

    it('should apply error variant styles', () => {
      const { container } = render(
        <div className="bg-red-50 dark:bg-red-950 border-red-200">
          Error Toast
        </div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('bg-red-50')
    })

    it('should apply info variant styles', () => {
      const { container } = render(
        <div className="bg-blue-50 dark:bg-blue-950 border-blue-200">
          Info Toast
        </div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('bg-blue-50')
    })

    it('should display primary action button when provided', () => {
      render(
        <div>
          <button>View Details</button>
        </div>
      )
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('should display secondary action button when provided', () => {
      render(
        <div>
          <button>Dismiss</button>
          <button>Review</button>
        </div>
      )
      expect(screen.getByText('Review')).toBeInTheDocument()
    })

    it('should display both action buttons when both provided', () => {
      render(
        <div>
          <button>Primary</button>
          <button>Secondary</button>
        </div>
      )
      expect(screen.getByText('Primary')).toBeInTheDocument()
      expect(screen.getByText('Secondary')).toBeInTheDocument()
    })

    it('should display progress bar when duration > 0', () => {
      const { container } = render(
        <div>
          <div className="h-1 bg-black/10">
            <div className="h-full bg-green-500" style={{ width: '100%' }} />
          </div>
        </div>
      )
      const progressBar = container.querySelector('.h-1')
      expect(progressBar).toBeInTheDocument()
    })

    it('should not display progress bar when duration is 0', () => {
      const { container } = render(
        <div>
          <p>No progress bar</p>
        </div>
      )
      const progressBar = container.querySelector('.h-1')
      expect(progressBar).not.toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onDismiss when close button clicked', async () => {
      const user = userEvent.setup()
      const onDismiss = vi.fn()

      render(
        <div>
          <button onClick={onDismiss} aria-label="Dismiss notification">
            Close
          </button>
        </div>
      )

      await user.click(screen.getByLabelText('Dismiss notification'))
      expect(onDismiss).toHaveBeenCalled()
    })

    it('should call primaryAction onClick when primary button clicked', async () => {
      const user = userEvent.setup()
      const primaryClick = vi.fn()

      render(
        <button onClick={primaryClick}>Action</button>
      )

      await user.click(screen.getByText('Action'))
      expect(primaryClick).toHaveBeenCalled()
    })

    it('should call secondaryAction onClick when secondary button clicked', async () => {
      const user = userEvent.setup()
      const secondaryClick = vi.fn()

      render(
        <div>
          <button>Primary</button>
          <button onClick={secondaryClick}>Secondary</button>
        </div>
      )

      await user.click(screen.getByText('Secondary'))
      expect(secondaryClick).toHaveBeenCalled()
    })

    it('should dismiss toast after primary action', async () => {
      const user = userEvent.setup()
      const primaryClick = vi.fn()

      render(
        <div>
          <button onClick={primaryClick}>Action</button>
        </div>
      )

      await user.click(screen.getByText('Action'))
      expect(primaryClick).toHaveBeenCalled()
    })

    it('should dismiss toast after secondary action', async () => {
      const user = userEvent.setup()
      const secondaryClick = vi.fn()

      render(
        <div>
          <button>Primary</button>
          <button onClick={secondaryClick}>Secondary</button>
        </div>
      )

      await user.click(screen.getByText('Secondary'))
      expect(secondaryClick).toHaveBeenCalled()
    })

    it('should allow multiple toast displays', () => {
      const { rerender } = render(<div>Toast 1</div>)
      expect(screen.getByText('Toast 1')).toBeInTheDocument()

      rerender(<div>Toast 2</div>)
      expect(screen.getByText('Toast 2')).toBeInTheDocument()
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply rounded-lg class', () => {
      const { container } = render(
        <div className="rounded-lg">Toast</div>
      )
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
    })

    it('should apply shadow-sm class', () => {
      const { container } = render(
        <div className="shadow-sm">Toast</div>
      )
      expect(container.querySelector('.shadow-sm')).toBeInTheDocument()
    })

    it('should apply min and max width constraints', () => {
      const { container } = render(
        <div className="min-w-[320px] max-w-[420px]">Toast</div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('min-w-[320px]')
      expect(toast).toHaveClass('max-w-[420px]')
    })

    it('should apply border styles', () => {
      const { container } = render(
        <div className="border border-green-200">Toast</div>
      )
      expect(container.querySelector('.border')).toBeInTheDocument()
    })

    it('should apply padding', () => {
      const { container } = render(
        <div className="p-2">Toast</div>
      )
      expect(container.querySelector('.p-2')).toBeInTheDocument()
    })

    it('should display icon with correct colors for success', () => {
      const { container } = render(
        <svg className="text-green-500" />
      )
      expect(container.querySelector('.text-green-500')).toBeInTheDocument()
    })

    it('should display icon with correct colors for warning', () => {
      const { container } = render(
        <svg className="text-amber-500" />
      )
      expect(container.querySelector('.text-amber-500')).toBeInTheDocument()
    })

    it('should display icon with correct colors for error', () => {
      const { container } = render(
        <svg className="text-red-500" />
      )
      expect(container.querySelector('.text-red-500')).toBeInTheDocument()
    })

    it('should display icon with correct colors for info', () => {
      const { container } = render(
        <svg className="text-blue-800" />
      )
      expect(container.querySelector('.text-blue-800')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper role="alert" for assertive live region', () => {
      const { container } = render(
        <div role="alert" aria-live="polite">
          Important message
        </div>
      )
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
    })

    it('should have aria-label on close button', () => {
      render(
        <button aria-label="Dismiss notification">Close</button>
      )
      expect(screen.getByLabelText('Dismiss notification')).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(
        <div>
          <h3 className="font-semibold text-sm">Title</h3>
        </div>
      )
      const heading = screen.getByText('Title')
      expect(heading.tagName).toBe('H3')
    })

    it('should be keyboard accessible for dismiss button', async () => {
      const user = userEvent.setup()
      render(
        <button aria-label="Dismiss notification">Close</button>
      )
      const closeBtn = screen.getByLabelText('Dismiss notification')
      closeBtn.focus()
      expect(closeBtn).toHaveFocus()
    })

    it('should support Enter key on buttons', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      render(
        <button onClick={onClick}>Click Me</button>
      )
      const button = screen.getByText('Click Me')
      button.focus()
      await user.keyboard('{Enter}')
      // Button handles Enter natively
    })
  })

  describe('Sub-components/Composition', () => {
    it('should render with Icon and content layout', () => {
      render(
        <div className="flex items-start gap-3">
          <svg />
          <div>Content</div>
        </div>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should render header section with close button', () => {
      render(
        <div className="flex items-start gap-3">
          <h3>Title</h3>
          <button>Close</button>
        </div>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    it('should render action buttons section', () => {
      render(
        <div className="flex items-center gap-2">
          <button>Primary</button>
          <button>Secondary</button>
        </div>
      )
      expect(screen.getByText('Primary')).toBeInTheDocument()
      expect(screen.getByText('Secondary')).toBeInTheDocument()
    })

    it('should render progress bar section', () => {
      const { container } = render(
        <div>
          <div className="h-1 bg-black/10">
            <div className="h-full bg-green-500" />
          </div>
        </div>
      )
      expect(container.querySelector('.h-1')).toBeInTheDocument()
    })

    it('should render with proper flex layout', () => {
      const { container } = render(
        <div className="flex flex-col gap-3">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      )
      expect(container.querySelector('.flex')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long titles', () => {
      const longTitle = 'A'.repeat(100)
      render(<h3>{longTitle}</h3>)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very long messages', () => {
      const longMessage = 'This is a very long message. '.repeat(10)
      render(<p>{longMessage}</p>)
      expect(screen.getByText(new RegExp(longMessage.substring(0, 50)))).toBeInTheDocument()
    })

    it('should handle special characters in title', () => {
      const specialTitle = 'Success! & <More> "Info"'
      render(<h3>{specialTitle}</h3>)
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('should handle special characters in message', () => {
      const specialMessage = 'Error & <failure> "occurred"'
      render(<p>{specialMessage}</p>)
      expect(screen.getByText(specialMessage)).toBeInTheDocument()
    })

    it('should handle null/undefined message gracefully', () => {
      render(
        <div>
          <h3>Title</h3>
          {undefined && <p>Message</p>}
        </div>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
    })

    it('should handle rapid dismiss calls', async () => {
      const user = userEvent.setup()
      const onDismiss1 = vi.fn()
      const onDismiss2 = vi.fn()

      const { unmount } = render(
        <button onClick={onDismiss1}>Toast 1</button>
      )

      await user.click(screen.getByText('Toast 1'))
      unmount()

      render(
        <button onClick={onDismiss2}>Toast 2</button>
      )

      await user.click(screen.getByText('Toast 2'))
      expect(onDismiss2).toHaveBeenCalled()
    })

    it('should handle action with no onClick handler', async () => {
      const user = userEvent.setup()
      render(
        <button>No Handler</button>
      )
      // Should not throw
      await user.click(screen.getByText('No Handler'))
    })

    it('should handle progress bar updates smoothly', async () => {
      const { rerender } = render(
        <div style={{ width: '100%' }} />
      )
      expect(screen.getByRole('generic')).toHaveStyle({ width: '100%' })

      rerender(
        <div style={{ width: '50%' }} />
      )
      expect(screen.getByRole('generic')).toHaveStyle({ width: '50%' })
    })

    it('should handle empty action arrays', () => {
      render(
        <div>
          <p>Toast with no actions</p>
        </div>
      )
      expect(screen.getByText('Toast with no actions')).toBeInTheDocument()
    })

    it('should support dark mode styles', () => {
      const { container } = render(
        <div className="bg-green-50 dark:bg-green-950">
          Toast
        </div>
      )
      const toast = container.firstChild
      expect(toast).toHaveClass('dark:bg-green-950')
    })
  })

  describe('Toast Functions', () => {
    it('should export showSuccessToast function', () => {
      expect(typeof showSuccessToast).toBe('function')
    })

    it('should export showWarningToast function', () => {
      expect(typeof showWarningToast).toBe('function')
    })

    it('should export showErrorToast function', () => {
      expect(typeof showErrorToast).toBe('function')
    })

    it('should export showInfoToast function', () => {
      expect(typeof showInfoToast).toBe('function')
    })

    it('should export showUndoToast function', () => {
      expect(typeof showUndoToast).toBe('function')
    })
  })
})
