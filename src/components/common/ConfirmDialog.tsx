/**
 * ConfirmDialog - Reusable confirmation dialog component
 *
 * A standardized confirmation dialog for destructive or important actions.
 * Prevents accidental deletions and ensures user intent.
 *
 * Features:
 * - Customizable variant (danger, warning, info)
 * - Icon support
 * - Async action handling with loading state
 * - Custom action button labels
 * - Optional checkbox for "I understand" confirmation
 *
 * Usage:
 * ```tsx
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Vehicle"
 *   description="Are you sure you want to delete this vehicle? This action cannot be undone."
 *   variant="danger"
 *   onConfirm={async () => {
 *     await deleteVehicle(id)
 *   }}
 * />
 * ```
 */

import { Warning, Info, CheckCircle } from "@phosphor-icons/react"
import { useState, ReactNode } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import logger from '@/utils/logger';
// ============================================================================
// TYPES
// ============================================================================

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "success"

export interface ConfirmDialogProps {
  /** Dialog open state */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Dialog description/warning message */
  description: string
  /** Visual variant */
  variant?: ConfirmDialogVariant
  /** Custom icon (overrides variant icon) */
  icon?: ReactNode
  /** Confirm button label */
  confirmLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Async confirm handler */
  onConfirm: () => void | Promise<void>
  /** Optional cancel handler */
  onCancel?: () => void
  /** Require checkbox confirmation for dangerous actions */
  requireConfirmation?: boolean
  /** Confirmation checkbox label */
  confirmationLabel?: string
  /** Disable confirm button (external control) */
  disabled?: boolean
}

// ============================================================================
// VARIANT CONFIGS
// ============================================================================

const VARIANT_CONFIG: Record<
  ConfirmDialogVariant,
  {
    icon: ReactNode
    iconColor: string
    confirmButtonVariant: "default" | "destructive" | "outline" | "secondary"
  }
> = {
  danger: {
    icon: <Warning className="w-6 h-6" />,
    iconColor: "text-red-600",
    confirmButtonVariant: "destructive"
  },
  warning: {
    icon: <Warning className="w-6 h-6" />,
    iconColor: "text-orange-600",
    confirmButtonVariant: "default"
  },
  info: {
    icon: <Info className="w-6 h-6" />,
    iconColor: "text-blue-600",
    confirmButtonVariant: "default"
  },
  success: {
    icon: <CheckCircle className="w-6 h-6" />,
    iconColor: "text-green-600",
    confirmButtonVariant: "default"
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "danger",
  icon,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  requireConfirmation = false,
  confirmationLabel = "I understand and want to proceed",
  disabled = false
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const config = VARIANT_CONFIG[variant]
  const displayIcon = icon || config.icon

  const handleConfirm = async () => {
    if (disabled) return
    if (requireConfirmation && !isConfirmed) return

    setIsLoading(true)
    try {
      await onConfirm()
      onOpenChange(false)
      setIsConfirmed(false) // Reset confirmation state
    } catch (error) {
      logger.error("Confirm action failed:", error)
      // Keep dialog open on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (isLoading) return
    onCancel?.()
    onOpenChange(false)
    setIsConfirmed(false) // Reset confirmation state
  }

  const isConfirmDisabled =
    disabled || isLoading || (requireConfirmation && !isConfirmed)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            {displayIcon && (
              <div className={`${config.iconColor} mt-1`}>
                {displayIcon}
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {/* Optional confirmation checkbox */}
        {requireConfirmation && (
          <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
            <Checkbox
              id="confirm-checkbox"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
            />
            <Label
              htmlFor="confirm-checkbox"
              className="text-sm font-normal cursor-pointer"
            >
              {confirmationLabel}
            </Label>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant={config.confirmButtonVariant}
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
