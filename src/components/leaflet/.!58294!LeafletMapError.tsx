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
