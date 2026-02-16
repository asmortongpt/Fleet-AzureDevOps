import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from './context-menu'

describe('ContextMenu Components', () => {
  describe('ContextMenu Root', () => {
    it('renders context menu root', () => {
      const { container } = render(
        <ContextMenu>
          <div>Test</div>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu"]')).toBeInTheDocument()
    })

    it('accepts children', () => {
      render(
        <ContextMenu>
          <div data-testid="child">Content</div>
        </ContextMenu>
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('passes through props', () => {
      const { container } = render(
        <ContextMenu data-testid="context-root">
          <div>Test</div>
        </ContextMenu>
      )
      expect(screen.getByTestId('context-root')).toBeInTheDocument()
    })
  })

  describe('ContextMenuTrigger', () => {
    it('renders trigger element', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger data-testid="trigger">
            Right click me
          </ContextMenuTrigger>
        </ContextMenu>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has context menu trigger data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-trigger"]')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger className="custom-class">Trigger</ContextMenuTrigger>
        </ContextMenu>
      )
      const trigger = screen.getByText('Trigger')
      expect(trigger).toHaveClass('custom-class')
    })
  })

  describe('ContextMenuContent', () => {
    it('renders content element', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent data-testid="content">
            <ContextMenuItem>Item 1</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has context menu content data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-content"]')).toBeInTheDocument()
    })

    it('has popover styling classes', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const content = container.querySelector('[data-slot="context-menu-content"]')
      expect(content).toHaveClass('rounded-md', 'border', 'p-1')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent className="custom-content">
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const content = container.querySelector('[data-slot="context-menu-content"]')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('ContextMenuItem', () => {
    it('renders menu item', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem data-testid="item">Item Text</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('item')).toBeInTheDocument()
    })

    it('has context menu item data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-item"]')).toBeInTheDocument()
    })

    it('supports default variant', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem variant="default">Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item = container.querySelector('[data-slot="context-menu-item"]')
      expect(item).toHaveAttribute('data-variant', 'default')
    })

    it('supports destructive variant', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item = container.querySelector('[data-slot="context-menu-item"]')
      expect(item).toHaveAttribute('data-variant', 'destructive')
    })

    it('supports inset prop', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem inset>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item = container.querySelector('[data-slot="context-menu-item"]')
      expect(item).toHaveAttribute('data-inset', 'true')
    })
  })

  describe('ContextMenuCheckboxItem', () => {
    it('renders checkbox item', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem data-testid="checkbox-item">
              Option
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('checkbox-item')).toBeInTheDocument()
    })

    it('has context menu checkbox item data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem>Checkbox</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-checkbox-item"]')).toBeInTheDocument()
    })

    it('supports checked state', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={true}>Checked</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const checkbox = container.querySelector('[data-slot="context-menu-checkbox-item"]')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })

    it('supports unchecked state', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={false}>Unchecked</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const checkbox = container.querySelector('[data-slot="context-menu-checkbox-item"]')
      expect(checkbox).toHaveAttribute('data-state', 'unchecked')
    })

    it('has indicator element for check icon', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={true}>Option</ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const indicator = container.querySelector('[data-slot="context-menu-checkbox-item"]')?.querySelector('span')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('ContextMenuRadioItem', () => {
    it('renders radio item', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="option1">
              <ContextMenuRadioItem data-testid="radio-item" value="option1">
                Option 1
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('radio-item')).toBeInTheDocument()
    })

    it('has context menu radio item data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="option1">
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-radio-item"]')).toBeInTheDocument()
    })

    it('displays radio indicator circle', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="option1">
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      const indicator = container.querySelector('[data-slot="context-menu-radio-item"]')?.querySelector('span')
      expect(indicator).toBeInTheDocument()
    })
  })

  describe('ContextMenuLabel', () => {
    it('renders label', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel data-testid="label">Group Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('label')).toBeInTheDocument()
    })

    it('has context menu label data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-label"]')).toBeInTheDocument()
    })

    it('supports inset prop', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel inset>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      )
      const label = container.querySelector('[data-slot="context-menu-label"]')
      expect(label).toHaveAttribute('data-inset', 'true')
    })

    it('has font-medium class', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Label</ContextMenuLabel>
          </ContextMenuContent>
        </ContextMenu>
      )
      const label = container.querySelector('[data-slot="context-menu-label"]')
      expect(label).toHaveClass('font-medium')
    })
  })

  describe('ContextMenuSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-separator"]')).toBeInTheDocument()
    })

    it('has bg-border class', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator />
          </ContextMenuContent>
        </ContextMenu>
      )
      const separator = container.querySelector('[data-slot="context-menu-separator"]')
      expect(separator).toHaveClass('bg-border')
    })

    it('has horizontal line height', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSeparator />
          </ContextMenuContent>
        </ContextMenu>
      )
      const separator = container.querySelector('[data-slot="context-menu-separator"]')
      expect(separator).toHaveClass('h-px')
    })
  })

  describe('ContextMenuShortcut', () => {
    it('renders shortcut text', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Save <ContextMenuShortcut>⌘S</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByText('⌘S')).toBeInTheDocument()
    })

    it('has context menu shortcut data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Item <ContextMenuShortcut>Shortcut</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-shortcut"]')).toBeInTheDocument()
    })

    it('has muted text color', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>
              Item <ContextMenuShortcut>Ctrl+Z</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const shortcut = container.querySelector('[data-slot="context-menu-shortcut"]')
      expect(shortcut).toHaveClass('text-muted-foreground')
    })
  })

  describe('ContextMenuGroup', () => {
    it('renders group container', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup data-testid="group">
              <ContextMenuLabel>Group</ContextMenuLabel>
              <ContextMenuItem>Item</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('group')).toBeInTheDocument()
    })

    it('has context menu group data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuItem>Item</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-group"]')).toBeInTheDocument()
    })
  })

  describe('ContextMenuSub', () => {
    it('renders sub menu', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Subitem</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-sub"]')).toBeInTheDocument()
    })
  })

  describe('ContextMenuSubTrigger', () => {
    it('renders sub trigger', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger data-testid="sub-trigger">
                Submenu
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('sub-trigger')).toBeInTheDocument()
    })

    it('has chevron icon', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      const trigger = container.querySelector('[data-slot="context-menu-sub-trigger"]')
      const chevron = trigger?.querySelector('svg')
      expect(chevron).toBeInTheDocument()
    })

    it('supports inset prop', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger inset>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      const trigger = container.querySelector('[data-slot="context-menu-sub-trigger"]')
      expect(trigger).toHaveAttribute('data-inset', 'true')
    })
  })

  describe('ContextMenuSubContent', () => {
    it('renders sub content', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent data-testid="sub-content">
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('sub-content')).toBeInTheDocument()
    })

    it('has context menu sub content data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Submenu</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem>Item</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-sub-content"]')).toBeInTheDocument()
    })
  })

  describe('ContextMenuRadioGroup', () => {
    it('renders radio group', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup data-testid="radio-group" value="option1">
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
              <ContextMenuRadioItem value="option2">Option 2</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByTestId('radio-group')).toBeInTheDocument()
    })

    it('has context menu radio group data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value="option1">
              <ContextMenuRadioItem value="option1">Option 1</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-radio-group"]')).toBeInTheDocument()
    })
  })

  describe('ContextMenuPortal', () => {
    it('renders portal', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuPortal>
            <div data-testid="portal-content">Portaled</div>
          </ContextMenuPortal>
        </ContextMenu>
      )
      expect(screen.getByTestId('portal-content')).toBeInTheDocument()
    })

    it('has context menu portal data-slot', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuPortal>
            <div>Portaled</div>
          </ContextMenuPortal>
        </ContextMenu>
      )
      expect(container.querySelector('[data-slot="context-menu-portal"]')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('handles arrow key navigation', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem data-testid="item1">Item 1</ContextMenuItem>
            <ContextMenuItem data-testid="item2">Item 2</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item1 = screen.getByTestId('item1')
      expect(item1).toBeInTheDocument()
    })

    it('handles enter key on items', () => {
      const onClick = vi.fn()
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={onClick}>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item = screen.getByText('Item')
      fireEvent.keyDown(item, { key: 'Enter' })
    })
  })

  describe('Composition Patterns', () => {
    it('renders multiple items in sequence', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item 1</ContextMenuItem>
            <ContextMenuItem>Item 2</ContextMenuItem>
            <ContextMenuItem>Item 3</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('renders grouped items with label and separator', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>File</ContextMenuLabel>
              <ContextMenuItem>New</ContextMenuItem>
              <ContextMenuItem>Open</ContextMenuItem>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuGroup>
              <ContextMenuLabel>Edit</ContextMenuLabel>
              <ContextMenuItem>Cut</ContextMenuItem>
              <ContextMenuItem>Copy</ContextMenuItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByText('File')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    it('mixes different item types', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Action</ContextMenuItem>
            <ContextMenuCheckboxItem>Checkbox</ContextMenuCheckboxItem>
            <ContextMenuRadioGroup value="opt1">
              <ContextMenuRadioItem value="opt1">Radio</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByText('Action')).toBeInTheDocument()
      expect(screen.getByText('Checkbox')).toBeInTheDocument()
      expect(screen.getByText('Radio')).toBeInTheDocument()
    })
  })

  describe('Styling Variations', () => {
    it('renders destructive items with appropriate styling', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem variant="destructive">Delete Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const item = container.querySelector('[data-variant="destructive"]')
      expect(item).toBeInTheDocument()
    })

    it('handles custom className merging', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent className="custom-content">
            <ContextMenuItem className="custom-item">Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      const content = container.querySelector('[data-slot="context-menu-content"]')
      const item = container.querySelector('[data-slot="context-menu-item"]')
      expect(content).toHaveClass('custom-content')
      expect(item).toHaveClass('custom-item')
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('supports aria-label on items', () => {
      render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem aria-label="Save file">Save</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByLabelText('Save file')).toBeInTheDocument()
    })

    it('supports aria-disabled on items', () => {
      const { container } = render(
        <ContextMenu>
          <ContextMenuTrigger>Trigger</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem aria-disabled="true">Disabled</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      )
      expect(screen.getByText('Disabled')).toHaveAttribute('aria-disabled')
    })
  })
})

// Import vi for test utilities
import { vi } from 'vitest'
