/**
 * AdminConfigurationHub - Consolidated Administration & Configuration Dashboard
 *
 * Consolidates:
 * - AdminHub (user management, system administration)
 * - CTAConfigurationHub (CTA-specific settings)
 * - DataGovernanceHub (data management, compliance)
 * - IntegrationsHub (third-party integrations, APIs)
 * - DocumentsHub (document management, templates)
 *
 * Features:
 * - System administration and user management
 * - Application configuration and settings
 * - Data governance and compliance
 * - Integration management
 * - Document repository and templates
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import {
  Settings,
  Users,
  Shield,
  Database,
  Plug,
  FileText,
  Server,
  HardDrive,
  Code,
  Webhook,
  CloudCog,
  UserCog,
  Sliders,
  ToggleLeft,
  Palette,
  Languages,
  Clock,
  Activity,
  FileCheck,
  FolderOpen,
  Upload,
  Download,
  Archive
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'

import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import useSWR from 'swr'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  StatCard,
  ResponsiveLineChart,
} from '@/components/visualizations'
import { useTenant } from '@/contexts'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers'
import logger from '@/utils/logger';


const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const rawFetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

/** Returns semantic color class based on percentage thresholds */
function semanticPercentColor(value: number): string {
  if (value >= 75) return 'text-emerald-400'
  if (value >= 50) return 'text-amber-400'
  return 'text-rose-400'
}

