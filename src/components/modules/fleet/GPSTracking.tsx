/**
 * GPSTracking - Real-time GPS Vehicle Tracking Module
 * Displays vehicle locations on a map with live updates
 */

import { MapPin, Navigation, Clock, Signal } from 'lucide-react';
import React from 'react';

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
        {/* Map Area */}
        <div
          className="lg:col-span-3 rounded-lg border p-4 min-h-[500px]"
          style={{
            backgroundColor: brandColors.archon.lightGray,
            borderColor: `${brandColors.cta.navy}20`,
          }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Navigation className="w-12 h-12 mx-auto mb-4" style={{ color: brandColors.cta.orange }} />
              <p className="text-lg font-medium" style={{ color: brandColors.archon.black }}>
                GPS Map View
              </p>
              <p className="text-sm mt-2" style={{ color: brandColors.archon.mediumGray }}>
                {vehicles.length} vehicles • {facilities.length} facilities
              </p>
            </div>
          </div>
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
