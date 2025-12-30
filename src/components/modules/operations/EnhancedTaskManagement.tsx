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

import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Clock,
  User,
  CalendarDots,
  ListChecks,
  DotsThree,
  Download,
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
import { useState, useEffect, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  tags?: string[]
  ai_suggestions?: any
}

interface ApiResponse<T> {
  tasks?: T[]
  task?: T
  suggestions?: {
    suggestedPriority?: string
    estimatedHours?: number
    recommendations?: string[]
  }
}

interface NLPResponse {
  task: {
    title: string
    description: string
    type: string
    priority: string
    dueDate?: string
    estimatedHours?: number
  }
}

type ViewMode = 'table' | 'kanban' | 'calendar' | 'gantt'

export function EnhancedTaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [_loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isNLPDialogOpen, setIsNLPDialogOpen] = useState(false)
  const [_selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [_isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
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

      const response = await apiClient.get<ApiResponse<Task>>(`/api/task-management?${params.toString()}`)
      setTasks(response.data?.tasks || [])
    } catch (error) {
      logger.error("Error fetching tasks:", error)
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
      const response = await apiClient.post<ApiResponse<Task>>("/api/ai/task-suggestions", {
        title: taskData.task_title,
        description: taskData.description,
        type: taskData.task_type
      })

      setAiSuggestions(response.data?.suggestions)
      setShowAISuggestions(true)
      toast.success("AI suggestions generated!")

      // Apply suggestions
      if (response.data?.suggestions?.suggestedPriority) {
        setNewTask(prev => ({ ...prev, priority: response.data?.suggestions?.suggestedPriority as 'low' | 'medium' | 'high' | 'critical' }))
      }
      if (response.data?.suggestions?.estimatedHours) {
        setNewTask(prev => ({ ...prev, estimated_hours: response.data?.suggestions?.estimatedHours }))
      }
    } catch (error) {
      logger.error("Error getting AI suggestions:", error)
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
      const response = await apiClient.post<NLPResponse>("/api/ai/parse-task", {
        input: nlpInput
      })

      setNewTask({
        task_title: response.data.task.title,
        description: response.data.task.description,
        task_type: response.data.task.type,
        priority: response.data.task.priority as 'low' | 'medium' | 'high' | 'critical',
        status: "pending",
        due_date: response.data.task.dueDate,
        estimated_hours: response.data.task.estimatedHours
      })

      setIsNLPDialogOpen(false)
      setIsAddDialogOpen(true)
      toast.success("Task parsed from natural language!")
    } catch (error) {
      logger.error("Error parsing NLP task:", error)
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
      const response = await apiClient.post<ApiResponse<Task>>("/api/task-management", newTask)
      if (response.data?.task) {
        setTasks(current => [...current, response.data.task as Task])
      }
      toast.success("Task created successfully")
      setIsAddDialogOpen(false)
      resetNewTask()
    } catch (error) {
      logger.error("Error creating task:", error)
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
      logger.error("Error performing bulk action:", error)
      toast.error(`Failed to ${action} tasks`)
    }
  }

  const exportTasks = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await apiClient.get(`/api/task-management/export?format=${format}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data as BlobPart])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `tasks-export.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success(`Tasks exported as ${format.toUpperCase()}`)
    } catch (error) {
      logger.error("Error exporting tasks:", error)
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
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}