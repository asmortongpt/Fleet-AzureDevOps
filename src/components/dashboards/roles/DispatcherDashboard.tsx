/**
 * Dispatcher Dashboard - Workflow-Optimized View
 * Role: dispatcher (Level 4)
 *
 * Primary Focus:
 * - Active trips on live map
 * - Dispatch channels & communication
 * - Emergency alerts & response
 * - Route assignment & coordination
 */

import {
  MapTrifold,
  Radio,
  Siren,
  Path,
  CarSimple,
  Clock,
  CheckCircle,
  Warning,
  Users,
  Phone,
  ChatCircle,
  Lightning
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { AlertTriangle, Car, MessageCircle, Route, Zap } from 'lucide-react';
interface OperationStats {
  active_trips: number;
  en_route: number;
  delayed: number;
  completed_today: number;
}

interface DispatchChannel {
  id: string;
  name: string;
  listeners: number;
  status: 'active' | 'inactive';
  priority: 'high' | 'medium' | 'low';
}

interface ActiveTrip {
  id: number;
  vehicle_name: string;
  driver_name: string;
  route: string;
  status: 'active' | 'delayed' | 'en_route';
  eta: string;
}

export function DispatcherDashboard() {
  const [operationStats, setOperationStats] = useState<OperationStats>({
    active_trips: 48,
    en_route: 12,
    delayed: 3,
    completed_today: 67
  });

  const [dispatchChannels, setDispatchChannels] = useState<DispatchChannel[]>([
    { id: 'general', name: 'General', listeners: 12, status: 'active', priority: 'medium' },
    { id: 'emergency', name: 'Emergency', listeners: 2, status: 'active', priority: 'high' },
    { id: 'maintenance', name: 'Maintenance', listeners: 0, status: 'inactive', priority: 'low' }
  ]);

  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([
    {
      id: 4523,
      vehicle_name: 'Vehicle #1042',
      driver_name: 'John Smith',
      route: 'Downtown Delivery',
      status: 'en_route',
      eta: '10:45 AM'
    },
    {
      id: 4524,
      vehicle_name: 'Vehicle #1089',
      driver_name: 'Sarah Johnson',
      route: 'Supply Run',
      status: 'delayed',
      eta: '02:30 PM'
    },
    {
      id: 4525,
      vehicle_name: 'Vehicle #1103',
      driver_name: 'Mike Davis',
      route: 'North Route',
      status: 'active',
      eta: '11:15 AM'
    }
  ]);

  // Quick actions
  const handleOpenRadio = () => {
    toast.success('Opening dispatch radio interface...');
    // TODO: Open radio communication interface
  };

  const handleCreateEmergencyAlert = () => {
    toast.success('Opening emergency alert form...');
    // TODO: Open emergency alert creation
  };

  const handleCreateRoute = () => {
    toast.success('Opening route creation wizard...');
    // TODO: Navigate to route creation
  };

  const handleJoinChannel = (channelId: string) => {
    toast.success(`Joining ${channelId} channel...`);
    // TODO: Join dispatch channel
  };

  const handleContactDriver = (driverName: string) => {
    toast(`Contacting ${driverName}...`);
    // TODO: Open driver communication
  };

  const handleViewOnMap = () => {
    toast('Switching to full-screen map view...');
    // TODO: Navigate to map view
  };

  const handleFilterTrips = (filter: string) => {
    toast(`Filtering trips by: ${filter}`);
    // TODO: Apply filter to active trips
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-950/30 border-green-500/30';
      case 'delayed':
        return 'text-red-400 bg-red-950/30 border-red-500/30';
      case 'en_route':
        return 'text-blue-400 bg-blue-950/30 border-blue-500/30';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-2">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-white mb-1">Dispatch Console</h1>
          <p className="text-sm text-slate-400">Real-Time Operations & Coordination</p>
        </div>
        <Button size="sm"
          onClick={handleCreateEmergencyAlert}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Siren className="w-3 h-3 mr-2" />
          EMERGENCY
        </Button>
      </div>

      {/* Active Operations Summary */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-cyan-500/30 p-2 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">Active Operations</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Active Trips */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-cyan-950/30 rounded-md p-2 border border-cyan-500/30 hover:border-cyan-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-black text-white">{operationStats.active_trips}</span>
            </div>
            <p className="text-cyan-300 font-semibold">Active Trips</p>
          </motion.div>

          {/* En Route */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-blue-950/30 rounded-md p-2 border border-blue-500/30 hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <MapTrifold className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-black text-white">{operationStats.en_route}</span>
            </div>
            <p className="text-blue-300 font-semibold">En Route</p>
          </motion.div>

          {/* Delayed */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-red-950/30 rounded-md p-2 border border-red-500/30 hover:border-red-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-black text-white">{operationStats.delayed}</span>
            </div>
            <p className="text-red-300 font-semibold">Delayed</p>
          </motion.div>

          {/* Completed Today */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-green-950/30 rounded-md p-2 border border-green-500/30 hover:border-green-400/50 transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-black text-white">{operationStats.completed_today}</span>
            </div>
            <p className="text-green-300 font-semibold">Completed Today</p>
          </motion.div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-3 flex flex-wrap gap-3">
        <Button size="sm"
          onClick={handleOpenRadio}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Radio className="w-4 h-4 mr-2" />
          Open Radio
        </Button>
        <Button size="sm"
          onClick={handleCreateEmergencyAlert}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Siren className="w-4 h-4 mr-2" />
          Emergency Alert
        </Button>
        <Button size="sm"
          onClick={handleCreateRoute}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Route className="w-4 h-4 mr-2" />
          New Route
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Live Fleet Map */}
        <Card className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapTrifold className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Live Fleet Map</h2>
            </div>
            <div className="flex gap-2">
              <Button size="sm"
                variant="outline"
                className="border-slate-600 text-sm text-slate-300"
                onClick={() => handleFilterTrips('all')}
              >
                All
              </Button>
              <Button size="sm"
                variant="outline"
                className="border-blue-600 text-blue-400"
                onClick={() => handleFilterTrips('en_route')}
              >
                En Route
              </Button>
              <Button size="sm"
                variant="outline"
                className="border-red-600 text-red-400"
                onClick={() => handleFilterTrips('delayed')}
              >
                Delayed
              </Button>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="bg-slate-900/50 rounded-md border border-slate-700 aspect-video flex items-center justify-center mb-3">
            <div className="text-center">
              <MapTrifold className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-2">Interactive Fleet Map</p>
              <p className="text-sm text-slate-500">Google Maps with vehicle markers & routes</p>
            </div>
          </div>

          <Button size="sm"
            onClick={handleViewOnMap}
            variant="outline"
            className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
          >
            View Full-Screen Map
          </Button>
        </Card>

        {/* Active Trips List */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
          <div className="flex items-center gap-2 mb-3">
            <Route className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white">Active Trips</h2>
          </div>

          <div className="space-y-3">
            {activeTrips.map((trip) => (
              <div
                key={trip.id}
                className={cn(
                  "rounded-lg p-3 border transition-all",
                  getStatusColor(trip.status)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-white">#{trip.id}</p>
                    <p className="text-sm text-slate-300">{trip.vehicle_name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{trip.eta}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-2">{trip.route}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="w-3 h-3" />
                    <span>{trip.driver_name}</span>
                  </div>
                  <Button size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs hover:bg-slate-700"
                    onClick={() => handleContactDriver(trip.driver_name)}
                  >
                    <Phone className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Dispatch Channels */}
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-white">Active Dispatch Channels</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dispatchChannels.map((channel) => (
            <motion.div
              key={channel.id}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "rounded-md p-2 border transition-all",
                channel.status === 'active'
                  ? channel.priority === 'high'
                    ? "bg-red-950/30 border-red-500/30"
                    : "bg-green-950/30 border-green-500/30"
                  : "bg-slate-900/50 border-slate-700"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    channel.status === 'active' ? "bg-green-500 animate-pulse" : "bg-slate-500"
                  )} />
                  <span className="text-white font-bold">{channel.name}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="w-3 h-3" />
                  <span>{channel.listeners}</span>
                </div>
              </div>

              <Button size="sm"
                onClick={() => handleJoinChannel(channel.id)}
                className={cn(
                  "w-full",
                  channel.status === 'active'
                    ? channel.priority === 'high'
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-700 hover:bg-slate-600 text-sm text-slate-300"
                )}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {channel.status === 'active' ? 'Join' : 'Activate'}
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
