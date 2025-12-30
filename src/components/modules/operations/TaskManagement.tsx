import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  User,
  CalendarDots,
  ChatCircle,
  ListChecks
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import logger from '@/utils/logger'

interface Task {
  id: string
  task_title: string
  description?: string
  task_type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string
  assigned_to_name?: string
  created_by_name?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  completion_percentage?: number
  created_at?: string
  updated_at?: string
  completed_at?: string
  comments_count?: number
  checklist_total?: number
  checklist_completed?: number
}

interface Comment {
  id: string
  comment_text: string
  created_by_name: string
  created_at: string
}

interface ApiResponse<T> {
  tasks?: T[]
  task?: T
  comments?: Comment[]
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [_loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")

  const [newTask, setNewTask] = useState<Partial<Task>>({
    task_title: "",
    description: "",
    task_type: "maintenance",
    priority: "medium",
    status: "pending",
    assigned_to: "",
    due_date: "",
    estimated_hours: 0
  })

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterPriority !== "all") params.append("priority", filterPriority)
      if (filterStatus !== "all") params.append("status", filterStatus)

      const response = await apiClient.get<ApiResponse<Task>>(`/api/task-management?${params.toString()}`)
      setTasks(response.data?.tasks || [])
    } catch (error) {
      logger.error("Error fetching tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskComments = async (taskId: string) => {
    try {
      const response = await apiClient.get<ApiResponse<Comment>>(`/api/task-management/${taskId}/comments`)
      setComments(response.data?.comments || [])
    } catch (error) {
      logger.error("Error fetching comments:", error)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.task_title) {
      toast.error("Please enter a task title")
      return
    }

    try {
      const response = await apiClient.post<ApiResponse<Task>>("/api/task-management", newTask)
      if (response.data?.task) {
        setTasks(current => [...current, response.data.task as Task])
        toast.success("Task created successfully")
        setIsAddDialogOpen(false)
        resetNewTask()
      }
    } catch (error) {
      logger.error("Error creating task:", error)
      toast.error("Failed to create task")
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiClient.put<ApiResponse<Task>>(`/api/task-management/${taskId}`, updates)
      if (response.data?.task) {
        setTasks(current =>
          current.map(t => (t.id === taskId ? response.data.task as Task : t))
        )
        toast.success("Task updated successfully")
      }
    } catch (error) {
      logger.error("Error updating task:", error)
      toast.error("Failed to update task")
    }
  }

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) {
      return
    }

    try {
      await apiClient.post(`/api/task-management/${selectedTask.id}/comments`, {
        comment_text: newComment
      })

      fetchTaskComments(selectedTask.id)
      setNewComment("")
      toast.success("Comment added")
    } catch (error) {
      logger.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleStartTimer = async (taskId: string) => {
    try {
      await apiClient.post(`/api/task-management/${taskId}/time/start`, {})

      toast.success("Timer started")
      fetchTasks()
    } catch (error) {
      logger.error("Error starting timer:", error)
      toast.error("Failed to start timer")
    }
  }

  const handleStopTimer = async (taskId: string) => {
    try {
      await apiClient.post(`/api/task-management/${taskId}/time/stop`, {})

      toast.success("Timer stopped")
      fetchTasks()
    } catch (error) {
      logger.error("Error stopping timer:", error)
      toast.error("Failed to stop timer")
    }
  }

  const resetNewTask = () => {
    setNewTask({
      task_title: "",
      description: "",
      task_type: "maintenance",
      priority: "medium",
      status: "pending",
      assigned_to: "",
      due_date: "",
      estimated_hours: 0
    })
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesPriority = filterPriority === "all" || task.priority === filterPriority
    const matchesStatus = filterStatus === "all" || task.status === filterStatus

    return matchesSearch && matchesPriority && matchesStatus
  })

  // Statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'completed') return false
    return new Date(t.due_date) < new Date()
  }).length

  const getPriorityColor = (priority: Task['priority']) => {
    const colors = {
      low: "bg-gray-100 text-gray-700",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700"
    }
    return colors[priority]
  }

  const getStatusColor = (status: Task['status']) => {
    const colors = {
      pending: "bg-gray-100 text-gray-700",
      in_progress: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700"
    }
    return colors[status]
  }

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Task Management</h2>
          <p className="text-muted-foreground">Track and manage team tasks and workflows</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to the workflow
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title *</Label>
                <Input
                  id="task-title"
                  value={newTask.task_title}
                  onChange={e => setNewTask({ ...newTask, task_title: e.target.value })}
                  placeholder="Complete vehicle inspection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task description and requirements..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-type">Task Type *</Label>
                  <Select
                    value={newTask.task_type}
                    onValueChange={value => setNewTask({ ...newTask, task_type: value })}
                  >
                    <SelectTrigger id="task-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={value => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assign To</Label>
                  <Select
                    value={newTask.assigned_to}
                    onValueChange={value => setNewTask({ ...newTask, assigned_to: value })}
                  >
                    <SelectTrigger id="assigned-to">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user-1">John Doe</SelectItem>
                      <SelectItem value="user-2">Jane Smith</SelectItem>
                      <SelectItem value="user-3">Bob Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={newTask.due_date}
                    onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated-hours">Estimated Hours</Label>
                <Input
                  id="estimated-hours"
                  type="number"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={e => setNewTask({ ...newTask, estimated_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTask}>Create Task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <ListChecks className="w-3 h-3" />
              All tasks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressTasks}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="w-3 h-3" />
              Active work
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3" />
              {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% complete
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDots className="w-3 h-3" />
              Past due date
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}