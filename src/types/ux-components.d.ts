/**
 * TypeScript Type Definitions for UX Components
 *
 * This file provides type definitions for all UX improvement components
 * to enhance IDE autocomplete and type checking.
 */

// Loading Components
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface LoadingOverlayProps {
  message?: string;
}

export interface SkeletonTableProps {
  rows?: number;
}

// Error Components
export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export interface FieldErrorProps {
  message: string;
}

// Toast Components
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

// Breadcrumb Components
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export interface VehicleDetailBreadcrumbProps {
  vehicleId: string;
  vehicleName: string;
}

// Form Validation
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

export interface FormTouched {
  [field: string]: boolean;
}

export interface UseFormValidationReturn<T = any> {
  values: T;
  errors: FormErrors;
  touched: FormTouched;
  handleChange: (name: string, value: any) => void;
  handleBlur: (name: string) => void;
  validateAll: () => boolean;
  reset: () => void;
  setValues: (values: T) => void;
}

// Toast Hook
export interface UseToastReturn {
  toasts: ToastMessage[];
  addToast: (
    message: string,
    type?: ToastType,
    duration?: number
  ) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  updateToast: (id: string, updates: Partial<Omit<ToastMessage, 'id'>>) => void;
}

// Toast Context
export interface ToastContextValue {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  clearAll: () => void;
}

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

// Utility Types
export type ComponentSize = 'sm' | 'md' | 'lg';
export type ComponentVariant = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Generic async operation state
export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// Form field configuration
export interface FormFieldConfig {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule;
}

// Page state for data fetching
export interface PageState<T = any> {
  data: T[];
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  refetch: () => Promise<void>;
}
