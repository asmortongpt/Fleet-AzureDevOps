/**
 * Loading state component for LeafletMap
 * Displays spinner and progress indicator while map initializes
 */

interface LeafletMapLoadingProps {
  libraryLoaded: boolean
}

export function LeafletMapLoading({ libraryLoaded }: LeafletMapLoadingProps) {
  return (
    <div
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm rounded-lg"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="text-center max-w-xs px-6">
        {/* Animated spinner */}
        <div
          className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto mb-6"
          role="img"
          aria-label="Loading spinner"
        />

        {/* Loading message */}
        <h3 className="text-base font-semibold text-foreground mb-2">
          {libraryLoaded ? "Initializing Map..." : "Loading Map Library..."}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">
          {libraryLoaded ? "Setting up interactive map view" : "Downloading OpenStreetMap components"}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-4">
          100% Free • No API Key Required • Powered by OpenStreetMap
        </p>

        {/* Progress indicator */}
        <div className="mt-6 w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full animate-pulse"
            style={{
              width: libraryLoaded ? "80%" : "40%",
              transition: "width 300ms ease-in-out",
            }}
          />
        </div>
      </div>
    </div>
  )
}
