/**
 * useAccessibility Hook
 *
 * React hook for managing accessibility features in map components.
 * Provides screen reader announcements, focus management, keyboard shortcuts,
 * and live region updates for dynamic map content.
 *
 * @module useAccessibility
 * @version 1.0.0
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import {
  announceToScreenReader,
  createLiveRegion,
  createFocusTrap,
  moveFocusTo,
  type AriaLive,
  type FocusTrapOptions,
} from '@/utils/accessibility'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Keyboard shortcut configuration
 */
export interface KeyboardShortcut {
  /** Key combination (e.g., 'ctrl+m', 'alt+z') */
  key: string
  /** Description of what the shortcut does */
  description: string
  /** Handler function */
  handler: () => void
  /** Whether to prevent default behavior */
  preventDefault?: boolean
}

/**
 * Map state change for screen reader announcements
 */
export interface MapStateChange {
  /** Type of change */
  type: 'markers_updated' | 'zoom_changed' | 'center_changed' | 'error' | 'loading' | 'ready' | 'custom'
  /** Message to announce */
  message: string
  /** Priority level */
  priority?: AriaLive
}

/**
 * Accessibility options
 */
export interface AccessibilityOptions {
  /** Enable screen reader announcements (default: true) */
  enableAnnouncements?: boolean
  /** Enable keyboard shortcuts (default: true) */
  enableKeyboardShortcuts?: boolean
  /** Enable focus management (default: true) */
  enableFocusManagement?: boolean
  /** Debounce delay for announcements (ms, default: 500) */
  announcementDebounce?: number
  /** Custom keyboard shortcuts */
  shortcuts?: KeyboardShortcut[]
  /** Announce marker count changes (default: true) */
  announceMarkerChanges?: boolean
  /** Announce zoom changes (default: false) */
  announceZoomChanges?: boolean
  /** Announce center changes (default: false) */
  announceCenterChanges?: boolean
}

/**
 * Hook return type
 */
export interface UseAccessibilityReturn {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AriaLive) => void
  /** Announce a map state change */
  announceMapChange: (change: MapStateChange) => void
  /** Set focus to a specific element */
  setFocus: (element: HTMLElement | null, smooth?: boolean) => void
  /** Create a focus trap */
  createTrap: (container: HTMLElement, options?: FocusTrapOptions) => ReturnType<typeof createFocusTrap>
  /** Register a keyboard shortcut */
  registerShortcut: (shortcut: KeyboardShortcut) => void
  /** Unregister a keyboard shortcut */
  unregisterShortcut: (key: string) => void
  /** Get all registered shortcuts (for displaying help) */
  getShortcuts: () => KeyboardShortcut[]
  /** Whether screen reader mode is likely active */
  isScreenReaderActive: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detects if a screen reader is likely active.
 * Uses heuristics since there's no reliable browser API.
 */
function detectScreenReader(): boolean {
  if (typeof window === 'undefined') return false

  // Check for common screen reader user agent strings
  const ua = window.navigator.userAgent.toLowerCase()
  const screenReaders = ['nvda', 'jaws', 'voiceover', 'talkback', 'narrator']
  if (screenReaders.some((sr) => ua.includes(sr))) return true

  // Check if user prefers reduced motion (often correlates with assistive tech)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return true

  // Check for keyboard-only navigation (tab key usage)
  // This is set by the hook when tab key is used
  return false
}

/**
 * Parses keyboard shortcut string into normalized format.
 *
 * @param key - Keyboard shortcut (e.g., 'ctrl+m', 'alt+shift+z')
 * @returns Normalized key object
 */
function parseShortcut(key: string): {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
} {
  const parts = key.toLowerCase().split('+')
  const keyPart = parts[parts.length - 1]

  return {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    key: keyPart,
  }
}

/**
 * Checks if keyboard event matches shortcut.
 */
