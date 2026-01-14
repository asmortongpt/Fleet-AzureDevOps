/**
 * Driver Dashboard - Workflow-Optimized View
 * Role: driver (Level 2)
 *
 * Primary Focus:
 * - My assigned vehicle status
 * - Today's trips & schedule
 * - Pre-trip inspection checklist
 * - Quick access to common driver tasks
 */

import React, { useState, useEffect } from 'react';
import {
  Car,
  MapPin,
  GasPump,
  Warning,
  CheckCircle,
  PlayCircle,
  ClipboardText,
  Clock,
  Route,
  Gauge,
  Calendar
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AssignedVehicle {
  id: number;
  name: string;
  year: number;
  make: string;
  model: string;
  fuel_level: number;
  mileage: number;
  status: string;
  last_inspection: string;
}

interface Trip {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
}

interface InspectionItem {
  id: string;
  label: string;
  completed: boolean;
}

export function DriverDashboard() {
  const [driverName] = useState('John Smith');
  const [assignedVehicle, setAssignedVehicle] = useState<AssignedVehicle>({
    id: 1042,
    name: 'Vehicle #1042',
    year: 2022,
    make: 'Ford',
    model: 'F-150',
    fuel_level: 80,
    mileage: 45230,
    status: 'ready',
    last_inspection: '2026-01-10'
  });

  const [todaysTrips, setTodaysTrips] = useState<Trip[]>([
    {
      id: 4523,
      route_name: 'Downtown Delivery',
      origin: '123 Main St',
      destination: '456 Oak Ave',
      scheduled_start: '09:00 AM',
      scheduled_end: '11:30 AM',
      status: 'pending'
    },
    {
      id: 4524,
      route_name: 'Supply Run',
      origin: 'Warehouse',
      destination: '789 Pine Rd',
      scheduled_start: '02:00 PM',
      scheduled_end: '04:00 PM',
      status: 'scheduled'
    }
  ]);

  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { id: 'tire_pressure', label: 'Tire Pressure', completed: false },
    { id: 'fluid_levels', label: 'Fluid Levels', completed: false },
    { id: 'lights_signals', label: 'Lights & Signals', completed: false },
    { id: 'brakes', label: 'Brakes', completed: false },
    { id: 'emergency_equipment', label: 'Emergency Equipment', completed: false }
  ]);

  // Quick actions
  const handleStartTrip = (tripId: number) => {
    toast.success(`Starting Trip #${tripId}...`);
    // TODO: Navigate to trip start flow
  };

  const handleLogFuel = () => {
    toast.success('Opening fuel log form...');
    // TODO: Open fuel entry dialog
  };

  const handleReportIssue = () => {
    toast.success('Opening incident report form...');
    // TODO: Open incident reporting
  };

  const handleCompleteInspection = () => {
    const allCompleted = inspectionItems.every(item => item.completed);
    if (!allCompleted) {
      toast.error('Please complete all inspection items');
      return;
    }
    toast.success('Pre-trip inspection completed!');
    // TODO: Submit inspection to backend
  };

  const handleViewRoute = (tripId: number) => {
    toast.info(`Loading route map for Trip #${tripId}...`);
    // TODO: Navigate to route view
  };

  const toggleInspectionItem = (itemId: string) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const allInspectionsDone = inspectionItems.every(item => item.completed);

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">My Dashboard</h1>
        <p className="text-slate-400">Driver: {driverName}</p>
      </div>

      {/* Assigned Vehicle */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Car className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-white">My Assigned Vehicle</h2>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {assignedVehicle.name}
              </h3>
              <p className="text-slate-300">
                {assignedVehicle.year} {assignedVehicle.make} {assignedVehicle.model}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-semibold",
              assignedVehicle.status === 'ready'
                ? "bg-green-950/50 text-green-400 border border-green-500/30"
                : "bg-amber-950/50 text-amber-400 border border-amber-500/30"
            )}>
              {assignedVehicle.status === 'ready' ? '✅ Ready' : '⚠️ Check Required'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Fuel Level */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GasPump className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300 text-sm">Fuel</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${assignedVehicle.fuel_level}%` }}
                  />
                </div>
                <span className="text-white font-bold">{assignedVehicle.fuel_level}%</span>
              </div>
            </div>

            {/* Mileage */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300 text-sm">Mileage</span>
              </div>
              <p className="text-xl font-bold text-white">
                {assignedVehicle.mileage.toLocaleString()} mi
              </p>
            </div>

            {/* Last Inspection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span className="text-slate-300 text-sm">Last Inspection</span>
              </div>
              <p className="text-xl font-bold text-white flex items-center gap-2">
                {assignedVehicle.last_inspection}
                <CheckCircle className="w-5 h-5 text-green-400" />
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Trips */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Route className="w-6 h-6 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Today's Trips</h2>
        </div>

        <div className="space-y-3">
          {todaysTrips.map((trip) => (
            <motion.div
              key={trip.id}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-900/50 rounded-xl p-4 border border-slate-700 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Trip #{trip.id} - {trip.route_name}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {trip.origin} → {trip.destination}
                    </span>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  trip.status === 'pending'
                    ? "bg-green-950/50 text-green-400 border border-green-500/30"
                    : "bg-slate-700 text-slate-300"
                )}>
                  {trip.status === 'pending' ? 'Ready to Start' : 'Scheduled'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                <Clock className="w-4 h-4" />
                <span>
                  Scheduled: {trip.scheduled_start} - {trip.scheduled_end}
                </span>
              </div>

              <div className="flex gap-2">
                {trip.status === 'pending' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStartTrip(trip.id)}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-violet-400 text-violet-400 hover:bg-violet-400/10"
                  onClick={() => handleViewRoute(trip.id)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View Route
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          onClick={handleLogFuel}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <GasPump className="w-4 h-4 mr-2" />
          Log Fuel
        </Button>
        <Button
          onClick={handleReportIssue}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Warning className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Pre-Trip Inspection Checklist */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardText className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Pre-Trip Inspection Checklist</h2>
        </div>

        <div className="space-y-2 mb-4">
          {inspectionItems.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleInspectionItem(item.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                item.completed
                  ? "bg-green-950/30 border border-green-500/30"
                  : "bg-slate-900/50 border border-slate-700 hover:border-slate-600"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded border-2 flex items-center justify-center",
                item.completed
                  ? "bg-green-500 border-green-500"
                  : "border-slate-600"
              )}>
                {item.completed && <CheckCircle className="w-5 h-5 text-white" weight="fill" />}
              </div>
              <span className={cn(
                "text-lg",
                item.completed ? "text-green-300 line-through" : "text-white"
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleCompleteInspection}
          disabled={!allInspectionsDone}
          className={cn(
            "w-full",
            allInspectionsDone
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Inspection
        </Button>
      </Card>
    </div>
  );
}
