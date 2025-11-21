import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MapPin,
  Circle,
  CheckCircle,
  Warning,
  Info
} from "@phosphor-icons/react"
import { Vehicle, GISFacility } from "@/lib/types"
import { UniversalMap } from "@/components/UniversalMap"

/**
 * Props for the GPSTracking component
 */
interface GPSTrackingProps {
  /** Array of vehicles to display on the map and in the list */
  vehicles: Vehicle[]
  /** Array of facilities to potentially display (currently not shown) */
  facilities: GISFacility[]
  /** Optional callback when a vehicle is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * Vehicle status for filtering
 */
type VehicleStatus = Vehicle["status"] | "all"

/**
 * GPSTracking Component
 *
 * A comprehensive GPS tracking interface for monitoring fleet vehicles in real-time.
 * Features include:
 * - Interactive map visualization with vehicle markers
 * - Real-time status filtering
 * - Vehicle list with detailed information
 * - Activity feed showing recent vehicle movements
 * - Status-based color coding and icons
 * - Error handling and loading states
 * - Performance optimization for large vehicle fleets
 *
 * @component
 * @example
 * ```tsx
 * <GPSTracking
 *   vehicles={fleetVehicles}
 *   facilities={facilities}
 *   onVehicleSelect={(id) => console.log('Selected:', id)}
 *   isLoading={false}
 * />
 * ```
 */
export function GPSTracking({
  vehicles = [],
  facilities = [],
  onVehicleSelect,
  isLoading = false,
  error = null
}: GPSTrackingProps) {
  // State management
  const [statusFilter, setStatusFilter] = useState<VehicleStatus>("all")
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  // Refs for cleanup and performance
  const mountedRef = useRef(true)
  const previousVehiclesRef = useRef<Vehicle[]>([])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  /**
   * Track vehicle changes for debugging and analytics
   */
  useEffect(() => {
    if (vehicles.length !== previousVehiclesRef.current.length) {
      console.debug(`[GPSTracking] Vehicle count changed: ${previousVehiclesRef.current.length} -> ${vehicles.length}`)
      previousVehiclesRef.current = vehicles
    }
  }, [vehicles])

  /**
   * Filtered vehicles based on status filter
   * Memoized for performance with large vehicle arrays
   */
  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) {
      console.error('[GPSTracking] vehicles prop is not an array:', vehicles)
      return []
    }

    if (statusFilter === "all") {
      return vehicles
    }

