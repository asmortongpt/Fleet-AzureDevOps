/**
 * Accessibility Hooks
 *
 * Custom React hooks for implementing accessibility features:
 * - Focus management
 * - Keyboard navigation
 * - Screen reader announcements
 * - Focus trap for modals/dialogs
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * useFocusTrap Hook
 *
 * Traps focus within a container (useful for modals, dialogs, dropdowns)
 * Ensures keyboard users can't tab out of the container
 *
 * @param isActive - Whether the focus trap is active
 * @returns ref to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean = true) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element when activated
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * useKeyboardNavigation Hook
 *
 * Handles arrow key navigation in lists, grids, and menus
 *
 * @param itemCount - Total number of items
 * @param options - Configuration options
 * @returns current index and keyboard event handlers
 */
interface UseKeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'grid';
  loop?: boolean;
  gridColumns?: number;
  onSelect?: (index: number) => void;
}

export function useKeyboardNavigation(
  itemCount: number,
  options: UseKeyboardNavigationOptions = {}
) {
  const { orientation = 'vertical', loop = true, gridColumns = 1, onSelect } = options;
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (orientation === 'grid') {
            newIndex = currentIndex + gridColumns;
          } else if (orientation === 'vertical') {
            newIndex = currentIndex + 1;
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (orientation === 'grid') {
            newIndex = currentIndex - gridColumns;
          } else if (orientation === 'vertical') {
            newIndex = currentIndex - 1;
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = currentIndex + 1;
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (orientation === 'horizontal' || orientation === 'grid') {
            newIndex = currentIndex - 1;
          }
          break;

        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect?.(currentIndex);
          return;

        default:
          return;
      }

      // Handle wrapping
      if (loop) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(itemCount - 1, newIndex));
      }

      setCurrentIndex(newIndex);
    },
    [currentIndex, itemCount, orientation, loop, gridColumns, onSelect]
  );

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown,
  };
}

/**
 * useAriaAnnouncer Hook
 *
 * Creates a live region for screen reader announcements
 * Useful for dynamic content updates, notifications, etc.
 *
 * @param politeness - ARIA live region politeness level
 * @returns announce function
 */
export function useAriaAnnouncer(politeness: 'polite' | 'assertive' = 'polite') {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create live region if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', politeness);
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, [politeness]);

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      // Clear and re-announce to trigger screen readers
      announcerRef.current.textContent = '';
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  }, []);

  return announce;
}

/**
 * useReducedMotion Hook
 *
 * Detects user's motion preferences
 * Respects prefers-reduced-motion media query
 *
 * @returns whether user prefers reduced motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * useFocusVisible Hook
 *
 * Manages focus-visible state (only show focus indicators for keyboard navigation)
 *
 * @returns whether focus should be visible
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const hadKeyboardEvent = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only keyboard events that would trigger navigation
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ') {
        hadKeyboardEvent.current = true;
      }
    };

    const handlePointerDown = () => {
      hadKeyboardEvent.current = false;
    };

    const handleFocus = () => {
      setIsFocusVisible(hadKeyboardEvent.current);
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('focus', handleFocus, true);
    window.addEventListener('blur', handleBlur, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('focus', handleFocus, true);
      window.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
}

/**
 * useSkipLinks Hook
 *
 * Manages skip navigation links for keyboard users
 *
 * @param targets - Skip link targets { label: string; id: string }[]
 */
export function useSkipLinks(targets: Array<{ label: string; id: string }>) {
  const skipToContent = useCallback((targetId: string) => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      // Remove tabindex after focus to restore normal tab order
      target.addEventListener(
        'blur',
        () => {
          target.removeAttribute('tabindex');
        },
        { once: true }
      );
    }
  }, []);

  return { skipToContent, targets };
}

/**
 * useAccessibilityContext Hook
 *
 * Provides global accessibility context and utilities
 */
export function useAccessibility() {
  const announce = useAriaAnnouncer();
  const prefersReducedMotion = useReducedMotion();

  return {
    announce,
    prefersReducedMotion,
    // Add more accessibility utilities here
  };
}
