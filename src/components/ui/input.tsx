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
          "flex h-10 w-full min-w-0 rounded-lg border bg-white/[0.03] px-3 py-2 text-sm text-white",
          // Typography
          "placeholder:text-white/25",
          "selection:bg-emerald-500/20 selection:text-white",
          // File input styles
          "file:text-white file:inline-flex file:h-8 file:border-0 file:bg-white/[0.06] file:px-3 file:rounded-lg file:text-sm file:font-medium file:mr-3",
          // Border
          "border-white/[0.04]",
          // Transitions
          "transition-colors duration-150",
          // Focus states
          "focus:outline-none focus:border-white/[0.15]",
          // Hover state
          "hover:border-white/[0.08]",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Error state
          error && "border-rose-500/30 focus:border-rose-500/50",
          // Aria-invalid state
          "aria-invalid:border-rose-500/30 aria-invalid:focus:border-rose-500/50",
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
          "flex h-10 w-full min-w-0 rounded-lg border bg-white/[0.03] pl-10 pr-3 py-2 text-sm text-white",
          // Typography
          "placeholder:text-white/25",
          // Border
          "border-white/[0.04]",
          // Transitions
          "transition-colors duration-150",
          // Focus states
          "focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.04]",
          // Hover state
          "hover:border-white/[0.08]",
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
