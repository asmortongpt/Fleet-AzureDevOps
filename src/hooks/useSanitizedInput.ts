/**
 * Input Sanitization Hook
 * Frontend Security - Task 4/8
 * Fortune 50 Security Standards
 */

import { useState, useCallback, ChangeEvent } from 'react';

import { sanitizeUserInput, sanitizeHtml } from '@/utils/xss-sanitizer';

export interface SanitizationOptions {
  mode?: 'strict' | 'html';
  trim?: boolean;
  maxLength?: number;
}

/**
 * React hook for sanitized input handling
 * @param initialValue - Initial value for the input
 * @param options - Sanitization options
 * @returns Tuple of [value, setValue, handleChange, sanitizedValue]
 */
export function useSanitizedInput(
  initialValue: string = '',
  options: SanitizationOptions = {}
) {
  const { maxLength } = options;

  const [rawValue, setRawValue] = useState<string>(initialValue);
  const [sanitizedValue, setSanitizedValue] = useState<string>(
    sanitizeValue(initialValue, options)
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      let newValue = event.target.value;

      // Apply max length
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.substring(0, maxLength);
      }

      setRawValue(newValue);
      setSanitizedValue(sanitizeValue(newValue, options));
    },
    [maxLength, options]
  );

  const setValue = useCallback(
    (value: string) => {
      let processedValue = value;

      // Apply max length
      if (maxLength && processedValue.length > maxLength) {
        processedValue = processedValue.substring(0, maxLength);
      }

      setRawValue(processedValue);
      setSanitizedValue(sanitizeValue(processedValue, options));
    },
    [maxLength, options]
  );

  return {
    value: rawValue,
    sanitizedValue,
    setValue,
    handleChange,
  };
}

/**
 * Sanitize a value based on options
 * @param value - Value to sanitize
 * @param options - Sanitization options
 * @returns Sanitized value
 */
function sanitizeValue(value: string, options: SanitizationOptions): string {
  const { mode = 'strict', trim = true } = options;

  let sanitized = value;

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Apply sanitization based on mode
  if (mode === 'html') {
    sanitized = sanitizeHtml(sanitized);
  } else {
    sanitized = sanitizeUserInput(sanitized);
  }

  return sanitized;
}