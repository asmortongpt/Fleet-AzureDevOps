/**
 * FacilityVehiclesView - Level 3 drilldown for facility vehicles
 * Shows all vehicles at a facility with utilization metrics
 */

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import useSWR from 'swr'
import { Car, Gauge, Fuel, Activity } from 'lucide-react'

interface FacilityVehiclesViewProps {
  facilityId: string
  facilityName?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FacilityVehiclesView({ facilityId, facilityName }: FacilityVehiclesViewProps) {
  const { data: vehicles, error, isLoading, mutate } = useSWR(
    `/api/facilities/${facilityId}/vehicles`,
    fetcher
  )

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {vehicles && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">
              Vehicles {facilityName && `at ${facilityName}`}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </p>
          </div>

          {vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">No vehicles at this facility</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle: any) => (
                <Card key={vehicle.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{vehicle.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                        </div>
                        <Badge variant={vehicle.status === 'active' ? 'success' : 'secondary'}>
                          {vehicle.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Gauge className="h-3 w-3" />
                            <span>Mileage</span>
                          </div>
                          <p className="text-sm font-medium">
                            {vehicle.mileage?.toLocaleString() || '0'} mi
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Fuel className="h-3 w-3" />
                            <span>Fuel</span>
                          </div>
                          <p className="text-sm font-medium">{vehicle.fuel_level || 0}%</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Activity className="h-3 w-3" />
                            <span>Health</span>
                          </div>
                          <p className="text-sm font-medium">{vehicle.health_score || 0}%</p>
                        </div>
                      </div>

                      {vehicle.assigned_to && (
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          Assigned to: {vehicle.assigned_to}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </DrilldownContent>
  )
}
