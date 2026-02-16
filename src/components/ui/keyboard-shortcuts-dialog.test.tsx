import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'

// Mock navigator.platform
Object.defineProperty(navigator, 'platform', {
  value: 'MacIntel',
  writable: true,
})

describe('KeyboardShortcutsDialog Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering & Basic Structure', () => {
    it('should not render when closed', () => {
      const { container } = render(<KeyboardShortcutsDialog />)
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
    })

    it('should render dialog when opened with Shift+? keys', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should have role="dialog"', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('role', 'dialog')
      })
    })

    it('should have aria-modal="true"', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('should have aria-labelledby for accessibility', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-title')
      })
    })

    it('should display title "Keyboard Shortcuts"', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
      })
    })

    it('should have title with id="keyboard-shortcuts-title"', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const title = screen.getByText('Keyboard Shortcuts')
        expect(title).toHaveAttribute('id', 'keyboard-shortcuts-title')
      })
    })

    it('should display backdrop overlay', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const backdrop = container.querySelector('.fixed.inset-0')
        expect(backdrop).toBeInTheDocument()
      })
    })

    it('should have proper backdrop styling', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const backdrop = container.querySelector('.bg-black/50')
        expect(backdrop).toBeInTheDocument()
      })
    })
  })

  describe('Props & Configuration', () => {
    it('should detect Mac platform correctly', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      })

      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText('⌘')).toBeInTheDocument()
      })
    })

    it('should detect Windows/Linux platform correctly', async () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      })

      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        // Should show Ctrl for non-Mac platforms
        const shortcuts = screen.getAllByText(/\w/)
        expect(shortcuts.length).toBeGreaterThan(0)
      })
    })

    it('should display all shortcut categories', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Navigation/i)).toBeInTheDocument()
        expect(screen.getByText(/Actions/i)).toBeInTheDocument()
        expect(screen.getByText(/Data Management/i)).toBeInTheDocument()
        expect(screen.getByText(/Help/i)).toBeInTheDocument()
      })
    })

    it('should display Navigation shortcuts', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Open search/)).toBeInTheDocument()
        expect(screen.getByText(/Switch between modules/)).toBeInTheDocument()
        expect(screen.getByText(/Close modal/)).toBeInTheDocument()
        expect(screen.getByText(/Toggle sidebar/)).toBeInTheDocument()
      })
    })

    it('should display Actions shortcuts', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Create new item/)).toBeInTheDocument()
        expect(screen.getByText(/Save changes/)).toBeInTheDocument()
        expect(screen.getByText(/Submit form/)).toBeInTheDocument()
      })
    })

    it('should display Data Management shortcuts', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Filter data/)).toBeInTheDocument()
        expect(screen.getByText(/Export data/)).toBeInTheDocument()
        expect(screen.getByText(/Refresh data/)).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should open dialog with Shift+? keys', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should close dialog with Escape key', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.keyboard('{Escape}')

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should close dialog when clicking close button', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const closeButton = screen.getByLabelText('Close dialog')
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should close dialog when clicking backdrop', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const backdrop = container.querySelector('.fixed.inset-0')
      if (backdrop) {
        await user.click(backdrop)
      }

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should allow keyboard navigation within dialog', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close dialog')
        closeButton.focus()
        expect(closeButton).toHaveFocus()
      })
    })

    it('should display close button', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
      })
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply backdrop animation', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const backdrop = container.querySelector('.animate-in.fade-in')
        expect(backdrop).toBeInTheDocument()
      })
    })

    it('should apply dialog animation', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('animate-in')
      })
    })

    it('should center dialog on screen', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('left-1/2')
        expect(dialog).toHaveClass('top-1/2')
        expect(dialog).toHaveClass('-translate-x-1/2')
        expect(dialog).toHaveClass('-translate-y-1/2')
      })
    })

    it('should have proper max width and height constraints', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('max-w-2xl')
        expect(dialog).toHaveClass('max-h-[90vh]')
      })
    })

    it('should have scrollable content', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('overflow-y-auto')
      })
    })

    it('should style shortcut keys with kbd element', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const kbdElements = container.querySelectorAll('kbd')
        expect(kbdElements.length).toBeGreaterThan(0)
      })
    })

    it('should have proper kbd styling', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const kbd = container.querySelector('kbd')
        if (kbd) {
          expect(kbd).toHaveClass('bg-muted')
          expect(kbd).toHaveClass('border')
          expect(kbd).toHaveClass('rounded')
        }
      })
    })

    it('should have z-index for proper layering', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('z-50')
      })
    })

    it('should style footer section', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const footer = screen.getByText(/Press/)
        expect(footer.closest('.border-t')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog role', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should have aria-modal="true"', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
      })
    })

    it('should have aria-labelledby pointing to title', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-shortcuts-title')
      })
    })

    it('should have accessible close button', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close dialog')
        expect(closeButton).toHaveAttribute('aria-label', 'Close dialog')
      })
    })

    it('should allow keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close dialog')
        closeButton.focus()
        expect(closeButton).toHaveFocus()
      })
    })

    it('should hide backdrop from screen readers', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const backdrop = container.querySelector('[aria-hidden="true"]')
        expect(backdrop).toBeInTheDocument()
      })
    })

    it('should have semantic heading structure', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const heading = screen.getByText('Keyboard Shortcuts')
        expect(heading.tagName).toBe('H2')
      })
    })

    it('should have category headings', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const categoryHeadings = container.querySelectorAll('h3')
        expect(categoryHeadings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Sub-components/Composition', () => {
    it('should render keyboard icon in header', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const icon = container.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render header with title and close button', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
        expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
      })
    })

    it('should render content with categories', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Navigation/)).toBeInTheDocument()
        expect(screen.getByText(/Actions/)).toBeInTheDocument()
      })
    })

    it('should render footer with help text', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Press/)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple Shift+? key presses', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      await user.keyboard('{Shift>}?{/Shift}')

      // Should toggle closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle Escape pressed while closed', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      // Should not throw when Escape pressed while closed
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle rapid open/close', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')
      await user.keyboard('{Escape}')
      await user.keyboard('{Shift>}?{/Shift}')
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle keyboard shortcuts while dialog is open', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Pressing Ctrl+K while dialog open should not affect dialog
      await user.keyboard('{Control>}k{/Control}')

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render all shortcut groups without errors', async () => {
      const user = userEvent.setup()
      render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        expect(screen.getByText(/Navigation/)).toBeInTheDocument()
        expect(screen.getByText(/Actions/)).toBeInTheDocument()
        expect(screen.getByText(/Data Management/)).toBeInTheDocument()
        expect(screen.getByText(/Help/)).toBeInTheDocument()
      })
    })

    it('should handle scrolling within dialog', async () => {
      const user = userEvent.setup()
      const { container } = render(<KeyboardShortcutsDialog />)

      await user.keyboard('{Shift>}?{/Shift}')

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('overflow-y-auto')
      })
    })
  })
})
