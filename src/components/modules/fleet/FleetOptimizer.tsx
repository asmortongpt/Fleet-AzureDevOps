import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

import apiClient from '@/lib/api-client';
import logger from '@/utils/logger';

type OptimizerStatus = 'good' | 'warn' | 'bad' | 'info';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface UtilizationMetric {
  vehicleId: string;
  vehicleNumber: string;
  utilizationRate: number;
  totalHours: number;
  activeHours: number;
  idleHours: number;
  totalMiles: number;
  tripsCount: number;
  costPerMile: number;
  roi: number;
  recommendation: string;
  recommendationType: string;
  potentialSavings: number;
}

interface Recommendation {
  id?: string;
  type: string;
  title: string;
  description: string;
  priority: Priority;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriodMonths: number;
  confidenceScore: number;
  vehicleIds: string[];
  status?: string;
}

interface FleetSize {
  currentSize: number;
  optimalSize: number;
  recommendation: string;
  potentialSavings: number;
}

// Inline StatusChip component
const StatusChip: React.FC<{ status: OptimizerStatus; label?: string }> = ({ status, label }) => {
  const colorMap: Record<OptimizerStatus, string> = {
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

export function FleetOptimizer() {
  const [utilizationData, setUtilizationData] = useState<UtilizationMetric[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [fleetSize, setFleetSize] = useState<FleetSize | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [utilizationFilter, setUtilizationFilter] = useState<string>('all');

  useEffect(() => {
    fetchUtilizationData();
    fetchRecommendations();
    fetchFleetSize();
  }, []);

  const fetchUtilizationData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<UtilizationMetric[]>('/fleet-optimizer/utilization-heatmap');
      setUtilizationData(response ?? []);
    } catch (error) {
      logger.error('Error fetching utilization data:', error);
      toast.error('Failed to load utilization data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await apiClient.get<Recommendation[]>('/fleet-optimizer/recommendations');
      setRecommendations(response ?? []);
    } catch (error) {
      logger.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    }
  };

  const fetchFleetSize = async () => {
    try {
      const response = await apiClient.get<FleetSize>('/fleet-optimizer/optimal-fleet-size?avgDailyDemand=50');
      if (response) {
        setFleetSize(response);
      }
    } catch (error) {
      logger.error('Error fetching fleet size:', error);
    }
  };

  // Utilization color helpers
  const getUtilizationStatus = (rate: number): OptimizerStatus => {
    if (rate >= 60 && rate <= 85) return 'good';
    if (rate >= 30 && rate < 60) return 'warn';
    if (rate < 30) return 'bad';
    return 'info';
  };

  // Filtered utilization data
  const filteredUtilization = useMemo(() => {
    let filtered = utilizationData;
    if (utilizationFilter !== 'all') {
      if (utilizationFilter === 'optimal') filtered = filtered.filter(v => v.utilizationRate >= 60 && v.utilizationRate <= 85);
      if (utilizationFilter === 'under') filtered = filtered.filter(v => v.utilizationRate < 30);
      if (utilizationFilter === 'over') filtered = filtered.filter(v => v.utilizationRate > 90);
    }
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.recommendation.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [utilizationData, utilizationFilter, searchTerm]);

  // Summary stats
  const summaryStats = useMemo(() => ({
    optimal: utilizationData.filter(v => v.utilizationRate >= 60 && v.utilizationRate <= 85).length,
    underutilized: utilizationData.filter(v => v.utilizationRate < 30).length,
    overutilized: utilizationData.filter(v => v.utilizationRate > 90).length,
    totalSavings: utilizationData.reduce((sum, v) => sum + v.potentialSavings, 0),
    avgUtilization: utilizationData.length > 0 ? utilizationData.reduce((sum, v) => sum + v.utilizationRate, 0) / utilizationData.length : 0,
    highPriorityRecs: recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length
  }), [utilizationData, recommendations]);

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

  const toggleRecommendationExpand = useCallback((id: string) => {
    setExpandedRecommendations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, border: '4px solid rgba(96,165,250,0.2)',
            borderTopColor: '#60a5fa', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--muted, #94a3b8)', fontSize: 14 }}>Loading fleet optimization data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, minHeight: '100vh', background: 'var(--bg, #0f172a)', color: 'var(--text, #e2e8f0)' }}>
      {/* Professional Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>Fleet Utilization Optimizer</h1>
        <p style={{ fontSize: 14, color: 'var(--muted, #94a3b8)', margin: '8px 0 0 0' }}>
          ML-powered analysis and recommendations for fleet optimization
        </p>
      </div>

      {/* Fleet Size Overview Card */}
      {fleetSize && (
        <div style={{
          marginBottom: 32, padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.08))',
          border: '1px solid rgba(96,165,250,0.2)', borderLeft: '4px solid #60a5fa'
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Fleet Size Analysis</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Current Fleet Size</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{fleetSize.currentSize}</div>
              <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginTop: 2 }}>active vehicles</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Optimal Fleet Size</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>{fleetSize.optimalSize}</div>
              <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginTop: 2 }}>recommended</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Potential Savings</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>${fleetSize.potentialSavings.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginTop: 2 }}>annual</div>
            </div>
          </div>
          <div style={{
            marginTop: 16, padding: 16, borderRadius: 12,
            background: 'rgba(96,165,250,0.08)', fontSize: 13
          }}>
            {fleetSize.recommendation}
          </div>
        </div>
      )}

      {/* 6 Gradient Summary Stat Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Optimal Utilization</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{summaryStats.optimal}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>60-85% range</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(239,68,68,0.25), rgba(220,38,38,0.15))',
          border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Underutilized</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>{summaryStats.underutilized}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>below 30%</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(96,165,250,0.25), rgba(59,130,246,0.15))',
          border: '1px solid rgba(96,165,250,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Overutilized</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#60a5fa' }}>{summaryStats.overutilized}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>above 90%</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(217,119,6,0.15))',
          border: '1px solid rgba(245,158,11,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Total Savings</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>${summaryStats.totalSavings.toLocaleString()}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>potential annual</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(124,58,237,0.15))',
          border: '1px solid rgba(139,92,246,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>Avg Utilization</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#8b5cf6' }}>{summaryStats.avgUtilization.toFixed(1)}%</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>fleet average</div>
        </div>

        <div style={{
          padding: 24, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(236,72,153,0.25), rgba(219,39,119,0.15))',
          border: '1px solid rgba(236,72,153,0.2)'
        }}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted, #94a3b8)', marginBottom: 8 }}>High Priority Recs</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ec4899' }}>{summaryStats.highPriorityRecs}</div>
          <div style={{ fontSize: 12, color: 'var(--muted, #94a3b8)', marginTop: 4 }}>urgent actions</div>
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
          placeholder="Search vehicles..."
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
          value={utilizationFilter}
          onChange={e => setUtilizationFilter(e.target.value)}
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
          <option value="all">All Vehicles</option>
          <option value="optimal">Optimal (60-85%)</option>
          <option value="under">Underutilized (&lt;30%)</option>
          <option value="over">Overutilized (&gt;90%)</option>
        </select>
      </div>

      {/* Utilization Heatmap Table */}
      <div style={{
        borderRadius: 16,
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--panel, rgba(255,255,255,0.03))',
        overflow: 'hidden', marginBottom: 32
      }}>
        <div style={{
          padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 16, fontWeight: 600
        }}>Vehicle Utilization Heatmap</div>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em', width: 40 }}></th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Vehicle</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Utilization</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Total Miles</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Trips</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Cost/Mile</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>ROI</th>
              <th style={{ padding: 16, fontSize: 12, color: 'var(--muted, #94a3b8)', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '.12em' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtilization.map(vehicle => {
              const isExpanded = expandedRows.has(vehicle.vehicleId);
              const status = getUtilizationStatus(vehicle.utilizationRate);
              return (
                <React.Fragment key={vehicle.vehicleId}>
                  <tr
                    onClick={() => toggleRowExpand(vehicle.vehicleId)}
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
                    <td style={{ padding: 16, fontSize: 14, fontWeight: 600 }}>{vehicle.vehicleNumber}</td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{vehicle.utilizationRate.toFixed(1)}%</span>
                        <div style={{
                          width: 60, height: 6, borderRadius: 3,
                          background: 'rgba(255,255,255,0.1)', overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(vehicle.utilizationRate, 100)}%`,
                            background: status === 'good' ? '#10b981' : status === 'warn' ? '#f59e0b' : '#ef4444',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 16, fontSize: 14 }}>{vehicle.totalMiles.toLocaleString()}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>{vehicle.tripsCount}</td>
                    <td style={{ padding: 16, fontSize: 14 }}>${vehicle.costPerMile.toFixed(2)}</td>
                    <td style={{ padding: 16, fontSize: 14, color: vehicle.roi >= 0 ? '#10b981' : '#ef4444' }}>
                      {vehicle.roi.toFixed(1)}%
                    </td>
                    <td style={{ padding: 16 }}>
                      <StatusChip status={status} />
                    </td>
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
                            {/* Utilization Details */}
                            <div style={{
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12,
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{
                                fontSize: 12, color: 'var(--muted, #94a3b8)',
                                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8
                              }}>Utilization Details</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Total Hours:</span>{' '}
                                  <span style={{ fontWeight: 600 }}>{vehicle.totalHours.toFixed(1)}h</span>
                                </div>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Active Hours:</span>{' '}
                                  <span style={{ fontWeight: 600, color: '#10b981' }}>{vehicle.activeHours.toFixed(1)}h</span>
                                </div>
                                <div style={{ fontSize: 13 }}>
                                  <span style={{ color: 'var(--muted, #94a3b8)' }}>Idle Hours:</span>{' '}
                                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{vehicle.idleHours.toFixed(1)}h</span>
                                </div>
                              </div>
                            </div>

                            {/* Recommendation */}
                            <div style={{
                              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 12,
                              background: 'rgba(255,255,255,0.03)'
                            }}>
                              <div style={{
                                fontSize: 12, color: 'var(--muted, #94a3b8)',
                                textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 8
                              }}>ML Recommendation</div>
                              <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{vehicle.recommendation}</div>
                              {vehicle.potentialSavings > 0 && (
                                <div style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>
                                  💰 Save ${vehicle.potentialSavings.toLocaleString()}/year
                                </div>
                              )}
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
                                  Apply Recommendation
                                </button>
                                <button
                                  style={{
                                    padding: '8px 12px', borderRadius: 12,
                                    border: '1px solid var(--border, rgba(255,255,255,0.08))',
                                    background: 'rgba(255,255,255,0.03)',
                                    color: 'var(--text, #e2e8f0)', cursor: 'pointer', fontSize: 13
                                  }}
                                >
                                  Schedule Assessment
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

      {/* AI Recommendations Table */}
      <div style={{
        borderRadius: 16,
        border: '1px solid var(--border, rgba(255,255,255,0.08))',
        background: 'var(--panel, rgba(255,255,255,0.03))',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: 20, borderBottom: '1px solid rgba(255,255,255,0.06)',
          fontSize: 16, fontWeight: 600
        }}>AI-Generated Recommendations</div>
        {recommendations.length > 0 ? (
          <div style={{ padding: 12 }}>
            {recommendations.map((rec, idx) => {
              const isExpanded = expandedRecommendations.has(rec.id || idx.toString());
              const priorityColors: Record<Priority, string> = {
                critical: '#ef4444',
                high: '#f59e0b',
                medium: '#60a5fa',
                low: '#94a3b8'
              };
              return (
                <div
                  key={rec.id || idx}
                  style={{
                    marginBottom: 12, borderRadius: 16,
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderLeft: `4px solid ${priorityColors[rec.priority]}`,
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <div
                    onClick={() => toggleRecommendationExpand(rec.id || idx.toString())}
                    style={{ padding: 16, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', marginTop: 6,
                        background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'
                      }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{rec.title}</h3>
                          <span style={{
                            padding: '4px 10px', borderRadius: 8, fontSize: 11,
                            background: `${priorityColors[rec.priority]}22`,
                            color: priorityColors[rec.priority], textTransform: 'uppercase', fontWeight: 600
                          }}>
                            {rec.priority}
                          </span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--muted, #94a3b8)', margin: 0 }}>{rec.description}</p>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Potential Savings</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                              ${rec.potentialSavings.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Implementation Cost</div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>
                              ${rec.implementationCost.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Payback Period</div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>
                              {rec.paybackPeriodMonths} months
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--muted, #94a3b8)', marginBottom: 4 }}>Confidence Score</div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>
                              {(rec.confidenceScore * 100).toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: 48, textAlign: 'center',
            color: 'var(--muted, #94a3b8)', fontSize: 14
          }}>
            No recommendations available at this time.
          </div>
        )}
      </div>
    </div>
  );
}
