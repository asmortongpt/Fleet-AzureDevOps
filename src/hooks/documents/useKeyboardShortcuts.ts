/**
 * Keyboard Shortcuts Hook
 * WCAG 2.1 AA compliant keyboard navigation
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled = true
) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcutsRef.current) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.handler();
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
}

/**
 * Document-specific keyboard shortcuts
 */
export function useDocumentKeyboardShortcuts(handlers: {
  onUpload?: () => void;
  onSearch?: () => void;
  onRefresh?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
  onViewToggle?: () => void;
  onHelp?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Upload
    ...(handlers.onUpload ? [{
      key: 'u',
      ctrl: true,
      description: 'Upload new document',
      handler: handlers.onUpload,
    }] : []),

    // Search
    ...(handlers.onSearch ? [{
      key: 'k',
      ctrl: true,
      description: 'Open search',
      handler: handlers.onSearch,
    }, {
      key: 'f',
      ctrl: true,
      description: 'Open search',
      handler: handlers.onSearch,
    }] : []),

    // Refresh
    ...(handlers.onRefresh ? [{
      key: 'r',
      ctrl: true,
      description: 'Refresh documents',
      handler: handlers.onRefresh,
    }] : []),

    // Select all
    ...(handlers.onSelectAll ? [{
      key: 'a',
      ctrl: true,
      description: 'Select all documents',
      handler: handlers.onSelectAll,
    }] : []),

    // Delete
    ...(handlers.onDelete ? [{
      key: 'Delete',
      description: 'Delete selected documents',
      handler: handlers.onDelete,
    }, {
      key: 'Backspace',
      ctrl: true,
      description: 'Delete selected documents',
      handler: handlers.onDelete,
    }] : []),

    // Escape
    ...(handlers.onEscape ? [{
      key: 'Escape',
      description: 'Clear selection / Close dialogs',
      handler: handlers.onEscape,
    }] : []),

    // View toggle
    ...(handlers.onViewToggle ? [{
      key: 'v',
      ctrl: true,
      description: 'Toggle view mode',
      handler: handlers.onViewToggle,
    }] : []),

    // Help
    ...(handlers.onHelp ? [{
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      handler: handlers.onHelp,
      preventDefault: false,
    }] : []),
  ];

  useKeyboardShortcuts(shortcuts);
}

/**
 * Viewer-specific keyboard shortcuts
 */
export function useViewerKeyboardShortcuts(handlers: {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // Zoom
    ...(handlers.onZoomIn ? [{
      key: '+',
      ctrl: true,
      description: 'Zoom in',
      handler: handlers.onZoomIn,
    }, {
      key: '=',
      ctrl: true,
      description: 'Zoom in',
      handler: handlers.onZoomIn,
    }] : []),

    ...(handlers.onZoomOut ? [{
      key: '-',
      ctrl: true,
      description: 'Zoom out',
      handler: handlers.onZoomOut,
    }] : []),

    ...(handlers.onZoomReset ? [{
      key: '0',
      ctrl: true,
      description: 'Reset zoom',
      handler: handlers.onZoomReset,
    }] : []),

    // Rotation
    ...(handlers.onRotateLeft ? [{
      key: '[',
      ctrl: true,
      description: 'Rotate left',
      handler: handlers.onRotateLeft,
    }] : []),

    ...(handlers.onRotateRight ? [{
      key: ']',
      ctrl: true,
      description: 'Rotate right',
      handler: handlers.onRotateRight,
    }] : []),

    // Navigation
    ...(handlers.onNextPage ? [{
      key: 'ArrowRight',
      description: 'Next page',
      handler: handlers.onNextPage,
    }, {
      key: 'PageDown',
      description: 'Next page',
      handler: handlers.onNextPage,
    }] : []),

    ...(handlers.onPrevPage ? [{
      key: 'ArrowLeft',
      description: 'Previous page',
      handler: handlers.onPrevPage,
    }, {
      key: 'PageUp',
      description: 'Previous page',
      handler: handlers.onPrevPage,
    }] : []),

    // Actions
    ...(handlers.onFullscreen ? [{
      key: 'f',
      description: 'Toggle fullscreen',
      handler: handlers.onFullscreen,
    }] : []),

    ...(handlers.onDownload ? [{
      key: 'd',
      ctrl: true,
      description: 'Download document',
      handler: handlers.onDownload,
    }] : []),

    ...(handlers.onClose ? [{
      key: 'Escape',
      description: 'Close viewer',
      handler: handlers.onClose,
    }] : []),
  ];

  useKeyboardShortcuts(shortcuts);
}
