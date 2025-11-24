/**
 * TaskInspector Component
 *
 * Complete task inspection interface with 3 tabs:
 * - Details: Task information, description, priority
 * - Progress: Task status, checklist, completion tracking
 * - History: Activity log and change history
 */

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader2, AlertCircle, CheckCircle2, Circle, Clock } from 'lucide-react';

interface TaskInspectorProps {
  id: string;
  initialTab?: string;
}

interface TaskItem {
  id: string;
  description: string;
  completed: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  type: string;
  assignedTo?: {
    id: string;
    name: string;
    type: 'driver' | 'manager' | 'technician';
  };
  relatedVehicle?: {
    id: string;
    name: string;
  };
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  progress: number;
  checklist: TaskItem[];
}

const priorityConfig = {
  critical: { color: 'red', badge: 'destructive' as const },
  high: { color: 'orange', badge: 'destructive' as const },
  medium: { color: 'yellow', badge: 'default' as const },
  low: { color: 'blue', badge: 'secondary' as const }
};

const statusConfig = {
  pending: { color: 'gray', badge: 'secondary' as const },
  'in-progress': { color: 'blue', badge: 'default' as const },
  completed: { color: 'green', badge: 'default' as const },
  cancelled: { color: 'red', badge: 'destructive' as const }
};

export const TaskInspector: React.FC<TaskInspectorProps> = ({ id, initialTab = 'details' }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.get(`/api/tasks/${id}`);
        setTask(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load task data');
        console.error('Error fetching task:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTask();
    }
  }, [id]);

  const handleStartTask = async () => {
    if (!task) return;
    setProcessing(true);
    try {
      await apiClient.post(`/api/tasks/${id}/start`, {});
      setTask({ ...task, status: 'in-progress' });
    } catch (err) {
      console.error('Failed to start task:', err);
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!task) return;
    setProcessing(true);
    try {
      await apiClient.post(`/api/tasks/${id}/complete`, {});
      setTask({ ...task, status: 'completed', progress: 100, completedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      setProcessing(false);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    if (!task) return;
    try {
      const updatedChecklist = task.checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      const completedCount = updatedChecklist.filter(item => item.completed).length;
      const newProgress = Math.round((completedCount / updatedChecklist.length) * 100);

      await apiClient.post(`/api/tasks/${id}/checklist/${itemId}/toggle`, {});
      setTask({ ...task, checklist: updatedChecklist, progress: newProgress });
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading task data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="p-8 text-gray-500">
        No task data available
      </div>
    );
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {task.title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {task.type}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={priorityConfig[task.priority].badge}>
              {task.priority.toUpperCase()}
            </Badge>
            <Badge variant={statusConfig[task.status].badge}>
              {task.status}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">OVERDUE</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start border-b rounded-none">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Task Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-800 dark:text-gray-200 mt-1">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <p className="font-medium capitalize">{task.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{task.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-medium">{task.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Progress</p>
                    <p className="font-medium">{task.progress}%</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Timeline</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Created</dt>
                  <dd className="font-medium">{new Date(task.createdAt).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Due Date</dt>
                  <dd className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {new Date(task.dueDate).toLocaleString()}
                  </dd>
                </div>
                {task.completedAt && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Completed</dt>
                    <dd className="font-medium text-green-600">{new Date(task.completedAt).toLocaleString()}</dd>
                  </div>
                )}
              </dl>
            </Card>

            {task.assignedTo && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Assignment</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{task.assignedTo.name}</p>
                    <p className="text-sm text-gray-600 capitalize">{task.assignedTo.type}</p>
                  </div>
                  <Button variant="outline" size="sm">View Profile</Button>
                </div>
              </Card>
            )}

            {task.relatedVehicle && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-4">Related Vehicle</h3>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{task.relatedVehicle.name}</p>
                    <p className="text-sm text-gray-600">Vehicle ID: {task.relatedVehicle.id}</p>
                  </div>
                  <Button variant="outline" size="sm">View Vehicle</Button>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="p-4">
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-sm font-medium">{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-600">
                    {task.checklist.filter(item => item.completed).length} of {task.checklist.length} items completed
                  </span>
                  {task.status === 'pending' && (
                    <Button onClick={handleStartTask} disabled={processing} size="sm">
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Start Task
                    </Button>
                  )}
                  {task.status === 'in-progress' && task.progress === 100 && (
                    <Button onClick={handleCompleteTask} disabled={processing} size="sm">
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Complete Task
                    </Button>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Checklist</h3>
              <div className="space-y-2">
                {task.checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      item.completed
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => toggleChecklistItem(item.id)}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {isOverdue && task.status !== 'completed' && (
              <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200">
                <div className="flex items-center gap-2 text-red-600">
                  <Clock className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Task Overdue</p>
                    <p className="text-sm">This task was due {new Date(task.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="p-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Activity History</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="w-px h-full bg-gray-300"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium">Task Created</p>
                  <p className="text-sm text-gray-600">{new Date(task.createdAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Priority set to {task.priority}</p>
                </div>
              </div>

              {task.assignedTo && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div className="w-px h-full bg-gray-300"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Task Assigned</p>
                    <p className="text-sm text-gray-600">{new Date(task.createdAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Assigned to {task.assignedTo.name}</p>
                  </div>
                </div>
              )}

              {task.status !== 'pending' && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-px h-full bg-gray-300"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium">Status Updated</p>
                    <p className="text-sm text-gray-600">Status changed to {task.status}</p>
                  </div>
                </div>
              )}

              {task.completedAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-green-600">Task Completed</p>
                    <p className="text-sm text-gray-600">{new Date(task.completedAt).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">All checklist items completed</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskInspector;
