/**
 * FleetDashboard - Fleet Overview Dashboard Module
 * Provides real-time fleet status and metrics
 */

import { Car, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import React from 'react';

import { EnhancedDashboardCard } from '@/components/dashboard/EnhancedDashboardCard';
import { brandColors } from '@/theme/designSystem';

export const FleetDashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: brandColors.archon.black }}>
          <Car className="w-6 h-6" style={{ color: brandColors.cta.orange }} />
          Fleet Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnhancedDashboardCard
          title="Active Vehicles"
          value={127}
          unit="vehicles"
          icon={<Activity className="w-6 h-6" />}
          status="active"
        />

        <EnhancedDashboardCard
          title="Available"
          value={89}
          unit="ready"
          icon={<CheckCircle className="w-6 h-6" />}
          status="active"
        />

        <EnhancedDashboardCard
          title="In Maintenance"
          value={23}
          unit="vehicles"
          icon={<AlertTriangle className="w-6 h-6" />}
          status="warning"
        />

        <EnhancedDashboardCard
          title="Alerts"
          value={5}
          unit="active"
          icon={<AlertTriangle className="w-6 h-6" />}
          status="danger"
        />
      </div>

      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: brandColors.archon.lightGray,
          borderColor: `${brandColors.cta.navy}20`,
        }}
      >
        <h2 className="text-lg font-semibold mb-4" style={{ color: brandColors.archon.black }}>
          Fleet Overview
        </h2>
        <p style={{ color: brandColors.archon.mediumGray }}>
          Monitor your entire fleet from this dashboard. View real-time vehicle locations,
          status updates, and performance metrics.
        </p>
      </div>
    </div>
  );
};

export default FleetDashboard;
