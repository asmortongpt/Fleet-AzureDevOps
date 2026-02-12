/**
 * useReactiveConfigurationData - Real-time configuration data with React Query
 * Auto-refreshes configuration settings and system status
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface ConfigItem {
  id: string
  category: 'system' | 'integration' | 'security' | 'features' | 'branding'
  key: string
  label: string
  value: any
  lastModified: string
  modifiedBy: string
  status: 'active' | 'pending' | 'deprecated'
}

interface SystemStatus {
  uptime: number
  memory: number
  cpu: number
  diskSpace: number
  activeConnections: number
  requestsPerMinute: number
}

interface IntegrationStatus {
  id: string
  name: string
  type: 'api' | 'database' | 'service' | 'external'
  status: 'connected' | 'error' | 'disconnected'
  lastSync?: string
  errorCount?: number
}

interface SecurityEvent {
  id: string
  type: 'login' | 'access' | 'config_change' | 'alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: string
  userId?: string
}

export function useReactiveConfigurationData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch configuration items
  const { data: configItems = [], isLoading: configLoading } = useQuery<ConfigItem[]>({
    queryKey: ['config-items', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/admin/config`, { credentials: 'include' })
        if (!response.ok) {
          return []
        }
        const payload = await response.json()
        const configs = payload?.data?.configs ?? []
        return configs.map((config: any) => ({
          id: config.id || config.key,
          category: config.category || 'system',
          key: config.key,
          label: config.label || config.key,
          value: config.value,
          lastModified: config.updatedAt || config.lastModified || new Date().toISOString(),
          modifiedBy: config.modifiedBy || 'System',
          status: config.status || 'active'
        }))
      } catch (error) {
        return []
      }
    },
    refetchInterval: 30000, // 30 seconds
    staleTime: 15000,
  })

  // Fetch system status
  const { data: systemStatus, isLoading: systemLoading } = useQuery<SystemStatus>({
    queryKey: ['system-status', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/system-health/metrics`, { credentials: 'include' })
        if (!response.ok) {
          return {
            uptime: 0,
            memory: 0,
            cpu: 0,
            diskSpace: 0,
            activeConnections: 0,
            requestsPerMinute: 0,
          }
        }
        const payload = await response.json()
        const data = payload?.data || {}
        return {
          uptime: data.uptime || 0,
          memory: data.memory?.percentage || 0,
          cpu: data.cpu?.user || 0,
          diskSpace: 0,
          activeConnections: data.connections || 0,
          requestsPerMinute: 0,
        }
      } catch (error) {
        return {
          uptime: 0,
          memory: 0,
          cpu: 0,
          diskSpace: 0,
          activeConnections: 0,
          requestsPerMinute: 0,
        }
      }
    },
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
  })

  // Fetch integration status
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery<IntegrationStatus[]>({
    queryKey: ['integrations-status', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/integrations/health`, { credentials: 'include' })
        if (!response.ok) {
          return []
        }
        const payload = await response.json()
        const integrations = payload?.integrations || []
        return integrations.map((integration: any) => ({
          id: integration.name,
          name: integration.name,
          type: 'external',
          status: integration.status === 'healthy' ? 'connected' : integration.status === 'down' ? 'error' : 'disconnected',
          lastSync: integration.lastSuccess,
          errorCount: integration.errorMessage ? 1 : 0
        }))
      } catch (error) {
        return []
      }
    },
    refetchInterval: 20000, // 20 seconds
    staleTime: 10000,
  })

  // Fetch security events
  const { data: securityEvents = [], isLoading: securityLoading } = useQuery<SecurityEvent[]>({
    queryKey: ['security-events', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/security/events?limit=20`, { credentials: 'include' })
        if (!response.ok) {
          return []
        }
        const payload = await response.json()
        const rows = payload?.data ?? payload ?? []
        return rows.map((row: any) => ({
          id: row.id,
          type: row.event_type || 'alert',
          severity: row.severity || 'low',
          message: row.message,
          timestamp: row.created_at || new Date().toISOString(),
          userId: row.metadata?.user_id
        }))
      } catch (error) {
        return []
      }
    },
    refetchInterval: 15000, // 15 seconds
    staleTime: 7500,
  })

  // Fetch system performance trend (history)
  const { data: systemTrend = [] } = useQuery<Array<{ time: string; cpu?: number; memory?: number; requests?: number }>>({
    queryKey: ['system-metrics-history', realTimeUpdate],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE}/system/metrics/history?hours=24`, { credentials: 'include' })
        if (!response.ok) {
          return []
        }
        const payload = await response.json()
        return payload?.data ?? []
      } catch (error) {
        return []
      }
    },
    refetchInterval: 30000,
    staleTime: 15000
  })

  // Calculate metrics
  const metrics = {
    totalConfigs: configItems.length,
    activeConfigs: configItems.filter((c) => c.status === 'active').length,
    pendingChanges: configItems.filter((c) => c.status === 'pending').length,
    deprecatedConfigs: configItems.filter((c) => c.status === 'deprecated').length,
    systemUptime: systemStatus?.uptime || 0,
    memoryUsage: systemStatus?.memory || 0,
    cpuUsage: systemStatus?.cpu || 0,
    diskUsage: systemStatus?.diskSpace || 0,
    activeIntegrations: integrations.filter((i) => i.status === 'connected').length,
    failedIntegrations: integrations.filter((i) => i.status === 'error').length,
    totalIntegrations: integrations.length,
    securityAlerts: securityEvents.filter((e) => e.severity === 'high' || e.severity === 'critical').length,
    recentChanges: configItems.filter((c) => {
      const modifiedDate = new Date(c.lastModified)
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return modifiedDate >= dayAgo
    }).length,
  }

  // Config distribution by category
  const configByCategory = configItems.reduce((acc, config) => {
    acc[config.category] = (acc[config.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // System performance trend (derived from metrics history)
  const systemPerformanceTrend = systemTrend.map((row) => ({
    name: new Date(row.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    cpu: row.cpu || 0,
    memory: row.memory || 0,
    requests: row.requests || 0
  }))

  // Integration status distribution
  const integrationStatusData = integrations.reduce((acc, integration) => {
    acc[integration.status] = (acc[integration.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Security events by severity
  const securityBySeverity = securityEvents.reduce((acc, event) => {
    acc[event.severity] = (acc[event.severity] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Recent config changes (last 10)
  const recentConfigChanges = configItems
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 10)

  // Critical security events
  const criticalSecurityEvents = securityEvents
    .filter((e) => e.severity === 'high' || e.severity === 'critical')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  // Failed integrations
  const failedIntegrations = integrations
    .filter((i) => i.status === 'error')
    .sort((a, b) => (b.errorCount || 0) - (a.errorCount || 0))

  return {
    configItems,
    systemStatus: systemStatus || {
      uptime: 0,
      memory: 0,
      cpu: 0,
      diskSpace: 0,
      activeConnections: 0,
      requestsPerMinute: 0,
    },
    integrations,
    securityEvents,
    metrics,
    configByCategory,
    systemPerformanceTrend,
    integrationStatusData,
    securityBySeverity,
    recentConfigChanges,
    criticalSecurityEvents,
    failedIntegrations,
    isLoading: configLoading || systemLoading || integrationsLoading || securityLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}
