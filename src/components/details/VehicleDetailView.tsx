import {
  Car, FileText, Wrench, DollarSign, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
  Gauge, Fuel, ThermometerSun, Activity, Download, ExternalLink
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';

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
}

interface VehicleDetailViewProps {
  vehicle: Vehicle;
  onClose?: () => void;
}

export function VehicleDetailView({ vehicle, onClose }: VehicleDetailViewProps) {
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for comprehensive detail - in production, fetch from API
  const serviceHistory = [
    {
      id: '1',
      date: '2025-12-15',
      type: 'Scheduled Maintenance',
      description: '25,000 mile service - oil change, filter replacement',
      cost: 450.00,
      facility: 'Main Service Center',
      technician: 'Mike Johnson',
      status: 'completed'
    },
    {
      id: '2',
      date: '2025-11-28',
      type: 'Repair',
      description: 'Brake pad replacement - front',
      cost: 325.50,
      facility: 'Main Service Center',
      technician: 'Sarah Williams',
      status: 'completed'
    },
    {
      id: '3',
      date: '2025-12-20',
      type: 'Scheduled Maintenance',
      description: '30,000 mile service - comprehensive inspection',
      cost: 0,
      facility: 'Main Service Center',
      technician: 'TBD',
      status: 'scheduled'
    }
  ];

  const documents = [
    { id: '1', name: 'Registration', type: 'PDF', date: '2025-01-15', expires: '2026-01-15' },
    { id: '2', name: 'Insurance Certificate', type: 'PDF', date: '2025-06-01', expires: '2026-06-01' },
    { id: '3', name: 'Inspection Report', type: 'PDF', date: '2025-12-01', expires: '2026-12-01' },
    { id: '4', name: 'Warranty Documentation', type: 'PDF', date: '2024-03-20', expires: '2027-03-20' }
  ];

  const telemetryData = {
    speed: 45,
    rpm: 2100,
    fuelLevel: 78,
    engineTemp: 195,
    oilPressure: 45,
    batteryVoltage: 13.8,
    lastUpdate: '2025-12-28 15:30:00'
  };

  const maintenanceSchedule = [
    { service: 'Oil Change', nextDue: '2026-01-15', milesDue: 28000, status: 'upcoming' },
    { service: 'Tire Rotation', nextDue: '2026-02-01', milesDue: 30000, status: 'upcoming' },
    { service: 'Brake Inspection', nextDue: '2025-12-30', milesDue: 25500, status: 'overdue' },
    { service: 'Air Filter', nextDue: '2026-03-15', milesDue: 35000, status: 'upcoming' }
  ];

  const costAnalysis = {
    totalMaintenance: 15420.50,
    totalFuel: 8230.75,
    totalRepairs: 2140.30,
    averageMonthly: 720.35,
    costPerMile: 0.42
  };

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
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Car className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h1>
                <p className="text-blue-100">VIN: {vehicle.vin || 'N/A'}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-xs text-blue-200">Year</p>
                <p className="text-lg font-semibold">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">License Plate</p>
                <p className="text-lg font-semibold">{vehicle.licensePlate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Mileage</p>
                <p className="text-lg font-semibold">{vehicle.mileage?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200">Status</p>
                <p className="text-lg font-semibold">{vehicle.status}</p>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white hover:bg-blue-700">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Detailed Information */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service">Service History</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="telemetry">Live Telemetry</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="h-auto p-0 text-blue-600"
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
                <div className="space-y-4">
                  {serviceHistory.map((service) => (
                    <div
                      key={service.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
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
                            <Wrench className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold">{service.type}</h4>
                            {getStatusBadge(service.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Date:</span>
                              <p className="font-medium">{service.date}</p>
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
                              <p className="font-medium">${service.cost.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Documents</CardTitle>
                <CardDescription>{documents.length} documents on file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600" />
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Telemetry Tab */}
          <TabsContent value="telemetry">
            <Card>
              <CardHeader>
                <CardTitle>Live Vehicle Telemetry</CardTitle>
                <CardDescription>Last updated: {telemetryData.lastUpdate}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-blue-600" />
                        <span>Speed</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.speed} mph</span>
                    </div>
                    <Progress value={telemetryData.speed} max={120} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Engine RPM</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.rpm}</span>
                    </div>
                    <Progress value={telemetryData.rpm} max={8000} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-5 h-5 text-blue-600" />
                        <span>Fuel Level</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.fuelLevel}%</span>
                    </div>
                    <Progress value={telemetryData.fuelLevel} max={100} className="w-full" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ThermometerSun className="w-5 h-5 text-blue-600" />
                        <span>Engine Temperature</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.engineTemp}°F</span>
                    </div>
                    <Progress value={telemetryData.engineTemp} max={300} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-blue-600" />
                        <span>Oil Pressure</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.oilPressure} psi</span>
                    </div>
                    <Progress value={telemetryData.oilPressure} max={100} className="w-full" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Battery Voltage</span>
                      </div>
                      <span className="font-mono font-medium">{telemetryData.batteryVoltage}V</span>
                    </div>
                    <Progress value={telemetryData.batteryVoltage} max={16} className="w-full" />
                  </div>
                </div>
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
                <div className="space-y-4">
                  {maintenanceSchedule.map((item, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Wrench className="w-4 h-4 text-blue-600" />
                            <h4 className="font-semibold">{item.service}</h4>
                            {getStatusBadge(item.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                            <div>
                              <span className="text-muted-foreground">Next Due:</span>
                              <p className="font-medium">{item.nextDue}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Miles Due:</span>
                              <p className="font-medium">{item.milesDue.toLocaleString()} mi</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
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

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
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