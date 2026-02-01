/**
 * ValidationIndicator - Real-time Input Validation Feedback
 *
 * Provides instant visual feedback as users type, showing validation
 * status with helpful messages and icons.
 *
 * Features:
 * - Success/Warning/Error states
 * - Loading state for async validation
 * - Character count with limits
 * - Debounced validation
 * - Accessible ARIA labels
 *
 * Created: 2026-01-08
 */

import { Check, X, AlertCircle, Loader2 } from 'lucide-react'
import React from 'react'

import { cn } from '@/lib/utils'

export type ValidationState = 'idle' | 'validating' | 'success' | 'warning' | 'error'

interface ValidationIndicatorProps {
  state: ValidationState
  message?: string
  characterCount?: number
  characterLimit?: number
  showCharacterCount?: boolean
  className?: string
}

const STATE_STYLES = {
  idle: {
    icon: null,
    iconColor: '',
    textColor: 'text-muted-foreground',
  },
  validating: {
    icon: Loader2,
    iconColor: 'text-blue-800 animate-spin',
    textColor: 'text-blue-800 dark:text-blue-400',
  },
  success: {
    icon: Check,
    iconColor: 'text-green-500',
    textColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    icon: X,
    iconColor: 'text-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  },
}

/**
 * ValidationIndicator - Shows real-time validation feedback
 *
 * @example
 * <FormFieldWithHelp label="Email">
 *   <Input
 *     value={email}
 *     onChange={(e) => validateEmail(e.target.value)}
 *   />
 *   <ValidationIndicator
 *     state={emailValidationState}
 *     message={emailValidationMessage}
 *   />
 * </FormFieldWithHelp>
 */
export function ValidationIndicator({
  state,
  message,
  characterCount,
  characterLimit,
  showCharacterCount = false,
  className,
}: ValidationIndicatorProps) {
  const styles = STATE_STYLES[state]
  const Icon = styles.icon

  // Don't show anything if idle and no character count
  if (state === 'idle' && !showCharacterCount) {
    return null
  }

  const isNearLimit =
    characterLimit &&
    characterCount &&
    characterCount > characterLimit * 0.8

  const isOverLimit = characterLimit && characterCount && characterCount > characterLimit

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 mt-1 text-xs',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Validation Message */}
      {message && (
        <div className={cn('flex items-center gap-1.5', styles.textColor)}>
          {Icon && <Icon className={cn('h-3.5 w-3.5', styles.iconColor)} />}
          <span>{message}</span>
        </div>
      )}

      {/* Character Count */}
      {showCharacterCount && characterCount !== undefined && (
        <div
          className={cn(
            'text-xs',
            isOverLimit && 'text-red-600 dark:text-red-400 font-medium',
            isNearLimit && !isOverLimit && 'text-amber-600 dark:text-amber-400',
            !isNearLimit && 'text-muted-foreground'
          )}
        >
          {characterCount}
          {characterLimit && ` / ${characterLimit}`}
        </div>
      )}
    </div>
  )
}

/**
 * Helper hook for managing validation state with debouncing
 *
 * @example
 * const {
 *   state,
 *   message,
 *   validate
 * } = useValidation(async (value) => {
 *   const isValid = await checkEmail(value)
 *   return {
 *     state: isValid ? 'success' : 'error',
 *     message: isValid ? 'Email is available' : 'Email already taken'
 *   }
 * }, 500) // 500ms debounce
 *
 * <Input onChange={(e) => validate(e.target.value)} />
 * <ValidationIndicator state={state} message={message} />
 */
export function useValidation(
  validationFn: (value: string) => Promise<{
    state: ValidationState
    message?: string
  }>,
  debounceMs: number = 300
) {
  const [state, setState] = React.useState<ValidationState>('idle')
  const [message, setMessage] = React.useState<string | undefined>()
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  const validate = React.useCallback(
    (value: string) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Reset if empty
      if (!value.trim()) {
        setState('idle')
        setMessage(undefined)
        return
      }

      // Show validating state
      setState('validating')
      setMessage('Checking...')

      // Debounce validation
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await validationFn(value)
          setState(result.state)
          setMessage(result.message)
        } catch (error) {
          setState('error')
          setMessage('Validation failed')
        }
      }, debounceMs)
    },
    [validationFn, debounceMs]
  )

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return { state, message, validate }
}

/**
 * Preset validation patterns for common fields
 */
export const validationPatterns = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^\+?[\d\s\-()]+$/,
    message: 'Please enter a valid phone number',
  },
  vin: {
    pattern: /^[A-HJ-NPR-Z0-9]{17}$/,
    message: 'VIN must be exactly 17 characters (no I, O, or Q)',
  },
  zipCode: {
    pattern: /^\d{5}(-\d{4})?$/,
    message: 'Please enter a valid ZIP code',
  },
  url: {
    pattern: /^https?:\/\/.+/,
    message: 'Please enter a valid URL starting with http:// or https://',
  },
}

/**
 * Quick validation helper for common patterns
 *
 * @example
 * const emailState = quickValidate(email, 'email')
 * <ValidationIndicator {...emailState} />
 */
export function quickValidate(
  value: string,
  type: keyof typeof validationPatterns
): { state: ValidationState; message?: string } {
  if (!value.trim()) {
    return { state: 'idle' }
  }

  const pattern = validationPatterns[type]
  const isValid = pattern.pattern.test(value)

  return {
    state: isValid ? 'success' : 'error',
    message: isValid ? undefined : pattern.message,
  }
}
