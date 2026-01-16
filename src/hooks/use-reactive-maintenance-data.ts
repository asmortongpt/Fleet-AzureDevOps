/**
 * useReactiveMaintenanceData - Real-time maintenance data with React Query
 * Auto-refreshes every 10 seconds for live dashboard updates
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface WorkOrder {
  id: string
  vehicleId: string
  type: 'preventive' | 'corrective' | 'emergency'
  status: 'pending' | 'in_progress' | 'parts_waiting' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours: number
  createdAt: string
}

interface MaintenanceRequest {
  id: string
  status: 'new' | 'review' | 'approved' | 'completed'
  createdAt: string
}

export function useReactiveMaintenanceData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch work orders
  const { data: workOrders = [], isLoading: workOrdersLoading } = useQuery<WorkOrder[]>({
    queryKey: ['work-orders', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/work-orders`)
      if (!response.ok) throw new Error('Failed to fetch work orders')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch maintenance requests
  const { data: requests = [], isLoading: requestsLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ['maintenance-requests', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/maintenance-requests`)
      if (!response.ok) throw new Error('Failed to fetch maintenance requests')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate metrics from real data
  const metrics = {
    totalWorkOrders: workOrders.length,
    urgentOrders: workOrders.filter((wo) => wo.priority === 'urgent').length,
    inProgress: workOrders.filter((wo) => wo.status === 'in_progress').length,
    completedToday: workOrders.filter((wo) => {
      const today = new Date().toDateString()
      return wo.createdAt && new Date(wo.createdAt).toDateString() === today
    }).length,
    partsWaiting: workOrders.filter((wo) => wo.status === 'parts_waiting').length,
    pendingOrders: workOrders.filter((wo) => wo.status === 'pending').length,
  }

  // Request metrics
  const requestMetrics = {
    newRequests: requests.filter((r) => r.status === 'new').length,
    inReview: requests.filter((r) => r.status === 'review').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  }

  // Work order status distribution for pie chart
  const statusDistribution = workOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Work order priority distribution for bar chart
  const priorityDistribution = workOrders.reduce((acc, order) => {
    acc[order.priority] = (acc[order.priority] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Work order type distribution
  const typeDistribution = workOrders.reduce((acc, order) => {
    acc[order.type] = (acc[order.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Request trend data (mock for now - would come from API)
  const requestTrendData = [
    { name: 'Mon', count: 12 },
    { name: 'Tue', count: 19 },
    { name: 'Wed', count: 15 },
    { name: 'Thu', count: 22 },
    { name: 'Fri', count: 18 },
    { name: 'Sat', count: 8 },
    { name: 'Sun', count: 5 },
  ]

  return {
    workOrders,
    requests,
    metrics,
    requestMetrics,
    statusDistribution,
    priorityDistribution,
    typeDistribution,
    requestTrendData,
    isLoading: workOrdersLoading || requestsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
