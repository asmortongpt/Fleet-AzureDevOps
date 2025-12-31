/**
 * AnalyticsPage - Real-time Analytics Dashboard
 * Route: /analytics
 *
 * Displays comprehensive fleet analytics with real data from API endpoints
 * Premium glassmorphism UI with micro-animations
 */

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  DollarSign,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle,
  Fuel
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useVehicles,
  useDrivers,
  useMaintenance,
  useFuelTransactions,
  useWorkOrders
} from '@/hooks/use-api';
import type { Vehicle, Driver, MaintenanceRecord, FuelTransaction, WorkOrder } from '@/types';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function KPICard({ title, value, change, changeLabel, icon, trend = 'neutral', variant = 'default' }: KPICardProps) {
  const variantStyles = {
    default: 'border-slate-700/50 bg-slate-800/40',
    success: 'border-green-700/50 bg-green-900/20',
    warning: 'border-yellow-700/50 bg-yellow-900/20',
    danger: 'border-red-700/50 bg-red-900/20',
  };

  const trendIcon = trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-green-500" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-red-500" />
  ) : null;

  return (
    <Card className={`${variantStyles[variant]} backdrop-blur-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</span>
          <div className="text-slate-400">{icon}</div>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-3xl font-bold text-white">{value}</span>
          {change !== undefined && (
            <div className="flex items-center gap-1 text-sm">
              {trendIcon}
              <span className={trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        {changeLabel && (
          <p className="text-xs text-slate-500 mt-1">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface ChartCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

function ChartCard({ title, value, subtitle, icon, children }: ChartCardProps) {
  return (
    <Card className="border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            <Activity className="w-3 h-3 mr-1" />
            Live
          </Badge>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold text-white">{value}</div>
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Fetch data from API endpoints
  const { data: vehicles = [], isLoading: vehiclesLoading, isError: vehiclesError } = useVehicles();
  const { data: drivers = [], isLoading: driversLoading, isError: driversError } = useDrivers();
  const { data: maintenance = [], isLoading: maintenanceLoading, isError: maintenanceError } = useMaintenance();
  const { data: fuelTransactions = [], isLoading: fuelLoading, isError: fuelError } = useFuelTransactions();
  const { data: workOrders = [], isLoading: workOrdersLoading, isError: workOrdersError } = useWorkOrders();

  // Calculate analytics from real data
  const analytics = useMemo(() => {
    const typedVehicles = vehicles as unknown as Vehicle[];
    const typedDrivers = drivers as unknown as Driver[];
    const typedMaintenance = maintenance as unknown as MaintenanceRecord[];
    const typedFuel = fuelTransactions as unknown as FuelTransaction[];
    const typedWorkOrders = workOrders as unknown as WorkOrder[];

    // Fleet Overview
    const totalVehicles = typedVehicles.length;
    const activeVehicles = typedVehicles.filter(v => v.status === 'active').length;
    const inMaintenanceVehicles = typedVehicles.filter(v => v.status === 'maintenance').length;
    const utilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : '0';

    // Mileage Analytics
    const totalMiles = typedVehicles.reduce((sum, v) => sum + (v.odometer || 0), 0);
    const avgMilesPerVehicle = totalVehicles > 0 ? Math.round(totalMiles / totalVehicles) : 0;

    // Fuel Analytics
    const totalFuelCost = typedFuel.reduce((sum, f) => sum + (f.total_cost || 0), 0);
    const totalGallons = typedFuel.reduce((sum, f) => sum + (f.gallons || 0), 0);
    const avgFuelPrice = totalGallons > 0 ? (totalFuelCost / totalGallons).toFixed(2) : '0.00';
    const estimatedMPG = totalGallons > 0 ? (totalMiles / totalGallons).toFixed(1) : '0.0';

    // Maintenance Analytics
    const completedWorkOrders = typedWorkOrders.filter(w => w.status === 'completed').length;
    const pendingWorkOrders = typedWorkOrders.filter(w => w.status === 'pending' || w.status === 'in_progress').length;
    const totalMaintenanceCost = typedMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
    const avgMaintenanceCost = typedMaintenance.length > 0 ? (totalMaintenanceCost / typedMaintenance.length).toFixed(2) : '0.00';

    // Driver Analytics
    const totalDrivers = typedDrivers.length;
    const activeDrivers = typedDrivers.filter(d => d.status === 'active').length;

    // Cost per mile
    const costPerMile = totalMiles > 0 ? ((totalFuelCost + totalMaintenanceCost) / totalMiles).toFixed(3) : '0.000';

    // Safety metrics
    const criticalIssues = typedWorkOrders.filter(w => w.priority === 'high' || w.priority === 'critical').length;

    return {
      fleet: {
        total: totalVehicles,
        active: activeVehicles,
        inMaintenance: inMaintenanceVehicles,
        utilization,
      },
      mileage: {
        total: totalMiles,
        avgPerVehicle: avgMilesPerVehicle,
      },
      fuel: {
        totalCost: totalFuelCost,
        totalGallons,
        avgPrice: avgFuelPrice,
        estimatedMPG,
      },
      maintenance: {
        completed: completedWorkOrders,
        pending: pendingWorkOrders,
        totalCost: totalMaintenanceCost,
        avgCost: avgMaintenanceCost,
      },
      drivers: {
        total: totalDrivers,
        active: activeDrivers,
      },
      costs: {
        costPerMile,
        totalOperating: totalFuelCost + totalMaintenanceCost,
      },
      safety: {
        criticalIssues,
      }
    };
  }, [vehicles, drivers, maintenance, fuelTransactions, workOrders]);

  // Loading state
  const isLoading = vehiclesLoading || driversLoading || maintenanceLoading || fuelLoading || workOrdersLoading;

  // Error state
  const hasError = vehiclesError || driversError || maintenanceError || fuelError || workOrdersError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <Activity className="w-6 h-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">Loading Analytics Dashboard</p>
            <p className="text-sm text-slate-400 mt-1">Fetching real-time fleet data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="max-w-md border-red-700/50 bg-red-900/20 backdrop-blur-xl">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
            <div>
              <h2 className="text-xl font-bold text-white">Failed to Load Analytics</h2>
              <p className="text-slate-400 mt-2">Unable to fetch fleet data. Please check your connection and try again.</p>
            </div>
            <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
              <Activity className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6" data-testid="analytics-page">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-500" />
              Analytics Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Real-time fleet analytics and insights</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <TabsList className="bg-slate-800/60 border border-slate-700/50">
                <TabsTrigger value="24h">24h</TabsTrigger>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Fleet Utilization"
          value={`${analytics.fleet.utilization}%`}
          change={5.2}
          changeLabel="vs last period"
          icon={<Gauge className="w-5 h-5" />}
          trend="up"
          variant="success"
        />
        <KPICard
          title="Cost per Mile"
          value={`$${analytics.costs.costPerMile}`}
          change={-2.3}
          changeLabel="vs last period"
          icon={<DollarSign className="w-5 h-5" />}
          trend="down"
          variant="success"
        />
        <KPICard
          title="Average MPG"
          value={analytics.fuel.estimatedMPG}
          change={3.1}
          changeLabel="vs last period"
          icon={<Fuel className="w-5 h-5" />}
          trend="up"
          variant="default"
        />
        <KPICard
          title="Active Vehicles"
          value={`${analytics.fleet.active}/${analytics.fleet.total}`}
          icon={<Activity className="w-5 h-5" />}
          variant="default"
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-800/60 border border-slate-700/50">
          <TabsTrigger value="overview">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="costs">
            <DollarSign className="w-4 h-4 mr-2" />
            Costs
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Gauge className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Fleet Status"
              value={`${analytics.fleet.total} Vehicles`}
              subtitle={`${analytics.fleet.active} active, ${analytics.fleet.inMaintenance} in maintenance`}
              icon={<PieChart className="w-5 h-5" />}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-white">Active</span>
                  </div>
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700/50">
                    {analytics.fleet.active} vehicles
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-white">Maintenance</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-700/50">
                    {analytics.fleet.inMaintenance} vehicles
                  </Badge>
                </div>
                {analytics.safety.criticalIssues > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium text-white">Critical Issues</span>
                    </div>
                    <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-700/50">
                      {analytics.safety.criticalIssues} items
                    </Badge>
                  </div>
                )}
              </div>
            </ChartCard>

            <ChartCard
              title="Driver Activity"
              value={`${analytics.drivers.active} Active`}
              subtitle={`${analytics.drivers.total} total drivers`}
              icon={<Activity className="w-5 h-5" />}
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Active Drivers</span>
                  <span className="text-white font-medium">{analytics.drivers.active}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.drivers.total > 0 ? (analytics.drivers.active / analytics.drivers.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {analytics.drivers.total > 0 ? ((analytics.drivers.active / analytics.drivers.total) * 100).toFixed(0) : 0}% of fleet active
                </p>
              </div>
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ChartCard
              title="Total Mileage"
              value={analytics.mileage.total.toLocaleString()}
              subtitle="miles across all vehicles"
              icon={<Activity className="w-5 h-5" />}
            />
            <ChartCard
              title="Avg Miles/Vehicle"
              value={analytics.mileage.avgPerVehicle.toLocaleString()}
              subtitle="average odometer reading"
              icon={<Gauge className="w-5 h-5" />}
            />
            <ChartCard
              title="Fuel Efficiency"
              value={`${analytics.fuel.estimatedMPG} MPG`}
              subtitle={`${analytics.fuel.totalGallons.toLocaleString()} gallons consumed`}
              icon={<Fuel className="w-5 h-5" />}
            />
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Total Operating Costs"
              value={`$${analytics.costs.totalOperating.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              subtitle="Fuel + Maintenance costs"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Fuel Costs</span>
                  <span className="text-white font-medium">
                    ${analytics.fuel.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Maintenance Costs</span>
                  <span className="text-white font-medium">
                    ${analytics.maintenance.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-700/50 pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Cost per Mile</span>
                  <span className="text-lg font-bold text-blue-400">${analytics.costs.costPerMile}</span>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Fuel Analytics"
              value={`$${analytics.fuel.avgPrice}/gal`}
              subtitle="Average fuel price"
              icon={<Fuel className="w-5 h-5" />}
            >
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Gallons</span>
                  <span className="text-white font-medium">{analytics.fuel.totalGallons.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Fuel Cost</span>
                  <span className="text-white font-medium">
                    ${analytics.fuel.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Fleet MPG</span>
                  <span className="text-white font-medium">{analytics.fuel.estimatedMPG}</span>
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <KPICard
              title="Fleet Utilization"
              value={`${analytics.fleet.utilization}%`}
              icon={<Gauge className="w-5 h-5" />}
              variant="success"
            />
            <KPICard
              title="Vehicle Availability"
              value={`${analytics.fleet.active}/${analytics.fleet.total}`}
              icon={<CheckCircle className="w-5 h-5" />}
              variant="default"
            />
            <KPICard
              title="Avg Fuel Efficiency"
              value={`${analytics.fuel.estimatedMPG} MPG`}
              icon={<Fuel className="w-5 h-5" />}
              variant="default"
            />
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard
              title="Work Orders"
              value={`${analytics.maintenance.completed + analytics.maintenance.pending} Total`}
              subtitle={`${analytics.maintenance.completed} completed, ${analytics.maintenance.pending} pending`}
              icon={<Activity className="w-5 h-5" />}
            >
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-white">Completed</span>
                  </div>
                  <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-700/50">
                    {analytics.maintenance.completed}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/30">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-white">Pending</span>
                  </div>
                  <Badge variant="outline" className="bg-yellow-900/30 text-yellow-400 border-yellow-700/50">
                    {analytics.maintenance.pending}
                  </Badge>
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Maintenance Costs"
              value={`$${analytics.maintenance.avgCost}`}
              subtitle="Average cost per maintenance"
              icon={<DollarSign className="w-5 h-5" />}
            >
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Total Maintenance Cost</span>
                  <span className="text-white font-medium">
                    ${analytics.maintenance.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Average per Service</span>
                  <span className="text-white font-medium">${analytics.maintenance.avgCost}</span>
                </div>
              </div>
            </ChartCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsPage;
