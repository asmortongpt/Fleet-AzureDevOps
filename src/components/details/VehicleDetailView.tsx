import {
  Car, FileText, Wrench, DollarSign, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
  Gauge, Fuel, ThermometerSun, Activity, Download, ExternalLink,
  MapPin, Tag, Settings
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { secureFetch } from '@/hooks/use-api';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  licensePlate?: string;
  license_plate?: string;
  mileage?: number;
  status: string;
  color?: string;
  assignedDriver?: string;
  assigned_driver?: string;
  department?: string;
  location?: string;
  // Engine & Drivetrain
  engine_type?: string;
  engineType?: string;
  transmission?: string;
  // Registration & Compliance
  registration_state?: string;
  registrationState?: string;
  registration_expiry?: string;
  registrationExpiry?: string;
  // Ownership & Operational
  ownership?: 'owned' | 'leased' | 'rented' | string;
  operational_status?: string;
  operationalStatus?: string;
  // Metrics & Performance
  odometer?: number;
  odometer_reading?: number;
  odometerMiles?: number;
  fuel_efficiency?: number;
  fuelEfficiency?: number;
  engine_hours?: number;
  engineHours?: number;
  hoursUsed?: number;
  uptime?: number;
  health_score?: number;
  healthScore?: number;
  // Region & Tags
  region?: string;
  tags?: string[];
  // Specifications
  gvwr?: number;
  seating_capacity?: number;
  seatingCapacity?: number;
  expected_life_miles?: number;
  expectedLifeMiles?: number;
  expected_life_years?: number;
  expectedLifeYears?: number;
  exterior_color?: string;
  exteriorColor?: string;
  // Cost fields
  fuel_cost?: number;
  fuelCost?: number;
  repair_cost?: number;
  repairCost?: number;
  total_fuel_cost?: number;
  totalFuelCost?: number;
  total_repair_cost?: number;
  totalRepairCost?: number;
  // Additional
  [key: string]: any;
}

interface VehicleDetailViewProps {
  vehicle: Vehicle;
  onClose?: () => void;
}

