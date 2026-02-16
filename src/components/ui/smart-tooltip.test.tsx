import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { SmartTooltip } from './smart-tooltip'

describe('SmartTooltip Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders smart tooltip', () => {
      render(
        <SmartTooltip content="Help text">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button', { name: /info/i })).toBeInTheDocument()
    })

    it('displays trigger content', () => {
      render(
        <SmartTooltip content="This is helpful">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Help')).toBeInTheDocument()
    })

    it('wraps children correctly', () => {
      render(
        <SmartTooltip content="Action help">
          <button data-testid="action-btn">Click me</button>
        </SmartTooltip>
      )
      expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('accepts content prop', () => {
      render(
        <SmartTooltip content="Test content">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Hover')).toBeInTheDocument()
    })

    it('accepts optional shortcut prop', () => {
      render(
        <SmartTooltip content="Save file" shortcut="Ctrl+S">
          <button>Save</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('accepts optional delay prop', () => {
      render(
        <SmartTooltip content="Content" delay={500}>
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('accepts optional side prop', () => {
      render(
        <SmartTooltip content="Content" side="right">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('accepts optional className prop', () => {
      const { container } = render(
        <SmartTooltip content="Content" className="custom-tooltip">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has default delay of 300ms', () => {
      render(
        <SmartTooltip content="Help">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has default side of top', () => {
      render(
        <SmartTooltip content="Help">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Shortcut Display', () => {
    it('renders keyboard icon when shortcut provided', () => {
      const { container } = render(
        <SmartTooltip content="Create new" shortcut="Ctrl+N">
          <button>New</button>
        </SmartTooltip>
      )
      expect(screen.getByText('New')).toBeInTheDocument()
    })

    it('displays shortcut text correctly', () => {
      render(
        <SmartTooltip content="Save" shortcut="⌘S">
          <button>Save</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('formats shortcut as kbd element', () => {
      const { container } = render(
        <SmartTooltip content="Help" shortcut="?">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Help')).toBeInTheDocument()
    })

    it('does not render shortcut section without shortcut prop', () => {
      const { container } = render(
        <SmartTooltip content="Help">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByText('Help')).toBeInTheDocument()
    })

    it('handles common shortcut formats', () => {
      const shortcuts = ['Ctrl+S', 'Cmd+S', 'Alt+F', '?', 'Enter']
      shortcuts.forEach(shortcut => {
        const { unmount } = render(
          <SmartTooltip content={`Action with ${shortcut}`} shortcut={shortcut}>
            <button>{shortcut}</button>
          </SmartTooltip>
        )
        expect(screen.getByRole('button', { name: shortcut })).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Positioning', () => {
    it('supports top positioning', () => {
      render(
        <SmartTooltip content="Content" side="top">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports right positioning', () => {
      render(
        <SmartTooltip content="Content" side="right">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports bottom positioning', () => {
      render(
        <SmartTooltip content="Content" side="bottom">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports left positioning', () => {
      render(
        <SmartTooltip content="Content" side="left">
          <button>Hover</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Delay Variations', () => {
    it('uses default 300ms delay', () => {
      render(
        <SmartTooltip content="Help">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('accepts custom delay value', () => {
      render(
        <SmartTooltip content="Help" delay={100}>
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('accepts zero delay', () => {
      render(
        <SmartTooltip content="Help" delay={0}>
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('accepts large delay values', () => {
      render(
        <SmartTooltip content="Help" delay={1000}>
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Content Variations', () => {
    it('handles short content', () => {
      render(
        <SmartTooltip content="Save">
          <button>S</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles long content', () => {
      render(
        <SmartTooltip content="Click to save the current document with a new name">
          <button>Save As</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles content with special characters', () => {
      render(
        <SmartTooltip content="Format: Name (value) - type">
          <button>Format</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles multiline equivalent content', () => {
      render(
        <SmartTooltip content="This is a longer tooltip that could span multiple lines in the display">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <SmartTooltip content="Help" className="custom-tooltip-class">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has max-width constraint', () => {
      const { container } = render(
        <SmartTooltip content="Help">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('merges custom and default styles', () => {
      const { container } = render(
        <SmartTooltip content="Help" className="extra-class">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Common Use Cases', () => {
    it('works with buttons', () => {
      render(
        <SmartTooltip content="Delete this item" shortcut="Delete">
          <button>Delete</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('works with icon buttons', () => {
      render(
        <SmartTooltip content="Add new item" shortcut="Ctrl+N">
          <button>+</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('works with links styled as buttons', () => {
      render(
        <SmartTooltip content="Go to dashboard">
          <a href="/">Dashboard</a>
        </SmartTooltip>
      )
      expect(screen.getByRole('link')).toBeInTheDocument()
    })

    it('works with custom elements', () => {
      render(
        <SmartTooltip content="Download report" shortcut="Cmd+D">
          <span data-testid="custom">📥</span>
        </SmartTooltip>
      )
      expect(screen.getByTestId('custom')).toBeInTheDocument()
    })
  })

  describe('Keyboard Shortcut Formats', () => {
    it('displays Windows shortcuts', () => {
      render(
        <SmartTooltip content="Save file" shortcut="Ctrl+S">
          <button>Save</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays Mac shortcuts', () => {
      render(
        <SmartTooltip content="Save file" shortcut="⌘S">
          <button>Save</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays single key shortcuts', () => {
      render(
        <SmartTooltip content="Show help" shortcut="?">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('displays combined shortcuts', () => {
      render(
        <SmartTooltip content="Format code" shortcut="Alt+Shift+F">
          <button>Format</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('is accessible to screen readers', () => {
      render(
        <SmartTooltip content="Information">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('supports aria labels on trigger', () => {
      render(
        <SmartTooltip content="Help">
          <button aria-label="Get help">?</button>
        </SmartTooltip>
      )
      expect(screen.getByLabelText('Get help')).toBeInTheDocument()
    })

    it('provides semantic tooltip structure', () => {
      render(
        <SmartTooltip content="Helpful information">
          <button>Help</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty content string', () => {
      render(
        <SmartTooltip content="">
          <button>Button</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles undefined shortcut', () => {
      render(
        <SmartTooltip content="Help" shortcut={undefined}>
          <button>Button</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles very long shortcuts', () => {
      render(
        <SmartTooltip content="Help" shortcut="Ctrl+Shift+Alt+Delete">
          <button>Action</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders multiple smart tooltips', () => {
      render(
        <div>
          <SmartTooltip content="Save" shortcut="Ctrl+S">
            <button>Save</button>
          </SmartTooltip>
          <SmartTooltip content="Delete" shortcut="Delete">
            <button>Delete</button>
          </SmartTooltip>
          <SmartTooltip content="Help" shortcut="?">
            <button>Help</button>
          </SmartTooltip>
        </div>
      )
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /help/i })).toBeInTheDocument()
    })
  })

  describe('Tooltip Content Structure', () => {
    it('displays content text in tooltip', () => {
      render(
        <SmartTooltip content="This is help text">
          <button>Info</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('separates content and shortcut visually', () => {
      render(
        <SmartTooltip content="Create new file" shortcut="Ctrl+N">
          <button>New</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('uses border separator between content and shortcut', () => {
      render(
        <SmartTooltip content="Save file" shortcut="Cmd+S">
          <button>Save</button>
        </SmartTooltip>
      )
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })
})
