/**
 * useReactiveReportsData - Real-time reports data with React Query
 * Auto-refreshes every 10 seconds for live dashboard updates
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ReportTemplate {
  id: string
  title: string
  domain: string
  category: string
  description: string
  file?: string
  isCore: boolean
  popularity: number
  lastUsed?: string
  createdAt: string
}

interface ScheduledReport {
  id: string
  templateId: string
  schedule: string
  recipients: string[]
  format: 'pdf' | 'xlsx' | 'csv'
  status: 'active' | 'paused'
  nextRun: string
  lastRun?: string
}

interface GeneratedReport {
  id: string
  templateId: string
  title: string
  generatedAt: string
  generatedBy: string
  format: 'pdf' | 'xlsx' | 'csv'
  size: number
  status: 'completed' | 'failed' | 'generating'
  downloadUrl?: string
}

interface ReportAnalytics {
  totalGenerated: number
  categoryBreakdown: Record<string, number>
  formatBreakdown: Record<string, number>
  generationTrend: Array<{ name: string; count: number }>
}

export function useReactiveReportsData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch report templates (core library + custom)
  const { data: templates = [], isLoading: templatesLoading } = useQuery<ReportTemplate[]>({
    queryKey: ['report-templates', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/reports/templates`)
      if (!response.ok) throw new Error('Failed to fetch report templates')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch scheduled reports
  const { data: scheduledReports = [], isLoading: scheduledLoading } = useQuery<ScheduledReport[]>({
    queryKey: ['scheduled-reports', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/reports/scheduled`)
      if (!response.ok) throw new Error('Failed to fetch scheduled reports')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch generated reports history
  const { data: generatedReports = [], isLoading: historyLoading } = useQuery<GeneratedReport[]>({
    queryKey: ['generated-reports', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/reports/history`)
      if (!response.ok) throw new Error('Failed to fetch report history')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate metrics from real data
  const metrics = {
    totalReports: templates.length,
    coreTemplates: templates.filter((t) => t.isCore).length,
    customTemplates: templates.filter((t) => !t.isCore).length,
    scheduledReports: scheduledReports.length,
    activeSchedules: scheduledReports.filter((s) => s.status === 'active').length,
    generatedToday: generatedReports.filter((r) => {
      const today = new Date().toDateString()
      return new Date(r.generatedAt).toDateString() === today
    }).length,
    totalGenerated: generatedReports.length,
    failedToday: generatedReports.filter((r) => {
      const today = new Date().toDateString()
      return r.status === 'failed' && new Date(r.generatedAt).toDateString() === today
    }).length,
  }

  // Template category distribution for pie chart
  const categoryDistribution = templates.reduce((acc, template) => {
    acc[template.category] = (acc[template.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Domain distribution for analysis
  const domainDistribution = templates.reduce((acc, template) => {
    acc[template.domain] = (acc[template.domain] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Export format distribution
  const formatDistribution = generatedReports.reduce((acc, report) => {
    acc[report.format] = (acc[report.format] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Popular templates (top 10 by usage)
  const popularTemplates = [...templates]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 10)

  // Recent reports (last 10)
  const recentReports = [...generatedReports]
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, 10)

  // Generation trend for line chart (last 7 days)
  const generationTrend = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dateStr = date.toDateString()

    const count = generatedReports.filter(
      (r) => new Date(r.generatedAt).toDateString() === dateStr
    ).length

    return { name: dayName, count }
  })

  // Reports by category for bar chart
  const reportsByCategory = Object.entries(categoryDistribution)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Format breakdown for pie chart
  const formatChartData = Object.entries(formatDistribution).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
  }))

  // Upcoming scheduled reports (next 5)
  const upcomingScheduled = [...scheduledReports]
    .filter((s) => s.status === 'active')
    .sort((a, b) => new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime())
    .slice(0, 5)

  // Failed reports (today)
  const failedReports = generatedReports.filter((r) => {
    const today = new Date().toDateString()
    return r.status === 'failed' && new Date(r.generatedAt).toDateString() === today
  })

  // Generation queue (reports currently generating)
  const generationQueue = generatedReports.filter((r) => r.status === 'generating')

  return {
    templates,
    scheduledReports,
    generatedReports,
    metrics,
    categoryDistribution,
    domainDistribution,
    formatDistribution,
    popularTemplates,
    recentReports,
    generationTrend,
    reportsByCategory,
    formatChartData,
    upcomingScheduled,
    failedReports,
    generationQueue,
    isLoading: templatesLoading || scheduledLoading || historyLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
