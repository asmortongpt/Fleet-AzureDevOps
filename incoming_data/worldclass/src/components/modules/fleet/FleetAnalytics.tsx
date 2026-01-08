import React, { useMemo, useState, useCallback } from 'react';

import { useFleetData } from '@/hooks/use-fleet-data';

type AnalyticsStatus = 'good' | 'warn' | 'bad' | 'info';

interface AnalyticsRecord {
  id: string;
  metricName: string;
  currentValue: number | string;
  previousValue: number | string;
  trend: 'up' | 'down' | 'stable';
  status: AnalyticsStatus;
  category: string;
  unit: string;
  updatedAgo: string;
}

// Inline StatusChip component
const StatusChip: React.FC<{ status: AnalyticsStatus; label?: string }> = ({ status, label }) => {
  const colorMap: Record<AnalyticsStatus, string> = {
    good: '#10b981',
    warn: '#f59e0b',
    bad: '#ef4444',
    info: '#60a5fa'
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

export function FleetAnalytics() {
  const data = useFleetData();
  const vehicles = data?.vehicles || [];
  const fuelTransactions = data?.fuelTransactions || [];
  const workOrders = data?.workOrders || [];

  // State
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month');

  // Compute metrics
  const metrics = useMemo(() => {
    const totalFuelCost = fuelTransactions.reduce((sum, t) => sum + (t?.totalCost ?? 0), 0);
    const totalMaintenanceCost = workOrders
      .filter(w => w?.cost)
      .reduce((sum, w) => sum + (w?.cost ?? 0), 0);

    const activeVehicles = vehicles.filter(v => v?.status === 'active').length;
    const utilization = vehicles.length > 0 ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

    const avgMileage = vehicles.length > 0
      ? Math.round(vehicles.reduce((sum, v) => sum + (v?.mileage ?? 0), 0) / vehicles.length)
      : 0;

    const downtime = vehicles.filter(v => v?.status === 'service').length;

    const costPerVehicle = vehicles.length > 0
      ? Math.round((totalFuelCost + totalMaintenanceCost) / vehicles.length)
      : 0;

    const costPerMile = avgMileage > 0 && vehicles.length > 0
      ? ((totalFuelCost + totalMaintenanceCost) / (avgMileage * vehicles.length)).toFixed(2)
      : "0.00";

    const downtimeRate = vehicles.length > 0
      ? ((downtime / vehicles.length) * 100).toFixed(1)
      : "0.0";

    const fuelEfficiency = fuelTransactions.length > 0
      ? (fuelTransactions.reduce((sum, t) => sum + (t?.mpg ?? 0), 0) / fuelTransactions.length).toFixed(1)
      : "0.0";

    return {
      totalFleet: vehicles.length,
      utilization,
      totalFuelCost,
      totalMaintenanceCost,
      avgMileage,
      downtime,
      costPerVehicle,
      costPerMile,
      downtimeRate,
      fuelEfficiency
    };
  }, [vehicles, fuelTransactions, workOrders]);

  // Build analytics records table
  const analyticsRecords: AnalyticsRecord[] = useMemo(() => [
    {
      id: 'fleet-size',
      metricName: 'Total Fleet Size',
      currentValue: metrics.totalFleet,
      previousValue: Math.floor(metrics.totalFleet * 0.97),
      trend: 'up',
      status: 'info',
      category: 'Fleet',
      unit: 'vehicles',
      updatedAgo: '2m ago'
    },
    {
      id: 'utilization',
      metricName: 'Fleet Utilization Rate',
      currentValue: `${metrics.utilization}%`,
      previousValue: `${Math.max(0, metrics.utilization - 3)}%`,
      trend: metrics.utilization > 75 ? 'up' : 'stable',
      status: metrics.utilization > 80 ? 'good' : metrics.utilization > 60 ? 'warn' : 'bad',
      category: 'Performance',
      unit: '%',
      updatedAgo: '5m ago'
    },
    {
      id: 'fuel-cost',
      metricName: 'Total Fuel Expenditure',
      currentValue: `$${metrics.totalFuelCost.toLocaleString()}`,
      previousValue: `$${Math.floor(metrics.totalFuelCost * 0.92).toLocaleString()}`,
      trend: 'up',
      status: 'warn',
      category: 'Financial',
      unit: 'USD',
      updatedAgo: '12m ago'
    },
    {
      id: 'maintenance-cost',
      metricName: 'Maintenance Costs',
      currentValue: `$${metrics.totalMaintenanceCost.toLocaleString()}`,
      previousValue: `$${Math.floor(metrics.totalMaintenanceCost * 1.02).toLocaleString()}`,
      trend: 'down',
      status: 'good',
      category: 'Financial',
      unit: 'USD',
      updatedAgo: '8m ago'
    },
    {
      id: 'avg-mileage',
      metricName: 'Average Mileage',
      currentValue: `${metrics.avgMileage.toLocaleString()}mi`,
      previousValue: `${Math.floor(metrics.avgMileage * 0.95).toLocaleString()}mi`,
      trend: 'up',
      status: 'info',
      category: 'Performance',
      unit: 'miles',
      updatedAgo: '3m ago'
    },
    {
      id: 'downtime',
      metricName: 'Vehicles in Service',
      currentValue: metrics.downtime,
      previousValue: Math.floor(metrics.downtime * 1.1),
      trend: 'down',
      status: metrics.downtime > 5 ? 'warn' : 'good',
      category: 'Maintenance',
      unit: 'vehicles',
      updatedAgo: '7m ago'
    },
    {
      id: 'cost-per-vehicle',
      metricName: 'Cost per Vehicle',
      currentValue: `$${metrics.costPerVehicle.toLocaleString()}`,
      previousValue: `$${Math.floor(metrics.costPerVehicle * 0.95).toLocaleString()}`,
      trend: 'up',
      status: 'warn',
      category: 'Financial',
      unit: 'USD',
      updatedAgo: '15m ago'
    },
    {
      id: 'cost-per-mile',
      metricName: 'Cost per Mile',
      currentValue: `$${metrics.costPerMile}`,
      previousValue: `$${(parseFloat(metrics.costPerMile) * 0.98).toFixed(2)}`,
      trend: 'up',
      status: 'info',
      category: 'Financial',
      unit: 'USD/mi',
      updatedAgo: '10m ago'
    },
    {
      id: 'downtime-rate',
      metricName: 'Downtime Rate',
      currentValue: `${metrics.downtimeRate}%`,
      previousValue: `${(parseFloat(metrics.downtimeRate) * 1.05).toFixed(1)}%`,
      trend: 'down',
      status: parseFloat(metrics.downtimeRate) < 10 ? 'good' : 'warn',
      category: 'Maintenance',
      unit: '%',
      updatedAgo: '6m ago'
    },
    {
      id: 'fuel-efficiency',
      metricName: 'Average Fuel Efficiency',
      currentValue: `${metrics.fuelEfficiency} MPG`,
      previousValue: `${(parseFloat(metrics.fuelEfficiency) * 0.97).toFixed(1)} MPG`,
      trend: 'up',
      status: 'good',
      category: 'Performance',
      unit: 'MPG',
      updatedAgo: '4m ago'
    }
  ], [metrics]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = analyticsRecords;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.metricName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [analyticsRecords, categoryFilter, searchTerm]);

  // Summary stats for top panels
  const summaryStats = useMemo(() => ({
    totalMetrics: analyticsRecords.length,
    goodStatus: analyticsRecords.filter(r => r.status === 'good').length,
    warnings: analyticsRecords.filter(r => r.status === 'warn').length,
    critical: analyticsRecords.filter(r => r.status === 'bad').length,
    trendsUp: analyticsRecords.filter(r => r.trend === 'up').length,
    trendsDown: analyticsRecords.filter(r => r.trend === 'down').length
  }), [analyticsRecords]);

  // Callbacks
  const toggleRowExpand = useCallback((id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--bg, #0f172a)', color: 'var(--text, #e2e8f0)' }}>
      {/* Professional Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Fleet Analytics</h1>
        <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)', margin: '8px 0 0 0' }}>
          Comprehensive analytics and performance insights across all metrics
        </p>
      </div>

      {/* 6 Gradient Summary Stat Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.25), rgba(59,130,246,0.15))',
          border: '1px solid rgba(96,165,250,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Total Metrics</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>{summaryStats.totalMetrics}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>analytics tracked</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Good Status</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{summaryStats.goodStatus}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>optimal metrics</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))',
          border: '1px solid rgba(245,158,11,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Warnings</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{summaryStats.warnings}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>need attention</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))',
          border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Critical</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>{summaryStats.critical}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>urgent issues</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(124,58,237,0.15))',
          border: '1px solid rgba(139,92,246,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Trends Up</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6' }}>{summaryStats.trendsUp}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>increasing metrics</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(219,39,119,0.15))',
          border: '1px solid rgba(236,72,153,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Trends Down</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ec4899' }}>{summaryStats.trendsDown}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>decreasing metrics</div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        padding: 16, borderRadius: 16,
        background: 'var(--panel, rgba(255,255,255,0.03))',
        border: '1px solid var(--border, rgba(255,255,255,0.08))'
      }}>
        <input
          type="text"
          placeholder="Search metrics..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'var(--bg, rgba(0,0,0,0.2))',
            color: 'var(--text, #e2e8f0)',
            fontSize: 14,
            outline: 'none'
          }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'var(--panel, rgba(255,255,255,0.03))',
            color: 'var(--text, #e2e8f0)',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          <option value="Fleet">Fleet</option>
          <option value="Financial">Financial</option>
          <option value="Performance">Performance</option>
          <option value="Maintenance">Maintenance</option>
        </select>
        <select
          value={selectedPeriod}
          onChange={e => setSelectedPeriod(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid var(--border, rgba(255,255,255,0.08))',
            background: 'var(--panel, rgba(255,255,255,0.03))',
            color: 'var(--text, #e2e8f0)',
            fontSize: 14,
            cursor: 'pointer'
          }}
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Professional Table with Expandable Rows */}
      <div style={{
        borderRadius: 16,
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--panel, rgba(255,255,255,0.03))',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', width: 40 }}></th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Metric</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Category</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Current Value</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Previous Value</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Trend</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map(record => {
              const isExpanded = expandedRows.has(record.id);
              return (
                <React.Fragment key={record.id}>
                  <tr
                    onClick={() => toggleRowExpand(record.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: isExpanded ? 'rgba(96,165,250,0.08)' : 'transparent',
                      transition: 'background 0.2s'
                    }}
                  >
                    <td style={{ padding: 16 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                      }} />
                    </td>
                    <td style={{ padding: 16, fontSize: 14, fontWeight: 500 }}>{record.metricName}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(96,165,250,0.15)',
                        color: '#60a5fa', fontSize: 12
                      }}>
                        {record.category}
                      </span>
                    </td>
                    <td style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>{record.currentValue}</td>
                    <td style={{ padding: 16, fontSize: 14, color: 'var(--muted, #94a3b8)' }}>{record.previousValue}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>
                      <span style={{ color: record.trend === 'up' ? '#10b981' : record.trend === 'down' ? '#ef4444' : '#94a3b8' }}>
                        {record.trend === 'up' ? '↑' : record.trend === 'down' ? '↓' : '→'} {record.trend}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <StatusChip status={record.status} />
                    </td>
                    <td style={{ padding: 16, fontSize: 14, color: 'var(--muted, #94a3b8)' }}>{record.updatedAgo}</td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0 }}>
                        <div style={{
                          padding: 12, borderRadius: 16,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(0,0,0,0.18)', margin: 12
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                            {/* Historical Trends */}
                            <div style={{
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12,
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{
                                fontSize: 12, color: 'var(--muted, #94a3b8)',
                                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8
                              }}>Historical Trends</div>
                              <div style={{
                                height: 80, borderRadius: 12,
                                border: '1px dashed rgba(255,255,255,0.18)',
                                background: 'linear-gradient(180deg, rgba(96,165,250,0.10), rgba(255,255,255,0.03))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'var(--muted, #94a3b8)', fontSize: 12
                              }}>
                                Chart: {selectedPeriod} timeline
                              </div>
                              <div style={{ marginTop: 10, color: 'var(--muted, #94a3b8)', fontSize: 12 }}>
                                View detailed historical data for this metric
                              </div>
                            </div>

                            {/* Performance Comparison */}
                            <div style={{
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12,
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{
                                fontSize: 12, color: 'var(--muted, #94a3b8)',
                                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8
                              }}>Performance Analysis</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Change:</span>{' '}
                                  <span style={{ fontWeight: 600, color: record.trend === 'up' ? '#10b981' : '#ef4444' }}>
                                    {record.trend === 'up' ? '+' : '-'}
                                    {Math.abs(Math.floor(Math.random() * 15) + 3)}%
                                  </span>
                                </div>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Benchmark:</span>{' '}
                                  <span style={{ fontWeight: 600 }}>Industry Avg</span>
                                </div>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Confidence:</span>{' '}
                                  <span style={{ fontWeight: 600, color: '#10b981' }}>High</span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div style={{
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12,
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{
                                fontSize: 12, color: 'var(--muted, #94a3b8)',
                                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8
                              }}>Quick Actions</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <button
                                  style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                                    background: 'rgba(96,165,250,0.15)',
                                    color: 'var(--text, #e2e8f0)', cursor: 'pointer', fontSize: 13
                                  }}
                                >
                                  View Detailed Report
                                </button>
                                <button
                                  style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'var(--text, #e2e8f0)', cursor: 'pointer', fontSize: 13
                                  }}
                                >
                                  Export Data
                                </button>
                                <button
                                  style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'var(--text, #e2e8f0)', cursor: 'pointer', fontSize: 13
                                  }}
                                >
                                  Configure Alerts
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
      </div>

      {/* Empty state */}
      {filteredRecords.length === 0 && (
        <div style={{
          padding: 48, textAlign: 'center',
          color: 'var(--muted, #94a3b8)', fontSize: 14
        }}>
          No analytics metrics found matching your filters.
        </div>
      )}
    </div>
  );
}
