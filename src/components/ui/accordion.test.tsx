import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'

describe('Accordion Component', () => {
  describe('Rendering & Structure', () => {
    it('renders accordion with items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(container.querySelector('[data-slot="accordion"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="accordion-item"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="accordion-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="accordion-content"]')).toBeInTheDocument()
    })

    it('renders multiple items', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="3">
            <AccordionTrigger>Item 3</AccordionTrigger>
            <AccordionContent>Content 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })
  })

  describe('Item Styling', () => {
    it('applies border-b styling to items', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const item = container.querySelector('[data-slot="accordion-item"]')
      expect(item).toHaveClass('border-b')
    })

    it('removes border from last item', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const items = container.querySelectorAll('[data-slot="accordion-item"]')
      expect(items[items.length - 1]).toHaveClass('last:border-b-0')
    })

    it('accepts custom item className', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1" className="custom-item">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const item = container.querySelector('[data-slot="accordion-item"]')
      expect(item).toHaveClass('custom-item')
    })
  })

  describe('Trigger Styling', () => {
    it('applies trigger styling', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('flex', 'flex-1', 'items-start', 'justify-between', 'gap-2', 'rounded-md', 'text-left', 'text-sm', 'font-medium')
    })

    it('has hover effect', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('hover:underline')
    })

    it('has focus ring styling', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('focus-visible:ring-[3px]')
    })

    it('has transition effects', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('transition-all')
    })

    it('accepts custom trigger className', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger className="custom-trigger">Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('Chevron Icon', () => {
    it('renders chevron icon', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const chevron = container.querySelector('[data-slot="accordion-trigger"] svg')
      expect(chevron).toBeInTheDocument()
      expect(chevron).toHaveClass('size-4')
    })

    it('chevron has muted styling', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const chevron = container.querySelector('[data-slot="accordion-trigger"] svg')
      expect(chevron).toHaveClass('text-muted-foreground')
    })

    it('chevron rotates on open', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('[&[data-state=open]>svg]:rotate-180')
    })

    it('chevron has smooth transition', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const chevron = container.querySelector('[data-slot="accordion-trigger"] svg')
      expect(chevron).toHaveClass('transition-transform', 'duration-200')
    })
  })

  describe('Content Styling', () => {
    it('applies content styling', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const content = container.querySelector('[data-slot="accordion-content"]')
      expect(content).toHaveClass('overflow-hidden', 'text-sm')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const content = container.querySelector('[data-slot="accordion-content"]')
      expect(content).toHaveClass('data-[state=closed]:animate-accordion-up', 'data-[state=open]:animate-accordion-down')
    })

    it('has padding on inner wrapper', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const contentWrapper = container.querySelector('[data-slot="accordion-content"] > div')
      expect(contentWrapper).toHaveClass('pt-0', 'pb-2')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent className="custom-content">Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const contentWrapper = container.querySelector('[data-slot="accordion-content"] > div')
      expect(contentWrapper).toHaveClass('custom-content')
    })
  })

  describe('Single Type', () => {
    it('renders single type accordion', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('Multiple Type', () => {
    it('renders multiple type accordion', () => {
      render(
        <Accordion type="multiple">
          <AccordionItem value="1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has button role', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })

    it('disabled state is supported', () => {
      const { container } = render(
        <Accordion type="single" collapsible disabled>
          <AccordionItem value="1">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('supports aria-label on trigger', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger aria-label="Expand item 1">Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-slot="accordion-trigger"]')
      expect(trigger).toHaveAttribute('aria-label', 'Expand item 1')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on item', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1" data-testid="custom-item">
            <AccordionTrigger>Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const item = container.querySelector('[data-testid="custom-item"]')
      expect(item).toBeInTheDocument()
    })

    it('spreads additional props on trigger', () => {
      const { container } = render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger data-testid="custom-trigger">Item</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      const trigger = container.querySelector('[data-testid="custom-trigger"]')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Complete Accordion Workflow', () => {
    it('renders complete accordion', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>Section 1</AccordionTrigger>
            <AccordionContent>Content for section 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Section 2</AccordionTrigger>
            <AccordionContent>Content for section 2</AccordionContent>
          </AccordionItem>
          <AccordionItem value="3">
            <AccordionTrigger>Section 3</AccordionTrigger>
            <AccordionContent>Content for section 3</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
      expect(screen.getByText('Section 3')).toBeInTheDocument()
    })

    it('realistic FAQ use case', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="faq1">
            <AccordionTrigger>What is this product?</AccordionTrigger>
            <AccordionContent>This is a detailed answer about the product.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq2">
            <AccordionTrigger>How do I use it?</AccordionTrigger>
            <AccordionContent>Here are the usage instructions.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq3">
            <AccordionTrigger>What is the price?</AccordionTrigger>
            <AccordionContent>The price information goes here.</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('What is this product?')).toBeInTheDocument()
      expect(screen.getByText('How do I use it?')).toBeInTheDocument()
      expect(screen.getByText('What is the price?')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders empty accordion', () => {
      const { container } = render(<Accordion type="single" collapsible />)
      expect(container.querySelector('[data-slot="accordion"]')).toBeInTheDocument()
    })

    it('renders item with complex children', () => {
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="1">
            <AccordionTrigger>
              <span>Icon</span>
              <span>Title</span>
            </AccordionTrigger>
            <AccordionContent>
              <div>
                <h3>Nested Title</h3>
                <p>Nested content</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Nested Title')).toBeInTheDocument()
    })
  })
})
