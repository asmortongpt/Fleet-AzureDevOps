/**
 * Reactive Work Data Hook
 * Real-time data fetching with automatic refresh for work management
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const API_BASE = '/api'

export interface WorkOrder {
  id: string
  tenant_id: string
  work_order_number: string
  vehicle_id: string
  facility_id?: string
  assigned_technician_id?: string
  type: 'preventive' | 'corrective' | 'inspection' | 'recall' | 'warranty' | 'accident_repair' | 'modification' | 'diagnostic' | 'bodywork' | 'tire_service' | 'emergency'
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'waiting_parts' | 'waiting_approval' | 'completed' | 'cancelled' | 'closed'
  description: string
  scheduled_start?: string
  scheduled_end?: string
  actual_start?: string
  actual_end?: string
  labor_hours?: number
  labor_cost?: number
  parts_cost?: number
  total_cost?: number
  odometer_reading?: number
  engine_hours_reading?: number
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  work_order_id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'blocked'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assigned_to?: string
  due_date?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  start_date: string
  end_date?: string
  budget?: number
  actual_cost?: number
  completion_percentage: number
  team_members: string[]
  milestone_count: number
  created_at: string
  updated_at: string
}

export interface TeamAssignment {
  id: string
  technician_id: string
  technician_name: string
  active_work_orders: number
  total_hours_this_week: number
  utilization_percentage: number
  specializations: string[]
}

export interface WorkMetrics {
  totalWorkOrders: number
  openWorkOrders: number
  inProgressWorkOrders: number
  completedWorkOrders: number
  activeTasks: number
  completedTasks: number
  completionRate: number
  teamUtilization: number
  avgCompletionTime: number
  totalLabor: number
  totalParts: number
  totalCost: number
}

export function useReactiveWorkData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch work orders with automatic refresh
  const {
    data: workOrders = [],
    isLoading: workOrdersLoading,
    error: workOrdersError,
  } = useQuery<WorkOrder[]>({
    queryKey: ['work-orders', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/work-orders`)
      if (!response.ok) throw new Error('Failed to fetch work orders')
      return response.json()
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  })

  // Fetch tasks
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery<Task[]>({
    queryKey: ['tasks', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tasks`)
      if (!response.ok) {
        // Return mock data if endpoint doesn't exist
        return []
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch projects
  const {
    data: projects = [],
    isLoading: projectsLoading,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: ['projects', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/projects`)
      if (!response.ok) {
        // Return mock data if endpoint doesn't exist
        return []
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch team assignments
  const {
    data: teamAssignments = [],
    isLoading: teamLoading,
    error: teamError,
  } = useQuery<TeamAssignment[]>({
    queryKey: ['team-assignments', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/team-assignments`)
      if (!response.ok) {
        // Return mock data if endpoint doesn't exist
        return []
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdate((prev) => prev + 1)
    }, 15000) // Update every 15 seconds

    return () => clearInterval(interval)
  }, [])

  // Calculate status distribution
  const statusDistribution = workOrders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate priority distribution
  const priorityDistribution = workOrders.reduce(
    (acc, order) => {
      acc[order.priority] = (acc[order.priority] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate type distribution
  const typeDistribution = workOrders.reduce(
    (acc, order) => {
      acc[order.type] = (acc[order.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate task status distribution
  const taskStatusDistribution = tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate metrics
  const totalWorkOrders = workOrders.length
  const openWorkOrders = workOrders.filter((wo) => wo.status === 'open' || wo.status === 'assigned').length
  const inProgressWorkOrders = workOrders.filter((wo) => wo.status === 'in_progress').length
  const completedWorkOrders = workOrders.filter((wo) => wo.status === 'completed' || wo.status === 'closed').length
  const activeTasks = tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress').length
  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const completionRate = totalWorkOrders > 0 ? (completedWorkOrders / totalWorkOrders) * 100 : 0

  // Calculate team utilization (average across all team members)
  const teamUtilization = teamAssignments.length > 0
    ? teamAssignments.reduce((sum, member) => sum + member.utilization_percentage, 0) / teamAssignments.length
    : 0

  // Calculate average completion time (in hours)
  const completedWithTimes = workOrders.filter(
    (wo) => wo.actual_start && wo.actual_end
  )
  const avgCompletionTime = completedWithTimes.length > 0
    ? completedWithTimes.reduce((sum, wo) => {
        const start = new Date(wo.actual_start!).getTime()
        const end = new Date(wo.actual_end!).getTime()
        return sum + (end - start) / (1000 * 60 * 60) // Convert to hours
      }, 0) / completedWithTimes.length
    : 0

  // Calculate total costs
  const totalLabor = workOrders.reduce((sum, wo) => sum + (wo.labor_cost || 0), 0)
  const totalParts = workOrders.reduce((sum, wo) => sum + (wo.parts_cost || 0), 0)
  const totalCost = totalLabor + totalParts

  const metrics: WorkMetrics = {
    totalWorkOrders,
    openWorkOrders,
    inProgressWorkOrders,
    completedWorkOrders,
    activeTasks,
    completedTasks,
    completionRate,
    teamUtilization,
    avgCompletionTime,
    totalLabor,
    totalParts,
    totalCost,
  }

  // Filter high priority work orders
  const highPriorityOrders = workOrders.filter(
    (wo) => (wo.priority === 'high' || wo.priority === 'critical' || wo.priority === 'urgent') &&
           (wo.status !== 'completed' && wo.status !== 'closed' && wo.status !== 'cancelled')
  )

  // Filter overdue work orders
  const overdueOrders = workOrders.filter((wo) => {
    if (!wo.scheduled_end || wo.status === 'completed' || wo.status === 'closed' || wo.status === 'cancelled') {
      return false
    }
    return new Date(wo.scheduled_end) < new Date()
  })

  // Active projects
  const activeProjects = projects.filter((p) => p.status === 'active')

  // Completion trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })

  const completionTrend = last7Days.map((date) => {
    const completedOnDate = workOrders.filter(
      (wo) =>
        wo.actual_end &&
        wo.actual_end.startsWith(date) &&
        (wo.status === 'completed' || wo.status === 'closed')
    ).length

    return {
      name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: completedOnDate,
    }
  })

  return {
    workOrders,
    tasks,
    projects,
    teamAssignments,
    metrics,
    statusDistribution,
    priorityDistribution,
    typeDistribution,
    taskStatusDistribution,
    highPriorityOrders,
    overdueOrders,
    activeProjects,
    completionTrend,
    isLoading: workOrdersLoading || tasksLoading || projectsLoading || teamLoading,
    error: workOrdersError || tasksError || projectsError || teamError,
    lastUpdate: new Date(),
  }
}
