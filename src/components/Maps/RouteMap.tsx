/**
 * RouteMap - Route Visualization with Google Maps
 * Displays active routes and driver locations
 */

import { AlertCircle, Route, MapPin } from 'lucide-react'
import React, { useState, useMemo } from 'react'

import { GoogleMapView } from './GoogleMapView'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useVehicles } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { Vehicle } from '@/types/Vehicle'

export interface RouteMapProps {
  className?: string
}

export const RouteMap: React.FC<RouteMapProps> = ({ className = '' }) => {
  const [showRoutes, setShowRoutes] = useState(true)

  // Fetch vehicles - filter only those with active routes
  const { data: vehicles, isLoading, error } = useVehicles()
  const { routes: routeData } = useFleetData()

  // Convert route data to coordinate arrays for the map
  const routeCoordinates = useMemo(() => {
    if (!routeData || routeData.length === 0) return []
    return routeData
      .map((route: any) => {
        // Extract coordinate arrays from route waypoints/geometry
        const waypoints = route.waypoints || route.coordinates || route.geometry?.coordinates || []
        if (Array.isArray(waypoints) && waypoints.length >= 2) {
          return waypoints.map((wp: any) => {
            if (Array.isArray(wp)) return { lat: wp[1], lng: wp[0] } // GeoJSON [lng, lat]
            return { lat: wp.lat ?? wp.latitude, lng: wp.lng ?? wp.longitude }
          }).filter((c: any) => c.lat != null && c.lng != null)
        }
        return null
      })
      .filter((r): r is { lat: number; lng: number }[] => r !== null && r.length >= 2)
  }, [routeData])

  // Filter to only active vehicles (those in transit)
  // Cast to full Vehicle type since the API returns complete vehicle data
  const activeVehicles = React.useMemo(() => {
    if (!vehicles) return [] as Vehicle[]
    const fullVehicles = vehicles as unknown as Vehicle[]
    return fullVehicles.filter(v => v.status === 'active' || v.assignedDriver)
  }, [vehicles])

  if (isLoading) {
    return (
      <div className="w-full h-full p-2 space-y-3 bg-gradient-to-b from-[#111]/50 to-transparent">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-[#111]/50 to-transparent p-3">
        <div className="text-center max-w-md p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-12 h-9 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-2">Failed to Load Routes</h3>
          <p className="text-sm text-white/70">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button
          onClick={() => setShowRoutes(!showRoutes)}
          variant={showRoutes ? 'default' : 'outline'}
          size="sm"
          className="bg-white/90 backdrop-blur hover:bg-white"
        >
          <Route className="w-4 h-4 mr-2" />
          {showRoutes ? 'Hide Routes' : 'Show Routes'}
        </Button>
      </div>

      {/* Route Info Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur rounded-lg shadow-sm p-2 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-3 h-3 text-emerald-800" />
          <h3 className="font-semibold text-gray-900">Active Routes</h3>
        </div>
        <div className="space-y-1 text-sm text-white/70">
          <div>Active Vehicles: {activeVehicles.length}</div>
          <div>Total Routes: {showRoutes ? routeCoordinates.length : 0}</div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-700">
              Routes shown are optimized paths calculated by the dispatch system.
            </p>
          </div>
        </div>
      </div>

      {/* Google Map with Routes */}
      <GoogleMapView
        vehicles={activeVehicles}
        showRoutes={showRoutes}
        routes={showRoutes ? routeCoordinates : []}
        className="w-full h-full"
        zoom={11}
      />
    </div>
  )
}

export default RouteMap
