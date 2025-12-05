import { MapProvider } from "../types"

interface ProviderBadgeProps {
  provider: MapProvider
}

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  return (
    <div className="absolute top-4 right-4 z-40 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
      {provider === "google" ? "Google Maps" : "Leaflet/OSM"}
    </div>
  )
}
