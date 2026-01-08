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
          "flex h-11 w-full min-w-0 rounded-xl border bg-background px-4 py-2.5 text-sm",
          // Typography
          "placeholder:text-muted-foreground/60",
          "selection:bg-primary/20 selection:text-foreground",
          // File input styles
          "file:text-foreground file:inline-flex file:h-8 file:border-0 file:bg-muted file:px-3 file:rounded-lg file:text-sm file:font-medium file:mr-3",
          // Border and shadow
          "border-border/50 shadow-sm",
          // Transitions
          "transition-all duration-200 ease-out",
          // Focus states
          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-md",
          // Hover state
          "hover:border-border",
          // Dark mode
          "dark:bg-card/50 dark:hover:bg-card/70 dark:focus:bg-card/80",
          // Disabled state
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
          // Error state
          error && "border-destructive/50 focus:border-destructive focus:ring-destructive/20",
          // Aria-invalid state
          "aria-invalid:border-destructive/50 aria-invalid:focus:border-destructive aria-invalid:focus:ring-destructive/20",
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
          "flex h-11 w-full min-w-0 rounded-xl border bg-background pl-10 pr-4 py-2.5 text-sm",
          // Typography
          "placeholder:text-muted-foreground/60",
          // Border and shadow
          "border-border/50 shadow-sm",
          // Transitions
          "transition-all duration-200 ease-out",
          // Focus states
          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:shadow-md focus:bg-background",
          // Hover state
          "hover:border-border hover:bg-muted/30",
          // Dark mode
          "dark:bg-muted/30 dark:hover:bg-muted/50 dark:focus:bg-muted/40",
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
