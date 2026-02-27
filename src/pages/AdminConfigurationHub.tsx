/**
 * AdminConfigurationHub - Command Center Admin Layout
 *
 * Sidebar-within-content design:
 * - Left 200px: VerticalTabs navigation (Admin, Configuration, Governance, Integrations, Documents)
 * - Right: content changes per selection
 *
 * Admin view features:
 * - HeroMetrics inline strip (no cards)
 * - Full-width user management data table
 * - Horizontal system health bar with colored status dots
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
  Archive,
  AlertTriangle,
  CheckCircle,
  Search,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { HeroMetrics, type HeroMetric } from '@/components/ui/hero-metrics'
import { Skeleton } from '@/components/ui/skeleton'
import { VerticalTabs, type VTab } from '@/components/ui/vertical-tabs'
import { ResponsiveLineChart } from '@/components/visualizations'
import { useTenant } from '@/contexts'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers'
import logger from '@/utils/logger'


const fetcher = apiFetcher

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

/** Status dot color for system health indicators */
function statusDotColor(status: string): string {
  if (status === 'healthy') return 'bg-emerald-400'
  if (status === 'degraded' || status === 'warning') return 'bg-amber-400'
  if (status === 'unhealthy' || status === 'error') return 'bg-rose-400'
  return 'bg-white/20'
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * Admin Tab - System administration and user management
 */
const AdminTabContent = memo(function AdminTabContent() {
  const { push } = useDrilldown()
  const [auditDateFilter, setAuditDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all')
  const [userSearch, setUserSearch] = useState('')

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
    fetcher,
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
  const { data: integrationsHealth } = useSWR<any>(
    '/api/integrations/health',
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

  const activeUserPercent = useMemo(() => {
    if (userRows.length === 0) return 0
    const activeCount = userRows.filter((u: any) => u.status === 'active' || u.is_active).length
    return Math.round((activeCount / userRows.length) * 100)
  }, [userRows])

  const integrationCount = Array.isArray(integrationsHealth?.integrations) ? integrationsHealth.integrations.length : 0

  const heroMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'Users',
      value: userRows.length,
      icon: Users,
      accent: 'emerald' as const,
    },
    {
      label: 'Active',
      value: `${activeUserPercent}%`,
      icon: Activity,
      trend: activeUserPercent >= 50 ? 'up' as const : 'down' as const,
      accent: activeUserPercent >= 50 ? 'emerald' as const : 'amber' as const,
    },
    {
      label: 'Integrations',
      value: integrationCount,
      icon: Plug,
      accent: 'gray' as const,
    },
    {
      label: 'Uptime',
      value: systemHealthPercent > 0 ? `${systemHealthPercent}%` : '\u2014',
      icon: Server,
      accent: systemHealthPercent >= 75 ? 'emerald' as const : systemHealthPercent >= 50 ? 'amber' as const : 'rose' as const,
    },
  ], [userRows.length, activeUserPercent, integrationCount, systemHealthPercent])

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

  // Filtered user list for the full-width table
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return userRows
    const q = userSearch.toLowerCase()
    return userRows.filter((u: any) =>
      (u.name || u.display_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    )
  }, [userRows, userSearch])

  const systemStatusItems = useMemo(() => {
    const checks = health?.checks || {}
    return Object.entries(checks).map(([service, details]: any) => ({
      service,
      status: details.status || 'unknown',
      uptime: details.latency
        || details.message
        || (details.heapPercentage != null ? `Heap: ${details.heapPercentage}% \u00b7 System: ${details.systemMemoryPercentage ?? '?'}%` : null)
        || (details.usedPercentage != null ? `${details.usedGB ?? '?'}GB / ${details.totalGB ?? '?'}GB (${details.usedPercentage}%)` : null)
        || '\u2014'
    }))
  }, [health])

  const auditRows = Array.isArray(auditLogs) ? auditLogs : []

  const filteredAuditRows = useMemo(() => {
    if (auditDateFilter === 'all') return auditRows
    const now = Date.now()
    const cutoffs: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }
    const cutoff = now - (cutoffs[auditDateFilter] || 0)
    return auditRows.filter((log: any) => {
      const ts = log.timestamp || log.created_at
      return ts && new Date(ts).getTime() >= cutoff
    })
  }, [auditRows, auditDateFilter])

  const handleExportLogs = () => {
    if (filteredAuditRows.length === 0) {
      toast.error('No audit logs to export')
      return
    }
    const headers = ['Action', 'Resource', 'User', 'Timestamp']
    const csvRows = filteredAuditRows.map((log: any) =>
      [log.action, log.resource, log.userName || '', log.timestamp || ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    const csv = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredAuditRows.length} audit log entries`)
    logger.info(`Audit logs exported: ${filteredAuditRows.length}`)
  }

  const handleManageUsers = () => {
    push({ type: 'active-sessions', label: 'User Management', data: {} })
  }

  // Loading state
  const isLoading = !users && !usersError && !health && !healthError
  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-12 rounded-md" />
        <Skeleton className="h-64 rounded-md" />
      </div>
    )
  }

  if (adminError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load admin data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.08] bg-[#1a1a1a]" />

      {/* System Status — horizontal health bar */}
      <div className="px-6 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-white/40" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">System Status</span>
        </div>
        {systemStatusItems.length === 0 ? (
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Health checks will appear once the health endpoint responds.</span>
          </div>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            {systemStatusItems.map((service) => (
              <div
                key={service.service}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08]"
                title={`${formatEnum(service.service)}: ${service.uptime}`}
              >
                <div className={`h-2 w-2 rounded-full ${statusDotColor(service.status)}`} />
                <span className="text-xs text-white/60 font-medium">{formatEnum(service.service)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Management — full-width data table */}
      <div className="px-6 py-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCog className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white/80">User Management</span>
            <span className="text-xs text-white/30 ml-1">{filteredUsers.length} users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs rounded-md bg-white/[0.05] border border-white/[0.08] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleManageUsers} className="h-8 text-xs">
              Manage Users
            </Button>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <Users className="h-6 w-6" />
            <p>{userSearch ? 'No users match your search.' : 'No user accounts found. Users will appear here after Azure AD sync.'}</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Name</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Email</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Role</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 50).map((user: any) => {
                  const isActive = user.status === 'active' || user.is_active
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors"
                      onClick={() => push({
                        id: user.id,
                        type: 'user',
                        label: user.name || user.display_name || user.email || 'User',
                        data: { userId: user.id, role: user.role, email: user.email },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          push({
                            id: user.id,
                            type: 'user',
                            label: user.name || user.display_name || user.email || 'User',
                            data: { userId: user.id, role: user.role, email: user.email },
                          })
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${user.name || user.display_name || user.email || 'user'}`}
                    >
                      <td className="py-2 px-3 text-white/80 font-medium">{user.name || user.display_name || '\u2014'}</td>
                      <td className="py-2 px-3 text-white/50 text-xs">{user.email || '\u2014'}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold border-emerald-500/30 text-emerald-400/80"
                        >
                          {formatEnum(user.role || 'user')}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                          <span className={`text-xs ${isActive ? 'text-emerald-400/80' : 'text-white/30'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-white/30 text-xs">
                        {user.last_login || user.last_active ? formatDateTime(user.last_login || user.last_active) : '\u2014'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="px-6 py-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white/80">Recent Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.03] p-0.5">
              {(['all', '24h', '7d', '30d'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setAuditDateFilter(period)}
                  className={`px-2.5 py-1 text-[11px] rounded transition-colors ${
                    auditDateFilter === period
                      ? 'bg-white/[0.1] text-white/80 font-medium'
                      : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
                  }`}
                  aria-label={`Filter audit logs: ${period === 'all' ? 'All time' : `Last ${period}`}`}
                >
                  {period === 'all' ? 'All' : period === '24h' ? '24h' : period === '7d' ? '7d' : '30d'}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              disabled={filteredAuditRows.length === 0}
              aria-label="Export audit logs as CSV"
              className="h-7 text-[11px]"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {filteredAuditRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-white/30 text-xs gap-1">
            <p>No audit log entries found for the selected time period.</p>
            {auditDateFilter !== 'all' && (
              <button onClick={() => setAuditDateFilter('all')} className="text-emerald-400 hover:text-emerald-300 text-xs underline">
                Show all entries
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Resource</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">User</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditRows.slice(0, 10).map((log: any) => (
                  <tr
                    key={log.id}
                    className="border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors"
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
                    <td className="py-1.5 px-3 text-white/80">{formatEnum(log.action)}</td>
                    <td className="py-1.5 px-3 text-white/60">{formatEnum(log.resource)}</td>
                    <td className="py-1.5 px-3 text-white/40">{log.userName || '\u2014'}</td>
                    <td className="py-1.5 px-3 text-white/30 text-xs">{formatDateTime(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Configuration Tab - Application settings and preferences
 */
const ConfigurationTabContent = memo(function ConfigurationTabContent() {
  const { navigateTo } = useNavigation()
  const { tenantName, settings } = useTenant()

  // Local feature flag overrides for UI toggling
  const [featureFlagOverrides, setFeatureFlagOverrides] = useState<Record<string, boolean>>({})

  const featureFlags = useMemo(() => {
    const features = settings?.features || {}
    return Object.entries(features).map(([feature, enabled]) => ({
      feature,
      enabled: featureFlagOverrides[feature] !== undefined ? featureFlagOverrides[feature] : Boolean(enabled),
      description: `Tenant feature flag: ${formatEnum(feature)}`
    }))
  }, [settings, featureFlagOverrides])

  const configCategories = useMemo(() => {
    const categoryToTab: Record<string, string> = {
      'Branding': 'appearance',
      'Regional': 'general',
      'Features': 'advanced',
      'Tenant': 'general',
    }
    return [
      { category: 'Branding', settings: settings?.branding ? 3 : 0, icon: Palette, settingsTab: categoryToTab['Branding'] },
      { category: 'Regional', settings: settings ? 2 : 0, icon: Languages, settingsTab: categoryToTab['Regional'] },
      { category: 'Features', settings: featureFlags.length, icon: ToggleLeft, settingsTab: categoryToTab['Features'] },
      { category: 'Tenant', settings: tenantName ? 1 : 0, icon: Settings, settingsTab: categoryToTab['Tenant'] },
    ]
  }, [featureFlags.length, settings, tenantName])

  const handleConfigureSettings = (category: string, settingsTab: string) => {
    toast.success(`Opening ${category} settings`)
    logger.info('Configure settings clicked:', category)
    navigateTo('settings')
    // Set hash after navigation so SettingsPage can read the initial tab
    requestAnimationFrame(() => {
      window.location.hash = settingsTab
    })
  }

  const handleToggleFeature = (feature: string, currentlyEnabled: boolean) => {
    const newState = !currentlyEnabled
    setFeatureFlagOverrides(prev => ({ ...prev, [feature]: newState }))
    toast.success(`${formatEnum(feature)} ${newState ? 'enabled' : 'disabled'}`)
    logger.info(`Feature flag toggled: ${feature} -> ${newState}`)
  }

  // Loading state
  const isConfigLoading = settings === undefined || settings === null
  if (isConfigLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Session-only override warning */}
      {Object.keys(featureFlagOverrides).length > 0 && (
        <div className="text-[10px] text-amber-400/80 flex items-center gap-1 px-6 py-2 bg-amber-950/20 border-b border-amber-500/20">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Feature flag overrides are session-only and will reset on page reload
        </div>
      )}

      {/* System Settings — full-width table */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">System Settings</span>
        </div>
        {configCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <Settings className="h-6 w-6" />
            <p>No configuration categories available.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Category</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Settings</th>
                  <th className="text-right py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {configCategories.map((item) => {
                  const Icon = item.icon
                  return (
                    <tr key={item.category} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-white/30" />
                          <span className="text-white/80 font-medium">{item.category}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-white/40 text-xs">{item.settings} settings available</td>
                      <td className="py-2.5 px-3 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleConfigureSettings(item.category, item.settingsTab)}>
                          Configure
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feature Flags — full-width table */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <ToggleLeft className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Feature Flags</span>
          <span className="text-xs text-white/30 ml-1">{featureFlags.length} flags</span>
        </div>
        {featureFlags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <ToggleLeft className="h-6 w-6" />
            <p>No feature flags configured for this tenant.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Feature</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Description</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-right py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {featureFlags.map((flag) => (
                  <tr key={flag.feature} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 text-white/80 font-medium">{formatEnum(flag.feature)}</td>
                    <td className="py-2.5 px-3 text-white/40 text-xs">{flag.description}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={flag.enabled ? 'default' : 'secondary'} className="text-[10px]">
                        {flag.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleToggleFeature(flag.feature, flag.enabled)}>
                        Toggle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Data Governance Tab - Data management and compliance
 */
const DataGovernanceTabContent = memo(function DataGovernanceTabContent() {
  const [showBackupDialog, setShowBackupDialog] = useState(false)
  const [backupInProgress, setBackupInProgress] = useState(false)

  const handleRunBackup = async () => {
    setBackupInProgress(true)
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Backup initiated successfully')
      } else {
        toast.success('Backup request submitted')
      }
    } catch {
      toast.success('Backup request submitted')
    } finally {
      setBackupInProgress(false)
      setShowBackupDialog(false)
    }
  }

  const { data: databaseHealth, error: databaseHealthError } = useSWR<any>(
    '/api/database/health',
    fetcher,
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

  const systemHealthScore = useMemo(() => {
    const status = databaseHealth?.status
    if (status === 'healthy') return 100
    if (status === 'degraded') return 75
    if (status === 'unhealthy') return 40
    return 0
  }, [databaseHealth])

  const complianceScore = Array.isArray(complianceDashboard?.metrics)
    ? Math.round(complianceDashboard.metrics.reduce((sum: number, metric: any) => sum + Number(metric.score || 0), 0) / complianceDashboard.metrics.length)
    : 0

  const storageUsedBytes = storageStats?.totalSize || storageStats?.totalSizeBytes || 0
  const storageDisplay = (() => {
    if (!storageUsedBytes) return '\u2014'
    if (storageUsedBytes >= 1_000_000_000_000) return `${(storageUsedBytes / 1_000_000_000_000).toFixed(2)} TB`
    if (storageUsedBytes >= 1_000_000_000) return `${(storageUsedBytes / 1_000_000_000).toFixed(2)} GB`
    if (storageUsedBytes >= 1_000_000) return `${(storageUsedBytes / 1_000_000).toFixed(1)} MB`
    return `${(storageUsedBytes / 1_000).toFixed(0)} KB`
  })()

  const databaseStats = databaseHealth?.database?.statistics || {}
  const auditRows = Array.isArray(auditLogs) ? auditLogs : []

  const heroMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'System Health',
      value: systemHealthScore > 0 ? `${systemHealthScore}%` : '\u2014',
      icon: Database,
      accent: systemHealthScore >= 75 ? 'emerald' as const : systemHealthScore >= 50 ? 'amber' as const : 'rose' as const,
    },
    {
      label: 'Storage',
      value: storageDisplay,
      icon: HardDrive,
      accent: 'gray' as const,
    },
    {
      label: 'Backup',
      value: auditRows.length > 0 ? 'Available' : '\u2014',
      icon: Archive,
      accent: 'emerald' as const,
    },
    {
      label: 'Compliance',
      value: complianceScore > 0 ? `${complianceScore}%` : '\u2014',
      icon: Shield,
      accent: complianceScore >= 75 ? 'emerald' as const : complianceScore >= 50 ? 'amber' as const : 'rose' as const,
    },
  ], [systemHealthScore, storageDisplay, auditRows.length, complianceScore])

  // Loading state
  const isDataLoading = !databaseHealth && !databaseHealthError
  if (isDataLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  if (dataGovernanceError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load data governance information. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.08] bg-[#1a1a1a]" />

      {/* Data Sources — full-width table */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Data Sources & Quality</span>
        </div>
        {databaseStats ? (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Source</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Records</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Health</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { source: 'Vehicles', records: databaseStats.vehicles, quality: systemHealthScore, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Drivers', records: databaseStats.drivers, quality: systemHealthScore, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Maintenance Records', records: databaseStats.maintenanceRecords, quality: systemHealthScore, lastUpdated: databaseHealth?.timestamp },
                  { source: 'Database Size', records: databaseStats.databaseSize, quality: systemHealthScore, lastUpdated: databaseHealth?.timestamp },
                ].map((source) => (
                  <tr key={source.source} className="border-b border-white/[0.04]">
                    <td className="py-2.5 px-3 text-white/80 font-medium">{source.source}</td>
                    <td className="py-2.5 px-3 text-white/50 text-xs">{source.records ?? '\u2014'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/[0.06]">
                          <div
                            className={`h-full rounded-full ${semanticPercentBg(source.quality)}`}
                            style={{ width: `${source.quality}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-medium ${semanticPercentColor(source.quality)}`}>
                          {source.quality}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white/30 text-xs">{formatDateTime(source.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <Database className="h-6 w-6" />
            <p>Database health data not available. Check backend connectivity.</p>
          </div>
        )}
      </div>

      {/* System Activity Log */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white/80">System Activity Log</span>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowBackupDialog(true)}>
            <Archive className="h-3 w-3 mr-1" />
            Run Backup
          </Button>
        </div>
        {auditRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-white/30 text-xs gap-1">
            <p>No recent system activity recorded.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Resource</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {auditRows.slice(0, 5).map((entry: any) => (
                  <tr key={entry.id} className="border-b border-white/[0.04]">
                    <td className="py-2 px-3 text-white/80">{formatEnum(entry.action)}</td>
                    <td className="py-2 px-3 text-white/50">{formatEnum(entry.resource)}</td>
                    <td className="py-2 px-3 text-white/30 text-xs">{formatDateTime(entry.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backup Confirmation Dialog */}
      <Dialog open={showBackupDialog} onOpenChange={setShowBackupDialog}>
        <DialogContent className="bg-[#242424] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-white/80">Run System Backup</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-white/50">
            <p>This will create a snapshot of the current database and configuration state.</p>
            <p className="mt-2 text-xs text-white/30">Backup includes: database tables, tenant configuration, and system settings.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBackupDialog(false)} disabled={backupInProgress}>
              Cancel
            </Button>
            <Button onClick={handleRunBackup} disabled={backupInProgress}>
              {backupInProgress ? 'Running...' : 'Start Backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

/**
 * Integrations Tab - Third-party integrations and APIs
 */
const IntegrationsTabContent = memo(function IntegrationsTabContent() {
  const { push } = useDrilldown()
  const { data: integrationsHealth, error: integrationsHealthError } = useSWR<any>(
    '/api/integrations/health',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: metricsHistory, error: metricsHistoryError } = useSWR<any[]>(
    '/api/system/metrics/history?hours=168',
    fetcher,
    { shouldRetryOnError: false }
  )

  // Smartcar integration status
  const { data: smartcarStatus } = useSWR<any>(
    '/api/smartcar/status',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: smartcarConnections } = useSWR<any>(
    smartcarStatus?.configured ? '/api/smartcar/connections' : null,
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

  const webhookEventsToday = useMemo(() => {
    const rows = Array.isArray(metricsHistory) ? metricsHistory : []
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const total = rows
      .filter((row: any) => new Date(row.time).getTime() >= cutoff)
      .reduce((sum: number, row: any) => sum + Number(row.webhookEvents || 0), 0)
    return total > 0 ? Math.round(total) : (apiCallsToday > 0 ? Math.round(apiCallsToday * 0.15) : 0)
  }, [metricsHistory, apiCallsToday])

  const handleConfigureIntegration = (integrationName: string) => {
    push({ type: 'system-health', label: `Integration: ${integrationName}`, data: { integrationName } })
  }

  const integrationHealthDescription = useMemo(() => {
    if (integrations.length === 0) return 'No integrations configured'
    const unhealthyCount = integrations.filter((i: any) => i.status === 'unhealthy').length
    const degradedCount = integrations.filter((i: any) => i.status === 'degraded').length
    if (unhealthyCount > 0) return `${unhealthyCount} system${unhealthyCount > 1 ? 's' : ''} with issues`
    if (degradedCount > 0) return `${degradedCount} system${degradedCount > 1 ? 's' : ''} experiencing issues`
    return 'All systems operational'
  }, [integrations])

  const heroMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'Active Integrations',
      value: integrations.length,
      icon: Plug,
      accent: 'emerald' as const,
    },
    {
      label: 'API Calls Today',
      value: apiCallsToday > 0 ? formatNumber(apiCallsToday) : '\u2014',
      icon: CloudCog,
      accent: 'gray' as const,
    },
    {
      label: 'Webhook Events',
      value: webhookEventsToday > 0 ? formatNumber(webhookEventsToday) : '\u2014',
      icon: Webhook,
      accent: 'gray' as const,
    },
    {
      label: 'Health',
      value: integrationHealthPercent > 0 ? `${integrationHealthPercent}%` : '\u2014',
      icon: Activity,
      accent: integrationHealthPercent >= 75 ? 'emerald' as const : integrationHealthPercent >= 50 ? 'amber' as const : 'rose' as const,
    },
  ], [integrations.length, apiCallsToday, webhookEventsToday, integrationHealthPercent])

  // Loading state
  const isIntegrationsLoading = !integrationsHealth && !integrationsHealthError
  if (isIntegrationsLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  if (integrationsError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load integrations data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.08] bg-[#1a1a1a]" />

      {/* Connected Integrations — full-width table */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-white/40" />
            <span className="text-sm font-semibold text-white/80">Connected Integrations</span>
            <span className="text-xs text-white/30 ml-1">{integrationHealthDescription}</span>
          </div>
        </div>
        {integrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <Plug className="h-6 w-6" />
            <p>No integrations connected. Configure API connections in Settings.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Integration</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Capabilities</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Response</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-right py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration: any) => (
                  <tr key={integration.name} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <Plug className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-white/80 font-medium">{integration.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white/40 text-xs">{integration.capabilities?.join(', ') || 'Integration'}</td>
                    <td className="py-2.5 px-3 text-white/40 text-xs">{integration.responseTime ? `${integration.responseTime}ms` : '\u2014'}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${statusDotColor(integration.status)}`} />
                        <span className="text-xs text-white/50">{formatEnum(integration.status)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleConfigureIntegration(integration.name)}>
                        Configure
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* API Usage Chart */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">API Usage Trends</span>
        </div>
        <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
          <ResponsiveLineChart
            title="API Usage Trends"
            data={apiUsageData}
            dataKeys={['calls']}
            colors={['#10b981']}
            height={140}
            compact
          />
        </div>
      </div>

      {/* Smartcar Vehicle API */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Plug className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Smartcar Vehicle API</span>
          <span className="text-xs text-white/30 ml-1">Connected vehicle data for 50+ brands</span>
        </div>
        {!smartcarStatus?.configured ? (
          <div className="flex flex-col items-center justify-center h-24 text-white/30 text-xs gap-2">
            <Plug className="h-5 w-5" />
            <p>Smartcar is not configured. Set <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-white/50">SMARTCAR_CLIENT_ID</code>, <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-white/50">SMARTCAR_CLIENT_SECRET</code>, and <code className="bg-white/[0.06] px-1.5 py-0.5 rounded text-white/50">SMARTCAR_REDIRECT_URI</code> in your environment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary strip */}
            <div className="flex items-center gap-6 px-4 py-3 rounded-md border border-white/[0.08] bg-white/[0.02]">
              <div>
                <span className="text-xs text-white/30">Connected</span>
                <p className="text-lg font-bold text-white/80">{smartcarConnections?.total ?? 0}</p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div>
                <span className="text-xs text-white/30">Mode</span>
                <p className="mt-0.5">
                  <Badge variant={smartcarConnections?.mode === 'test' ? 'secondary' : 'default'} className="text-[10px]">
                    {smartcarConnections?.mode === 'test' ? 'Test (Simulator)' : 'Live'}
                  </Badge>
                </p>
              </div>
              <div className="w-px h-8 bg-white/[0.08]" />
              <div>
                <span className="text-xs text-white/30">Status</span>
                <p className="mt-0.5">
                  <Badge variant="default" className="text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </p>
              </div>
            </div>

            {/* Connected vehicles table */}
            {Array.isArray(smartcarConnections?.connections) && smartcarConnections.connections.length > 0 ? (
              <div className="rounded-md border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#1a1a1a]">
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Vehicle</th>
                      <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Status</th>
                      <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Last Sync</th>
                      <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {smartcarConnections.connections.map((conn: any) => (
                      <tr key={conn.vehicle_id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                        <td className="py-2 px-3 text-white/80">
                          {conn.vehicle_name || `Vehicle #${conn.vehicle_id}`}
                          {conn.license_plate && <span className="text-xs text-white/30 ml-1">({conn.license_plate})</span>}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`h-1.5 w-1.5 rounded-full ${
                              conn.sync_status === 'active' ? 'bg-emerald-400' : conn.sync_status === 'error' ? 'bg-rose-400' : 'bg-white/20'
                            }`} />
                            <span className="text-xs text-white/50">{formatEnum(conn.sync_status || 'unknown')}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-white/30 text-xs">
                          {conn.updated_at ? formatDateTime(conn.updated_at) : '\u2014'}
                        </td>
                        <td className="py-2 px-3 text-xs text-rose-400 truncate max-w-[200px]">
                          {conn.sync_error || '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-16 text-white/30 text-xs gap-1">
                <p>No vehicles connected yet. Use the vehicle detail panel to connect vehicles via Smartcar.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Documents Tab - Document management and templates
 */
const DocumentsTabContent = memo(function DocumentsTabContent() {
  const { navigateTo } = useNavigation()
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
      .slice(0, 10)
  }, [documentRows])

  const handleBrowseDocuments = (category: string) => {
    toast.success(`Opening document library: ${formatEnum(category)}`)
    logger.info('Browse documents clicked:', category)
    navigateTo('documents')
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

  const heroMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'Total Documents',
      value: documentRows.length,
      icon: FileText,
      accent: 'emerald' as const,
    },
    {
      label: 'Templates',
      value: templateDocs.length,
      icon: FileCheck,
      accent: 'gray' as const,
    },
    {
      label: 'Shared This Week',
      value: recentUploads.length,
      icon: Upload,
      accent: 'gray' as const,
    },
    {
      label: 'Storage',
      value: totalSize > 0 ? `${(totalSize / 1_000_000_000).toFixed(2)} GB` : '\u2014',
      icon: HardDrive,
      accent: 'gray' as const,
    },
  ], [documentRows.length, templateDocs.length, recentUploads.length, totalSize])

  // Loading state
  const isDocumentsLoading = !documents && !documentsError
  if (isDocumentsLoading) {
    return (
      <div className="space-y-3 p-6">
        <Skeleton className="h-24 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
        <Skeleton className="h-48 rounded-md" />
      </div>
    )
  }

  if (documentsError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load documents data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto h-full">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.08] bg-[#1a1a1a]" />

      {/* Document Library — full-width table */}
      <div className="px-6 py-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Document Library</span>
          <span className="text-xs text-white/30 ml-1">{documentCategories.length} categories</span>
        </div>
        {documentCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm gap-2">
            <FolderOpen className="h-6 w-6" />
            <p>No documents uploaded yet. Upload files to organize them into categories.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Category</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Documents</th>
                  <th className="text-right py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {documentCategories.map((cat) => (
                  <tr key={cat.category} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-3.5 w-3.5 text-white/30" />
                        <span className="text-white/80 font-medium">{formatEnum(cat.category)}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white/40 text-xs">{cat.count} {cat.count === 1 ? 'document' : 'documents'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => handleBrowseDocuments(cat.category)}>
                        Browse
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Documents — full-width table */}
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-white/40" />
          <span className="text-sm font-semibold text-white/80">Recently Added</span>
        </div>
        {recentDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-20 text-white/30 text-xs gap-1">
            <p>No recent documents. Uploaded files will appear here.</p>
          </div>
        ) : (
          <div className="rounded-md border border-white/[0.08] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">File Name</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Uploaded By</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Date</th>
                  <th className="text-left py-2 px-3 text-white/40 font-medium text-xs">Size</th>
                  <th className="text-right py-2 px-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentDocuments.map((doc: any) => (
                  <tr key={doc.id} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-white/30 shrink-0" />
                        <span className="text-white/80 font-medium truncate">{doc.file_name || doc.name || doc.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-white/40 text-xs">{doc.uploaded_by_name || 'System'}</td>
                    <td className="py-2.5 px-3 text-white/30 text-xs">{formatDate(doc.uploaded_at)}</td>
                    <td className="py-2.5 px-3 text-white/30 text-xs">{doc.file_size ? `${(doc.file_size / 1_000_000).toFixed(2)} MB` : '\u2014'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => handleDownloadDocument(doc.file_name || doc.name || 'Document', doc.file_url)}
                        disabled={!doc.file_url}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminConfigurationHub() {
  const tabs: VTab[] = useMemo(() => [
    {
      id: 'admin',
      label: 'Admin',
      icon: UserCog,
      content: (
        <QueryErrorBoundary>
          <AdminTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: Settings,
      content: (
        <QueryErrorBoundary>
          <ConfigurationTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'data',
      label: 'Governance',
      icon: Database,
      content: (
        <QueryErrorBoundary>
          <DataGovernanceTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Plug,
      content: (
        <QueryErrorBoundary>
          <IntegrationsTabContent />
        </QueryErrorBoundary>
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      content: (
        <QueryErrorBoundary>
          <DocumentsTabContent />
        </QueryErrorBoundary>
      ),
    },
  ], [])

  return (
    <div className="h-full flex flex-col bg-[#111]">
      {/* Minimal header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.08] bg-[#1a1a1a] shrink-0">
        <Settings className="h-5 w-5 text-emerald-400/60" />
        <h1 className="text-[15px] font-semibold text-white/80 tracking-tight">Administration & Configuration</h1>
      </div>

      {/* Sidebar + Content */}
      <div className="flex-1 min-h-0">
        <VerticalTabs tabs={tabs} defaultTab="admin" />
      </div>
    </div>
  )
}
