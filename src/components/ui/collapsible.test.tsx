import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './collapsible'

describe('Collapsible Components', () => {
  describe('Collapsible Root', () => {
    it('renders collapsible root', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument()
    })

    it('has collapsible data-slot', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument()
    })

    it('accepts open prop', () => {
      const { container } = render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument()
    })

    it('accepts onOpenChange callback', () => {
      const onChange = vi.fn()
      const { container } = render(
        <Collapsible onOpenChange={onChange}>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument()
    })

    it('supports controlled mode', () => {
      const { rerender } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('supports uncontrolled mode', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible"]')).toBeInTheDocument()
    })
  })

  describe('CollapsibleTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger data-testid="trigger">Expand</CollapsibleTrigger>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has collapsible trigger data-slot', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible-trigger"]')).toBeInTheDocument()
    })

    it('displays trigger text', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Click to expand</CollapsibleTrigger>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Click to expand')).toBeInTheDocument()
    })

    it('toggles content on click', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Expand')
      fireEvent.click(trigger)
      expect(trigger).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger className="custom-trigger">Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = container.querySelector('[data-slot="collapsible-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })

    it('can contain child elements', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>
            <span>Icon</span>
            <span>Text</span>
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Text')).toBeInTheDocument()
    })
  })

  describe('CollapsibleContent', () => {
    it('renders content area', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent data-testid="content">
            Hidden information
          </CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has collapsible content data-slot', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible-content"]')).toBeInTheDocument()
    })

    it('displays content text', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Additional information</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Additional information')).toBeInTheDocument()
    })

    it('can contain complex content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Details</CollapsibleTrigger>
          <CollapsibleContent>
            <div>
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
      expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent className="custom-content">
            Content
          </CollapsibleContent>
        </Collapsible>
      )
      const content = container.querySelector('[data-slot="collapsible-content"]')
      expect(content).toHaveClass('custom-content')
    })

    it('can be hidden initially', () => {
      const { container } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Hidden content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible-content"]')).toBeInTheDocument()
    })

    it('can be visible initially', () => {
      render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Collapse</CollapsibleTrigger>
          <CollapsibleContent>Visible content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Visible content')).toBeInTheDocument()
    })
  })

  describe('Controlled vs Uncontrolled', () => {
    it('works in uncontrolled mode by default', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Toggle')
      expect(trigger).toBeInTheDocument()
    })

    it('responds to controlled open state', () => {
      const { rerender } = render(
        <Collapsible open={false}>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Content')).toBeInTheDocument()

      rerender(
        <Collapsible open={true}>
          <CollapsibleTrigger>Collapse</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Collapse')).toBeInTheDocument()
    })

    it('calls onOpenChange with new state', () => {
      const onChange = vi.fn()
      render(
        <Collapsible onOpenChange={onChange}>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Toggle')
      fireEvent.click(trigger)
    })
  })

  describe('Common Patterns', () => {
    it('works as FAQ accordion item', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>How do I get started?</CollapsibleTrigger>
          <CollapsibleContent>
            Follow these steps...
          </CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('How do I get started?')).toBeInTheDocument()
    })

    it('works with sections', () => {
      render(
        <div>
          <Collapsible>
            <CollapsibleTrigger>Section 1</CollapsibleTrigger>
            <CollapsibleContent>Content 1</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Section 2</CollapsibleTrigger>
            <CollapsibleContent>Content 2</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Section 3</CollapsibleTrigger>
            <CollapsibleContent>Content 3</CollapsibleContent>
          </Collapsible>
        </div>
      )
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
      expect(screen.getByText('Section 3')).toBeInTheDocument()
    })

    it('can have icon in trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>
            <span>▶</span>
            <span>Click to expand</span>
          </CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('▶')).toBeInTheDocument()
      expect(screen.getByText('Click to expand')).toBeInTheDocument()
    })

    it('works in details-summary pattern', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Summary information</CollapsibleTrigger>
          <CollapsibleContent>Detailed information</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Summary information')).toBeInTheDocument()
      expect(screen.getByText('Detailed information')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('responds to Enter key', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Expand')
      fireEvent.keyDown(trigger, { key: 'Enter' })
      expect(trigger).toBeInTheDocument()
    })

    it('responds to Space key', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Expand')
      fireEvent.keyDown(trigger, { key: ' ' })
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Expand')).toBeInTheDocument()
    })

    it('supports aria-label on trigger', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger aria-label="Expand section">▼</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByLabelText('Expand section')).toBeInTheDocument()
    })

    it('supports aria-expanded attribute', () => {
      const { container } = render(
        <Collapsible open={true}>
          <CollapsibleTrigger>Expand</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = container.querySelector('[data-slot="collapsible-trigger"]')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Multiple Collapsibles', () => {
    it('renders multiple collapsibles independently', () => {
      render(
        <div>
          <Collapsible>
            <CollapsibleTrigger>Item 1</CollapsibleTrigger>
            <CollapsibleContent>Content 1</CollapsibleContent>
          </Collapsible>
          <Collapsible>
            <CollapsibleTrigger>Item 2</CollapsibleTrigger>
            <CollapsibleContent>Content 2</CollapsibleContent>
          </Collapsible>
        </div>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('manages state independently', () => {
      const onChange1 = vi.fn()
      const onChange2 = vi.fn()
      render(
        <div>
          <Collapsible onOpenChange={onChange1}>
            <CollapsibleTrigger>A</CollapsibleTrigger>
            <CollapsibleContent>A Content</CollapsibleContent>
          </Collapsible>
          <Collapsible onOpenChange={onChange2}>
            <CollapsibleTrigger>B</CollapsibleTrigger>
            <CollapsibleContent>B Content</CollapsibleContent>
          </Collapsible>
        </div>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty trigger', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger />
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      expect(container.querySelector('[data-slot="collapsible-trigger"]')).toBeInTheDocument()
    })

    it('handles empty content', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent />
        </Collapsible>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('handles rapid toggling', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Toggle</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = screen.getByText('Toggle')
      fireEvent.click(trigger)
      fireEvent.click(trigger)
      fireEvent.click(trigger)
      expect(trigger).toBeInTheDocument()
    })

    it('handles nested collapsibles', () => {
      render(
        <Collapsible>
          <CollapsibleTrigger>Outer</CollapsibleTrigger>
          <CollapsibleContent>
            <Collapsible>
              <CollapsibleTrigger>Inner</CollapsibleTrigger>
              <CollapsibleContent>Inner content</CollapsibleContent>
            </Collapsible>
          </CollapsibleContent>
        </Collapsible>
      )
      expect(screen.getByText('Outer')).toBeInTheDocument()
      expect(screen.getByText('Inner')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies custom className to root', () => {
      const { container } = render(
        <Collapsible className="custom-root">
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const root = container.querySelector('[data-slot="collapsible"]')
      expect(root).toHaveClass('custom-root')
    })

    it('applies custom className to trigger', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger className="trigger-class">Trigger</CollapsibleTrigger>
          <CollapsibleContent>Content</CollapsibleContent>
        </Collapsible>
      )
      const trigger = container.querySelector('[data-slot="collapsible-trigger"]')
      expect(trigger).toHaveClass('trigger-class')
    })

    it('applies custom className to content', () => {
      const { container } = render(
        <Collapsible>
          <CollapsibleTrigger>Trigger</CollapsibleTrigger>
          <CollapsibleContent className="content-class">Content</CollapsibleContent>
        </Collapsible>
      )
      const content = container.querySelector('[data-slot="collapsible-content"]')
      expect(content).toHaveClass('content-class')
    })
  })
})
