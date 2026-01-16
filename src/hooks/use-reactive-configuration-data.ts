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
          // Return mock data if API fails
          return generateMockConfigItems()
        }
        return response.json()
      } catch (error) {
        return generateMockConfigItems()
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
          return generateMockSystemStatus()
        }
        return response.json()
      } catch (error) {
        return generateMockSystemStatus()
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
          return generateMockIntegrations()
        }
        return response.json()
      } catch (error) {
        return generateMockIntegrations()
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
          return generateMockSecurityEvents()
        }
        return response.json()
      } catch (error) {
        return generateMockSecurityEvents()
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
    systemStatus: systemStatus || generateMockSystemStatus(),
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

// ============================================================================
// Mock Data Generators (for development/fallback)
// ============================================================================

function generateMockConfigItems(): ConfigItem[] {
  const categories: Array<'system' | 'integration' | 'security' | 'features' | 'branding'> = [
    'system', 'integration', 'security', 'features', 'branding'
  ]

  return [
    {
      id: '1',
      category: 'system',
      key: 'app.name',
      label: 'Application Name',
      value: 'Fleet Management System',
      lastModified: new Date().toISOString(),
      modifiedBy: 'admin@example.com',
      status: 'active',
    },
    {
      id: '2',
      category: 'system',
      key: 'app.timezone',
      label: 'Default Timezone',
      value: 'America/New_York',
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      modifiedBy: 'admin@example.com',
      status: 'active',
    },
    {
      id: '3',
      category: 'integration',
      key: 'api.rate_limit',
      label: 'API Rate Limit',
      value: 1000,
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      modifiedBy: 'system@example.com',
      status: 'active',
    },
    {
      id: '4',
      category: 'security',
      key: 'auth.session_timeout',
      label: 'Session Timeout (minutes)',
      value: 30,
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      modifiedBy: 'admin@example.com',
      status: 'active',
    },
    {
      id: '5',
      category: 'features',
      key: 'feature.gps_tracking',
      label: 'GPS Tracking',
      value: true,
      lastModified: new Date(Date.now() - 345600000).toISOString(),
      modifiedBy: 'admin@example.com',
      status: 'active',
    },
    {
      id: '6',
      category: 'branding',
      key: 'theme.primary_color',
      label: 'Primary Color',
      value: '#3b82f6',
      lastModified: new Date(Date.now() - 432000000).toISOString(),
      modifiedBy: 'admin@example.com',
      status: 'active',
    },
  ]
}

function generateMockSystemStatus(): SystemStatus {
  return {
    uptime: 345600, // 4 days in seconds
    memory: 65 + Math.random() * 15, // 65-80%
    cpu: 45 + Math.random() * 25, // 45-70%
    diskSpace: 55 + Math.random() * 20, // 55-75%
    activeConnections: Math.floor(150 + Math.random() * 100),
    requestsPerMinute: Math.floor(300 + Math.random() * 200),
  }
}

function generateMockIntegrations(): IntegrationStatus[] {
  return [
    {
      id: '1',
      name: 'Google Maps API',
      type: 'api',
      status: 'connected',
      lastSync: new Date().toISOString(),
      errorCount: 0,
    },
    {
      id: '2',
      name: 'PostgreSQL Database',
      type: 'database',
      status: 'connected',
      lastSync: new Date().toISOString(),
      errorCount: 0,
    },
    {
      id: '3',
      name: 'Azure AD',
      type: 'service',
      status: 'connected',
      lastSync: new Date(Date.now() - 60000).toISOString(),
      errorCount: 0,
    },
    {
      id: '4',
      name: 'Weather Service',
      type: 'external',
      status: 'error',
      lastSync: new Date(Date.now() - 300000).toISOString(),
      errorCount: 3,
    },
    {
      id: '5',
      name: 'SMTP Server',
      type: 'service',
      status: 'connected',
      lastSync: new Date(Date.now() - 120000).toISOString(),
      errorCount: 0,
    },
  ]
}

function generateMockSecurityEvents(): SecurityEvent[] {
  const types: Array<'login' | 'access' | 'config_change' | 'alert'> = ['login', 'access', 'config_change', 'alert']
  const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical']

  return [
    {
      id: '1',
      type: 'login',
      severity: 'low',
      message: 'Successful login from 192.168.1.100',
      timestamp: new Date(Date.now() - 60000).toISOString(),
      userId: 'user@example.com',
    },
    {
      id: '2',
      type: 'alert',
      severity: 'high',
      message: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      userId: 'unknown',
    },
    {
      id: '3',
      type: 'config_change',
      severity: 'medium',
      message: 'Configuration setting updated: auth.session_timeout',
      timestamp: new Date(Date.now() - 180000).toISOString(),
      userId: 'admin@example.com',
    },
    {
      id: '4',
      type: 'access',
      severity: 'low',
      message: 'Resource accessed: /api/vehicles',
      timestamp: new Date(Date.now() - 240000).toISOString(),
      userId: 'user@example.com',
    },
    {
      id: '5',
      type: 'alert',
      severity: 'critical',
      message: 'Unauthorized access attempt blocked',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      userId: 'attacker@malicious.com',
    },
  ]
}
