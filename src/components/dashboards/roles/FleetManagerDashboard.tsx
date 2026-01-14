/**
 * Fleet Manager Dashboard - Workflow-Optimized View
 * Role: fleet_manager (Level 7)
 *
 * Primary Focus:
 * - Overdue & upcoming maintenance alerts
 * - Fleet status overview
 * - Cost monitoring & trends
 * - Resource allocation tools
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Warning,
  Wrench,
  TrendUp,
  Lightning,
  Users,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MaintenanceAlert {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  type: string;
  days_overdue?: number;
  scheduled_date?: string;
}

interface FleetStats {
  active_vehicles: number;
  maintenance_vehicles: number;
  idle_vehicles: number;
  out_of_service: number;
}

interface CostSummary {
  fuel_cost: number;
  fuel_trend: number;
  maintenance_cost: number;
  maintenance_trend: number;
  cost_per_mile: number;
  target_cost_per_mile: number;
}

export function FleetManagerDashboard() {
  const navigate = useNavigate();

  const [overdueCount, setOverdueCount] = useState(5);
  const [upcomingCount, setUpcomingCount] = useState(12);
  const [openWorkOrders, setOpenWorkOrders] = useState(8);
  const [fleetStats, setFleetStats] = useState<FleetStats>({
    active_vehicles: 142,
    maintenance_vehicles: 18,
    idle_vehicles: 5,
    out_of_service: 3
  });
  const [costSummary, setCostSummary] = useState<CostSummary>({
    fuel_cost: 42315,
    fuel_trend: 12,
    maintenance_cost: 18230,
    maintenance_trend: -5,
    cost_per_mile: 2.34,
    target_cost_per_mile: 2.10
  });

  // Load data on mount (API integration pattern)
  useEffect(() => {
    // Example: Fetch real data from API
    /*
    const fetchDashboardData = async () => {
      try {
        const [maintenanceRes, fleetRes, costRes] = await Promise.all([
          fetch('/api/maintenance/alerts'),
          fetch('/api/fleet/stats'),
          fetch('/api/costs/summary?period=monthly')
        ]);

        const maintenanceData = await maintenanceRes.json();
        const fleetData = await fleetRes.json();
        const costData = await costRes.json();

        setOverdueCount(maintenanceData.overdue_count);
        setUpcomingCount(maintenanceData.upcoming_count);
        setOpenWorkOrders(maintenanceData.open_work_orders);
        setFleetStats(fleetData);
        setCostSummary(costData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchDashboardData();
    */
  }, []);

  // Quick actions - Now with proper navigation
  const handleAssignDriver = () => {
    // Navigate to drivers hub with assignment mode
    navigate('/drivers-hub-consolidated', {
      state: { action: 'assign-driver' }
    });
    toast.info('Opening driver assignment...');
  };

  const handleCreateWorkOrder = () => {
    // Navigate to maintenance hub with create work order action
    navigate('/maintenance-hub-consolidated', {
      state: { action: 'create-work-order' }
    });
    toast.info('Opening work order form...');
  };

  const handleExportReport = async () => {
    // Example: Export functionality with API call
    toast.loading('Generating daily report...');

    try {
      // Uncomment when API is ready:
      /*
      const response = await fetch('/api/reports/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date().toISOString() })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fleet-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      */

      // Mock delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to generate report');
    }
  };

  const handleViewOverdue = () => {
    // Navigate to maintenance hub with overdue filter pre-applied
    navigate('/maintenance-hub-consolidated', {
      state: { filter: 'overdue' }
    });
    toast.info('Loading overdue maintenance queue...');
  };

  const handleScheduleMaintenance = () => {
    // Navigate to maintenance hub with scheduler view
    navigate('/maintenance-hub-consolidated', {
      state: { view: 'schedule', filter: 'upcoming' }
    });
    toast.info('Opening maintenance scheduler...');
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Fleet Manager Dashboard</h1>
        <p className="text-slate-400">Operations Overview & Resource Management</p>
      </div>

      {/* Attention Needed Section */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-red-500/30 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h2 className="text-xl font-bold text-white">Attention Needed</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overdue Maintenance */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "bg-red-950/30 rounded-xl p-4 border border-red-500/30",
              "hover:border-red-400/50 transition-all cursor-pointer"
            )}
            onClick={handleViewOverdue}
          >
            <div className="flex items-start justify-between mb-2">
              <Warning className="w-8 h-8 text-red-400" />
              <span className="text-3xl font-black text-white">{overdueCount}</span>
            </div>
            <p className="text-red-300 font-semibold mb-1">Overdue Maintenance</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={(e) => {
                e.stopPropagation();
                handleViewOverdue();
              }}
            >
              View Queue
            </Button>
          </motion.div>

          {/* Upcoming Maintenance */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "bg-amber-950/30 rounded-xl p-4 border border-amber-500/30",
              "hover:border-amber-400/50 transition-all cursor-pointer"
            )}
            onClick={handleScheduleMaintenance}
          >
            <div className="flex items-start justify-between mb-2">
              <Calendar className="w-8 h-8 text-amber-400" />
              <span className="text-3xl font-black text-white">{upcomingCount}</span>
            </div>
            <p className="text-amber-300 font-semibold mb-1">Upcoming (Next 7 Days)</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-amber-400 text-amber-400 hover:bg-amber-400/10"
              onClick={(e) => {
                e.stopPropagation();
                handleScheduleMaintenance();
              }}
            >
              Schedule
            </Button>
          </motion.div>

          {/* Open Work Orders */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              "bg-blue-950/30 rounded-xl p-4 border border-blue-500/30",
              "hover:border-blue-400/50 transition-all cursor-pointer"
            )}
            onClick={handleCreateWorkOrder}
          >
            <div className="flex items-start justify-between mb-2">
              <Wrench className="w-8 h-8 text-blue-400" />
              <span className="text-3xl font-black text-white">{openWorkOrders}</span>
            </div>
            <p className="text-blue-300 font-semibold mb-1">Open Work Orders</p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-blue-400 text-blue-400 hover:bg-blue-400/10"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateWorkOrder();
              }}
            >
              Assign
            </Button>
          </motion.div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={handleAssignDriver}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Users className="w-4 h-4 mr-2" />
          Assign Driver
        </Button>
        <Button
          onClick={handleCreateWorkOrder}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Create Work Order
        </Button>
        <Button
          onClick={handleExportReport}
          className="bg-slate-600 hover:bg-slate-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Daily Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Status */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Fleet Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-300">Active</span>
              </div>
              <span className="text-2xl font-bold text-white">{fleetStats.active_vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-slate-300">Maintenance</span>
              </div>
              <span className="text-2xl font-bold text-white">{fleetStats.maintenance_vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                <span className="text-slate-300">Idle</span>
              </div>
              <span className="text-2xl font-bold text-white">{fleetStats.idle_vehicles}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-300">Out of Service</span>
              </div>
              <span className="text-2xl font-bold text-white">{fleetStats.out_of_service}</span>
            </div>
          </div>
        </Card>

        {/* Cost Summary */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Cost Summary (This Month)</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">Fuel</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    ${costSummary.fuel_cost.toLocaleString()}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    costSummary.fuel_trend > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {costSummary.fuel_trend > 0 ? "↑" : "↓"} {Math.abs(costSummary.fuel_trend)}%
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-300">Maintenance</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    ${costSummary.maintenance_cost.toLocaleString()}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    costSummary.maintenance_trend > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {costSummary.maintenance_trend > 0 ? "↑" : "↓"} {Math.abs(costSummary.maintenance_trend)}%
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Cost per Mile</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">
                    ${costSummary.cost_per_mile.toFixed(2)}
                  </span>
                  {costSummary.cost_per_mile > costSummary.target_cost_per_mile && (
                    <Warning className="w-5 h-5 text-amber-400" />
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Target: ${costSummary.target_cost_per_mile.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
