import React from 'react';

interface StandardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Standard Button Component
 * Fitts's Law Compliant: Minimum 44px × 44px touch targets
 * Visual Hierarchy: Clear primary/secondary/tertiary distinction
 * Interaction Feedback: Hover/active/focus states
 */
export const StandardButton: React.FC<StandardButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  isLoading = false,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  // Base classes (8px grid system)
  const baseClasses = 'inline-flex items-center justify-center rounded transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Size classes - ALL enforce minimum 44px height (Fitts's Law)
  const sizeClasses = {
    small: 'h-11 px-4 text-sm', // 44px minimum
    medium: 'h-12 px-6 text-base', // 48px
    large: 'h-14 px-8 text-lg', // 56px
  };

  // Font weight for visual hierarchy
  const fontWeights = {
    primary: 'font-semibold', // 600
    secondary: 'font-medium', // 500
    danger: 'font-semibold', // 600
    ghost: 'font-normal', // 400
  };

  // Variant classes with hover/active/focus states
  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700 hover:shadow-md
      active:bg-blue-800 active:scale-98
      focus:ring-blue-500
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:shadow-none
    `,
    secondary: `
      bg-gray-100 text-gray-900 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400 hover:shadow-sm
      active:bg-gray-300 active:scale-98
      focus:ring-gray-500
      disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 hover:shadow-md
      active:bg-red-800 active:scale-98
      focus:ring-red-500
      disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:shadow-none
    `,
    ghost: `
      bg-transparent text-gray-700
      hover:bg-gray-100 hover:text-gray-900
      active:bg-gray-200 active:scale-98
      focus:ring-gray-500
      disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent
    `,
  };

  const combinedClasses = [
    baseClasses,
    sizeClasses[size],
    fontWeights[variant],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ').replace(/\s+/g, ' ').trim();

  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default StandardButton;
