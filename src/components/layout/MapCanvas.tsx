/**
 * MapCanvas - Persistent Google Map that stays mounted behind panels
 *
 * Renders the GoogleMap component directly (not LiveFleetDashboard).
 * Always fills the content area. Panels overlay on top.
 */
import { useQuery } from '@tanstack/react-query'
import { Suspense, memo } from 'react'

import { GoogleMap } from '@/components/GoogleMap'
import { secureFetch } from '@/hooks/use-api'
import type { Vehicle } from '@/lib/types'

function MapLoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1A0648]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-[rgba(255,255,255,0.40)] tracking-widest uppercase">Loading Map</span>
      </div>
    </div>
  )
}

export const MapCanvas = memo(function MapCanvas() {
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['map', 'vehicles'],
    queryFn: async () => {
      // Use fixed real /api/vehicles endpoint with real vehicles from database
      const response = await secureFetch('/api/vehicles?limit=200', { method: 'GET' })
      if (!response.ok) return []
      const json = await response.json()
      // Real API returns: { success, data: { data: [...], total: 300 }, meta: ... }
      const payload = (json?.data?.data ?? json?.data ?? json) as any
      const rows = Array.isArray(payload) ? payload : []

      return rows.map((v: any) => {
        const lat = Number(v?.location?.lat ?? v?.latitude ?? v?.location?.latitude ?? 0)
        const lng = Number(v?.location?.lng ?? v?.longitude ?? v?.location?.longitude ?? 0)
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
        const location = hasCoords
          ? {
              lat,
              lng,
              address: String(v?.locationAddress ?? v?.location?.address ?? v?.location_address ?? ''),
            }
          : v.location

        return { ...v, location } as Vehicle
      })
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  })

  return (
    <div className="absolute inset-0 z-0">
      <Suspense fallback={<MapLoadingFallback />}>
        <GoogleMap
          vehicles={vehicles}
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
