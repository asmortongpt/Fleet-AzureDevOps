/**
 * Maintenance Manager Dashboard - Workflow-Optimized View
 * Role: maintenance_manager (Level 4)
 *
 * Primary Focus:
 * - Work order queue management
 * - Overdue maintenance alerts
 * - Upcoming maintenance schedule
 * - Parts inventory tracking
 */

import {
  Wrench,
  Calendar,
  Package,
  Warning,
  CheckCircle,
  Clock,
  ListChecks,
  CarSimple
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WorkOrderStats {
  open: number;
  in_progress: number;
  completed_this_week: number;
  avg_repair_time_hours: number;
}

interface MaintenanceItem {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  maintenance_type: string;
  days_overdue?: number;
  scheduled_date?: string;
  status: 'overdue' | 'upcoming';
}

interface UpcomingMaintenance {
  date: string;
  count: number;
}

interface PartsInventory {
  total_items: number;
  below_reorder: number;
  in_stock: number;
}

export function MaintenanceManagerDashboard() {
  const [workOrderStats, setWorkOrderStats] = useState<WorkOrderStats>({
    open: 8,
    in_progress: 5,
    completed_this_week: 23,
    avg_repair_time_hours: 4.2
  });

  const [overdueMaintenanceItems, setOverdueMaintenanceItems] = useState<MaintenanceItem[]>([
    {
      id: 1,
      vehicle_id: 1042,
      vehicle_name: 'Vehicle #1042',
      maintenance_type: 'Oil Change',
      days_overdue: 5,
      status: 'overdue'
    },
    {
      id: 2,
      vehicle_id: 1089,
      vehicle_name: 'Vehicle #1089',
      maintenance_type: 'Tire Rotation',
      days_overdue: 3,
      status: 'overdue'
    },
    {
      id: 3,
      vehicle_id: 1103,
      vehicle_name: 'Vehicle #1103',
      maintenance_type: 'Brake Inspection',
      days_overdue: 2,
      status: 'overdue'
    }
  ]);

  const [upcomingSchedule, setUpcomingSchedule] = useState<UpcomingMaintenance[]>([
    { date: 'Mon 1/15', count: 4 },
    { date: 'Tue 1/16', count: 2 },
    { date: 'Thu 1/18', count: 6 }
  ]);

  const [partsInventory, setPartsInventory] = useState<PartsInventory>({
    total_items: 48,
    below_reorder: 3,
    in_stock: 45
  });

  // Quick actions
  const handleCreateWorkOrder = (vehicleId?: number) => {
    if (vehicleId) {
      toast.success(`Creating work order for Vehicle #${vehicleId}...`);
    } else {
      toast.success('Opening work order creation form...');
    }
    // TODO: Open work order creation dialog
  };

  const handleSchedulePM = () => {
    toast.success('Opening preventive maintenance scheduler...');
    // TODO: Navigate to PM scheduler
  };

  const handleSearchParts = () => {
    toast.success('Opening parts search interface...');
    // TODO: Navigate to parts inventory
  };

  const handleAssignMechanic = () => {
    toast('Opening mechanic assignment dialog...');
    // TODO: Open mechanic assignment
  };

  const handleViewQueue = () => {
    toast('Navigating to work order queue...');
    // TODO: Navigate to work order page
  };

  const handleViewCalendar = () => {
    toast('Opening maintenance calendar...');
    // TODO: Navigate to calendar view
  };

  const handleReorderParts = () => {
    toast.success('Opening parts reorder form...');
    // TODO: Navigate to parts reorder
  };

  return (
    <div className="min-h-screen bg-slate-900 p-2">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-white mb-1">Maintenance Dashboard</h1>
          <p className="text-sm text-slate-400">Work Order Management & Preventive Maintenance</p>
        </div>
        <Button size="sm"
          onClick={handleViewCalendar}
          variant="outline"
          className="border-violet-400 text-violet-400 hover:bg-violet-400/10"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Calendar
        </Button>
      </div>

      {/* Work Queue Summary */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-amber-500/30 p-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Work Queue</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Open Work Orders */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-950/30 rounded-md p-2 border border-red-500/30 hover:border-red-400/50 transition-all cursor-pointer"
            onClick={handleViewQueue}
          >
            <div className="flex items-start justify-between mb-2">
              <ListChecks className="w-4 h-4 text-red-400" />
              <span className="text-sm font-black text-white">{workOrderStats.open}</span>
            </div>
            <p className="text-red-300 font-semibold mb-1">Open</p>
            <Button size="sm"
              variant="outline"
              className="w-full border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={(e) => {
                e.stopPropagation();
                handleAssignMechanic();
              }}
            >
              Assign Now
            </Button>
          </motion.div>

          {/* In Progress */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-blue-950/30 rounded-md p-2 border border-blue-500/30 hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <Wrench className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-black text-white">{workOrderStats.in_progress}</span>
            </div>
            <p className="text-blue-300 font-semibold">In Progress</p>
          </motion.div>

          {/* Completed This Week */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-950/30 rounded-md p-2 border border-green-500/30 hover:border-green-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-black text-white">{workOrderStats.completed_this_week}</span>
            </div>
            <p className="text-green-300 font-semibold">Completed</p>
            <p className="text-xs text-green-400/70 mt-1">This Week</p>
          </motion.div>

          {/* Avg Repair Time */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-violet-950/30 rounded-md p-2 border border-violet-500/30 hover:border-violet-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-black text-white">{workOrderStats.avg_repair_time_hours}</span>
            </div>
            <p className="text-violet-300 font-semibold">Avg Hours</p>
            <p className="text-xs text-violet-400/70 mt-1">Per Repair</p>
          </motion.div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-3 flex flex-wrap gap-3">
        <Button size="sm"
          onClick={() => handleCreateWorkOrder()}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Wrench className="w-4 h-4 mr-2" />
          Create Work Order
        </Button>
        <Button size="sm"
          onClick={handleSchedulePM}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Schedule PM
        </Button>
        <Button size="sm"
          onClick={handleSearchParts}
          className="bg-slate-600 hover:bg-slate-700 text-white"
        >
          <Package className="w-4 h-4 mr-2" />
          Parts Search
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Overdue Maintenance */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Warning className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">
                Overdue Maintenance ({overdueMaintenanceItems.length} Vehicles)
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            {overdueMaintenanceItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.01 }}
                className="bg-red-950/20 rounded-lg p-2 border border-red-500/30 hover:border-red-400/50 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <CarSimple className="w-4 h-4 text-red-400" />
                    <div>
                      <p className="font-bold text-white">{item.vehicle_name}</p>
                      <p className="text-sm text-slate-300">{item.maintenance_type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-red-400 font-bold text-sm">
                      {item.days_overdue} days
                    </span>
                    <p className="text-xs text-red-400/70">overdue</p>
                  </div>
                </div>

                <Button size="sm"
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => handleCreateWorkOrder(item.vehicle_id)}
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Create Work Order
                </Button>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Upcoming Maintenance & Parts Inventory */}
        <div className="space-y-2">
          {/* Upcoming Maintenance */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Upcoming Maintenance (Next 7 Days)</h2>
            </div>

            <div className="space-y-3">
              {upcomingSchedule.map((schedule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3 border border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-9 bg-cyan-950/50 rounded-lg flex items-center justify-center border border-cyan-500/30">
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{schedule.date}</p>
                      <p className="text-sm text-slate-400">{schedule.count} vehicles scheduled</p>
                    </div>
                  </div>
                  <Button size="sm"
                    variant="outline"
                    className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>

            <Button size="sm"
              onClick={handleViewCalendar}
              variant="outline"
              className="w-full mt-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
            >
              View Full Calendar
            </Button>
          </Card>

          {/* Parts Inventory Status */}
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Parts Inventory Status</h2>
            </div>

            <div className="space-y-3">
              {/* Below Reorder Level */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "rounded-lg p-2 border transition-all cursor-pointer",
                  partsInventory.below_reorder > 0
                    ? "bg-amber-950/30 border-amber-500/30 hover:border-amber-400/50"
                    : "bg-slate-900/50 border-slate-700"
                )}
                onClick={handleReorderParts}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Warning className="w-4 h-4 text-amber-400" />
                    <span className="text-sm text-slate-300">Below Reorder Level</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {partsInventory.below_reorder}
                  </span>
                </div>
                {partsInventory.below_reorder > 0 && (
                  <Button size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorderParts();
                    }}
                  >
                    View & Reorder
                  </Button>
                )}
              </motion.div>

              {/* In Stock */}
              <div className="bg-green-950/30 rounded-lg p-2 border border-green-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-slate-300">In Stock</span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {partsInventory.in_stock}
                  </span>
                </div>
              </div>

              {/* Total Items */}
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Total Inventory Items</span>
                  <span className="text-sm font-bold text-white">
                    {partsInventory.total_items}
                  </span>
                </div>
              </div>
            </div>

            <Button size="sm"
              onClick={handleSearchParts}
              variant="outline"
              className="w-full mt-2 border-violet-400 text-violet-400 hover:bg-violet-400/10"
            >
              <Package className="w-4 h-4 mr-2" />
              Search Parts Inventory
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}