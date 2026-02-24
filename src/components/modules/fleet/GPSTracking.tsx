/**
 * GPSTracking - Real-time GPS Vehicle Tracking Module
 * Displays vehicle locations on an interactive Leaflet map with live updates
 */

import { MapPin, Clock, Signal, AlertCircle } from 'lucide-react';
import React from 'react';

import { LeafletMap } from '@/components/LeafletMap';
import type { Vehicle as FullVehicle, GISFacility } from '@/lib/types';
import { brandColors, colors } from '@/theme/designSystem';

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
  const inMotion = vehicles.filter((vehicle) => {
    const status = String(vehicle.status || '').toLowerCase()
    return ['active', 'in_use', 'en_route', 'moving'].includes(status)
  }).length
  const stationary = Math.max(vehicles.length - inMotion, 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: brandColors.archon.black }}>
          <MapPin className="w-6 h-6" style={{ color: brandColors.cta.orange }} />
          GPS Tracking
        </h1>
        <div className="flex items-center gap-2 text-sm" style={{ color: colors.success[500] }}>
          <Signal className="w-4 h-4" />
          Live Updates Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Real Map Area */}
        <div
          className="lg:col-span-3 rounded-lg border overflow-hidden min-h-[500px]"
          style={{
            borderColor: `${brandColors.cta.navy}20`,
          }}
        >
          {vehicles.length > 0 ? (
            <LeafletMap
              vehicles={vehicles.map(v => ({
                id: v.id,
                name: v.name,
                latitude: v.latitude || 25.7617,
                longitude: v.longitude || -80.1918,
                status: v.status || 'active'
              })) as unknown as FullVehicle[]}
              facilities={facilities as unknown as GISFacility[]}
              zoom={12}
              center={[25.7617, -80.1918]} // Miami default
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700">No Vehicles Available</p>
                <p className="text-sm mt-2 text-gray-500">
                  Load vehicles to display on map
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: brandColors.archon.lightGray,
              borderColor: `${brandColors.cta.navy}20`,
            }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: brandColors.cta.navy }}
            >
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span style={{ color: brandColors.archon.mediumGray }}>Tracked Vehicles</span>
                <span className="font-medium" style={{ color: brandColors.archon.black }}>
                  {vehicles.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: brandColors.archon.mediumGray }}>In Motion</span>
                <span className="font-medium" style={{ color: colors.success[500] }}>
                  {inMotion}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: brandColors.archon.mediumGray }}>Stationary</span>
                <span className="font-medium" style={{ color: colors.warning[500] }}>
                  {stationary}
                </span>
              </div>
            </div>
          </div>

          <div
            className="rounded-lg border p-4"
            style={{
              backgroundColor: brandColors.archon.lightGray,
              borderColor: `${brandColors.cta.navy}20`,
            }}
          >
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: brandColors.cta.navy }}
            >
              <Clock className="w-4 h-4" />
              Recent Activity
            </h3>
            <div className="space-y-2 text-sm">
              <div style={{ color: brandColors.archon.mediumGray }}>
                No recent activity available.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSTracking;
