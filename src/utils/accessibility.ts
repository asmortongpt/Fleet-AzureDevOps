/**
 * Accessibility Utilities
 *
 * Comprehensive utilities for WCAG 2.2 AA compliance, including screen reader support,
 * focus management, keyboard navigation, and color contrast checking.
 *
 * @module accessibility
 * @version 1.0.0
 */

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * ARIA live region politeness levels
 */
export type AriaLive = 'off' | 'polite' | 'assertive'

/**
 * Focus trap options
 */
export interface FocusTrapOptions {
  /** Initial element to focus */
  initialFocus?: HTMLElement | null
  /** Callback when escape key is pressed */
  onEscape?: () => void
  /** Whether to return focus to trigger element on deactivation */
  returnFocusOnDeactivate?: boolean
  /** Allow clicking outside to deactivate */
  allowOutsideClick?: boolean
}

/**
 * Color contrast result
 */
export interface ContrastResult {
  /** Contrast ratio (1:1 to 21:1) */
  ratio: number
  /** Passes WCAG AA for normal text (4.5:1) */
  passesAA: boolean
  /** Passes WCAG AAA for normal text (7:1) */
  passesAAA: boolean
  /** Passes WCAG AA for large text (3:1) */
  passesAALarge: boolean
  /** Passes WCAG AAA for large text (4.5:1) */
  passesAAALarge: boolean
}

/**
 * Keyboard event handler options
 */
export interface KeyboardHandlerOptions {
  /** Handler for Enter key */
  onEnter?: (event: KeyboardEvent) => void
  /** Handler for Space key */
  onSpace?: (event: KeyboardEvent) => void
  /** Handler for Escape key */
  onEscape?: (event: KeyboardEvent) => void
  /** Handler for Arrow Up key */
  onArrowUp?: (event: KeyboardEvent) => void
  /** Handler for Arrow Down key */
  onArrowDown?: (event: KeyboardEvent) => void
  /** Handler for Arrow Left key */
  onArrowLeft?: (event: KeyboardEvent) => void
  /** Handler for Arrow Right key */
  onArrowRight?: (event: KeyboardEvent) => void
  /** Handler for Tab key */
  onTab?: (event: KeyboardEvent) => void
  /** Handler for Home key */
  onHome?: (event: KeyboardEvent) => void
  /** Handler for End key */
  onEnd?: (event: KeyboardEvent) => void
  /** Prevent default behavior */
  preventDefault?: boolean
  /** Stop propagation */
  stopPropagation?: boolean
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * Creates a visually hidden element that is still accessible to screen readers.
 * Follows WCAG technique for off-screen text.
 *
 * @param text - Text to announce to screen readers
 * @returns CSS style object for screen reader only text
 *
 * @example
 *