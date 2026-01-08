import { AlertCircle, RefreshCw, HelpCircle } from "lucide-react"
import { ComponentProps, ReactNode } from "react"

import { Button } from "./button"

import { cn } from "@/lib/utils"


interface ActionableErrorProps extends ComponentProps<"div"> {
  title: string
  description?: string
  causes?: string[]
  onRetry?: () => void
  helpLink?: string
  variant?: "error" | "warning" | "info"
  customActions?: ReactNode
}

export function ActionableError({
  title,
  description,
  causes = [],
  onRetry,
  helpLink,
  variant = "error",
  customActions,
  className,
  ...props
}: ActionableErrorProps) {
  const variantStyles = {
    error: "bg-destructive/10 border-destructive/30 text-destructive-foreground",
    warning: "bg-warning/10 border-warning/30 text-warning-foreground",
    info: "bg-accent/10 border-accent/30 text-accent-foreground",
  }

  const iconStyles = {
    error: "text-destructive",
    warning: "text-warning",
    info: "text-accent",
  }

  return (
    <div
      data-slot="actionable-error"
      className={cn(
        "rounded-lg border p-4 md:p-6",
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="flex gap-3">
        <AlertCircle
          className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconStyles[variant])}
          aria-hidden="true"
        />

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>

          {causes.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2">This might be due to:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {causes.map((cause, index) => (
                  <li key={index}>{cause}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2 touch-spacing pt-1">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={onRetry}
                className="touch-target"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}

            {helpLink && (
              <Button
                size="sm"
                variant="ghost"
                asChild
                className="touch-target"
              >
                <a href={helpLink} target="_blank" rel="noopener noreferrer">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Get Help
                </a>
              </Button>
            )}

            {customActions}
          </div>
        </div>
      </div>
    </div>
  )
}
