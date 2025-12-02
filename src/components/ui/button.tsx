import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Button variants configuration using class-variance-authority.
 * Provides consistent styling for all button states and types.
 *
 * @see {@link https://cva.style/docs | CVA Documentation}
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        /** Primary button style with brand colors */
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        /** Destructive actions (delete, remove) with red color scheme */
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        /** Outlined button with border, transparent background */
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        /** Secondary button with subtle background */
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        /** Ghost button with no background until hover */
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        /** Link-styled button with underline on hover */
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        /** Default button size (44px height) */
        default: "h-11 px-4 py-2 has-[>svg]:px-3",
        /** Small button size (40px height) */
        sm: "h-10 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        /** Large button size (48px height) */
        lg: "h-12 rounded-md px-6 has-[>svg]:px-4",
        /** Icon-only button (44x44px square) */
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button component props extending native button attributes.
 *
 * @property {boolean} asChild - When true, renders as Radix Slot for composition
 * @property {'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'} variant - Visual style variant
 * @property {'default'|'sm'|'lg'|'icon'} size - Size variant
 *
 * @example
 * ```tsx
 * // Primary button
 * <Button>Click me</Button>
 *
 * // Destructive action
 * <Button variant="destructive">Delete</Button>
 *
 * // Icon button
 * <Button variant="ghost" size="icon"><IconTrash /></Button>
 *
 * // Composition with asChild
 * <Button asChild><Link to="/home">Home</Link></Button>
 * ```
 */
export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render as Radix Slot for composition patterns */
  asChild?: boolean
}

/**
 * Button component - Primary interactive element for user actions.
 *
 * Built on Radix UI primitives with full accessibility support.
 * Supports multiple variants, sizes, and composition via asChild prop.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Button onClick={() => console.log('clicked')}>Submit</Button>
 *
 * // With loading state
 * <Button disabled={loading}>
 *   {loading ? <Spinner /> : 'Save'}
 * </Button>
 *
 * // Different variants
 * <Button variant="outline">Cancel</Button>
 * <Button variant="destructive">Delete</Button>
 * <Button variant="ghost" size="sm">Edit</Button>
 * ```
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
