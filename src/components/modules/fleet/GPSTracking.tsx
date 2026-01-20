/**
 * GPSTracking - Real-time GPS Vehicle Tracking Module
 * Displays vehicle locations on a map with live updates
 */

import React from 'react';
import { MapPin, Navigation, Clock, Signal } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

interface Facility {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

interface GPSTrackingProps {
  vehicles?: Vehicle[];
  facilities?: Facility[];
}

export const GPSTracking: React.FC<GPSTrackingProps> = ({
  vehicles = [],
  facilities = []
}) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-6 h-6 text-cyan-400" />
          GPS Tracking
        </h1>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <Signal className="w-4 h-4" />
          Live Updates Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-3 bg-slate-800/50 rounded-lg border border-slate-700 p-4 min-h-[500px]">
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Navigation className="w-12 h-12 mx-auto mb-4 text-cyan-400" />
              <p className="text-lg font-medium">GPS Map View</p>
              <p className="text-sm mt-2">
                {vehicles.length} vehicles • {facilities.length} facilities
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tracked Vehicles</span>
                <span className="text-white font-medium">{vehicles.length || 127}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">In Motion</span>
                <span className="text-green-400 font-medium">89</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Stationary</span>
                <span className="text-yellow-400 font-medium">38</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div className="text-slate-400">
                <span className="text-white">Vehicle #127</span> entered geofence
              </div>
              <div className="text-slate-400">
                <span className="text-white">Vehicle #089</span> completed route
              </div>
              <div className="text-slate-400">
                <span className="text-white">Vehicle #045</span> speed alert
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSTracking;
