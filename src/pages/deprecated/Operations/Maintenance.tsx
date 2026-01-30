/**
 * Maintenance Operations Surface
 *
 * PRODUCTION INTERFACE for fleet maintenance scheduling and tracking
 *
 * FEATURES:
 * - Real-time maintenance schedule display from /api/maintenance
 * - Filter views: Upcoming, Overdue, Completed
 * - Color-coded status: Blue (upcoming), Red (overdue), Green (completed)
 * - Cost tracking with aggregations
 * - Professional inline scheduling and completion workflows
 *
 * WORKFLOW:
 * 1. View maintenance tasks (left panel) with status filters
 * 2. Click task → details and scheduling inline (right panel)
 * 3. All actions (schedule, complete, reschedule) happen inline
 * 4. Real-time cost tracking and statistics
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, Plus, Search, CheckCircle, Calendar, Car, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { SplitView } from '@/components/operations/SplitView';
import {
  ActionButton,
  InlineEditPanel,
  StatusBadge as OperationStatusBadge
} from '@/components/operations/InlineActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

// Type definitions for maintenance records
interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  vehicle_number?: string;
  service_type: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  scheduled_date: string;
  completed_date?: string;
  total_cost?: number;
  labor_cost?: number;
  parts_cost?: number;
  assigned_technician?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface MaintenanceStats {
  scheduled: number;
  completed: number;
  in_progress: number;
  overdue: number;
  upcoming: number;
  totalCost: number;
  averageCost: number;
  vehiclesWithMaintenance: number;
}

export function MaintenanceOperations() {
  // State management
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({});

  // Fetch all maintenance data
  const fetchMaintenanceData = useCallback(async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/maintenance/statistics')
      ]);

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(Array.isArray(data.data) ? data.data : []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }
    } catch (error) {
      logger.error('Failed to fetch maintenance data:', error);
      toast.error('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMaintenanceData();
  }, [fetchMaintenanceData]);

  // Filter tasks based on status and search query
  const filteredTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      // Search filter
      const matchesSearch = !searchQuery ||
        task.service_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        const scheduledDate = new Date(task.scheduled_date);
        const isOverdue = scheduledDate < now && task.status === 'scheduled';
        const isUpcoming = scheduledDate > now && task.status === 'scheduled';

        if (filterStatus === 'overdue') matchesStatus = isOverdue;
        else if (filterStatus === 'upcoming') matchesStatus = isUpcoming;
        else if (filterStatus === 'completed') matchesStatus = task.status === 'completed';
        else if (filterStatus === 'in_progress') matchesStatus = task.status === 'in_progress';
      }

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, filterStatus]);

  // Get selected task
  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId);
  }, [tasks, selectedTaskId]);

  // Determine task status for display
  const getTaskStatus = (task: MaintenanceRecord) => {
    const now = new Date();
    const scheduledDate = new Date(task.scheduled_date);

    if (task.status === 'completed') return 'completed';
    if (task.status === 'in_progress') return 'active';
    if (scheduledDate < now && task.status === 'scheduled') return 'error';
    return 'pending';
  };

  // Calculate days until due
  const getDaysUntilDue = (task: MaintenanceRecord) => {
    const scheduledDate = new Date(task.scheduled_date);
    const now = new Date();
    const diff = scheduledDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Handle task selection
  const handleSelectTask = useCallback((taskId: number) => {
    setSelectedTaskId(taskId);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  // Handle close detail panel
  const handleCloseDetail = useCallback(() => {
    setSelectedTaskId(null);
    setIsEditing(false);
    setIsCreating(false);
    setFormData({});
  }, []);

  // Handle create new maintenance
  const handleCreateNew = useCallback(() => {
    setIsCreating(true);
    setSelectedTaskId(null);
    setFormData({
      service_type: '',
      vehicle_id: undefined,
      scheduled_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      description: '',
      notes: ''
    });
  }, []);

  // Handle save new maintenance
  const handleSaveNew = useCallback(async () => {
    if (!formData.service_type || !formData.vehicle_id || !formData.scheduled_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create maintenance');
      }

      toast.success('Maintenance scheduled successfully!');
      await fetchMaintenanceData();
      handleCloseDetail();
    } catch (error) {
      logger.error('Error saving maintenance:', error);
      toast.error('Failed to schedule maintenance');
    } finally {
      setIsSaving(false);
    }
  }, [formData, fetchMaintenanceData, handleCloseDetail]);

  // Handle complete maintenance
  const handleComplete = useCallback(async () => {
    if (!selectedTask) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/maintenance/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completed_date: new Date().toISOString(),
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete maintenance');
      }

      toast.success('Maintenance marked complete!');
      await fetchMaintenanceData();
      setIsEditing(false);
    } catch (error) {
      logger.error('Error completing maintenance:', error);
      toast.error('Failed to complete maintenance');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTask, formData, fetchMaintenanceData]);

  // Handle reschedule
  const handleReschedule = useCallback(async () => {
    if (!selectedTask || !formData.scheduled_date) return;

    try {
      setIsSaving(true);
      const response = await fetch(`/api/maintenance/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduled_date: formData.scheduled_date,
          status: 'scheduled'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule maintenance');
      }

      toast.success('Maintenance rescheduled!');
      await fetchMaintenanceData();
      setIsEditing(false);
    } catch (error) {
      logger.error('Error rescheduling maintenance:', error);
      toast.error('Failed to reschedule maintenance');
    } finally {
      setIsSaving(false);
    }
  }, [selectedTask, formData, fetchMaintenanceData]);

  // Render task item
  const renderTaskItem = (task: MaintenanceRecord) => {
    const isSelected = task.id === selectedTaskId;
    const status = getTaskStatus(task);
    const daysUntilDue = getDaysUntilDue(task);

    const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'pending' },
      active: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'active' },
      error: { bg: 'bg-red-500/10', text: 'text-red-400', icon: 'error' },
      completed: { bg: 'bg-green-500/10', text: 'text-green-400', icon: 'completed' }
    };

    const colors = statusColors[status];

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, x: 4 }}
        onClick={() => handleSelectTask(task.id)}
        className={cn(
          'p-4 border-b border-slate-700/50 cursor-pointer transition-all duration-200',
          'hover:bg-cyan-400/5',
          isSelected && 'bg-cyan-400/10 border-l-4 border-l-cyan-400'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center border',
              colors.bg,
              colors.text
            )}>
              <Wrench className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white mb-1 truncate">
                {task.service_type}
              </h3>
              <div className="space-y-1">
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Car className="w-3 h-3 flex-shrink-0" />
                  {task.vehicle_number || `Vehicle #${task.vehicle_id}`}
                </p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />
                  {new Date(task.scheduled_date).toLocaleDateString()}
                </p>
                {task.total_cost && (
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                    <DollarSign className="w-3 h-3 flex-shrink-0" />
                    ${task.total_cost.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            <OperationStatusBadge status={status as any} size="sm" />
          </div>
        </div>

        {/* Show days until/overdue */}
        {status !== 'completed' && (
          <div className="mt-2 ml-15 text-xs font-semibold">
            {daysUntilDue < 0 ? (
              <span className="text-red-400">
                <Clock className="w-3 h-3 inline mr-1" />
                {Math.abs(daysUntilDue)} days overdue
              </span>
            ) : daysUntilDue === 0 ? (
              <span className="text-amber-400">
                <Clock className="w-3 h-3 inline mr-1" />
                Due today
              </span>
            ) : (
              <span className="text-blue-400">
                <Clock className="w-3 h-3 inline mr-1" />
                {daysUntilDue} days remaining
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  // Render task form
  const renderTaskForm = () => (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase">Service Type *</label>
        <Input
          value={formData.service_type || ''}
          onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
          placeholder="Oil change, tire rotation, inspection, etc."
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase">Scheduled Date *</label>
        <Input
          type="date"
          value={formData.scheduled_date || ''}
          onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase">Labor Cost</label>
          <Input
            type="number"
            value={formData.labor_cost || ''}
            onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase">Parts Cost</label>
          <Input
            type="number"
            value={formData.parts_cost || ''}
            onChange={(e) => setFormData({ ...formData, parts_cost: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase">Technician</label>
        <Input
          value={formData.assigned_technician || ''}
          onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
          placeholder="Assigned technician name"
          className="bg-slate-700/50 border-slate-600 text-white"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Service details and notes..."
          rows={3}
          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm"
        />
      </div>
    </div>
  );

  // Render detail content
  const detailContent = () => {
    if (isCreating) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">Schedule New Maintenance</h4>
          {renderTaskForm()}
        </div>
      );
    }

    if (!selectedTask) return null;

    const daysUntilDue = getDaysUntilDue(selectedTask);

    return (
      <div className="space-y-4">
        {/* Task Overview */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">Task Overview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400">Service Type:</span>
              <p className="text-white font-semibold">{selectedTask.service_type}</p>
            </div>
            <div>
              <span className="text-slate-400">Vehicle:</span>
              <p className="text-white font-semibold">
                {selectedTask.vehicle_number || `#${selectedTask.vehicle_id}`}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Scheduled:</span>
              <p className="text-white font-semibold">
                {new Date(selectedTask.scheduled_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <p className="text-white font-semibold capitalize">{selectedTask.status}</p>
            </div>
            {selectedTask.assigned_technician && (
              <div>
                <span className="text-slate-400">Technician:</span>
                <p className="text-white font-semibold">{selectedTask.assigned_technician}</p>
              </div>
            )}
            {daysUntilDue !== null && selectedTask.status !== 'completed' && (
              <div>
                <span className="text-slate-400">Time to Due:</span>
                <p className={cn(
                  "font-semibold",
                  daysUntilDue < 0 ? "text-red-400" : daysUntilDue === 0 ? "text-amber-400" : "text-blue-400"
                )}>
                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : daysUntilDue === 0 ? "Due today" : `${daysUntilDue} days remaining`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Tracking */}
        {(selectedTask.total_cost || selectedTask.labor_cost || selectedTask.parts_cost) && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-emerald-400/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Cost Tracking</h4>
            </div>
            <div className="space-y-2 text-sm">
              {selectedTask.labor_cost && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Labor:</span>
                  <span className="text-white font-semibold">${selectedTask.labor_cost.toFixed(2)}</span>
                </div>
              )}
              {selectedTask.parts_cost && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Parts:</span>
                  <span className="text-white font-semibold">${selectedTask.parts_cost.toFixed(2)}</span>
                </div>
              )}
              {selectedTask.total_cost && (
                <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-300 font-semibold">Total:</span>
                  <span className="text-emerald-400 font-bold">${selectedTask.total_cost.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit/Complete Section */}
        {selectedTask.status !== 'completed' && (
          <InlineEditPanel
            isEditing={isEditing}
            onEdit={() => {
              setIsEditing(true);
              setFormData(selectedTask);
            }}
            onSave={selectedTask.status === 'in_progress' ? handleComplete : handleReschedule}
            onCancel={() => setIsEditing(false)}
            title={selectedTask.status === 'in_progress' ? "Mark Complete" : "Reschedule"}
            isSaving={isSaving}
          >
            {selectedTask.status === 'in_progress' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase">Completion Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Work completed, findings, etc."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Labor Cost</label>
                    <Input
                      type="number"
                      value={formData.labor_cost || ''}
                      onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 uppercase">Parts Cost</label>
                    <Input
                      type="number"
                      value={formData.parts_cost || ''}
                      onChange={(e) => setFormData({ ...formData, parts_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase">New Scheduled Date</label>
                <Input
                  type="date"
                  value={formData.scheduled_date || ''}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
            )}
          </InlineEditPanel>
        )}

        {/* Description */}
        {selectedTask.description && (
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-slate-600/30 p-4">
            <h4 className="text-sm font-bold text-white mb-3">Description</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{selectedTask.description}</p>
          </div>
        )}
      </div>
    );
  };

  // List panel content
  const listPanel = (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3 border-b border-slate-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service, vehicle..."
            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            disabled={loading}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm disabled:opacity-50"
          disabled={loading}
        >
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-700/30 rounded-lg p-3 border border-slate-600/30">
            <div>
              <span className="text-slate-400 block">Upcoming</span>
              <span className="text-cyan-400 font-bold">{stats.upcoming}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Overdue</span>
              <span className="text-red-400 font-bold">{stats.overdue}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Cost</span>
              <span className="text-emerald-400 font-bold">${stats.totalCost.toFixed(0)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Avg Cost</span>
              <span className="text-emerald-400 font-bold">${stats.averageCost.toFixed(0)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
          </div>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map(renderTaskItem)
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-400 text-center">No maintenance tasks found</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <SplitView
      theme="operations"
      listPanel={{
        title: 'Maintenance',
        description: `${filteredTasks.length} of ${tasks.length} tasks`,
        icon: <Wrench />,
        content: listPanel,
        actions: (
          <Button
            onClick={handleCreateNew}
            disabled={loading}
            size="sm"
            className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span className="ml-2">Schedule</span>
          </Button>
        )
      }}
      detailPanel={
        selectedTaskId !== null || isCreating
          ? {
              title: isCreating ? 'New Maintenance' : selectedTask?.service_type || '',
              subtitle: isCreating ? 'Schedule new task' : `${selectedTask?.vehicle_number || `Vehicle #${selectedTask?.vehicle_id}`}`,
              content: detailContent(),
              onClose: handleCloseDetail,
              actions: isCreating ? (
                <ActionButton
                  icon={<CheckCircle />}
                  label="Schedule"
                  onClick={handleSaveNew}
                  variant="success"
                  loading={isSaving}
                  disabled={isSaving}
                />
              ) : selectedTask?.status === 'completed' ? null : (
                <ActionButton
                  icon={<CheckCircle />}
                  label={selectedTask?.status === 'in_progress' ? 'Mark Complete' : 'Reschedule'}
                  onClick={() => setIsEditing(true)}
                  variant="success"
                />
              )
            }
          : null
      }
    />
  );
}

export default MaintenanceOperations;
