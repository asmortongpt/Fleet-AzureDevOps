import {
  Car, FileText, Wrench, DollarSign, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
  Gauge, Fuel, ThermometerSun, Activity, Download, ExternalLink
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { useFleetData } from '@/hooks/use-fleet-data';
import { secureFetch } from '@/hooks/use-api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  mileage?: number;
  status: string;
  color?: string;
  assignedDriver?: string;
  department?: string;
  location?: string;
  // DOT Compliance
  gvwr?: number;
  dot_number?: string;
  dot_inspection_due_date?: string;
  // Specifications
  engine_size?: string;
  horsepower?: number;
  transmission_type?: string;
  drivetrain?: string;
  body_style?: string;
  // Telematics
  telematics_provider?: string;
  telematics_device_id?: string;
  last_telematics_sync?: string;
  [key: string]: any;
}

interface VehicleDetailViewProps {
  vehicle: Vehicle;
  onClose?: () => void;
}

export function VehicleDetailView({ vehicle, onClose }: VehicleDetailViewProps) {
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('overview');
  const { workOrders, fuelTransactions, maintenanceSchedules } = useFleetData();

  const { data: documents = [] } = useQuery({
    queryKey: ['vehicle-documents', vehicle.id],
    queryFn: async () => {
      const response = await secureFetch(`/api/documents?vehicle_id=${vehicle.id}`)
      if (!response.ok) return []
      const payload = await response.json()
      return payload?.data ?? payload ?? []
    },
    enabled: !!vehicle.id
  })

  const { data: telemetryStats } = useQuery({
    queryKey: ['vehicle-telemetry-stats', vehicle.id],
    queryFn: async () => {
      const response = await secureFetch(`/api/telematics/vehicles/${vehicle.id}/stats`)
      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!vehicle.id,
    refetchInterval: 10000
  })

  const { data: telemetryLocation } = useQuery({
    queryKey: ['vehicle-telemetry-location', vehicle.id],
    queryFn: async () => {
      const response = await secureFetch(`/api/telematics/vehicles/${vehicle.id}/location`)
      if (!response.ok) return null
      return await response.json()
    },
    enabled: !!vehicle.id,
    refetchInterval: 10000
  })

  const formatDate = (value?: string) => {
    if (!value) return 'N/A'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString()
  }

  const dotInspectionDue = vehicle.dot_inspection_due_date
  const dotInspectionOverdue = dotInspectionDue ? new Date(dotInspectionDue) < new Date() : false

  const serviceHistory = useMemo(() => {
    return workOrders
      .filter((order: any) => order.vehicle_id === vehicle.id || order.vehicleId === vehicle.id)
      .map((order: any) => ({
        id: order.id,
        date: order.actual_end || order.actual_end_date || order.created_at || order.createdAt,
        type: order.type || 'maintenance',
        description: order.description || order.title || 'Service event',
        cost: Number(order.actual_cost || order.estimated_cost || 0),
        facility: order.facility_name || order.facility || 'N/A',
        technician: order.assigned_technician_id || order.assigned_technician || 'Unassigned',
        status: order.status || 'scheduled'
      }))
  }, [workOrders, vehicle.id])

  const maintenanceSchedule = useMemo(() => {
    return maintenanceSchedules
      .filter((schedule: any) => schedule.vehicle_id === vehicle.id || schedule.vehicleId === vehicle.id)
      .map((schedule: any) => ({
        service: schedule.name || schedule.type || 'Maintenance',
        nextDue: formatDate(schedule.next_service_date),
        milesDue: schedule.next_service_mileage ?? schedule.interval_miles ?? 0,
        status: schedule.next_service_date && new Date(schedule.next_service_date) < new Date() ? 'overdue' : 'upcoming'
      }))
  }, [maintenanceSchedules, vehicle.id])

  const telemetryData = useMemo(() => {
    if (!telemetryStats && !telemetryLocation) return null
    return {
      speed: telemetryLocation?.speed_mph ?? 0,
      rpm: telemetryStats?.engine_rpm ?? 0,
      fuelLevel: telemetryStats?.fuel_percent ?? 0,
      engineTemp: telemetryStats?.temperature_f ?? 0,
      oilPressure: telemetryStats?.oil_life_percent ?? 0,
      batteryVoltage: telemetryStats?.battery_voltage_12v ?? 0,
      lastUpdate: telemetryStats?.timestamp || telemetryLocation?.timestamp || null
    }
  }, [telemetryStats, telemetryLocation])

  const costAnalysis = useMemo(() => {
    const vehicleWorkOrders = workOrders.filter((order: any) => order.vehicle_id === vehicle.id || order.vehicleId === vehicle.id)
    const vehicleFuel = fuelTransactions.filter((tx: any) => tx.vehicle_id === vehicle.id || tx.vehicleId === vehicle.id)

    const totalMaintenance = vehicleWorkOrders.reduce((sum: number, order: any) => sum + Number(order.actual_cost || order.estimated_cost || 0), 0)
    const totalRepairs = vehicleWorkOrders
      .filter((order: any) => order.type === 'corrective')
      .reduce((sum: number, order: any) => sum + Number(order.actual_cost || order.estimated_cost || 0), 0)
    const totalFuel = vehicleFuel.reduce((sum: number, tx: any) => sum + Number(tx.total_cost || tx.cost || tx.amount || 0), 0)
    const totalCost = totalMaintenance + totalFuel
    const mileage = Number(vehicle.mileage || (vehicle as any).odometer || 0)
    const costPerMile = mileage > 0 ? totalCost / mileage : 0

    return {
      totalMaintenance,
      totalFuel,
      totalRepairs,
      averageMonthly: 0,
      costPerMile
    }
  }, [workOrders, fuelTransactions, vehicle])

  const documentItems = useMemo(() => {
    return documents.map((doc: any) => ({
      id: doc.id,
      name: doc.name || doc.title || doc.file_name || 'Document',
      type: doc.document_type || doc.type || doc.mime_type || 'Document',
      date: formatDate(doc.created_at || doc.uploaded_at),
      expires: formatDate(doc.expiry_date || doc.expires_at),
      url: doc.file_url || doc.storage_path || '#'
    }))
  }, [documents])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'upcoming':
        return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Upcoming</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-4 h-4" />
              <div>
                <h1 className="text-sm font-bold">{vehicle.make} {vehicle.model}</h1>
                <p className="text-blue-100">VIN: {vehicle.vin || 'N/A'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <div>
                <p className="text-xs text-blue-200">Year</p>
                <p className="text-sm font-semibold">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">License Plate</p>
                <p className="text-sm font-semibold">{vehicle.licensePlate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Mileage</p>
                <p className="text-sm font-semibold">{vehicle.mileage?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Status</p>
                <p className="text-sm font-semibold">{vehicle.status}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-blue-700">
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Detailed Information */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service">Service History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="telemetry">Live Telemetry</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vehicle Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Make/Model:</span>
                    <span className="font-medium">{vehicle.make} {vehicle.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium">{vehicle.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="font-mono text-xs">{vehicle.vin || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Plate:</span>
                    <span className="font-medium">{vehicle.licensePlate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{vehicle.color || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Mileage:</span>
                    <span className="font-medium">{vehicle.mileage?.toLocaleString() || 'N/A'} mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Daily Miles:</span>
                    <span className="font-medium">120 mi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">24.5 MPG</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine Hours:</span>
                    <span className="font-medium">1,420 hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilization:</span>
                    <span className="font-medium">87%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Current Assignment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver:</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-blue-800"
                      onClick={() => push({
                        id: `driver-${vehicle.id}`,
                        type: 'driver',
                        label: vehicle.assignedDriver || 'Unassigned',
                        data: { id: vehicle.id, name: vehicle.assignedDriver }
                      })}
                    >
                      {vehicle.assignedDriver || 'Unassigned'}
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{vehicle.department || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{vehicle.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    DOT Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GVWR:</span>
                    <span className="font-medium">{vehicle.gvwr ? `${vehicle.gvwr.toLocaleString()} lbs` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DOT Number:</span>
                    <span className="font-mono">{vehicle.dot_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inspection Due:</span>
                    <span className="font-medium">{formatDate(dotInspectionDue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {dotInspectionOverdue ? (
                      <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>
                    ) : dotInspectionDue ? (
                      <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Current</Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-medium">{vehicle.engine_size || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horsepower:</span>
                    <span className="font-medium">{vehicle.horsepower ? `${vehicle.horsepower} HP` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transmission:</span>
                    <span className="font-medium">{vehicle.transmission_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drivetrain:</span>
                    <span className="font-medium">{vehicle.drivetrain || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Body Style:</span>
                    <span className="font-medium">{vehicle.body_style || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Telematics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="font-medium">{vehicle.telematics_provider || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <span className="font-mono text-xs">{vehicle.telematics_device_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Sync:</span>
                    <span className="font-medium">{formatDate(vehicle.last_telematics_sync)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {vehicle.last_telematics_sync ? (
                      <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>
                    ) : (
                      <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="service">
            <Card>
              <CardHeader>
                <CardTitle>Complete Service History</CardTitle>
                <CardDescription>{serviceHistory.length} service records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {serviceHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No service history found.</p>
                  ) : (
                    serviceHistory.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => push({
                          id: `work-order-${service.id}`,
                          type: 'work-order',
                          label: service.description,
                          data: service
                        })}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="w-4 h-4 text-blue-800" />
                              <h4 className="font-semibold">{service.type}</h4>
                              {getStatusBadge(service.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{formatDate(service.date)}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Facility:</span>
                                <p className="font-medium">{service.facility}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Technician:</span>
                                <p className="font-medium">{service.technician}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Cost:</span>
                                <p className="font-medium">${Number(service.cost || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Documents</CardTitle>
                <CardDescription>{documentItems.length} documents on file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documentItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No documents available.</p>
                  ) : (
                    documentItems.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-3 h-3 text-blue-800" />
                          <div>
                            <p className="font-medium text-sm">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {doc.date} | Expires: {doc.expires}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Telemetry Tab */}
          <TabsContent value="telemetry">
            <Card>
              <CardHeader>
                <CardTitle>Live Vehicle Telemetry</CardTitle>
                <CardDescription>
                  Last updated: {telemetryData?.lastUpdate ? formatDate(telemetryData.lastUpdate) : 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!telemetryData ? (
                  <p className="text-xs text-muted-foreground">No telemetry data available.</p>
                ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-blue-800" />
                        <span>Speed</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.speed} mph</span>
                    </div>
                    <Progress value={telemetryData.speed} max={120} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-800" />
                        <span>Engine RPM</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.rpm}</span>
                    </div>
                    <Progress value={telemetryData.rpm} max={8000} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-3 h-3 text-blue-800" />
                        <span>Fuel Level</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.fuelLevel}%</span>
                    </div>
                    <Progress value={telemetryData.fuelLevel} max={100} className="w-full" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="w-3 h-3 text-blue-800" />
                        <span>Engine Temperature</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.engineTemp}°F</span>
                    </div>
                    <Progress value={telemetryData.engineTemp} max={300} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-blue-800" />
                        <span>Oil Pressure</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.oilPressure} psi</span>
                    </div>
                    <Progress value={telemetryData.oilPressure} max={100} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-800" />
                        <span>Battery Voltage</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.batteryVoltage}V</span>
                    </div>
                    <Progress value={telemetryData.batteryVoltage} max={16} className="w-full" />
                  </div>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Schedule Tab */}
          <TabsContent value="maintenance">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
                <CardDescription>Upcoming and overdue services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {maintenanceSchedule.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No maintenance schedule available.</p>
                  ) : (
                    maintenanceSchedule.map((item, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="w-4 h-4 text-blue-800" />
                              <h4 className="font-semibold">{item.service}</h4>
                              {getStatusBadge(item.status)}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Next Due:</span>
                                <p className="font-medium">{item.nextDue}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Miles Due:</span>
                                <p className="font-medium">{Number(item.milesDue || 0).toLocaleString()} mi</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Analysis Tab */}
          <TabsContent value="costs">
            <Card>
              <CardHeader>
                <CardTitle>Cost Analysis</CardTitle>
                <CardDescription>Lifetime costs and averages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3 h-3 text-blue-800" />
                      <h3 className="font-semibold">Total Costs</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Maintenance:</span>
                        <span className="font-mono font-medium">${costAnalysis.totalMaintenance.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel:</span>
                        <span className="font-mono font-medium">${costAnalysis.totalFuel.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Repairs:</span>
                        <span className="font-mono font-medium">${costAnalysis.totalRepairs.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-blue-800" />
                      <h3 className="font-semibold">Averages</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Cost:</span>
                        <span className="font-mono font-medium">${costAnalysis.averageMonthly.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost per Mile:</span>
                        <span className="font-mono font-medium">${costAnalysis.costPerMile.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
