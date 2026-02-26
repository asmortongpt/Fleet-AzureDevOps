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
          "flex h-11 w-full min-w-0 rounded-lg border bg-[#1A0648] px-3 py-2.5 text-sm text-white font-['Montserrat',sans-serif]",
          // Border
          "border-[rgba(0,204,254,0.15)]",
          // Placeholder
          "placeholder:text-[rgba(255,255,255,0.40)]",
          // Selection
          "selection:bg-[#00CCFE]/20 selection:text-white",
          // File input styles
          "file:text-white file:inline-flex file:h-8 file:border-0 file:bg-[#2A1878] file:px-3 file:rounded-lg file:text-sm file:font-medium file:mr-3",
          // Transitions
          "transition-all duration-200 ease-out",
          // Focus states
          "focus-visible:outline-none focus-visible:border-[#00CCFE] focus-visible:ring-2 focus-visible:ring-[#00CCFE]/20 focus-visible:ring-offset-0",
          // Hover state
          "hover:border-[rgba(0,204,254,0.3)]",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Error state
          error && "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20",
          // Aria-invalid state
          "aria-invalid:border-destructive/50 aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:ring-destructive/20",
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
          "flex h-11 w-full min-w-0 rounded-lg border bg-[#1A0648] pl-10 pr-3 py-2.5 text-sm text-white font-['Montserrat',sans-serif]",
          // Border
          "border-[rgba(0,204,254,0.15)]",
          // Placeholder
          "placeholder:text-[rgba(255,255,255,0.40)]",
          // Transitions
          "transition-all duration-200 ease-out",
          // Focus states
          "focus-visible:outline-none focus-visible:border-[#00CCFE] focus-visible:ring-2 focus-visible:ring-[#00CCFE]/20 focus-visible:ring-offset-0",
          // Hover state
          "hover:border-[rgba(0,204,254,0.3)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
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
