import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Warning, ArrowClockwise } from "@phosphor-icons/react"

interface ErrorAlertProps {
  error: Error | string
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorAlert({ error, onRetry, title = "Error", className }: ErrorAlertProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Alert variant="destructive" className={className} role="alert">
      <Warning className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>{errorMessage}</p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
            aria-label="Retry failed operation"
          >
            <ArrowClockwise className="w-4 h-4 mr-2" aria-hidden="true" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface ErrorStateProps {
  error: Error | string
  onRetry?: () => void
  title?: string
}

/**
 * Full-page error state component for when data loading fails
 */
export function ErrorState({ error, onRetry, title = "Unable to Load Data" }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full">
        <ErrorAlert error={error} onRetry={onRetry} title={title} />
      </div>
    </div>
  )
}

interface ErrorBannerProps {
  error: Error | string
  onDismiss?: () => void
  onRetry?: () => void
}

/**
 * Dismissible error banner for non-critical errors
 */
export function ErrorBanner({ error, onDismiss, onRetry }: ErrorBannerProps) {
  const errorMessage = error instanceof Error ? error.message : error

  return (
    <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-1">
          <Warning className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <AlertDescription>{errorMessage}</AlertDescription>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRetry}
              aria-label="Retry failed operation"
            >
              <ArrowClockwise className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
          {onDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              aria-label="Dismiss error message"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </Alert>
  )
}
