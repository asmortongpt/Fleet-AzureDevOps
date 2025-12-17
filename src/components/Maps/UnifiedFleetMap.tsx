import React, { useState, useRef, useEffect, useCallback } from 'react'
import { GoogleMap } from '../GoogleMap'
import { AdvancedGeofencing, Geofence } from './AdvancedGeofencing'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import {
  Car,
  MapPin,
  Route,
  AlertTriangle as Traffic,
  Train,
  Circle,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Map as MapIcon
} from 'lucide-react'
import { Vehicle, GISFacility } from '@/lib/types'
import { useFleetData } from '@/hooks/use-fleet-data'

/**
 * Map layer configuration
 */
interface MapLayer {
  id: string
  name: string
  icon: React.ReactNode
  enabled: boolean
  color: string
  count?: number | string
}

/**
 * Props for UnifiedFleetMap component
 */
export interface UnifiedFleetMapProps {
  /** Initial vehicles to display */
  vehicles?: Vehicle[]
  /** Initial facilities to display */
  facilities?: GISFacility[]
  /** Callback when a vehicle is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Callback when a facility is selected */
  onFacilitySelect?: (facilityId: string) => void
  /** Enable real-time updates */
  enableRealTime?: boolean
  /** Custom height for the map */
  height?: string
}

/**
 * Unified Fleet Map Component
 *
 * A comprehensive map interface that integrates all fleet management layers
 * including vehicles, geofences, routes, traffic, and transit information
 * into a single unified view.
 */
