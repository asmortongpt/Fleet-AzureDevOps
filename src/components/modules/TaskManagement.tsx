import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  User,
  CalendarDots,
  ChatCircle,
  ListChecks,
  ChartLine
} from "@phosphor-icons/react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

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

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
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

      const response = await apiClient.get(`/api/task-management?${params.toString()}`)
      setTasks(response.tasks || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskComments = async (taskId: string) => {
    try {
      const response = await apiClient.get(`/api/task-management/${taskId}/comments`)
      setComments(response.comments || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
    }
  }

  const handleAddTask = async () => {
    if (!newTask.task_title) {
      toast.error("Please enter a task title")
      return
    }

    try {
      const response = await apiClient.post("/api/task-management", newTask)

      setTasks(current => [...current, response.task])
      toast.success("Task created successfully")
      setIsAddDialogOpen(false)
      resetNewTask()
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task")
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiClient.put(`/api/task-management/${taskId}`, updates)

      setTasks(current =>
        current.map(t => (t.id === taskId ? response.task : t))
      )
      toast.success("Task updated successfully")
    } catch (error) {
      console.error("Error updating task:", error)
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
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleStartTimer = async (taskId: string) => {
    try {
      await apiClient.post(`/api/task-management/${taskId}/time/start`, {})

      toast.success("Timer started")
      fetchTasks()
    } catch (error) {
      console.error("Error starting timer:", error)
      toast.error("Failed to start timer")
    }
  }

  const handleStopTimer = async (taskId: string) => {
    try {
      await apiClient.post(`/api/task-management/${taskId}/time/stop`, {})

      toast.success("Timer stopped")
      fetchTasks()
    } catch (error) {
      console.error("Error stopping timer:", error)
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

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tasks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
          <CardDescription>Track and manage all team tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No tasks found. Create your first task to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map(task => (
                  <TableRow key={task.id} className={isOverdue(task) ? "bg-red-50" : ""}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{task.task_title}</div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{task.task_type}</TableCell>
                    <TableCell>
                      {task.assigned_to_name ? (
                        <div className="flex items-center gap-1 text-sm">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {task.assigned_to_name}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className={`text-sm ${isOverdue(task) ? "text-red-600 font-semibold" : ""}`}>
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-24">
                        <Progress value={task.completion_percentage || 0} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {task.completion_percentage || 0}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(task.status)} variant="secondary">
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task)
                          fetchTaskComments(task.id)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              {selectedTask?.task_title}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="time">Time Tracking</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments ({comments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Task Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Title:</span>
                        <p className="font-medium">{selectedTask.task_title}</p>
                      </div>
                      {selectedTask.description && (
                        <div>
                          <span className="text-muted-foreground">Description:</span>
                          <p className="font-medium">{selectedTask.description}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <p className="font-medium capitalize">{selectedTask.task_type}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Assignment</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Assigned To:</span>
                        <p className="font-medium">
                          {selectedTask.assigned_to_name || "Unassigned"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created By:</span>
                        <p className="font-medium">{selectedTask.created_by_name}</p>
                      </div>
                      {selectedTask.due_date && (
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <p className="font-medium">
                            {new Date(selectedTask.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>Priority:</Label>
                        <Badge className={getPriorityColor(selectedTask.priority)} variant="secondary">
                          {selectedTask.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        <Select
                          value={selectedTask.status}
                          onValueChange={(value) => handleUpdateTask(selectedTask.id, { status: value as Task['status'] })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3">Progress</h3>
                    <div className="space-y-2">
                      <Progress value={selectedTask.completion_percentage || 0} className="h-3" />
                      <p className="text-sm text-muted-foreground">
                        {selectedTask.completion_percentage || 0}% complete
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Estimated Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {selectedTask.estimated_hours || 0}h
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Actual Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedTask.actual_hours || 0}h
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleStartTimer(selectedTask.id)}>
                    <Clock className="w-4 h-4 mr-2" />
                    Start Timer
                  </Button>
                  <Button variant="outline" onClick={() => handleStopTimer(selectedTask.id)}>
                    Stop Timer
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No comments yet. Be the first to comment!
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{comment.created_by_name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Add Comment</Label>
                  <Textarea
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Type your comment..."
                    rows={3}
                  />
                  <Button onClick={handleAddComment}>
                    <ChatCircle className="w-4 h-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
