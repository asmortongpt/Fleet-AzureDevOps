/**
 * Error state component for LeafletMap
 * Displays error message with retry options
 */

interface LeafletMapErrorProps {
  error: string
  minHeight: number
  className?: string
  onRetry?: () => void
}

export function LeafletMapError({ error, minHeight, className = "", onRetry }: LeafletMapErrorProps) {
  return (
    <div
      className={`flex items-center justify-center bg-muted/50 border border-destructive/20 rounded-lg ${className}`}
      style={{ minHeight: `${minHeight}px`, height: "100%" }}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-4" role="img" aria-label="Error">
          🗺️❌
        </div>
        <h3 className="text-lg font-semibold text-destructive mb-3">Map Error</h3>
        <p className="text-sm text-muted-foreground mb-1">{error}</p>
        <p className="text-xs text-muted-foreground/70 mb-6">
          This may be due to network issues, browser compatibility, or missing dependencies.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors font-medium text-sm"
          aria-label="Reload page to retry map initialization"
        >
          Reload Page
        </button>
        {onRetry && (
          <div className="mt-4">
            <button
              onClick={onRetry}
              className="text-xs text-muted-foreground hover:text-foreground underline"
              aria-label="Retry map initialization"
            >
              Try Again Without Reloading
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
