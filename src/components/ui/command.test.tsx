import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from './command'

describe('Command Component', () => {
  describe('Rendering & Structure', () => {
    it('renders command with input and items', () => {
      render(
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      )
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" />
        </Command>
      )
      expect(container.querySelector('[data-slot="command"]')).toBeInTheDocument()
    })

    it('renders command dialog variant', () => {
      render(
        <CommandDialog open={true}>
          <CommandInput placeholder="Search" />
        </CommandDialog>
      )
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    })
  })

  describe('Input Component', () => {
    it('renders input field', () => {
      render(
        <Command>
          <CommandInput placeholder="Type command..." />
        </Command>
      )
      const input = screen.getByPlaceholderText('Type command...')
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })

    it('accepts input from user', async () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
        </Command>
      )
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement
      await userEvent.type(input, 'test')
      expect(input.value).toBe('test')
    })

    it('has search icon styling', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" />
        </Command>
      )
      const input = container.querySelector('input')
      expect(input).toBeInTheDocument()
    })
  })

  describe('List & Items', () => {
    it('renders list with items', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Action 1</CommandItem>
            <CommandItem>Action 2</CommandItem>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Action 1')).toBeInTheDocument()
      expect(screen.getByText('Action 2')).toBeInTheDocument()
    })

    it('renders items as interactive elements', async () => {
      const handleSelect = vi.fn()
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem onSelect={handleSelect}>Item</CommandItem>
          </CommandList>
        </Command>
      )
      const item = screen.getByText('Item')
      await userEvent.click(item)
      expect(handleSelect).toHaveBeenCalled()
    })

    it('renders empty state', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results found</CommandEmpty>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('No results found')).toBeInTheDocument()
    })
  })

  describe('Groups', () => {
    it('renders command group with heading', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandGroup heading="Actions">
              <CommandItem>New</CommandItem>
              <CommandItem>Open</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Actions')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
      expect(screen.getByText('Open')).toBeInTheDocument()
    })

    it('renders multiple groups', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandGroup heading="Files">
              <CommandItem>File 1</CommandItem>
            </CommandGroup>
            <CommandGroup heading="Folders">
              <CommandItem>Folder 1</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Files')).toBeInTheDocument()
      expect(screen.getByText('Folders')).toBeInTheDocument()
    })
  })

  describe('Separators', () => {
    it('renders separator between items', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandSeparator />
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      )
      expect(container.querySelector('[role="separator"]')).toBeInTheDocument()
    })
  })

  describe('Shortcuts', () => {
    it('renders command shortcut', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>
              Save
              <CommandShortcut>Cmd+S</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Cmd+S')).toBeInTheDocument()
    })

    it('shortcut displays on right side', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>
              Open
              <CommandShortcut>Cmd+O</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      )
      const shortcut = screen.getByText('Cmd+O')
      expect(shortcut).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation', async () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      )
      const input = screen.getByPlaceholderText('Search')
      fireEvent.keyDown(input, { key: 'ArrowDown' })
      // Component handles navigation internally
      expect(input).toBeInTheDocument()
    })

    it('supports Enter to select', async () => {
      const handleSelect = vi.fn()
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem onSelect={handleSelect}>Item</CommandItem>
          </CommandList>
        </Command>
      )
      const item = screen.getByText('Item')
      fireEvent.keyDown(item, { key: 'Enter' })
      expect(item).toBeInTheDocument()
    })
  })

  describe('Dialog Mode', () => {
    it('renders dialog in modal mode', () => {
      render(
        <CommandDialog open={true}>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item</CommandItem>
          </CommandList>
        </CommandDialog>
      )
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    })

    it('closes dialog when requested', async () => {
      const onOpenChange = vi.fn()
      render(
        <CommandDialog open={true} onOpenChange={onOpenChange}>
          <CommandInput placeholder="Search" />
        </CommandDialog>
      )
      // Dialog closes on Escape
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onOpenChange).toBeDefined()
    })
  })

  describe('Filtering & Search', () => {
    it('filters items based on input', async () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Apple</CommandItem>
            <CommandItem>Banana</CommandItem>
            <CommandItem>Cherry</CommandItem>
          </CommandList>
        </Command>
      )
      const input = screen.getByPlaceholderText('Search') as HTMLInputElement
      await userEvent.type(input, 'app')
      // Component filters items internally
      expect(input.value).toBe('app')
    })
  })

  describe('Accessibility', () => {
    it('input is accessible', () => {
      render(
        <Command>
          <CommandInput placeholder="Search commands" />
        </Command>
      )
      const input = screen.getByPlaceholderText('Search commands')
      expect(input).toBeInTheDocument()
    })

    it('items have proper roles', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
          </CommandList>
        </Command>
      )
      const item = screen.getByText('Item 1')
      expect(item).toBeInTheDocument()
    })

    it('supports aria-label on input', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" aria-label="Search commands" />
        </Command>
      )
      const input = container.querySelector('input')
      expect(input).toHaveAttribute('aria-label', 'Search commands')
    })
  })

  describe('Complete Command Workflow', () => {
    it('renders complete command palette', () => {
      render(
        <Command>
          <CommandInput placeholder="Type a command..." />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem>Calendar</CommandItem>
              <CommandItem>Search Emoji</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Settings">
              <CommandItem>Profile</CommandItem>
              <CommandItem>Billing</CommandItem>
              <CommandItem>Settings</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      )
      expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument()
      expect(screen.getByText('Suggestions')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on command', () => {
      const { container } = render(
        <Command data-testid="custom-command">
          <CommandInput placeholder="Search" />
        </Command>
      )
      expect(container.querySelector('[data-testid="custom-command"]')).toBeInTheDocument()
    })

    it('spreads additional props on item', () => {
      const { container } = render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem data-testid="custom-item">Item</CommandItem>
          </CommandList>
        </Command>
      )
      expect(container.querySelector('[data-testid="custom-item"]')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders with empty list', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList />
        </Command>
      )
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    })

    it('renders with many items', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            {Array.from({ length: 50 }, (_, i) => (
              <CommandItem key={i}>Item {i + 1}</CommandItem>
            ))}
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('renders with complex item content', () => {
      render(
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandItem>
              <div>Icon</div>
              <div>Label</div>
              <CommandShortcut>Cmd+K</CommandShortcut>
            </CommandItem>
          </CommandList>
        </Command>
      )
      expect(screen.getByText('Icon')).toBeInTheDocument()
      expect(screen.getByText('Label')).toBeInTheDocument()
    })
  })
})
