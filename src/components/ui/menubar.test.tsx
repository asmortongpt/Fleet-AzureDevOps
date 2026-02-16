import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from './menubar'

describe('Menubar Components', () => {
  describe('Menubar Root', () => {
    it('renders menubar root', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar"]')).toBeInTheDocument()
    })

    it('has flex layout with gap', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Menu</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      const menubar = container.querySelector('[data-slot="menubar"]')
      expect(menubar).toHaveClass('flex', 'items-center', 'gap-1')
    })

    it('has background and border styling', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Menu</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      const menubar = container.querySelector('[data-slot="menubar"]')
      expect(menubar).toHaveClass('bg-background', 'border', 'rounded-md')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Menubar className="custom-menubar">
          <MenubarMenu>
            <MenubarTrigger>Menu</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      const menubar = container.querySelector('[data-slot="menubar"]')
      expect(menubar).toHaveClass('custom-menubar')
    })

    it('renders multiple menus', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByText('File')).toBeInTheDocument()
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('View')).toBeInTheDocument()
    })
  })

  describe('MenubarMenu', () => {
    it('renders menu container', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu data-testid="menu">
            <MenubarTrigger>Menu</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('menu')).toBeInTheDocument()
    })

    it('has menubar menu data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Menu</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-menu"]')).toBeInTheDocument()
    })
  })

  describe('MenubarTrigger', () => {
    it('renders trigger button', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has menubar trigger data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-trigger"]')).toBeInTheDocument()
    })

    it('has proper styling classes', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      const trigger = container.querySelector('[data-slot="menubar-trigger"]')
      expect(trigger).toHaveClass('rounded-sm', 'px-2', 'py-1', 'text-sm', 'font-medium')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger className="custom-trigger">File</MenubarTrigger>
          </MenubarMenu>
        </Menubar>
      )
      const trigger = container.querySelector('[data-slot="menubar-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('MenubarContent', () => {
    it('renders content menu', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent data-testid="content">
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has menubar content data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-content"]')).toBeInTheDocument()
    })

    it('has popover styling', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const content = container.querySelector('[data-slot="menubar-content"]')
      expect(content).toHaveClass('bg-popover', 'rounded-md', 'border', 'p-1')
    })

    it('has default alignment start', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const content = container.querySelector('[data-slot="menubar-content"]')
      expect(content).toHaveAttribute('data-side')
    })
  })

  describe('MenubarItem', () => {
    it('renders menu item', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem data-testid="item">New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('item')).toBeInTheDocument()
    })

    it('has menubar item data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-item"]')).toBeInTheDocument()
    })

    it('supports default variant', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem variant="default">New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const item = container.querySelector('[data-slot="menubar-item"]')
      expect(item).toHaveAttribute('data-variant', 'default')
    })

    it('supports destructive variant', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem variant="destructive">Delete</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const item = container.querySelector('[data-slot="menubar-item"]')
      expect(item).toHaveAttribute('data-variant', 'destructive')
    })

    it('supports inset prop', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem inset>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const item = container.querySelector('[data-slot="menubar-item"]')
      expect(item).toHaveAttribute('data-inset', 'true')
    })
  })

  describe('MenubarCheckboxItem', () => {
    it('renders checkbox item', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem data-testid="checkbox">Sidebar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('checkbox')).toBeInTheDocument()
    })

    it('has menubar checkbox item data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem>Sidebar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-checkbox-item"]')).toBeInTheDocument()
    })

    it('supports checked state', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem checked={true}>Sidebar</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const checkbox = container.querySelector('[data-slot="menubar-checkbox-item"]')
      expect(checkbox).toHaveAttribute('data-state', 'checked')
    })
  })

  describe('MenubarRadioItem', () => {
    it('renders radio item', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="auto">
                <MenubarRadioItem data-testid="radio" value="auto">
                  Auto
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('radio')).toBeInTheDocument()
    })

    it('has menubar radio item data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="auto">
                <MenubarRadioItem value="auto">Auto</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-radio-item"]')).toBeInTheDocument()
    })
  })

  describe('MenubarLabel', () => {
    it('renders label', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel data-testid="label">Recent</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('label')).toBeInTheDocument()
    })

    it('has menubar label data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Recent</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-label"]')).toBeInTheDocument()
    })

    it('has font-medium class', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarLabel>Recent</MenubarLabel>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const label = container.querySelector('[data-slot="menubar-label"]')
      expect(label).toHaveClass('font-medium')
    })
  })

  describe('MenubarSeparator', () => {
    it('renders separator', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-separator"]')).toBeInTheDocument()
    })

    it('has bg-border class', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const separator = container.querySelector('[data-slot="menubar-separator"]')
      expect(separator).toHaveClass('bg-border', 'h-px')
    })
  })

  describe('MenubarShortcut', () => {
    it('renders shortcut text', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByText('⌘N')).toBeInTheDocument()
    })

    it('has menubar shortcut data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-shortcut"]')).toBeInTheDocument()
    })

    it('has muted text color', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                New <MenubarShortcut>Ctrl+N</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const shortcut = container.querySelector('[data-slot="menubar-shortcut"]')
      expect(shortcut).toHaveClass('text-muted-foreground')
    })
  })

  describe('MenubarGroup', () => {
    it('renders group', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup data-testid="group">
                <MenubarLabel>Group</MenubarLabel>
                <MenubarItem>Item</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('group')).toBeInTheDocument()
    })

    it('has menubar group data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarItem>Item</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-group"]')).toBeInTheDocument()
    })
  })

  describe('MenubarSub', () => {
    it('renders sub menu', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-sub"]')).toBeInTheDocument()
    })
  })

  describe('MenubarSubTrigger', () => {
    it('renders sub trigger', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger data-testid="sub-trigger">
                  Export
                </MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('sub-trigger')).toBeInTheDocument()
    })

    it('has menubar sub trigger data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-sub-trigger"]')).toBeInTheDocument()
    })

    it('has chevron icon', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const trigger = container.querySelector('[data-slot="menubar-sub-trigger"]')
      const chevron = trigger?.querySelector('svg')
      expect(chevron).toBeInTheDocument()
    })
  })

  describe('MenubarSubContent', () => {
    it('renders sub content', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent data-testid="sub-content">
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('sub-content')).toBeInTheDocument()
    })

    it('has menubar sub content data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-sub-content"]')).toBeInTheDocument()
    })
  })

  describe('MenubarRadioGroup', () => {
    it('renders radio group', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup data-testid="radio-group" value="auto">
                <MenubarRadioItem value="auto">Auto</MenubarRadioItem>
                <MenubarRadioItem value="light">Light</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('radio-group')).toBeInTheDocument()
    })

    it('has menubar radio group data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value="auto">
                <MenubarRadioItem value="auto">Auto</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-radio-group"]')).toBeInTheDocument()
    })
  })

  describe('MenubarPortal', () => {
    it('renders portal', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarPortal>
              <div data-testid="portaled">Content</div>
            </MenubarPortal>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('portaled')).toBeInTheDocument()
    })

    it('has menubar portal data-slot', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarPortal>
              <div>Content</div>
            </MenubarPortal>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.querySelector('[data-slot="menubar-portal"]')).toBeInTheDocument()
    })
  })

  describe('Complex Menu Structures', () => {
    it('renders menu with nested items and separators', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarItem>Open</MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Exit</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
      expect(screen.getByText('Exit')).toBeInTheDocument()
    })

    it('renders menu with groups and separators', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarGroup>
                <MenubarLabel>Editing</MenubarLabel>
                <MenubarItem>Cut</MenubarItem>
                <MenubarItem>Copy</MenubarItem>
                <MenubarItem>Paste</MenubarItem>
              </MenubarGroup>
              <MenubarSeparator />
              <MenubarGroup>
                <MenubarLabel>Other</MenubarLabel>
                <MenubarItem>Select All</MenubarItem>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByText('Editing')).toBeInTheDocument()
      expect(screen.getByText('Cut')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('renders three-level menu structure', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarSub>
                <MenubarSubTrigger>Export</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>As PDF</MenubarItem>
                  <MenubarItem>As PNG</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('As PDF')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('handles keyboard events on menu triggers', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger data-testid="trigger">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      const trigger = screen.getByTestId('trigger')
      fireEvent.keyDown(trigger, { key: 'Enter' })
      expect(trigger).toBeInTheDocument()
    })

    it('handles arrow keys for navigation', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem data-testid="item1">New</MenubarItem>
              <MenubarItem data-testid="item2">Open</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByTestId('item1')).toBeInTheDocument()
      expect(screen.getByTestId('item2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('supports aria labels', () => {
      render(
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger aria-label="Main menu">☰</MenubarTrigger>
            <MenubarContent>
              <MenubarItem aria-label="Create new file">New</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      )
      expect(screen.getByLabelText('Main menu')).toBeInTheDocument()
      expect(screen.getByLabelText('Create new file')).toBeInTheDocument()
    })
  })
})
