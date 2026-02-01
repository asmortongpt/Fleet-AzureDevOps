/**
 * LiveFleetMap - Real-time Fleet Tracking Map
 * Displays all vehicles on Google Maps with real-time updates
 */

import { AlertCircle, Filter, RefreshCw } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { GoogleMapView } from './GoogleMapView'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useVehicles } from '@/hooks/use-api'
import { Vehicle } from '@/types/Vehicle'

export interface LiveFleetMapProps {
  filterStatus?: Vehicle['status'][]
  filterType?: Vehicle['type'][]
  className?: string
}

export const LiveFleetMap: React.FC<LiveFleetMapProps> = ({
  filterStatus,
  filterType,
  className = ''
}) => {
  const { push } = useDrilldown()
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch vehicles using existing hook
  const { data: vehicles, isLoading, error, refetch } = useVehicles()

  // Filter vehicles based on props
  const filteredVehicles = React.useMemo(() => {
    if (!vehicles) return []

    let filtered = vehicles

    if (filterStatus && filterStatus.length > 0) {
      filtered = filtered.filter(v => (v as any).status && filterStatus.includes((v as any).status))
    }

    if (filterType && filterType.length > 0) {
      filtered = filtered.filter(v => (v as any).type && filterType.includes((v as any).type))
    }

    return filtered as unknown as Vehicle[]
  }, [vehicles, filterStatus, filterType])

  // Handle marker click - open vehicle drilldown
  const handleMarkerClick = (vehicle: Vehicle) => {
    push({
      id: `vehicle-${vehicle.id}`,
      type: 'vehicle-details',
      label: vehicle.name || `Vehicle ${vehicle.number}`,
      data: { vehicle }
    })
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
      setRefreshKey(prev => prev + 1)
    }, 30000)

    return () => clearInterval(interval)
  }, [refetch])

  // Manual refresh
  const handleRefresh = () => {
    refetch()
    setRefreshKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="w-full h-full p-2 space-y-3 bg-gradient-to-b from-slate-900/50 to-transparent">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-slate-900/50 to-transparent p-3">
        <div className="text-center max-w-md p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-12 h-9 text-red-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-2">Failed to Load Vehicles</h3>
          <p className="text-sm text-slate-400 mb-2">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!filteredVehicles || filteredVehicles.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-slate-900/50 to-transparent p-3">
        <div className="text-center max-w-md p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg">
          <Filter className="w-12 h-9 text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white mb-2">No Vehicles Found</h3>
          <p className="text-sm text-slate-400">
            {filterStatus || filterType
              ? 'Try adjusting your filters to see more vehicles.'
              : 'No vehicles are currently available in your fleet.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Refresh Button Overlay */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur hover:bg-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Google Map */}
      <GoogleMapView
        key={refreshKey}
        vehicles={filteredVehicles}
        onMarkerClick={handleMarkerClick}
        showClustering={filteredVehicles.length > 50}
        className="w-full h-full"
      />
    </div>
  )
}

export default LiveFleetMap
