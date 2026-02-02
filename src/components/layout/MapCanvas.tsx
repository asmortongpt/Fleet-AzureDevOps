/**
 * MapCanvas - Persistent Google Map that stays mounted behind panels
 *
 * Renders the GoogleMap component directly (not LiveFleetDashboard).
 * Always fills the content area. Panels overlay on top.
 */
import { Suspense, memo } from 'react'
import { GoogleMap } from '@/components/GoogleMap'

function MapLoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0A0E27]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-[#41B2E3]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-[#41B2E3] border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-white/40 tracking-widest uppercase">Loading Map</span>
      </div>
    </div>
  )
}

export const MapCanvas = memo(function MapCanvas() {
  return (
    <div className="absolute inset-0 z-0">
      <Suspense fallback={<MapLoadingFallback />}>
        <GoogleMap
          showVehicles={true}
          showFacilities={true}
          mapStyle="roadmap"
          center={[-84.2807, 30.4383]}
          zoom={12}
          className="w-full h-full"
        />
      </Suspense>
    </div>
  )
})
