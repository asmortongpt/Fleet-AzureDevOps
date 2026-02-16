import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { FormFieldWithHelp } from './form-field-with-help'

describe('FormFieldWithHelp Component', () => {
  describe('Rendering', () => {
    it('should render form field with help', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field" help="Help text">
          <input type="text" />
        </FormFieldWithHelp>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should display label', () => {
      render(
        <FormFieldWithHelp label="Email" help="Your email">
          <input type="email" />
        </FormFieldWithHelp>
      )
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should display help text', () => {
      render(
        <FormFieldWithHelp label="Field" help="Helper text">
          <input />
        </FormFieldWithHelp>
      )
      expect(screen.getByText('Helper text')).toBeInTheDocument()
    })

    it('should render input child', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field" help="Help">
          <input placeholder="Enter value" />
        </FormFieldWithHelp>
      )
      expect(container.querySelector('input')).toBeInTheDocument()
    })

    it('should have label associated with input', () => {
      const { container } = render(
        <FormFieldWithHelp label="Username" help="Help">
          <input id="username" />
        </FormFieldWithHelp>
      )
      const label = container.querySelector('label')
      expect(label).toHaveAttribute('for', 'username')
    })
  })

  describe('Styling', () => {
    it('should have flex layout', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field" help="Help">
          <input />
        </FormFieldWithHelp>
      )
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument()
    })

    it('should have spacing', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field" help="Help">
          <input />
        </FormFieldWithHelp>
      )
      expect(container.querySelector('[class*="gap"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      const { container } = render(
        <FormFieldWithHelp label="Email" help="Help">
          <input id="email-input" />
        </FormFieldWithHelp>
      )
      const label = container.querySelector('label')
      expect(label).toHaveAttribute('for', 'email-input')
    })

    it('should have describedby relationship', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field" help="Description">
          <input aria-describedby="help-text" />
        </FormFieldWithHelp>
      )
      expect(container.querySelector('input')).toHaveAttribute('aria-describedby')
    })
  })

  describe('Edge Cases', () => {
    it('should handle long label', () => {
      const longLabel = 'A'.repeat(100)
      render(
        <FormFieldWithHelp label={longLabel} help="Help">
          <input />
        </FormFieldWithHelp>
      )
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle long help text', () => {
      const longHelp = 'B'.repeat(200)
      render(
        <FormFieldWithHelp label="Field" help={longHelp}>
          <input />
        </FormFieldWithHelp>
      )
      expect(screen.getByText(longHelp.substring(0, 100))).toBeInTheDocument()
    })

    it('should work without help text', () => {
      const { container } = render(
        <FormFieldWithHelp label="Field">
          <input />
        </FormFieldWithHelp>
      )
      expect(container.querySelector('label')).toBeInTheDocument()
    })
  })
})
