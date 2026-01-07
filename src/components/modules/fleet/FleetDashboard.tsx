import React, { useMemo, useState, useCallback } from 'react';

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap";
import { useDrilldown } from "@/contexts/DrilldownContext";
import { useFleetDataBatched } from "@/hooks/use-fleet-data-batched";
import { useVehicleTelemetry } from "@/hooks/useVehicleTelemetry";
import { Vehicle } from "@/lib/types";
import { useInspect } from "@/services/inspect/InspectContext";

// ============================================================================
// Types & Interfaces
// ============================================================================

type VehicleStatus = 'active' | 'service' | 'inactive' | 'maintenance';

interface VehicleRecord extends Vehicle {
  healthScore?: number;
  lastService?: string;
  nextService?: string;
  alertCount?: number;
}

// ============================================================================
// StatusChip Component - Inline for Fleet Design System
// ============================================================================

const StatusChip: React.FC<{ status: VehicleStatus; label?: string }> = ({ status, label }) => {
  const colorMap: Record<VehicleStatus, string> = {
    active: '#10b981',
    service: '#f59e0b',
    inactive: '#94a3b8',
    maintenance: '#ef4444'
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
      color: colorMap[status] || '#60a5fa', fontSize: 12
    }}>
      ● {label ?? status.toUpperCase()}
    </span>
  );
};

// ============================================================================
// Main FleetDashboard Component
// ============================================================================

