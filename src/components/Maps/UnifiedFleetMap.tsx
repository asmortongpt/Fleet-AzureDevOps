import { Car, Circle, MapPin } from 'lucide-react'
import React, { useMemo, useState } from 'react'

import { Badge } from '../ui/badge'
import { Card } from '../ui/card'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'

import { UniversalMap } from '../UniversalMap'

import { useGeofences } from '@/hooks/use-api'
import { useFleetData } from '@/hooks/use-fleet-data'
import { GISFacility, Geofence, Vehicle } from '@/lib/types'

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
  /** Force the simulated grid view (fallback) */
  forceSimulatedView?: boolean
  /** Callback when map action occurs */
  onVehicleAction?: (action: string, vehicleId: string) => void
}

interface MapLayer {
  id: 'vehicles' | 'facilities' | 'geofences'
  name: string
  enabled: boolean
  count?: number | string
}

export const UnifiedFleetMap: React.FC<UnifiedFleetMapProps> = ({
  vehicles: initialVehicles = [],
  facilities: initialFacilities = [],
  onVehicleSelect,
  enableRealTime = true,
  height = '500px',
  onVehicleAction,
}) => {
  const fleetData = useFleetData()
  const { data: geofencesData } = useGeofences()

  const vehicles = initialVehicles.length > 0 ? initialVehicles : fleetData.vehicles
  const facilities = initialFacilities.length > 0 ? initialFacilities : fleetData.facilities
  const geofences = useMemo<Geofence[]>(
    () => (Array.isArray(geofencesData) ? (geofencesData as Geofence[]) : (geofencesData?.data as Geofence[]) || []),
    [geofencesData]
  )

  const [activeTab, setActiveTab] = useState<'map' | 'geofences'>('map')
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'vehicles', name: 'Vehicles', enabled: true },
    { id: 'facilities', name: 'Facilities', enabled: true },
    { id: 'geofences', name: 'Geofences', enabled: false },
  ])

  const layerEnabled = (id: MapLayer['id']) =>
    layers.find((layer) => layer.id === id)?.enabled ?? false

  const toggleLayer = (id: MapLayer['id']) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, enabled: !layer.enabled } : layer))
    )
  }

  const activeVehicles = useMemo(() => vehicles.filter((v) => v.status === 'active').length, [vehicles])
  const operationalFacilities = useMemo(
    () => facilities.filter((f) => f.status === 'operational').length,
    [facilities]
  )

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-2 right-2 z-10 flex gap-2 bg-background/95 backdrop-blur border rounded-lg px-3 py-2">
        <div className="flex items-center gap-2 text-xs">
          <Switch checked={layerEnabled('vehicles')} onCheckedChange={() => toggleLayer('vehicles')} />
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            Vehicles
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Switch checked={layerEnabled('facilities')} onCheckedChange={() => toggleLayer('facilities')} />
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Facilities
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Switch checked={layerEnabled('geofences')} onCheckedChange={() => toggleLayer('geofences')} />
          <span className="flex items-center gap-1">
            <Circle className="h-3 w-3" />
            Geofences
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'map' | 'geofences')} className="h-full">
        <TabsList className="absolute top-2 left-2 z-10 bg-background/95 backdrop-blur border rounded-lg h-9">
          <TabsTrigger value="map" className="text-xs px-3">Map View</TabsTrigger>
          <TabsTrigger value="geofences" className="text-xs px-3">
            Geofences
            {geofences.length > 0 && (
              <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-4 min-w-[1.25rem] justify-center">
                {geofences.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="h-full mt-0">
          <div style={{ height }} className="w-full h-full">
            <UniversalMap
              vehicles={layerEnabled('vehicles') ? vehicles : []}
              facilities={layerEnabled('facilities') ? facilities : []}
              geofences={layerEnabled('geofences') ? geofences : []}
              showVehicles={layerEnabled('vehicles')}
              showFacilities={layerEnabled('facilities')}
              showGeofences={layerEnabled('geofences')}
              onVehicleSelect={onVehicleSelect}
              onVehicleAction={onVehicleAction}
              className="h-full"
            />
          </div>
        </TabsContent>

        <TabsContent value="geofences" className="h-full mt-0">
          <div className="flex h-full">
            <div className="flex-1">
              <div style={{ height }} className="w-full h-full">
                <UniversalMap
                  vehicles={layerEnabled('vehicles') ? vehicles : []}
                  facilities={layerEnabled('facilities') ? facilities : []}
                  geofences={geofences}
                  showVehicles={layerEnabled('vehicles')}
                  showFacilities={layerEnabled('facilities')}
                  showGeofences={true}
                  onVehicleSelect={onVehicleSelect}
                  onVehicleAction={onVehicleAction}
                  className="h-full"
                />
              </div>
            </div>
            <div className="w-80 border-l bg-background/95 backdrop-blur p-3 overflow-auto">
              <h3 className="text-sm font-semibold mb-3">Geofences</h3>
              {geofences.length === 0 ? (
                <div className="text-xs text-muted-foreground">No geofences available.</div>
              ) : (
                <div className="space-y-2">
                  {geofences.map((geofence) => (
                    <Card key={geofence.id} className="p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{geofence.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {geofence.type} • {geofence.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: geofence.color || '#3b82f6' }} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Lightweight legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>{activeVehicles} active vehicles</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{operationalFacilities} operational facilities</span>
          </div>
          {enableRealTime && (
            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
              Real-time updates enabled
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
