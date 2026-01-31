/**
 * ViolationResolutionDialog - Resolve HOS violations
 *
 * Modal dialog for fleet managers and safety officers to resolve HOS violations.
 *
 * Features:
 * - Resolution notes input
 * - Corrective action documentation
 * - Resolution approval workflow
 * - CSRF-protected submission
 *
 * Usage:
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 * const [selectedViolation, setSelectedViolation] = useState<HOSViolation | null>(null)
 *
 * <ViolationResolutionDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   violation={selectedViolation}
 *   tenantId="tenant-uuid"
 * />
 * ```
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useViolationMutations, type HOSViolation } from '@/hooks/use-hos-data'
import logger from '@/utils/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface ViolationResolutionDialogProps {
  /** Dialog open state */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Violation to resolve */
  violation: HOSViolation | null
  /** Tenant ID for multi-tenant isolation */
  tenantId: string
  /** Callback on successful resolution */
  onSuccess?: () => void
}

interface FormValues {
  resolution_notes: string
  corrective_action: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ViolationResolutionDialog({
  open,
  onOpenChange,
  violation,
  tenantId,
  onSuccess
}: ViolationResolutionDialogProps) {
  // Form state
  const [values, setValues] = useState<FormValues>({
    resolution_notes: '',
    corrective_action: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mutation hook
  const { resolveViolation } = useViolationMutations()

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      setValues({
        resolution_notes: '',
        corrective_action: ''
      })
      setErrors({})
    }
  }

  // Handle field change
  const handleChange = (name: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!values.resolution_notes.trim()) {
      newErrors.resolution_notes = 'Resolution notes are required'
    }

    if (values.resolution_notes.trim().length < 10) {
      newErrors.resolution_notes = 'Please provide more detail (at least 10 characters)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!violation) {
      toast.error('No violation selected')
      return
    }

    if (!validate()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      await resolveViolation.mutateAsync({
        violationId: violation.id,
        resolution_notes: values.resolution_notes,
        corrective_action: values.corrective_action || undefined
      })

      toast.success('Violation resolved successfully')
      handleOpenChange(false)
      onSuccess?.()
    } catch (error) {
      logger.error('[Violation] Resolution error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to resolve violation')
    }
  }

  if (!violation) return null

  // Get severity variant
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'major':
        return 'warning'
      case 'minor':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolve HOS Violation
            </DialogTitle>
            <DialogDescription>
              Document the resolution and corrective actions for this violation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Violation Details */}
            <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={getSeverityVariant(violation.severity)}>
                  {violation.severity.toUpperCase()}
                </Badge>
                <Badge variant="outline">{violation.status}</Badge>
              </div>

              <div>
                <h4 className="font-medium">
                  {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{violation.description}</p>
              </div>

              {violation.regulation_reference && (
                <p className="text-xs text-muted-foreground">
                  <strong>Regulation:</strong> {violation.regulation_reference}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                <strong>Occurred:</strong>{' '}
                <time dateTime={violation.violation_datetime}>
                  {new Date(violation.violation_datetime).toLocaleString()}
                </time>
              </p>
            </div>

            {/* Resolution Notes */}
            <div className="space-y-2">
              <Label htmlFor="resolution_notes">
                Resolution Notes <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="resolution_notes"
                value={values.resolution_notes}
                onChange={(e) => handleChange('resolution_notes', e.target.value)}
                placeholder="Explain how this violation was addressed and resolved..."
                rows={4}
                className={`resize-none ${errors.resolution_notes ? 'border-red-600' : ''}`}
              />
              <p className="text-xs text-muted-foreground">
                Describe what happened, why the violation occurred, and how it was resolved
              </p>
              {errors.resolution_notes && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {errors.resolution_notes}
                </p>
              )}
            </div>

            {/* Corrective Action */}
            <div className="space-y-2">
              <Label htmlFor="corrective_action">Corrective Action Taken</Label>
              <Textarea
                id="corrective_action"
                value={values.corrective_action}
                onChange={(e) => handleChange('corrective_action', e.target.value)}
                placeholder="Optional: Describe any corrective actions or preventive measures implemented..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Document any steps taken to prevent similar violations in the future
              </p>
            </div>

            {/* Warning for critical violations */}
            {violation.severity === 'critical' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Critical Violation Resolution</p>
                    <p className="text-xs mt-1">
                      This is a critical DOT violation. Ensure all corrective actions are
                      documented and driver training is completed if required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={resolveViolation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={resolveViolation.isPending}>
              {resolveViolation.isPending ? 'Resolving...' : 'Mark as Resolved'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
