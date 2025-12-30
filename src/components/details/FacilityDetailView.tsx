import {
  Building2, Users, Car, Package, TrendingUp, MapPin, Phone,
  Mail, CheckCircle, Wrench, BarChart3, XCircle
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';

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

  // Mock comprehensive facility data
  const capacityMetrics = {
    vehicleCapacity: 50,
    currentVehicles: 42,
    availableSpaces: 8,
    utilizationRate: 84,
    maintenanceBays: 8,
    activeBays: 6,
    bayUtilization: 75,
    staffCapacity: 25,
    currentStaff: 22,
    staffUtilization: 88
  };

  const assignedVehicles = [
    { id: 'V-001', make: 'Ford', model: 'F-150', year: 2024, status: 'active', assignedDate: '2025-01-15', driver: 'John Smith' },
    { id: 'V-003', make: 'Chevrolet', model: 'Silverado', year: 2024, status: 'maintenance', assignedDate: '2025-02-01', driver: 'Sarah Johnson' },
    { id: 'V-005', make: 'Ram', model: '1500', year: 2023, status: 'active', assignedDate: '2024-11-20', driver: 'Mike Williams' },
    { id: 'V-007', make: 'Toyota', model: 'Tacoma', year: 2024, status: 'active', assignedDate: '2025-03-10', driver: 'Emily Davis' }
  ];

  const staff = [
    { id: '1', name: 'Mike Johnson', role: 'Lead Technician', department: 'Maintenance', shift: 'Day', certifications: ['ASE Master', 'Diesel'], phone: '555-0101' },
    { id: '2', name: 'Sarah Williams', role: 'Senior Technician', department: 'Maintenance', shift: 'Day', certifications: ['ASE'], phone: '555-0102' },
    { id: '3', name: 'Robert Brown', role: 'Technician', department: 'Maintenance', shift: 'Night', certifications: ['ASE'], phone: '555-0103' },
    { id: '4', name: 'Jennifer Davis', role: 'Parts Manager', department: 'Inventory', shift: 'Day', certifications: [], phone: '555-0104' },
    { id: '5', name: 'David Miller', role: 'Facility Manager', department: 'Operations', shift: 'Day', certifications: ['Safety'], phone: '555-0105' }
  ];

  const equipment = [
    { id: '1', name: '4-Post Vehicle Lift', type: 'Lift', bay: 1, status: 'operational', lastService: '2025-11-15', nextService: '2026-02-15' },
    { id: '2', name: '2-Post Vehicle Lift', type: 'Lift', bay: 2, status: 'operational', lastService: '2025-10-20', nextService: '2026-01-20' },
    { id: '3', name: 'Tire Changing Machine', type: 'Tire Equipment', bay: 3, status: 'operational', lastService: '2025-12-01', nextService: '2026-03-01' },
    { id: '4', name: 'Wheel Balancer', type: 'Tire Equipment', bay: 3, status: 'operational', lastService: '2025-12-01', nextService: '2026-03-01' },
    { id: '5', name: 'Diagnostic Scanner', type: 'Diagnostic', bay: 'Mobile', status: 'operational', lastService: '2025-09-15', nextService: '2026-12-15' },
    { id: '6', name: 'Air Compressor', type: 'Shop Equipment', bay: 'All', status: 'maintenance', lastService: '2025-11-30', nextService: '2025-12-30' }
  ];

  const utilizationHistory = [
    { month: 'Nov', vehicles: 38, staff: 20, bays: 72 },
    { month: 'Dec', vehicles: 42, staff: 22, bays: 75 },
    { month: 'Jan', vehicles: 45, staff: 23, bays: 78 }
  ];

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
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">{facility.name}</h1>
                <p className="text-purple-100">{facility.type || 'Service Facility'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              <div>
                <p className="text-xs text-purple-200">Location</p>
                <p className="text-sm font-semibold">{facility.city}, {facility.state}</p>
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
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <p className="font-medium">{facility.address}</p>
                    <p className="font-medium">{facility.city}, {facility.state} {facility.zip}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facility.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs">{facility.email}</span>
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
                  <div className="space-y-2 text-sm">
                    {utilizationHistory.map((month) => (
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Capacity Tab */}
          <TabsContent value="capacity">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-purple-600">{capacityMetrics.currentVehicles}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.vehicleCapacity} spaces</p>
                  </div>
                  <Progress value={capacityMetrics.utilizationRate} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Used: {capacityMetrics.currentVehicles}</span>
                    <span className="text-gray-500">Available: {capacityMetrics.availableSpaces}</span>
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
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-purple-600">{capacityMetrics.activeBays}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.maintenanceBays} bays</p>
                  </div>
                  <Progress value={capacityMetrics.bayUtilization} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Active: {capacityMetrics.activeBays}</span>
                    <span className="text-gray-500">Idle: {capacityMetrics.maintenanceBays - capacityMetrics.activeBays}</span>
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
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-purple-600">{capacityMetrics.currentStaff}</p>
                    <p className="text-sm text-muted-foreground">of {capacityMetrics.staffCapacity} positions</p>
                  </div>
                  <Progress value={capacityMetrics.staffUtilization} className="mb-2" />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Filled: {capacityMetrics.currentStaff}</span>
                    <span className="text-gray-500">Open: {capacityMetrics.staffCapacity - capacityMetrics.currentStaff}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Assigned Vehicles
                </CardTitle>
                <CardDescription>{assignedVehicles.length} vehicles at this facility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignedVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => push({
                        id: `vehicle-${vehicle.id}`,
                        type: 'vehicle',
                        label: `${vehicle.make} ${vehicle.model}`,
                        data: vehicle
                      })}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                          {getStatusBadge(vehicle.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.id} • Driver: {vehicle.driver} • Assigned: {vehicle.assignedDate}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Staff Directory
                </CardTitle>
                <CardDescription>{staff.length} employees at this facility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {staff.map((employee) => (
                    <div key={employee.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{employee.name}</p>
                            <Badge variant="secondary" className="text-xs">{employee.shift}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {employee.role} • {employee.department}
                          </p>
                          {employee.certifications.length > 0 && (
                            <div className="flex gap-1 mb-2">
                              {employee.certifications.map((cert, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {cert}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span>{employee.phone}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Equipment Tab */}
          <TabsContent value="equipment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Equipment Inventory
                </CardTitle>
                <CardDescription>{equipment.length} pieces of equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {equipment.map((item) => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{item.name}</p>
                            {getStatusBadge(item.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Type: {item.type} • Location: Bay {item.bay}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t">
                        <div>
                          <span className="text-muted-foreground">Last Service:</span>
                          <p className="font-medium">{item.lastService}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Next Service:</span>
                          <p className="font-medium">{item.nextService}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
