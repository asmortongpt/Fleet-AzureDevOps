/**
 * VehicleConditionPanel - Comprehensive vehicle health dashboard
 * 
 * Features:
 * - Real-time condition monitoring
 * - Visual gauges and indicators
 * - Service history timeline
 * - Maintenance alerts
 * - OBD-II integration ready
 * 
 * Created: 2026-01-08
 */

import {
  Activity,
  AlertTriangle,
  Battery,
  Droplet,
  Gauge,
  Wrench,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import type { VehicleCondition, ServiceRecord } from '@/types/vehicle-condition.types';

// ============================================================================
// TYPES
// ============================================================================

export interface VehicleConditionPanelProps {
  condition: VehicleCondition;
  serviceHistory: ServiceRecord[];
  onScheduleService?: (serviceType: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VehicleConditionPanel({
  condition,
  serviceHistory,
  onScheduleService,
}: VehicleConditionPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'history'>('overview');

  // Calculate overall health score
  const healthScore = useMemo(() => {
    const scores = [
      condition.engine.oilLife,
      condition.battery.health,
      condition.brakes.frontPadLife,
      condition.brakes.rearPadLife,
      (condition.tires.frontLeft.pressure / condition.tires.frontLeft.recommendedPressure) * 100,
      (condition.tires.frontRight.pressure / condition.tires.frontRight.recommendedPressure) * 100,
      (condition.tires.rearLeft.pressure / condition.tires.rearLeft.recommendedPressure) * 100,
      (condition.tires.rearRight.pressure / condition.tires.rearRight.recommendedPressure) * 100,
    ];

    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [condition]);

  // Get critical alerts
  const criticalAlerts = useMemo(() => {
    const alerts: Array<{ type: string; message: string; severity: 'critical' | 'warning' }> = [];

    if (condition.engine.oilLife < 15) {
      alerts.push({
        type: 'oil',
        message: `Oil life: ${condition.engine.oilLife}% - Service soon`,
        severity: condition.engine.oilLife < 5 ? 'critical' : 'warning',
      });
    }

    if (condition.battery.health < 50) {
      alerts.push({
        type: 'battery',
        message: `Battery health: ${condition.battery.health}% - Consider replacement`,
        severity: condition.battery.health < 30 ? 'critical' : 'warning',
      });
    }

    if (condition.brakes.frontPadLife < 20 || condition.brakes.rearPadLife < 20) {
      alerts.push({
        type: 'brakes',
        message: 'Brake pads worn - Inspection required',
        severity: 'critical',
      });
    }

    if (condition.diagnostics.checkEngineLightOn) {
      alerts.push({
        type: 'engine',
        message: `Check Engine Light - ${condition.diagnostics.diagnosticCodes.length} code(s)`,
        severity: 'critical',
      });
    }

    return alerts;
  }, [condition]);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Vehicle Condition</h2>
            <p className="text-slate-400 text-sm">
              Last updated: {condition.lastUpdated.toLocaleString()}
            </p>
          </div>

          {/* Overall Health Score */}
          <div className="text-center">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-slate-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`}
                  className={
                    healthScore >= 80
                      ? 'text-green-500'
                      : healthScore >= 60
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{healthScore}</span>
                <span className="text-xs text-slate-400">Health</span>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {criticalAlerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  alert.severity === 'critical'
                    ? 'bg-red-900/30 border border-red-700'
                    : 'bg-yellow-900/30 border border-yellow-700'
                }`}
              >
                <AlertTriangle
                  size={20}
                  className={alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}
                />
                <span className="text-white text-sm flex-1">{alert.message}</span>
                {onScheduleService && (
                  <button
                    onClick={() => onScheduleService(alert.type)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                  >
                    Schedule
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'details', label: 'Details' },
          { id: 'history', label: 'History' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-slate-800 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab condition={condition} onScheduleService={onScheduleService} />
        )}
        {activeTab === 'details' && <DetailsTab condition={condition} />}
        {activeTab === 'history' && (
          <HistoryTab serviceHistory={serviceHistory} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

interface OverviewTabProps {
  condition: VehicleCondition;
  onScheduleService?: (serviceType: string) => void;
}

function OverviewTab({ condition, onScheduleService }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Gauge size={24} />}
          label="Mileage"
          value={condition.mileage.current.toLocaleString()}
          unit={condition.mileage.unit}
          color="blue"
        />
        <StatCard
          icon={<Droplet size={24} />}
          label="Oil Life"
          value={`${condition.engine.oilLife}%`}
          color={condition.engine.oilLife > 50 ? 'green' : condition.engine.oilLife > 25 ? 'yellow' : 'red'}
        />
        <StatCard
          icon={<Battery size={24} />}
          label="Battery"
          value={`${condition.battery.health}%`}
          color={condition.battery.health > 70 ? 'green' : condition.battery.health > 40 ? 'yellow' : 'red'}
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Brake Pads"
          value={`${Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife)}%`}
          color={
            Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife) > 50
              ? 'green'
              : Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife) > 25
              ? 'yellow'
              : 'red'
          }
        />
      </div>

      {/* Tire Pressure Visual */}
      <div className="bg-slate-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Tire Pressure</h3>
        <TirePressureVisual tires={condition.tires} />
      </div>

      {/* Upcoming Service */}
      {condition.nextScheduledService && (
        <div className="bg-slate-800/50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Next Scheduled Service</h3>
            {onScheduleService && (
              <button
                onClick={() => onScheduleService(condition.nextScheduledService.type)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Reschedule
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Wrench size={20} className="text-slate-400" />
              <div>
                <p className="text-white font-medium">{condition.nextScheduledService.type}</p>
                <p className="text-slate-400 text-sm">{condition.nextScheduledService.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Due Date</p>
                  <p className="text-white text-sm">
                    {condition.nextScheduledService.dueDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge size={16} className="text-slate-400" />
                <div>
                  <p className="text-xs text-slate-400">Due Mileage</p>
                  <p className="text-white text-sm">
                    {condition.nextScheduledService.dueMileage.toLocaleString()} {condition.mileage.unit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DETAILS TAB
// ============================================================================

interface DetailsTabProps {
  condition: VehicleCondition;
}

function DetailsTab({ condition }: DetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Engine */}
      <DetailSection title="Engine">
        <DetailRow label="Oil Life" value={`${condition.engine.oilLife}%`} />
        <DetailRow
          label="Last Oil Change"
          value={condition.engine.lastOilChange.toLocaleDateString()}
        />
        <DetailRow
          label="Next Oil Change"
          value={`${condition.engine.nextOilChangeDue.toLocaleString()} ${condition.mileage.unit}`}
        />
        <DetailRow label="Oil Type" value={condition.engine.oilType} />
        <DetailRow label="Coolant Level" value={condition.engine.coolantLevel} />
      </DetailSection>

      {/* Transmission */}
      <DetailSection title="Transmission">
        <DetailRow label="Fluid Level" value={condition.transmission.fluidLevel} />
        <DetailRow
          label="Last Service"
          value={condition.transmission.lastService.toLocaleDateString()}
        />
        <DetailRow label="Condition" value={condition.transmission.condition} />
      </DetailSection>

      {/* Brakes */}
      <DetailSection title="Brakes">
        <DetailRow label="Front Pad Life" value={`${condition.brakes.frontPadLife}%`} />
        <DetailRow label="Rear Pad Life" value={`${condition.brakes.rearPadLife}%`} />
        <DetailRow label="Fluid Level" value={condition.brakes.fluidLevel} />
        <DetailRow
          label="Last Inspection"
          value={condition.brakes.lastInspection.toLocaleDateString()}
        />
      </DetailSection>

      {/* Battery */}
      <DetailSection title="Battery">
        <DetailRow label="Health" value={`${condition.battery.health}%`} />
        <DetailRow label="Voltage" value={`${condition.battery.voltage}V`} />
        <DetailRow label="Last Tested" value={condition.battery.lastTested.toLocaleDateString()} />
        {condition.battery.manufactureDate && (
          <DetailRow
            label="Manufacture Date"
            value={condition.battery.manufactureDate.toLocaleDateString()}
          />
        )}
      </DetailSection>

      {/* Diagnostic Codes */}
      {condition.diagnostics.diagnosticCodes.length > 0 && (
        <DetailSection title="Diagnostic Codes">
          {condition.diagnostics.diagnosticCodes.map((code, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${
                  code.severity === 'critical'
                    ? 'bg-red-500'
                    : code.severity === 'warning'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-mono">{code.code}</span>
                  {code.resolved ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
                <p className="text-slate-300 text-sm">{code.description}</p>
                <p className="text-slate-500 text-xs mt-1">
                  Detected: {code.detectedDate.toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </DetailSection>
      )}
    </div>
  );
}

// ============================================================================
// HISTORY TAB
// ============================================================================

interface HistoryTabProps {
  serviceHistory: ServiceRecord[];
}

function HistoryTab({ serviceHistory }: HistoryTabProps) {
  const [filter, setFilter] = useState<'all' | string>('all');

  const filteredHistory = useMemo(() => {
    if (filter === 'all') return serviceHistory;
    return serviceHistory.filter(record => record.serviceType === filter);
  }, [serviceHistory, filter]);

  const totalCost = useMemo(() => {
    return filteredHistory.reduce((sum, record) => sum + record.cost, 0);
  }, [filteredHistory]);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm mb-1">Total Services</p>
          <p className="text-2xl font-bold text-white">{filteredHistory.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm mb-1">Total Cost</p>
          <p className="text-2xl font-bold text-green-400">${totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-slate-400 text-sm mb-1">Avg Cost</p>
          <p className="text-2xl font-bold text-blue-400">
            ${Math.round(totalCost / (filteredHistory.length || 1)).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          All Services
        </button>
        {['oil_change', 'tire_rotation', 'brake_service', 'inspection', 'repair'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No service records found</p>
          </div>
        ) : (
          filteredHistory.map((record, index) => (
            <div
              key={record.id}
              className="relative pl-8 pb-6 border-l-2 border-slate-700 last:border-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-slate-900" />

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold capitalize mb-1">
                      {record.serviceType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-slate-400 text-sm">{record.description}</p>
                  </div>
                  <span className="text-green-400 font-semibold">
                    ${record.cost.toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Date</p>
                    <p className="text-white">{record.date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Mileage</p>
                    <p className="text-white">{record.mileage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Performed By</p>
                    <p className="text-white">{record.performedBy}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Location</p>
                    <p className="text-white">{record.location}</p>
                  </div>
                </div>

                {record.parts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">Parts Used:</p>
                    <ul className="space-y-1">
                      {record.parts.map((part, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex justify-between">
                          <span>
                            {part.name} (x{part.quantity})
                          </span>
                          <span className="text-slate-500">${part.cost.toLocaleString()}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

function StatCard({ icon, label, value, unit, color }: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-900/30',
    green: 'text-green-400 bg-green-900/30',
    yellow: 'text-yellow-400 bg-yellow-900/30',
    red: 'text-red-400 bg-red-900/30',
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium capitalize">{value}</span>
    </div>
  );
}

function TirePressureVisual({ tires }: { tires: VehicleCondition['tires'] }) {
  const TireIndicator = ({ tire, position }: { tire: any; position: string }) => {
    const percentage = (tire.pressure / tire.recommendedPressure) * 100;
    const color =
      percentage >= 95 && percentage <= 105
        ? 'green'
        : percentage >= 85 && percentage <= 115
        ? 'yellow'
        : 'red';

    const colorClasses = {
      green: 'bg-green-500 border-green-400',
      yellow: 'bg-yellow-500 border-yellow-400',
      red: 'bg-red-500 border-red-400',
    };

    return (
      <div className="text-center">
        <div
          className={`w-16 h-20 rounded-lg border-4 ${colorClasses[color]} mx-auto mb-2 flex items-center justify-center`}
        >
          <div className="text-white font-bold text-sm">{tire.pressure}</div>
        </div>
        <p className="text-slate-400 text-xs">{position}</p>
        <p className="text-white text-xs">{tire.condition}</p>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Car outline */}
      <div className="w-64 h-48 mx-auto relative">
        <svg viewBox="0 0 200 150" className="w-full h-full text-slate-700">
          <rect x="30" y="30" width="140" height="90" rx="10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>

        {/* Tire positions */}
        <div className="absolute top-4 left-4">
          <TireIndicator tire={tires.frontLeft} position="FL" />
        </div>
        <div className="absolute top-4 right-4">
          <TireIndicator tire={tires.frontRight} position="FR" />
        </div>
        <div className="absolute bottom-4 left-4">
          <TireIndicator tire={tires.rearLeft} position="RL" />
        </div>
        <div className="absolute bottom-4 right-4">
          <TireIndicator tire={tires.rearRight} position="RR" />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-slate-300">Optimal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span className="text-slate-300">Acceptable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-slate-300">Low/High</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleConditionPanel;
