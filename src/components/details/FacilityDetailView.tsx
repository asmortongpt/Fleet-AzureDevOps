import {
  Building2,
  Users,
  Package,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Wrench,
  XCircle
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { swrFetcher } from '@/lib/fetcher'

interface Facility {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  email?: string
  manager?: string
  type?: string
  status?: string
  capacity?: number
  [key: string]: any
}

interface FacilityDetailViewProps {
  facility: Facility
  onClose?: () => void
}

export function FacilityDetailView({ facility, onClose }: FacilityDetailViewProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')
  const facilityId = facility.id

  const { data: facilityResponse } = useSWR<any>(
    facilityId ? `/api/facilities/${facilityId}` : null,
    swrFetcher
  )
  const { data: vehiclesResponse } = useSWR<any[]>(
    facilityId ? `/api/facilities/${facilityId}/vehicles` : null,
    swrFetcher
  )
  const { data: usersResponse } = useSWR<{ data: any[] }>(
    facilityId ? `/api/users?limit=500&facility_id=${facilityId}` : null,
    swrFetcher
  )

  const facilityDetails = (facilityResponse?.data || facilityResponse || facility) as Facility
  const vehicles = Array.isArray(vehiclesResponse) ? vehiclesResponse : (vehiclesResponse as any)?.data || []
  const users = usersResponse?.data || []

  const capacityMetrics = useMemo(() => {
    const vehicleCapacity = Number(facilityDetails.capacity ?? 0)
    const currentVehicles = vehicles.length
    const utilizationRate = vehicleCapacity > 0 ? Math.round((currentVehicles / vehicleCapacity) * 100) : 0

    return {
      vehicleCapacity,
      currentVehicles,
      availableSpaces: Math.max(0, vehicleCapacity - currentVehicles),
      utilizationRate
    }
  }, [facilityDetails, vehicles])

  const assignedVehicles = useMemo(() => {
    return vehicles.map((vehicle: any) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status || vehicle.state || 'active',
      assignedDate: vehicle.assigned_at || vehicle.created_at,
      driver: vehicle.driver_name || vehicle.assigned_driver_name || ''
    }))
  }, [vehicles])

  const staff = useMemo(() => {
    return users.map((user: any) => ({
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
      role: user.role || user.title || 'Staff',
      department: user.department || 'Operations',
      shift: user.shift || '',
      certifications: user.certifications || [],
      phone: user.phone || ''
    }))
  }, [users])

  const equipment = useMemo(() => {
    return (facilityDetails.equipment || facilityDetails.assets || []) as any[]
  }, [facilityDetails])

  const utilizationHistory = useMemo(() => {
    return facilityDetails.utilization_history || []
  }, [facilityDetails])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
      case 'maintenance':
        return <Badge variant="default" className="bg-yellow-500"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>
      case 'offline':
      case 'closed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Offline</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  const handleViewVehicle = (vehicleId: string) => {
    push({
      id: `vehicle-${vehicleId}`,
      type: 'vehicle',
      label: 'Vehicle Detail',
      data: { vehicleId }
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{facilityDetails.name}</h1>
                <p className="text-purple-100">{facilityDetails.type || 'Facility'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div>
                <p className="text-xs text-purple-200">Location</p>
                <p className="text-sm font-semibold">{facilityDetails.city ?? 'N/A'}, {facilityDetails.state ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Manager</p>
                <p className="text-sm font-semibold">{facilityDetails.manager || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Status</p>
                <p className="text-sm font-semibold">{facilityDetails.status || 'Operational'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Vehicles</p>
                <p className="text-sm font-semibold">{capacityMetrics.currentVehicles} / {capacityMetrics.vehicleCapacity || 0}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-purple-700">
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Facility Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{facilityDetails.type || 'Facility'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(facilityDetails.status || 'operational')}
                  </div>
                  <div className="flex flex-col gap-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Address:</p>
                    <p className="font-medium">{facilityDetails.address ?? 'N/A'}</p>
                    <p className="font-medium">{facilityDetails.city ?? 'N/A'}, {facilityDetails.state ?? 'N/A'} {facilityDetails.zip ?? 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facilityDetails.phone ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facilityDetails.email ?? 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Utilization Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-muted-foreground">Vehicle Capacity</span>
                      <span className={`font-bold ${getUtilizationColor(capacityMetrics.utilizationRate)}`}>
                        {capacityMetrics.utilizationRate}%
                      </span>
                    </div>
                    <Progress value={capacityMetrics.utilizationRate} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {capacityMetrics.currentVehicles} / {capacityMetrics.vehicleCapacity || 0} vehicles
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Staff Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Staff:</span>
                    <span className="font-medium">{staff.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Capacity Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle Capacity</span>
                  <span className="font-medium">{capacityMetrics.vehicleCapacity || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Vehicles</span>
                  <span className="font-medium">{capacityMetrics.currentVehicles}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Spaces</span>
                  <span className="font-medium">{capacityMetrics.availableSpaces}</span>
                </div>
              </CardContent>
            </Card>
            {utilizationHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Utilization History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {utilizationHistory.map((entry: any) => (
                    <div key={entry.id || entry.month} className="flex justify-between">
                      <span className="text-muted-foreground">{entry.label || entry.month || 'Period'}</span>
                      <span className="font-medium">{entry.utilization ?? entry.rate ?? 'N/A'}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Assigned Vehicles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {assignedVehicles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No vehicles assigned.</div>
                ) : (
                  assignedVehicles.map((vehicle: { id: string; make: string; model: string; year: number; status: string; assignedDate: string; driver: string }) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{vehicle.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => handleViewVehicle(vehicle.id)}>
                          View
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Staff</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {staff.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No staff records available.</div>
                ) : (
                  staff.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                      {member.phone && (
                        <Badge variant="outline">{member.phone}</Badge>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipment & Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {equipment.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No equipment records available.</div>
                ) : (
                  equipment.map((asset: any) => (
                    <div key={asset.id || asset.name} className="flex items-center justify-between p-2 bg-muted rounded-md">
                      <div>
                        <p className="font-medium">{asset.name || 'Asset'}</p>
                        <p className="text-xs text-muted-foreground">{asset.type || asset.category || 'Equipment'}</p>
                      </div>
                      <Badge variant="outline">{asset.status || 'Unknown'}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
