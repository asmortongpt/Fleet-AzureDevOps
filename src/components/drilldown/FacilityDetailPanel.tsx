/**
 * FacilityDetailPanel - Level 2 drilldown for facility details
 * Shows comprehensive facility information with vehicle capacity and utilization
 */

import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownContent } from '@/components/DrilldownPanel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import useSWR from 'swr'
import {
  Building2,
  MapPin,
  Phone,
  Users,
  Car,
  Percent,
  Activity,
} from 'lucide-react'

interface FacilityDetailPanelProps {
  facilityId: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function FacilityDetailPanel({ facilityId }: FacilityDetailPanelProps) {
  const { push } = useDrilldown()
  const { data: facility, error, isLoading, mutate } = useSWR(
    `/api/facilities/${facilityId}`,
    fetcher
  )

  const handleViewVehicles = () => {
    push({
      id: `facility-vehicles-${facilityId}`,
      type: 'facility-vehicles',
      label: 'Facility Vehicles',
      data: { facilityId, facilityName: facility?.name },
    })
  }

  const utilizationPercentage = facility?.capacity
    ? Math.round((facility.current_vehicles / facility.capacity) * 100)
    : 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {facility && (
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{facility.name}</h3>
              <p className="text-sm text-muted-foreground">{facility.type || 'Facility'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={facility.status === 'active' ? 'success' : 'secondary'}>
                  {facility.status}
                </Badge>
              </div>
            </div>
            <Building2 className="h-12 w-12 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {facility.current_vehicles || 0} / {facility.capacity || 0}
                </div>
                <Progress value={utilizationPercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{utilizationPercentage}%</div>
                <Progress value={utilizationPercentage} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Facility Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">
                    {facility.address || 'N/A'}
                  </p>
                </div>
              </div>
              {facility.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{facility.phone}</p>
                </div>
              )}
              {facility.manager && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Manager: {facility.manager}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {facility.stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Vehicles</p>
                  <p className="text-xl font-bold">{facility.stats.active_vehicles || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Maintenance</p>
                  <p className="text-xl font-bold">{facility.stats.in_maintenance || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-xl font-bold">{facility.stats.available || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Service</p>
                  <p className="text-xl font-bold">{facility.stats.out_of_service || 0}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleViewVehicles} className="w-full">
            <Car className="h-4 w-4 mr-2" />
            View All Vehicles
          </Button>
        </div>
      )}
    </DrilldownContent>
  )
}
