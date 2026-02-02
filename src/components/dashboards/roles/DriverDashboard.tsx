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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, MapPin, Fuel, AlertTriangle, CheckCircle, PlayCircle, Clipboard, Clock, Route, Gauge, Calendar, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboardApi, dashboardQueryKeys } from '@/services/dashboardApi';
import type { DriverVehicle, DriverTrip } from '@/services/dashboardApi';
import logger from '@/utils/logger';

interface InspectionItem {
  id: string;
  label: string;
  completed: boolean;
}

export function DriverDashboard() {
  const navigate = useNavigate();
  const [driverName] = useState('John Smith');

  // React Query hooks for real-time data fetching
  const { data: vehicleData, isLoading: vehicleLoading, error: vehicleError } = useQuery({
    queryKey: dashboardQueryKeys.driverVehicle,
    queryFn: dashboardApi.getDriverVehicle,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: dashboardQueryKeys.driverTrips(new Date().toISOString().split('T')[0]),
    queryFn: () => dashboardApi.getDriverTrips(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Extract values with fallbacks for loading states
  const assignedVehicle: DriverVehicle = vehicleData ?? {
    id: 0,
    name: 'No vehicle assigned',
    year: 0,
    make: '',
    model: '',
    fuel_level: 0,
    mileage: 0,
    status: 'unavailable',
    last_inspection: 'N/A'
  };

  const todaysTrips: DriverTrip[] = tripsData ?? [];

  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    { id: 'tire_pressure', label: 'Tire Pressure', completed: false },
    { id: 'fluid_levels', label: 'Fluid Levels', completed: false },
    { id: 'lights_signals', label: 'Lights & Signals', completed: false },
    { id: 'brakes', label: 'Brakes', completed: false },
    { id: 'emergency_equipment', label: 'Emergency Equipment', completed: false }
  ]);

  // Quick actions - Now with proper navigation
  const handleStartTrip = (tripId: number) => {
    // Navigate to operations hub with trip start flow
    navigate('/operations-hub-consolidated', {
      state: { action: 'start-trip', tripId }
    });
    toast(`Starting Trip #${tripId}...`);
  };

  const handleLogFuel = () => {
    // Navigate to fleet hub with fuel logging view
    navigate('/fleet-hub-consolidated', {
      state: { action: 'log-fuel', vehicleId: assignedVehicle.id }
    });
    toast('Opening fuel log form...');
  };

  const handleReportIssue = () => {
    // Navigate to maintenance hub with incident report form
    navigate('/maintenance-hub-consolidated', {
      state: { action: 'report-issue', vehicleId: assignedVehicle.id }
    });
    toast('Opening incident report...');
  };

  const handleCompleteInspection = async () => {
    const allCompleted = inspectionItems.every(item => item.completed);
    if (!allCompleted) {
      toast.error('Please complete all inspection items');
      return;
    }

    toast.loading('Submitting inspection...');

    try {
      // Uncomment when API is ready:
      /*
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: assignedVehicle.id,
          inspection_items: inspectionItems.map(item => ({
            item: item.id,
            status: item.completed ? 'pass' : 'fail'
          })),
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('Inspection submission failed');
      */

      // Mock delay for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Pre-trip inspection completed!');

      // Reset checklist after successful submission
      setInspectionItems(prev =>
        prev.map(item => ({ ...item, completed: false }))
      );
    } catch (error) {
      logger.error('Inspection submission failed:', error);
      toast.error('Failed to submit inspection');
    }
  };

  const handleViewRoute = (tripId: number) => {
    // Navigate to operations hub with route map view
    navigate('/operations-hub-consolidated', {
      state: { action: 'view-route', tripId }
    });
    toast(`Loading route map for Trip #${tripId}...`);
  };

  const toggleInspectionItem = (itemId: string) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const allInspectionsDone = inspectionItems.every(item => item.completed);

  // Helper function to format ISO datetime to time string
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString; // Return original if parsing fails
    }
  };

  // Loading state - show spinner while fetching initial data
  if (vehicleLoading || tripsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-sm text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state - show error if vehicle data fails to load
  if (vehicleError) {
    return (
      <div className="min-h-screen bg-slate-900 p-2">
        <Alert variant="destructive" className="bg-red-950/50 border-red-500/50">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertTitle className="text-red-400">Error Loading Data</AlertTitle>
          <AlertDescription className="text-red-300">
            {vehicleError instanceof Error ? vehicleError.message : 'Failed to load your dashboard data'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-2">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-sm font-bold text-white mb-1">My Dashboard</h1>
        <p className="text-sm text-slate-700">Driver: {driverName}</p>
      </div>

      {/* Assigned Vehicle */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Car className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">My Assigned Vehicle</h2>
        </div>

        <div className="bg-slate-900/50 rounded-md p-2 border border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">
                {assignedVehicle.name}
              </h3>
              <p className="text-sm text-slate-300">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
            {/* Fuel Level */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-4 h-4 text-slate-700" />
                <span className="text-sm text-slate-300 text-sm">Fuel</span>
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
                <Gauge className="w-4 h-4 text-slate-700" />
                <span className="text-sm text-slate-300 text-sm">Mileage</span>
              </div>
              <p className="text-sm font-bold text-white">
                {assignedVehicle.mileage.toLocaleString()} mi
              </p>
            </div>

            {/* Last Inspection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-700" />
                <span className="text-sm text-slate-300 text-sm">Last Inspection</span>
              </div>
              <p className="text-sm font-bold text-white flex items-center gap-2">
                {assignedVehicle.last_inspection}
                <CheckCircle className="w-4 h-4 text-green-400" />
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Trips */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Route className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-white">Today's Trips</h2>
        </div>

        <div className="space-y-3">
          {todaysTrips.map((trip) => (
            <motion.div
              key={trip.id}
              whileHover={{ scale: 1.01 }}
              className="bg-slate-900/50 rounded-md p-2 border border-slate-700 hover:border-violet-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Trip #{trip.id} - {trip.route_name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
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
                    : "bg-slate-700 text-sm text-slate-300"
                )}>
                  {trip.status === 'pending' ? 'Ready to Start' : 'Scheduled'}
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-700 text-sm mb-3">
                <Clock className="w-4 h-4" />
                <span>
                  Scheduled: {formatTime(trip.scheduled_start)} - {formatTime(trip.scheduled_end)}
                </span>
              </div>

              <div className="flex gap-2">
                {trip.status === 'pending' && (
                  <Button size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleStartTrip(trip.id)}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Trip
                  </Button>
                )}
                <Button size="sm"
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
      <div className="mb-3 flex flex-wrap gap-3">
        <Button size="sm"
          onClick={handleLogFuel}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Fuel className="w-4 h-4 mr-2" />
          Log Fuel
        </Button>
        <Button size="sm"
          onClick={handleReportIssue}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
      </div>

      {/* Pre-Trip Inspection Checklist */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
        <div className="flex items-center gap-2 mb-3">
          <Clipboard className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Pre-Trip Inspection Checklist</h2>
        </div>

        <div className="space-y-2 mb-3">
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
                "w-4 h-4 rounded border-2 flex items-center justify-center",
                item.completed
                  ? "bg-green-500 border-green-500"
                  : "border-slate-600"
              )}>
                {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
              <span className={cn(
                "text-sm",
                item.completed ? "text-green-300 line-through" : "text-white"
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Button size="sm"
          onClick={handleCompleteInspection}
          disabled={!allInspectionsDone}
          className={cn(
            "w-full",
            allInspectionsDone
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-slate-700 text-slate-700 cursor-not-allowed"
          )}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Inspection
        </Button>
      </Card>
    </div>
  );
}