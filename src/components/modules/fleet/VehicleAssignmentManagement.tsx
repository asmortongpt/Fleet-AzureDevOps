/**
 * Vehicle Assignment Management Module - Table-First Navigation
 * Professional interface for managing vehicle assignments with expandable drilldowns
 * Fleet Design System compliant
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import logger from '@/utils/logger';

// Mock hooks for auth and permissions
interface AuthUser {
  id: string;
  name: string;
}

interface Permissions {
  can: (permission: string) => boolean;
  isAdmin: boolean;
  isFleetManager: boolean;
}

const useAuth = () => ({
  user: { id: 'mock-user-id', name: 'Mock User' } as AuthUser,
});

const usePermissions = () => ({
  can: (_permission: string) => true,
  isAdmin: true,
  isFleetManager: true,
} as Permissions);

// StatusChip Component
type AssignmentStatus = 'designated'|'on_call'|'temporary'|'active'|'approved'|'submitted'|'denied'|'terminated'|'draft';

const StatusChip: React.FC<{status: AssignmentStatus; label?: string}> = ({status, label}) => {
  const colorMap: Record<AssignmentStatus, string> = {
    designated: '#3b82f6',
    on_call: '#10b981',
    temporary: '#f59e0b',
    active: '#10b981',
    approved: '#3b82f6',
    submitted: '#f59e0b',
    denied: '#ef4444',
    terminated: '#94a3b8',
    draft: '#94a3b8'
  };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'6px 10px', borderRadius:999,
      border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)',
      color: colorMap[status] || '#60a5fa', fontSize:12
    }}>
      ● {label ?? status.toUpperCase()}
    </span>
  );
};

// Types
interface VehicleAssignment {
  id: string;
  vehicle_id: string;
  driver_id: string;
  department_id: string;
  assignment_type: 'designated' | 'on_call' | 'temporary';
  start_date: string;
  end_date?: string;
  lifecycle_state: string;
  approval_status: string;
  commuting_authorized: boolean;
  unit_number: string;
  make: string;
  model: string;
  year: number;
  driver_first_name: string;
  driver_last_name: string;
  employee_number: string;
  department_name: string;
  home_county: string;
  secured_parking_name?: string;
}

interface OnCallPeriod {
  id: string;
  driver_id: string;
  start_datetime: string;
  end_datetime: string;
  is_active: boolean;
  acknowledged_by_driver: boolean;
  callback_count: number;
  driver_first_name: string;
  driver_last_name: string;
}

interface ComplianceException {
  assignment_id: string;
  exception_type: string;
  exception_description: string;
  driver_name: string;
  unit_number: string;
  department_name: string;
}

const VehicleAssignmentManagement: React.FC = () => {
  const { can, isAdmin, isFleetManager } = usePermissions();
  const [activeTab, setActiveTab] = useState<'assignments' | 'on-call' | 'compliance' | 'reports'>('assignments');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [onCallPeriods, setOnCallPeriods] = useState<OnCallPeriod[]>([]);
  const [complianceExceptions, setComplianceExceptions] = useState<ComplianceException[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>('all');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<VehicleAssignment | null>(null);

  useEffect(() => {
    fetchAssignments();
    if (activeTab === 'on-call') {
      fetchOnCallPeriods();
    } else if (activeTab === 'compliance') {
      fetchComplianceExceptions();
    }
  }, [activeTab]);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    if (assignmentTypeFilter !== 'all') {
      filtered = filtered.filter(a => a.assignment_type === assignmentTypeFilter);
    }
    if (lifecycleFilter !== 'all') {
      filtered = filtered.filter(a => a.lifecycle_state === lifecycleFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.driver_first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.driver_last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.employee_number?.includes(searchTerm) ||
        a.unit_number?.includes(searchTerm) ||
        a.department_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [assignments, assignmentTypeFilter, lifecycleFilter, searchTerm]);

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

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vehicle-assignments?limit=100', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setAssignments(data.assignments || []);
    } catch (err: unknown) {
      logger.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOnCallPeriods = async () => {
    try {
      const response = await fetch('/api/on-call-periods/active/current', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setOnCallPeriods(data || []);
    } catch (err: unknown) {
      logger.error('Error fetching on-call periods:', err);
    }
  };

  const fetchComplianceExceptions = async () => {
    try {
      const response = await fetch('/api/reports/policy-compliance', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      setComplianceExceptions(data.exceptions || []);
    } catch (err: unknown) {
      logger.error('Error fetching compliance exceptions:', err);
    }
  };

  const handleApproveAssignment = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (response.ok) fetchAssignments();
    } catch (err: unknown) {
      logger.error('Error approving assignment:', err);
    }
  };

  const handleDenyAssignment = async (assignmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'deny', notes: reason }),
      });
      if (response.ok) fetchAssignments();
    } catch (err: unknown) {
      logger.error('Error denying assignment:', err);
    }
  };

  const stats = useMemo(() => ({
    total: assignments.length,
    active: assignments.filter(a => a.lifecycle_state === 'active').length,
    pending: assignments.filter(a => a.lifecycle_state === 'submitted').length,
    designated: assignments.filter(a => a.assignment_type === 'designated').length,
    onCall: assignments.filter(a => a.assignment_type === 'on_call').length,
    temporary: assignments.filter(a => a.assignment_type === 'temporary').length,
  }), [assignments]);

  return (
    <div style={{padding:32, maxWidth:1600, margin:'0 auto', background:'var(--bg, #0a0f1a)', color:'var(--text, #e2e8f0)', minHeight:'100vh'}}>
      {/* Header */}
      <div style={{marginBottom:32}}>
        <div style={{fontSize:28, fontWeight:900, color:'var(--text, #e2e8f0)', marginBottom:8}}>
          Vehicle Assignment Management
        </div>
        <div style={{fontSize:14, color:'var(--muted, #94a3b8)'}}>
          Professional interface for managing vehicle assignments, on-call periods, and compliance monitoring
        </div>
      </div>

      {/* Tabs */}
      <div style={{marginBottom:32, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex', gap:32}}>
          {(['assignments', 'on-call', 'compliance', 'reports'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding:'12px 0', borderBottom: activeTab === tab ? '2px solid #60a5fa' : '2px solid transparent',
              color: activeTab === tab ? '#60a5fa' : 'var(--muted, #94a3b8)',
              background:'none', border:'none', cursor:'pointer', fontSize:14, fontWeight:600,
              textTransform:'capitalize', transition:'all 0.2s'
            }}>
              {tab === 'on-call' ? 'On-Call Periods' : tab.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'assignments' && (
        <>
          {/* Summary Stats */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16, marginBottom:32}}>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(59,130,246,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Total Assignments</div>
              <div style={{fontSize:32, fontWeight:900, color:'#60a5fa'}}>{stats.total}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Active</div>
              <div style={{fontSize:32, fontWeight:900, color:'#10b981'}}>{stats.active}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Pending Approval</div>
              <div style={{fontSize:32, fontWeight:900, color:'#f59e0b'}}>{stats.pending}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>On-Call</div>
              <div style={{fontSize:32, fontWeight:900, color:'#a855f7'}}>{stats.onCall}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Temporary</div>
              <div style={{fontSize:32, fontWeight:900, color:'#ec4899'}}>{stats.temporary}</div>
            </div>
          </div>

          {/* Search and Actions */}
          <div style={{marginBottom:32, display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, flexWrap:'wrap'}}>
            <div style={{display:'flex', gap:12, flex:1, maxWidth:800}}>
              <input type="text" placeholder="Search driver, vehicle, department..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex:1, padding:'12px 16px', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.03)', color:'var(--text, #e2e8f0)', fontSize:14
                }}
              />
              <select value={assignmentTypeFilter} onChange={(e) => setAssignmentTypeFilter(e.target.value)}
                style={{
                  padding:'12px 16px', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.03)', color:'var(--text, #e2e8f0)', fontSize:14, minWidth:140
                }}
              >
                <option value="all">All Types</option>
                <option value="designated">Designated</option>
                <option value="on_call">On-Call</option>
                <option value="temporary">Temporary</option>
              </select>

              <select value={lifecycleFilter} onChange={(e) => setLifecycleFilter(e.target.value)}
                style={{
                  padding:'12px 16px', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
                  background:'rgba(255,255,255,0.03)', color:'var(--text, #e2e8f0)', fontSize:14, minWidth:140
                }}
              >
                <option value="all">All States</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="active">Active</option>
                <option value="denied">Denied</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            {can('vehicle.create') && (
              <button onClick={() => setShowNewAssignmentModal(true)}
                style={{
                  padding:'12px 24px', borderRadius:16, border:'1px solid rgba(96,165,250,0.3)',
                  background:'linear-gradient(135deg, rgba(96,165,250,0.20), rgba(59,130,246,0.15))',
                  color:'#60a5fa', cursor:'pointer', fontSize:14, fontWeight:600
                }}
              >
                + New Assignment
              </button>
            )}
          </div>

          {/* Professional Table */}
          <div style={{borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em', width:40}}></th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Driver</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Vehicle</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Type</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Start Date</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, #94a3b8)', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{padding:40, textAlign:'center', color:'var(--muted, #94a3b8)'}}>Loading assignments...</td></tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr><td colSpan={8} style={{padding:40, textAlign:'center', color:'var(--muted, #94a3b8)'}}>No assignments found</td></tr>
                ) : (
                  filteredAssignments.map(assignment => {
                    const isExpanded = expandedRows.has(assignment.id);
                    return (
                      <React.Fragment key={assignment.id}>
                        <tr onClick={() => toggleRowExpand(assignment.id)} style={{cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                          <td style={{padding:16}}>
                            <div style={{width:6, height:6, borderRadius:'50%', background: isExpanded ? '#60a5fa' : 'rgba(255,255,255,0.3)'}} />
                          </td>
                          <td style={{padding:16}}>
                            <div style={{fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)', marginBottom:4}}>
                              {assignment.driver_first_name} {assignment.driver_last_name}
                            </div>
                            <div style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>#{assignment.employee_number}</div>
                          </td>
                          <td style={{padding:16}}>
                            <div style={{fontSize:14, color:'var(--text, #e2e8f0)', marginBottom:4}}>{assignment.unit_number}</div>
                            <div style={{fontSize:12, color:'var(--muted, #94a3b8)'}}>{assignment.year} {assignment.make} {assignment.model}</div>
                          </td>
                          <td style={{padding:16}}>
                            <StatusChip status={assignment.assignment_type as AssignmentStatus} label={assignment.assignment_type.replace('_', ' ')} />
                          </td>
                          <td style={{padding:16}}>
                            <StatusChip status={assignment.lifecycle_state as AssignmentStatus} />
                          </td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.department_name}</td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>
                            {new Date(assignment.start_date).toLocaleDateString()}
                          </td>
                          <td style={{padding:16}}>
                            {(isAdmin || isFleetManager) && assignment.lifecycle_state === 'submitted' && (
                              <div style={{display:'flex', gap:8}}>
                                <button onClick={(e) => { e.stopPropagation(); handleApproveAssignment(assignment.id); }}
                                  style={{
                                    padding:'8px 12px', borderRadius:12, border:'1px solid rgba(16,185,129,0.3)',
                                    background:'rgba(16,185,129,0.15)', color:'#10b981', cursor:'pointer', fontSize:12
                                  }}
                                >
                                  Approve
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDenyAssignment(assignment.id, 'Denied'); }}
                                  style={{
                                    padding:'8px 12px', borderRadius:12, border:'1px solid rgba(239,68,68,0.3)',
                                    background:'rgba(239,68,68,0.15)', color:'#ef4444', cursor:'pointer', fontSize:12
                                  }}
                                >
                                  Deny
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} style={{padding:0}}>
                              <div style={{padding:12, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.18)', margin:12}}>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
                                  {/* Assignment Details */}
                                  <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Assignment Details</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>ASSIGNMENT TYPE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.assignment_type.toUpperCase().replace('_', ' ')}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>LIFECYCLE STATE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.lifecycle_state.toUpperCase()}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>COMMUTING AUTHORIZED</div>
                                        <div style={{fontSize:14, color: assignment.commuting_authorized ? '#10b981' : '#ef4444'}}>
                                          {assignment.commuting_authorized ? 'YES' : 'NO'}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>END DATE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>
                                          {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Location & Parking */}
                                  <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Location & Parking</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>HOME COUNTY</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.home_county}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>SECURED PARKING</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.secured_parking_name || 'Not Assigned'}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, #94a3b8)', marginBottom:4}}>DEPARTMENT</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.department_name}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{fontSize:12, color:'var(--muted, #94a3b8)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Quick Actions</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                                      <button onClick={(e) => { e.stopPropagation(); setSelectedAssignment(assignment); setShowEditAssignmentModal(true); }}
                                        style={{
                                          padding:'10px 14px', borderRadius:12, border:'1px solid rgba(96,165,250,0.3)',
                                          background:'rgba(96,165,250,0.15)', color:'#60a5fa', cursor:'pointer', fontSize:13, textAlign:'left'
                                        }}
                                      >
                                        Edit Assignment
                                      </button>
                                      <button style={{
                                        padding:'10px 14px', borderRadius:12, border:'1px solid rgba(168,85,247,0.3)',
                                        background:'rgba(168,85,247,0.15)', color:'#a855f7', cursor:'pointer', fontSize:13, textAlign:'left'
                                      }}>
                                        View Vehicle Details
                                      </button>
                                      <button style={{
                                        padding:'10px 14px', borderRadius:12, border:'1px solid rgba(245,158,11,0.3)',
                                        background:'rgba(245,158,11,0.15)', color:'#f59e0b', cursor:'pointer', fontSize:13, textAlign:'left'
                                      }}>
                                        View Driver Profile
                                      </button>
                                      {assignment.lifecycle_state === 'active' && (
                                        <button style={{
                                          padding:'10px 14px', borderRadius:12, border:'1px solid rgba(239,68,68,0.3)',
                                          background:'rgba(239,68,68,0.15)', color:'#ef4444', cursor:'pointer', fontSize:13, textAlign:'left'
                                        }}>
                                          Terminate Assignment
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'on-call' && (
        <div style={{padding:40, textAlign:'center', color:'var(--muted, #94a3b8)'}}>
          On-Call Management - Coming Soon
        </div>
      )}

      {activeTab === 'compliance' && (
        <div style={{padding:40, textAlign:'center', color:'var(--muted, #94a3b8)'}}>
          Policy Compliance Monitoring - Coming Soon
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{padding:40, textAlign:'center', color:'var(--muted, #94a3b8)'}}>
          Reports & Analytics - Coming Soon
        </div>
      )}

      {/* New Assignment Modal */}
      {showNewAssignmentModal && (
        <div onClick={() => setShowNewAssignmentModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:'var(--panel, #1e293b)', padding:32, borderRadius:24,
            border:'1px solid rgba(255,255,255,0.08)', width:600, maxWidth:'90vw'
          }}>
            <div style={{fontSize:24, fontWeight:900, marginBottom:24, color:'var(--text, #e2e8f0)'}}>
              Create New Assignment
            </div>
            <div style={{fontSize:14, color:'var(--muted, #94a3b8)', marginBottom:24}}>
              Assignment creation form will be implemented here
            </div>
            <button onClick={() => setShowNewAssignmentModal(false)} style={{
              padding:'12px 24px', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.03)', color:'var(--text, #e2e8f0)', cursor:'pointer', fontSize:14
            }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignmentModal && selectedAssignment && (
        <div onClick={() => setShowEditAssignmentModal(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:'var(--panel, #1e293b)', padding:32, borderRadius:24,
            border:'1px solid rgba(255,255,255,0.08)', width:600, maxWidth:'90vw'
          }}>
            <div style={{fontSize:24, fontWeight:900, marginBottom:24, color:'var(--text, #e2e8f0)'}}>
              Edit Assignment
            </div>
            <div style={{fontSize:14, color:'var(--muted, #94a3b8)', marginBottom:24}}>
              Editing: {selectedAssignment.driver_first_name} {selectedAssignment.driver_last_name} - {selectedAssignment.unit_number}
            </div>
            <button onClick={() => setShowEditAssignmentModal(false)} style={{
              padding:'12px 24px', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
              background:'rgba(255,255,255,0.03)', color:'var(--text, #e2e8f0)', cursor:'pointer', fontSize:14
            }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAssignmentManagement;
