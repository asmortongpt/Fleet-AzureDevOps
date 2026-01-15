import { Check, AlertCircle, Info } from "lucide-react"
import { useState, useEffect, ComponentProps } from "react"

import { Input } from "./input"

import { cn } from "@/lib/utils"


interface FormFieldProps extends Omit<ComponentProps<"input">, "onChange"> {
  label: string
  name: string
  error?: string
  hint?: string
  validate?: (value: string) => string | null
  validateOnChange?: boolean
  debounce?: number
  showValidIcon?: boolean
  onChange?: (value: string) => void
}

export function FormField({
  label,
  name,
  error: externalError,
  hint,
  validate,
  validateOnChange = false,
  debounce = 500,
  showValidIcon = true,
  onChange,
  className,
  required,
  ...props
}: FormFieldProps) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (!validateOnChange || !validate || !touched) return

    const timeoutId = setTimeout(() => {
      setIsValidating(true)
      const validationError = validate(value)
      setError(validationError)
      setIsValid(!validationError && value.length > 0)
      setIsValidating(false)
    }, debounce)

    return () => clearTimeout(timeoutId)
  }, [value, validate, validateOnChange, touched, debounce])

  useEffect(() => {
    if (externalError) {
      setError(externalError)
      setIsValid(false)
    }
  }, [externalError])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    setTouched(true)
    onChange?.(newValue)
  }

  const handleBlur = () => {
    setTouched(true)
    if (validate && !validateOnChange) {
      const validationError = validate(value)
      setError(validationError)
      setIsValid(!validationError && value.length > 0)
    }
  }

  const showError = touched && error
  const showSuccess = touched && isValid && showValidIcon && !isValidating

  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      <div className="relative">
        <Input
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "pr-10 transition-colors",
            showError && "border-destructive focus-visible:ring-destructive/20",
            showSuccess && "border-success focus-visible:ring-success/20",
            className
          )}
          aria-invalid={!!showError}
          aria-describedby={
            showError
              ? `${name}-error`
              : hint
                ? `${name}-hint`
                : undefined
          }
          required={required}
          {...props}
        />

        {/* Validation Icon */}
        {(showError || showSuccess) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {showError && (
              <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
            )}
            {showSuccess && (
              <Check className="w-4 h-4 text-success" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* Hint Text */}
      {hint && !showError && (
        <div id={`${name}-hint`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{hint}</span>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div
          id={`${name}-error`}
          className="flex items-start gap-1.5 text-xs text-destructive"
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