function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ReturnType<typeof parseShortcut>
): boolean {
  return (
    event.key.toLowerCase() === shortcut.key &&
    event.ctrlKey === shortcut.ctrl &&
    event.altKey === shortcut.alt &&
    event.shiftKey === shortcut.shift &&
    event.metaKey === shortcut.meta
  )
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useAccessibility - Comprehensive accessibility management for map components.
 *
 * @param options - Accessibility options
 * @returns Accessibility utilities
 *
 * @example
 * ```tsx
 * const {
 *   announce,
 *   announceMapChange,
 *   setFocus,
 *   registerShortcut
 * } = useAccessibility({
 *   enableAnnouncements: true,
 *   announceMarkerChanges: true,
 * })
 *
 * // Announce marker updates
 * useEffect(() => {
 *   announceMapChange({
 *     type: 'markers_updated',
 *     message: `Map updated with ${markers.length} markers`,
 *     priority: 'polite'
 *   })
 * }, [markers])
 *
 * // Register custom keyboard shortcut
 * registerShortcut({
 *   key: 'ctrl+m',
 *   description: 'Focus map',
 *   handler: () => mapRef.current?.focus()
 * })
 * ```
 */
export function useAccessibility(
  options: AccessibilityOptions = {}
): UseAccessibilityReturn {
  const {
    enableAnnouncements = true,
    enableKeyboardShortcuts = true,
    enableFocusManagement = true,
    announcementDebounce = 500,
    shortcuts: initialShortcuts = [],
    announceMarkerChanges = true,
    announceZoomChanges = false,
    announceCenterChanges = false,
  } = options

  // ========== State ==========
  const [isScreenReaderActive, setIsScreenReaderActive] = useState(false)
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(initialShortcuts)

  // ========== Refs ==========
  const liveRegionRef = useRef<ReturnType<typeof createLiveRegion> | null>(null)
  const announcementTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastAnnouncementRef = useRef<string>('')
  const keyboardHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  // ========== Screen Reader Detection ==========
  useEffect(() => {
    setIsScreenReaderActive(detectScreenReader())

    // Listen for tab key to detect keyboard-only users
    const handleFirstTab = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsScreenReaderActive(true)
        window.removeEventListener('keydown', handleFirstTab)
      }
    }

    window.addEventListener('keydown', handleFirstTab)
    return () => window.removeEventListener('keydown', handleFirstTab)
  }, [])

  // ========== Live Region Setup ==========
  useEffect(() => {
    if (enableAnnouncements && typeof window !== 'undefined') {
      liveRegionRef.current = createLiveRegion('map-accessibility-live-region', 'polite')

      return () => {
        liveRegionRef.current?.cleanup()
        liveRegionRef.current = null
      }
    }
  }, [enableAnnouncements])

  // ========== Cleanup timers ==========
  useEffect(() => {
    return () => {
      if (announcementTimerRef.current) {
        clearTimeout(announcementTimerRef.current)
      }
    }
  }, [])

  // ========== Announcement Functions ==========

  /**
   * Announce a message to screen readers with debouncing.
   */
  const announce = useCallback(
    (message: string, priority: AriaLive = 'polite') => {
      if (!enableAnnouncements || !message) return

      // Don't announce same message twice in a row
      if (message === lastAnnouncementRef.current) return

      // Clear existing timer
      if (announcementTimerRef.current) {
        clearTimeout(announcementTimerRef.current)
      }

      // Debounce announcements
      announcementTimerRef.current = setTimeout(() => {
        lastAnnouncementRef.current = message

        // Use live region if available, otherwise use one-time announcement
        if (liveRegionRef.current) {
          liveRegionRef.current.update(message)
        } else {
          announceToScreenReader(message, priority)
        }
      }, announcementDebounce)
    },
    [enableAnnouncements, announcementDebounce]
  )

  /**
   * Announce map state changes.
   */
  const announceMapChange = useCallback(
    (change: MapStateChange) => {
      const { type, message, priority = 'polite' } = change

      // Check if this type of announcement is enabled
      if (type === 'markers_updated' && !announceMarkerChanges) return
      if (type === 'zoom_changed' && !announceZoomChanges) return
      if (type === 'center_changed' && !announceCenterChanges) return

      // Special handling for errors (always assertive)
      const finalPriority = type === 'error' ? 'assertive' : priority

      announce(message, finalPriority)
    },
    [announce, announceMarkerChanges, announceZoomChanges, announceCenterChanges]
  )

  // ========== Focus Management ==========

  /**
   * Set focus to an element with smooth scrolling.
   */
  const setFocus = useCallback(
    (element: HTMLElement | null, smooth: boolean = true) => {
      if (!enableFocusManagement || !element) return
      moveFocusTo(element, { smooth })
    },
    [enableFocusManagement]
  )

  /**
   * Create a focus trap for modals/popups.
   */
  const createTrap = useCallback(
    (container: HTMLElement, options?: FocusTrapOptions) => {
      if (!enableFocusManagement) {
        return {
          activate: () => {},
          deactivate: () => {},
          update: () => {},
        }
      }
      return createFocusTrap(container, options)
    },
    [enableFocusManagement]
  )

  // ========== Keyboard Shortcuts ==========

  /**
   * Register a new keyboard shortcut.
   */
  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts((prev) => {
      // Remove existing shortcut with same key
      const filtered = prev.filter((s) => s.key !== shortcut.key)
      return [...filtered, shortcut]
    })
  }, [])

  /**
   * Unregister a keyboard shortcut.
   */
  const unregisterShortcut = useCallback((key: string) => {
    setShortcuts((prev) => prev.filter((s) => s.key !== key))
  }, [])

  /**
   * Get all registered shortcuts.
   */
  const getShortcuts = useCallback(() => {
    return [...shortcuts]
  }, [shortcuts])

  // ========== Keyboard Event Handler ==========
  useEffect(() => {
    if (!enableKeyboardShortcuts || shortcuts.length === 0) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const parsed = parseShortcut(shortcut.key)
        if (matchesShortcut(event, parsed)) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.handler()
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    keyboardHandlerRef.current = handleKeyDown

    return () => {
      if (keyboardHandlerRef.current) {
        window.removeEventListener('keydown', keyboardHandlerRef.current)
      }
    }
  }, [enableKeyboardShortcuts, shortcuts])

  // ========== Return ==========
  return {
    announce,
    announceMapChange,
    setFocus,
    createTrap,
    registerShortcut,
    unregisterShortcut,
    getShortcuts,
    isScreenReaderActive,
  }
}

