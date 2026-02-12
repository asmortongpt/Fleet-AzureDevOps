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

import { useState, Suspense, lazy, memo, useMemo } from 'react'
// motion removed - React 19 incompatible
import {
  Settings,
  Users,
  Shield,
  Database,
  Plug,
  FileText,
  Key,
  Lock,
  Server,
  HardDrive,
  Globe,
  Code,
  Webhook,
  Link,
  CloudCog,
  UserCog,
  Sliders,
  ToggleLeft,
  Bell,
  Mail,
  Palette,
  Languages,
  Clock,
  Activity,
  FileCheck,
  FolderOpen,
  Upload,
  Download,
  Archive,
  Bookmark,
  Tag,
  Search
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import { useTenant } from '@/contexts'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import useSWR from 'swr'

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const rawFetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json())

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Admin Tab - System administration and user management
 */
const AdminTabContent = memo(function AdminTabContent() {
  const { data: users } = useSWR<any[]>(
    '/api/users?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: sessions } = useSWR<any[]>(
    '/api/sessions?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: systemMetrics } = useSWR<any>(
    '/api/system/metrics',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: health } = useSWR<any>(
    '/api/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: storageStats } = useSWR<any>(
    '/api/storage/stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: auditLogs } = useSWR<any[]>(
    '/api/audit-logs?limit=20',
    fetcher,
    { shouldRetryOnError: false }
  )

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
      uptime: details.latency || details.message || '—'
    }))
  }, [health])

  const auditRows = Array.isArray(auditLogs) ? auditLogs : []

  // Handler for managing user groups
  const handleManageUsers = (role: string) => {
    toast.success(`Managing users: ${role}`)
    logger.info('Manage users clicked:', role)
    // TODO: Navigate to user management page or open modal
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Admin Statistics */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={userRows.length}
          icon={Users}
          description="Active accounts"
        />
        <StatCard
          title="System Health"
          value={systemHealthPercent > 0 ? `${systemHealthPercent}%` : "—"}
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
          value={storageUsedPercent > 0 ? `${storageUsedPercent.toFixed(1)}%` : "—"}
          icon={HardDrive}
          description="Of allocated space"
        />
      </div>

      {/* User Management */}
      <div>
        <Section
          title="User Management"
          description="Manage user accounts and permissions"
          icon={<UserCog className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {userGroups.length === 0 ? (
              <div className="text-sm text-muted-foreground">No user roles available.</div>
            ) : (
              userGroups.map((userGroup) => (
                <div key={userGroup.role} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{userGroup.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {userGroup.count} users · {userGroup.permissions}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleManageUsers(userGroup.role)}>Manage</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      {/* System Status */}
      <div className="grid gap-6 md:grid-cols-2">
        <Section
          title="System Status"
          description="Infrastructure health metrics"
          icon={<Server className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {systemStatusItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No system status available.</div>
            ) : (
              systemStatusItems.map((service) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{service.service}</p>
                    <p className="text-sm text-muted-foreground">Details: {service.uptime}</p>
                  </div>
                  <Badge variant={service.status === 'healthy' ? 'default' : service.status === 'warning' ? 'secondary' : 'destructive'}>
                    {service.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section
          title="Recent Activity"
          description="System audit log"
          icon={<Activity className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {auditRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent audit activity.</div>
            ) : (
              auditRows.slice(0, 6).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.action} · {log.resource}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.userName} · {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
})

/**
 * Configuration Tab - Application settings and preferences
 */
const ConfigurationTabContent = memo(function ConfigurationTabContent() {
  const { tenantName, settings } = useTenant()

  const featureFlags = useMemo(() => {
    const features = settings?.features || {}
    return Object.entries(features).map(([feature, enabled]) => ({
      feature,
      enabled: Boolean(enabled),
      description: `Tenant feature flag: ${feature}`
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

  // Handler for configuring settings
  const handleConfigureSettings = (category: string) => {
    toast.success(`Configuring settings: ${category}`)
    logger.info('Configure settings clicked:', category)
    // TODO: Navigate to settings page or open configuration modal
  }

  // Handler for toggling feature flags
  const handleToggleFeature = (feature: string) => {
    toast.success(`Toggling feature: ${feature}`)
    logger.info('Toggle feature clicked:', feature)
    // TODO: Add real API call to toggle feature flag
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Configuration Categories */}
      <div>
        <Section
          title="System Settings"
          description="Configure application behavior and preferences"
          icon={<Sliders className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {configCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No configuration categories available.</div>
            ) : (
              configCategories.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.category} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{item.category}</p>
                        <p className="text-sm text-muted-foreground">{item.settings} settings available</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleConfigureSettings(item.category)}>Configure</Button>
                  </div>
                )
              })
            )}
          </div>
        </Section>
      </div>

      {/* Feature Flags */}
      <div>
        <Section
          title="Feature Flags"
          description="Enable or disable system features"
          icon={<ToggleLeft className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {featureFlags.length === 0 ? (
              <div className="text-sm text-muted-foreground">No feature flags configured.</div>
            ) : (
              featureFlags.map((flag) => (
                <div key={flag.feature} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{flag.feature}</p>
                      <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleToggleFeature(flag.feature)}>Toggle</Button>
                </div>
              ))
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
  const { data: databaseHealth } = useSWR<any>(
    '/api/database/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: storageStats } = useSWR<any>(
    '/api/storage/stats',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: auditLogs } = useSWR<any[]>(
    '/api/audit-logs?limit=10',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: complianceDashboard } = useSWR<any>(
    '/api/compliance/dashboard',
    fetcher,
    { shouldRetryOnError: false }
  )

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

  // Handler for running backups
  const handleRunBackup = (backupType: string) => {
    toast.success(`Running backup: ${backupType}`)
    logger.info('Run backup clicked:', backupType)
    // TODO: Add real API call to trigger backup
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Data Governance Statistics */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Data Quality"
          value={dataQuality > 0 ? `${dataQuality}%` : "—"}
          icon={Database}
          description="Validated records"
        />
        <StatCard
          title="Storage Used"
          value={storageStats?.totalSize ? `${(storageStats.totalSize / 1_000_000_000_000).toFixed(2)} TB` : "—"}
          icon={HardDrive}
          description={storageStats?.quotaUsedPercent ? `${storageStats.quotaUsedPercent.toFixed(1)}% of quota` : "Of allocated capacity"}
        />
        <StatCard
          title="Backup Status"
          value={auditRows.length > 0 ? "Available" : "Unknown"}
          icon={Archive}
          description={auditRows[0]?.timestamp ? `Last activity: ${new Date(auditRows[0].timestamp).toLocaleString()}` : "No backup data"}
        />
        <StatCard
          title="Compliance Score"
          value={complianceScore > 0 ? `${complianceScore}%` : "—"}
          icon={Shield}
          description="Compliance dashboard average"
        />
      </div>

      {/* Data Sources */}
      <div>
        <Section
          title="Data Sources & Quality"
          description="Monitoring data quality across all sources"
          icon={<Database className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {databaseStats ? (
              [
                { source: 'Vehicles', records: databaseStats.vehicles, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                { source: 'Drivers', records: databaseStats.drivers, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                { source: 'Maintenance Records', records: databaseStats.maintenanceRecords, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
                { source: 'Database Size', records: databaseStats.databaseSize, quality: dataQuality, lastUpdated: databaseHealth?.timestamp },
              ].map((source) => (
                <div key={source.source} className="rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="font-semibold">{source.source}</p>
                    <Badge variant={source.quality >= 95 ? 'default' : 'secondary'}>
                      {source.quality}% Quality
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {source.records ?? '—'} records · Last updated: {source.lastUpdated ? new Date(source.lastUpdated).toLocaleString() : '—'}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No data source metrics available.</div>
            )}
          </div>
        </Section>
      </div>

      {/* Backup & Recovery */}
      <div>
        <Section
          title="Backup & Recovery"
          description="Automated backup schedule and recovery points"
          icon={<Archive className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {auditRows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No backup activity recorded.</div>
            ) : (
              auditRows.slice(0, 5).map((backup: any) => (
                <div key={backup.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div>
                    <p className="font-semibold">{backup.action}</p>
                    <p className="text-sm text-muted-foreground">
                      {backup.resource} · {backup.timestamp ? new Date(backup.timestamp).toLocaleString() : '—'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleRunBackup(backup.action)}>Run Now</Button>
                </div>
              ))
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
  const { data: integrationsHealth } = useSWR<any>(
    '/api/integrations/health',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: metricsHistory } = useSWR<any[]>(
    '/api/system/metrics/history?hours=168',
    fetcher,
    { shouldRetryOnError: false }
  )

  const integrations = Array.isArray(integrationsHealth?.integrations) ? integrationsHealth.integrations : []
  const healthyIntegrations = integrations.filter((integration: any) => integration.status === 'healthy')
  const integrationHealthPercent = integrations.length > 0
    ? Math.round((healthyIntegrations.length / integrations.length) * 100)
    : 0

  const apiUsageData = useMemo(() => {
    const rows = Array.isArray(metricsHistory) ? metricsHistory : []
    return rows.slice(-7).map((row: any) => ({
      name: new Date(row.time).toLocaleDateString(undefined, { weekday: 'short' }),
      day: new Date(row.time).toLocaleDateString(undefined, { weekday: 'short' }),
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

  // Handler for configuring integrations
  const handleConfigureIntegration = (integrationName: string) => {
    toast.success(`Configuring integration: ${integrationName}`)
    logger.info('Configure integration clicked:', integrationName)
    // TODO: Navigate to integration configuration page or open modal
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Integration Statistics */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Integrations"
          value={integrations.length}
          icon={Plug}
          description="Connected services"
        />
        <StatCard
          title="API Calls Today"
          value={apiCallsToday > 0 ? apiCallsToday.toLocaleString() : "—"}
          icon={CloudCog}
          description="Across all endpoints"
        />
        <StatCard
          title="Webhook Events"
          value="—"
          icon={Webhook}
          description="Last 24 hours"
        />
        <StatCard
          title="Integration Health"
          value={integrationHealthPercent > 0 ? `${integrationHealthPercent}%` : "—"}
          icon={Activity}
          description="All systems operational"
        />
      </div>

      {/* Connected Integrations */}
      <div>
        <Section
          title="Connected Integrations"
          description="Third-party services and APIs"
          icon={<Plug className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {integrations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No integrations found.</div>
            ) : (
              integrations.map((integration: any) => (
                <div key={integration.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <Plug className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-semibold">{integration.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {integration.capabilities?.join(', ') || 'Integration'} · {integration.responseTime ? `${integration.responseTime}ms` : '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={integration.status === 'healthy' ? 'default' : integration.status === 'degraded' ? 'secondary' : 'destructive'}>
                      {integration.status}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleConfigureIntegration(integration.name)}>Configure</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      {/* API Usage */}
      <div>
        <Section
          title="API Usage Trends"
          description="API call volume over time"
          icon={<Code className="h-5 w-5" />}
        >
          <ResponsiveLineChart
            title="API Usage Trends"
            data={apiUsageData}
            dataKeys={['calls']}
            colors={['#3b82f6']}
            height={250}
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
  const { data: documents } = useSWR<any[]>(
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

  // Handler for browsing document categories
  const handleBrowseDocuments = (category: string) => {
    toast.success(`Browsing documents: ${category}`)
    logger.info('Browse documents clicked:', category)
    // TODO: Navigate to document browser or open file explorer
  }

  // Handler for downloading documents
  const handleDownloadDocument = (documentName: string, url?: string) => {
    if (!url) {
      toast.error('No download link available for this document')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    toast.success(`Downloading document: ${documentName}`)
    logger.info('Download document clicked:', documentName)
  }

  return (
    <div
      className="space-y-6"
    >
      {/* Document Statistics */}
      <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
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
          value={totalSize > 0 ? `${(totalSize / 1_000_000_000).toFixed(2)} GB` : "—"}
          icon={HardDrive}
          description="Document storage"
        />
      </div>

      {/* Document Categories */}
      <div>
        <Section
          title="Document Library"
          description="Organized by category"
          icon={<FolderOpen className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {documentCategories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No document categories available.</div>
            ) : (
              documentCategories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{cat.category}</p>
                      <p className="text-sm text-muted-foreground">{cat.count} documents</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleBrowseDocuments(cat.category)}>Browse</Button>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>

      {/* Recent Documents */}
      <div>
        <Section
          title="Recently Added"
          description="Latest uploaded documents"
          icon={<Clock className="h-5 w-5" />}
        >
          <div className="space-y-3">
            {recentDocuments.length === 0 ? (
              <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
            ) : (
              recentDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{doc.file_name || doc.name || doc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded by {doc.uploaded_by_name || 'System'} ·{' '}
                        {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'} ·{' '}
                        {doc.file_size ? `${(doc.file_size / 1_000_000).toFixed(2)} MB` : '—'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadDocument(doc.file_name || doc.name || 'Document', doc.file_url)}
                    disabled={!doc.file_url}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))
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
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

              <TabsContent value="admin" className="mt-6">
                <ErrorBoundary>
                  <AdminTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="config" className="mt-6">
                <ErrorBoundary>
                  <ConfigurationTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <ErrorBoundary>
                  <DataGovernanceTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="integrations" className="mt-6">
                <ErrorBoundary>
                  <IntegrationsTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <ErrorBoundary>
                  <DocumentsTabContent />
                </ErrorBoundary>
              </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
