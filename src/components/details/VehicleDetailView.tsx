import {
  Car, FileText, Wrench, DollarSign, Calendar,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock,
  Gauge, Fuel, ThermometerSun, Activity, Download, ExternalLink,
  MapPin, Tag, Settings, Info, BarChart3, Users, Zap, Shield
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDrilldown } from '@/contexts/DrilldownContext';
import { secureFetch } from '@/hooks/use-api';
import { formatEnum } from '@/utils/format-enum';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers';

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
          secureFetch(`/api/v1/work-orders?vehicle_id=${vehicle.id}`).catch(() => null),
          secureFetch(`/api/documents?vehicle_id=${vehicle.id}`).catch(() => null),
          secureFetch(`/api/maintenance-schedules?vehicle_id=${vehicle.id}`).catch(() => null),
          secureFetch(`/api/vehicles/${vehicle.id}/telemetry/unified`).catch(() => null)
        ]);

        if (!isMounted) return;

        if (workOrdersRes?.ok) {
          const payload = await workOrdersRes.json();
          setServiceHistory(payload.data || payload || []);
        }

        if (documentsRes?.ok) {
          const payload = await documentsRes.json();
          setDocuments(payload.data || payload || []);
        }

        if (scheduleRes?.ok) {
          const payload = await scheduleRes.json();
          setMaintenanceSchedule(payload.data || payload || []);
        }

        if (telemetryRes?.ok) {
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
        return <Badge className="bg-emerald-600 text-white">{formatEnum(type)}</Badge>;
      case 'leased':
        return <Badge className="bg-blue-600 text-white">{formatEnum(type)}</Badge>;
      case 'rented':
        return <Badge className="bg-amber-600 text-white">{formatEnum(type)}</Badge>;
      default:
        return <Badge variant="secondary">{formatEnum(type)}</Badge>;
    }
  };

  // Operational status badge
  const getOperationalStatusBadge = (status: string | null) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    switch (lower) {
      case 'available':
        return <Badge className="bg-emerald-500 text-white">{formatEnum(status)}</Badge>;
      case 'in_use':
      case 'in use':
        return <Badge className="bg-blue-500 text-white">{formatEnum(status)}</Badge>;
      case 'maintenance':
        return <Badge className="bg-amber-500 text-white">{formatEnum(status)}</Badge>;
      case 'reserved':
        return <Badge className="bg-purple-500 text-white">{formatEnum(status)}</Badge>;
      default:
        return <Badge variant="secondary">{formatEnum(status)}</Badge>;
    }
  };

  // Health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Good' };
    if (score >= 60) return { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Fair' };
    return { bg: 'bg-rose-500', text: 'text-rose-400', label: 'Poor' };
  };

  // Flat horizontal health score bar
  const HealthScoreBar = ({ score }: { score: number }) => {
    const clampedScore = Math.max(0, Math.min(100, score));
    const { bg, text, label } = getHealthScoreColor(clampedScore);

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Health Score</span>
          <span className={`text-sm font-semibold ${text}`}>{clampedScore}/100 - {label}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white/[0.08]">
          <div
            className={`h-full rounded-full ${bg}`}
            style={{ width: `${clampedScore}%` }}
          />
        </div>
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
        className="inline-block w-4 h-4 rounded-full border border-white/[0.08] mr-2 align-middle"
        style={{ backgroundColor: hex }}
        title={colorName}
      />
    );
  };

  const getStatusBadge = (status: string) => {
    const lower = (status || '').toLowerCase();
    switch (lower) {
      case 'completed':
        return <Badge variant="default" className="bg-emerald-500"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'scheduled':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'upcoming':
        return <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />Upcoming</Badge>;
      case 'in_progress':
      case 'in progress':
        return <Badge className="bg-blue-500 text-white"><Activity className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500 text-white"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'cancelled':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{formatEnum(status)}</Badge>;
    }
  };

  // Detail row helper
  const DetailRow = ({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) => (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );

  // Telemetry gauge card
  const TelemetryGauge = ({
    icon: Icon,
    label,
    value,
    unit,
    max,
    status
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | null | undefined;
    unit: string;
    max: number;
    status?: 'normal' | 'warning' | 'critical';
  }) => {
    const statusColor = status === 'critical' ? 'text-rose-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400';
    const barColor = status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
    const pct = value != null ? Math.min(100, (Number(value) / max) * 100) : 0;

    return (
      <div className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className={`text-lg font-semibold font-mono ${value != null ? statusColor : 'text-muted-foreground'}`}>
            {value != null ? formatNumber(Number(value), label === 'Battery Voltage' ? 1 : 0) : '--'}
          </span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/[0.08]">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  // Determine telemetry status thresholds
  const getTelemetryStatus = (metric: string, value: number | null | undefined): 'normal' | 'warning' | 'critical' => {
    if (value == null) return 'normal';
    const n = Number(value);
    switch (metric) {
      case 'speed': return n > 85 ? 'critical' : n > 65 ? 'warning' : 'normal';
      case 'rpm': return n > 6000 ? 'critical' : n > 4500 ? 'warning' : 'normal';
      case 'fuel': return n < 15 ? 'critical' : n < 30 ? 'warning' : 'normal';
      case 'engineTemp': return n > 230 ? 'critical' : n > 210 ? 'warning' : 'normal';
      case 'oilPressure': return n < 20 ? 'critical' : n < 30 ? 'warning' : 'normal';
      case 'battery': return n < 11.5 ? 'critical' : n < 12.2 ? 'warning' : 'normal';
      default: return 'normal';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header Section */}
      <div className="bg-[#242424] text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-white/[0.08]">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                <p className="text-xs text-white/60 font-mono">VIN: {vehicle.vin || '--'}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">License Plate</p>
                <p className="text-sm font-semibold text-white">{vehicle.licensePlate || vehicle.license_plate || '--'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Odometer</p>
                <p className="text-sm font-semibold text-white">{odometer != null ? formatNumber(Number(odometer)) + ' mi' : '--'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Status</p>
                <p className="text-sm font-semibold text-white">{formatEnum(vehicle.status)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/40 mb-0.5">Ownership</p>
                <p className="text-sm font-semibold text-white">{ownership ? formatEnum(ownership) : '--'}</p>
              </div>
            </div>
            {healthScore != null && (
              <div className="mt-3">
                <HealthScoreBar score={Number(healthScore)} />
              </div>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/[0.08]">
              <XCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs for Detailed Information */}
      <div className="p-3">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full mb-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Vehicle Information Card */}
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Info className="w-4 h-4 text-muted-foreground" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <DetailRow label="Make / Model" value={`${vehicle.make} ${vehicle.model}`} />
                  <DetailRow label="Year" value={vehicle.year} />
                  <DetailRow label="VIN" value={<span className="font-mono text-xs">{vehicle.vin || '--'}</span>} />
                  <DetailRow label="License Plate" value={vehicle.licensePlate || vehicle.license_plate || '--'} />
                  {exteriorColor && (
                    <DetailRow label="Color" value={
                      <span className="flex items-center">
                        <ColorSwatch colorName={exteriorColor} />
                        {formatEnum(exteriorColor)}
                      </span>
                    } />
                  )}
                  {engineType && (
                    <DetailRow label="Engine Type" value={formatEnum(engineType)} />
                  )}
                  {transmission && (
                    <DetailRow label="Transmission" value={formatEnum(transmission)} />
                  )}
                  {registrationState && (
                    <DetailRow label="Reg. State" value={registrationState} />
                  )}
                  {registrationExpiry && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">Reg. Expiry</span>
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">{formatDate(registrationExpiry)}</span>
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
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">Ownership</span>
                      {getOwnershipBadge(ownership)}
                    </div>
                  )}
                  {operationalStatus && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-muted-foreground">Op. Status</span>
                      {getOperationalStatusBadge(operationalStatus)}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Usage Statistics Card */}
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {healthScore != null && (
                    <div className="pb-2 mb-2 border-b border-white/[0.08]">
                      <HealthScoreBar score={Number(healthScore)} />
                    </div>
                  )}
                  <DetailRow
                    label="Odometer"
                    value={odometer != null ? `${formatNumber(Number(odometer))} mi` : '--'}
                    mono
                  />
                  <DetailRow
                    label="Fuel Efficiency"
                    value={fuelEfficiency != null ? `${Number(fuelEfficiency).toFixed(1)} MPG` : '--'}
                    mono
                  />
                  <DetailRow
                    label="Engine Hours"
                    value={engineHours != null ? `${formatNumber(Number(engineHours))} hrs` : '--'}
                    mono
                  />
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Utilization</span>
                    {uptimeValue != null ? (
                      <span className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-white/[0.08]">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${Math.min(100, Number(uptimeValue))}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium font-mono text-foreground">{Number(uptimeValue).toFixed(0)}%</span>
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">--</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Current Assignment Card */}
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    Current Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Driver</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-sm font-medium"
                      onClick={() => push({
                        id: `driver-${vehicle.id}`,
                        type: 'driver',
                        label: vehicle.assignedDriver || vehicle.assigned_driver || '--',
                        data: { id: vehicle.id, name: vehicle.assignedDriver || vehicle.assigned_driver }
                      })}
                    >
                      {vehicle.assignedDriver || vehicle.assigned_driver || '--'}
                    </Button>
                  </div>
                  <DetailRow label="Department" value={formatEnum(vehicle.department) || '--'} />
                  {region && (
                    <DetailRow label="Region" value={
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {region}
                      </span>
                    } />
                  )}
                  <DetailRow label="Location" value={vehicle.location || '--'} />
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
                  {tags.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-white/[0.08]">
                      <span className="text-muted-foreground text-xs flex items-center gap-1 mb-1.5">
                        <Tag className="w-3 h-3" /> Tags
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-white/[0.08]">
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
              <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Vehicle Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                    {exteriorColor && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Exterior Color</span>
                        <span className="font-medium text-foreground flex items-center">
                          <ColorSwatch colorName={exteriorColor} />
                          {formatEnum(exteriorColor)}
                        </span>
                      </div>
                    )}
                    {gvwr != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">GVWR</span>
                        <span className="font-medium text-foreground">{formatNumber(Number(gvwr))} lbs</span>
                      </div>
                    )}
                    {seatingCapacity != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Seating Capacity</span>
                        <span className="font-medium text-foreground">{seatingCapacity}</span>
                      </div>
                    )}
                    {fuelEfficiency != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Fuel Efficiency</span>
                        <span className="font-medium text-foreground">{Number(fuelEfficiency).toFixed(1)} MPG</span>
                      </div>
                    )}
                    {expectedLifeMiles != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Expected Life (Miles)</span>
                        <span className="font-medium text-foreground">{formatNumber(Number(expectedLifeMiles))} mi</span>
                      </div>
                    )}
                    {expectedLifeYears != null && (
                      <div>
                        <span className="text-muted-foreground text-xs block mb-1">Expected Life (Years)</span>
                        <span className="font-medium text-foreground">{expectedLifeYears} yrs</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Service History Tab */}
          <TabsContent value="service">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  Service History
                  <span className="text-xs text-muted-foreground font-normal ml-auto">{serviceHistory.length} records</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {serviceHistory.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No records found
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto border border-white/[0.08] rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#242424] z-10">
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Type</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Date</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Technician</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Cost</th>
                          <th className="w-8 px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {serviceHistory.map((service) => (
                          <tr
                            key={service.id}
                            className="border-b border-white/[0.08] cursor-pointer"
                            onClick={() => push({
                              id: `work-order-${service.id}`,
                              type: 'work-order',
                              label: service.description || service.title || 'Work Order',
                              data: service
                            })}
                          >
                            <td className="px-3 py-2 font-medium text-foreground">
                              {formatEnum(service.type || service.category || 'service')}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                              {service.description || service.summary || service.title || '--'}
                            </td>
                            <td className="px-3 py-2 text-foreground whitespace-nowrap">
                              {formatDate(service.date || service.created_at)}
                            </td>
                            <td className="px-3 py-2">
                              {getStatusBadge(service.status || 'completed')}
                            </td>
                            <td className="px-3 py-2 text-foreground">
                              {service.technician || service.assigned_to_name || '--'}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">
                              {formatCurrency(Number(service.cost || 0))}
                            </td>
                            <td className="px-2 py-2">
                              <ExternalLink className="w-3 h-3 text-muted-foreground" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Vehicle Documents
                  <span className="text-xs text-muted-foreground font-normal ml-auto">{documents.length} on file</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No records found
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-white/[0.08]"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm text-foreground">{doc.name || doc.title || 'Document'}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded: {formatDate(doc.date || doc.created_at)} | Expires: {formatDate(doc.expires || doc.expires_at)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Telemetry Tab */}
          <TabsContent value="telemetry">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                  Live Vehicle Telemetry
                  <span className="text-xs text-muted-foreground font-normal ml-auto">
                    Last updated: {telemetryData?.lastUpdate || telemetryData?.timestamp ? formatDateTime(telemetryData.lastUpdate || telemetryData.timestamp) : '--'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {telemetryData ? (() => {
                  const speed = telemetryData.speed ?? telemetryData?.diagnostics?.speed ?? null;
                  const rpm = telemetryData.rpm ?? telemetryData?.diagnostics?.rpm ?? null;
                  const fuelLevel = telemetryData.fuelLevel ?? telemetryData?.fuel ?? null;
                  const engTemp = telemetryData.engineTemp ?? telemetryData?.temperature ?? null;
                  const oilPressure = telemetryData.oilPressure ?? telemetryData?.diagnostics?.oilPressure ?? null;
                  const batteryVoltage = telemetryData.batteryVoltage ?? telemetryData?.diagnostics?.batteryVoltage ?? null;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <TelemetryGauge
                        icon={Gauge}
                        label="Speed"
                        value={speed}
                        unit="mph"
                        max={120}
                        status={getTelemetryStatus('speed', speed)}
                      />
                      <TelemetryGauge
                        icon={Activity}
                        label="Engine RPM"
                        value={rpm}
                        unit="rpm"
                        max={8000}
                        status={getTelemetryStatus('rpm', rpm)}
                      />
                      <TelemetryGauge
                        icon={Fuel}
                        label="Fuel Level"
                        value={fuelLevel}
                        unit="%"
                        max={100}
                        status={getTelemetryStatus('fuel', fuelLevel)}
                      />
                      <TelemetryGauge
                        icon={ThermometerSun}
                        label="Engine Temp"
                        value={engTemp}
                        unit="F"
                        max={300}
                        status={getTelemetryStatus('engineTemp', engTemp)}
                      />
                      <TelemetryGauge
                        icon={Gauge}
                        label="Oil Pressure"
                        value={oilPressure}
                        unit="psi"
                        max={100}
                        status={getTelemetryStatus('oilPressure', oilPressure)}
                      />
                      <TelemetryGauge
                        icon={Zap}
                        label="Battery Voltage"
                        value={batteryVoltage}
                        unit="V"
                        max={16}
                        status={getTelemetryStatus('battery', batteryVoltage)}
                      />
                    </div>
                  );
                })() : (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No records found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Schedule Tab */}
          <TabsContent value="maintenance">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  Maintenance Schedule
                  <span className="text-xs text-muted-foreground font-normal ml-auto">Upcoming and overdue services</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceSchedule.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No records found
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto border border-white/[0.08] rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#242424] z-10">
                        <tr className="border-b border-white/[0.08]">
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Service</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Next Due</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Miles Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceSchedule.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-white/[0.08]">
                            <td className="px-3 py-2 font-medium text-foreground">
                              {item.service || item.name || 'Scheduled Service'}
                            </td>
                            <td className="px-3 py-2">
                              {getStatusBadge(item.status || 'scheduled')}
                            </td>
                            <td className="px-3 py-2 text-foreground whitespace-nowrap">
                              {formatDate(item.nextDue || item.next_due || item.due_date)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono text-foreground">
                              {formatNumber(Number(item.milesDue || item.miles_due || 0))} mi
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Analysis Tab */}
          <TabsContent value="costs">
            <Card className="bg-[#242424] border-white/[0.08]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Cost Analysis
                  <span className="text-xs text-muted-foreground font-normal ml-auto">Lifetime costs and averages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {costAnalysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Total Costs Section */}
                    <div className="rounded-lg border border-white/[0.08] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Total Costs</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1.5 border-b border-white/[0.08]">
                          <span className="text-sm text-muted-foreground">Maintenance</span>
                          <span className="text-sm font-mono font-semibold text-foreground">{formatCurrency(costAnalysis.totalMaintenance)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-white/[0.08]">
                          <span className="text-sm text-muted-foreground">Fuel</span>
                          <span className="text-sm font-mono font-semibold text-foreground">
                            {costAnalysis.totalFuel != null ? formatCurrency(costAnalysis.totalFuel) : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-muted-foreground">Repairs</span>
                          <span className="text-sm font-mono font-semibold text-foreground">
                            {costAnalysis.totalRepairs != null ? formatCurrency(costAnalysis.totalRepairs) : '--'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Averages Section */}
                    <div className="rounded-lg border border-white/[0.08] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Averages</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1.5 border-b border-white/[0.08]">
                          <span className="text-sm text-muted-foreground">Monthly Cost</span>
                          <span className="text-sm font-mono font-semibold text-foreground">
                            {costAnalysis.averageMonthly != null ? formatCurrency(costAnalysis.averageMonthly) : '--'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-sm text-muted-foreground">Cost per Mile</span>
                          <span className="text-sm font-mono font-semibold text-foreground">{formatCurrency(costAnalysis.costPerMile)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                    No records found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
