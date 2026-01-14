/**
 * ActionToast - Success Feedback with Actions
 *
 * Enhanced toast notifications that include actionable buttons,
 * allowing users to immediately act on the result of an operation.
 *
 * Features:
 * - Success/Warning/Error variants
 * - Primary and secondary action buttons
 * - Auto-dismiss with progress indicator
 * - Undo functionality
 * - Icon support
 *
 * Created: 2026-01-08
 */

import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'warning' | 'error' | 'info'

interface ActionToastProps {
  variant?: ToastVariant
  title: string
  message?: string
  primaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  duration?: number // Auto-dismiss duration in ms (default: 5000)
  onDismiss?: () => void
}

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
}

function ActionToastContent({
  variant = 'success',
  title,
  message,
  primaryAction,
  secondaryAction,
  duration = 5000,
  onDismiss,
  toastId,
}: ActionToastProps & { toastId: string }) {
  const [progress, setProgress] = useState(100)
  const styles = VARIANT_STYLES[variant]
  const Icon = styles.icon

  useEffect(() => {
    if (duration > 0) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100))
          if (newProgress <= 0) {
            clearInterval(interval)
            toast.dismiss(toastId)
            return 0
          }
          return newProgress
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [duration, toastId])

  const handleDismiss = () => {
    toast.dismiss(toastId)
    onDismiss?.()
  }

  return (
    <div
      className={cn(
        'relative flex flex-col gap-3 p-4 rounded-lg border shadow-lg',
        'min-w-[320px] max-w-[420px]',
        styles.bgColor,
        styles.borderColor
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', styles.iconColor)} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">{title}</h3>
          {message && (
            <p className="text-xs text-muted-foreground mt-1">{message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2 ml-8">
          {primaryAction && (
            <Button
              size="sm"
              onClick={() => {
                primaryAction.onClick()
                handleDismiss()
              }}
              className="h-8 text-xs"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                secondaryAction.onClick()
                handleDismiss()
              }}
              className="h-8 text-xs"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10 rounded-b-lg overflow-hidden">
          <div
            className={cn(
              'h-full transition-all ease-linear',
              variant === 'success' && 'bg-green-500',
              variant === 'warning' && 'bg-amber-500',
              variant === 'error' && 'bg-red-500',
              variant === 'info' && 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

/**
 * Show a success toast with actions
 *
 * @example
 * showSuccessToast({
 *   title: "Damage report created!",
 *   message: "DR-12345 has been saved successfully.",
 *   primaryAction: {
 *     label: "View Report",
 *     onClick: () => navigate('/damage-reports/12345'),
 *     icon: <ExternalLink className="h-3 w-3 mr-1" />
 *   },
 *   secondaryAction: {
 *     label: "Create Another",
 *     onClick: () => resetForm()
 *   }
 * })
 */
export function showSuccessToast(props: Omit<ActionToastProps, 'variant'>) {
  return toast.custom(
    (t) => <ActionToastContent {...props} variant="success" toastId={t.id} />,
    { duration: props.duration || 5000 }
  )
}

/**
 * Show a warning toast with actions
 *
 * @example
 * showWarningToast({
 *   title: "Incomplete data",
 *   message: "Some optional fields are empty. Continue anyway?",
 *   primaryAction: {
 *     label: "Submit Anyway",
 *     onClick: () => forceSubmit()
 *   },
 *   secondaryAction: {
 *     label: "Review",
 *     onClick: () => scrollToEmptyFields()
 *   }
 * })
 */
export function showWarningToast(props: Omit<ActionToastProps, 'variant'>) {
  return toast.custom(
    (t) => <ActionToastContent {...props} variant="warning" toastId={t.id} />,
    { duration: props.duration || 7000 }
  )
}

/**
 * Show an error toast with actions
 *
 * @example
 * showErrorToast({
 *   title: "Failed to save",
 *   message: "Network error occurred. Your data has been saved locally.",
 *   primaryAction: {
 *     label: "Retry",
 *     onClick: () => retrySubmit()
 *   },
 *   secondaryAction: {
 *     label: "Save Draft",
 *     onClick: () => saveDraft()
 *   }
 * })
 */
export function showErrorToast(props: Omit<ActionToastProps, 'variant'>) {
  return toast.custom(
    (t) => <ActionToastContent {...props} variant="error" toastId={t.id} />,
    { duration: props.duration || 10000 } // Errors stay longer
  )
}

/**
 * Show an info toast with actions
 *
 * @example
 * showInfoToast({
 *   title: "3D model generation started",
 *   message: "This may take 2-3 minutes. We'll notify you when ready.",
 *   primaryAction: {
 *     label: "View Progress",
 *     onClick: () => navigate('/3d-models/status')
 *   }
 * })
 */
export function showInfoToast(props: Omit<ActionToastProps, 'variant'>) {
  return toast.custom(
    (t) => <ActionToastContent {...props} variant="info" toastId={t.id} />,
    { duration: props.duration || 5000 }
  )
}

/**
 * Show an undo toast - special success toast with undo action
 *
 * @example
 * showUndoToast({
 *   title: "Damage report deleted",
 *   onUndo: () => restoreDamageReport(reportId)
 * })
 */
export function showUndoToast({
  title,
  onUndo,
  duration = 5000,
}: {
  title: string
  onUndo: () => void
  duration?: number
}) {
  return showSuccessToast({
    title,
    message: 'This action can be undone.',
    primaryAction: {
      label: 'Undo',
      onClick: onUndo,
    },
    duration,
  })
}
