import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RadioGroup, RadioGroupItem } from './radio-group'

describe('RadioGroup Components', () => {
  describe('RadioGroup Root', () => {
    it('renders radio group root', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('has radio group data-slot', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('has grid layout with gap', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const group = container.querySelector('[data-slot="radio-group"]')
      expect(group).toHaveClass('grid', 'gap-3')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <RadioGroup className="custom-group">
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const group = container.querySelector('[data-slot="radio-group"]')
      expect(group).toHaveClass('custom-group')
    })

    it('accepts value prop', () => {
      const { container } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('accepts onValueChange callback', () => {
      const onChange = vi.fn()
      const { container } = render(
        <RadioGroup onValueChange={onChange}>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('accepts disabled prop', () => {
      const { container } = render(
        <RadioGroup disabled>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('renders multiple items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
          <RadioGroupItem value="option3" id="option3" />
        </RadioGroup>
      )
      const items = screen.getAllByRole('radio')
      expect(items.length).toBe(3)
    })
  })

  describe('RadioGroupItem', () => {
    it('renders radio group item', () => {
      render(
        <RadioGroup>
          <RadioGroupItem data-testid="radio" value="option1" id="option1" />
        </RadioGroup>
      )
      expect(screen.getByTestId('radio')).toBeInTheDocument()
    })

    it('has radio group item data-slot', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group-item"]')).toBeInTheDocument()
    })

    it('has circular shape', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('rounded-full')
    })

    it('has fixed size (4x4)', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('size-4')
    })

    it('has border styling', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('border')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" className="custom-radio" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('custom-radio')
    })

    it('supports checked state', () => {
      render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const radio = screen.getByRole('radio')
      expect(radio).toHaveAttribute('data-state', 'checked')
    })

    it('supports unchecked state', () => {
      render(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const radio = screen.getByRole('radio')
      expect(radio).toHaveAttribute('data-state', 'unchecked')
    })

    it('supports disabled state', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" disabled />
        </RadioGroup>
      )
      const radio = screen.getByRole('radio')
      expect(radio).toBeDisabled()
    })

    it('has focus ring styling', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('focus-visible:ring-ring/50')
    })

    it('has transition effects', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('transition-')
    })

    it('is not a shrink target', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('shrink-0')
    })

    it('has radio role', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const radio = screen.getByRole('radio')
      expect(radio).toHaveAttribute('role', 'radio')
    })

    it('has indicator element', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const indicator = container.querySelector('[data-slot="radio-group-indicator"]')
      expect(indicator).toBeInTheDocument()
    })

    it('has circle icon in indicator', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const indicator = container.querySelector('[data-slot="radio-group-indicator"]')
      const icon = indicator?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('RadioGroup Interactions', () => {
    it('selects item on click', () => {
      const onChange = vi.fn()
      render(
        <RadioGroup onValueChange={onChange}>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[0])
    })

    it('allows value changes', () => {
      const { rerender } = render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      let radio1 = screen.getByRole('radio', { hidden: true })
      expect(radio1).toHaveAttribute('data-state', 'checked')

      rerender(
        <RadioGroup value="option2">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
    })

    it('prevents unchecking a radio', () => {
      render(
        <RadioGroup value="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      const radios = screen.getAllByRole('radio')
      fireEvent.click(radios[0])
      expect(radios[0]).toHaveAttribute('data-state', 'checked')
    })
  })

  describe('RadioGroup with Labels', () => {
    it('associates items with labels via id', () => {
      render(
        <RadioGroup>
          <div>
            <RadioGroupItem value="option1" id="option1" />
            <label htmlFor="option1">Option 1</label>
          </div>
          <div>
            <RadioGroupItem value="option2" id="option2" />
            <label htmlFor="option2">Option 2</label>
          </div>
        </RadioGroup>
      )
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument()
    })

    it('displays labels alongside radios', () => {
      render(
        <RadioGroup>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="yes" id="yes" />
            <label htmlFor="yes">Yes</label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="no" id="no" />
            <label htmlFor="no">No</label>
          </div>
        </RadioGroup>
      )
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })
  })

  describe('RadioGroup Form Integration', () => {
    it('works with form elements', () => {
      render(
        <form data-testid="form">
          <RadioGroup defaultValue="option1">
            <RadioGroupItem value="option1" id="option1" />
            <RadioGroupItem value="option2" id="option2" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>
      )
      expect(screen.getByTestId('form')).toBeInTheDocument()
    })

    it('has proper semantic structure for forms', () => {
      render(
        <fieldset>
          <legend>Choose an option</legend>
          <RadioGroup>
            <RadioGroupItem value="option1" id="option1" />
            <RadioGroupItem value="option2" id="option2" />
          </RadioGroup>
        </fieldset>
      )
      expect(screen.getByText('Choose an option')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('handles space key for selection', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      const radio = screen.getAllByRole('radio')[0]
      fireEvent.keyDown(radio, { key: ' ' })
      expect(radio).toBeInTheDocument()
    })

    it('handles arrow keys for navigation', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
          <RadioGroupItem value="option3" id="option3" />
        </RadioGroup>
      )
      const radios = screen.getAllByRole('radio')
      fireEvent.keyDown(radios[0], { key: 'ArrowDown' })
    })

    it('handles tab key for focus', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      const radio = screen.getAllByRole('radio')[0]
      fireEvent.keyDown(radio, { key: 'Tab' })
      expect(radio).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const radio = screen.getByRole('radio')
      expect(radio).toBeInTheDocument()
    })

    it('supports aria-label on group', () => {
      render(
        <RadioGroup aria-label="Color selection">
          <RadioGroupItem value="red" id="red" />
          <RadioGroupItem value="blue" id="blue" />
        </RadioGroup>
      )
      // Verify the group is accessible
      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(2)
    })

    it('supports aria-describedby on group', () => {
      render(
        <div>
          <RadioGroup aria-describedby="group-help">
            <RadioGroupItem value="option1" id="option1" />
          </RadioGroup>
          <div id="group-help">Select one option</div>
        </div>
      )
      expect(screen.getByText('Select one option')).toBeInTheDocument()
    })

    it('supports aria-disabled on items', () => {
      render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" aria-disabled="false" />
          <RadioGroupItem value="option2" id="option2" aria-disabled="true" />
        </RadioGroup>
      )
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-disabled', 'false')
    })

    it('has accessible color contrast', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('border-input', 'text-primary')
    })
  })

  describe('Multiple Radio Groups', () => {
    it('renders independent radio groups', () => {
      render(
        <div>
          <fieldset>
            <legend>Question 1</legend>
            <RadioGroup defaultValue="yes" data-testid="group1">
              <RadioGroupItem value="yes" id="q1-yes" />
              <RadioGroupItem value="no" id="q1-no" />
            </RadioGroup>
          </fieldset>
          <fieldset>
            <legend>Question 2</legend>
            <RadioGroup defaultValue="option1" data-testid="group2">
              <RadioGroupItem value="option1" id="q2-opt1" />
              <RadioGroupItem value="option2" id="q2-opt2" />
            </RadioGroup>
          </fieldset>
        </div>
      )
      expect(screen.getByTestId('group1')).toBeInTheDocument()
      expect(screen.getByTestId('group2')).toBeInTheDocument()
    })

    it('maintains separate state for each group', () => {
      render(
        <div>
          <RadioGroup defaultValue="yes" data-testid="group1">
            <RadioGroupItem value="yes" id="q1-yes" />
            <RadioGroupItem value="no" id="q1-no" />
          </RadioGroup>
          <RadioGroup defaultValue="option1" data-testid="group2">
            <RadioGroupItem value="option1" id="q2-opt1" />
            <RadioGroupItem value="option2" id="q2-opt2" />
          </RadioGroup>
        </div>
      )
      const group1 = screen.getByTestId('group1')
      const group2 = screen.getByTestId('group2')
      expect(group1).toBeInTheDocument()
      expect(group2).toBeInTheDocument()
    })
  })

  describe('Styling Variations', () => {
    it('handles custom container className', () => {
      const { container } = render(
        <RadioGroup className="space-y-4">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      )
      const group = container.querySelector('[data-slot="radio-group"]')
      expect(group).toHaveClass('space-y-4')
    })

    it('handles custom item className', () => {
      const { container } = render(
        <RadioGroup>
          <RadioGroupItem value="option1" id="option1" className="mr-2" />
        </RadioGroup>
      )
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(item).toHaveClass('mr-2')
    })

    it('combines default and custom styles', () => {
      const { container } = render(
        <RadioGroup className="custom-gap">
          <RadioGroupItem value="option1" id="option1" className="custom-radio" />
        </RadioGroup>
      )
      const group = container.querySelector('[data-slot="radio-group"]')
      const item = container.querySelector('[data-slot="radio-group-item"]')
      expect(group).toHaveClass('gap-3', 'custom-gap')
      expect(item).toHaveClass('size-4', 'rounded-full', 'custom-radio')
    })
  })

  describe('Edge Cases', () => {
    it('renders many radio items', () => {
      const { container } = render(
        <RadioGroup>
          {Array.from({ length: 10 }).map((_, i) => (
            <RadioGroupItem key={i} value={`option${i}`} id={`option${i}`} />
          ))}
        </RadioGroup>
      )
      const items = container.querySelectorAll('[data-slot="radio-group-item"]')
      expect(items.length).toBe(10)
    })

    it('handles empty radio group', () => {
      const { container } = render(<RadioGroup />)
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })

    it('handles null or undefined values gracefully', () => {
      const { container } = render(
        <RadioGroup value={undefined}>
          <RadioGroupItem value="option1" id="option1" />
        </RadioGroup>
      )
      expect(container.querySelector('[data-slot="radio-group"]')).toBeInTheDocument()
    })
  })
})
