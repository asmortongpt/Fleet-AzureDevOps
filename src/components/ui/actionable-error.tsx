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
    error: "bg-[#FF4300]/10 border-[#FF4300]/30 text-white",
    warning: "bg-[#FDC016]/10 border-[#FDC016]/30 text-white",
    info: "bg-[#00CCFE]/10 border-[#00CCFE]/30 text-white",
  }

  const iconStyles = {
    error: "text-[#FF4300]",
    warning: "text-[#FDC016]",
    info: "text-[#00CCFE]",
  }

  return (
    <div
      data-slot="actionable-error"
      className={cn(
        "rounded-lg border p-2 md:p-3",
        variantStyles[variant],
        className
      )}
      role="alert"
      aria-live="assertive"
      {...props}
    >
      <div className="flex gap-3">
        <AlertCircle
          className={cn("w-3 h-3 flex-shrink-0 mt-0.5", iconStyles[variant])}
          aria-hidden="true"
        />

        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-[rgba(255,255,255,0.40)]">{description}</p>
            )}
          </div>

          {causes.length > 0 && (
            <div className="text-sm">
              <p className="font-medium mb-2">This might be due to:</p>
              <ul className="list-disc list-inside space-y-1 text-[rgba(255,255,255,0.40)]">
                {causes.map((cause) => (
                  <li key={cause}>{cause}</li>
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
