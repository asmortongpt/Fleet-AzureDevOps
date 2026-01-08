import { useEffect, useCallback } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  meta?: boolean  // Command on Mac
  shift?: boolean
  alt?: boolean
  callback: () => void
  description: string
}

/**
 * Keyboard Shortcuts Hook
 * Provides keyboard navigation throughout the application
 *
 * Example usage:
 * ```
 * useKeyboardShortcuts([
 *   {
 *     key: 'k',
 *     meta: true, // Cmd+K on Mac, Ctrl+K on Windows
 *     callback: () => openSearch(),
 *     description: 'Open search'
 *   }
 * ])
 * ```
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        // Check if key matches
        if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
          return
        }

        // Check modifier keys
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
        const altMatch = shortcut.alt ? event.altKey : !event.altKey

        // If all conditions match, execute callback
        if (ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault()
          shortcut.callback()
        }
      })
    },
    [shortcuts]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

/**
 * Global Keyboard Shortcuts for Fleet Management System
 *
 * Default shortcuts:
 * - Cmd/Ctrl + K: Open search
 * - Cmd/Ctrl + /: Show keyboard shortcuts help
 * - Cmd/Ctrl + B: Toggle sidebar
 * - Escape: Close modals/dialogs
 * - Cmd/Ctrl + 1-9: Switch between modules
 */
export const GLOBAL_SHORTCUTS = {
  SEARCH: { key: 'k', meta: true, description: 'Open search' },
  HELP: { key: '/', meta: true, description: 'Show keyboard shortcuts' },
  TOGGLE_SIDEBAR: { key: 'b', meta: true, description: 'Toggle sidebar' },
  CLOSE: { key: 'Escape', description: 'Close modal/dialog' },
  DASHBOARD: { key: '1', meta: true, description: 'Go to dashboard' },
  GPS: { key: '2', meta: true, description: 'Go to GPS tracking' },
  PEOPLE: { key: '3', meta: true, description: 'Go to people management' },
  MAINTENANCE: { key: '4', meta: true, description: 'Go to maintenance' },
  FUEL: { key: '5', meta: true, description: 'Go to fuel management' },
}

export default useKeyboardShortcuts
