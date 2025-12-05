/**
 * Marker count badge component for LeafletMap
 * Displays number of visible markers by type
 */

import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

interface LeafletMarkerCountProps {
  vehicles: Vehicle[]
  facilities: GISFacility[]
  cameras: TrafficCamera[]
  showVehicles: boolean
  showFacilities: boolean
  showCameras: boolean
}

export function LeafletMarkerCount({
  vehicles,
  facilities,
  cameras,
  showVehicles,
  showFacilities,
  showCameras,
}: LeafletMarkerCountProps) {
  return (
    <div
      id="map-marker-count"
      className="absolute top-4 right-4 bg-background/95 backdrop-blur-md px-4 py-2.5 rounded-lg shadow-lg border border-border z-[1000] transition-all hover:shadow-xl"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-xs font-semibold text-foreground/90 flex items-center gap-3">
        {showVehicles && vehicles.length > 0 && (
          <span className="flex items-center gap-1.5" title={`${vehicles.length} vehicles`}>
            <span role="img" aria-label="Vehicles">
              🚗
            </span>
            <span className="tabular-nums">{vehicles.length}</span>
          </span>
        )}
        {showFacilities && facilities.length > 0 && (
          <span className="flex items-center gap-1.5" title={`${facilities.length} facilities`}>
            <span role="img" aria-label="Facilities">
              🏢
            </span>
            <span className="tabular-nums">{facilities.length}</span>
          </span>
        )}
        {showCameras && cameras.length > 0 && (
          <span className="flex items-center gap-1.5" title={`${cameras.length} cameras`}>
            <span role="img" aria-label="Cameras">
              📹
            </span>
            <span className="tabular-nums">{cameras.length}</span>
          </span>
        )}
      </p>
    </div>
  )
}
