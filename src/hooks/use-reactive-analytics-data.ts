/**
 * useReactiveAnalyticsData - Real-time analytics data with React Query
 * Auto-refreshes every 10 seconds for live analytics dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface AnalyticsReport {
  id: string
  name: string
  type: 'custom' | 'scheduled' | 'standard'
  category: 'operational' | 'financial' | 'compliance' | 'performance'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'on_demand'
  lastRun?: string
  nextRun?: string
  createdAt: string
  status: 'active' | 'inactive' | 'archived'
}

interface MetricData {
  name: string
  value: number
  unit?: string
  trend?: 'up' | 'down' | 'neutral'
  change?: number
}

interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'stat' | 'table' | 'map'
  dataSource: string
  refreshInterval: number
}

export function useReactiveAnalyticsData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch analytics reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery<AnalyticsReport[]>({
    queryKey: ['analytics-reports', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/reports`)
      if (!response.ok) throw new Error('Failed to fetch reports')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch dashboard widgets (mock endpoint)
  const { data: dashboards = [], isLoading: dashboardsLoading } = useQuery<DashboardWidget[]>({
    queryKey: ['dashboards', realTimeUpdate],
    queryFn: async () => {
      // Mock data - in production this would be a real API call
      return Promise.resolve([
        { id: '1', title: 'Fleet Overview', type: 'chart' as const, dataSource: 'vehicles', refreshInterval: 5000 },
        { id: '2', title: 'Cost Analysis', type: 'chart' as const, dataSource: 'costs', refreshInterval: 10000 },
        { id: '3', title: 'Performance Metrics', type: 'stat' as const, dataSource: 'performance', refreshInterval: 5000 },
        { id: '4', title: 'Route Map', type: 'map' as const, dataSource: 'routes', refreshInterval: 15000 },
      ])
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate metrics
  const metrics = {
    totalReports: reports.length,
    activeReports: reports.filter((r) => r.status === 'active').length,
    scheduledReports: reports.filter((r) => r.frequency !== 'on_demand').length,
    customReports: reports.filter((r) => r.type === 'custom').length,
    reportsThisWeek: reports.filter((r) => {
      if (!r.lastRun) return false
      const lastRun = new Date(r.lastRun)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return lastRun >= weekAgo
    }).length,
    activeDashboards: dashboards.length,
    dataPoints: 2400000, // Mock - would come from backend
  }

  // Report type distribution
  const reportTypeDistribution = reports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Reports by category
  const reportsByCategory = reports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Category chart data
  const categoryChartData = Object.entries(reportsByCategory).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'operational'
        ? 'hsl(var(--primary))'
        : name === 'financial'
          ? 'hsl(var(--success))'
          : name === 'compliance'
            ? 'hsl(var(--warning))'
            : 'hsl(var(--info))',
  }))

  // Type chart data
  const typeChartData = Object.entries(reportTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  // Mock trend data - would come from historical analytics
  const reportGenerationTrend = [
    { name: 'Week 1', reports: 24, scheduled: 12, custom: 8 },
    { name: 'Week 2', reports: 28, scheduled: 14, custom: 10 },
    { name: 'Week 3', reports: 26, scheduled: 13, custom: 9 },
    { name: 'Week 4', reports: 32, scheduled: 15, custom: 12 },
  ]

  // Mock performance metrics trend
  const performanceMetricsTrend = [
    { name: 'Jan', utilization: 82, efficiency: 78, availability: 94 },
    { name: 'Feb', utilization: 85, efficiency: 80, availability: 95 },
    { name: 'Mar', utilization: 83, efficiency: 82, availability: 93 },
    { name: 'Apr', utilization: 87, efficiency: 85, availability: 96 },
    { name: 'May', utilization: 86, efficiency: 84, availability: 94 },
    { name: 'Jun', utilization: 89, efficiency: 87, availability: 97 },
  ]

  // Mock cost trends
  const costTrends = [
    { name: 'Jan', fuel: 45000, maintenance: 28000, operations: 35000, total: 108000 },
    { name: 'Feb', fuel: 47000, maintenance: 26000, operations: 36000, total: 109000 },
    { name: 'Mar', fuel: 46000, maintenance: 30000, operations: 34000, total: 110000 },
    { name: 'Apr', fuel: 44000, maintenance: 27000, operations: 35000, total: 106000 },
    { name: 'May', fuel: 43000, maintenance: 25000, operations: 33000, total: 101000 },
    { name: 'Jun', fuel: 42000, maintenance: 24000, operations: 32000, total: 98000 },
  ]

  // Mock revenue vs cost data
  const revenueVsCost = [
    { name: 'Q1', revenue: 450000, costs: 327000, margin: 27.3 },
    { name: 'Q2', revenue: 480000, costs: 315000, margin: 34.4 },
    { name: 'Q3', revenue: 465000, costs: 335000, margin: 27.9 },
    { name: 'Q4', revenue: 510000, costs: 340000, margin: 33.3 },
  ]

  // Recent reports
  const recentReports = reports
    .filter((r) => r.lastRun)
    .sort((a, b) => new Date(b.lastRun!).getTime() - new Date(a.lastRun!).getTime())
    .slice(0, 10)

  // Upcoming scheduled reports
  const upcomingReports = reports
    .filter((r) => r.nextRun && r.status === 'active')
    .sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime())
    .slice(0, 5)

  // Key performance indicators
  const kpis: MetricData[] = [
    { name: 'Fleet Utilization', value: 87, unit: '%', trend: 'up', change: 5 },
    { name: 'Cost per Mile', value: 0.42, unit: '$', trend: 'down', change: -0.03 },
    { name: 'On-Time Delivery', value: 94, unit: '%', trend: 'up', change: 2 },
    { name: 'Safety Score', value: 92, unit: '', trend: 'up', change: 4 },
    { name: 'Fuel Efficiency', value: 8.5, unit: 'mpg', trend: 'up', change: 0.3 },
    { name: 'Maintenance Cost', value: 25000, unit: '$', trend: 'down', change: -3000 },
    { name: 'Driver Satisfaction', value: 88, unit: '%', trend: 'up', change: 3 },
    { name: 'Customer NPS', value: 72, unit: '', trend: 'up', change: 5 },
  ]

  // Dashboard usage statistics
  const dashboardStats = {
    totalViews: 1250,
    uniqueUsers: 45,
    avgSessionDuration: 8.5, // minutes
    mostViewedDashboard: 'Fleet Overview',
    lastRefresh: new Date(),
  }

  return {
    // Data
    reports,
    dashboards,
    recentReports,
    upcomingReports,

    // Metrics
    metrics,
    kpis,
    dashboardStats,

    // Distributions
    reportTypeDistribution,
    reportsByCategory,
    categoryChartData,
    typeChartData,

    // Trends
    reportGenerationTrend,
    performanceMetricsTrend,
    costTrends,
    revenueVsCost,

    // State
    isLoading: reportsLoading || dashboardsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
