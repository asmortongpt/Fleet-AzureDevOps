/**
 * Analytics - Production Fleet Analytics Dashboard
 *
 * Real-time analytics powered by /api/dashboard endpoints
 * Shows key performance metrics and trends with professional visualizations
 */

import { BarChart3, RefreshCw, TrendingUp, AlertCircle, Activity, DollarSign, Wrench } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DashboardStats {
  total_vehicles: number;
  active_vehicles: number;
  maintenance_vehicles: number;
  idle_vehicles: number;
  total_drivers: number;
  active_drivers: number;
  open_work_orders: number;
  in_progress_work_orders: number;
  cached?: boolean;
  error?: string;
}

interface CostSummary {
  fuel_cost: number;
  fuel_trend: number;
  maintenance_cost: number;
  maintenance_trend: number;
  cost_per_mile: number;
  target_cost_per_mile: number;
  error?: string;
}

export function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [costs, setCosts] = useState<CostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsRes, costsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/costs/summary?period=monthly')
      ]);

      if (!statsRes.ok || !costsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const costsData = await costsRes.json();

      setStats(statsData);
      setCosts(costsData);
      setLastUpdated(new Date());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <BarChart3 className="w-6 h-6 text-blue-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Loading Analytics</p>
            <p className="text-sm text-slate-400 mt-2">Fetching real-time fleet data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-700/50">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Fleet Analytics</h1>
                <p className="text-sm text-slate-400">
                  Real-time fleet performance and operational metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-700/50">
                <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                Live Data
              </Badge>
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                className="border-slate-700 hover:bg-slate-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-400">Error Loading Data</p>
                <p className="text-xs text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {stats?.cached && (
            <div className="mt-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Showing cached data. Last updated {lastUpdated.toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Fleet Status Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Fleet Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Vehicles */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Total Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.total_vehicles || 0}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.active_vehicles || 0} active, {stats?.maintenance_vehicles || 0} in maintenance
                </p>
              </CardContent>
            </Card>

            {/* Active Vehicles */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  Active Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats?.active_vehicles || 0}</div>
                {stats?.total_vehicles ? (
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.round((stats.active_vehicles / stats.total_vehicles) * 100)}% utilization
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {/* Maintenance Vehicles */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  In Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-400">{stats?.maintenance_vehicles || 0}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.open_work_orders || 0} open work orders
                </p>
              </CardContent>
            </Card>

            {/* Idle Vehicles */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Idle Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-400">{stats?.idle_vehicles || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Not in active use</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Drivers Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Driver Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Total Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.total_drivers || 0}</div>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.active_drivers || 0} active
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Active Drivers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats?.active_drivers || 0}</div>
                {stats?.total_drivers ? (
                  <p className="text-xs text-slate-400 mt-1">
                    {Math.round((stats.active_drivers / stats.total_drivers) * 100)}% on duty
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cost Analysis */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Cost Analysis (Monthly)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fuel Costs */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-400" />
                  Fuel Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  ${(costs?.fuel_cost || 0).toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${(costs?.fuel_trend || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {(costs?.fuel_trend || 0) > 0 ? '+' : ''}{costs?.fuel_trend || 0}% vs previous period
                </p>
              </CardContent>
            </Card>

            {/* Maintenance Costs */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Maintenance Costs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  ${(costs?.maintenance_cost || 0).toLocaleString()}
                </div>
                <p className={`text-xs mt-1 ${(costs?.maintenance_trend || 0) >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {(costs?.maintenance_trend || 0) > 0 ? '+' : ''}{costs?.maintenance_trend || 0}% vs previous period
                </p>
              </CardContent>
            </Card>

            {/* Cost Per Mile */}
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Cost Per Mile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  ${(costs?.cost_per_mile || 0).toFixed(2)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Target: ${costs?.target_cost_per_mile || 2.10}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Work Orders Summary */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Maintenance Workload</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">Open Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats?.open_work_orders || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Pending or scheduled</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-300">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">{stats?.in_progress_work_orders || 0}</div>
                <p className="text-xs text-slate-400 mt-1">Currently being serviced</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Last Updated Footer */}
        <div className="text-center text-xs text-slate-400 mt-8">
          <p>Last updated: {lastUpdated.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
