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
      className="absolute top-4 right-4 bg-[var(--surface-2)] px-2 py-2.5 rounded-lg border border-[var(--border-subtle)] z-[1000] transition-all"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="text-xs font-semibold text-white flex items-center gap-3">
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
