/**
 * Advanced Settings Component
 * Developer mode, API endpoint, feature flags, and debug settings
 */

import { Code, Cpu, Flag, Bug, BarChart, AlertTriangle, Database } from 'lucide-react'
import { useAtom } from 'jotai'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { swrFetcher } from '@/lib/fetcher'
import { advancedSettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'

// Available feature flags
const availableFeatureFlags = [
  {
    key: 'newDashboard',
    name: 'New Dashboard Design',
    description: 'Enable the redesigned dashboard interface',
    experimental: false,
  },
  {
    key: 'advancedReporting',
    name: 'Advanced Reporting',
    description: 'Access to advanced analytics and custom reports',
    experimental: true,
  },
  {
    key: 'aiInsights',
    name: 'AI-Powered Insights',
    description: 'Get AI-generated recommendations and insights',
    experimental: true,
  },
  {
    key: 'realtimeSync',
    name: 'Real-time Sync',
    description: 'Enable real-time data synchronization',
    experimental: false,
  },
]

export function AdvancedSettings() {
  const [settings, setSettings] = useAtom(advancedSettingsAtom)
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)
  const { data: metricsData } = useSWR<Record<string, any>>(
    settings.performanceMetrics ? '/api/system/metrics' : null,
    swrFetcher
  )
  const metrics = (metricsData as any)?.data ?? metricsData ?? {}

  // Database stats - always fetch for the Database Stats card
  const { data: dbStatsData } = useSWR<Record<string, any>>(
    '/api/system/db-stats',
    swrFetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  )
  const dbStats = (dbStatsData as any)?.data ?? dbStatsData ?? {}

  // Connection pool status
  const { data: poolData } = useSWR<Record<string, any>>(
    '/api/system/pool-status',
    swrFetcher,
    { refreshInterval: 15000, revalidateOnFocus: false }
  )
  const poolStatus = (poolData as any)?.data ?? poolData ?? {}

  const formatMetric = (value: number | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return '—'
    return unit ? `${value} ${unit}` : String(value)
  }

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings({ ...settings, [key]: value })
    setHasUnsavedChanges(true)
  }

  const toggleFeatureFlag = (flagKey: string) => {
    setSettings({
      ...settings,
      featureFlags: {
        ...settings.featureFlags,
        [flagKey]: !settings.featureFlags[flagKey],
      },
    })
    setHasUnsavedChanges(true)
  }

  return (
    <div className="space-y-2">
      {/* AlertTriangle Banner */}
      <div className="flex items-start gap-3 p-2 bg-warning/10 border border-warning/20 rounded-lg">
        <AlertTriangle className="w-3 h-3 text-warning mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-medium">Advanced Settings</p>
          <p className="text-muted-foreground mt-1">
            These settings are intended for developers and advanced users. Changing them may affect
            application behavior.
          </p>
        </div>
      </div>

      {/* Developer Mode */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-3 h-3" />
            <CardTitle>Developer Mode</CardTitle>
          </div>
          <CardDescription>Enable developer tools and debugging features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="developer-mode">Enable Developer Mode</Label>
              <div className="text-sm text-muted-foreground">
                Shows additional debugging information and developer tools
              </div>
            </div>
            <Switch
              id="developer-mode"
              checked={settings.developerMode}
              onCheckedChange={(checked) => updateSetting('developerMode', checked)}
            />
          </div>

          {settings.developerMode && (
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Developer Features Enabled:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>React DevTools integration</li>
                <li>Console logging for state changes</li>
                <li>API request/response logging</li>
                <li>Performance profiling</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            <CardTitle>API Configuration</CardTitle>
          </div>
          <CardDescription>Override the default API endpoint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">API Endpoint URL</Label>
            <Input
              id="api-endpoint"
              type="url"
              value={settings.apiEndpoint}
              onChange={(e) => updateSetting('apiEndpoint', e.target.value)}
              placeholder="https://api.fleetmanagement.com"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use the default endpoint. Changes require page refresh.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Flag className="w-3 h-3" />
            <CardTitle>Feature Flags</CardTitle>
          </div>
          <CardDescription>Enable or disable experimental features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableFeatureFlags.map((flag) => (
              <div
                key={flag.key}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={`flag-${flag.key}`} className="font-medium">
                      {flag.name}
                    </Label>
                    {flag.experimental && (
                      <Badge variant="outline" className="text-xs">
                        Experimental
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                </div>
                <Switch
                  id={`flag-${flag.key}`}
                  checked={settings.featureFlags[flag.key] || false}
                  onCheckedChange={() => toggleFeatureFlag(flag.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Debug Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="w-3 h-3" />
            <CardTitle>Debug Settings</CardTitle>
          </div>
          <CardDescription>Configure debugging and logging options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="debug-logging">Debug Logging</Label>
              <div className="text-sm text-muted-foreground">
                Log detailed debug information to the browser console
              </div>
            </div>
            <Switch
              id="debug-logging"
              checked={settings.debugLogging}
              onCheckedChange={(checked) => updateSetting('debugLogging', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="performance-metrics">Show Performance Metrics</Label>
              <div className="text-sm text-muted-foreground">
                Display real-time performance information
              </div>
            </div>
            <Switch
              id="performance-metrics"
              checked={settings.performanceMetrics}
              onCheckedChange={(checked) => updateSetting('performanceMetrics', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {settings.performanceMetrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="w-3 h-3" />
              <CardTitle>Performance Metrics</CardTitle>
            </div>
            <CardDescription>Real-time application performance data</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Page Load Time</TableCell>
                  <TableCell>{formatMetric(metrics.pageLoadTime, 's')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">API Response Time</TableCell>
                  <TableCell>{formatMetric(metrics.apiResponseTime, 'ms')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Memory Usage</TableCell>
                  <TableCell>{formatMetric(metrics.memoryUsage, '%')}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Active Connections</TableCell>
                  <TableCell>{formatMetric(metrics.activeConnections)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Database Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3" />
            <CardTitle>Database Stats</CardTitle>
          </div>
          <CardDescription>Live entity counts and connection pool status from PostgreSQL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Vehicles</p>
              <p className="text-2xl font-bold">{formatMetric(dbStats.totalVehicles ?? dbStats.total_vehicles)}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Drivers</p>
              <p className="text-2xl font-bold">{formatMetric(dbStats.totalDrivers ?? dbStats.total_drivers)}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Work Orders</p>
              <p className="text-2xl font-bold">{formatMetric(dbStats.totalWorkOrders ?? dbStats.total_work_orders)}</p>
            </div>
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fuel Transactions</p>
              <p className="text-2xl font-bold">{formatMetric(dbStats.totalFuelTransactions ?? dbStats.total_fuel_transactions)}</p>
            </div>
          </div>

          {/* Connection Pool Status */}
          {(poolStatus.totalConnections != null || poolStatus.total_connections != null || poolStatus.total != null) && (
            <div className="border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Connection Pool</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{poolStatus.totalConnections ?? poolStatus.total_connections ?? poolStatus.total ?? '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold text-blue-500">{poolStatus.activeConnections ?? poolStatus.active ?? poolStatus.busy ?? '--'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Idle</p>
                  <p className="text-lg font-semibold text-green-500">{poolStatus.idleConnections ?? poolStatus.idle ?? '--'}</p>
                </div>
              </div>
              {(() => {
                const total = poolStatus.totalConnections ?? poolStatus.total_connections ?? poolStatus.total ?? 0
                const active = poolStatus.activeConnections ?? poolStatus.active ?? poolStatus.busy ?? 0
                const pct = total > 0 ? Math.round((active / total) * 100) : 0
                return total > 0 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Pool utilization</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress
                      value={pct}
                      className="h-2"
                    />
                  </div>
                ) : null
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>Application and environment details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Version</TableCell>
                <TableCell>2.5.0</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Build</TableCell>
                <TableCell>20251128-1</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Environment</TableCell>
                <TableCell>{import.meta.env.MODE}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">User Agent</TableCell>
                <TableCell className="text-xs">{navigator.userAgent}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
