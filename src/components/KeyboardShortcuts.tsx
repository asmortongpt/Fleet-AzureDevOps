import { useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';

interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

interface KeyboardShortcutsProps {
  children?: ReactNode;
}

export function KeyboardShortcuts({ children }: KeyboardShortcutsProps) {
  const navigate = useNavigate();
  const {
    toggleSidebar,
    openCommandPalette,
    toggleSettings,
    clearSelections,
  } = useAppStore();

  // Define all keyboard shortcuts
  const shortcuts: Shortcut[] = [
    // Navigation
    {
      key: 'd',
      altKey: true,
      description: 'Go to Dashboard',
      action: () => {
        navigate('/');
        toast.info('Navigated to Dashboard');
      },
      preventDefault: true,
    },
    {
      key: 'g',
      altKey: true,
      description: 'Go to GPS Tracking',
      action: () => {
        navigate('/gps-tracking');
        toast.info('Navigated to GPS Tracking');
      },
      preventDefault: true,
    },
    {
      key: 'v',
      altKey: true,
      description: 'Go to Vehicles',
      action: () => {
        navigate('/vehicles');
        toast.info('Navigated to Vehicles');
      },
      preventDefault: true,
    },
    {
      key: 'm',
      altKey: true,
      description: 'Go to Maintenance',
      action: () => {
        navigate('/maintenance');
        toast.info('Navigated to Maintenance');
      },
      preventDefault: true,
    },

    // UI Actions
    {
      key: 'b',
      ctrlKey: true,
      description: 'Toggle Sidebar',
      action: () => {
        toggleSidebar();
        toast.info('Sidebar toggled');
      },
      preventDefault: true,
    },
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open Command Palette',
      action: () => {
        openCommandPalette();
      },
      preventDefault: true,
    },
    {
      key: 'k',
      metaKey: true, // For Mac users
      description: 'Open Command Palette (Mac)',
      action: () => {
        openCommandPalette();
      },
      preventDefault: true,
    },
    {
      key: ',',
      ctrlKey: true,
      description: 'Open Settings',
      action: () => {
        toggleSettings();
      },
      preventDefault: true,
    },
    {
      key: 'Escape',
      description: 'Clear Selections',
      action: () => {
        clearSelections();
      },
    },

    // Search
    {
      key: 'f',
      ctrlKey: true,
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector(
          'input[type="search"], input[placeholder*="search" i]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
          toast.info('Search focused');
        }
      },
      preventDefault: true,
    },

    // Refresh
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      description: 'Hard Refresh Data',
      action: () => {
        window.location.reload();
      },
      preventDefault: true,
    },

    // Help
    {
      key: '?',
      shiftKey: true,
      description: 'Show Keyboard Shortcuts',
      action: () => {
        showShortcutsHelp();
      },
      preventDefault: true,
    },

    // Quick Add
    {
      key: 'n',
      ctrlKey: true,
      description: 'Add New Vehicle',
      action: () => {
        // Trigger add vehicle dialog
        const event = new CustomEvent('open-add-vehicle-dialog');
        window.dispatchEvent(event);
        toast.info('Add Vehicle dialog opened');
      },
      preventDefault: true,
    },

    // Print
    {
      key: 'p',
      ctrlKey: true,
      description: 'Print Current View',
      action: () => {
        window.print();
      },
      preventDefault: true,
    },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Ctrl+K even in inputs (for command palette)
        if (
          !(
            event.key === 'k' &&
            (event.ctrlKey || event.metaKey)
          )
        ) {
          return;
        }
      }

      // Find matching shortcut
      const matchedShortcut = shortcuts.find((shortcut) => {
        return (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.metaKey === !!shortcut.metaKey
        );
      });

      if (matchedShortcut) {
        if (matchedShortcut.preventDefault) {
          event.preventDefault();
        }
        matchedShortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return <>{children}</>;
}

// Helper function to show shortcuts help
function showShortcutsHelp() {
  const shortcuts = [
    { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
    { keys: ['Alt', 'G'], description: 'Go to GPS Tracking' },
    { keys: ['Alt', 'V'], description: 'Go to Vehicles' },
    { keys: ['Alt', 'M'], description: 'Go to Maintenance' },
    { keys: ['Ctrl', 'B'], description: 'Toggle Sidebar' },
    { keys: ['Ctrl', 'K'], description: 'Open Command Palette' },
    { keys: ['Ctrl', ','], description: 'Open Settings' },
    { keys: ['Ctrl', 'F'], description: 'Focus Search' },
    { keys: ['Ctrl', 'N'], description: 'Add New Vehicle' },
    { keys: ['Ctrl', 'P'], description: 'Print' },
    { keys: ['Esc'], description: 'Clear Selections' },
    { keys: ['?'], description: 'Show This Help' },
  ];

  const helpHtml = `
    <div style="max-width: 500px;">
      <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Keyboard Shortcuts</h2>
      <div style="display: grid; gap: 0.75rem;">
        ${shortcuts
          .map(
            ({ keys, description }) => `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; gap: 0.25rem;">
              ${keys
                .map(
                  (key) => `
                <kbd style="
                  padding: 0.25rem 0.5rem;
                  background: #f3f4f6;
                  border: 1px solid #d1d5db;
                  border-radius: 0.25rem;
                  font-family: monospace;
                  font-size: 0.875rem;
                ">${key}</kbd>
              `
                )
                .join('<span style="margin: 0 0.25rem;">+</span>')}
            </div>
            <span style="color: #6b7280; font-size: 0.875rem;">${description}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  // Create and show modal
  const modal = document.createElement('div');
  modal.innerHTML = helpHtml;
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 10000;
  `;

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `;

  const closeModal = () => {
    document.body.removeChild(modal);
    document.body.removeChild(overlay);
  };

  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  }, { once: true });

  document.body.appendChild(overlay);
  document.body.appendChild(modal);
}

// Hook for registering component-specific shortcuts
export function useKeyboardShortcut(
  shortcut: Omit<Shortcut, 'description'>,
  description: string
) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!event.ctrlKey === !!shortcut.ctrlKey &&
        !!event.shiftKey === !!shortcut.shiftKey &&
        !!event.altKey === !!shortcut.altKey &&
        !!event.metaKey === !!shortcut.metaKey
      ) {
        if (shortcut.preventDefault) {
          event.preventDefault();
        }
        shortcut.action();
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [shortcut, description]);
}
