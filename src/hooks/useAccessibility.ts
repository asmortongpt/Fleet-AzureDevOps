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
  const keyPart = parts[parts.length - 1] ?? ''

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
 *