export function VehicleDetailView({ vehicle, onClose }: VehicleDetailViewProps) {
  const { push } = useDrilldown();
  const [activeTab, setActiveTab] = useState('overview');

  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [telemetryData, setTelemetryData] = useState<any | null>(null);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchVehicleDetails = async () => {
      try {
        const [workOrdersRes, documentsRes, scheduleRes, telemetryRes] = await Promise.all([
          secureFetch(`/api/v1/work-orders?vehicle_id=${vehicle.id}`),
          secureFetch(`/api/documents?vehicle_id=${vehicle.id}`),
          secureFetch(`/api/maintenance-schedules?vehicle_id=${vehicle.id}`),
          secureFetch(`/api/vehicles/${vehicle.id}/telemetry/unified`)
        ]);

        if (!isMounted) return;

        if (workOrdersRes.ok) {
          const payload = await workOrdersRes.json();
          setServiceHistory(payload.data || payload || []);
        }

        if (documentsRes.ok) {
          const payload = await documentsRes.json();
          setDocuments(payload.data || payload || []);
        }

        if (scheduleRes.ok) {
          const payload = await scheduleRes.json();
          setMaintenanceSchedule(payload.data || payload || []);
        }

        if (telemetryRes.ok) {
          const payload = await telemetryRes.json();
          setTelemetryData(payload.data || payload || null);
        }
      } catch {
        if (!isMounted) return;
        setServiceHistory([]);
        setDocuments([]);
        setMaintenanceSchedule([]);
        setTelemetryData(null);
      }
    };

    fetchVehicleDetails();

    return () => {
      isMounted = false;
    };
  }, [vehicle.id]);

  const costAnalysis = useMemo(() => {
    const v = vehicle as any;
    const vehicleFuelCost = v.total_fuel_cost ?? v.totalFuelCost ?? v.fuel_cost ?? v.fuelCost ?? null;
    const vehicleRepairCost = v.total_repair_cost ?? v.totalRepairCost ?? v.repair_cost ?? v.repairCost ?? null;

    const totalMaintenance = serviceHistory.reduce((sum, item) => sum + Number(item.cost || 0), 0);
    const mileage = v.odometer ?? v.odometer_reading ?? v.odometerMiles ?? v.mileage ?? null;
    const costPerMile = mileage ? totalMaintenance / Number(mileage) : 0;

    // Only return null if there is no data at all
    if (serviceHistory.length === 0 && vehicleFuelCost == null && vehicleRepairCost == null) return null;

    return {
      totalMaintenance,
      totalFuel: vehicleFuelCost != null ? Number(vehicleFuelCost) : null,
      totalRepairs: vehicleRepairCost != null ? Number(vehicleRepairCost) : null,
      averageMonthly: null as number | null,
      costPerMile
    };
  }, [serviceHistory, vehicle]);

  // Helper accessors for camelCase / snake_case compatibility
  const v = vehicle as any;
  const engineType = v.engine_type ?? v.engineType ?? null;
  const transmission = v.transmission ?? null;
  const registrationState = v.registration_state ?? v.registrationState ?? null;
  const registrationExpiry = v.registration_expiry ?? v.registrationExpiry ?? null;
  const ownership = v.ownership ?? null;
  const operationalStatus = v.operational_status ?? v.operationalStatus ?? null;
  const odometer = v.odometer ?? v.odometer_reading ?? v.odometerMiles ?? v.mileage ?? null;
  const fuelEfficiency = v.fuel_efficiency ?? v.fuelEfficiency ?? null;
  const engineHours = v.engine_hours ?? v.engineHours ?? v.hoursUsed ?? null;
  const uptimeValue = v.uptime ?? null;
  const healthScore = v.health_score ?? v.healthScore ?? null;
  const region = v.region ?? null;
  const tags: string[] = v.tags ?? [];
  const gvwr = v.gvwr ?? null;
  const seatingCapacity = v.seating_capacity ?? v.seatingCapacity ?? null;
  const expectedLifeMiles = v.expected_life_miles ?? v.expectedLifeMiles ?? null;
  const expectedLifeYears = v.expected_life_years ?? v.expectedLifeYears ?? null;
  const exteriorColor = v.exterior_color ?? v.exteriorColor ?? v.color ?? null;
  const totalFuelCost = v.total_fuel_cost ?? v.totalFuelCost ?? v.fuel_cost ?? v.fuelCost ?? null;
  const totalRepairCost = v.total_repair_cost ?? v.totalRepairCost ?? v.repair_cost ?? v.repairCost ?? null;

  // Check if registration is expiring within 60 days
  const registrationExpiryWarning = useMemo(() => {
    if (!registrationExpiry) return false;
    const expiryDate = new Date(registrationExpiry);
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    return expiryDate <= sixtyDaysFromNow && expiryDate >= now;
  }, [registrationExpiry]);

  const registrationExpired = useMemo(() => {
    if (!registrationExpiry) return false;
    return new Date(registrationExpiry) < new Date();
  }, [registrationExpiry]);

  // Ownership badge color mapping
  const getOwnershipBadge = (type: string | null) => {
    if (!type) return null;
    const lower = type.toLowerCase();
    switch (lower) {
      case 'owned':
        return <Badge className="bg-green-600 text-white">{type}</Badge>;
      case 'leased':
        return <Badge className="bg-blue-600 text-white">{type}</Badge>;
      case 'rented':
        return <Badge className="bg-amber-600 text-white">{type}</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Operational status badge
  const getOperationalStatusBadge = (status: string | null) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    switch (lower) {
      case 'available':
        return <Badge className="bg-green-500 text-white">{status}</Badge>;
      case 'in_use':
      case 'in use':
        return <Badge className="bg-blue-500 text-white">{status}</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-500 text-white">{status}</Badge>;
      case 'reserved':
        return <Badge className="bg-purple-500 text-white">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return { ring: 'text-green-500', bg: 'stroke-green-500', label: 'Good' };
    if (score >= 60) return { ring: 'text-yellow-500', bg: 'stroke-yellow-500', label: 'Fair' };
    return { ring: 'text-red-500', bg: 'stroke-red-500', label: 'Poor' };
  };

  // Health score circular gauge component
  const HealthScoreGauge = ({ score }: { score: number }) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const { ring, bg, label } = getHealthScoreColor(clampedScore);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              className={bg}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-bold ${ring}`}>{clampedScore}</span>
            <span className="text-[10px] text-muted-foreground">/100</span>
          </div>
        </div>
        <span className={`text-xs font-medium mt-1 ${ring}`}>{label}</span>
      </div>
    );
  };

  // Color swatch helper
  const ColorSwatch = ({ colorName }: { colorName: string }) => {
    const colorMap: Record<string, string> = {
      white: '#FFFFFF', black: '#000000', silver: '#C0C0C0', gray: '#808080', grey: '#808080',
      red: '#DC2626', blue: '#2563EB', green: '#16A34A', yellow: '#EAB308', orange: '#EA580C',
      brown: '#92400E', gold: '#D97706', beige: '#D2B48C', burgundy: '#800020', navy: '#000080',
      maroon: '#800000', tan: '#D2B48C', cream: '#FFFDD0', charcoal: '#36454F',
    };
    const hex = colorMap[colorName.toLowerCase()] || '#9CA3AF';
    return (
      <span
        className="inline-block w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 mr-2 align-middle"
        style={{ backgroundColor: hex }}
        title={colorName}
      />
    );
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
                    <span className="font-medium">{vehicle.licensePlate || vehicle.license_plate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Color:</span>
                    <span className="font-medium">{vehicle.color || 'N/A'}</span>
                  </div>
                  {engineType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engine Type:</span>
                      <span className="font-medium">{engineType}</span>
                    </div>
                  )}
                  {transmission && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transmission:</span>
                      <span className="font-medium">{transmission}</span>
                    </div>
                  )}
                  {registrationState && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reg. State:</span>
                      <span className="font-medium">{registrationState}</span>
                    </div>
                  )}
                  {registrationExpiry && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Reg. Expiry:</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{new Date(registrationExpiry).toLocaleDateString()}</span>
                        {registrationExpired && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />Expired
                          </Badge>
                        )}
                        {registrationExpiryWarning && !registrationExpired && (
                          <Badge className="bg-amber-500 text-white text-[10px] px-1 py-0">
                            <AlertTriangle className="w-3 h-3 mr-0.5" />Expiring Soon
                          </Badge>
                        )}
                      </span>
                    </div>
                  )}
                  {ownership && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Ownership:</span>
                      {getOwnershipBadge(ownership)}
                    </div>
                  )}
                  {operationalStatus && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Op. Status:</span>
                      {getOperationalStatusBadge(operationalStatus)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {healthScore != null && (
                    <div className="flex justify-center pb-2 border-b border-gray-100 dark:border-gray-800">
                      <HealthScoreGauge score={Number(healthScore)} />
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Odometer:</span>
                    <span className="font-medium">{odometer != null ? Number(odometer).toLocaleString() + ' mi' : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel Efficiency:</span>
                    <span className="font-medium">{fuelEfficiency != null ? `${Number(fuelEfficiency).toFixed(1)} MPG` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Engine Hours:</span>
                    <span className="font-medium">{engineHours != null ? `${Number(engineHours).toLocaleString()} hrs` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Utilization:</span>
                    {uptimeValue != null ? (
                      <span className="flex items-center gap-2">
                        <Progress value={Number(uptimeValue)} className="w-16 h-2" />
                        <span className="font-medium">{Number(uptimeValue).toFixed(0)}%</span>
                      </span>
                    ) : (
                      <span className="font-medium">N/A</span>
                    )}
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
                        label: vehicle.assignedDriver || vehicle.assigned_driver || 'Unassigned',
                        data: { id: vehicle.id, name: vehicle.assignedDriver || vehicle.assigned_driver }
                      })}
                    >
                      {vehicle.assignedDriver || vehicle.assigned_driver || 'Unassigned'}
                    </Button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-medium">{vehicle.department || 'N/A'}</span>
                  </div>
                  {region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span className="font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {region}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{vehicle.location || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  {tags.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-muted-foreground text-xs flex items-center gap-1 mb-1.5">
                        <Tag className="w-3 h-3" /> Tags
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vehicle Specifications */}
            {(gvwr || seatingCapacity || fuelEfficiency || expectedLifeMiles || expectedLifeYears || exteriorColor) && (
              <Card className="mt-2">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Vehicle Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                    {exteriorColor && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Exterior Color</span>
                        <span className="font-medium flex items-center">
                          <ColorSwatch colorName={exteriorColor} />
                          {exteriorColor}
                        </span>
                      </div>
                    )}
                    {gvwr != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">GVWR</span>
                        <span className="font-medium">{Number(gvwr).toLocaleString()} lbs</span>
                      </div>
                    )}
                    {seatingCapacity != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Seating Capacity</span>
                        <span className="font-medium">{seatingCapacity}</span>
                      </div>
                    )}
                    {fuelEfficiency != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Fuel Efficiency</span>
                        <span className="font-medium">{Number(fuelEfficiency).toFixed(1)} MPG</span>
                      </div>
                    )}
                    {expectedLifeMiles != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Expected Life (Miles)</span>
                        <span className="font-medium">{Number(expectedLifeMiles).toLocaleString()} mi</span>
                      </div>
                    )}
                    {expectedLifeYears != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Expected Life (Years)</span>
                        <span className="font-medium">{expectedLifeYears} yrs</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
                    <div className="text-sm text-muted-foreground">No service history available.</div>
                  ) : (
                    serviceHistory.map((service) => (
                      <div
                        key={service.id}
                        className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        onClick={() => push({
                          id: `work-order-${service.id}`,
                          type: 'work-order',
                          label: service.description || service.title || 'Work Order',
                          data: service
                        })}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="w-4 h-4 text-blue-800" />
                              <h4 className="font-semibold">{service.type || service.category || 'Service'}</h4>
                              {getStatusBadge(service.status || 'completed')}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{service.description || service.summary || 'Service record'}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Date:</span>
                                <p className="font-medium">{service.date || service.created_at || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Facility:</span>
                                <p className="font-medium">{service.facility || service.location || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Technician:</span>
                                <p className="font-medium">{service.technician || service.assigned_to_name || 'N/A'}</p>
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
                <CardDescription>{documents.length} documents on file</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No documents available.</div>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-3 h-3 text-blue-800" />
                          <div>
                            <p className="font-medium text-sm">{doc.name || doc.title || 'Document'}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {doc.date || doc.created_at || 'Unknown'} | Expires: {doc.expires || doc.expires_at || 'N/A'}
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
                <CardDescription>Last updated: {telemetryData?.lastUpdate || telemetryData?.timestamp || 'Unavailable'}</CardDescription>
              </CardHeader>
              <CardContent>
                {telemetryData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3 h-3 text-blue-800" />
                          <span>Speed</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.speed ?? telemetryData?.diagnostics?.speed ?? 'N/A'} mph</span>
                      </div>
                      <Progress value={Number(telemetryData.speed ?? 0)} max={120} className="w-full" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-blue-800" />
                          <span>Engine RPM</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.rpm ?? telemetryData?.diagnostics?.rpm ?? 'N/A'}</span>
                      </div>
                      <Progress value={Number(telemetryData.rpm ?? 0)} max={8000} className="w-full" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fuel className="w-3 h-3 text-blue-800" />
                          <span>Fuel Level</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.fuelLevel ?? telemetryData?.fuel ?? 'N/A'}%</span>
                      </div>
                      <Progress value={Number(telemetryData.fuelLevel ?? 0)} max={100} className="w-full" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ThermometerSun className="w-3 h-3 text-blue-800" />
                          <span>Engine Temperature</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.engineTemp ?? telemetryData?.temperature ?? 'N/A'}°F</span>
                      </div>
                      <Progress value={Number(telemetryData.engineTemp ?? 0)} max={300} className="w-full" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3 h-3 text-blue-800" />
                          <span>Oil Pressure</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.oilPressure ?? telemetryData?.diagnostics?.oilPressure ?? 'N/A'} psi</span>
                      </div>
                      <Progress value={Number(telemetryData.oilPressure ?? 0)} max={100} className="w-full" />

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3 h-3 text-blue-800" />
                          <span>Battery Voltage</span>
                        </div>
                        <span className="font-mono font-medium">{telemetryData.batteryVoltage ?? telemetryData?.diagnostics?.batteryVoltage ?? 'N/A'}V</span>
                      </div>
                      <Progress value={Number(telemetryData.batteryVoltage ?? 0)} max={16} className="w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No telemetry data available.</div>
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
                    <div className="text-sm text-muted-foreground">No maintenance schedules available.</div>
                  ) : (
                    maintenanceSchedule.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="border rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Wrench className="w-4 h-4 text-blue-800" />
                              <h4 className="font-semibold">{item.service || item.name || 'Scheduled Service'}</h4>
                              {getStatusBadge(item.status || 'scheduled')}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Next Due:</span>
                                <p className="font-medium">{item.nextDue || item.next_due || item.due_date || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Miles Due:</span>
                                <p className="font-medium">{Number(item.milesDue || item.miles_due || 0).toLocaleString()} mi</p>
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
                {costAnalysis ? (
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
                          <span className="font-mono font-medium">{costAnalysis.totalFuel == null ? 'N/A' : `$${costAnalysis.totalFuel.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Repairs:</span>
                          <span className="font-mono font-medium">{costAnalysis.totalRepairs == null ? 'N/A' : `$${costAnalysis.totalRepairs.toFixed(2)}`}</span>
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
                          <span className="font-mono font-medium">{costAnalysis.averageMonthly == null ? 'N/A' : `$${costAnalysis.averageMonthly.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cost per Mile:</span>
                          <span className="font-mono font-medium">${costAnalysis.costPerMile.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No cost data available.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
