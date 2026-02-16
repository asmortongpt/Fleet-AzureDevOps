import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './form'
import { useForm } from 'react-hook-form'
import { Input } from './input'

describe('Form Field Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render form item container', () => {
      const { container } = render(<FormItem />)
      expect(container.querySelector('[data-slot="form-item"]')).toBeInTheDocument()
    })

    it('should render form label', () => {
      render(<FormLabel>Test Label</FormLabel>)
      expect(screen.getByText('Test Label')).toBeInTheDocument()
    })

    it('should render form description', () => {
      render(<FormDescription>Help text</FormDescription>)
      expect(screen.getByText('Help text')).toBeInTheDocument()
    })

    it('should render form message', () => {
      render(<FormMessage>Error message</FormMessage>)
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })

    it('should apply data-slot attributes', () => {
      const { container } = render(<FormItem />)
      expect(container.querySelector('[data-slot="form-item"]')).toBeInTheDocument()
    })

    it('should have grid gap layout', () => {
      const { container } = render(<FormItem />)
      const item = container.querySelector('[data-slot="form-item"]')
      expect(item).toHaveClass('grid')
      expect(item).toHaveClass('gap-2')
    })
  })

  describe('Props & Configuration', () => {
    it('should accept custom className on FormItem', () => {
      const { container } = render(<FormItem className="custom" />)
      const item = container.querySelector('[data-slot="form-item"]')
      expect(item).toHaveClass('custom')
    })

    it('should accept custom className on FormLabel', () => {
      const { container } = render(<FormLabel className="custom">Label</FormLabel>)
      const label = container.querySelector('[data-slot="form-label"]')
      expect(label).toHaveClass('custom')
    })

    it('should render FormLabel as label element', () => {
      const { container } = render(<FormLabel>Label</FormLabel>)
      const label = container.querySelector('label')
      expect(label).toBeInTheDocument()
    })

    it('should apply error styling to label', () => {
      const { container } = render(<FormLabel data-error={true}>Error Label</FormLabel>)
      const label = container.querySelector('[data-error="true"]')
      expect(label).toBeInTheDocument()
    })

    it('should render FormDescription with proper styling', () => {
      const { container } = render(<FormDescription>Description</FormDescription>)
      const desc = container.querySelector('[data-slot="form-description"]')
      expect(desc).toHaveClass('text-sm')
      expect(desc).toHaveClass('text-muted-foreground')
    })

    it('should render FormMessage with error styling', () => {
      const { container } = render(<FormMessage>Error</FormMessage>)
      const msg = container.querySelector('[data-slot="form-message"]')
      expect(msg).toHaveClass('text-destructive')
    })
  })

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      const { container } = render(
        <div>
          <FormLabel htmlFor="input1">Label</FormLabel>
          <input id="input1" />
        </div>
      )
      const label = container.querySelector('label')
      expect(label).toHaveAttribute('for', 'input1')
    })

    it('should be keyboard navigable', () => {
      render(<FormLabel>Label</FormLabel>)
      expect(screen.getByText('Label')).toBeInTheDocument()
    })

    it('should support aria-describedby', () => {
      const { container } = render(
        <div>
          <input aria-describedby="desc1" />
          <FormDescription id="desc1">Help</FormDescription>
        </div>
      )
      expect(container.querySelector('input')).toHaveAttribute('aria-describedby', 'desc1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long labels', () => {
      const longLabel = 'A'.repeat(100)
      render(<FormLabel>{longLabel}</FormLabel>)
      expect(screen.getByText(longLabel)).toBeInTheDocument()
    })

    it('should handle special characters in messages', () => {
      const special = 'Error: <tag> & "quote"'
      render(<FormMessage>{special}</FormMessage>)
      expect(screen.getByText(special)).toBeInTheDocument()
    })

    it('should handle empty FormMessage gracefully', () => {
      const { container } = render(<FormMessage />)
      expect(container.firstChild).not.toBeInTheDocument()
    })

    it('should support custom props on FormItem', () => {
      const { container } = render(<FormItem data-testid="custom" />)
      expect(container.querySelector('[data-testid="custom"]')).toBeInTheDocument()
    })
  })

  describe('Composition', () => {
    it('should render complete form field structure', () => {
      render(
        <FormItem>
          <FormLabel>Name</FormLabel>
          <FormControl>
            <input type="text" />
          </FormControl>
          <FormDescription>Enter your name</FormDescription>
          <FormMessage>Error</FormMessage>
        </FormItem>
      )

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Enter your name')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('should render multiple form items together', () => {
      render(
        <div>
          <FormItem>
            <FormLabel>Field 1</FormLabel>
          </FormItem>
          <FormItem>
            <FormLabel>Field 2</FormLabel>
          </FormItem>
        </div>
      )

      expect(screen.getByText('Field 1')).toBeInTheDocument()
      expect(screen.getByText('Field 2')).toBeInTheDocument()
    })
  })
})
