import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Alert, AlertTitle, AlertDescription } from './alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

describe('Alert Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders alert with data-slot attribute', () => {
      const { container } = render(<Alert>Test alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('renders alert with role="alert"', () => {
      const { container } = render(<Alert>Test alert</Alert>)
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('renders with default variant', () => {
      render(<Alert>Default alert</Alert>)
      expect(screen.getByText('Default alert')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<Alert className="custom-alert">Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('custom-alert')
    })

    it('renders children content', () => {
      render(
        <Alert>
          <span>Alert content</span>
        </Alert>
      )
      expect(screen.getByText('Alert content')).toBeInTheDocument()
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies full width styling', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('w-full')
    })

    it('applies rounded border styling', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('rounded-lg', 'border')
    })

    it('applies padding', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('px-2', 'py-3')
    })

    it('applies text sizing', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('text-sm')
    })

    it('applies relative positioning', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('relative')
    })

    it('applies grid layout', () => {
      const { container } = render(<Alert>Alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('grid')
    })
  })

  describe('Default Variant', () => {
    it('applies default variant styling', () => {
      const { container } = render(<Alert variant="default">Default alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('bg-card')
      expect(alert).toHaveClass('text-card-foreground')
    })

    it('uses default variant when not specified', () => {
      const { container } = render(<Alert>Implicit default</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('bg-card')
      expect(alert).toHaveClass('text-card-foreground')
    })
  })

  describe('Destructive Variant', () => {
    it('applies destructive variant styling', () => {
      const { container } = render(<Alert variant="destructive">Error alert</Alert>)
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('text-destructive')
      expect(alert).toHaveClass('bg-card')
    })

    it('applies destructive text styling to title and description', () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('*:data-[slot=alert-title]:text-gray-900')
      expect(alert).toHaveClass('*:data-[slot=alert-description]:text-gray-800')
    })
  })

  describe('Icon Support', () => {
    it('adjusts grid layout when icon is present', () => {
      const { container } = render(
        <Alert>
          <AlertCircle />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      // has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] applied when SVG present
      expect(alert).toHaveClass('has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]')
    })

    it('applies gap when icon is present', () => {
      const { container } = render(
        <Alert>
          <AlertCircle />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('has-[>svg]:gap-x-3')
    })

    it('sizes SVG icons correctly', () => {
      const { container } = render(
        <Alert>
          <AlertCircle />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('[&>svg]:size-4')
    })

    it('positions SVG icons correctly', () => {
      const { container } = render(
        <Alert>
          <AlertCircle />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('[&>svg]:translate-y-0.5')
      expect(alert).toHaveClass('[&>svg]:text-current')
    })
  })

  describe('Grid Layout', () => {
    it('applies grid gap for vertical spacing', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('gap-y-0.5')
    })

    it('applies start-column 2 for title positioning', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      )
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('col-start-2')
    })

    it('applies start-column 2 for description positioning', () => {
      const { container } = render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      )
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('col-start-2')
    })
  })

  describe('Props Spreading', () => {
    it('spreads HTML attributes', () => {
      const { container } = render(
        <Alert
          data-testid="custom-alert"
          id="alert-1"
          title="Alert message"
        />
      )
      const alert = container.querySelector('[data-testid="custom-alert"]')
      expect(alert).toHaveAttribute('id', 'alert-1')
      expect(alert).toHaveAttribute('title', 'Alert message')
    })

    it('spreads event handlers', () => {
      let handleClick = false
      const { container } = render(
        <Alert
          onClick={() => {
            handleClick = true
          }}
        >
          Clickable alert
        </Alert>
      )
      const alert = container.querySelector('[data-slot="alert"]')
      alert?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(handleClick).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has alert role for screen readers', () => {
      const { container } = render(<Alert>Important message</Alert>)
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toBeInTheDocument()
    })

    it('screen reader announces alert immediately', () => {
      const { container } = render(
        <Alert>
          <AlertTitle>Error occurred</AlertTitle>
          <AlertDescription>Please check your input</AlertDescription>
        </Alert>
      )
      const alert = container.querySelector('[role="alert"]')
      expect(alert).toHaveAttribute('role', 'alert')
      // Role="alert" signals screen readers to announce immediately
    })
  })
})

describe('AlertTitle Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders title with data-slot attribute', () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>)
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toBeInTheDocument()
    })

    it('renders title content', () => {
      render(<AlertTitle>Alert Title</AlertTitle>)
      expect(screen.getByText('Alert Title')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<AlertTitle className="custom-title">Title</AlertTitle>)
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('Styling', () => {
    it('applies title styling', () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>)
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('col-start-2')
      expect(title).toHaveClass('line-clamp-1')
      expect(title).toHaveClass('min-h-4')
      expect(title).toHaveClass('font-medium')
      expect(title).toHaveClass('tracking-tight')
    })

    it('applies color styling', () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>)
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('text-gray-900')
      expect(title).toHaveClass('dark:text-gray-100')
    })

    it('prevents text wrapping with line-clamp-1', () => {
      const { container } = render(
        <AlertTitle>This is a very long title that should be clamped to a single line</AlertTitle>
      )
      const title = container.querySelector('[data-slot="alert-title"]')
      expect(title).toHaveClass('line-clamp-1')
    })
  })

  describe('Props Spreading', () => {
    it('spreads HTML attributes', () => {
      const { container } = render(
        <AlertTitle
          data-testid="alert-title"
          id="title-1"
        >
          Title
        </AlertTitle>
      )
      const title = container.querySelector('[data-testid="alert-title"]')
      expect(title).toHaveAttribute('id', 'title-1')
    })
  })
})

