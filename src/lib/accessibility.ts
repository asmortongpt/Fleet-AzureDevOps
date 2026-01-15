/**
 * Accessibility Utilities - WCAG AAA Compliance
 *
 * Features:
 * - ARIA attribute helpers
 * - Focus management utilities
 * - Keyboard navigation helpers
 * - Screen reader announcements
 * - Color contrast validation
 * - Skip navigation
 */

import { useEffect, useRef, useState } from 'react';

/**
 * ARIA Live Region Types
 */
export type AriaLive = 'off' | 'polite' | 'assertive';

/**
 * Keyboard Key Constants
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Focus Trap Hook
 * Traps focus within a container (for modals, dialogs)
 */
export function useFocusTrap(isActive: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== KeyboardKeys.TAB) return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Focus Lock Hook
 * Saves and restores focus when component unmounts
 */
export function useFocusLock() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  return previousFocusRef;
}

/**
 * Screen Reader Announcement Hook
 */
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('');
  const [ariaLive, setAriaLive] = useState<AriaLive>('polite');

  const announce = (message: string, priority: AriaLive = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAriaLive(priority);
      setAnnouncement(message);
    }, 100);
  };

  return { announcement, ariaLive, announce };
}

/**
 * Skip Navigation Links Component Data
 */
export const skipLinks = [
  { id: 'main-content', label: 'Skip to main content' },
  { id: 'navigation', label: 'Skip to navigation' },
  { id: 'footer', label: 'Skip to footer' },
];

/**
 * ARIA Attributes Generator
 */
export const aria = {
  /**
   * Generate ARIA attributes for a button
   */
  button: (props: {
    label: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
    describedBy?: string;
  }) => ({
    'aria-label': props.label,
    ...(props.expanded !== undefined && { 'aria-expanded': props.expanded }),
    ...(props.pressed !== undefined && { 'aria-pressed': props.pressed }),
    ...(props.disabled && { 'aria-disabled': true }),
    ...(props.describedBy && { 'aria-describedby': props.describedBy }),
  }),

  /**
   * Generate ARIA attributes for a link
   */
  link: (props: {
    label?: string;
    current?: boolean;
    external?: boolean;
  }) => ({
    ...(props.label && { 'aria-label': props.label }),
    ...(props.current && { 'aria-current': 'page' }),
    ...(props.external && { 'aria-label': `${props.label} (opens in new tab)` }),
  }),

  /**
   * Generate ARIA attributes for a dialog/modal
   */
  dialog: (props: {
    label: string;
    describedBy?: string;
    modal?: boolean;
  }) => ({
    role: 'dialog',
    'aria-label': props.label,
    'aria-modal': props.modal ?? true,
    ...(props.describedBy && { 'aria-describedby': props.describedBy }),
  }),

  /**
   * Generate ARIA attributes for a tab
   */
  tab: (props: {
    label: string;
    selected: boolean;
    controls: string;
  }) => ({
    role: 'tab',
    'aria-label': props.label,
    'aria-selected': props.selected,
    'aria-controls': props.controls,
    tabIndex: props.selected ? 0 : -1,
  }),

  /**
   * Generate ARIA attributes for a tabpanel
   */
  tabPanel: (props: {
    label: string;
    labelledBy: string;
  }) => ({
    role: 'tabpanel',
    'aria-label': props.label,
    'aria-labelledby': props.labelledBy,
    tabIndex: 0,
  }),

  /**
   * Generate ARIA attributes for a combobox
   */
  combobox: (props: {
    label: string;
    expanded: boolean;
    activeDescendant?: string;
    controls: string;
  }) => ({
    role: 'combobox',
    'aria-label': props.label,
    'aria-expanded': props.expanded,
    'aria-controls': props.controls,
    'aria-autocomplete': 'list' as const,
    ...(props.activeDescendant && { 'aria-activedescendant': props.activeDescendant }),
  }),

  /**
   * Generate ARIA attributes for a listbox
   */
  listbox: (props: {
    label: string;
    multiselectable?: boolean;
  }) => ({
    role: 'listbox',
    'aria-label': props.label,
    ...(props.multiselectable && { 'aria-multiselectable': true }),
  }),

  /**
   * Generate ARIA attributes for a status message
   */
  status: (props: {
    live?: AriaLive;
    atomic?: boolean;
  }) => ({
    role: 'status',
    'aria-live': props.live ?? 'polite',
    'aria-atomic': props.atomic ?? true,
  }),

  /**
   * Generate ARIA attributes for an alert
   */
  alert: (props: {
    live?: AriaLive;
  }) => ({
    role: 'alert',
    'aria-live': props.live ?? 'assertive',
    'aria-atomic': true,
  }),
};