// ============================================================================
// Default Keyboard Shortcuts for Map Components
// ============================================================================

/**
 * Default keyboard shortcuts for map navigation.
 * Can be used as a starting point for custom shortcuts.
 */
export const DEFAULT_MAP_SHORTCUTS: KeyboardShortcut[] = [
  {
    key: 'ctrl+plus',
    description: 'Zoom in',
    handler: () => {}, // Handler should be provided by component
  },
  {
    key: 'ctrl+minus',
    description: 'Zoom out',
    handler: () => {},
  },
  {
    key: 'ctrl+0',
    description: 'Reset zoom',
    handler: () => {},
  },
  {
    key: 'ctrl+f',
    description: 'Focus search',
    handler: () => {},
  },
  {
    key: 'escape',
    description: 'Close popup/dialog',
    handler: () => {},
  },
  {
    key: 'alt+arrowup',
    description: 'Pan map up',
    handler: () => {},
  },
  {
    key: 'alt+arrowdown',
    description: 'Pan map down',
    handler: () => {},
  },
  {
    key: 'alt+arrowleft',
    description: 'Pan map left',
    handler: () => {},
  },
  {
    key: 'alt+arrowright',
    description: 'Pan map right',
    handler: () => {},
  },
  {
    key: 'ctrl+h',
    description: 'Show keyboard shortcuts help',
    handler: () => {},
  },
]

/**
 * Export hook and utilities
 */
export default useAccessibility
