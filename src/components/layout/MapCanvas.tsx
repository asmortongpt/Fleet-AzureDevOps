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
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-[#41B2E3]/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-[#41B2E3] border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Loading Map</span>
      </div>
    </div>
  )
}

export const MapCanvas = memo(function MapCanvas() {
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['map', 'vehicles'],
    queryFn: async () => {
      const response = await secureFetch('/api/vehicles?limit=200', { method: 'GET' })
      if (!response.ok) return []
      const json = await response.json()
      const payload = (json?.data?.data ?? json?.data ?? json) as any
      const rows = Array.isArray(payload) ? payload : []

      return rows.map((v: any) => {
        const lat = Number(v?.location?.lat ?? v?.location?.latitude ?? v?.latitude)
        const lng = Number(v?.location?.lng ?? v?.location?.longitude ?? v?.longitude)
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng)
        const location = hasCoords
          ? {
              ...(v.location || {}),
              lat,
              lng,
              address: String(v?.location?.address ?? v?.locationAddress ?? v?.location_address ?? ''),
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
