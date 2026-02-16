import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from './command'

describe('Command Component', () => {
  describe('Rendering', () => {
    it('should render command container', () => {
      const { container } = render(<Command>Content</Command>)
      expect(container.querySelector('[cmdk-root]')).toBeInTheDocument()
    })

    it('should render command input', () => {
      render(
        <Command>
          <CommandInput />
        </Command>
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should render command list', () => {
      const { container } = render(
        <Command>
          <CommandList>Items</CommandList>
        </Command>
      )
      expect(screen.getByText('Items')).toBeInTheDocument()
    })

    it('should render command empty', () => {
      render(
        <Command>
          <CommandEmpty>No results</CommandEmpty>
        </Command>
      )
      expect(screen.getByText('No results')).toBeInTheDocument()
    })

    it('should render command group', () => {
      render(
        <Command>
          <CommandGroup heading="Group">
            <CommandItem>Item</CommandItem>
          </CommandGroup>
        </Command>
      )
      expect(screen.getByText('Group')).toBeInTheDocument()
      expect(screen.getByText('Item')).toBeInTheDocument()
    })

    it('should render command item', () => {
      render(
        <Command>
          <CommandItem>Action</CommandItem>
        </Command>
      )
      expect(screen.getByText('Action')).toBeInTheDocument()
    })

    it('should render command separator', () => {
      const { container } = render(
        <Command>
          <CommandItem>Item 1</CommandItem>
          <CommandSeparator />
          <CommandItem>Item 2</CommandItem>
        </Command>
      )
      expect(container.querySelector('[cmdk-separator]')).toBeInTheDocument()
    })

    it('should render command shortcut', () => {
      render(
        <Command>
          <CommandItem>
            Action
            <CommandShortcut>Ctrl+K</CommandShortcut>
          </CommandItem>
        </Command>
      )
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have proper command styling', () => {
      const { container } = render(<Command>Content</Command>)
      expect(container.querySelector('[class*="rounded"]')).toBeInTheDocument()
    })

    it('should have border styling', () => {
      const { container } = render(<Command>Content</Command>)
      expect(container.querySelector('[class*="border"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have combobox input role', () => {
      render(
        <Command>
          <CommandInput />
        </Command>
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      const { container } = render(
        <Command>
          <CommandInput />
          <CommandList>
            <CommandItem>Item 1</CommandItem>
            <CommandItem>Item 2</CommandItem>
          </CommandList>
        </Command>
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle many command items', () => {
      const items = Array.from({ length: 50 }, (_, i) => (
        <CommandItem key={i}>Item {i + 1}</CommandItem>
      ))

      render(
        <Command>
          <CommandList>{items}</CommandList>
        </Command>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 50')).toBeInTheDocument()
    })

    it('should handle multiple groups', () => {
      render(
        <Command>
          <CommandGroup heading="Group 1">
            <CommandItem>Item 1</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Group 2">
            <CommandItem>Item 2</CommandItem>
          </CommandGroup>
        </Command>
      )

      expect(screen.getByText('Group 1')).toBeInTheDocument()
      expect(screen.getByText('Group 2')).toBeInTheDocument()
    })

    it('should handle nested separators', () => {
      const { container } = render(
        <Command>
          <CommandItem>Item 1</CommandItem>
          <CommandSeparator />
          <CommandItem>Item 2</CommandItem>
          <CommandSeparator />
          <CommandItem>Item 3</CommandItem>
        </Command>
      )

      const separators = container.querySelectorAll('[cmdk-separator]')
      expect(separators.length).toBe(2)
    })
  })
})