/**
 * Keyboard Navigation Handler
 */
export function handleKeyboardNavigation(
  e: React.KeyboardEvent,
  handlers: {
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onHome?: () => void;
    onEnd?: () => void;
  }
) {
  const { key } = e;

  switch (key) {
    case KeyboardKeys.ENTER:
      handlers.onEnter?.();
      break;
    case KeyboardKeys.SPACE:
      e.preventDefault();
      handlers.onSpace?.();
      break;
    case KeyboardKeys.ESCAPE:
      handlers.onEscape?.();
      break;
    case KeyboardKeys.ARROW_UP:
      e.preventDefault();
      handlers.onArrowUp?.();
      break;
    case KeyboardKeys.ARROW_DOWN:
      e.preventDefault();
      handlers.onArrowDown?.();
      break;
    case KeyboardKeys.ARROW_LEFT:
      handlers.onArrowLeft?.();
      break;
    case KeyboardKeys.ARROW_RIGHT:
      handlers.onArrowRight?.();
      break;
    case KeyboardKeys.HOME:
      e.preventDefault();
      handlers.onHome?.();
      break;
    case KeyboardKeys.END:
      e.preventDefault();
      handlers.onEnd?.();
      break;
  }
}

/**
 * Color Contrast Checker (WCAG AAA)
 * AAA requires 7:1 for normal text, 4.5:1 for large text
 */
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; wcagAAA: boolean; wcagAA: boolean } {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.replace('#', ''), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    wcagAAA: ratio >= 7,
    wcagAA: ratio >= 4.5,
  };
}

/**
 * Focus Visible Utility
 * Only show focus outline on keyboard navigation
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKeys.TAB) {
        setIsFocusVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsFocusVisible(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isFocusVisible;
}

/**
 * Accessible Form Field Props
 */
export function getAccessibleFieldProps(props: {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
}) {
  const errorId = props.error ? `${props.id}-error` : undefined;
  const descriptionId = props.description ? `${props.id}-description` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(' ');

  return {
    field: {
      id: props.id,
      'aria-invalid': !!props.error,
      'aria-required': props.required,
      'aria-disabled': props.disabled,
      ...(describedBy && { 'aria-describedby': describedBy }),
    },
    label: {
      htmlFor: props.id,
    },
    error: errorId ? { id: errorId, role: 'alert' as const } : undefined,
    description: descriptionId ? { id: descriptionId } : undefined,
  };
}

/**
 * Accessible Table Props
 */
export function getAccessibleTableProps(props: {
  caption: string;
  sortable?: boolean;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}) {
  return {
    table: {
      role: 'table',
      'aria-label': props.caption,
    },
    caption: {
      className: 'sr-only', // Screen reader only
    },
    columnHeader: (columnId: string) => ({
      role: 'columnheader',
      scope: 'col' as const,
      ...(props.sortable && {
        'aria-sort': props.sortColumn === columnId
          ? (props.sortDirection === 'asc' ? 'ascending' : 'descending')
          : 'none' as const,
      }),
    }),
    rowHeader: {
      role: 'rowheader',
      scope: 'row' as const,
    },
    cell: {
      role: 'cell',
    },
  };
}

/**
 * Live Region Component Props
 */
export interface LiveRegionProps {
  message: string;
  ariaLive?: AriaLive;
  ariaAtomic?: boolean;
  className?: string;
}

/**
 * Screen Reader Only CSS Class
 * (Define in global CSS)
 */
export const srOnlyClass = `
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;
