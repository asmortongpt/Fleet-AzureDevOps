/**
 * DialogForm - Reusable dialog form component
 *
 * A standardized dialog for create/edit forms with consistent layout,
 * validation support, and async submission handling.
 *
 * Features:
 * - Create/Edit modes
 * - Form field rendering
 * - Async submission with loading state
 * - Validation error display
 * - Auto-close on success
 * - Footer actions
 *
 * Usage:
 * ```tsx
 * <DialogForm
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Add Vehicle"
 *   mode="create"
 *   fields={[
 *     { name: 'make', label: 'Make', type: 'text', required: true },
 *     { name: 'model', label: 'Model', type: 'text', required: true },
 *     { name: 'year', label: 'Year', type: 'number', required: true }
 *   ]}
 *   onSubmit={async (values) => {
 *     await createVehicle(values)
 *   }}
 * />
 * ```
 */

import { useState, ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import logger from '@/utils/logger';
// ============================================================================
// TYPES
// ============================================================================

export type FieldType = "text" | "number" | "email" | "password" | "textarea" | "select" | "custom"

export interface SelectOption {
  label: string
  value: string
}

export interface FormField {
  /** Field name (key in form values) */
  name: string
  /** Display label */
  label: string
  /** Input type */
  type: FieldType
  /** Required field */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Default value */
  defaultValue?: any
  /** Options for select fields */
  options?: SelectOption[]
  /** Custom render function */
  render?: (value: any, onChange: (value: any) => void) => ReactNode
  /** Validation function */
  validate?: (value: any) => string | null
  /** Help text */
  helpText?: string
  /** Disabled state */
  disabled?: boolean
}

export interface DialogFormProps {
  /** Dialog open state */
  open: boolean
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void
  /** Dialog title */
  title: string
  /** Optional description */
  description?: string
  /** Form mode (affects button labels) */
  mode?: "create" | "edit"
  /** Form fields */
  fields: FormField[]
  /** Initial values (for edit mode) */
  initialValues?: Record<string, any>
  /** Submit handler */
  onSubmit: (values: Record<string, any>) => void | Promise<void>
  /** Submit button label (overrides default) */
  submitLabel?: string
  /** Cancel button label */
  cancelLabel?: string
  /** Show success toast on submit */
  showSuccessToast?: boolean
  /** Success toast message */
  successMessage?: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DialogForm({
  open,
  onOpenChange,
  title,
  description,
  mode = "create",
  fields,
  initialValues = {},
  onSubmit,
  submitLabel,
  cancelLabel = "Cancel",
  showSuccessToast = true,
  successMessage
}: DialogFormProps) {
  // Initialize form values
  const [values, setValues] = useState<Record<string, any>>(() => {
    const defaults: Record<string, any> = {}
    fields.forEach((field) => {
      defaults[field.name] =
        initialValues[field.name] ?? field.defaultValue ?? ""
    })
    return defaults
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      // Reset form on close
      const defaults: Record<string, any> = {}
      fields.forEach((field) => {
        defaults[field.name] = field.defaultValue ?? ""
      })
      setValues(defaults)
      setErrors({})
    } else if (mode === "edit" && initialValues) {
      // Load initial values for edit mode
      setValues({ ...initialValues })
    }
  }

  // Handle field change
  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
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

    fields.forEach((field) => {
      const value = values[field.name]

      // Required validation
      if (field.required && (value == null || value === "")) {
        newErrors[field.name] = `${field.label} is required`
      }

      // Custom validation
      if (field.validate && value != null && value !== "") {
        const error = field.validate(value)
        if (error) {
          newErrors[field.name] = error
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)

      if (showSuccessToast) {
        const message =
          successMessage ||
          (mode === "create"
            ? "Created successfully"
            : "Updated successfully")
        toast.success(message)
      }

      handleOpenChange(false)
    } catch (error) {
      logger.error("Form submission error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render field
  const renderField = (field: FormField) => {
    const value = values[field.name] ?? ""
    const error = errors[field.name]

    // Custom render
    if (field.render) {
      return (
        <div key={field.name}>
          {field.render(value, (newValue) => handleChange(field.name, newValue))}
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
      )
    }

    // Standard field rendering
    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label}
          {field.required && <span className="text-red-600 ml-1">*</span>}
        </Label>

        {field.type === "textarea" ? (
          <Textarea
            id={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled || isSubmitting}
            className={error ? "border-red-600" : ""}
          />
        ) : field.type === "select" ? (
          <Select
            value={value}
            onValueChange={(newValue) => handleChange(field.name, newValue)}
            disabled={field.disabled || isSubmitting}
          >
            <SelectTrigger id={field.name} className={error ? "border-red-600" : ""}>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={field.name}
            type={field.type}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled || isSubmitting}
            className={error ? "border-red-600" : ""}
          />
        )}

        {field.helpText && !error && (
          <p className="text-sm text-muted-foreground">{field.helpText}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="space-y-4 py-4">
            {fields.map(renderField)}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : submitLabel || (mode === "create" ? "Create" : "Save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
