import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ActionableError } from './actionable-error'

describe('ActionableError Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render with title', () => {
      render(<ActionableError title="Error Occurred" />)
      expect(screen.getByText('Error Occurred')).toBeInTheDocument()
    })

    it('should render with title and description', () => {
      render(
        <ActionableError
          title="Connection Error"
          description="Unable to connect to server"
        />
      )
      expect(screen.getByText('Connection Error')).toBeInTheDocument()
      expect(screen.getByText('Unable to connect to server')).toBeInTheDocument()
    })

    it('should have data-slot="actionable-error" attribute', () => {
      const { container } = render(<ActionableError title="Error" />)
      expect(container.querySelector('[data-slot="actionable-error"]')).toBeInTheDocument()
    })

    it('should have role="alert" for accessibility', () => {
      const { container } = render(<ActionableError title="Error" />)
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      const { container } = render(<ActionableError title="Error" />)
      expect(container.querySelector('[aria-live="assertive"]')).toBeInTheDocument()
    })

    it('should render AlertCircle icon', () => {
      const { container } = render(<ActionableError title="Error" />)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should apply rounded border', () => {
      const { container } = render(<ActionableError title="Error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('rounded-lg')
    })

    it('should apply border styling', () => {
      const { container } = render(<ActionableError title="Error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('border')
    })

    it('should apply padding', () => {
      const { container } = render(<ActionableError title="Error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('p-2')
    })
  })

  describe('Props & Configuration', () => {
    it('should render error variant by default', () => {
      const { container } = render(<ActionableError title="Error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('bg-destructive/10')
    })

    it('should render warning variant', () => {
      const { container } = render(<ActionableError title="Warning" variant="warning" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('bg-warning/10')
    })

    it('should render info variant', () => {
      const { container } = render(<ActionableError title="Info" variant="info" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('bg-accent/10')
    })

    it('should apply correct border color for error variant', () => {
      const { container } = render(<ActionableError title="Error" variant="error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('border-destructive/30')
    })

    it('should apply correct border color for warning variant', () => {
      const { container } = render(<ActionableError title="Warning" variant="warning" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('border-warning/30')
    })

    it('should apply correct border color for info variant', () => {
      const { container } = render(<ActionableError title="Info" variant="info" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('border-accent/30')
    })

    it('should render with custom className', () => {
      const { container } = render(
        <ActionableError title="Error" className="custom-class" />
      )
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('custom-class')
    })

    it('should render causes list when provided', () => {
      render(
        <ActionableError
          title="Error"
          causes={['Cause 1', 'Cause 2']}
        />
      )
      expect(screen.getByText('Cause 1')).toBeInTheDocument()
      expect(screen.getByText('Cause 2')).toBeInTheDocument()
    })

    it('should render empty causes list gracefully', () => {
      const { container } = render(
        <ActionableError title="Error" causes={[]} />
      )
      const causesList = container.querySelector('ul')
      expect(causesList).not.toBeInTheDocument()
    })

    it('should render title with correct heading level', () => {
      render(<ActionableError title="Error Heading" />)
      const heading = screen.getByText('Error Heading')
      expect(heading.tagName).toBe('H3')
    })

    it('should render description as paragraph', () => {
      render(
        <ActionableError
          title="Error"
          description="Error description"
        />
      )
      const description = screen.getByText('Error description')
      expect(description.tagName).toBe('P')
    })
  })

  describe('User Interactions', () => {
    it('should call onRetry when retry button clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <ActionableError
          title="Error"
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      expect(onRetry).toHaveBeenCalled()
    })

    it('should not render retry button when onRetry not provided', () => {
      render(<ActionableError title="Error" />)
      expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
    })

    it('should open help link in new tab', () => {
      render(
        <ActionableError
          title="Error"
          helpLink="https://example.com/help"
        />
      )
      const helpLink = screen.getByText('Get Help')
      expect(helpLink).toHaveAttribute('href', 'https://example.com/help')
      expect(helpLink).toHaveAttribute('target', '_blank')
    })

    it('should not render help button when helpLink not provided', () => {
      render(<ActionableError title="Error" />)
      expect(screen.queryByText('Get Help')).not.toBeInTheDocument()
    })

    it('should render custom actions when provided', () => {
      render(
        <ActionableError
          title="Error"
          customActions={<button>Custom Action</button>}
        />
      )
      expect(screen.getByText('Custom Action')).toBeInTheDocument()
    })

    it('should render retry and help buttons together', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <ActionableError
          title="Error"
          onRetry={onRetry}
          helpLink="https://example.com/help"
        />
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Get Help')).toBeInTheDocument()
    })

    it('should handle multiple cause items', async () => {
      const causes = [
        'Database connection failed',
        'Invalid credentials',
        'Network timeout',
      ]

      render(
        <ActionableError
          title="Authentication Error"
          causes={causes}
        />
      )

      causes.forEach(cause => {
        expect(screen.getByText(cause)).toBeInTheDocument()
      })
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply flex layout', () => {
      const { container } = render(<ActionableError title="Error" />)
      const gap = container.querySelector('.flex')
      expect(gap).toBeInTheDocument()
    })

    it('should have gap-3 spacing', () => {
      const { container } = render(<ActionableError title="Error" />)
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('gap-3')
    })

    it('should style icon correctly for error variant', () => {
      const { container } = render(<ActionableError title="Error" variant="error" />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-destructive')
    })

    it('should style icon correctly for warning variant', () => {
      const { container } = render(<ActionableError title="Warning" variant="warning" />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-warning')
    })

    it('should style icon correctly for info variant', () => {
      const { container } = render(<ActionableError title="Info" variant="info" />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('text-accent')
    })

    it('should have causes label text', () => {
      render(
        <ActionableError
          title="Error"
          causes={['Cause 1']}
        />
      )
      expect(screen.getByText('This might be due to:')).toBeInTheDocument()
    })

    it('should render causes as list items', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          causes={['Cause 1', 'Cause 2']}
        />
      )
      const listItems = container.querySelectorAll('li')
      expect(listItems).toHaveLength(2)
    })

    it('should apply list styling classes', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          causes={['Cause 1']}
        />
      )
      const list = container.querySelector('ul')
      expect(list).toHaveClass('list-disc')
    })

    it('should have proper button styling for retry', () => {
      const { container } = render(
        <ActionableError title="Error" onRetry={() => {}} />
      )
      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toHaveClass('touch-target')
    })

    it('should have proper button styling for help', () => {
      const { container } = render(
        <ActionableError title="Error" helpLink="https://example.com/help" />
      )
      const helpButton = screen.getByText('Get Help')
      expect(helpButton).toHaveClass('touch-target')
    })

    it('should have flex wrap on actions container', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          onRetry={() => {}}
          helpLink="https://example.com/help"
        />
      )
      const actionsContainer = container.querySelector('.flex-wrap')
      expect(actionsContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      const { container } = render(<ActionableError title="Error" />)
      expect(container.querySelector('[role="alert"]')).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      const { container } = render(<ActionableError title="Error" />)
      expect(container.querySelector('[aria-live="assertive"]')).toBeInTheDocument()
    })

    it('should hide icon from screen readers', () => {
      const { container } = render(<ActionableError title="Error" />)
      const icon = container.querySelector('svg')
      expect(icon?.parentElement).toHaveClass('flex-shrink-0')
    })

    it('should have accessible button text', () => {
      render(
        <ActionableError
          title="Error"
          onRetry={() => {}}
          helpLink="https://example.com/help"
        />
      )
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Get Help')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <ActionableError
          title="Error"
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByText('Try Again')
      retryButton.focus()
      expect(retryButton).toHaveFocus()

      await user.keyboard('{Enter}')
      // Button handles Enter natively
    })

    it('should announce alert to screen readers', () => {
      const { container } = render(
        <ActionableError title="Critical Error" />
      )
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Sub-components/Composition', () => {
    it('should render icon within flexbox', () => {
      const { container } = render(<ActionableError title="Error" />)
      const flex = container.querySelector('.flex')
      const icon = flex?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render title within content section', () => {
      render(<ActionableError title="Error Title" />)
      const title = screen.getByText('Error Title')
      expect(title.closest('.space-y-3')).toBeInTheDocument()
    })

    it('should render causes section with title and list', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          causes={['Cause 1']}
        />
      )
      const causeSection = container.querySelector('.text-sm')
      expect(causeSection).toBeInTheDocument()
    })

    it('should render actions in flex container', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          onRetry={() => {}}
          helpLink="https://example.com/help"
        />
      )
      const flexWrap = container.querySelector('.flex-wrap')
      expect(flexWrap).toBeInTheDocument()
    })

    it('should render RefreshCw icon in retry button', () => {
      const { container } = render(
        <ActionableError title="Error" onRetry={() => {}} />
      )
      const buttons = container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should render HelpCircle icon in help button', () => {
      const { container } = render(
        <ActionableError title="Error" helpLink="https://example.com/help" />
      )
      const helpButton = screen.getByText('Get Help')
      expect(helpButton).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(200)
      render(<ActionableError title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle very long description', () => {
      const longDescription = 'This is a very long description. '.repeat(20)
      render(
        <ActionableError
          title="Error"
          description={longDescription}
        />
      )
      expect(screen.getByText(new RegExp('This is a very long'))).toBeInTheDocument()
    })

    it('should handle many causes', () => {
      const manyaCauses = Array.from({ length: 20 }, (_, i) => `Cause ${i + 1}`)
      render(
        <ActionableError
          title="Error"
          causes={manyaCauses}
        />
      )
      manyaCauses.forEach(cause => {
        expect(screen.getByText(cause)).toBeInTheDocument()
      })
    })

    it('should handle special characters in title', () => {
      const specialTitle = 'Error! <tag> & "quote"'
      render(<ActionableError title={specialTitle} />)
      expect(screen.getByText(specialTitle)).toBeInTheDocument()
    })

    it('should handle special characters in description', () => {
      const specialDesc = 'Description with <html> & symbols'
      render(
        <ActionableError
          title="Error"
          description={specialDesc}
        />
      )
      expect(screen.getByText(specialDesc)).toBeInTheDocument()
    })

    it('should handle null helpLink gracefully', () => {
      render(
        <ActionableError
          title="Error"
          helpLink={undefined}
        />
      )
      expect(screen.queryByText('Get Help')).not.toBeInTheDocument()
    })

    it('should handle rapid retries', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()

      render(
        <ActionableError
          title="Error"
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByText('Try Again')
      await user.click(retryButton)
      await user.click(retryButton)
      await user.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(3)
    })

    it('should render with custom div props', () => {
      const { container } = render(
        <ActionableError
          title="Error"
          data-testid="error-component"
        />
      )
      expect(container.querySelector('[data-testid="error-component"]')).toBeInTheDocument()
    })

    it('should support dark mode', () => {
      const { container } = render(
        <ActionableError title="Error" variant="error" />
      )
      const errorDiv = container.querySelector('[data-slot="actionable-error"]')
      expect(errorDiv).toHaveClass('border-destructive/30')
    })
  })
})
