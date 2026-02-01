/**
 * useReactiveConfigurationData - Real-time configuration data with React Query
 * Auto-refreshes configuration settings and system status
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

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
        const response = await fetch(`${API_BASE}/admin/config`)
        if (!response.ok) {
          return []
        }
        return response.json()
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
        const response = await fetch(`${API_BASE}/system/status`)
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
        return response.json()
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
        const response = await fetch(`${API_BASE}/integrations/status`)
        if (!response.ok) {
          return []
        }
        return response.json()
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
        const response = await fetch(`${API_BASE}/security/events?limit=20`)
        if (!response.ok) {
          return []
        }
        return response.json()
      } catch (error) {
        return []
      }
    },
    refetchInterval: 15000, // 15 seconds
    staleTime: 7500,
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

  // System performance trend (mock data for charts)
  const systemPerformanceTrend = [
    { name: '00:00', cpu: 45, memory: 62, requests: 120 },
    { name: '04:00', cpu: 38, memory: 58, requests: 85 },
    { name: '08:00', cpu: 65, memory: 72, requests: 340 },
    { name: '12:00', cpu: 72, memory: 78, requests: 450 },
    { name: '16:00', cpu: 58, memory: 68, requests: 380 },
    { name: '20:00', cpu: 52, memory: 65, requests: 220 },
  ]

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
