import { Package, Clock, Navigation, CheckCircle, AlertTriangle, User, Truck } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealtimeOperations } from '@/hooks/use-realtime-operations';

/**
 * Dispatch Queue Kanban Board
 *
 * Drag-and-drop task management with real-time updates
 * - Pending, Assigned, In Progress, Completed columns
 * - Priority-based color coding
 * - Real-time status updates
 * - Quick assignment actions
 */

interface Task {
  id: string;
  taskNumber: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed';
  assignedVehicleId?: string;
  assignedDriverId?: string;
  estimatedDuration?: number;
  dueTime?: string;
}

interface DispatchKanbanProps {
  tasks: Task[];
  onTaskMove?: (taskId: string, newStatus: Task['status']) => void;
  onTaskAssign?: (taskId: string, vehicleId?: string, driverId?: string) => void;
}

export function DispatchKanban({ tasks, onTaskMove, onTaskAssign }: DispatchKanbanProps) {
  const { taskUpdates, getTaskUpdate } = useRealtimeOperations();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Merge tasks with real-time updates
  const enhancedTasks = useMemo(() => {
    return tasks.map(task => {
      const update = getTaskUpdate(task.id);
      if (update) {
        return {
          ...task,
          status: update.status,
          assignedVehicleId: update.assignedVehicleId,
          assignedDriverId: update.assignedDriverId,
          priority: update.priority
        };
      }
      return task;
    });
  }, [tasks, taskUpdates, getTaskUpdate]);

  // Group tasks by status
  const columns = useMemo(() => {
    return {
      pending: enhancedTasks.filter(t => t.status === 'pending'),
      assigned: enhancedTasks.filter(t => t.status === 'assigned'),
      'in-progress': enhancedTasks.filter(t => t.status === 'in-progress'),
      completed: enhancedTasks.filter(t => t.status === 'completed')
    };
  }, [enhancedTasks]);

  // Priority colors
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'destructive' as const;
      case 'high':
        return 'default' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: Task['status']) => {
    if (draggedTask && onTaskMove) {
      onTaskMove(draggedTask, status);
    }
    setDraggedTask(null);
  };

  // Column configuration
  const columnConfig = [
    { id: 'pending' as const, title: 'Pending Dispatch', icon: Clock, color: 'text-amber-600' },
    { id: 'assigned' as const, title: 'Assigned', icon: User, color: 'text-blue-600' },
    { id: 'in-progress' as const, title: 'In Progress', icon: Navigation, color: 'text-green-600' },
    { id: 'completed' as const, title: 'Completed', icon: CheckCircle, color: 'text-purple-600' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columnConfig.map((column) => {
        const Icon = column.icon;
        const columnTasks = columns[column.id];

        return (
          <Card
            key={column.id}
            className="flex flex-col h-[600px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Icon className={`h-4 w-4 ${column.color}`} />
                {column.title}
                <Badge variant="secondary" className="ml-auto">
                  {columnTasks.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task.id)}
                  className={`p-3 rounded-lg border-l-4 cursor-move transition-all hover:shadow-md ${getPriorityColor(task.priority)} ${
                    draggedTask === task.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* Task header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {task.taskNumber}
                    </span>
                    <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>

                  {/* Task description */}
                  <p className="text-sm text-slate-800 mb-2 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Task metadata */}
                  <div className="space-y-1">
                    {task.assignedVehicleId && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Truck className="h-3 w-3" />
                        <span>Vehicle: {task.assignedVehicleId}</span>
                      </div>
                    )}
                    {task.assignedDriverId && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <User className="h-3 w-3" />
                        <span>Driver: {task.assignedDriverId}</span>
                      </div>
                    )}
                    {task.estimatedDuration && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <Clock className="h-3 w-3" />
                        <span>{task.estimatedDuration} min</span>
                      </div>
                    )}
                    {task.dueTime && (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Due: {new Date(task.dueTime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}</span>
                      </div>
                    )}
                  </div>

                  {/* Real-time update indicator */}
                  {getTaskUpdate(task.id) && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span>Updated {new Date(getTaskUpdate(task.id)!.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-700">
                  <Package className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">No tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
