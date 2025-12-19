import { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps extends ComponentProps<"div"> {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  helpText?: string
  variant?: "default" | "compact"
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  helpText,
  variant = "default",
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variant === "default" ? "py-16 px-6" : "py-8 px-4",
        className
      )}
      {...props}
    >
      {icon && (
        <div
          className={cn(
            "mb-4 text-muted-foreground/50",
            variant === "default" ? "scale-100" : "scale-75"
          )}
        >
          {icon}
        </div>
      )}

      <h3
        className={cn(
          "font-semibold text-foreground mb-2",
          variant === "default" ? "text-xl" : "text-lg"
        )}
      >
        {title}
      </h3>

      <p
        className={cn(
          "text-muted-foreground max-w-md mb-6",
          variant === "default" ? "text-base" : "text-sm"
        )}
      >
        {description}
      </p>

      {action && (
        <div className="flex flex-col sm:flex-row gap-3 touch-spacing">
          {action}
        </div>
      )}

      {helpText && (
        <p className="text-xs text-muted-foreground/70 mt-4 max-w-sm">
          {helpText}
        </p>
      )}
    </div>
  )
}
