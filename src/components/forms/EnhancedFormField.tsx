/**
 * Enhanced Form Field Component
 *
 * Improved form input with:
 * - Better error states
 * - Clear visual feedback
 * - Accessibility features
 * - Loading states
 * - Custom validation messages
 * - Help text
 */

import React, { useState, useCallback } from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { colors, spacing, typography, borderRadius, transitions } from '@/theme/designSystem'

interface EnhancedFormFieldProps {
  label?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea'
  placeholder?: string
  value?: string | number
  onChange?: (value: string | number) => void
  error?: string
  success?: boolean
  helpText?: string
  required?: boolean
  disabled?: boolean
  isLoading?: boolean
  icon?: React.ReactNode
  maxLength?: number
  rows?: number // For textarea
  className?: string
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  label,
  type = 'text',
  placeholder,
  value = '',
  onChange,
  error,
  success = false,
  helpText,
  required = false,
  disabled = false,
  isLoading = false,
  icon,
  maxLength,
  rows = 4,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(!showPassword)
  }, [showPassword])

  const inputType = type === 'password' && showPassword ? 'text' : type

  const getBorderColor = () => {
    if (error) return colors.danger[300]
    if (success) return colors.success[300]
    if (isFocused) return colors.primary[400]
    return colors.neutral[300]
  }

  const getBackgroundColor = () => {
    if (disabled) return colors.neutral[100]
    return colors.neutral[50]
  }

  const inputProps = {
    type: inputType,
    placeholder,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange?.(e.target.value)
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    disabled: disabled || isLoading,
    maxLength,
    style: {
      flex: 1,
      padding: `${spacing[3]} ${spacing[3]}`,
      border: `2px solid ${getBorderColor()}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSize.base,
      fontFamily: typography.fontFamily.sans,
      backgroundColor: getBackgroundColor(),
      color: colors.neutral[900],
      transition: transitions.fast,
      outline: 'none',
    } as React.CSSProperties,
  }

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: spacing[2],
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.neutral[700],
          }}
        >
          {label}
          {required && <span style={{ color: colors.danger[500], marginLeft: '4px' }}>*</span>}
        </label>
      )}

      {/* Input Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing[2],
        }}
      >
        {/* Icon */}
        {icon && (
          <div style={{ color: colors.neutral[400], marginLeft: spacing[2] }}>
            {icon}
          </div>
        )}

        {/* Input */}
        {type === 'textarea' ? (
          <textarea {...(inputProps as any)} rows={rows} />
        ) : (
          <input {...(inputProps as any)} />
        )}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: spacing[2],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.neutral[400],
            }}
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}

        {/* Status Icons */}
        {!isLoading && (
          <>
            {error && <AlertCircle size={18} style={{ color: colors.danger[500] }} />}
            {success && !error && (
              <CheckCircle size={18} style={{ color: colors.success[500] }} />
            )}
          </>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div
            style={{
              width: '18px',
              height: '18px',
              border: `2px solid ${colors.neutral[200]}`,
              borderTopColor: colors.primary[500],
              borderRadius: '9999px',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
      </div>

      {/* Helper Text or Error Message */}
      {(error || helpText) && (
        <p
          style={{
            marginTop: spacing[2],
            fontSize: typography.fontSize.xs,
            color: error ? colors.danger[600] : colors.neutral[500],
          }}
        >
          {error || helpText}
        </p>
      )}

      {/* Character Count (for text fields with maxLength) */}
      {maxLength && type !== 'password' && (
        <p
          style={{
            marginTop: spacing[1],
            fontSize: typography.fontSize.xs,
            color: colors.neutral[400],
            textAlign: 'right',
          }}
        >
          {String(value).length} / {maxLength}
        </p>
      )}
    </div>
  )
}

export default EnhancedFormField