describe('AlertDescription Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders description with data-slot attribute', () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>)
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toBeInTheDocument()
    })

    it('renders description content', () => {
      render(<AlertDescription>Alert Description</AlertDescription>)
      expect(screen.getByText('Alert Description')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <AlertDescription className="custom-desc">Description</AlertDescription>
      )
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('Styling', () => {
    it('applies description styling', () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>)
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('col-start-2')
      expect(description).toHaveClass('grid')
      expect(description).toHaveClass('justify-items-start')
      expect(description).toHaveClass('gap-1')
      expect(description).toHaveClass('text-sm')
    })

    it('applies color styling', () => {
      const { container } = render(<AlertDescription>Description</AlertDescription>)
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('text-gray-800')
      expect(description).toHaveClass('dark:text-gray-200')
    })

    it('applies paragraph styling', () => {
      const { container } = render(
        <AlertDescription>
          <p>Paragraph in description</p>
        </AlertDescription>
      )
      const description = container.querySelector('[data-slot="alert-description"]')
      expect(description).toHaveClass('[&_p]:leading-relaxed')
    })
  })

  describe('Multiple Elements', () => {
    it('renders multiple paragraphs with proper spacing', () => {
      render(
        <AlertDescription>
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      )
      expect(screen.getByText('First paragraph')).toBeInTheDocument()
      expect(screen.getByText('Second paragraph')).toBeInTheDocument()
    })

    it('renders mixed content', () => {
      render(
        <AlertDescription>
          <p>Description text</p>
          <button>Action button</button>
        </AlertDescription>
      )
      expect(screen.getByText('Description text')).toBeInTheDocument()
      expect(screen.getByText('Action button')).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads HTML attributes', () => {
      const { container } = render(
        <AlertDescription
          data-testid="alert-desc"
          id="desc-1"
        >
          Description
        </AlertDescription>
      )
      const description = container.querySelector('[data-testid="alert-desc"]')
      expect(description).toHaveAttribute('id', 'desc-1')
    })
  })
})

describe('Alert Composition', () => {
  describe('Complete Alert with Icon, Title, and Description', () => {
    it('renders complete alert structure', () => {
      const { container } = render(
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Alert Title</AlertTitle>
          <AlertDescription>Alert description text</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Alert Title')).toBeInTheDocument()
      expect(screen.getByText('Alert description text')).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders complete destructive alert', () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>An error occurred while processing your request.</AlertDescription>
        </Alert>
      )

      const alert = container.querySelector('[data-slot="alert"]')
      expect(alert).toHaveClass('text-destructive')
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('An error occurred while processing your request.')).toBeInTheDocument()
    })

    it('renders success alert with different icon', () => {
      const { container } = render(
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your request has been completed successfully.</AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Your request has been completed successfully.')).toBeInTheDocument()
    })
  })

  describe('Alert Variants with Different Content', () => {
    it('renders alert with only title', () => {
      render(
        <Alert>
          <AlertTitle>Standalone Title</AlertTitle>
        </Alert>
      )
      expect(screen.getByText('Standalone Title')).toBeInTheDocument()
    })

    it('renders alert with only description', () => {
      render(
        <Alert>
          <AlertDescription>Standalone description</AlertDescription>
        </Alert>
      )
      expect(screen.getByText('Standalone description')).toBeInTheDocument()
    })

    it('renders alert with icon and title only', () => {
      const { container } = render(
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Icon and Title</AlertTitle>
        </Alert>
      )

      expect(screen.getByText('Icon and Title')).toBeInTheDocument()
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Alert with Complex Content', () => {
    it('renders alert with formatted description', () => {
      render(
        <Alert>
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            <p>First line of information</p>
            <p>Second line of information</p>
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Information')).toBeInTheDocument()
      expect(screen.getByText('First line of information')).toBeInTheDocument()
      expect(screen.getByText('Second line of information')).toBeInTheDocument()
    })

    it('renders alert with nested elements', () => {
      render(
        <Alert>
          <AlertTitle>Complex Alert</AlertTitle>
          <AlertDescription>
            <div>
              <p>Nested content</p>
              <strong>Important note</strong>
            </div>
          </AlertDescription>
        </Alert>
      )

      expect(screen.getByText('Nested content')).toBeInTheDocument()
      expect(screen.getByText('Important note')).toBeInTheDocument()
    })
  })
})
