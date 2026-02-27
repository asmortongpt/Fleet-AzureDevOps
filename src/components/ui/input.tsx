import { ComponentProps, forwardRef } from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends ComponentProps<"input"> {
  error?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        ref={ref}
        className={cn(
          // Base styles
          "flex h-9 w-full min-w-0 rounded-[var(--radius-md)] border px-3 py-2 text-[var(--text-base)]",
          "bg-[var(--surface-3)] text-[var(--text-primary)]",
          // Typography
          "placeholder:text-[var(--text-muted)]",
          "selection:bg-emerald-500/20 selection:text-white",
          // File input styles
          "file:text-white file:inline-flex file:h-8 file:border-0 file:bg-[var(--surface-glass-hover)] file:px-3 file:rounded-[var(--radius-md)] file:text-sm file:font-medium file:mr-3",
          // Border
          "border-[var(--border-default)]",
          // Transitions
          "transition-all duration-[var(--duration-fast)]",
          // Focus states
          "focus:outline-none focus:border-[var(--border-focus)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.15)]",
          // Hover state
          "hover:border-[var(--border-strong)]",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Error state
          error && "border-[var(--status-danger)]/30 focus:border-[var(--status-danger)]/50",
          // Aria-invalid state
          "aria-invalid:border-[var(--status-danger)]/30 aria-invalid:focus:border-[var(--status-danger)]/50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

// Search input variant with built-in icon space
const SearchInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="search"
        data-slot="input"
        ref={ref}
        className={cn(
          // Base styles
          "flex h-9 w-full min-w-0 rounded-[var(--radius-md)] border pl-10 pr-3 py-2 text-[var(--text-base)]",
          "bg-[var(--surface-3)] text-[var(--text-primary)]",
          // Typography
          "placeholder:text-[var(--text-muted)]",
          // Border
          "border-[var(--border-default)]",
          // Transitions
          "transition-all duration-[var(--duration-fast)]",
          // Focus states
          "focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--surface-4)] focus:shadow-[0_0_0_2px_rgba(16,185,129,0.15)]",
          // Hover state
          "hover:border-[var(--border-strong)]",
          // Search cancel button
          "[&::-webkit-search-cancel-button]:appearance-none",
          className
        )}
        {...props}
      />
    )
  }
)

SearchInput.displayName = "SearchInput"

export { Input, SearchInput }
