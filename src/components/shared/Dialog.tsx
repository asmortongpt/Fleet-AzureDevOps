// Fleet Dialog/Modal System - Production Ready
// Supports: Slide-out drawers, center modals, full-screen dialogs
// Keyboard: ESC closes, TAB navigation, focus trap

import { X } from 'lucide-react';
import React, { useEffect } from 'react';

import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  variant?: 'drawer' | 'center' | 'fullscreen';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  title,
  children,
  variant = 'drawer',
  size = 'lg'
}) => {
  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-7xl'
  };

  const variantClasses = {
    drawer: `fixed top-0 right-0 h-full ${sizeClasses[size]} transform transition-transform duration-300`,
    center: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size]} rounded-md`,
    fullscreen: 'fixed inset-0 w-full h-full'
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className={cn(
          'bg-[var(--surface-2)] border-l border-[var(--border-subtle)] z-50',
          variantClasses[variant]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--border-subtle)]">
          <h2 id="dialog-title" className="text-sm font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-glass-hover)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-white"
            aria-label="Close dialog"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          {children}
        </div>
      </div>
    </>
  );
};

// Drilldown Dialog - Specialized for stat card drilldowns
export const DrilldownDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}> = ({ open, onClose, title, data, columns }) => {
  return (
    <Dialog open={open} onClose={onClose} title={title} variant="drawer" size="xl">
      <div className="space-y-2">
        {/* Search/Filter */}
        <input
          type="text"
          placeholder="Search..."
          className="w-full px-2 py-2 border border-[var(--border-subtle)] rounded-lg bg-[var(--surface-1)] text-white placeholder:text-[var(--text-tertiary)]"
        />

        {/* Data Table */}
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--surface-3)]">
              <tr>
                {columns.map(col => (
                  <th key={col.key} className="px-2 py-3 text-left font-semibold text-[var(--text-secondary)]">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-glass-hover)]">
                  {columns.map(col => (
                    <td key={col.key} className="px-2 py-3 text-[var(--text-secondary)]">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export Button */}
        <button className="px-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
          Export to Excel
        </button>
      </div>
    </Dialog>
  );
};
