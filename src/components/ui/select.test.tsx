import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select'

describe('Select Components', () => {
  describe('Select Root', () => {
    it('renders select root', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })

    it('has select data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })

    it('accepts value prop', () => {
      const { container } = render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })

    it('accepts onValueChange callback', () => {
      const onChange = vi.fn()
      const { container } = render(
        <Select onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })

    it('accepts disabled prop', () => {
      const { container } = render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })
  })

  describe('SelectTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Select>
          <SelectTrigger data-testid="trigger">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has select trigger data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-trigger"]')).toBeInTheDocument()
    })

    it('has proper styling', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      )
      const trigger = container.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toHaveClass('rounded-md', 'border', 'bg-transparent', 'px-3', 'py-2')
    })

    it('supports default size', () => {
      const { container } = render(
        <Select>
          <SelectTrigger size="default">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      const trigger = container.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toHaveAttribute('data-size', 'default')
    })

    it('supports sm size', () => {
      const { container } = render(
        <Select>
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      const trigger = container.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toHaveAttribute('data-size', 'sm')
    })

    it('displays chevron down icon', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      )
      const trigger = container.querySelector('[data-slot="select-trigger"]')
      const icon = trigger?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      const trigger = container.querySelector('[data-slot="select-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('SelectValue', () => {
    it('renders value placeholder', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue data-testid="value" placeholder="Choose..." />
          </SelectTrigger>
        </Select>
      )
      expect(screen.getByTestId('value')).toBeInTheDocument()
    })

    it('has select value data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-value"]')).toBeInTheDocument()
    })

    it('displays placeholder text', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option..." />
          </SelectTrigger>
        </Select>
      )
      const value = screen.getByText('Select option...')
      expect(value).toBeInTheDocument()
    })
  })

  describe('SelectContent', () => {
    it('renders content menu', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent data-testid="content">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has select content data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-content"]')).toBeInTheDocument()
    })

    it('has popover styling', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      const content = container.querySelector('[data-slot="select-content"]')
      expect(content).toHaveClass('bg-popover', 'rounded-md', 'border')
    })

    it('accepts position prop', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-content"]')).toBeInTheDocument()
    })
  })

  describe('SelectItem', () => {
    it('renders select item', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem data-testid="item" value="option1">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('item')).toBeInTheDocument()
    })

    it('has select item data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-item"]')).toBeInTheDocument()
    })

    it('has proper styling', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      const item = container.querySelector('[data-slot="select-item"]')
      expect(item).toHaveClass('rounded-sm', 'py-1.5', 'text-sm')
    })

    it('displays check icon when selected', () => {
      const { container } = render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      const icon = container.querySelector('[data-slot="select-item"]')?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1" className="custom-item">
              Option 1
            </SelectItem>
          </SelectContent>
        </Select>
      )
      const item = container.querySelector('[data-slot="select-item"]')
      expect(item).toHaveClass('custom-item')
    })
  })

  describe('SelectLabel', () => {
    it('renders label', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel data-testid="label">Group</SelectLabel>
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('label')).toBeInTheDocument()
    })

    it('has select label data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Group</SelectLabel>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-label"]')).toBeInTheDocument()
    })

    it('has proper text styling', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectLabel>Group</SelectLabel>
          </SelectContent>
        </Select>
      )
      const label = container.querySelector('[data-slot="select-label"]')
      expect(label).toHaveClass('text-muted-foreground', 'text-xs')
    })
  })

  describe('SelectSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectSeparator />
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-separator"]')).toBeInTheDocument()
    })

    it('has select separator data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectSeparator />
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-separator"]')).toBeInTheDocument()
    })

    it('has bg-border class', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectSeparator />
          </SelectContent>
        </Select>
      )
      const separator = container.querySelector('[data-slot="select-separator"]')
      expect(separator).toHaveClass('bg-border', 'h-px')
    })
  })

  describe('SelectScrollUpButton', () => {
    it('renders scroll up button', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton data-testid="scroll-up" />
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('scroll-up')).toBeInTheDocument()
    })

    it('has select scroll up button data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-scroll-up-button"]')).toBeInTheDocument()
    })

    it('displays chevron up icon', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
          </SelectContent>
        </Select>
      )
      const button = container.querySelector('[data-slot="select-scroll-up-button"]')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('SelectScrollDownButton', () => {
    it('renders scroll down button', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectScrollDownButton data-testid="scroll-down" />
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('scroll-down')).toBeInTheDocument()
    })

    it('has select scroll down button data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-scroll-down-button"]')).toBeInTheDocument()
    })

    it('displays chevron down icon', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      )
      const button = container.querySelector('[data-slot="select-scroll-down-button"]')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('SelectGroup', () => {
    it('renders group', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup data-testid="group">
              <SelectLabel>Group 1</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )
      expect(screen.getByTestId('group')).toBeInTheDocument()
    })

    it('has select group data-slot', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group</SelectLabel>
              <SelectItem value="option1">Option 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )
      expect(container.querySelector('[data-slot="select-group"]')).toBeInTheDocument()
    })
  })

  describe('Select Patterns', () => {
    it('renders grouped items', () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="lettuce">Lettuce</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )
      expect(screen.getByText('Fruits')).toBeInTheDocument()
      expect(screen.getByText('Vegetables')).toBeInTheDocument()
      expect(screen.getByText('Apple')).toBeInTheDocument()
      expect(screen.getByText('Carrot')).toBeInTheDocument()
    })

    it('renders many items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 20 }).map((_, i) => (
              <SelectItem key={i} value={`option${i}`}>
                Option {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
      const items = container.querySelectorAll('[data-slot="select-item"]')
      expect(items.length).toBe(20)
    })

    it('renders disabled items', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Enabled</SelectItem>
            <SelectItem value="option2" disabled>
              Disabled
            </SelectItem>
          </SelectContent>
        </Select>
      )
      const items = container.querySelectorAll('[data-slot="select-item"]')
      expect(items[1]).toHaveAttribute('data-disabled')
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      )
      expect(container.querySelector('[data-slot="select"]')).toBeInTheDocument()
    })

    it('supports aria-label on trigger', () => {
      render(
        <Select>
          <SelectTrigger aria-label="Choose option">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
        </Select>
      )
      expect(screen.getByLabelText('Choose option')).toBeInTheDocument()
    })
  })
})
