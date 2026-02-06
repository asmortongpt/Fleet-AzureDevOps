import {
  Building2, Users, Car, Package, TrendingUp, MapPin, Phone,
  Mail, CheckCircle, Wrench, BarChart3, XCircle
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useFleetData } from '@/hooks/use-fleet-data';
import { secureFetch } from '@/hooks/use-api';

interface Facility {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  manager?: string;
  type?: string;
  status?: string;
  [key: string]: any;
}

interface FacilityDetailViewProps {
  facility: Facility;
  onClose?: () => void;
}

export function FacilityDetailView({ facility, onClose }: FacilityDetailViewProps) {
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('overview');
  const { vehicles, drivers } = useFleetData();

  const { data: serviceBays = [] } = useQuery({
    queryKey: ['service-bays', facility.id],
    queryFn: async () => {
      const response = await secureFetch(`/api/service-bays?facility_id=${facility.id}`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: !!facility.id
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['facility-assets', facility.id],
    queryFn: async () => {
      const response = await secureFetch(`/api/assets`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: true
  })

  const formatDate = (value?: string) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
  }

  const assignedVehicles = useMemo(() => {
    const driversById = new Map(drivers.map(driver => [driver.id, driver]))
    return vehicles
      .filter((vehicle: any) =>
        vehicle.assignedFacilityId === facility.id || vehicle.assigned_facility_id === facility.id
      )
      .map((vehicle: any) => {
        const driverId = vehicle.assignedDriverId || vehicle.assigned_driver_id
        const driver = driverId ? driversById.get(driverId) : undefined
        const driverName = driver
          ? driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim()
          : 'Unassigned'

        return {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          status: vehicle.status || 'active',
          assignedDate: formatDate(vehicle.updatedAt || vehicle.updated_at || vehicle.createdAt || vehicle.created_at),
          driver: driverName
        }
      })
  }, [vehicles, drivers, facility.id])

  const staff = useMemo(() => {
    const assignedDriverIds = new Set(
      vehicles
        .filter((vehicle: any) =>
          vehicle.assignedFacilityId === facility.id || vehicle.assigned_facility_id === facility.id
        )
        .map((vehicle: any) => vehicle.assignedDriverId || vehicle.assigned_driver_id)
        .filter(Boolean)
    )

    return drivers
      .filter(driver => assignedDriverIds.has(driver.id))
      .map((driver: any) => ({
        id: driver.id,
        name: driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim(),
        role: driver.role || driver.metadata?.role || 'Driver',
        department: driver.department || driver.metadata?.department || 'Operations',
        shift: driver.metadata?.shift || 'Day',
        certifications: driver.metadata?.certifications || [],
        phone: driver.phone || ''
      }))
  }, [drivers, vehicles, facility.id])

  const equipment = useMemo(() => {
    return (assets || [])
      .filter((asset: any) => asset.assigned_facility_id === facility.id || asset.assignedFacilityId === facility.id)
      .map((asset: any) => ({
        id: asset.id,
        name: asset.asset_name || asset.name,
        type: asset.asset_type || asset.type,
        bay: asset.location || 'N/A',
        status: asset.status || 'active',
        lastService: formatDate(asset.last_maintenance || asset.last_maintenance_date),
        nextService: formatDate(asset.next_maintenance || asset.next_maintenance_date)
      }))
  }, [assets, facility.id])

  const capacityMetrics = useMemo(() => {
    const vehicleCapacity = Number(facility.capacity ?? 0)
    const currentVehicles = assignedVehicles.length
    const availableSpaces = vehicleCapacity > 0 ? Math.max(vehicleCapacity - currentVehicles, 0) : 0
    const utilizationRate = vehicleCapacity > 0 ? Math.round((currentVehicles / vehicleCapacity) * 100) : 0

    const maintenanceBays = serviceBays.length
    const activeBays = serviceBays.filter((bay: any) => bay.status !== 'closed').length
    const bayUtilization = maintenanceBays > 0 ? Math.round((activeBays / maintenanceBays) * 100) : 0

    const currentStaff = staff.length
    const staffCapacity = Number((facility as any).staffCapacity || facility.metadata?.staff_capacity || currentStaff || 0)
    const staffUtilization = staffCapacity > 0 ? Math.round((currentStaff / staffCapacity) * 100) : 0

    return {
      vehicleCapacity,
      currentVehicles,
      availableSpaces,
      utilizationRate,
      maintenanceBays,
      activeBays,
      bayUtilization,
      staffCapacity,
      currentStaff,
      staffUtilization
    }
  }, [facility, assignedVehicles, serviceBays, staff])

  const utilizationHistory = useMemo(() => {
    const history = (facility as any).utilization_history || facility.metadata?.utilization_history
    return Array.isArray(history) ? history : []
  }, [facility])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'operational':
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'maintenance':
        return <Badge variant="default" className="bg-yellow-500"><Wrench className="w-3 h-3 mr-1" />Maintenance</Badge>;
      case 'offline':
      case 'closed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Offline</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{facility.name}</h1>
                <p className="text-purple-100">{facility.type || 'Service Facility'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <div>
                <p className="text-xs text-purple-200">Location</p>
                <p className="text-sm font-semibold">{facility.city ?? 'N/A'}, {facility.state ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Manager</p>
                <p className="text-sm font-semibold">{facility.manager || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Status</p>
                <p className="text-sm font-semibold">{facility.status || 'Operational'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-200">Vehicles</p>
                <p className="text-sm font-semibold">{capacityMetrics.currentVehicles} / {capacityMetrics.vehicleCapacity}</p>
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
                    <span className="font-medium">{facility.type || 'Service Center'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(facility.status || 'operational')}
                  </div>
                  <div className="flex flex-col gap-1 pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Address:</p>
                    <p className="font-medium">{facility.address ?? 'N/A'}</p>
                    <p className="font-medium">{facility.city ?? 'N/A'}, {facility.state ?? 'N/A'} {facility.zip ?? 'N/A'}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facility.phone ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facility.email ?? 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
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
                      {capacityMetrics.currentVehicles} / {capacityMetrics.vehicleCapacity} vehicles
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-muted-foreground">Bay Utilization</span>
                      <span className={`font-bold ${getUtilizationColor(capacityMetrics.bayUtilization)}`}>
                        {capacityMetrics.bayUtilization}%
                      </span>
                    </div>
                    <Progress value={capacityMetrics.bayUtilization} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {capacityMetrics.activeBays} / {capacityMetrics.maintenanceBays} bays active
                    </p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-muted-foreground">Staff Utilization</span>
                      <span className={`font-bold ${getUtilizationColor(capacityMetrics.staffUtilization)}`}>
                        {capacityMetrics.staffUtilization}%
                      </span>
                    </div>
                    <Progress value={capacityMetrics.staffUtilization} />
                    <p className="text-xs text-muted-foreground mt-1">
                      {capacityMetrics.currentStaff} / {capacityMetrics.staffCapacity} staff
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trends (Last 3 Months)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {utilizationHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No utilization trend data available yet.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2 text-sm">
                        {utilizationHistory.map((month: any) => (
                          <div key={month.month} className="flex justify-between items-center">
                            <span className="text-muted-foreground w-12">{month.month}</span>
                            <div className="flex gap-3 text-xs">
                              <span>V: {month.vehicles}</span>
                              <span>S: {month.staff}</span>
                              <span>B: {month.bays}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        V = Vehicles, S = Staff, B = Bay Utilization
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-2">
                    <p className="text-sm font-bold text-purple-600">{capacityMetrics.currentVehicles}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.vehicleCapacity} spaces</p>
                  </div>
                  <Progress value={capacityMetrics.utilizationRate} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Used: {capacityMetrics.currentVehicles}</span>
                    <span className="text-gray-700">Available: {capacityMetrics.availableSpaces}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Maintenance Bays
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-2">
                    <p className="text-sm font-bold text-purple-600">{capacityMetrics.activeBays}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.maintenanceBays} bays</p>
                  </div>
                  <Progress value={capacityMetrics.bayUtilization} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Active: {capacityMetrics.activeBays}</span>
                    <span className="text-gray-700">Idle: {capacityMetrics.maintenanceBays - capacityMetrics.activeBays}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Staff Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-2">
                    <p className="text-sm font-bold text-purple-600">{capacityMetrics.currentStaff}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.staffCapacity} staff</p>
                  </div>
                  <Progress value={capacityMetrics.staffUtilization} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Active: {capacityMetrics.currentStaff}</span>
                    <span className="text-gray-700">Open: {capacityMetrics.staffCapacity - capacityMetrics.currentStaff}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Assigned Vehicles ({assignedVehicles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignedVehicles.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No vehicles assigned to this facility.</p>
                  ) : (
                    assignedVehicles.map((vehicle) => (
                      <div key={vehicle.id} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          {getStatusBadge(vehicle.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>ID: {vehicle.id}</div>
                          <div>Assigned: {vehicle.assignedDate}</div>
                          <div>Driver: {vehicle.driver}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Facility Staff ({staff.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {staff.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No staff assigned to this facility.</p>
                  ) : (
                    staff.map((member) => (
                      <div key={member.id} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">{member.shift} Shift</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground">Role:</div>
                          <div>{member.role}</div>
                          <div className="text-muted-foreground">Department:</div>
                          <div>{member.department}</div>
                          <div className="text-muted-foreground">Phone:</div>
                          <div>{member.phone}</div>
                          {member.certifications.length > 0 && (
                            <>
                              <div className="text-muted-foreground">Certifications:</div>
                              <div>{member.certifications.join(', ')}</div>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Shop Equipment ({equipment.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {equipment.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No equipment assigned to this facility.</p>
                  ) : (
                    equipment.map((item) => (
                      <div key={item.id} className="border rounded-md p-3 text-sm">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{item.name}</div>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-muted-foreground">Type:</div>
                          <div>{item.type}</div>
                          <div className="text-muted-foreground">Bay:</div>
                          <div>{item.bay}</div>
                          <div className="text-muted-foreground">Last Service:</div>
                          <div>{item.lastService}</div>
                          <div className="text-muted-foreground">Next Service:</div>
                          <div>{item.nextService}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
