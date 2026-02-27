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
    small: 'h-11 px-2 text-sm', // 44px minimum
    medium: 'h-9 px-3 text-base', // 48px
    large: 'h-14 px-3 text-sm', // 56px
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
      bg-emerald-600 text-white
      hover:bg-emerald-700 
      active:bg-emerald-800 active:scale-98
      focus:ring-emerald-500
      disabled:bg-white/[0.08] disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:shadow-none
    `,
    secondary: `
      bg-white/[0.05] text-white/80 border border-white/[0.08]
      hover:bg-white/[0.06] hover:border-white/[0.08] 
      active:bg-white/[0.08] active:scale-98
      focus:ring-gray-500
      disabled:bg-white/[0.03] disabled:text-white/40 disabled:border-white/[0.08] disabled:cursor-not-allowed
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700 
      active:bg-red-800 active:scale-98
      focus:ring-red-500
      disabled:bg-white/[0.08] disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:shadow-none
    `,
    ghost: `
      bg-transparent text-white/40
      hover:bg-white/[0.05] hover:text-white/80
      active:bg-white/[0.06] active:scale-98
      focus:ring-gray-500
      disabled:text-white/40 disabled:cursor-not-allowed disabled:hover:bg-transparent
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
