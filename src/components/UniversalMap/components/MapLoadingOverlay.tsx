import { MapProvider } from "../types"

interface MapLoadingOverlayProps {
  provider: MapProvider
}

export function MapLoadingOverlay({ provider }: MapLoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading {provider === "google" ? "Google Maps" : "OpenStreetMap"}...
        </p>
      </div>
    </div>
  )
}