/** Returns semantic bg color class for progress bars */
function semanticPercentBg(value: number): string {
  if (value >= 75) return 'bg-emerald-500'
  if (value >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Admin Tab - System administration and user management
 */
const AdminTabContent = memo(function AdminTabContent() {
  const { push } = useDrilldown()
  const navigate = useNavigate()
  const { data: users, error: usersError } = useSWR<any[]>(
    '/api/users?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: sessions, error: sessionsError } = useSWR<any[]>(
    '/api/sessions?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: systemMetrics, error: systemMetricsError } = useSWR<any>(
    '/api/system/metrics',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: health, error: healthError } = useSWR<any>(
    '/api/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: storageStats, error: storageStatsError } = useSWR<any>(
    '/api/storage/stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: auditLogs, error: auditLogsError } = useSWR<any[]>(
    '/api/audit-logs?limit=20',
    fetcher,
    { shouldRetryOnError: false }
  )

  const adminError = usersError || sessionsError || systemMetricsError || healthError || storageStatsError || auditLogsError

  const userRows = Array.isArray(users) ? users : []
  const sessionRows = Array.isArray(sessions) ? sessions : []
  const activeSessionCount = sessionRows.filter((session: any) => session.status === 'active').length

  const systemHealthPercent = useMemo(() => {
    const status = health?.status
    if (status === 'healthy') return 100
    if (status === 'degraded') return 75
    if (status === 'unhealthy') return 40
    return 0
  }, [health])

  const storageUsedPercent = Number(storageStats?.quotaUsedPercent || 0)

  const userGroups = useMemo(() => {
    const roleCounts = new Map<string, number>()
    userRows.forEach((user: any) => {
      const role = user.role || 'user'
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1)
    })
    return Array.from(roleCounts.entries()).map(([role, count]) => ({
      role,
      count,
      permissions: role
    }))
  }, [userRows])

  const systemStatusItems = useMemo(() => {
    const checks = health?.checks || {}
    return Object.entries(checks).map(([service, details]: any) => ({
      service,
      status: details.status || 'unknown',
      uptime: details.latency || details.message || '\u2014'
    }))
  }, [health])

  const auditRows = Array.isArray(auditLogs) ? auditLogs : []

  const handleManageUsers = (role: string) => {
    toast.success(`Opening user management for role: ${formatEnum(role)}`)
    logger.info('Manage users clicked:', role)
    navigate('/admin', {
      state: { tab: 'users', roleFilter: role }
    })
  }

  if (adminError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load admin data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Admin Statistics */}
      <div className="grid gap-2 grid-cols-4">
        <StatCard
          title="Total Users"
          value={userRows.length}
          icon={Users}
          description="Active accounts"
        />
        <StatCard
          title="System Health"
          value={systemHealthPercent > 0 ? (
            <span className={semanticPercentColor(systemHealthPercent)}>{systemHealthPercent}%</span>
          ) : "\u2014"}
          icon={Activity}
          description="Uptime this month"
        />
        <StatCard
          title="Active Sessions"
          value={activeSessionCount}
          icon={Server}
          description="Current users"
        />
        <StatCard
          title="Storage Used"
          value={storageUsedPercent > 0 ? (
            <span className={semanticPercentColor(100 - storageUsedPercent)}>{storageUsedPercent.toFixed(1)}%</span>
          ) : "\u2014"}
          icon={HardDrive}
          description="Of allocated space"
        />
      </div>

      {/* Main content: 2 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* User Management */}
        <Section
          title="User Management"
          description="Manage user accounts and permissions"
          icon={<UserCog className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {userGroups.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {userGroups.map((userGroup) => (
                  <div
                    key={userGroup.role}
                    className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3 cursor-pointer"
                    onClick={() => push({
                      id: userGroup.role,
                      type: 'user',
                      label: `${formatEnum(userGroup.role)} Users`,
                      data: { role: userGroup.role, count: userGroup.count, permissions: userGroup.permissions },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: userGroup.role,
                          type: 'user',
                          label: `${formatEnum(userGroup.role)} Users`,
                          data: { role: userGroup.role, count: userGroup.count, permissions: userGroup.permissions },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for ${formatEnum(userGroup.role)} users`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-foreground">{formatEnum(userGroup.role)}</p>
                        <p className="text-sm text-muted-foreground">
                          {userGroup.count} users
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleManageUsers(userGroup.role); }}>Manage</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* System Status */}
        <Section
          title="System Status"
          description="Infrastructure health metrics"
          icon={<Server className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {systemStatusItems.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {systemStatusItems.map((service) => (
                  <div key={service.service} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div>
                      <p className="font-medium text-foreground">{formatEnum(service.service)}</p>
                      <p className="text-sm text-muted-foreground">Details: {service.uptime}</p>
                    </div>
                    <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'warning' ? 'secondary' : 'destructive'}>
                      {formatEnum(service.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Audit Log spanning full width below */}
        <div className="col-span-2">
          <Section
            title="Recent Activity"
            description="System audit log"
            icon={<Activity className="h-5 w-5" />}
          >
            <div className="max-h-[200px] overflow-y-auto">
              {auditRows.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#242424]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-medium text-xs">Action</th>
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-medium text-xs">Resource</th>
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-medium text-xs">User</th>
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-medium text-xs">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.slice(0, 10).map((log: any) => (
                      <tr
                        key={log.id}
                        className="border-b border-white/[0.04] cursor-pointer"
                        onClick={() => push({
                          id: log.id,
                          type: 'audit-log',
                          label: `${log.action} - ${log.resource}`,
                          data: { auditLogId: log.id, action: log.action, resource: log.resource, userName: log.userName, timestamp: log.timestamp },
                        })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            push({
                              id: log.id,
                              type: 'audit-log',
                              label: `${log.action} - ${log.resource}`,
                              data: { auditLogId: log.id, action: log.action, resource: log.resource, userName: log.userName, timestamp: log.timestamp },
                            })
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for audit log: ${log.action} on ${log.resource}`}
                      >
                        <td className="py-1.5 px-2 text-foreground">{formatEnum(log.action)}</td>
                        <td className="py-1.5 px-2 text-foreground">{formatEnum(log.resource)}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{log.userName || '\u2014'}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{formatDateTime(log.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
})

/**
 * Configuration Tab - Application settings and preferences
 */
const ConfigurationTabContent = memo(function ConfigurationTabContent() {
  const navigate = useNavigate()
  const { tenantName, settings } = useTenant()

  const featureFlags = useMemo(() => {
    const features = settings?.features || {}
    return Object.entries(features).map(([feature, enabled]) => ({
      feature,
      enabled: Boolean(enabled),
      description: `Tenant feature flag: ${formatEnum(feature)}`
    }))
  }, [settings])

  const configCategories = useMemo(() => {
    return [
      { category: 'Branding', settings: settings?.branding ? 3 : 0, icon: Palette },
      { category: 'Regional', settings: settings ? 2 : 0, icon: Languages },
      { category: 'Features', settings: featureFlags.length, icon: ToggleLeft },
      { category: 'Tenant', settings: tenantName ? 1 : 0, icon: Settings },
    ]
  }, [featureFlags.length, settings, tenantName])

  const handleConfigureSettings = (category: string) => {
    toast.success(`Opening settings for: ${category}`)
    logger.info('Configure settings clicked:', category)
    navigate('/settings', {
      state: { category }
    })
  }

  const handleToggleFeature = (feature: string) => {
    toast('Contact system administrator to update feature flags via the API.', {
      duration: 5000,
    })
    logger.info('Toggle feature clicked (backend required):', feature)
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Main content: 2 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* System Settings */}
        <Section
          title="System Settings"
          description="Configure application behavior and preferences"
          icon={<Sliders className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {configCategories.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {configCategories.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.category} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold text-foreground">{item.category}</p>
                          <p className="text-sm text-muted-foreground">{item.settings} settings available</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleConfigureSettings(item.category)}>Configure</Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>

        {/* Feature Flags */}
        <Section
          title="Feature Flags"
          description="Enable or disable system features"
          icon={<ToggleLeft className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {featureFlags.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {featureFlags.map((flag) => (
                  <div key={flag.feature} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{formatEnum(flag.feature)}</p>
                        <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                          {flag.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{flag.description}</p>
                    </div>
                    <Button variant="outline" size="sm" className="ml-2 shrink-0" onClick={() => handleToggleFeature(flag.feature)}>Toggle</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Data Governance Tab - Data management and compliance
 */
const DataGovernanceTabContent = memo(function DataGovernanceTabContent() {
  const { data: databaseHealth, error: databaseHealthError } = useSWR<any>(
    '/api/database/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: storageStats, error: dgStorageError } = useSWR<any>(
    '/api/storage/stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: auditLogs, error: dgAuditError } = useSWR<any[]>(
    '/api/audit-logs?limit=10',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: complianceDashboard, error: complianceDashboardError } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )

  const dataGovernanceError = databaseHealthError || dgStorageError || dgAuditError || complianceDashboardError

  const dataQuality = useMemo(() => {
    const status = databaseHealth?.status
    if (status === 'healthy') return 96
    if (status === 'degraded') return 85
    if (status === 'unhealthy') return 60
    return 0
  }, [databaseHealth])

  const complianceScore = Array.isArray(complianceDashboard?.metrics)
    ? Math.round(complianceDashboard.metrics.reduce((sum: number, metric: any) => sum + Number(metric.score || 0), 0) / complianceDashboard.metrics.length)
    : 0

  const databaseStats = databaseHealth?.database?.statistics || {}
  const auditRows = Array.isArray(auditLogs) ? auditLogs : []

  const handleRunBackup = (backupType: string) => {
    toast('Contact system administrator to trigger a manual backup via the API.', {
      duration: 5000,
    })
    logger.info('Run backup clicked (backend required):', backupType)
  }

  if (dataGovernanceError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load data governance information. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Data Governance Statistics */}
      <div className="grid gap-2 grid-cols-4">
        <StatCard
          title="Data Quality"
          value={dataQuality > 0 ? (
            <span className={semanticPercentColor(dataQuality)}>{dataQuality}%</span>
          ) : "\u2014"}
          icon={Database}
          description="Validated records"
        />
        <StatCard
          title="Storage Used"
          value={storageStats?.totalSize ? `${(storageStats.totalSize / 1_000_000_000_000).toFixed(2)} TB` : "\u2014"}
          icon={HardDrive}
          description={storageStats?.quotaUsedPercent ? `${storageStats.quotaUsedPercent.toFixed(1)}% of quota` : "Of allocated capacity"}
        />
        <StatCard
          title="Backup Status"
          value={auditRows.length > 0 ? "Available" : "\u2014"}
          icon={Archive}
          description={auditRows[0]?.timestamp ? `Last activity: ${formatDateTime(auditRows[0].timestamp)}` : "No backup data"}
        />
        <StatCard
          title="Compliance Score"
          value={complianceScore > 0 ? (
            <span className={semanticPercentColor(complianceScore)}>{complianceScore}%</span>
          ) : "\u2014"}
          icon={Shield}
          description="Compliance dashboard average"
        />
      </div>

      {/* Main content: 2 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* Data Sources */}
        <Section
          title="Data Sources & Quality"
          description="Monitoring data quality across all sources"
          icon={<Database className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {databaseStats ? (
              <div className="space-y-2">
                {[
                  { source: 'Vehicles', records: databaseStats.vehicles, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Drivers', records: databaseStats.drivers, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Maintenance Records', records: databaseStats.maintenanceRecords, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Database Size', records: databaseStats.databaseSize, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                ].map((source) => (
                  <div key={source.source} className="rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground text-sm">{source.source}</p>
                      <span className={`text-xs font-medium ${semanticPercentColor(source.quality)}`}>
                        {source.quality}%
                      </span>
                    </div>
                    {/* Horizontal progress bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] mb-1.5">
                      <div
                        className={`h-full rounded-full ${semanticPercentBg(source.quality)}`}
                        style={{ width: `${source.quality}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.records ?? '\u2014'} records · Updated: {formatDateTime(source.lastUpdated)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            )}
          </div>
        </Section>

        {/* Backup & Recovery */}
        <Section
          title="Backup & Recovery"
          description="Automated backup schedule and recovery points"
          icon={<Archive className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {auditRows.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {auditRows.slice(0, 5).map((backup: any) => (
                  <div key={backup.id} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{formatEnum(backup.action)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatEnum(backup.resource)} · {formatDateTime(backup.timestamp)}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleRunBackup(backup.action)}>Run Now</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Integrations Tab - Third-party integrations and APIs
 */
const IntegrationsTabContent = memo(function IntegrationsTabContent() {
  const navigate = useNavigate()
  const { data: integrationsHealth, error: integrationsHealthError } = useSWR<any>(
    '/api/integrations/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: metricsHistory, error: metricsHistoryError } = useSWR<any[]>(
    '/api/system/metrics/history?hours=168',
    fetcher,
    { shouldRetryOnError: false }
  )

  const integrationsError = integrationsHealthError || metricsHistoryError

  const integrations = Array.isArray(integrationsHealth?.integrations) ? integrationsHealth.integrations : []
  const healthyIntegrations = integrations.filter((integration: any) => integration.status === 'healthy')
  const integrationHealthPercent = integrations.length > 0
    ? Math.round((healthyIntegrations.length / integrations.length) * 100)
    : 0

  const apiUsageData = useMemo(() => {
    const rows = Array.isArray(metricsHistory) ? metricsHistory : []
    return rows.slice(-7).map((row: any) => ({
      name: formatDate(row.time),
      day: formatDate(row.time),
      calls: Number(row.requests || 0)
    }))
  }, [metricsHistory])

  const apiCallsToday = useMemo(() => {
    const rows = Array.isArray(metricsHistory) ? metricsHistory : []
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const total = rows
      .filter((row: any) => new Date(row.time).getTime() >= cutoff)
      .reduce((sum: number, row: any) => sum + Number(row.requests || 0), 0)
    return total > 0 ? Math.round(total) : 0
  }, [metricsHistory])

  const handleConfigureIntegration = (integrationName: string) => {
    toast.success(`Opening configuration for: ${integrationName}`)
    logger.info('Configure integration clicked:', integrationName)
    navigate('/settings', {
      state: { category: 'integrations', integration: integrationName }
    })
  }

  if (integrationsError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load integrations data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Integration Statistics */}
      <div className="grid gap-2 grid-cols-4">
        <StatCard
          title="Active Integrations"
          value={integrations.length}
          icon={Plug}
          description="Connected services"
        />
        <StatCard
          title="API Calls Today"
          value={apiCallsToday > 0 ? formatNumber(apiCallsToday) : "\u2014"}
          icon={CloudCog}
          description="Across all endpoints"
        />
        <StatCard
          title="Webhook Events"
          value="\u2014"
          icon={Webhook}
          description="Last 24 hours"
        />
        <StatCard
          title="Integration Health"
          value={integrationHealthPercent > 0 ? (
            <span className={semanticPercentColor(integrationHealthPercent)}>{integrationHealthPercent}%</span>
          ) : "\u2014"}
          icon={Activity}
          description="All systems operational"
        />
      </div>

      {/* Main content: 2 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* Connected Integrations */}
        <Section
          title="Connected Integrations"
          description="Third-party services and APIs"
          icon={<Plug className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {integrations.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {integrations.map((integration: any) => (
                  <div key={integration.name} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div className="flex items-center gap-3">
                      <Plug className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{integration.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {integration.capabilities?.join(', ') || 'Integration'} · {integration.responseTime ? `${integration.responseTime}ms` : '\u2014'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.status === 'healthy' ? 'default' : integration.status === 'degraded' ? 'secondary' : 'destructive'}>
                        {formatEnum(integration.status)}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => handleConfigureIntegration(integration.name)}>Configure</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* API Usage */}
        <Section
          title="API Usage Trends"
          description="API call volume over time"
          icon={<Code className="h-5 w-5" />}
        >
          <ResponsiveLineChart
            title="API Usage Trends"
            data={apiUsageData}
            dataKeys={['calls']}
            colors={['hsl(var(--chart-1))']}
            height={140}
          />
        </Section>
      </div>
    </div>
  )
})

/**
 * Documents Tab - Document management and templates
 */
const DocumentsTabContent = memo(function DocumentsTabContent() {
  const navigate = useNavigate()
  const { data: documents, error: documentsError } = useSWR<any[]>(
    '/api/documents?limit=100',
    fetcher,
    { shouldRetryOnError: false }
  )

  const documentRows = Array.isArray(documents) ? documents : []
  const recentUploads = documentRows.filter((doc: any) => {
    const uploadedAt = doc.uploaded_at || doc.created_at
    if (!uploadedAt) return false
    return new Date(uploadedAt).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  })
  const templateDocs = documentRows.filter((doc: any) => {
    const type = (doc.document_type || doc.type || '').toString().toLowerCase()
    return type.includes('template')
  })
  const totalSize = documentRows.reduce((sum: number, doc: any) => sum + Number(doc.file_size || 0), 0)
  const documentCategories = useMemo(() => {
    const categories = new Map<string, number>()
    documentRows.forEach((doc: any) => {
      const category = doc.category || 'Uncategorized'
      categories.set(category, (categories.get(category) || 0) + 1)
    })
    return Array.from(categories.entries()).map(([category, count]) => ({ category, count }))
  }, [documentRows])
  const recentDocuments = useMemo(() => {
    return documentRows
      .slice()
      .sort((a: any, b: any) => new Date(b.uploaded_at || b.created_at).getTime() - new Date(a.uploaded_at || a.created_at).getTime())
      .slice(0, 5)
  }, [documentRows])

  const handleBrowseDocuments = (category: string) => {
    toast.success(`Opening document library: ${formatEnum(category)}`)
    logger.info('Browse documents clicked:', category)
    navigate('/documents', {
      state: { category }
    })
  }

  const handleDownloadDocument = (documentName: string, url?: string) => {
    if (!url) {
      toast.error('No download link available for this document')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(`Downloading document: ${documentName}`)
    logger.info('Download document clicked:', documentName)
  }

  if (documentsError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load documents data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
      {/* Document Statistics */}
      <div className="grid gap-2 grid-cols-4">
        <StatCard
          title="Total Documents"
          value={documentRows.length}
          icon={FileText}
          description="In repository"
        />
        <StatCard
          title="Templates"
          value={templateDocs.length}
          icon={FileCheck}
          description="Ready to use"
        />
        <StatCard
          title="Shared This Week"
          value={recentUploads.length}
          icon={Upload}
          description="Uploaded documents"
        />
        <StatCard
          title="Storage Used"
          value={totalSize > 0 ? `${(totalSize / 1_000_000_000).toFixed(2)} GB` : "\u2014"}
          icon={HardDrive}
          description="Document storage"
        />
      </div>

      {/* Main content: 2 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">
        {/* Document Categories */}
        <Section
          title="Document Library"
          description="Organized by category"
          icon={<FolderOpen className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {documentCategories.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {documentCategories.map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">{formatEnum(cat.category)}</p>
                        <p className="text-xs text-muted-foreground">{cat.count} documents</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleBrowseDocuments(cat.category)}>Browse</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Recent Documents */}
        <Section
          title="Recently Added"
          description="Latest uploaded documents"
          icon={<Clock className="h-5 w-5" />}
        >
          <div className="max-h-[250px] overflow-y-auto">
            {recentDocuments.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-2">
                {recentDocuments.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-[#242424] p-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{doc.file_name || doc.name || doc.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.uploaded_by_name || 'System'} ·{' '}
                          {formatDate(doc.uploaded_at)} ·{' '}
                          {doc.file_size ? `${(doc.file_size / 1_000_000).toFixed(2)} MB` : '\u2014'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2 shrink-0"
                      onClick={() => handleDownloadDocument(doc.file_name || doc.name || 'Document', doc.file_url)}
                      disabled={!doc.file_url}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminConfigurationHub() {
  const [activeTab, setActiveTab] = useState('admin')

  return (
    <HubPage
      title="Administration & Configuration"
      description="System administration, configuration, data governance, integrations, and document management"
      icon={<Settings className="h-5 w-5" />}
      className="cta-hub"
    >
      <div className="flex flex-col h-full gap-2 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="admin" className="flex items-center gap-2" data-testid="hub-tab-admin" aria-label="Admin">
              <UserCog className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2" data-testid="hub-tab-config" aria-label="Configuration">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Configuration</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2" data-testid="hub-tab-data" aria-label="Data">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2" data-testid="hub-tab-integrations" aria-label="Integrations">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2" data-testid="hub-tab-documents" aria-label="Documents">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
            </TabsTrigger>
          </TabsList>

              <TabsContent value="admin" className="flex-1 min-h-0 overflow-auto">
                <QueryErrorBoundary>
                  <AdminTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="config" className="flex-1 min-h-0 overflow-auto">
                <QueryErrorBoundary>
                  <ConfigurationTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="data" className="flex-1 min-h-0 overflow-auto">
                <QueryErrorBoundary>
                  <DataGovernanceTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="integrations" className="flex-1 min-h-0 overflow-auto">
                <QueryErrorBoundary>
                  <IntegrationsTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="documents" className="flex-1 min-h-0 overflow-auto">
                <QueryErrorBoundary>
                  <DocumentsTabContent />
                </QueryErrorBoundary>
              </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
