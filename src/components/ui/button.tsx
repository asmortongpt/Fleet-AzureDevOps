import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * RippleEffect Component
 * Creates an interactive ripple effect on button clicks
 * Enhances user feedback and visual appeal
 */
const RippleEffect: React.FC<{ trigger?: boolean }> = ({ trigger = false }) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])

  const addRipple = (event: React.MouseEvent<HTMLSpanElement>) => {
    const button = event.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    const id = Date.now()

    setRipples(prev => [...prev, { id, x, y }])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id))
    }, 600)
  }

  return (
    <span
      className="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none"
      onClick={addRipple}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white opacity-50 animate-ping"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: '20px',
            height: '20px',
            animation: 'ripple 600ms ease-out',
          }}
        />
      ))}
    </span>
  )
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-semibold",
        destructive:
          "bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold",
        outline:
          "border border-[var(--border-default)] bg-transparent hover:bg-[var(--surface-glass)] text-[var(--text-primary)] rounded-lg font-semibold hover:border-[var(--border-strong)]",
        secondary:
          "bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-[var(--text-primary)] rounded-lg font-semibold border border-[var(--border-subtle)]",
        ghost:
          "hover:bg-[var(--surface-glass-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg",
        link:
          "text-[var(--text-secondary)] underline-offset-4 hover:underline hover:text-[var(--text-primary)] font-semibold",
        success:
          "bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold",
        warning:
          "bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold",
        professional:
          "bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-[var(--text-primary)] rounded-lg font-semibold border border-[var(--border-subtle)]",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-4 rounded-lg",
        sm: "h-8 gap-1.5 px-3 text-xs has-[>svg]:px-2 rounded-md",
        lg: "h-11 px-6 text-base has-[>svg]:px-3 rounded-lg",
        xl: "h-12 px-8 text-lg has-[>svg]:px-4 rounded-xl font-bold",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-lg",
        touch: "h-12 px-6 py-3 has-[>svg]:px-3 min-h-[48px] min-w-[48px] rounded-lg",
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
    const [isPressed, setIsPressed] = React.useState(false)

    return (
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size }),
          "btn-interactive btn-ripple relative overflow-hidden",
          "transition-all duration-150 ease-out",
          isPressed && "scale-95",
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
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

export { Button, buttonVariants, RippleEffect }
