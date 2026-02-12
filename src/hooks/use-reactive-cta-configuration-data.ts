/**
 * useReactiveCTAConfigurationData - Real-time CTA configuration data with React Query
 * Auto-refreshes every 30 seconds for live configuration monitoring
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { secureFetch } from '@/hooks/use-api'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface ConfigurationItem {
  id: string
  category: 'organization' | 'branding' | 'modules' | 'business_rules' | 'integrations' | 'notifications' | 'security'
  key: string
  label: string
  value: any
  defaultValue: any
  type: 'string' | 'number' | 'boolean' | 'select' | 'color'
  status: 'default' | 'configured' | 'policy_driven' | 'pending_approval'
  policySource?: string
  lastModified: string
  modifiedBy: string
  impact: 'low' | 'medium' | 'high'
  requiresApproval: boolean
}

interface Integration {
  id: string
  name: string
  type: 'api' | 'webhook' | 'external_service'
  status: 'active' | 'inactive' | 'error' | 'pending'
  endpoint?: string
  lastSync?: string
  requestCount?: number
  errorRate?: number
}

interface MonitoringMetric {
  id: string
  metric: string
  value: number
  unit: string
  timestamp: string
  status: 'normal' | 'warning' | 'critical'
}

export function useReactiveCTAConfigurationData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch configuration items
  const { data: configItems = [], isLoading: configLoading } = useQuery<ConfigurationItem[]>({
    queryKey: ['cta-configuration', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await secureFetch(`${API_BASE}/configuration`)
        if (!response.ok) {
          return []
        }
        return response.json()
      } catch {
        return []
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Fetch integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<Integration[]>({
    queryKey: ['cta-integrations', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await secureFetch(`${API_BASE}/integrations`)
        if (!response.ok) {
          return []
        }
        return response.json()
      } catch {
        return []
      }
    },
    refetchInterval: 30000,
    staleTime: 15000,
  })

  // Fetch monitoring metrics
  const { data: monitoringMetrics = [], isLoading: monitoringLoading } = useQuery<MonitoringMetric[]>({
    queryKey: ['cta-monitoring', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await secureFetch(`${API_BASE}/monitoring/metrics`)
        if (!response.ok) {
          return []
        }
        return response.json()
      } catch {
        return []
      }
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate configuration metrics
  const metrics = {
    totalSettings: configItems.length,
    configured: configItems.filter((item) => item.status === 'configured').length,
    policyDriven: configItems.filter((item) => item.status === 'policy_driven').length,
    needsApproval: configItems.filter((item) => item.status === 'pending_approval').length,
    defaultSettings: configItems.filter((item) => item.status === 'default').length,
    highImpact: configItems.filter((item) => item.impact === 'high').length,
    activeIntegrations: integrations.filter((i) => i.status === 'active').length,
    inactiveIntegrations: integrations.filter((i) => i.status === 'inactive').length,
    errorIntegrations: integrations.filter((i) => i.status === 'error').length,
  }

  // Configuration by category
  const configByCategory = configItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Configuration by status
  const configByStatus = configItems.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const configTrendData = Array.from({ length: 7 }, (_, i) => {
    const day = new Date()
    day.setDate(day.getDate() - (6 - i))
    const label = day.toLocaleDateString('en-US', { weekday: 'short' })
    const isSameDay = (dateString?: string) => {
      if (!dateString) return false
      const date = new Date(dateString)
      return date.toDateString() === day.toDateString()
    }

    const dailyItems = configItems.filter((item) => isSameDay(item.lastModified))
    return {
      name: label,
      configured: dailyItems.filter((item) => item.status === 'configured').length,
      policyDriven: dailyItems.filter((item) => item.status === 'policy_driven').length,
      default: dailyItems.filter((item) => item.status === 'default').length,
    }
  })

  // Integration status distribution
  const integrationStatusData = Object.entries(
    integrations.reduce((acc, integration) => {
      acc[integration.status] = (acc[integration.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value,
    fill:
      name === 'active'
        ? 'hsl(var(--success))'
        : name === 'error'
          ? 'hsl(var(--destructive))'
          : name === 'pending'
            ? 'hsl(var(--warning))'
            : 'hsl(var(--muted))',
  }))

  // Recent configuration changes
  const recentChanges = configItems
    .filter((item) => item.status !== 'default')
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 10)

  // Pending approvals
  const pendingApprovals = configItems.filter((item) => item.status === 'pending_approval')

  // System health metrics
  const systemHealth = {
    cpuUsage: monitoringMetrics.find((m) => m.metric === 'cpu_usage')?.value || 0,
    memoryUsage: monitoringMetrics.find((m) => m.metric === 'memory_usage')?.value || 0,
    diskUsage: monitoringMetrics.find((m) => m.metric === 'disk_usage')?.value || 0,
    apiResponseTime: monitoringMetrics.find((m) => m.metric === 'api_response_time')?.value || 0,
    activeUsers: monitoringMetrics.find((m) => m.metric === 'active_users')?.value || 0,
    errorRate: monitoringMetrics.find((m) => m.metric === 'error_rate')?.value || 0,
  }

  return {
    configItems,
    integrations,
    monitoringMetrics,
    metrics,
    configByCategory,
    configByStatus,
    configTrendData,
    integrationStatusData,
    recentChanges,
    pendingApprovals,
    systemHealth,
    isLoading: configLoading || integrationsLoading || monitoringLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