export const UnifiedFleetMap: React.FC<UnifiedFleetMapProps> = ({
  vehicles: initialVehicles = [],
  facilities: initialFacilities = [],
  onVehicleSelect,
  onFacilitySelect,
  enableRealTime = true,
  height = '100%'
}) => {
  // Fleet data hook for real-time updates (only as fallback)
  const fleetData = useFleetData()

  // ALWAYS use provided vehicles if available (they contain real-time data from parent)
  // Only fall back to fleet data hook if no vehicles provided
  const vehicles = initialVehicles.length > 0 ? initialVehicles : fleetData.vehicles
  const facilities = initialFacilities.length > 0 ? initialFacilities : fleetData.facilities

  // Track if we're actually displaying real-time data
  const isDisplayingRealTimeData = initialVehicles.length > 0 && enableRealTime

  // State management
  const [activeTab, setActiveTab] = useState('map')
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null)
  const [transitLayer, setTransitLayer] = useState<google.maps.TransitLayer | null>(null)
  const [bicyclingLayer, setBicyclingLayer] = useState<google.maps.BicyclingLayer | null>(null)
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [showControls, setShowControls] = useState(false)

  // Layer configuration
  const [layers, setLayers] = useState<MapLayer[]>([
    {
      id: 'vehicles',
      name: 'Live Vehicles',
      icon: <Car className="w-4 h-4" />,
      enabled: true,
      color: 'text-blue-500',
      count: vehicles.length
    },
    {
      id: 'facilities',
      name: 'Facilities',
      icon: <MapPin className="w-4 h-4" />,
      enabled: true,
      color: 'text-green-500',
      count: facilities.length
    },
    {
      id: 'geofences',
      name: 'Geofences',
      icon: <Circle className="w-4 h-4" />,
      enabled: false,
      color: 'text-purple-500',
      count: geofences.length
    },
    {
      id: 'routes',
      name: 'Routes',
      icon: <Route className="w-4 h-4" />,
      enabled: false,
      color: 'text-orange-500'
    },
    {
      id: 'traffic',
      name: 'Traffic',
      icon: <Traffic className="w-4 h-4" />,
      enabled: false,
      color: 'text-red-500'
    },
    {
      id: 'transit',
      name: 'Transit',
      icon: <Train className="w-4 h-4" />,
      enabled: false,
      color: 'text-indigo-500'
    },
    {
      id: 'bicycling',
      name: 'Bicycling',
      icon: <MapIcon className="w-4 h-4" />,
      enabled: false,
      color: 'text-teal-500'
    }
  ])

  // Update layer counts when data changes
  useEffect(() => {
    setLayers(prev => prev.map(layer => {
      switch (layer.id) {
        case 'vehicles':
          const activeVehicles = vehicles.filter(v => v.status === 'active').length
          return { ...layer, count: `${activeVehicles}/${vehicles.length}` }
        case 'facilities':
          const operationalFacilities = facilities.filter(f => f.status === 'operational').length
          return { ...layer, count: `${operationalFacilities}/${facilities.length}` }
        case 'geofences':
          return { ...layer, count: geofences.length }
        default:
          return layer
      }
    }))
  }, [vehicles, facilities, geofences.length]) // Added full dependencies

  /**
   * Handle map ready event
   */
  const handleMapReady = useCallback(() => {
    // Map is ready, we can now access the instance through the ref
    const mapElement = document.querySelector('.map-container')
    if (mapElement) {
      // The GoogleMap component should have set up the map instance
      // We'll get it when the component updates
    }
  }, [])

  /**
   * Toggle layer visibility
   */
  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id === layerId) {
        const newEnabled = !layer.enabled

        // Handle Google Maps layers
        if (mapInstance) {
          switch (layerId) {
            case 'traffic':
              if (newEnabled) {
                const traffic = new google.maps.TrafficLayer()
                traffic.setMap(mapInstance)
                setTrafficLayer(traffic)
              } else if (trafficLayer) {
                trafficLayer.setMap(null)
                setTrafficLayer(null)
              }
              break

            case 'transit':
              if (newEnabled) {
                const transit = new google.maps.TransitLayer()
                transit.setMap(mapInstance)
                setTransitLayer(transit)
              } else if (transitLayer) {
                transitLayer.setMap(null)
                setTransitLayer(null)
              }
              break

            case 'bicycling':
              if (newEnabled) {
                const bicycling = new google.maps.BicyclingLayer()
                bicycling.setMap(mapInstance)
                setBicyclingLayer(bicycling)
              } else if (bicyclingLayer) {
                bicyclingLayer.setMap(null)
                setBicyclingLayer(null)
              }
              break
          }
        }

        return { ...layer, enabled: newEnabled }
      }
      return layer
    }))
  }, [mapInstance, trafficLayer, transitLayer, bicyclingLayer])

  /**
   * Handle geofence creation
   */
  const handleGeofenceCreate = useCallback((geofence: Geofence) => {
    setGeofences(prev => [...prev, geofence])
  }, [])

  /**
   * Handle geofence update
   */
  const handleGeofenceUpdate = useCallback((geofence: Geofence) => {
    setGeofences(prev => prev.map(g => g.id === geofence.id ? geofence : g))
  }, [])

  /**
   * Handle geofence deletion
   */
  const handleGeofenceDelete = useCallback((id: string) => {
    setGeofences(prev => prev.filter(g => g.id !== id))
  }, [])

  /**
   * Get enabled layers for map rendering
   */
  const getEnabledLayers = useCallback(() => {
    const enabledLayers: any = {}
    layers.forEach(layer => {
      switch (layer.id) {
        case 'vehicles':
          enabledLayers.showVehicles = layer.enabled
          break
        case 'facilities':
          enabledLayers.showFacilities = layer.enabled
          break
        case 'routes':
          enabledLayers.showRoutes = layer.enabled
          break
      }
    })
    return enabledLayers
  }, [layers])

  /**
   * Quick toggle for all layers
   */
  const toggleAllLayers = useCallback((enabled: boolean) => {
    setLayers(prev => prev.map(layer => ({ ...layer, enabled })))

    if (mapInstance) {
      if (enabled) {
        // Enable all Google Maps layers
        const traffic = new google.maps.TrafficLayer()
        traffic.setMap(mapInstance)
        setTrafficLayer(traffic)

        const transit = new google.maps.TransitLayer()
        transit.setMap(mapInstance)
        setTransitLayer(transit)

        const bicycling = new google.maps.BicyclingLayer()
        bicycling.setMap(mapInstance)
        setBicyclingLayer(bicycling)
      } else {
        // Disable all Google Maps layers
        trafficLayer?.setMap(null)
        setTrafficLayer(null)

        transitLayer?.setMap(null)
        setTransitLayer(null)

        bicyclingLayer?.setMap(null)
        setBicyclingLayer(null)
      }
    }
  }, [mapInstance, trafficLayer, transitLayer, bicyclingLayer])

  return (
    <div className="flex flex-col h-full">
      {/* Floating Layer Controls (Top Left, below Tabs) */}
      <div className="absolute top-14 left-2 z-10">
        {showControls ? (
          <Card className="p-3 border rounded-lg shadow-xl bg-background/95 backdrop-blur w-[600px] animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">Map Layers</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {layers.map(layer => (
                    <div key={layer.id} className="flex items-center gap-1.5">
                      <Switch
                        id={layer.id}
                        checked={layer.enabled}
                        onCheckedChange={() => toggleLayer(layer.id)}
                        className="scale-90"
                      />
                      <Label
                        htmlFor={layer.id}
                        className={`flex items-center gap-1 cursor-pointer text-sm ${layer.enabled ? layer.color : 'text-muted-foreground'
                          }`}
                      >
                        {layer.icon}
                        <span>{layer.name}</span>
                        {layer.count !== undefined && (
                          <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 text-xs">
                            {layer.count}
                          </Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAllLayers(true)}
                  className="text-xs h-7"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  All
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAllLayers(false)}
                  className="text-xs h-7"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  None
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowControls(false)}
                  className="text-xs h-7 w-7 p-0"
                >
                  <Settings className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowControls(true)}
            className="shadow-lg bg-background/95 backdrop-blur border border-white/10"
          >
            <Layers className="w-4 h-4 mr-2" />
            Show Layers
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="absolute top-2 left-2 z-10 bg-background/95 backdrop-blur border border-white/10 shadow-lg rounded-lg h-9">
            <TabsTrigger value="map" className="text-xs px-3">Map View</TabsTrigger>
            <TabsTrigger value="geofencing" className="text-xs px-3">
              Geofencing
              {geofences.length > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-4 min-w-[1.25rem] justify-center">
                  {geofences.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Map View Tab */}
          <TabsContent value="map" className="h-full mt-0">
            <div className="map-container h-full">
              <GoogleMap
                vehicles={layers.find(l => l.id === 'vehicles')?.enabled ? vehicles : []}
                facilities={layers.find(l => l.id === 'facilities')?.enabled ? facilities : []}
                showVehicles={layers.find(l => l.id === 'vehicles')?.enabled}
                showFacilities={layers.find(l => l.id === 'facilities')?.enabled}
                showRoutes={layers.find(l => l.id === 'routes')?.enabled}
                onReady={handleMapReady}
                className="h-full"
              />
            </div>
          </TabsContent>

          {/* Geofencing Tab */}
          <TabsContent value="geofencing" className="h-full mt-0">
            <div className="flex h-full">
              <div className="flex-1">
                <GoogleMap
                  vehicles={layers.find(l => l.id === 'vehicles')?.enabled ? vehicles : []}
                  facilities={layers.find(l => l.id === 'facilities')?.enabled ? facilities : []}
                  showVehicles={layers.find(l => l.id === 'vehicles')?.enabled}
                  showFacilities={layers.find(l => l.id === 'facilities')?.enabled}
                  showRoutes={false}
                  onReady={() => {
                    // Get map instance when ready
                    setTimeout(() => {
                      const mapContainer = document.querySelector('.map-container')
                      if (mapContainer) {
                        // The map instance is managed internally by GoogleMap component
                        // We'll need to pass it to AdvancedGeofencing
                        setMapInstance(null) // Placeholder for now
                      }
                    }, 100)
                  }}
                  className="h-full"
                />
              </div>
              <AdvancedGeofencing
                map={mapInstance}
                onGeofenceCreate={handleGeofenceCreate}
                onGeofenceUpdate={handleGeofenceUpdate}
                onGeofenceDelete={handleGeofenceDelete}
                initialGeofences={geofences}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}