/**
 * FleetDashboard - Fleet Overview Dashboard Module
 * Provides real-time fleet status and metrics
 */

import { Car, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';

export const FleetDashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Car className="w-6 h-6 text-cyan-400" />
          Fleet Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-slate-400">Active Vehicles</p>
              <p className="text-2xl font-bold text-white">127</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-cyan-400" />
            <div>
              <p className="text-sm text-slate-400">Available</p>
              <p className="text-2xl font-bold text-white">89</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-slate-400">In Maintenance</p>
              <p className="text-2xl font-bold text-white">23</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-slate-400">Alerts</p>
              <p className="text-2xl font-bold text-white">5</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Fleet Overview</h2>
        <p className="text-slate-400">
          Monitor your entire fleet from this dashboard. View real-time vehicle locations,
          status updates, and performance metrics.
        </p>
      </div>
    </div>
  );
};

export default FleetDashboard;
