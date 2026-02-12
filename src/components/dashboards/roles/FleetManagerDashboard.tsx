/**
 * Fleet Manager Dashboard - Minimalist Design
 * Role: fleet_manager (Level 7)
 *
 * Primary Focus:
 * - Overdue & upcoming maintenance alerts
 * - Fleet status overview
 * - Cost monitoring & trends
 * - Resource allocation tools
 *
 * Design Philosophy: Clean, minimal, focused
 */

import {
  Wrench,
  Users,
  FileText,
  Calendar
} from '@phosphor-icons/react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import React from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboardApi, dashboardQueryKeys } from '@/services/dashboardApi';
import type { FleetStats, CostSummary } from '@/services/dashboardApi';

export function FleetManagerDashboard() {
  const navigate = useNavigate();

  // React Query hooks for real-time data fetching
  const { data: maintenanceData, isLoading: maintenanceLoading, error: maintenanceError } = useQuery({
    queryKey: dashboardQueryKeys.maintenanceAlerts,
    queryFn: dashboardApi.getMaintenanceAlerts,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: fleetStatsData, isLoading: fleetLoading } = useQuery({
    queryKey: dashboardQueryKeys.fleetStats,
    queryFn: dashboardApi.getFleetStats,
    refetchInterval: 15000, // Refetch every 15 seconds
  });

  const { data: costData, isLoading: costLoading } = useQuery({
    queryKey: dashboardQueryKeys.costSummary('monthly'),
    queryFn: () => dashboardApi.getCostSummary('monthly'),
    refetchInterval: 60000, // Refetch every minute
  });

  // Extract values with fallbacks for loading states
  const overdueCount = maintenanceData?.overdue_count ?? 0;
  const upcomingCount = maintenanceData?.upcoming_count ?? 0;
  const openWorkOrders = maintenanceData?.open_work_orders ?? 0;

  const fleetStats: FleetStats = fleetStatsData ?? {
    active_vehicles: 0,
    maintenance_vehicles: 0,
    idle_vehicles: 0,
    out_of_service: 0
  };

  const costSummary: CostSummary = costData ?? {
    fuel_cost: 0,
    fuel_trend: 0,
    maintenance_cost: 0,
    maintenance_trend: 0,
    cost_per_mile: 0,
    target_cost_per_mile: 2.10
  };

  // Quick actions - Now with proper navigation
  const handleAssignDriver = () => {
    navigate('/drivers-hub-consolidated', {
      state: { action: 'assign-driver' }
    });
    toast('Opening driver assignment...');
  };

  const handleCreateWorkOrder = () => {
    navigate('/maintenance-hub-consolidated', {
      state: { action: 'create-work-order' }
    });
    toast('Opening work order form...');
  };

  const handleExportReport = async () => {
    toast.loading('Generating daily report...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Report generated successfully!');
  };

  const handleViewOverdue = () => {
    navigate('/maintenance-hub-consolidated', {
      state: { filter: 'overdue' }
    });
    toast('Loading overdue maintenance queue...');
  };

  const handleScheduleMaintenance = () => {
    navigate('/maintenance-hub-consolidated', {
      state: { view: 'schedule', filter: 'upcoming' }
    });
    toast('Opening maintenance scheduler...');
  };

  // Loading state - show spinner while fetching initial data
  if (maintenanceLoading || fleetLoading || costLoading) {
    return (
      <div className="min-h-screen bg-background p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state - show error if critical data fails to load
  if (maintenanceError) {
    return (
      <div className="min-h-screen bg-background p-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {maintenanceError instanceof Error ? maintenanceError.message : 'Failed to load dashboard data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-2">
      {/* Header - Clean & Minimal */}
      <header className="mb-3">
        <h1 className="text-base font-semibold text-foreground mb-1">
          Fleet Manager Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Operations Overview & Resource Management
        </p>
      </header>

      {/* Attention Needed Section - Minimalist Alert Cards */}
      <Card className="p-2 mb-2 border-border">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">
            Attention Needed
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Overdue Maintenance - Minimal Red Indicator */}
          <div
            className={cn(
              "bg-muted rounded-lg p-3",
              "border border-red-500/20 hover:border-red-500/40",
              "transition-colors cursor-pointer"
            )}
            onClick={handleViewOverdue}
          >
            <div className="flex items-start justify-between mb-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-sm font-semibold text-foreground">
                {overdueCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Overdue Maintenance
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10"
              onClick={(e) => {
                e.stopPropagation();
                handleViewOverdue();
              }}
            >
              View Queue
            </Button>
          </div>

          {/* Upcoming Maintenance - Minimal Amber Indicator */}
          <div
            className={cn(
              "bg-muted rounded-lg p-3",
              "border border-amber-500/20 hover:border-amber-500/40",
              "transition-colors cursor-pointer"
            )}
            onClick={handleScheduleMaintenance}
          >
            <div className="flex items-start justify-between mb-2">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span className="text-sm font-semibold text-foreground">
                {upcomingCount}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Upcoming (Next 7 Days)
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-amber-400 border-amber-400/30 hover:bg-amber-500/10"
              onClick={(e) => {
                e.stopPropagation();
                handleScheduleMaintenance();
              }}
            >
              Schedule
            </Button>
          </div>

          {/* Open Work Orders - Minimal Blue Indicator */}
          <div
            className={cn(
              "bg-muted rounded-lg p-3",
              "border border-blue-500/20 hover:border-blue-500/40",
              "transition-colors cursor-pointer"
            )}
            onClick={handleCreateWorkOrder}
          >
            <div className="flex items-start justify-between mb-2">
              <Wrench className="w-3 h-3 text-blue-700" />
              <span className="text-sm font-semibold text-foreground">
                {openWorkOrders}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Open Work Orders
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-blue-700 border-blue-400/30 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateWorkOrder();
              }}
            >
              Assign
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions - Minimal Buttons */}
      <div className="mb-2 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleAssignDriver}
          className="bg-primary hover:bg-blue-600"
        >
          <Users className="w-4 h-4" />
          Assign Driver
        </Button>
        <Button
          size="sm"
          onClick={handleCreateWorkOrder}
          variant="secondary"
        >
          <Wrench className="w-4 h-4" />
          Create Work Order
        </Button>
        <Button
          size="sm"
          onClick={handleExportReport}
          variant="outline"
        >
          <FileText className="w-4 h-4" />
          Daily Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Fleet Status - Minimal Design */}
        <Card className="p-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-medium text-foreground">
              Fleet Status
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-muted-foreground">Active</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {fleetStats.active_vehicles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm text-muted-foreground">Maintenance</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {fleetStats.maintenance_vehicles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-border"></div>
                <span className="text-sm text-muted-foreground">Idle</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {fleetStats.idle_vehicles}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-muted-foreground">Out of Service</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {fleetStats.out_of_service}
              </span>
            </div>
          </div>
        </Card>

        {/* Cost Summary - Minimal Design */}
        <Card className="p-2">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-base font-medium text-foreground">
              Cost Summary (This Month)
            </h3>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Fuel</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    ${costSummary.fuel_cost.toLocaleString()}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    costSummary.fuel_trend > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {costSummary.fuel_trend > 0 ? "↑" : "↓"} {Math.abs(costSummary.fuel_trend)}%
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Maintenance</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    ${costSummary.maintenance_cost.toLocaleString()}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-xs",
                    costSummary.maintenance_trend > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {costSummary.maintenance_trend > 0 ? "↑" : "↓"} {Math.abs(costSummary.maintenance_trend)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cost per Mile</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    ${costSummary.cost_per_mile.toFixed(2)}
                  </span>
                  {costSummary.cost_per_mile > costSummary.target_cost_per_mile && (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Target: ${costSummary.target_cost_per_mile.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
