import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | undefined;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface FormErrors {
  [field: string]: string;
}

export const useFormValidation = (initialValues: any, rules: ValidationRules) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: any): string | undefined => {
    const rule = rules[name];
    if (!rule) return undefined;

    if (rule.required && !value) {
      return `${name} is required`;
    }

    if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Invalid email address';
    }

    if (rule.minLength && value.length < rule.minLength) {
      return `Must be at least ${rule.minLength} characters`;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      return `Must be at most ${rule.maxLength} characters`;
    }

    if (rule.pattern && !rule.pattern.test(value)) {
      return 'Invalid format';
    }

    if (rule.custom) {
      return rule.custom(value);
    }

    return undefined;
  }, [rules]);

  const handleChange = useCallback((name: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [name]: value }));

    // Validate if field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const { [name]: removed, ...rest } = prev;
          return rest;
        }
      });
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [values, validateField]);

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    Object.keys(rules).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [rules, values, validateField]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues
  };
};