export function FleetDashboard() {
  // Data hooks
  const data = useFleetDataBatched();
  const initialVehicles = data?.vehicles || [];
  const { push: drilldownPush } = useDrilldown();
  const { openInspect } = useInspect();

  const { vehicles: realtimeVehicles } = useVehicleTelemetry({
    enabled: true,
    initialVehicles
  });

  // Merge realtime and initial data
  const vehicles: VehicleRecord[] = useMemo(() => {
    if (realtimeVehicles?.length > 0) {
      const merged = new Map<string, Vehicle>();
      initialVehicles.forEach((v) => merged.set(v.id, v));
      realtimeVehicles.forEach((v) => {
        const existing = merged.get(v.id);
        if (existing) {
          merged.set(v.id, { ...existing, ...v });
        }
      });
      return Array.from(merged.values());
    }
    return initialVehicles;
  }, [initialVehicles, realtimeVehicles]);

  // State management
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'map' | 'split'>('split');

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.assignedDriver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.region?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [vehicles, statusFilter, searchTerm]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = filteredVehicles.length;
    const active = filteredVehicles.filter(v => v.status === 'active').length;
    const inService = filteredVehicles.filter(v => v.status === 'service').length;
    const lowFuel = filteredVehicles.filter(v => v.fuelLevel && v.fuelLevel < 25).length;
    const criticalAlerts = filteredVehicles.reduce((sum, v) => sum + (v.alerts?.length || 0), 0);
    const avgFuel = filteredVehicles.reduce((sum, v) => sum + (v.fuelLevel || 0), 0) / (total || 1);
    return { total, active, inService, lowFuel, criticalAlerts, avgFuel };
  }, [filteredVehicles]);

  // Event handlers
  const toggleRowExpand = useCallback((vehicleId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  }, []);

  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    drilldownPush({
      id: `vehicle-${vehicle.id}`,
      type: "vehicle",
      label: `${vehicle.number} - ${vehicle.make} ${vehicle.model}`,
      data: vehicle
    });
    openInspect({
      type: "vehicle",
      id: vehicle.id,
    });
  }, [drilldownPush, openInspect]);

  const handleMapVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const vehicle = filteredVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
      handleVehicleClick(vehicle);
    }
  }, [filteredVehicles, handleVehicleClick]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
  }, []);

  return (
    <div style={{
      padding: 32,
      minHeight: '100vh',
      background: 'var(--bg, #0a0a0a)',
      color: 'var(--text, #f8fafc)'
    }}>
      {/* Professional Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: 'var(--text, #f8fafc)' }}>
          Fleet Dashboard
        </h1>
        <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)' }}>
          Real-time fleet monitoring with comprehensive vehicle analytics
        </p>
      </div>

      {/* Summary Stat Panels - 6 gradient panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>{metrics.total}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Total Vehicles</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>{metrics.active}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Active Now</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>{metrics.inService}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>In Service</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>{metrics.lowFuel}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Low Fuel</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>{metrics.criticalAlerts}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Total Alerts</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.05))',
          cursor: 'pointer'
        }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>{Math.round(metrics.avgFuel)}%</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Avg Fuel Level</div>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        padding: 20, borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <input
          type="text"
          placeholder="Search vehicles by number, make, model, driver, or region..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text, #f8fafc)',
            fontSize: 14,
            outline: 'none'
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text, #f8fafc)',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="service">In Service</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'table' | 'map' | 'split')}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: 'var(--text, #f8fafc)',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="split">Split View</option>
          <option value="table">Table Only</option>
          <option value="map">Map Only</option>
        </select>
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={clearFilters}
            style={{
              padding: '12px 20px',
              borderRadius: 12,
              border: '1px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Split View: Map + Table or Single View */}
      {viewMode === 'split' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          {/* Map Section */}
          <div style={{
            height: 600,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            overflow: 'hidden'
          }}>
            <ProfessionalFleetMap
              vehicles={filteredVehicles as unknown as Vehicle[]}
              onVehicleSelect={handleMapVehicleSelect}
            />
          </div>

          {/* Mini Table Section */}
          <div style={{
            height: 600,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            overflow: 'auto',
            padding: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text, #f8fafc)' }}>
              Vehicle List ({filteredVehicles.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredVehicles.slice(0, 20).map(vehicle => (
                <div
                  key={vehicle.id}
                  onClick={() => handleVehicleClick(vehicle)}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: selectedVehicleId === vehicle.id ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{vehicle.number}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <StatusChip status={vehicle.status as VehicleStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'map' && (
        <div style={{
          height: 800,
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          overflow: 'hidden',
          marginBottom: 32
        }}>
          <ProfessionalFleetMap
            vehicles={filteredVehicles as unknown as Vehicle[]}
            onVehicleSelect={handleMapVehicleSelect}
          />
        </div>
      )}

      {/* Professional Table with Expandable Rows */}
      {(viewMode === 'table' || viewMode === 'split') && (
        <div style={{
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', width: 40 }}></th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Vehicle</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Fuel Level</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Mileage</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Location</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Driver</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Alerts</th>
                <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map(vehicle => {
                const isExpanded = expandedRows.has(vehicle.id);
                return (
                  <React.Fragment key={vehicle.id}>
                    <tr
                      onClick={() => toggleRowExpand(vehicle.id)}
                      style={{
                        cursor: 'pointer',
                        background: isExpanded ? 'rgba(96,165,250,0.08)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                        }} />
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #f8fafc)', marginBottom: 4 }}>
                          {vehicle.number}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </div>
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <StatusChip status={vehicle.status as VehicleStatus} />
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 60, height: 8, borderRadius: 999,
                            background: 'rgba(255,255,255,0.1)', overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${vehicle.fuelLevel || 0}%`, height: '100%',
                              background: (vehicle.fuelLevel || 0) > 50 ? '#10b981' : (vehicle.fuelLevel || 0) > 25 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text, #f8fafc)' }}>{vehicle.fuelLevel || 0}%</span>
                        </div>
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{vehicle.mileage?.toLocaleString() || 0} mi</span>
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 14 }}>{vehicle.region || 'N/A'}</span>
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ fontSize: 14, color: vehicle.assignedDriver ? '#60a5fa' : 'var(--muted, #94a3b8)' }}>
                          {vehicle.assignedDriver || 'Unassigned'}
                        </span>
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        {vehicle.alerts && vehicle.alerts.length > 0 ? (
                          <span style={{
                            padding: '6px 10px', borderRadius: 999,
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444', fontSize: 12, fontWeight: 600
                          }}>
                            {vehicle.alerts.length} alerts
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--muted, #94a3b8)' }}>None</span>
                        )}
                      </td>
                      <td style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVehicleClick(vehicle);
                          }}
                          style={{
                            padding: '8px 16px', borderRadius: 12,
                            border: '1px solid rgba(96,165,250,0.3)',
                            background: 'rgba(96,165,250,0.15)',
                            color: '#60a5fa', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row Drilldown */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{
                            padding: 16, borderRadius: 16,
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(0,0,0,0.18)',
                            margin: 12
                          }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                              {/* Vehicle Details Panel */}
                              <div style={{
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                                padding: 16, background: 'rgba(255,255,255,0.03)'
                              }}>
                                <div style={{
                                  fontSize: 12, color: 'var(--muted, #94a3b8)',
                                  textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12
                                }}>
                                  Vehicle Details
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>VIN</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.vin || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>License Plate</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.licensePlate || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>Department</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.department || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>Acquisition Date</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.purchaseDate || 'N/A'}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Telemetry Panel */}
                              <div style={{
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                                padding: 16, background: 'rgba(255,255,255,0.03)'
                              }}>
                                <div style={{
                                  fontSize: 12, color: 'var(--muted, #94a3b8)',
                                  textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12
                                }}>
                                  Current Telemetry
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>Engine Status</div>
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Running</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>GPS Coordinates</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>{vehicle.latitude?.toFixed(4) || 'N/A'}, {vehicle.longitude?.toFixed(4) || 'N/A'}</div>
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 10, color: 'var(--muted, #94a3b8)', marginBottom: 2 }}>Last Updated</div>
                                    <div style={{ fontSize: 12, fontWeight: 600 }}>2 min ago</div>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions Panel */}
                              <div style={{
                                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16,
                                padding: 16, background: 'rgba(255,255,255,0.03)'
                              }}>
                                <div style={{
                                  fontSize: 12, color: 'var(--muted, #94a3b8)',
                                  textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12
                                }}>
                                  Quick Actions
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <button style={{
                                    padding: '10px 16px', borderRadius: 12,
                                    border: '1px solid rgba(96,165,250,0.3)',
                                    background: 'rgba(96,165,250,0.15)',
                                    color: '#60a5fa', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', textAlign: 'left'
                                  }}>
                                    View Full Record
                                  </button>
                                  <button style={{
                                    padding: '10px 16px', borderRadius: 12,
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    background: 'rgba(16,185,129,0.15)',
                                    color: '#10b981', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', textAlign: 'left'
                                  }}>
                                    Schedule Maintenance
                                  </button>
                                  <button style={{
                                    padding: '10px 16px', borderRadius: 12,
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    background: 'rgba(245,158,11,0.15)',
                                    color: '#f59e0b', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', textAlign: 'left'
                                  }}>
                                    View Service History
                                  </button>
                                  <button style={{
                                    padding: '10px 16px', borderRadius: 12,
                                    border: '1px solid rgba(96,165,250,0.3)',
                                    background: 'rgba(96,165,250,0.15)',
                                    color: '#60a5fa', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', textAlign: 'left'
                                  }}>
                                    Track on Map
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredVehicles.length === 0 && (
            <div style={{
              padding: 64, textAlign: 'center',
              color: 'var(--muted, #94a3b8)', fontSize: 14
            }}>
              No vehicles match your filters. Try adjusting your search criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FleetDashboard;