    return vehicles.filter(v => {
      if (!v || typeof v !== 'object') {
        console.warn('[GPSTracking] Invalid vehicle object:', v)
        return false
      }
      return v.status === statusFilter
    })
  }, [vehicles, statusFilter])

  /**
   * Calculate status metrics
   * Memoized to prevent unnecessary recalculations
   */
  const statusMetrics = useMemo(() => {
    const safeVehicles = Array.isArray(vehicles) ? vehicles : []

    return {
      total: safeVehicles.length,
      active: safeVehicles.filter(v => v?.status === "active").length,
      idle: safeVehicles.filter(v => v?.status === "idle").length,
      emergency: safeVehicles.filter(v => v?.status === "emergency").length,
      charging: safeVehicles.filter(v => v?.status === "charging").length,
      service: safeVehicles.filter(v => v?.status === "service").length,
      offline: safeVehicles.filter(v => v?.status === "offline").length,
    }
  }, [vehicles])

  /**
   * Get status icon based on vehicle status
   */
  const getStatusIcon = useCallback((status: Vehicle["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" weight="fill" aria-label="Active status" />
      case "emergency":
        return <Warning className="w-4 h-4" weight="fill" aria-label="Emergency status" />
      case "charging":
        return <Circle className="w-4 h-4" weight="fill" aria-label="Charging status" />
      case "service":
        return <Circle className="w-4 h-4" weight="fill" aria-label="Service status" />
      case "idle":
        return <Circle className="w-4 h-4" weight="fill" aria-label="Idle status" />
      case "offline":
        return <Circle className="w-4 h-4" weight="fill" aria-label="Offline status" />
      default:
        return <Circle className="w-4 h-4" weight="fill" aria-label="Unknown status" />
    }
  }, [])

  /**
   * Get color classes for status
   */
  const getStatusColor = useCallback((status: Vehicle["status"]) => {
    const colors = {
      active: "text-success",
      idle: "text-muted-foreground",
      charging: "text-accent",
      service: "text-warning",
      emergency: "text-destructive",
      offline: "text-muted-foreground"
    }
    return colors[status] || "text-muted-foreground"
  }, [])

  /**
   * Handle vehicle selection
   */
  const handleVehicleClick = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId)
    onVehicleSelect?.(vehicleId)
  }, [onVehicleSelect])

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((value: string) => {
    setStatusFilter(value as VehicleStatus)
  }, [])

  /**
   * Handle map errors
   */
  const handleMapError = useCallback((error: Error) => {
    console.error('[GPSTracking] Map error:', error)
    setMapError(error.message)
  }, [])

  /**
   * Validate vehicle data for map
   */
  const validVehiclesForMap = useMemo(() => {
    return filteredVehicles.filter(v => {
      if (!v?.location) {
        console.warn('[GPSTracking] Vehicle missing location:', v?.id)
        return false
      }

      const { lat, lng } = v.location

      if (typeof lat !== 'number' || typeof lng !== 'number') {
        console.warn('[GPSTracking] Invalid coordinates for vehicle:', v?.id, { lat, lng })
        return false
      }

      if (isNaN(lat) || isNaN(lng)) {
        console.warn('[GPSTracking] NaN coordinates for vehicle:', v?.id)
        return false
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn('[GPSTracking] Out of range coordinates for vehicle:', v?.id, { lat, lng })
        return false
      }

      return true
    })
  }, [filteredVehicles])

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live GPS Tracking</h1>
          <p className="text-muted-foreground mt-1">Real-time fleet location monitoring</p>
        </div>
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live GPS Tracking</h1>
          <p className="text-muted-foreground mt-1">Real-time fleet location monitoring</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Fleet Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[600px] w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live GPS Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Real-time fleet location monitoring - {statusMetrics.total} vehicles
          </p>
        </div>
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]" aria-label="Filter vehicles by status">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles ({statusMetrics.total})</SelectItem>
            <SelectItem value="active">Active Only ({statusMetrics.active})</SelectItem>
            <SelectItem value="idle">Idle Only ({statusMetrics.idle})</SelectItem>
            <SelectItem value="emergency">Emergency ({statusMetrics.emergency})</SelectItem>
            <SelectItem value="charging">Charging ({statusMetrics.charging})</SelectItem>
            <SelectItem value="service">Service ({statusMetrics.service})</SelectItem>
            <SelectItem value="offline">Offline ({statusMetrics.offline})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Map Error Alert */}
      {mapError && (
        <Alert variant="destructive">
          <Warning className="h-4 w-4" />
          <AlertDescription>
            Map Error: {mapError}
          </AlertDescription>
        </Alert>
      )}

      {/* No Vehicles Alert */}
      {filteredVehicles.length === 0 && !isLoading && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {statusFilter === "all"
              ? "No vehicles found in your fleet."
              : `No vehicles with status "${statusFilter}" found.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Fleet Map View</span>
              <Badge variant="secondary">
                {validVehiclesForMap.length} of {filteredVehicles.length} on map
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] bg-muted rounded-lg overflow-hidden border">
              {validVehiclesForMap.length > 0 ? (
                <UniversalMap
                  vehicles={validVehiclesForMap}
                  facilities={[]}
                  showVehicles={true}
                  showFacilities={false}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No vehicles to display on map</p>
                  </div>
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div className="mt-4 flex items-center justify-between p-3 border rounded-lg">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-success" weight="fill" aria-hidden="true" />
                  <span className="text-sm">Active ({statusMetrics.active})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-muted-foreground" weight="fill" aria-hidden="true" />
                  <span className="text-sm">Idle ({statusMetrics.idle})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-accent" weight="fill" aria-hidden="true" />
                  <span className="text-sm">Charging ({statusMetrics.charging})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-warning" weight="fill" aria-hidden="true" />
                  <span className="text-sm">Service ({statusMetrics.service})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-destructive" weight="fill" aria-hidden="true" />
                  <span className="text-sm">Emergency ({statusMetrics.emergency})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle List Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredVehicles.length > 0 ? (
                filteredVehicles.slice(0, 20).map(vehicle => {
                  if (!vehicle) return null

                  return (
                    <div
                      key={vehicle.id}
                      className={`
                        flex items-center justify-between p-3 border rounded-lg
                        hover:bg-muted/50 transition-colors cursor-pointer
                        ${selectedVehicleId === vehicle.id ? 'bg-muted border-primary' : ''}
                      `}
                      onClick={() => handleVehicleClick(vehicle.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleVehicleClick(vehicle.id)
                        }
                      }}
                      aria-label={`View vehicle ${vehicle.number}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={getStatusColor(vehicle.status)}>
                          {getStatusIcon(vehicle.status)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{vehicle.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.location?.address?.split(',')[0] || 'Unknown location'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {vehicle.status}
                      </Badge>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No vehicles to display</p>
                </div>
              )}
              {filteredVehicles.length > 20 && (
                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing 20 of {filteredVehicles.length} vehicles
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredVehicles.length > 0 ? (
            <div className="space-y-3">
              {filteredVehicles.slice(0, 5).map(vehicle => {
                if (!vehicle) return null

                return (
                  <div
                    key={vehicle.id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${getStatusColor(vehicle.status)}`}>
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{vehicle.number}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {vehicle.location?.address || 'Unknown location'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(vehicle.status)} border-current/20 capitalize`}
                      >
                        {vehicle.status}
                      </Badge>
                      {vehicle.location?.lat && vehicle.location?.lng && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {vehicle.location?.lat.toFixed(4)}, {vehicle.location?.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No recent activity to display</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
