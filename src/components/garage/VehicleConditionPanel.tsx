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
  CheckCircle,
  Clock,
  Droplet,
  Fuel,
  Gauge,
  Calendar,
  Wrench,
  XCircle,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import type { VehicleCondition, ServiceRecord } from '@/types/vehicle-condition.types';
import { formatEnum } from '@/utils/format-enum';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers';

// ============================================================================
// HELPERS
// ============================================================================

/** Return a relative-time string like "2m ago", "3h ago", "5d ago". */
function relativeTime(date: Date | string | null | undefined): string {
  if (!date) return '\u2014';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '\u2014';
  const diffMs = Date.now() - d.getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(d);
}

/** Map a 0-100 percentage to the correct status color class set. */
function statusColor(
  pct: number,
  goodThreshold = 60,
  warnThreshold = 30,
): { text: string; bg: string; bar: string } {
  if (pct >= goodThreshold) return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', bar: 'bg-emerald-500' };
  if (pct >= warnThreshold) return { text: 'text-amber-400', bg: 'bg-amber-500/15', bar: 'bg-amber-500' };
  return { text: 'text-rose-400', bg: 'bg-rose-500/15', bar: 'bg-rose-500' };
}

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
    const alerts: Array<{
      type: string;
      description: string;
      action: string;
      severity: 'critical' | 'warning';
    }> = [];

    if (condition.engine.oilLife < 15) {
      alerts.push({
        type: 'oil',
        description: `Oil life at ${condition.engine.oilLife}%`,
        action: condition.engine.oilLife < 5 ? 'Immediate service required' : 'Schedule oil change soon',
        severity: condition.engine.oilLife < 5 ? 'critical' : 'warning',
      });
    }

    if (condition.battery.health < 50) {
      alerts.push({
        type: 'battery',
        description: `Battery health at ${condition.battery.health}%`,
        action: condition.battery.health < 30 ? 'Replace battery immediately' : 'Plan battery replacement',
        severity: condition.battery.health < 30 ? 'critical' : 'warning',
      });
    }

    if (condition.brakes.frontPadLife < 20 || condition.brakes.rearPadLife < 20) {
      const worst = Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife);
      alerts.push({
        type: 'brakes',
        description: `Brake pads at ${worst}% life remaining`,
        action: 'Schedule brake inspection',
        severity: 'critical',
      });
    }

    if (condition.diagnostics.checkEngineLightOn) {
      alerts.push({
        type: 'engine',
        description: `Check Engine Light active`,
        action: `${condition.diagnostics.diagnosticCodes.length} diagnostic code(s) detected`,
        severity: 'critical',
      });
    }

    return alerts;
  }, [condition]);

  const colors = statusColor(healthScore);

  return (
    <div className="bg-[#1a1a1a] rounded-md shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#242424] border-b border-white/[0.08] p-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-foreground mb-1">Vehicle Condition</h2>
            <p className="text-muted-foreground text-xs">
              Updated {relativeTime(condition.lastUpdated)}
            </p>
          </div>

          {/* Overall Health Score - flat horizontal bar */}
          <div className="w-40">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs text-muted-foreground">Health</span>
              <span className={`text-sm font-bold ${colors.text}`}>{healthScore}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
              <div
                className={`h-full rounded-full ${colors.bar} transition-[width] duration-500`}
                style={{ width: `${Math.min(healthScore, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <div className="mt-3 space-y-2">
            {criticalAlerts.map((alert, index) => (
              <div
                key={index}
                className={`rounded-md border p-3 ${
                  alert.severity === 'critical'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={16}
                    className={`mt-0.5 shrink-0 ${
                      alert.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          alert.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-foreground text-sm">{alert.description}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{alert.action}</p>
                  </div>
                  {onScheduleService && (
                    <button
                      onClick={() => onScheduleService(alert.type)}
                      className="text-emerald-400 text-xs font-medium shrink-0"
                    >
                      Schedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08]">
        {([
          { id: 'overview' as const, label: 'Overview' },
          { id: 'details' as const, label: 'Details' },
          { id: 'history' as const, label: 'History' },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium ${
              activeTab === tab.id
                ? 'text-foreground bg-[#242424] border-b-2 border-emerald-500'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3">
        {activeTab === 'overview' && (
          <OverviewTab condition={condition} onScheduleService={onScheduleService} />
        )}
        {activeTab === 'details' && <DetailsTab condition={condition} />}
        {activeTab === 'history' && <HistoryTab serviceHistory={serviceHistory} />}
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
    <div className="space-y-3">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard
          icon={<Gauge size={18} />}
          label="Mileage"
          value={formatNumber(condition.mileage.current)}
          unit={condition.mileage.unit}
          pct={100}
        />
        <StatCard
          icon={<Droplet size={18} />}
          label="Oil Life"
          value={`${condition.engine.oilLife}%`}
          pct={condition.engine.oilLife}
        />
        <StatCard
          icon={<Battery size={18} />}
          label="Battery"
          value={`${condition.battery.health}%`}
          pct={condition.battery.health}
        />
        <StatCard
          icon={<Activity size={18} />}
          label="Brake Pads"
          value={`${Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife)}%`}
          pct={Math.min(condition.brakes.frontPadLife, condition.brakes.rearPadLife)}
        />
      </div>

      {/* Fuel Level (if available via mileage proxy, show as visual bar) */}
      <div className="bg-[#242424] rounded-md border border-white/[0.08] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Fuel size={16} className="text-muted-foreground" />
          <h3 className="text-xs font-semibold text-foreground">Fluid Levels</h3>
        </div>
        <div className="space-y-2">
          <FluidRow label="Coolant" level={condition.engine.coolantLevel} />
          <FluidRow label="Brake Fluid" level={condition.brakes.fluidLevel} />
          <FluidRow label="Transmission" level={condition.transmission.fluidLevel} />
          <FluidRow label="Power Steering" level={condition.fluids.powerSteering} />
          <FluidRow label="Washer Fluid" level={condition.fluids.washerFluid} />
        </div>
      </div>

      {/* Tire Pressure Visual */}
      <div className="bg-[#242424] rounded-md border border-white/[0.08] p-3">
        <h3 className="text-xs font-semibold text-foreground mb-2">Tire Pressure</h3>
        <TirePressureVisual tires={condition.tires} />
      </div>

      {/* Upcoming Service */}
      {condition.nextScheduledService && (
        <div className="bg-[#242424] rounded-md border border-white/[0.08] p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-foreground">Next Scheduled Service</h3>
            {onScheduleService && (
              <button
                onClick={() => onScheduleService(condition.nextScheduledService.type)}
                className="text-emerald-400 text-xs font-medium"
              >
                Reschedule
              </button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Wrench size={16} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-foreground text-sm font-medium">
                  {formatEnum(condition.nextScheduledService.type)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {condition.nextScheduledService.description}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Due Date</p>
                  <p className="text-foreground text-xs">
                    {formatDate(condition.nextScheduledService.dueDate)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Gauge size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Due Mileage</p>
                  <p className="text-foreground text-xs">
                    {formatNumber(condition.nextScheduledService.dueMileage)} {condition.mileage.unit}
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
    <div className="space-y-3">
      {/* Engine */}
      <DetailSection title="Engine">
        <DetailRow label="Oil Life" value={`${condition.engine.oilLife}%`} />
        <DetailRow label="Last Oil Change" value={formatDate(condition.engine.lastOilChange)} />
        <DetailRow
          label="Next Oil Change"
          value={`${formatNumber(condition.engine.nextOilChangeDue)} ${condition.mileage.unit}`}
        />
        <DetailRow label="Oil Type" value={condition.engine.oilType} />
        <DetailRow label="Coolant Level" value={formatEnum(condition.engine.coolantLevel)} />
      </DetailSection>

      {/* Transmission */}
      <DetailSection title="Transmission">
        <DetailRow label="Fluid Level" value={formatEnum(condition.transmission.fluidLevel)} />
        <DetailRow label="Last Service" value={formatDate(condition.transmission.lastService)} />
        <DetailRow label="Condition" value={formatEnum(condition.transmission.condition)} />
      </DetailSection>

      {/* Brakes */}
      <DetailSection title="Brakes">
        <DetailRow label="Front Pad Life" value={`${condition.brakes.frontPadLife}%`} />
        <DetailRow label="Rear Pad Life" value={`${condition.brakes.rearPadLife}%`} />
        <DetailRow label="Fluid Level" value={formatEnum(condition.brakes.fluidLevel)} />
        <DetailRow label="Last Inspection" value={formatDate(condition.brakes.lastInspection)} />
      </DetailSection>

      {/* Battery */}
      <DetailSection title="Battery">
        <DetailRow label="Health" value={`${condition.battery.health}%`} />
        <DetailRow label="Voltage" value={`${condition.battery.voltage}V`} />
        <DetailRow label="Last Tested" value={formatDate(condition.battery.lastTested)} />
        {condition.battery.manufactureDate && (
          <DetailRow
            label="Manufacture Date"
            value={formatDate(condition.battery.manufactureDate)}
          />
        )}
      </DetailSection>

      {/* Filters */}
      <DetailSection title="Filters">
        <DetailRow label="Air Filter" value={formatEnum(condition.filters.airFilter)} />
        <DetailRow label="Cabin Filter" value={formatEnum(condition.filters.cabinFilter)} />
        {condition.filters.fuelFilter && (
          <DetailRow label="Fuel Filter" value={formatEnum(condition.filters.fuelFilter)} />
        )}
        <DetailRow label="Last Replaced" value={formatDate(condition.filters.lastReplaced)} />
      </DetailSection>

      {/* Diagnostic Codes */}
      {condition.diagnostics.diagnosticCodes.length > 0 && (
        <DetailSection title="Diagnostic Codes">
          {condition.diagnostics.diagnosticCodes.map((code, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-2.5 bg-[#1a1a1a] rounded-md"
            >
              <div className="shrink-0 mt-0.5">
                {code.resolved ? (
                  <CheckCircle size={14} className="text-emerald-400" />
                ) : (
                  <XCircle size={14} className="text-rose-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-foreground text-xs font-mono font-medium">{code.code}</span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      code.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400'
                        : code.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-sky-500/20 text-sky-400'
                    }`}
                  >
                    {code.severity}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">{code.description}</p>
                <p className="text-muted-foreground text-[10px] mt-0.5">
                  Detected: {formatDate(code.detectedDate)}
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
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#242424] rounded-md border border-white/[0.08] p-2 text-center">
          <p className="text-muted-foreground text-[10px] mb-0.5">Total Services</p>
          <p className="text-sm font-bold text-foreground">{filteredHistory.length}</p>
        </div>
        <div className="bg-[#242424] rounded-md border border-white/[0.08] p-2 text-center">
          <p className="text-muted-foreground text-[10px] mb-0.5">Total Cost</p>
          <p className="text-sm font-bold text-emerald-400">{formatCurrency(totalCost)}</p>
        </div>
        <div className="bg-[#242424] rounded-md border border-white/[0.08] p-2 text-center">
          <p className="text-muted-foreground text-[10px] mb-0.5">Avg Cost</p>
          <p className="text-sm font-bold text-foreground">
            {formatCurrency(Math.round(totalCost / (filteredHistory.length || 1)))}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <FilterPill label="All Services" active={filter === 'all'} onClick={() => setFilter('all')} />
        {['oil_change', 'tire_rotation', 'brake_service', 'inspection', 'repair'].map(type => (
          <FilterPill
            key={type}
            label={formatEnum(type)}
            active={filter === type}
            onClick={() => setFilter(type)}
          />
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock size={36} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No records found</p>
          </div>
        ) : (
          filteredHistory.map((record) => (
            <div
              key={record.id}
              className="relative pl-4 pb-3 border-l-2 border-white/[0.08] last:border-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#1a1a1a]" />

              <div className="bg-[#242424] rounded-md border border-white/[0.08] p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-foreground text-sm font-semibold">
                      {formatEnum(record.serviceType)}
                    </h4>
                    <p className="text-muted-foreground text-xs">{record.description}</p>
                  </div>
                  <span className="text-emerald-400 text-sm font-semibold shrink-0 ml-2">
                    {formatCurrency(record.cost)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground text-[10px]">Date</p>
                    <p className="text-foreground">{formatDate(record.date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Mileage</p>
                    <p className="text-foreground">{formatNumber(record.mileage)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Performed By</p>
                    <p className="text-foreground">{record.performedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-[10px]">Location</p>
                    <p className="text-foreground">{record.location}</p>
                  </div>
                </div>

                {record.parts.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/[0.08]">
                    <p className="text-muted-foreground text-[10px] mb-1">Parts Used</p>
                    <ul className="space-y-0.5">
                      {record.parts.map((part, idx) => (
                        <li key={idx} className="text-xs text-foreground flex justify-between">
                          <span>
                            {part.name} (x{part.quantity})
                          </span>
                          <span className="text-muted-foreground">{formatCurrency(part.cost)}</span>
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
  pct: number;
}

function StatCard({ icon, label, value, unit, pct }: StatCardProps) {
  const colors = statusColor(pct);

  return (
    <div className="bg-[#242424] rounded-md border border-white/[0.08] p-2.5">
      <div className={`inline-flex p-1.5 rounded ${colors.bg} mb-2`}>
        <span className={colors.text}>{icon}</span>
      </div>
      <p className="text-muted-foreground text-[10px] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-foreground">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </p>
    </div>
  );
}

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-[#242424] text-muted-foreground border border-white/[0.08]'
      }`}
    >
      {label}
    </button>
  );
}

interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div className="bg-[#242424] rounded-md border border-white/[0.08] p-3">
      <h3 className="text-xs font-semibold text-foreground mb-2">{title}</h3>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.08] last:border-0">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-foreground text-xs font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// FLUID LEVEL ROW
// ============================================================================

function FluidRow({ label, level }: { label: string; level: string }) {
  const pctMap: Record<string, number> = {
    low: 25,
    normal: 75,
    high: 100,
    full: 100,
  };
  const pct = pctMap[level] ?? 50;
  const colors = level === 'low'
    ? { bar: 'bg-rose-500', text: 'text-rose-400' }
    : { bar: 'bg-emerald-500', text: 'text-emerald-400' };

  return (
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-xs w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className={`h-full rounded-full ${colors.bar} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-medium w-12 text-right ${colors.text}`}>
        {formatEnum(level)}
      </span>
    </div>
  );
}

// ============================================================================
// TIRE PRESSURE VISUAL
// ============================================================================

function TirePressureVisual({ tires }: { tires: VehicleCondition['tires'] }) {
  const TireIndicator = ({ tire, position }: { tire: VehicleCondition['tires']['frontLeft']; position: string }) => {
    const percentage = (tire.pressure / tire.recommendedPressure) * 100;
    const isOptimal = percentage >= 95 && percentage <= 105;
    const isAcceptable = percentage >= 85 && percentage <= 115;

    const borderColor = isOptimal
      ? 'border-emerald-500'
      : isAcceptable
      ? 'border-amber-500'
      : 'border-rose-500';

    const textColor = isOptimal
      ? 'text-emerald-400'
      : isAcceptable
      ? 'text-amber-400'
      : 'text-rose-400';

    return (
      <div className="text-center">
        <div
          className={`w-14 h-18 rounded-md border-2 ${borderColor} bg-[#1a1a1a] mx-auto mb-1 flex flex-col items-center justify-center p-1`}
        >
          <div className={`font-bold text-xs ${textColor}`}>{tire.pressure}</div>
          <div className="text-[9px] text-muted-foreground">PSI</div>
        </div>
        <p className="text-muted-foreground text-[10px] font-medium">{position}</p>
        <p className={`text-[10px] ${textColor}`}>{formatEnum(tire.condition)}</p>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Car outline */}
      <div className="w-56 h-44 mx-auto relative">
        <svg viewBox="0 0 200 150" className="w-full h-full text-white/[0.08]">
          <rect x="30" y="30" width="140" height="90" rx="10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>

        {/* Tire positions */}
        <div className="absolute top-2 left-2">
          <TireIndicator tire={tires.frontLeft} position="FL" />
        </div>
        <div className="absolute top-2 right-2">
          <TireIndicator tire={tires.frontRight} position="FR" />
        </div>
        <div className="absolute bottom-2 left-2">
          <TireIndicator tire={tires.rearLeft} position="RL" />
        </div>
        <div className="absolute bottom-2 right-2">
          <TireIndicator tire={tires.rearRight} position="RR" />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex justify-center gap-3 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Optimal</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-amber-500" />
          <span className="text-muted-foreground">Acceptable</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-rose-500" />
          <span className="text-muted-foreground">Low/High</span>
        </div>
      </div>
    </div>
  );
}

export default VehicleConditionPanel;
