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
 * ```tsx
 * <span style={screenReaderOnly()}>
 *   Additional context for screen readers
 * </span>
 * ```
 */
export function screenReaderOnly(): React.CSSProperties {
  return {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  }
}

/**
 * Announces a message to screen readers using ARIA live regions.
 * Creates a temporary live region, announces the message, and removes it.
 *
 * @param message - Message to announce
 * @param priority - Politeness level (default: 'polite')
 * @param timeout - How long to keep the message (ms, default: 1000)
 *
 * @example
 * ```ts
 * announceToScreenReader('Map updated with 5 new vehicles', 'polite')
 * announceToScreenReader('Error loading map data', 'assertive')
 * ```
 */
export function announceToScreenReader(
  message: string,
  priority: AriaLive = 'polite',
  timeout: number = 1000
): void {
  if (!message || typeof document === 'undefined') return

  // Create live region element
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
  liveRegion.setAttribute('aria-live', priority)
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `

  // Add to DOM
  document.body.appendChild(liveRegion)

  // Small delay to ensure screen reader picks it up
  setTimeout(() => {
    liveRegion.textContent = message
  }, 100)

  // Remove after timeout
  setTimeout(() => {
    if (liveRegion.parentNode) {
      liveRegion.parentNode.removeChild(liveRegion)
    }
  }, timeout + 100)
}

/**
 * Creates a persistent live region for dynamic updates.
 * Returns cleanup function to remove the live region.
 *
 * @param id - Unique ID for the live region
 * @param priority - Politeness level
 * @returns Object with update and cleanup functions
 *
 * @example
 * ```ts
 * const liveRegion = createLiveRegion('map-status', 'polite')
 * liveRegion.update('Loading map data...')
 * liveRegion.update('Map loaded successfully')
 * liveRegion.cleanup() // Call when component unmounts
 * ```
 */
export function createLiveRegion(
  id: string,
  priority: AriaLive = 'polite'
): {
  update: (message: string) => void
  cleanup: () => void
} {
  if (typeof document === 'undefined') {
    return {
      update: () => {},
      cleanup: () => {},
    }
  }

  // Check if live region already exists
  let liveRegion = document.getElementById(id) as HTMLDivElement | null

  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = id
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(liveRegion)
  }

  return {
    update: (message: string) => {
      if (liveRegion) {
        liveRegion.textContent = message
      }
    },
    cleanup: () => {
      if (liveRegion && liveRegion.parentNode) {
        liveRegion.parentNode.removeChild(liveRegion)
      }
    },
  }
}

// ============================================================================
// Focus Management
// ============================================================================

/**
 * Gets all focusable elements within a container.
 * Includes standard focusable elements and elements with tabindex >= 0.
 *
 * @param container - Container element to search within
 * @returns Array of focusable elements
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector))

  return elements.filter((el) => {
    // Filter out elements that are not visible or are inert
    return (
      el.offsetWidth > 0 &&
      el.offsetHeight > 0 &&
      window.getComputedStyle(el).visibility !== 'hidden' &&
      !el.hasAttribute('inert')
    )
  })
}

/**
 * Creates a focus trap within a container element.
 * Useful for modals, dialogs, and popups to keep focus contained.
 *
 * @param container - Container element to trap focus within
 * @param options - Focus trap options
 * @returns Object with activate, deactivate, and update functions
 *
 * @example
 * ```ts
 * const trap = createFocusTrap(modalElement, {
 *   initialFocus: firstInputElement,
 *   onEscape: () => closeModal(),
 *   returnFocusOnDeactivate: true
 * })
 * trap.activate()
 * // Later...
 * trap.deactivate()
 * ```
 */
export function createFocusTrap(
  container: HTMLElement,
  options: FocusTrapOptions = {}
): {
  activate: () => void
  deactivate: () => void
  update: () => void
} {
  const {
    initialFocus,
    onEscape,
    returnFocusOnDeactivate = true,
    allowOutsideClick = false,
  } = options

  let previouslyFocusedElement: HTMLElement | null = null
  let isActive = false

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive) return

    // Handle Escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault()
      onEscape()
      return
    }

    // Handle Tab key
    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }

  const handleClick = (event: MouseEvent) => {
    if (!isActive || allowOutsideClick) return

    const target = event.target as HTMLElement
    if (!container.contains(target)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const activate = () => {
    if (isActive) return

    // Store currently focused element
    previouslyFocusedElement = document.activeElement as HTMLElement

    isActive = true

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick, true)

    // Focus initial element or first focusable element
    const focusableElements = getFocusableElements(container)
    const elementToFocus = initialFocus || focusableElements[0]

    if (elementToFocus) {
      setTimeout(() => elementToFocus.focus(), 0)
    }
  }

  const deactivate = () => {
    if (!isActive) return

    isActive = false

    // Remove event listeners
    document.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('click', handleClick, true)

    // Return focus to previously focused element
    if (returnFocusOnDeactivate && previouslyFocusedElement) {
      setTimeout(() => previouslyFocusedElement?.focus(), 0)
    }
  }

  const update = () => {
    // Re-calculate focusable elements if container content changes
    if (isActive) {
      const focusableElements = getFocusableElements(container)
      if (focusableElements.length > 0 && !focusableElements.includes(document.activeElement as HTMLElement)) {
        focusableElements[0].focus()
      }
    }
  }

  return { activate, deactivate, update }
}

/**
 * Moves focus to a specific element with optional smooth scrolling.
 * Ensures the element is visible and focusable.
 *
 * @param element - Element to focus
 * @param options - Focus options (preventScroll, smooth scroll)
 */
export function moveFocusTo(
  element: HTMLElement | null,
  options: { preventScroll?: boolean; smooth?: boolean } = {}
): void {
  if (!element) return

  const { preventScroll = false, smooth = true } = options

  // Make element focusable if needed
  if (element.tabIndex < 0) {
    element.tabIndex = -1
  }

  // Focus element
  element.focus({ preventScroll })

  // Scroll into view if not prevented
  if (!preventScroll && smooth) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    })
  }
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

/**
 * Creates a keyboard event handler with support for common keyboard shortcuts.
 * Simplifies handling of keyboard navigation patterns.
 *
 * @param options - Keyboard handler options
 * @returns Keyboard event handler function
 *
 * @example
 * ```tsx
 * <div onKeyDown={createKeyboardHandler({
 *   onEnter: () => handleSelect(),
 *   onEscape: () => handleClose(),
 *   onArrowUp: () => moveToPrevious(),
 *   onArrowDown: () => moveToNext(),
 * })} />
 * ```
 */
export function createKeyboardHandler(options: KeyboardHandlerOptions) {
  return (event: KeyboardEvent) => {
    const {
      onEnter,
      onSpace,
      onEscape,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onHome,
      onEnd,
      preventDefault = true,
      stopPropagation = false,
    } = options

    let handled = false

    switch (event.key) {
      case 'Enter':
        if (onEnter) {
          onEnter(event)
          handled = true
        }
        break
      case ' ':
      case 'Space':
        if (onSpace) {
          onSpace(event)
          handled = true
        }
        break
      case 'Escape':
      case 'Esc':
        if (onEscape) {
          onEscape(event)
          handled = true
        }
        break
      case 'ArrowUp':
      case 'Up':
        if (onArrowUp) {
          onArrowUp(event)
          handled = true
        }
        break
      case 'ArrowDown':
      case 'Down':
        if (onArrowDown) {
          onArrowDown(event)
          handled = true
        }
        break
      case 'ArrowLeft':
      case 'Left':
        if (onArrowLeft) {
          onArrowLeft(event)
          handled = true
        }
        break
      case 'ArrowRight':
      case 'Right':
        if (onArrowRight) {
          onArrowRight(event)
          handled = true
        }
        break
      case 'Tab':
        if (onTab) {
          onTab(event)
          handled = true
        }
        break
      case 'Home':
        if (onHome) {
          onHome(event)
          handled = true
        }
        break
      case 'End':
        if (onEnd) {
          onEnd(event)
          handled = true
        }
        break
    }

    if (handled) {
      if (preventDefault) {
        event.preventDefault()
      }
      if (stopPropagation) {
        event.stopPropagation()
      }
    }
  }
}

/**
 * Roving tabindex manager for keyboard navigation in lists/grids.
 * Only one item is focusable at a time (tabindex="0"), others are tabindex="-1".
 *
 * @param items - Array of elements to manage
 * @param activeIndex - Currently active item index
 * @returns Functions to navigate and update the roving tabindex
 */
export function createRovingTabIndex(items: HTMLElement[], activeIndex: number = 0) {
  const updateTabIndex = (newIndex: number) => {
    items.forEach((item, index) => {
      if (index === newIndex) {
        item.tabIndex = 0
        item.focus()
      } else {
        item.tabIndex = -1
      }
    })
  }

  const moveToNext = () => {
    const newIndex = (activeIndex + 1) % items.length
    updateTabIndex(newIndex)
    return newIndex
  }

  const moveToPrevious = () => {
    const newIndex = (activeIndex - 1 + items.length) % items.length
    updateTabIndex(newIndex)
    return newIndex
  }

  const moveToFirst = () => {
    updateTabIndex(0)
    return 0
  }

  const moveToLast = () => {
    const newIndex = items.length - 1
    updateTabIndex(newIndex)
    return newIndex
  }

  const moveTo = (index: number) => {
    if (index >= 0 && index < items.length) {
      updateTabIndex(index)
      return index
    }
    return activeIndex
  }

  // Initialize
  updateTabIndex(activeIndex)

  return {
    moveToNext,
    moveToPrevious,
    moveToFirst,
    moveToLast,
    moveTo,
    updateTabIndex,
  }
}

// ============================================================================
// Color Contrast
// ============================================================================

/**
 * Converts hex color to RGB values.
 *
 * @param hex - Hex color string (#RGB or #RRGGBB)
 * @returns RGB values [r, g, b] or null if invalid
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    // Try short form
    const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex)
    if (!shortResult) return null
    return [
      parseInt(shortResult[1] + shortResult[1], 16),
      parseInt(shortResult[2] + shortResult[2], 16),
      parseInt(shortResult[3] + shortResult[3], 16),
    ]
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
}

/**
 * Calculates relative luminance of a color.
 * Used for WCAG contrast ratio calculations.
 *
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Relative luminance (0-1)
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculates WCAG 2.2 contrast ratio between two colors.
 * Returns a value between 1:1 (no contrast) and 21:1 (maximum contrast).
 *
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns Contrast ratio or null if colors are invalid
 *
 * @example
 * ```ts
 * const ratio = getContrastRatio('#000000', '#FFFFFF') // 21
 * const ratio = getContrastRatio('#767676', '#FFFFFF') // 4.54
 * ```
 */
export function getContrastRatio(foreground: string, background: string): number | null {
  const fgRgb = hexToRgb(foreground)
  const bgRgb = hexToRgb(background)

  if (!fgRgb || !bgRgb) return null

  const fgLum = getRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2])
  const bgLum = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2])

  const lighter = Math.max(fgLum, bgLum)
  const darker = Math.min(fgLum, bgLum)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Checks if color combination meets WCAG contrast requirements.
 * Returns detailed results for AA/AAA compliance.
 *
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns Contrast result with compliance details
 *
 * @example
 * ```ts
 * const result = checkContrast('#000000', '#FFFFFF')
 * logger.debug('Log', { data: result.passesAA }) // true
 * logger.debug('Log', { data: result.ratio }) // 21
 * ```
 */
export function checkContrast(foreground: string, background: string): ContrastResult | null {
  const ratio = getContrastRatio(foreground, background)

  if (ratio === null) {
    return null
  }

  return {
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5, // Normal text AA: 4.5:1
    passesAAA: ratio >= 7, // Normal text AAA: 7:1
    passesAALarge: ratio >= 3, // Large text AA: 3:1
    passesAAALarge: ratio >= 4.5, // Large text AAA: 4.5:1
  }
}

// ============================================================================
// ARIA Helpers
// ============================================================================

/**
 * Generates a unique ID for ARIA relationships.
 * Useful for aria-labelledby, aria-describedby, etc.
 *
 * @param prefix - Prefix for the ID
 * @returns Unique ID string
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Creates ARIA label from text by removing extra whitespace and formatting.
 *
 * @param text - Text to convert to ARIA label
 * @returns Cleaned ARIA label
 */
export function sanitizeAriaLabel(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .trim()
}

/**
 * Gets appropriate ARIA role for map markers.
 *
 * @param type - Marker type
 * @returns ARIA role
 */
export function getMarkerAriaRole(type: 'button' | 'link' | 'marker'): string {
  switch (type) {
    case 'button':
      return 'button'
    case 'link':
      return 'link'
    case 'marker':
    default:
      return 'img' // Markers are visual indicators
  }
}

/**
 * Generates comprehensive ARIA label for map markers.
 *
 * @param name - Marker name
 * @param type - Marker type
 * @param status - Marker status
 * @param additionalInfo - Additional context
 * @returns Complete ARIA label
 */
export function generateMarkerAriaLabel(
  name: string,
  type: string,
  status?: string,
  additionalInfo?: string
): string {
  const parts = [name, type]
  if (status) parts.push(`Status: ${status}`)
  if (additionalInfo) parts.push(additionalInfo)
  return parts.join(', ')
}

// ============================================================================
// Exports
// ============================================================================

export default {
  screenReaderOnly,
  announceToScreenReader,
  createLiveRegion,
  getFocusableElements,
  createFocusTrap,
  moveFocusTo,
  createKeyboardHandler,
  createRovingTabIndex,
  getContrastRatio,
  checkContrast,
  generateAriaId,
  sanitizeAriaLabel,
  getMarkerAriaRole,
  generateMarkerAriaLabel,
}
