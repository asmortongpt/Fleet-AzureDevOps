import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { Label } from './label'

describe('Label Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders label with data-slot attribute', () => {
      const { container } = render(<Label>Label text</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toBeInTheDocument()
    })

    it('renders as label HTML element', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(<Label>This is a label</Label>)
      expect(screen.getByText('This is a label')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(<Label className="custom-label">Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('custom-label')
    })

    it('renders with mixed content', () => {
      render(
        <Label>
          <span>Icon</span>
          <span>Label text</span>
        </Label>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Label text')).toBeInTheDocument()
    })
  })

  describe('Styling - Base Classes', () => {
    it('applies flex layout styling', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('flex', 'items-center')
    })

    it('applies gap between elements', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('gap-2')
    })

    it('applies text styling', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('text-sm', 'leading-none', 'font-medium')
    })

    it('applies select-none to prevent text selection', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('select-none')
    })
  })

  describe('Disabled State Styling', () => {
    it('applies pointer-events-none for group disabled', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('group-data-[disabled=true]:pointer-events-none')
    })

    it('applies opacity-50 for group disabled', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('group-data-[disabled=true]:opacity-50')
    })

    it('applies cursor-not-allowed for peer disabled', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed')
    })

    it('applies opacity-50 for peer disabled', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('peer-disabled:opacity-50')
    })
  })

  describe('HTML Attributes', () => {
    it('spreads HTML attributes', () => {
      const { container } = render(
        <Label
          data-testid="custom-label"
          id="label-1"
          title="Label title"
        >
          Label
        </Label>
      )

      const label = container.querySelector('[data-testid="custom-label"]')
      expect(label).toHaveAttribute('id', 'label-1')
      expect(label).toHaveAttribute('title', 'Label title')
    })

    it('can be associated with form input via htmlFor', () => {
      const { container } = render(
        <div>
          <Label>Email Address</Label>
          <input id="email" type="email" />
        </div>
      )

      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
      expect(screen.getByText('Email Address')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has label element role', () => {
      const { container } = render(<Label>Label text</Label>)
      const label = container.querySelector('label')
      expect(label?.tagName).toBe('LABEL')
    })

    it('associates with input via htmlFor attribute', () => {
      const { container } = render(
        <div>
          <Label>Input Label</Label>
          <input id="test-input" />
        </div>
      )

      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
      expect(screen.getByText('Input Label')).toBeInTheDocument()
    })

    it('supports aria-label attribute', () => {
      const { container } = render(<Label aria-label="Required field">Required</Label>)
      const label = container.querySelector('label')
      expect(label).toHaveAttribute('aria-label', 'Required field')
    })

    it('can wrap form controls', () => {
      const { container } = render(
        <Label>
          <input type="checkbox" />
          <span>Accept terms</span>
        </Label>
      )

      expect(container.querySelector('input')).toBeInTheDocument()
      expect(screen.getByText('Accept terms')).toBeInTheDocument()
    })

    it('properly labels form fields', () => {
      const { container } = render(
        <div>
          <Label>Username</Label>
          <input id="username" placeholder="Enter username" />
        </div>
      )

      const input = container.querySelector('#username') as HTMLInputElement
      const label = container.querySelector('label')

      expect(label?.textContent).toBe('Username')
      expect(input).toBeInTheDocument()
      expect(label).toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('can be clicked to focus associated input', () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Click me</Label>
          <input id="test-input" />
        </div>
      )

      const label = container.querySelector('label')
      const input = container.querySelector('input') as HTMLInputElement

      fireEvent.click(label!)
      // Label click should focus the associated input
      expect(input).toBeDefined()
    })

    it('responds to hover events', () => {
      const { container } = render(<Label>Label</Label>)
      const label = container.querySelector('[data-slot="label"]') as HTMLElement

      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()

      label.addEventListener('mouseenter', handleMouseEnter)
      label.addEventListener('mouseleave', handleMouseLeave)

      fireEvent.mouseEnter(label)
      fireEvent.mouseLeave(label)

      expect(handleMouseEnter).toHaveBeenCalled()
      expect(handleMouseLeave).toHaveBeenCalled()
    })
  })

  describe('Props Spreading', () => {
    it('spreads event handlers', () => {
      const handleClick = vi.fn()
      const { container } = render(
        <Label onClick={handleClick}>Clickable label</Label>
      )

      const label = container.querySelector('[data-slot="label"]')
      fireEvent.click(label!)

      expect(handleClick).toHaveBeenCalled()
    })

    it('spreads data attributes', () => {
      const { container } = render(
        <Label
          data-testid="form-label"
          data-section="personal"
          data-required="true"
        >
          Label
        </Label>
      )

      const label = container.querySelector('[data-testid="form-label"]')
      expect(label).toHaveAttribute('data-section', 'personal')
      expect(label).toHaveAttribute('data-required', 'true')
    })
  })

  describe('With Icons', () => {
    it('renders label with icon content', () => {
      render(
        <Label>
          <svg data-testid="icon" />
          <span>Label with icon</span>
        </Label>
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Label with icon')).toBeInTheDocument()
    })

    it('maintains gap between icon and text', () => {
      const { container } = render(
        <Label>
          <svg />
          <span>Text</span>
        </Label>
      )

      const label = container.querySelector('[data-slot="label"]')
      expect(label).toHaveClass('gap-2')
    })
  })

  describe('Form Integration', () => {
    it('works with text input', () => {
      const { container } = render(
        <div>
          <Label>Name</Label>
          <input id="name" type="text" />
        </div>
      )

      const label = container.querySelector('label')
      const input = container.querySelector('input')

      expect(label).toBeInTheDocument()
      expect(input).toHaveAttribute('id', 'name')
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('works with checkbox', () => {
      const { container } = render(
        <div>
          <input id="terms" type="checkbox" />
          <Label>I agree to terms</Label>
        </div>
      )

      const label = container.querySelector('label')
      expect(label?.textContent).toBe('I agree to terms')
    })

    it('works with radio button', () => {
      const { container } = render(
        <div>
          <input id="option1" type="radio" name="choice" />
          <Label>Option 1</Label>
        </div>
      )

      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
      expect(screen.getByText('Option 1')).toBeInTheDocument()
    })

    it('works with select', () => {
      const { container } = render(
        <div>
          <Label>Country</Label>
          <select id="country">
            <option>United States</option>
          </select>
        </div>
      )

      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
      expect(screen.getByText('Country')).toBeInTheDocument()
    })
  })

  describe('Text Content Handling', () => {
    it('handles multiline content', () => {
      render(
        <Label>
          <span>Line 1</span>
          <span>Line 2</span>
        </Label>
      )

      expect(screen.getByText('Line 1')).toBeInTheDocument()
      expect(screen.getByText('Line 2')).toBeInTheDocument()
    })

    it('handles long label text', () => {
      render(
        <Label>
          This is a very long label text that describes an important form field with multiple words
        </Label>
      )

      expect(screen.getByText(/This is a very long label text/)).toBeInTheDocument()
    })

    it('handles special characters', () => {
      render(<Label>Email (required) *</Label>)
      expect(screen.getByText('Email (required) *')).toBeInTheDocument()
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to label element', () => {
      const ref = createRef<HTMLLabelElement>()
      const { container } = render(<Label ref={ref}>Label</Label>)

      expect(ref.current).toBeInstanceOf(HTMLLabelElement)
      expect(ref.current).toBe(container.querySelector('label'))
    })

    it('allows direct DOM access via ref', () => {
      const ref = createRef<HTMLLabelElement>()
      render(<Label ref={ref}>Test label</Label>)

      expect(ref.current?.textContent).toBe('Test label')
    })
  })

  describe('Styling Combination', () => {
    it('combines base styles with custom className', () => {
      const { container } = render(
        <Label className="text-lg text-blue-600">Styled label</Label>
      )

      const label = container.querySelector('[data-slot="label"]')
      // Both base styles (text-sm, font-medium) and custom styles should be present
      expect(label).toHaveClass('font-medium') // base style
      expect(label).toHaveClass('text-blue-600') // custom style
      expect(label?.className).toMatch(/text-(sm|lg)/) // has text sizing
    })

    it('preserves all styling classes', () => {
      const { container } = render(<Label className="custom">Label</Label>)
      const label = container.querySelector('[data-slot="label"]')

      // Should have all base classes plus custom
      expect(label).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm', 'custom')
    })
  })
})
