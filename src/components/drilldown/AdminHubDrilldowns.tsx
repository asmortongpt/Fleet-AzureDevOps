/**
 * AdminHubDrilldowns - Drilldown components for Admin hub
 * Fetches real data from API endpoints instead of hardcoded mock data.
 */
import { Cpu, HardDrive, Users, Bell, CheckCircle, AlertTriangle, Activity, Loader2 } from 'lucide-react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatDateTime } from '@/utils/format-helpers'

// ---------- SystemHealthDrilldown ----------

interface HealthData {
    status?: string
    uptime?: number
    version?: string
    services?: { name: string; status: string; latency?: string | number }[]
    cpu_usage?: number
    memory_usage?: number
    active_sessions?: number
}

export function SystemHealthDrilldown() {
    const { data, isLoading, error } = useSWR<HealthData>(
        '/api/health',
        apiFetcher,
        { refreshInterval: 30_000, shouldRetryOnError: false }
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading health data...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                Unable to load system health data.
            </div>
        )
    }

    const sessions = data?.active_sessions ?? 0
    const uptimePct = data?.uptime != null
        ? data.uptime > 1 ? `${data.uptime.toFixed(1)}%` : `${(data.uptime * 100).toFixed(1)}%`
        : '—'
    const cpuPct = data?.cpu_usage != null ? `${Math.round(data.cpu_usage)}%` : '—'
    const memPct = data?.memory_usage != null ? `${Math.round(data.memory_usage)}%` : '—'

    const services = data?.services ?? [
        { name: 'API Gateway', status: data?.status || 'unknown' },
        { name: 'Database Cluster', status: data?.status || 'unknown' },
        { name: 'Authentication', status: data?.status || 'unknown' },
    ]

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-3 text-center">
                        <Users className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
                        <div className="text-base font-bold text-white">{sessions}</div>
                        <div className="text-xs text-white/40">Sessions</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-emerald-700">{uptimePct}</div>
                        <div className="text-xs text-white/40">Uptime</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-3 text-center">
                        <Cpu className="w-3 h-3 text-white/40 mx-auto mb-1" />
                        <div className="text-base font-bold text-white/80">{cpuPct}</div>
                        <div className="text-xs text-white/40">CPU</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-3 text-center">
                        <div className="text-base font-bold text-white/80">{memPct}</div>
                        <div className="text-xs text-white/40">Memory</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        Service Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {services.map(svc => {
                        const isUp = svc.status === 'operational' || svc.status === 'ok' || svc.status === 'healthy'
                        return (
                            <div key={svc.name} className="flex items-center justify-between p-2 bg-white/[0.03] rounded">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                    <span className="text-white/80">{svc.name}</span>
                                </div>
                                <span className="text-white/40 text-sm">{svc.latency ?? (isUp ? 'OK' : 'Down')}</span>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

// ---------- AlertsDrilldown ----------

interface AlertRow {
    id: string
    description?: string
    alert_type?: string
    severity?: string
    status?: string
    acknowledged?: boolean
    created_at?: string
}

export function AlertsDrilldown() {
    const { data: alertRows, isLoading, error } = useSWR<AlertRow[]>(
        '/api/safety-alerts?limit=10',
        apiFetcher,
        { shouldRetryOnError: false }
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading alerts...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                Unable to load alerts.
            </div>
        )
    }

    const alerts = Array.isArray(alertRows) ? alertRows : []

    const criticalCount = alerts.filter(a => a.severity === 'critical').length
    const acknowledgedCount = alerts.filter(a => a.acknowledged || a.status === 'resolved' || a.status === 'acknowledged').length
    const suppressedCount = alerts.filter(a => a.status === 'suppressed' || a.status === 'dismissed').length

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
                <Card className={criticalCount === 0 ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-red-900/30 border-red-700/50'}>
                    <CardContent className="p-2 text-center">
                        <CheckCircle className={`w-4 h-4 mx-auto mb-2 ${criticalCount === 0 ? 'text-emerald-700' : 'text-red-400'}`} />
                        <div className={`text-sm font-bold ${criticalCount === 0 ? 'text-emerald-700' : 'text-red-400'}`}>{criticalCount}</div>
                        <div className="text-xs text-white/40">Critical</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{acknowledgedCount}</div>
                        <div className="text-xs text-white/40">Resolved Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">{suppressedCount}</div>
                        <div className="text-xs text-white/40">Suppressed</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Bell className="w-3 h-3 text-amber-400" />
                        Recent Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {alerts.length === 0 ? (
                        <div className="text-center py-4 text-white/40 text-sm">No recent alerts</div>
                    ) : alerts.map(alert => {
                        const isWarning = alert.severity === 'warning' || alert.severity === 'critical'
                        const isAck = alert.acknowledged || alert.status === 'resolved' || alert.status === 'acknowledged'
                        const timeAgo = alert.created_at ? formatDateTime(alert.created_at) : '—'

                        return (
                            <div key={alert.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                <div className="flex items-center gap-3">
                                    {isWarning ?
                                        <AlertTriangle className="w-3 h-3 text-amber-400" /> :
                                        <Bell className="w-3 h-3 text-emerald-400" />
                                    }
                                    <div>
                                        <div className="font-medium text-white text-sm">
                                            {alert.description || alert.alert_type || 'Alert'}
                                        </div>
                                        <div className="text-xs text-white/40">{timeAgo}</div>
                                    </div>
                                </div>
                                {isAck && <Badge variant="outline" className="border-emerald-500 text-emerald-700">Ack</Badge>}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

// ---------- FilesDrilldown ----------

interface DocumentRow {
    id: string
    file_name?: string
    file_size?: number
    file_type?: string
    document_type?: string
    category?: string
    created_at?: string
}

export function FilesDrilldown() {
    const { data: docRows, isLoading, error } = useSWR<DocumentRow[]>(
        '/api/documents?limit=200',
        apiFetcher,
        { shouldRetryOnError: false }
    )

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-6 text-muted-foreground text-sm">
                Unable to load document data.
            </div>
        )
    }

    const docs = Array.isArray(docRows) ? docRows : []

    // Compute storage stats from actual documents
    const totalBytes = docs.reduce((sum, d) => sum + (d.file_size || 0), 0)
    const totalStorage = formatFileSize(totalBytes)
    const totalFiles = docs.length

    const today = new Date().toDateString()
    const uploadedToday = docs.filter(d => {
        if (!d.created_at) return false
        return new Date(d.created_at).toDateString() === today
    }).length

    // Group by category/type
    const typeMap = new Map<string, number>()
    docs.forEach(d => {
        const cat = d.document_type || d.category || inferCategory(d.file_type || d.file_name || '')
        typeMap.set(cat, (typeMap.get(cat) || 0) + (d.file_size || 0))
    })

    const sortedTypes = Array.from(typeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)

    const colors = ['bg-emerald-500', 'bg-purple-500', 'bg-sky-500', 'bg-slate-500']

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-white/[0.04] border-emerald-500/30">
                    <CardContent className="p-2 text-center">
                        <HardDrive className="w-4 h-4 text-emerald-400 mx-auto mb-2" />
                        <div className="text-sm font-bold text-white">{totalStorage}</div>
                        <div className="text-xs text-white/40">Total Storage</div>
                    </CardContent>
                </Card>
                <Card className="bg-[#242424] border-white/[0.08]">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-white/80">{totalFiles}</div>
                        <div className="text-xs text-white/40">Total Files</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-2 text-center">
                        <div className="text-sm font-bold text-emerald-700">{uploadedToday}</div>
                        <div className="text-xs text-white/40">Uploaded Today</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-[#242424] border-white/[0.08]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">Storage by Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {sortedTypes.length === 0 ? (
                        <div className="text-center py-4 text-white/40 text-sm">No files found</div>
                    ) : sortedTypes.map(([ type, bytes ], idx) => {
                        const percent = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0
                        return (
                            <div key={type} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/80 capitalize">{type}</span>
                                    <span className="text-white font-medium">{formatFileSize(bytes)}</span>
                                </div>
                                <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                    <div className={`h-full ${colors[idx] || 'bg-slate-500'}`} style={{ width: `${percent}%` }} />
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

// --- Helpers ---

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const val = bytes / Math.pow(1024, i)
    return `${val.toFixed(val >= 100 ? 0 : 1)} ${units[i]}`
}

function inferCategory(fileNameOrType: string): string {
    const lower = fileNameOrType.toLowerCase()
    if (lower.includes('video') || lower.includes('mp4') || lower.includes('mov')) return 'Video'
    if (lower.includes('image') || lower.includes('jpg') || lower.includes('png') || lower.includes('jpeg')) return 'Images'
    if (lower.includes('pdf') || lower.includes('doc') || lower.includes('xls') || lower.includes('csv')) return 'Documents'
    return 'Other'
}
