/**
 * Vehicle Assignment Management Module - Table-First Navigation
 * Professional interface for managing vehicle assignments with expandable drilldowns
 * Fleet Design System compliant
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';

import { useDrilldown } from '@/contexts/DrilldownContext';
import { getCsrfToken } from '@/hooks/use-api';
import { usePermissions } from '@/hooks/usePermissions';
import { formatEnum } from '@/utils/format-enum';
import { formatDate } from '@/utils/format-helpers';
import logger from '@/utils/logger';
import { formatVehicleName } from '@/utils/vehicle-display';


// StatusChip Component
type AssignmentStatus = 'designated'|'on_call'|'temporary'|'active'|'approved'|'submitted'|'denied'|'terminated'|'draft';

const StatusChip: React.FC<{status: AssignmentStatus; label?: string}> = ({status, label}) => {
  const colorMap: Record<AssignmentStatus, string> = {
    designated: '#10b981',
    on_call: '#10b981',
    temporary: '#f59e0b',
    active: '#10b981',
    approved: '#06b6d4',
    submitted: '#f59e0b',
    denied: '#ef4444',
    terminated: 'rgba(255,255,255,0.4)',
    draft: 'rgba(255,255,255,0.4)'
  };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:8,
      padding:'6px 10px', borderRadius:999,
      border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)',
      color: colorMap[status] || '#34d399', fontSize:12
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
  const { push } = useDrilldown();
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

  // Form state for New Assignment modal
  const [newForm, setNewForm] = useState({
    vehicle_id: '', driver_id: '', assignment_type: 'primary' as string,
    start_date: '', end_date: '', commuting_authorized: false, notes: ''
  });
  const [newFormSubmitting, setNewFormSubmitting] = useState(false);

  // Form state for Edit Assignment modal
  const [editForm, setEditForm] = useState({
    assignment_type: '', end_date: '', commuting_authorized: false, notes: ''
  });
  const [editFormSubmitting, setEditFormSubmitting] = useState(false);

  // Vehicle and driver lists for dropdowns
  const [vehicleOptions, setVehicleOptions] = useState<{id: string; label: string}[]>([]);
  const [driverOptions, setDriverOptions] = useState<{id: string; label: string}[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    fetchAssignments();
    if (activeTab === 'on-call') {
      fetchOnCallPeriods();
    } else if (activeTab === 'compliance') {
      fetchComplianceExceptions();
    }
  }, [activeTab]);

  // Load vehicle/driver options when New Assignment modal opens
  useEffect(() => {
    if (!showNewAssignmentModal) return;
    const loadOptions = async () => {
      setOptionsLoading(true);
      try {
        const [vRes, dRes] = await Promise.all([
          fetch('/api/vehicles?limit=200', { credentials: 'include' }),
          fetch('/api/drivers?limit=200', { credentials: 'include' }),
        ]);
        if (vRes.ok) {
          const vData = await vRes.json();
          // Handle response formatter: { success, data: { data: [...], total } }
          const vPayload = vData?.data || vData;
          const vehicles = Array.isArray(vPayload) ? vPayload : (vPayload?.data || vPayload?.vehicles || []);
          setVehicleOptions(vehicles.map((v: Record<string, unknown>) => ({
            id: String(v.id),
            label: formatVehicleName({ year: v.year as number | undefined, make: v.make as string | undefined, model: v.model as string | undefined, number: v.unit_number as string | undefined })
          })));
        }
        if (dRes.ok) {
          const dData = await dRes.json();
          // Handle response formatter: { success, data: { data: [...], total } }
          const dPayload = dData?.data || dData;
          const drivers = Array.isArray(dPayload) ? dPayload : (dPayload?.data || dPayload?.drivers || []);
          setDriverOptions(drivers.map((d: Record<string, unknown>) => ({
            id: String(d.id),
            label: `${d.first_name || ''} ${d.last_name || ''} (#${d.employee_number || ''})`.trim()
          })));
        }
      } catch (err) {
        logger.error('Error loading vehicle/driver options:', err);
      } finally {
        setOptionsLoading(false);
      }
    };
    loadOptions();
    // Reset form when modal opens
    setNewForm({ vehicle_id: '', driver_id: '', assignment_type: 'primary', start_date: '', end_date: '', commuting_authorized: false, notes: '' });
  }, [showNewAssignmentModal]);

  // Populate edit form when selectedAssignment changes
  useEffect(() => {
    if (selectedAssignment) {
      setEditForm({
        assignment_type: selectedAssignment.assignment_type,
        end_date: selectedAssignment.end_date || '',
        commuting_authorized: selectedAssignment.commuting_authorized,
        notes: ''
      });
    }
  }, [selectedAssignment]);

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
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      const data = await response.json();
      // Response formatter wraps in { success, data: { assignments, pagination } }
      const payload = data?.data || data;
      const rawAssignments = payload?.assignments || [];
      // Map backend field names to what the UI expects
      const mapped = rawAssignments.map((a: Record<string, unknown>) => ({
        ...a,
        // Backend returns 'status'; UI uses 'lifecycle_state'
        lifecycle_state: a.lifecycle_state || a.status || 'active',
        // Backend returns is_primary_assignment; map commuting_authorized
        commuting_authorized: a.commuting_authorized ?? a.is_primary_assignment ?? false,
        // unit_number may come as 'unit_number' or fallback to 'vehicle_number'
        unit_number: a.unit_number || a.vehicle_number || '',
        // department_name is not joined in the current query; use empty string
        department_name: a.department_name || '',
        // home_county, secured_parking_name not in current query
        home_county: a.home_county || '',
        secured_parking_name: a.secured_parking_name || '',
        // employee_number fallback
        employee_number: a.employee_number || '',
      }));
      setAssignments(mapped);
    } catch (err: unknown) {
      logger.error('Error fetching assignments:', err);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOnCallPeriods = async () => {
    try {
      const response = await fetch('/api/on-call-management/active/current', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      const data = await response.json();
      // Handle response formatter wrapping
      const payload = data?.data || data;
      setOnCallPeriods(Array.isArray(payload) ? payload : payload?.periods || []);
    } catch (err: unknown) {
      logger.error('Error fetching on-call periods:', err);
      // Silently fail - on-call periods are secondary data
    }
  };

  const fetchComplianceExceptions = async () => {
    try {
      const response = await fetch('/api/assignment-reporting/policy-compliance', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      const data = await response.json();
      // Handle response formatter wrapping
      const payload = data?.data || data;
      setComplianceExceptions(payload?.exceptions || []);
    } catch (err: unknown) {
      logger.error('Error fetching compliance exceptions:', err);
      // Silently fail - compliance data is secondary
    }
  };

  const handleApproveAssignment = async (assignmentId: string) => {
    try {
      const csrf = await getCsrfToken();
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve' }),
      });
      if (response.ok) {
        toast.success('Assignment approved');
        fetchAssignments();
      }
    } catch (err: unknown) {
      logger.error('Error approving assignment:', err);
      toast.error('Failed to approve assignment');
    }
  };

  const handleTerminateAssignment = async (assignmentId: string) => {
    try {
      const csrf = await getCsrfToken();
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Terminated by fleet manager' })
      });
      if (!response.ok) throw new Error('Failed to terminate');
      toast.success('Assignment terminated');
      fetchAssignments();
    } catch (err: unknown) {
      logger.error('Error terminating assignment:', err);
      toast.error('Failed to terminate assignment');
    }
  };

  const handleDenyAssignment = async (assignmentId: string, reason: string) => {
    try {
      const csrf = await getCsrfToken();
      const response = await fetch(`/api/vehicle-assignments/${assignmentId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrf,
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'deny', notes: reason }),
      });
      if (response.ok) {
        toast.success('Assignment denied');
        fetchAssignments();
      }
    } catch (err: unknown) {
      logger.error('Error denying assignment:', err);
      toast.error('Failed to deny assignment');
    }
  };

  const handleCreateAssignment = async () => {
    if (!newForm.vehicle_id || !newForm.driver_id || !newForm.start_date) {
      toast.error('Vehicle, driver, and start date are required');
      return;
    }
    setNewFormSubmitting(true);
    try {
      const csrf = await getCsrfToken();
      const body: Record<string, unknown> = {
        vehicle_id: newForm.vehicle_id,
        driver_id: newForm.driver_id,
        assignment_type: newForm.assignment_type,
        start_date: newForm.start_date,
        commuting_authorized: newForm.commuting_authorized,
        notes: newForm.notes || undefined,
      };
      if (newForm.end_date) body.end_date = newForm.end_date;
      const response = await fetch('/api/vehicle-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as Record<string, string>).message || 'Failed to create assignment');
      }
      toast.success('Assignment created successfully');
      setShowNewAssignmentModal(false);
      fetchAssignments();
    } catch (err: unknown) {
      logger.error('Error creating assignment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create assignment');
    } finally {
      setNewFormSubmitting(false);
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedAssignment) return;
    setEditFormSubmitting(true);
    try {
      const csrf = await getCsrfToken();
      const body: Record<string, unknown> = {
        assignment_type: editForm.assignment_type,
        commuting_authorized: editForm.commuting_authorized,
        notes: editForm.notes || undefined,
      };
      if (editForm.end_date) body.end_date = editForm.end_date;
      const response = await fetch(`/api/vehicle-assignments/${selectedAssignment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as Record<string, string>).message || 'Failed to update assignment');
      }
      toast.success('Assignment updated successfully');
      setShowEditAssignmentModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err: unknown) {
      logger.error('Error updating assignment:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update assignment');
    } finally {
      setEditFormSubmitting(false);
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
        <div style={{fontSize:14, color:'var(--muted, rgba(255,255,255,0.4))'}}>
          Professional interface for managing vehicle assignments, on-call periods, and compliance monitoring
        </div>
      </div>

      {/* Tabs */}
      <div style={{marginBottom:32, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex', gap:32}}>
          {(['assignments', 'on-call', 'compliance', 'reports'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding:'12px 0', borderBottom: activeTab === tab ? '2px solid #34d399' : '2px solid transparent',
              color: activeTab === tab ? '#34d399' : 'rgba(255,255,255,0.4)',
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
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, fontWeight:600}}>Total Assignments</div>
              <div style={{fontSize:32, fontWeight:900, color:'#34d399'}}>{stats.total}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, fontWeight:600}}>Active</div>
              <div style={{fontSize:32, fontWeight:900, color:'#10b981'}}>{stats.active}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, fontWeight:600}}>Pending Approval</div>
              <div style={{fontSize:32, fontWeight:900, color:'#f59e0b'}}>{stats.pending}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, fontWeight:600}}>On-Call</div>
              <div style={{fontSize:32, fontWeight:900, color:'#a855f7'}}>{stats.onCall}</div>
            </div>

            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(236,72,153,0.05))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8, fontWeight:600}}>Temporary</div>
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
                  padding:'12px 24px', borderRadius:16, border:'1px solid rgba(16,185,129,0.3)',
                  background:'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.15))',
                  color:'#34d399', cursor:'pointer', fontSize:14, fontWeight:600
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
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em', width:40}}></th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Driver</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Vehicle</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Type</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Start Date</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{padding:40, textAlign:'center', color:'var(--muted, rgba(255,255,255,0.4))'}}>Loading assignments...</td></tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr><td colSpan={8} style={{padding:40, textAlign:'center', color:'var(--muted, rgba(255,255,255,0.4))'}}>No assignments found</td></tr>
                ) : (
                  filteredAssignments.map(assignment => {
                    const isExpanded = expandedRows.has(assignment.id);
                    return (
                      <React.Fragment key={assignment.id}>
                        <tr onClick={() => toggleRowExpand(assignment.id)} style={{cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                          <td style={{padding:16}}>
                            <div style={{width:6, height:6, borderRadius:'50%', background: isExpanded ? '#34d399' : 'rgba(255,255,255,0.3)'}} />
                          </td>
                          <td style={{padding:16}}>
                            <div style={{fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)', marginBottom:4}}>
                              {assignment.driver_first_name} {assignment.driver_last_name}
                            </div>
                            <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))'}}>#{assignment.employee_number}</div>
                          </td>
                          <td style={{padding:16}}>
                            <div style={{fontSize:14, color:'var(--text, #e2e8f0)', marginBottom:4}}>{assignment.unit_number}</div>
                            <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))'}}>{formatVehicleName(assignment)}</div>
                          </td>
                          <td style={{padding:16}}>
                            <StatusChip status={assignment.assignment_type as AssignmentStatus} label={formatEnum(assignment.assignment_type)} />
                          </td>
                          <td style={{padding:16}}>
                            <StatusChip status={assignment.lifecycle_state as AssignmentStatus} />
                          </td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.department_name}</td>
                          <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>
                            {formatDate(assignment.start_date)}
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
                                    <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Assignment Details</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>ASSIGNMENT TYPE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{formatEnum(assignment.assignment_type)}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>LIFECYCLE STATE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{formatEnum(assignment.lifecycle_state)}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>COMMUTING AUTHORIZED</div>
                                        <div style={{fontSize:14, color: assignment.commuting_authorized ? '#10b981' : '#ef4444'}}>
                                          {assignment.commuting_authorized ? 'YES' : 'NO'}
                                        </div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>END DATE</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>
                                          {assignment.end_date ? formatDate(assignment.end_date) : 'Ongoing'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Location & Parking */}
                                  <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Location & Parking</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:10}}>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>HOME COUNTY</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.home_county}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>SECURED PARKING</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.secured_parking_name || 'Not Assigned'}</div>
                                      </div>
                                      <div>
                                        <div style={{fontSize:11, color:'var(--muted, rgba(255,255,255,0.4))', marginBottom:4}}>DEPARTMENT</div>
                                        <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{assignment.department_name}</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div style={{border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, background:'rgba(255,255,255,0.03)'}}>
                                    <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:12}}>Quick Actions</div>
                                    <div style={{display:'flex', flexDirection:'column', gap:8}}>
                                      <button onClick={(e) => { e.stopPropagation(); setSelectedAssignment(assignment); setShowEditAssignmentModal(true); }}
                                        style={{
                                          padding:'10px 14px', borderRadius:12, border:'1px solid rgba(16,185,129,0.3)',
                                          background:'rgba(16,185,129,0.15)', color:'#34d399', cursor:'pointer', fontSize:13, textAlign:'left'
                                        }}
                                      >
                                        Edit Assignment
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); push({ id: assignment.vehicle_id, type: 'vehicle-details', label: formatVehicleName({ make: assignment.make, model: assignment.model, number: assignment.unit_number }), data: { vehicleId: assignment.vehicle_id } }); }}
                                        style={{
                                          padding:'10px 14px', borderRadius:12, border:'1px solid rgba(168,85,247,0.3)',
                                          background:'rgba(168,85,247,0.15)', color:'#a855f7', cursor:'pointer', fontSize:13, textAlign:'left'
                                        }}>
                                        View Vehicle Details
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); push({ id: assignment.driver_id, type: 'driver', label: `${assignment.driver_first_name} ${assignment.driver_last_name}`, data: { driverId: assignment.driver_id, driverName: `${assignment.driver_first_name} ${assignment.driver_last_name}` } }); }}
                                        style={{
                                          padding:'10px 14px', borderRadius:12, border:'1px solid rgba(245,158,11,0.3)',
                                          background:'rgba(245,158,11,0.15)', color:'#f59e0b', cursor:'pointer', fontSize:13, textAlign:'left'
                                        }}>
                                        View Driver Profile
                                      </button>
                                      {assignment.lifecycle_state === 'active' && (
                                        <button onClick={(e) => { e.stopPropagation(); handleTerminateAssignment(assignment.id); }}
                                          style={{
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
        <>
          {/* On-Call Summary */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:24}}>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Active On-Call</div>
              <div style={{fontSize:32, fontWeight:900, color:'#10b981'}}>{onCallPeriods.filter(p => p.is_active).length}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>On-Call Assignments</div>
              <div style={{fontSize:32, fontWeight:900, color:'#34d399'}}>{assignments.filter(a => a.assignment_type === 'on_call').length}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Pending Acknowledgement</div>
              <div style={{fontSize:32, fontWeight:900, color:'#f59e0b'}}>{onCallPeriods.filter(p => p.is_active && !p.acknowledged_by_driver).length}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Total Callbacks</div>
              <div style={{fontSize:32, fontWeight:900, color:'#a855f7'}}>{onCallPeriods.reduce((sum, p) => sum + (p.callback_count || 0), 0)}</div>
            </div>
          </div>

          {/* On-Call Periods Table */}
          <div style={{borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Driver</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Start</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>End</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Acknowledged</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Callbacks</th>
                </tr>
              </thead>
              <tbody>
                {onCallPeriods.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} style={{padding:40, textAlign:'center', color:'var(--muted, rgba(255,255,255,0.4))'}}>
                      {assignments.filter(a => a.assignment_type === 'on_call').length > 0
                        ? 'No active on-call periods. On-call assigned drivers are currently off rotation.'
                        : 'No on-call assignments configured. Create on-call assignments from the Assignments tab.'
                      }
                    </td>
                  </tr>
                ) : (
                  onCallPeriods.map(period => (
                    <tr key={period.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <td style={{padding:16, fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)'}}>
                        {period.driver_first_name} {period.driver_last_name}
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{formatDate(period.start_datetime)}</td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{formatDate(period.end_datetime)}</td>
                      <td style={{padding:16}}>
                        <StatusChip status={period.is_active ? 'active' : 'terminated'} label={period.is_active ? 'Active' : 'Ended'} />
                      </td>
                      <td style={{padding:16}}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:6,
                          padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:600,
                          color: period.acknowledged_by_driver ? '#10b981' : '#f59e0b',
                          border: `1px solid ${period.acknowledged_by_driver ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                          background: period.acknowledged_by_driver ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                        }}>
                          {period.acknowledged_by_driver ? 'Confirmed' : 'Pending'}
                        </span>
                      </td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)', textAlign:'right', fontWeight:600}}>
                        {period.callback_count || 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* On-call drivers from assignments (fallback if no on-call periods API) */}
          {onCallPeriods.length === 0 && assignments.filter(a => a.assignment_type === 'on_call').length > 0 && (
            <div style={{marginTop:24}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)', marginBottom:16}}>On-Call Assigned Drivers</div>
              <div style={{borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', overflow:'hidden'}}>
                <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
                  <thead>
                    <tr style={{background:'rgba(255,255,255,0.02)'}}>
                      <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Driver</th>
                      <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Vehicle</th>
                      <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                      <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Status</th>
                      <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Assignment Start</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.filter(a => a.assignment_type === 'on_call').map(a => (
                      <tr key={a.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        <td style={{padding:16}}>
                          <div style={{fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)'}}>{a.driver_first_name} {a.driver_last_name}</div>
                          <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))'}}>#{a.employee_number}</div>
                        </td>
                        <td style={{padding:16}}>
                          <div style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{a.unit_number}</div>
                          <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))'}}>{formatVehicleName(a)}</div>
                        </td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{a.department_name}</td>
                        <td style={{padding:16}}>
                          <StatusChip status={a.lifecycle_state as AssignmentStatus} />
                        </td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{formatDate(a.start_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'compliance' && (
        <>
          {/* Compliance Summary */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:24}}>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Compliant Assignments</div>
              <div style={{fontSize:32, fontWeight:900, color:'#10b981'}}>{Math.max(0, assignments.length - complianceExceptions.length)}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Policy Exceptions</div>
              <div style={{fontSize:32, fontWeight:900, color:'#ef4444'}}>{complianceExceptions.length}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Compliance Rate</div>
              <div style={{fontSize:32, fontWeight:900, color:'#34d399'}}>
                {assignments.length > 0 ? Math.round(((assignments.length - complianceExceptions.length) / assignments.length) * 100) : 100}%
              </div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Commuting Authorized</div>
              <div style={{fontSize:32, fontWeight:900, color:'#f59e0b'}}>{assignments.filter(a => a.commuting_authorized).length}</div>
            </div>
          </div>

          {/* Compliance Exceptions Table */}
          <div style={{borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', overflow:'hidden'}}>
            <div style={{padding:16, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)'}}>Policy Compliance Exceptions</div>
              <div style={{fontSize:13, color:'var(--muted, rgba(255,255,255,0.4))', marginTop:4}}>Assignments that do not meet current policy requirements</div>
            </div>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Driver</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Vehicle</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Exception Type</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Description</th>
                </tr>
              </thead>
              <tbody>
                {complianceExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{padding:40, textAlign:'center', color:'var(--muted, rgba(255,255,255,0.4))'}}>
                      {assignments.length > 0
                        ? 'All assignments comply with current policies. No exceptions found.'
                        : 'No assignment data available to evaluate compliance.'
                      }
                    </td>
                  </tr>
                ) : (
                  complianceExceptions.map((exc, idx) => (
                    <tr key={`${exc.assignment_id}-${exc.exception_type}-${idx}`} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <td style={{padding:16, fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)'}}>{exc.driver_name}</td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{exc.unit_number}</td>
                      <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)'}}>{exc.department_name}</td>
                      <td style={{padding:16}}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:999, fontSize:12, fontWeight:600,
                          color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', background:'rgba(239,68,68,0.15)',
                        }}>
                          {exc.exception_type ? formatEnum(exc.exception_type) : 'Policy Violation'}
                        </span>
                      </td>
                      <td style={{padding:16, fontSize:13, color:'var(--muted, rgba(255,255,255,0.4))', maxWidth:300}}>{exc.exception_description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Assignment Policy Status */}
          {assignments.length > 0 && (
            <div style={{marginTop:24}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)', marginBottom:16}}>Assignment Policy Checks</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:12}}>
                {assignments.slice(0, 10).map(a => {
                  const hasException = complianceExceptions.some(e => e.assignment_id === a.id || e.unit_number === a.unit_number);
                  const isApproved = a.lifecycle_state === 'active' || a.lifecycle_state === 'approved';
                  return (
                    <div key={a.id} style={{
                      padding:16, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.02)',
                      borderLeft: `4px solid ${hasException ? '#ef4444' : isApproved ? '#10b981' : '#f59e0b'}`,
                    }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                        <div style={{fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)'}}>
                          {a.driver_first_name} {a.driver_last_name}
                        </div>
                        <span style={{
                          padding:'3px 8px', borderRadius:999, fontSize:11, fontWeight:600,
                          color: hasException ? '#ef4444' : '#10b981',
                          background: hasException ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                        }}>
                          {hasException ? 'NON-COMPLIANT' : 'COMPLIANT'}
                        </span>
                      </div>
                      <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))'}}>
                        {a.unit_number} | {a.department_name} | {formatEnum(a.assignment_type)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'reports' && (
        <>
          {/* Reports Summary Cards */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:16, marginBottom:32}}>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Total Assignments</div>
              <div style={{fontSize:32, fontWeight:900, color:'#34d399'}}>{stats.total}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Active Rate</div>
              <div style={{fontSize:32, fontWeight:900, color:'#10b981'}}>
                {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
              </div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Approval Pending</div>
              <div style={{fontSize:32, fontWeight:900, color:'#f59e0b'}}>{stats.pending}</div>
            </div>
            <div style={{padding:20, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.08))'}}>
              <div style={{fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>Commuting Auth'd</div>
              <div style={{fontSize:32, fontWeight:900, color:'#a855f7'}}>{assignments.filter(a => a.commuting_authorized).length}</div>
            </div>
          </div>

          {/* Assignment Type Distribution */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:32}}>
            <div style={{padding:24, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)', marginBottom:20}}>Assignment Type Distribution</div>
              {[
                { label: 'Designated', count: stats.designated, color: '#10b981' },
                { label: 'On-Call', count: stats.onCall, color: '#10b981' },
                { label: 'Temporary', count: stats.temporary, color: '#f59e0b' },
              ].map(item => (
                <div key={item.label} style={{marginBottom:16}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                    <span style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{item.label}</span>
                    <span style={{fontSize:14, fontWeight:700, color:item.color}}>{item.count}</span>
                  </div>
                  <div style={{width:'100%', height:8, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden'}}>
                    <div style={{
                      width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%',
                      height:'100%', borderRadius:4, background:item.color, transition:'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{padding:24, borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)', marginBottom:20}}>Lifecycle State Breakdown</div>
              {[
                { label: 'Active', count: stats.active, color: '#10b981' },
                { label: 'Pending Approval', count: stats.pending, color: '#f59e0b' },
                { label: 'Denied', count: assignments.filter(a => a.lifecycle_state === 'denied').length, color: '#ef4444' },
                { label: 'Terminated', count: assignments.filter(a => a.lifecycle_state === 'terminated').length, color: 'rgba(255,255,255,0.4)' },
                { label: 'Draft', count: assignments.filter(a => a.lifecycle_state === 'draft').length, color: 'rgba(255,255,255,0.3)' },
              ].filter(item => item.count > 0).map(item => (
                <div key={item.label} style={{marginBottom:16}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                    <span style={{fontSize:14, color:'var(--text, #e2e8f0)'}}>{item.label}</span>
                    <span style={{fontSize:14, fontWeight:700, color:item.color}}>{item.count}</span>
                  </div>
                  <div style={{width:'100%', height:8, borderRadius:4, background:'rgba(255,255,255,0.06)', overflow:'hidden'}}>
                    <div style={{
                      width: stats.total > 0 ? `${(item.count / stats.total) * 100}%` : '0%',
                      height:'100%', borderRadius:4, background:item.color, transition:'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
              {stats.total === 0 && (
                <div style={{fontSize:14, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'center', padding:20}}>No assignment data available</div>
              )}
            </div>
          </div>

          {/* Department Utilization Table */}
          <div style={{borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)', overflow:'hidden'}}>
            <div style={{padding:16, borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:16, fontWeight:700, color:'var(--text, #e2e8f0)'}}>Department Utilization</div>
              <div style={{fontSize:13, color:'var(--muted, rgba(255,255,255,0.4))', marginTop:4}}>Vehicle assignment distribution by department</div>
            </div>
            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:0}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.02)'}}>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'left', textTransform:'uppercase', letterSpacing:'.12em'}}>Department</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Total</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Active</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Designated</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>On-Call</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Temporary</th>
                  <th style={{padding:16, fontSize:12, color:'var(--muted, rgba(255,255,255,0.4))', textAlign:'right', textTransform:'uppercase', letterSpacing:'.12em'}}>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const depts = new Map<string, { total: number; active: number; designated: number; onCall: number; temporary: number }>();
                  assignments.forEach(a => {
                    const name = a.department_name || 'Unassigned';
                    const existing = depts.get(name) || { total: 0, active: 0, designated: 0, onCall: 0, temporary: 0 };
                    existing.total++;
                    if (a.lifecycle_state === 'active') existing.active++;
                    if (a.assignment_type === 'designated') existing.designated++;
                    if (a.assignment_type === 'on_call') existing.onCall++;
                    if (a.assignment_type === 'temporary') existing.temporary++;
                    depts.set(name, existing);
                  });
                  const entries = Array.from(depts.entries()).sort((a, b) => b[1].total - a[1].total);
                  if (entries.length === 0) {
                    return (
                      <tr><td colSpan={7} style={{padding:40, textAlign:'center', color:'var(--muted, rgba(255,255,255,0.4))'}}>No assignment data available</td></tr>
                    );
                  }
                  return entries.map(([name, d]) => {
                    const utilization = d.total > 0 ? Math.round((d.active / d.total) * 100) : 0;
                    return (
                      <tr key={name} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                        <td style={{padding:16, fontSize:14, fontWeight:600, color:'var(--text, #e2e8f0)'}}>{name}</td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)', textAlign:'right'}}>{d.total}</td>
                        <td style={{padding:16, fontSize:14, color:'#10b981', textAlign:'right', fontWeight:600}}>{d.active}</td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)', textAlign:'right'}}>{d.designated}</td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)', textAlign:'right'}}>{d.onCall}</td>
                        <td style={{padding:16, fontSize:14, color:'var(--text, #e2e8f0)', textAlign:'right'}}>{d.temporary}</td>
                        <td style={{padding:16, textAlign:'right'}}>
                          <div style={{display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8}}>
                            <div style={{width:60, height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden'}}>
                              <div style={{width:`${utilization}%`, height:'100%', borderRadius:3, background: utilization >= 80 ? '#10b981' : utilization >= 50 ? '#f59e0b' : '#ef4444'}} />
                            </div>
                            <span style={{fontSize:13, color:'var(--text, #e2e8f0)', minWidth:36, textAlign:'right'}}>{utilization}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* New Assignment Modal */}
      {showNewAssignmentModal && (
        <div onClick={() => setShowNewAssignmentModal(false)} onKeyDown={(e) => e.key === 'Escape' && setShowNewAssignmentModal(false)} role="dialog" aria-modal="true" aria-label="Create New Assignment" style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:'#242424', padding:32, borderRadius:24,
            border:'1px solid rgba(255,255,255,0.08)', width:640, maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto'
          }}>
            <div style={{fontSize:24, fontWeight:900, marginBottom:8, color:'white'}}>
              Create New Assignment
            </div>
            <div style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24}}>
              Assign a vehicle to a driver with the appropriate assignment type and dates.
            </div>

            {optionsLoading ? (
              <div style={{padding:40, textAlign:'center', color:'rgba(255,255,255,0.4)'}}>Loading vehicles and drivers...</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {/* Vehicle Selector */}
                <div>
                  <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Vehicle *</label>
                  <select value={newForm.vehicle_id} onChange={(e) => setNewForm(f => ({...f, vehicle_id: e.target.value}))}
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)', color:'white', fontSize:14
                    }}>
                    <option value="">Select a vehicle...</option>
                    {vehicleOptions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>

                {/* Driver Selector */}
                <div>
                  <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Driver *</label>
                  <select value={newForm.driver_id} onChange={(e) => setNewForm(f => ({...f, driver_id: e.target.value}))}
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)', color:'white', fontSize:14
                    }}>
                    <option value="">Select a driver...</option>
                    {driverOptions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>

                {/* Assignment Type */}
                <div>
                  <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Assignment Type *</label>
                  <select value={newForm.assignment_type} onChange={(e) => setNewForm(f => ({...f, assignment_type: e.target.value}))}
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)', color:'white', fontSize:14
                    }}>
                    <option value="primary">Primary</option>
                    <option value="temporary">Temporary</option>
                    <option value="shared">Shared</option>
                    <option value="pool">Pool</option>
                  </select>
                </div>

                {/* Dates Row */}
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
                  <div>
                    <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Start Date *</label>
                    <input type="date" value={newForm.start_date} onChange={(e) => setNewForm(f => ({...f, start_date: e.target.value}))}
                      style={{
                        width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                        background:'rgba(255,255,255,0.03)', color:'white', fontSize:14, colorScheme:'dark'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>End Date</label>
                    <input type="date" value={newForm.end_date} onChange={(e) => setNewForm(f => ({...f, end_date: e.target.value}))}
                      style={{
                        width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                        background:'rgba(255,255,255,0.03)', color:'white', fontSize:14, colorScheme:'dark'
                      }}
                    />
                  </div>
                </div>

                {/* Commuting Authorized */}
                <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 0'}}>
                  <input type="checkbox" checked={newForm.commuting_authorized}
                    onChange={(e) => setNewForm(f => ({...f, commuting_authorized: e.target.checked}))}
                    style={{width:18, height:18, accentColor:'#10b981', cursor:'pointer'}}
                  />
                  <span style={{fontSize:14, color:'rgba(255,255,255,0.8)'}}>Commuting Authorized</span>
                </label>

                {/* Notes */}
                <div>
                  <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Notes</label>
                  <textarea value={newForm.notes} onChange={(e) => setNewForm(f => ({...f, notes: e.target.value}))}
                    rows={3} placeholder="Optional notes about this assignment..."
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)', color:'white', fontSize:14, resize:'vertical', fontFamily:'inherit'
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:8}}>
                  <button onClick={() => setShowNewAssignmentModal(false)} disabled={newFormSubmitting}
                    style={{
                      padding:'12px 24px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                      background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:14
                    }}>
                    Cancel
                  </button>
                  <button onClick={handleCreateAssignment} disabled={newFormSubmitting || !newForm.vehicle_id || !newForm.driver_id || !newForm.start_date}
                    style={{
                      padding:'12px 24px', borderRadius:12, border:'1px solid rgba(16,185,129,0.3)',
                      background: newFormSubmitting ? 'rgba(16,185,129,0.08)' : 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.15))',
                      color: (!newForm.vehicle_id || !newForm.driver_id || !newForm.start_date) ? 'rgba(52,211,153,0.4)' : '#34d399',
                      cursor: newFormSubmitting ? 'wait' : 'pointer', fontSize:14, fontWeight:600,
                      opacity: (!newForm.vehicle_id || !newForm.driver_id || !newForm.start_date) ? 0.5 : 1,
                    }}>
                    {newFormSubmitting ? 'Creating...' : 'Create Assignment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditAssignmentModal && selectedAssignment && (
        <div onClick={() => { setShowEditAssignmentModal(false); setSelectedAssignment(null); }} onKeyDown={(e) => e.key === 'Escape' && setShowEditAssignmentModal(false)} role="dialog" aria-modal="true" aria-label="Edit Assignment" style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', display:'flex',
          alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background:'#242424', padding:32, borderRadius:24,
            border:'1px solid rgba(255,255,255,0.08)', width:640, maxWidth:'90vw', maxHeight:'90vh', overflowY:'auto'
          }}>
            <div style={{fontSize:24, fontWeight:900, marginBottom:8, color:'white'}}>
              Edit Assignment
            </div>
            <div style={{fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:24}}>
              Modify assignment details for the selected vehicle-driver pair.
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {/* Read-only Vehicle Display */}
              <div>
                <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Vehicle</label>
                <div style={{
                  padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)',
                  background:'rgba(255,255,255,0.02)', color:'rgba(255,255,255,0.5)', fontSize:14
                }}>
                  {formatVehicleName({ year: selectedAssignment.year, make: selectedAssignment.make, model: selectedAssignment.model, number: selectedAssignment.unit_number })}
                </div>
              </div>

              {/* Read-only Driver Display */}
              <div>
                <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Driver</label>
                <div style={{
                  padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)',
                  background:'rgba(255,255,255,0.02)', color:'rgba(255,255,255,0.5)', fontSize:14
                }}>
                  {selectedAssignment.driver_first_name} {selectedAssignment.driver_last_name} (#{selectedAssignment.employee_number})
                </div>
              </div>

              {/* Assignment Type */}
              <div>
                <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Assignment Type</label>
                <select value={editForm.assignment_type} onChange={(e) => setEditForm(f => ({...f, assignment_type: e.target.value}))}
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                    background:'rgba(255,255,255,0.03)', color:'white', fontSize:14
                  }}>
                  <option value="designated">Designated</option>
                  <option value="on_call">On-Call</option>
                  <option value="temporary">Temporary</option>
                  <option value="primary">Primary</option>
                  <option value="shared">Shared</option>
                  <option value="pool">Pool</option>
                </select>
              </div>

              {/* End Date */}
              <div>
                <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>End Date</label>
                <input type="date" value={editForm.end_date} onChange={(e) => setEditForm(f => ({...f, end_date: e.target.value}))}
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                    background:'rgba(255,255,255,0.03)', color:'white', fontSize:14, colorScheme:'dark'
                  }}
                />
              </div>

              {/* Commuting Authorized */}
              <label style={{display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'8px 0'}}>
                <input type="checkbox" checked={editForm.commuting_authorized}
                  onChange={(e) => setEditForm(f => ({...f, commuting_authorized: e.target.checked}))}
                  style={{width:18, height:18, accentColor:'#10b981', cursor:'pointer'}}
                />
                <span style={{fontSize:14, color:'rgba(255,255,255,0.8)'}}>Commuting Authorized</span>
              </label>

              {/* Notes */}
              <div>
                <label style={{display:'block', fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Notes</label>
                <textarea value={editForm.notes} onChange={(e) => setEditForm(f => ({...f, notes: e.target.value}))}
                  rows={3} placeholder="Optional notes about this change..."
                  style={{
                    width:'100%', padding:'12px 16px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                    background:'rgba(255,255,255,0.03)', color:'white', fontSize:14, resize:'vertical', fontFamily:'inherit'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{display:'flex', justifyContent:'flex-end', gap:12, marginTop:8}}>
                <button onClick={() => { setShowEditAssignmentModal(false); setSelectedAssignment(null); }} disabled={editFormSubmitting}
                  style={{
                    padding:'12px 24px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)',
                    background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.6)', cursor:'pointer', fontSize:14
                  }}>
                  Cancel
                </button>
                <button onClick={handleUpdateAssignment} disabled={editFormSubmitting}
                  style={{
                    padding:'12px 24px', borderRadius:12, border:'1px solid rgba(16,185,129,0.3)',
                    background: editFormSubmitting ? 'rgba(16,185,129,0.08)' : 'linear-gradient(135deg, rgba(16,185,129,0.20), rgba(16,185,129,0.15))',
                    color:'#34d399', cursor: editFormSubmitting ? 'wait' : 'pointer', fontSize:14, fontWeight:600
                  }}>
                  {editFormSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleAssignmentManagement;
