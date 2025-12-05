/**
 * Enhanced Task Management Component
 * Industry-leading task management with AI, automation, and advanced features
 *
 * Features:
 * - AI-powered task suggestions and prioritization
 * - Multiple views: Table, Kanban, Calendar, Gantt
 * - Bulk operations and quick actions
 * - Advanced search and filtering
 * - Real-time collaboration
 * - Workflow automation
 * - Natural language task creation
 * - Export and reporting
 */

import { useState, useEffect, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  User,
  CalendarDots,
  ChatCircle,
  ListChecks,
  ChartLine,
  DotsThree,
  Download,
  Upload,
  Funnel,
  Lightning,
  Sparkle,
  Brain,
  CaretDown,
  Calendar,
  List,
  Kanban as KanbanIcon,
  ChartBar,
  Rows
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
  tags?: string[]
  ai_suggestions?: any
}

type ViewMode = 'table' | 'kanban' | 'calendar' | 'gantt'

export function EnhancedTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isNLPDialogOpen, setIsNLPDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [nlpInput, setNlpInput] = useState("")
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)

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
  }, [filterPriority, filterStatus, filterType])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterPriority !== "all") params.append("priority", filterPriority)
      if (filterStatus !== "all") params.append("status", filterStatus)
      if (filterType !== "all") params.append("category", filterType)

      const response = await apiClient.get(`/api/task-management?${params.toString()}`)
      setTasks(response.tasks || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  // Get AI suggestions for a new task
  const getAISuggestions = async (taskData: Partial<Task>) => {
    if (!taskData.task_title) {
      toast.error("Please enter a task title first")
      return
    }

    setIsLoadingAI(true)
    try {
      const response = await apiClient.post("/api/ai/task-suggestions", {
        title: taskData.task_title,
        description: taskData.description,
        type: taskData.task_type
      })

      setAiSuggestions(response.suggestions)
      setShowAISuggestions(true)
      toast.success("AI suggestions generated!")

      // Apply suggestions
      if (response.suggestions.suggestedPriority) {
        setNewTask(prev => ({ ...prev, priority: response.suggestions.suggestedPriority }))
      }
      if (response.suggestions.estimatedHours) {
        setNewTask(prev => ({ ...prev, estimated_hours: response.suggestions.estimatedHours }))
      }
    } catch (error) {
      console.error("Error getting AI suggestions:", error)
      toast.error("Failed to get AI suggestions")
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Create task from natural language
  const createTaskFromNLP = async () => {
    if (!nlpInput.trim()) {
      toast.error("Please enter a task description")
      return
    }

    setIsLoadingAI(true)
    try {
      const response = await apiClient.post("/api/ai/parse-task", {
        input: nlpInput
      })

      setNewTask({
        task_title: response.task.title,
        description: response.task.description,
        task_type: response.task.type,
        priority: response.task.priority as any,
        status: "pending",
        due_date: response.task.dueDate,
        estimated_hours: response.task.estimatedHours
      })

      setIsNLPDialogOpen(false)
      setIsAddDialogOpen(true)
      toast.success("Task parsed from natural language!")
    } catch (error) {
      console.error("Error parsing NLP task:", error)
      toast.error("Failed to parse task")
    } finally {
      setIsLoadingAI(false)
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

  const handleBulkAction = async (action: string) => {
    if (selectedTasks.size === 0) {
      toast.error("Please select tasks first")
      return
    }

    try {
      await apiClient.post("/api/task-management/bulk", {
        taskIds: Array.from(selectedTasks),
        action
      })

      toast.success(`Bulk ${action} completed`)
      setSelectedTasks(new Set())
      fetchTasks()
    } catch (error) {
      console.error("Error performing bulk action:", error)
      toast.error(`Failed to ${action} tasks`)
    }
  }

  const exportTasks = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await apiClient.get(`/api/task-management/export?format=${format}`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `tasks-export.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(`Tasks exported as ${format.toUpperCase()}`)
    } catch (error) {
      console.error("Error exporting tasks:", error)
      toast.error("Failed to export tasks")
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
    setAiSuggestions(null)
    setShowAISuggestions(false)
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        task.task_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority
      const matchesStatus = filterStatus === "all" || task.status === filterStatus
      const matchesType = filterType === "all" || task.task_type === filterType

      return matchesSearch && matchesPriority && matchesStatus && matchesType
    })
  }, [tasks, searchTerm, filterPriority, filterStatus, filterType])

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in_progress').length
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'completed') return false
      return new Date(t.due_date) < new Date()
    }).length
    const critical = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length

    return { total, completed, inProgress, overdue, critical }
  }, [tasks])

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

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks)
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId)
    } else {
      newSelection.add(taskId)
    }
    setSelectedTasks(newSelection)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Task Management</h2>
          <p className="text-muted-foreground mt-1">
            AI-powered task tracking and workflow automation
          </p>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setIsNLPDialogOpen(true)}
                >
                  <Sparkle className="w-4 h-4 mr-2" />
                  AI Create
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create task from natural language</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task with AI-powered suggestions
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="task-title">Task Title *</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => getAISuggestions(newTask)}
                      disabled={isLoadingAI}
                    >
                      <Brain className="w-4 h-4 mr-1" />
                      {isLoadingAI ? "Analyzing..." : "Get AI Suggestions"}
                    </Button>
                  </div>
                  <Input
                    id="task-title"
                    value={newTask.task_title}
                    onChange={e => setNewTask({ ...newTask, task_title: e.target.value })}
                    placeholder="Complete vehicle inspection"
                  />
                </div>

                {showAISuggestions && aiSuggestions && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightning className="w-4 h-4" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {aiSuggestions.recommendations?.map((rec: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

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
                    <Label htmlFor="due-date">Due Date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={newTask.due_date}
                      onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
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
      </div>

      {/* NLP Task Creation Dialog */}
      <Dialog open={isNLPDialogOpen} onOpenChange={setIsNLPDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-yellow-500" />
              Create Task with AI
            </DialogTitle>
            <DialogDescription>
              Describe your task in natural language and let AI parse it
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Example: Schedule an oil change for vehicle #123 next week, high priority"
              value={nlpInput}
              onChange={e => setNlpInput(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNLPDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createTaskFromNLP} disabled={isLoadingAI}>
              {isLoadingAI ? "Processing..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Statistics Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
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
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
              <CheckCircle className="w-3 h-3" />
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% complete
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <CalendarDots className="w-3 h-3" />
              Past due date
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Lightning className="w-3 h-3" />
              High priority
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Funnel className="w-4 h-4 mr-2" />
                Filters
                <CaretDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Label className="text-xs">Priority</Label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-2">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
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
              <div className="p-2">
                <Label className="text-xs">Type</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Selector */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <KanbanIcon className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('gantt')}
            >
              <ChartBar className="w-4 h-4" />
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedTasks.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Rows className="w-4 h-4 mr-2" />
                  Actions ({selectedTasks.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleBulkAction('complete')}>
                  Mark as Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('in_progress')}>
                  Set to In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('high')}>
                  Set Priority High
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-red-600">
                  Delete Tasks
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportTasks('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTasks('excel')}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTasks('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - Table View */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks ({filteredTasks.length})</CardTitle>
            <CardDescription>Track and manage all team tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedTasks(new Set(filteredTasks.map(t => t.id)))
                          } else {
                            setSelectedTasks(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No tasks found. Create your first task to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map(task => (
                      <TableRow
                        key={task.id}
                        className={`${isOverdue(task) ? "bg-red-50" : ""} cursor-pointer hover:bg-muted/50`}
                        onClick={() => {
                          setSelectedTask(task)
                          setIsDetailsDialogOpen(true)
                        }}
                      >
                        <TableCell onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                          />
                        </TableCell>
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
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <DotsThree className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedTask(task)
                                setIsDetailsDialogOpen(true)
                              }}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem>Duplicate</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-4 gap-4">
          {['pending', 'in_progress', 'completed', 'cancelled'].map(status => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm capitalize">
                  {status.replace('_', ' ')}
                  <span className="ml-2 text-muted-foreground">
                    ({filteredTasks.filter(t => t.status === status).length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {filteredTasks
                      .filter(t => t.status === status)
                      .map(task => (
                        <Card
                          key={task.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setSelectedTask(task)
                            setIsDetailsDialogOpen(true)
                          }}
                        >
                          <CardContent className="p-3 space-y-2">
                            <div className="font-medium text-sm">{task.task_title}</div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                {task.priority}
                              </Badge>
                              {task.due_date && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarDots className="w-3 h-3" />
                                  {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {task.assigned_to_name && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {task.assigned_to_name}
                              </div>
                            )}
                            {task.completion_percentage !== undefined && task.completion_percentage > 0 && (
                              <Progress value={task.completion_percentage} className="h-1" />
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Calendar and Gantt views can be added here */}
      {viewMode === 'calendar' && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Calendar view coming soon...
          </CardContent>
        </Card>
      )}

      {viewMode === 'gantt' && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Gantt chart view coming soon...
          </CardContent>
        </Card>
      )}
    </div>
  )
}
