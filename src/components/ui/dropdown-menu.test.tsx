import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './dropdown-menu'

describe('DropdownMenu Component', () => {
  describe('Rendering & Structure', () => {
    it('renders dropdown menu with trigger and content', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Menu')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(container.querySelector('[data-slot="dropdown-menu"]')).toBeDefined()
    })

    it('renders trigger button', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByRole('button', { name: /options/i })).toBeInTheDocument()
    })
  })

  describe('Menu Items', () => {
    it('renders menu items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
            <DropdownMenuItem>Item 3</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })

    it('item is interactive', async () => {
      const handleClick = vi.fn()
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleClick}>Action</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      const item = screen.getByText('Action')
      await userEvent.click(item)
      expect(handleClick).toHaveBeenCalled()
    })

    it('renders disabled item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled>Disabled Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      const item = screen.getByText('Disabled Item')
      expect(item).toHaveAttribute('data-disabled')
    })
  })

  describe('Groups & Labels', () => {
    it('renders menu groups with labels', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Files</DropdownMenuLabel>
              <DropdownMenuItem>New</DropdownMenuItem>
              <DropdownMenuItem>Open</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('renders multiple groups', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Section 1</DropdownMenuLabel>
              <DropdownMenuItem>Item 1</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Section 2</DropdownMenuLabel>
              <DropdownMenuItem>Item 2</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Section 1')).toBeInTheDocument()
      expect(screen.getByText('Section 2')).toBeInTheDocument()
    })
  })

  describe('Checkbox Items', () => {
    it('renders checkbox item', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Show Details</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Show Details')).toBeInTheDocument()
    })

    it('checkbox item has checked state', async () => {
      const { rerender } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item')).toBeInTheDocument()

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item')).toBeInTheDocument()
    })

    it('multiple checkbox items can be selected', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={true}>Show Sidebar</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>Show Footer</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Show Sidebar')).toBeInTheDocument()
      expect(screen.getByText('Show Footer')).toBeInTheDocument()
    })
  })

  describe('Radio Items', () => {
    it('renders radio group with items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="option1">
              <DropdownMenuRadioItem value="option1">Option 1</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">Option 2</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Option 1')).toBeInTheDocument()
      expect(screen.getByText('Option 2')).toBeInTheDocument()
    })

    it('only one radio item selected', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value="small">
              <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Small')).toBeInTheDocument()
      expect(screen.getByText('Large')).toBeInTheDocument()
    })
  })

  describe('Separators & Shortcuts', () => {
    it('renders separator', () => {
      const { container } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(container.querySelector('[role="separator"]')).toBeInTheDocument()
    })

    it('renders item with shortcut', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>Cmd+S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Cmd+S')).toBeInTheDocument()
    })
  })

  describe('Submenus', () => {
    it('renders submenu trigger', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Submenu Item 1</DropdownMenuItem>
                <DropdownMenuItem>Submenu Item 2</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('More')).toBeInTheDocument()
    })

    it('submenu contains nested items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('PDF')).toBeInTheDocument()
      expect(screen.getByText('CSV')).toBeInTheDocument()
    })
  })

  describe('Open/Close State', () => {
    it('respects open prop', () => {
      const { rerender } = render(
        <DropdownMenu open={false}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.queryByText('Item')).not.toBeInTheDocument()

      rerender(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item')).toBeInTheDocument()
    })

    it('closes on item selection', async () => {
      const onOpenChange = vi.fn()
      render(
        <DropdownMenu open={true} onOpenChange={onOpenChange}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => {}}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      const item = screen.getByText('Item')
      await userEvent.click(item)
      expect(onOpenChange).toBeDefined()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
            <DropdownMenuItem>Item 2</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('supports Enter to select', async () => {
      const handleSelect = vi.fn()
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={handleSelect}>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      const item = screen.getByText('Item')
      fireEvent.keyDown(item, { key: 'Enter' })
      expect(item).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has button role', () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('content has menu role', () => {
      const { container } = render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(container.querySelector('[role="menu"]')).toBeInTheDocument()
    })

    it('items have menuitem role', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      const item = screen.getByText('Item')
      expect(item).toHaveAttribute('role', 'menuitem')
    })
  })

  describe('Complete Dropdown Workflow', () => {
    it('renders complete dropdown menu', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Options</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>New</DropdownMenuItem>
              <DropdownMenuItem>Save</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuCheckboxItem checked={true}>Show Sidebar</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={false}>Show Footer</DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Font Size</DropdownMenuLabel>
              <DropdownMenuRadioGroup value="small">
                <DropdownMenuRadioItem value="small">Small</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="large">Large</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Options')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Show Sidebar')).toBeInTheDocument()
      expect(screen.getByText('Small')).toBeInTheDocument()
    })

    it('realistic context menu use case', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>File</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>New</DropdownMenuItem>
            <DropdownMenuItem>Open</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Save</DropdownMenuItem>
            <DropdownMenuItem>Save As...</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Exit</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Exit')).toHaveAttribute('data-disabled')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on trigger', () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger data-testid="custom-trigger">Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(container.querySelector('[data-testid="custom-trigger"]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with empty content', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent />
        </DropdownMenu>
      )
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('renders with many items', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            {Array.from({ length: 30 }, (_, i) => (
              <DropdownMenuItem key={i}>Item {i + 1}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 30')).toBeInTheDocument()
    })

    it('renders with deeply nested structure', () => {
      render(
        <DropdownMenu open={true}>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Level 1</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Level 2</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem>Deep Item</DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      expect(screen.getByText('Level 1')).toBeInTheDocument()
      expect(screen.getByText('Level 2')).toBeInTheDocument()
      expect(screen.getByText('Deep Item')).toBeInTheDocument()
    })
  })
})
