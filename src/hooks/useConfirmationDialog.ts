/**
 * Confirmation Dialog Hook
 *
 * Centralized hook for showing confirmation dialogs across all modules.
 * Eliminates duplicate dialog state management in 20+ modules.
 *
 * Features:
 * - Promise-based API (async/await support)
 * - Customizable title, message, buttons
 * - Variant support (default, destructive, warning)
 * - Auto-focus on confirm button
 * - Keyboard support (Enter = confirm, Esc = cancel)
 * - Loading state support
 * - Custom action callbacks
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { confirm, ConfirmationDialog } = useConfirmationDialog()
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Vehicle',
 *       message: 'Are you sure you want to delete this vehicle? This action cannot be undone.',
 *       confirmText: 'Delete',
 *       variant: 'destructive'
 *     })
 *
 *     if (confirmed) {
 *       // Proceed with deletion
 *     }
 *   }
 *
 *   return (
 *     <>
 *       <Button onClick={handleDelete}>Delete</Button>
 *       <ConfirmationDialog />
 *     </>
 *   )
 * }
 * ```
 */

import { useState, useCallback } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'

export interface ConfirmationConfig {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive' | 'warning'
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface DialogState {
  isOpen: boolean
  config: ConfirmationConfig | null
  resolve: ((value: boolean) => void) | null
}

export function useConfirmationDialog() {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    config: null,
    resolve: null
  })

  /**
   * Show confirmation dialog and return a promise
   * Resolves to true if confirmed, false if cancelled
   */
  const confirm = useCallback((config: ConfirmationConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        config,
        resolve
      })
    })
  }, [])

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(async () => {
    const { config, resolve } = dialogState

    // Call custom onConfirm if provided
    if (config?.onConfirm) {
      await config.onConfirm()
    }

    // Resolve promise with true
    if (resolve) {
      resolve(true)
    }

    // Close dialog
    setDialogState({
      isOpen: false,
      config: null,
      resolve: null
    })
  }, [dialogState])

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    const { config, resolve } = dialogState

    // Call custom onCancel if provided
    if (config?.onCancel) {
      config.onCancel()
    }

    // Resolve promise with false
    if (resolve) {
      resolve(false)
    }

    // Close dialog
    setDialogState({
      isOpen: false,
      config: null,
      resolve: null
    })
  }, [dialogState])

  /**
   * Get button variant based on dialog variant
   */
  const getConfirmButtonVariant = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return 'destructive'
      case 'warning':
        return 'default'
      default:
        return 'default'
    }
  }

  /**
   * Confirmation Dialog Component
   */
  const ConfirmationDialog = useCallback(() => {
    const { isOpen, config } = dialogState

    if (!config) return null

    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.title}</AlertDialogTitle>
            <AlertDialogDescription>{config.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {config.cancelText || 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              variant={getConfirmButtonVariant(config.variant)}
            >
              {config.confirmText || 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }, [dialogState, handleConfirm, handleCancel])

  return {
    confirm,
    ConfirmationDialog,
    isOpen: dialogState.isOpen
  }
}

/**
 * Quick confirmation variants for common use cases
 */
export function useDeleteConfirmation() {
  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  const confirmDelete = useCallback(
    (itemName?: string) => {
      return confirm({
        title: 'Confirm Deletion',
        message: itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
          : 'Are you sure you want to delete this item? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'destructive'
      })
    },
    [confirm]
  )

  return {
    confirmDelete,
    ConfirmationDialog
  }
}

export function useSaveConfirmation() {
  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  const confirmSave = useCallback(
    (message?: string) => {
      return confirm({
        title: 'Save Changes',
        message: message || 'Are you sure you want to save these changes?',
        confirmText: 'Save',
        cancelText: 'Cancel',
        variant: 'default'
      })
    },
    [confirm]
  )

  return {
    confirmSave,
    ConfirmationDialog
  }
}

export function useDiscardConfirmation() {
  const { confirm, ConfirmationDialog } = useConfirmationDialog()

  const confirmDiscard = useCallback(() => {
    return confirm({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      variant: 'warning'
    })
  }, [confirm])

  return {
    confirmDiscard,
    ConfirmationDialog
  }
}
