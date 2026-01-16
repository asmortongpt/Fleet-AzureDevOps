/**
 * useReactiveCTAConfigurationData - Real-time CTA configuration data with React Query
 * Auto-refreshes every 30 seconds for live configuration monitoring
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

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
        const response = await fetch(`${API_BASE}/configuration`)
        if (!response.ok) {
          // Return mock data if API not available
          return generateMockConfigItems()
        }
        return response.json()
      } catch {
        return generateMockConfigItems()
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
        const response = await fetch(`${API_BASE}/integrations`)
        if (!response.ok) {
          return generateMockIntegrations()
        }
        return response.json()
      } catch {
        return generateMockIntegrations()
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
        const response = await fetch(`${API_BASE}/monitoring/metrics`)
        if (!response.ok) {
          return generateMockMonitoringMetrics()
        }
        return response.json()
      } catch {
        return generateMockMonitoringMetrics()
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

  // Configuration trend (last 7 days - mock data)
  const configTrendData = [
    { name: 'Mon', configured: 45, policyDriven: 12, default: 8 },
    { name: 'Tue', configured: 47, policyDriven: 13, default: 5 },
    { name: 'Wed', configured: 48, policyDriven: 14, default: 3 },
    { name: 'Thu', configured: 50, policyDriven: 15, default: 0 },
    { name: 'Fri', configured: 52, policyDriven: 15, default: 0 },
    { name: 'Sat', configured: 52, policyDriven: 16, default: 0 },
    { name: 'Sun', configured: 53, policyDriven: 17, default: 0 },
  ]

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

// Mock data generators
function generateMockConfigItems(): ConfigurationItem[] {
  return [
    // Organization
    {
      id: '1',
      category: 'organization',
      key: 'org.name',
      label: 'Organization Name',
      value: 'Capital Tech Alliance',
      defaultValue: 'My Organization',
      type: 'string',
      status: 'configured',
      lastModified: new Date(Date.now() - 86400000 * 5).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'medium',
      requiresApproval: false,
    },
    {
      id: '2',
      category: 'organization',
      key: 'org.timezone',
      label: 'Default Timezone',
      value: 'America/New_York',
      defaultValue: 'UTC',
      type: 'select',
      status: 'configured',
      lastModified: new Date(Date.now() - 86400000 * 10).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'low',
      requiresApproval: false,
    },
    // Branding
    {
      id: '3',
      category: 'branding',
      key: 'brand.primaryColor',
      label: 'Primary Brand Color',
      value: '#2563eb',
      defaultValue: '#3b82f6',
      type: 'color',
      status: 'configured',
      lastModified: new Date(Date.now() - 86400000).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'low',
      requiresApproval: false,
    },
    {
      id: '4',
      category: 'branding',
      key: 'brand.logo',
      label: 'Company Logo URL',
      value: '/assets/cta-logo.png',
      defaultValue: '/assets/default-logo.png',
      type: 'string',
      status: 'configured',
      lastModified: new Date(Date.now() - 86400000 * 15).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'low',
      requiresApproval: false,
    },
    // Business Rules
    {
      id: '5',
      category: 'business_rules',
      key: 'maintenance.pmInterval',
      label: 'PM Interval (miles)',
      value: 5000,
      defaultValue: 3000,
      type: 'number',
      status: 'policy_driven',
      policySource: 'preventive-maintenance-policy',
      lastModified: new Date(Date.now() - 7200000).toISOString(),
      modifiedBy: 'Policy Engine',
      impact: 'high',
      requiresApproval: true,
    },
    {
      id: '6',
      category: 'business_rules',
      key: 'approval.maintenanceThreshold',
      label: 'Maintenance Approval Threshold',
      value: 5000,
      defaultValue: 1000,
      type: 'number',
      status: 'policy_driven',
      policySource: 'approval-workflow-policy',
      lastModified: new Date(Date.now() - 172800000).toISOString(),
      modifiedBy: 'Policy Engine',
      impact: 'high',
      requiresApproval: true,
    },
    // Modules
    {
      id: '7',
      category: 'modules',
      key: 'modules.maintenance',
      label: 'Maintenance Hub Enabled',
      value: true,
      defaultValue: true,
      type: 'boolean',
      status: 'default',
      lastModified: new Date(Date.now() - 2592000000).toISOString(),
      modifiedBy: 'System',
      impact: 'medium',
      requiresApproval: false,
    },
    {
      id: '8',
      category: 'modules',
      key: 'modules.compliance',
      label: 'Compliance Hub Enabled',
      value: true,
      defaultValue: true,
      type: 'boolean',
      status: 'default',
      lastModified: new Date(Date.now() - 2592000000).toISOString(),
      modifiedBy: 'System',
      impact: 'medium',
      requiresApproval: false,
    },
    // Security
    {
      id: '9',
      category: 'security',
      key: 'security.sessionTimeout',
      label: 'Session Timeout (minutes)',
      value: 60,
      defaultValue: 30,
      type: 'number',
      status: 'policy_driven',
      policySource: 'security-policy',
      lastModified: new Date(Date.now() - 259200000).toISOString(),
      modifiedBy: 'Policy Engine',
      impact: 'high',
      requiresApproval: true,
    },
    {
      id: '10',
      category: 'security',
      key: 'security.mfaRequired',
      label: 'MFA Required',
      value: true,
      defaultValue: false,
      type: 'boolean',
      status: 'pending_approval',
      lastModified: new Date(Date.now() - 3600000).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'high',
      requiresApproval: true,
    },
    // Integrations
    {
      id: '11',
      category: 'integrations',
      key: 'integrations.azureEnabled',
      label: 'Azure AD Integration',
      value: true,
      defaultValue: false,
      type: 'boolean',
      status: 'configured',
      lastModified: new Date(Date.now() - 604800000).toISOString(),
      modifiedBy: 'admin@cta.com',
      impact: 'high',
      requiresApproval: true,
    },
    // Notifications
    {
      id: '12',
      category: 'notifications',
      key: 'notifications.emailEnabled',
      label: 'Email Notifications',
      value: true,
      defaultValue: true,
      type: 'boolean',
      status: 'default',
      lastModified: new Date(Date.now() - 2592000000).toISOString(),
      modifiedBy: 'System',
      impact: 'low',
      requiresApproval: false,
    },
  ]
}

function generateMockIntegrations(): Integration[] {
  return [
    {
      id: '1',
      name: 'Azure AD SSO',
      type: 'external_service',
      status: 'active',
      endpoint: 'https://login.microsoftonline.com',
      lastSync: new Date(Date.now() - 3600000).toISOString(),
      requestCount: 1543,
      errorRate: 0.2,
    },
    {
      id: '2',
      name: 'Telematics API',
      type: 'api',
      status: 'active',
      endpoint: 'https://api.telematics.com/v1',
      lastSync: new Date(Date.now() - 600000).toISOString(),
      requestCount: 8734,
      errorRate: 1.5,
    },
    {
      id: '3',
      name: 'Fleet Maintenance Webhook',
      type: 'webhook',
      status: 'active',
      endpoint: 'https://fleet.cta.com/webhooks/maintenance',
      lastSync: new Date(Date.now() - 1800000).toISOString(),
      requestCount: 234,
      errorRate: 0.0,
    },
    {
      id: '4',
      name: 'External Vendor Portal',
      type: 'external_service',
      status: 'error',
      endpoint: 'https://vendors.external.com/api',
      lastSync: new Date(Date.now() - 86400000).toISOString(),
      requestCount: 45,
      errorRate: 23.5,
    },
    {
      id: '5',
      name: 'Analytics Service',
      type: 'api',
      status: 'inactive',
      endpoint: 'https://analytics.cta.com/api',
      lastSync: new Date(Date.now() - 604800000).toISOString(),
      requestCount: 0,
      errorRate: 0.0,
    },
  ]
}

function generateMockMonitoringMetrics(): MonitoringMetric[] {
  return [
    {
      id: '1',
      metric: 'cpu_usage',
      value: 45,
      unit: '%',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
    {
      id: '2',
      metric: 'memory_usage',
      value: 68,
      unit: '%',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
    {
      id: '3',
      metric: 'disk_usage',
      value: 52,
      unit: '%',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
    {
      id: '4',
      metric: 'api_response_time',
      value: 245,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
    {
      id: '5',
      metric: 'active_users',
      value: 127,
      unit: 'users',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
    {
      id: '6',
      metric: 'error_rate',
      value: 0.3,
      unit: '%',
      timestamp: new Date().toISOString(),
      status: 'normal',
    },
  ]
}
