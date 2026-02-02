/**
 * InlineActions Components
 *
 * Shared action components for operations pages including buttons,
 * status badges, edit panels, and confirmation dialogs.
 */

import React from 'react';
import { X, PencilSimple, Check, Spinner } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================================================
// ActionButton
// ============================================================================

export interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
  loading = false,
  disabled = false,
}: ActionButtonProps) {
  const variantStyles = {
    default: 'bg-slate-700 hover:bg-slate-600 text-white',
    success: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-white',
    danger: 'bg-red-500 hover:bg-red-400 text-white',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="sm"
      className={cn(
        'flex items-center gap-2 font-semibold',
        variantStyles[variant]
      )}
    >
      {loading ? (
        <Spinner className="w-4 h-4 animate-spin" weight="bold" />
      ) : (
        <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
      )}
      <span>{label}</span>
    </Button>
  );
}

// ============================================================================
// StatusBadge
// ============================================================================

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function StatusBadge({ status, size = 'md', label }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-700',
      dot: 'bg-emerald-400',
      label: label || 'Active',
    },
    inactive: {
      bg: 'bg-slate-500/20',
      border: 'border-slate-500/50',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
      label: label || 'Inactive',
    },
    pending: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      label: label || 'Pending',
    },
    completed: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-700',
      dot: 'bg-blue-400',
      label: label || 'Completed',
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-400',
      dot: 'bg-red-400',
      label: label || 'Error',
    },
    warning: {
      bg: 'bg-orange-500/20',
      border: 'border-orange-500/50',
      text: 'text-orange-400',
      dot: 'bg-orange-400',
      label: label || 'Warning',
    },
  };

  const config = statusConfig[status];
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bg,
        config.border,
        config.text,
        sizeStyles[size]
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}

// ============================================================================
// InlineEditPanel
// ============================================================================

export interface InlineEditPanelProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  title?: string;
  isSaving?: boolean;
  canEdit?: boolean;
  children: React.ReactNode;
}

export function InlineEditPanel({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  title = 'Edit',
  isSaving = false,
  canEdit = true,
  children,
}: InlineEditPanelProps) {
  if (!isEditing && canEdit) {
    return (
      <Button
        onClick={onEdit}
        variant="outline"
        size="sm"
        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
      >
        <PencilSimple className="w-4 h-4" weight="bold" />
        <span className="ml-2">{title}</span>
      </Button>
    );
  }

  if (!isEditing) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <div className="flex items-center gap-2">
          <Button
            onClick={onCancel}
            variant="ghost"
            size="sm"
            className="text-slate-700 hover:text-white"
            disabled={isSaving}
          >
            <X className="w-4 h-4" weight="bold" />
          </Button>
        </div>
      </div>

      {children}

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-700/50">
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300"
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={onSave}
          size="sm"
          className="bg-cyan-500 hover:bg-cyan-400 text-white"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" weight="bold" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// ConfirmDialog
// ============================================================================

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmStyles = {
    default: 'bg-cyan-500 hover:bg-cyan-400 text-white',
    danger: 'bg-red-500 hover:bg-red-400 text-white',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-300 text-sm mb-6">{message}</p>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                  disabled={isLoading}
                >
                  {cancelLabel}
                </Button>
                <Button
                  onClick={onConfirm}
                  className={confirmStyles[variant]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="w-4 h-4 animate-spin mr-2" weight="bold" />
                      Processing...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
