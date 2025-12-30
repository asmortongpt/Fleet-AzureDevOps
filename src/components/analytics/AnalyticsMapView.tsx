import {
  Activity,
  Gauge,
  Fuel,
  Clock,
  TrendingUp,
  TrendingDown,
  MapPin,
  Filter,
  Download
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { MapFirstLayout } from '@/components/layout/MapFirstLayout';
import { ProfessionalFleetMap } from '@/components/map/ProfessionalFleetMap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useVehicles } from '@/hooks/use-api';

interface AnalyticsMapViewProps {
  analyticsType: 'heatmap' | 'routes' | 'performance' | 'fuel';
  onVehicleSelect?: (vehicleId: string) => void;
}

interface VehicleMetrics {
  avgMPG: number;
  idleTime: number;
  speedViolations: number;
  fuelCost: number;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  make: string;
  model: string;
  status: string;
  latitude?: number;
  longitude?: number;
}

export function AnalyticsMapView({ analyticsType, onVehicleSelect }: AnalyticsMapViewProps) {
  const { data: vehicles = [], isLoading } = useVehicles();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter vehicles based on selected filters
  const filteredVehicles = useMemo(() => {
    if (statusFilter === 'all') return vehicles as Vehicle[];
    return (vehicles as Vehicle[]).filter((v: Vehicle) => v.status === statusFilter);
  }, [vehicles, statusFilter]);

  const selectedVehicle = (vehicles as Vehicle[]).find((v: Vehicle) => v.id === selectedVehicleId) || (vehicles as Vehicle[])[0];

  // Calculate aggregate metrics
  const metrics = useMemo((): VehicleMetrics => {
    // Demo data - in production, fetch from telemetry API
    return {
      avgMPG: 24.5,
      idleTime: 12.3,
      speedViolations: 3,
      fuelCost: 3.45
    };
  }, [filteredVehicles, timeRange]);

  // Get analytics overlay description
  const getAnalyticsDescription = () => {
    switch (analyticsType) {
      case 'heatmap':
        return 'Vehicle density and activity zones';
      case 'routes':
        return 'Optimized route visualization and efficiency';
      case 'performance':
        return 'Real-time performance metrics overlay';
      case 'fuel':
        return 'Fuel efficiency zones and consumption patterns';
      default:
        return 'Analytics overlay';
    }
  };

  const handleVehicleClick = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    onVehicleSelect?.(vehicleId);
  };

  // Map Component with Analytics Overlay
  const mapComponent = (
    <div className="relative w-full h-full" data-testid="analytics-map-container">
      <ProfessionalFleetMap onVehicleSelect={handleVehicleClick} />

      {/* Analytics Overlay Badge */}
      <div className="absolute top-4 left-4 z-10">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm font-semibold capitalize">{analyticsType} View</div>
                <div className="text-xs text-muted-foreground">{getAnalyticsDescription()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Overlay */}
      {analyticsType === 'performance' && (
        <div className="absolute bottom-4 left-4 z-10 space-y-2">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Avg MPG</div>
                  <div className="text-lg font-bold">{metrics.avgMPG}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Idle Time</div>
                  <div className="text-lg font-bold">{metrics.idleTime}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Fuel Efficiency Zones Overlay */}
      {analyticsType === 'fuel' && (
        <div className="absolute bottom-4 left-4 z-10">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Fuel className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-xs text-muted-foreground">Avg Fuel Cost</div>
                  <div className="text-lg font-bold">${metrics.fuelCost}/gal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  // Filter Sidebar Panel
  const sidePanel = (
    <div className="space-y-4" data-testid="analytics-filter-sidebar">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Analytics Filters</h2>
        <p className="text-sm text-muted-foreground mt-1">{getAnalyticsDescription()}</p>
      </div>

      <Separator />

      {/* Time Range Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Time Range</label>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger data-testid="analytics-time-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Vehicle Status</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger data-testid="analytics-status-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
            <SelectItem value="maintenance">In Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Metrics Summary */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Key Metrics</h3>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Avg MPG</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">{metrics.avgMPG}</span>
                <Badge variant="default" className="text-xs">
                  <TrendingUp className="h-3 w-3" />
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fuel className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Fuel Cost</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-bold">${metrics.fuelCost}</span>
                <Badge variant="destructive" className="text-xs">
                  <TrendingDown className="h-3 w-3" />
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Idle Time</span>
              </div>
              <span className="font-bold">{metrics.idleTime}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Speed Violations</span>
              </div>
              <Badge variant="secondary">{metrics.speedViolations}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Selected Vehicle Info */}
      {selectedVehicle && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Selected Vehicle</h3>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{selectedVehicle.vehicleNumber}</span>
                <Badge variant={selectedVehicle.status === 'active' ? 'default' : 'secondary'}>
                  {selectedVehicle.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
              </div>
              {selectedVehicle.latitude && selectedVehicle.longitude && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{selectedVehicle.latitude.toFixed(4)}, {selectedVehicle.longitude.toFixed(4)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
        <Button variant="outline" className="w-full justify-start" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Vehicle Count */}
      <div className="pt-2 border-t">
        <div className="text-xs text-muted-foreground text-center">
          Showing {(filteredVehicles as Vehicle[]).length} of {(vehicles as Vehicle[]).length} vehicles
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <MapFirstLayout
      mapComponent={mapComponent}
      sidePanel={sidePanel}
    />
  );
}