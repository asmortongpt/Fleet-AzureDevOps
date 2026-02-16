import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ToggleGroup, ToggleGroupItem } from './toggle-group'

describe('ToggleGroup Component', () => {
  describe('Rendering & Structure', () => {
    it('renders toggle group with items', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Option</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(container.querySelector('[data-slot="toggle-group"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="toggle-group-item"]')).toBeInTheDocument()
    })

    it('renders multiple items', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">A</ToggleGroupItem>
          <ToggleGroupItem value="2">B</ToggleGroupItem>
          <ToggleGroupItem value="3">C</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('B')).toBeInTheDocument()
      expect(screen.getByText('C')).toBeInTheDocument()
    })
  })

  describe('Single Type', () => {
    it('allows only one item selected at a time', async () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('button', { name: /option 1/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /option 2/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('supports collapsible mode', async () => {
      render(
        <ToggleGroup type="single" defaultValue="1" collapsible>
          <ToggleGroupItem value="1">Option</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('button', { name: /option/i })).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Multiple Type', () => {
    it('allows multiple items selected', async () => {
      render(
        <ToggleGroup type="multiple" defaultValue={["1", "2"]}>
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
          <ToggleGroupItem value="3">Option 3</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('button', { name: /option 1/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /option 2/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /option 3/i })).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('Item Styling', () => {
    it('applies item styling', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('inline-flex', 'h-10', 'w-10', 'items-center', 'justify-center', 'rounded-md', 'border', 'border-input', 'bg-transparent')
    })

    it('has hover effect', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('hover:bg-muted')
    })

    it('has active state styling', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('data-[state=on]:bg-accent', 'data-[state=on]:text-accent-foreground')
    })

    it('applies focus ring styling', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('applies transition effects', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('transition-colors')
    })
  })

  describe('Size Variants', () => {
    it('renders default size', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('h-10', 'w-10')
    })

    it('renders small size', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1" size="sm">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('h-9', 'w-9', 'text-xs')
    })

    it('renders large size', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1" size="lg">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('h-11', 'w-11')
    })
  })

  describe('Variant Support', () => {
    it('renders outline variant', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1" variant="outline">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('border', 'border-input')
    })

    it('renders default variant', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1" variant="default">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('calls onChange callback on selection', async () => {
      const handleChange = vi.fn()
      render(
        <ToggleGroup type="single" defaultValue="1" onValueChange={handleChange}>
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      )

      const option2 = screen.getByRole('button', { name: /option 2/i })
      await userEvent.click(option2)

      expect(handleChange).toHaveBeenCalled()
    })

    it('handles multiple selections', async () => {
      const handleChange = vi.fn()
      render(
        <ToggleGroup type="multiple" defaultValue={["1"]} onValueChange={handleChange}>
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2">Option 2</ToggleGroupItem>
        </ToggleGroup>
      )

      const option2 = screen.getByRole('button', { name: /option 2/i })
      await userEvent.click(option2)

      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('supports disabled prop on group', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1" disabled>
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('supports disabled prop on individual items', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Option 1</ToggleGroupItem>
          <ToggleGroupItem value="2" disabled>Option 2</ToggleGroupItem>
        </ToggleGroup>
      )
      const option2 = screen.getByRole('button', { name: /option 2/i })
      expect(option2).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('items have button role', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('items have aria-pressed attribute', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-pressed')
    })

    it('supports aria-label on items', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1" aria-label="Bold">B</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveAttribute('aria-label', 'Bold')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on item', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1" data-testid="custom-item" title="Bold">B</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-testid="custom-item"]')
      expect(item).toHaveAttribute('title', 'Bold')
    })

    it('accepts custom className on item', () => {
      const { container } = render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1" className="custom-class">Item</ToggleGroupItem>
        </ToggleGroup>
      )
      const item = container.querySelector('[data-slot="toggle-group-item"]')
      expect(item).toHaveClass('custom-class')
    })
  })

  describe('Complete ToggleGroup Workflow', () => {
    it('renders complete toggle group for text formatting', () => {
      render(
        <ToggleGroup type="multiple" defaultValue={["bold"]}>
          <ToggleGroupItem value="bold" aria-label="Bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">I</ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">U</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('button', { name: /bold/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /italic/i })).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByRole('button', { name: /underline/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('realistic view options use case', () => {
      render(
        <ToggleGroup type="single" defaultValue="list">
          <ToggleGroupItem value="grid" aria-label="Grid view">Grid</ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">List</ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByRole('button', { name: /grid view/i })).toHaveAttribute('aria-pressed', 'false')
      expect(screen.getByRole('button', { name: /list view/i })).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Edge Cases', () => {
    it('renders with empty group', () => {
      const { container } = render(<ToggleGroup type="single" />)
      expect(container.querySelector('[data-slot="toggle-group"]')).toBeInTheDocument()
    })

    it('handles many items', () => {
      render(
        <ToggleGroup type="multiple" defaultValue={["1"]}>
          {[1, 2, 3, 4, 5].map(i => (
            <ToggleGroupItem key={i} value={String(i)}>Option {i}</ToggleGroupItem>
          ))}
        </ToggleGroup>
      )
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 5')).toBeInTheDocument()
    })

    it('renders with complex children', () => {
      render(
        <ToggleGroup type="single" defaultValue="1">
          <ToggleGroupItem value="1">
            <span>Icon</span>
            <span>Label</span>
          </ToggleGroupItem>
        </ToggleGroup>
      )
      expect(screen.getByText('Label')).toBeInTheDocument()
    })
  })
})
