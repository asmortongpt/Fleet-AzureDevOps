import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-md shadow-sm",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 rounded-md shadow-sm",
        outline:
          "border border-border bg-transparent hover:bg-muted text-foreground rounded-md",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80 rounded-md",
        ghost:
          "hover:bg-muted hover:text-foreground rounded-md",
        link:
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 rounded-md shadow-sm",
        warning:
          "bg-amber-500 text-white hover:bg-amber-600 rounded-md shadow-sm",
      },
      size: {
        default: "h-9 px-2 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2",
        lg: "h-8 px-5 text-sm has-[>svg]:px-2",
        xl: "h-11 px-3 text-base has-[>svg]:px-5",
        icon: "size-9",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
        touch: "h-11 px-5 py-2.5 has-[>svg]:px-2 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
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
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
