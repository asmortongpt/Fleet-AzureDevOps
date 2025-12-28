/**
 * AdminHubDrilldowns - Drilldown components for Admin hub
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Cpu, HardDrive, Users, Bell, CheckCircle, Warning,
    FileText, Cloud, Clock, Activity
} from '@phosphor-icons/react'

export function SystemHealthDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-2">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-3 text-center">
                        <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">42</div>
                        <div className="text-xs text-slate-400">Sessions</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-emerald-400">99.9%</div>
                        <div className="text-xs text-slate-400">Uptime</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 text-center">
                        <Cpu className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-slate-300">24%</div>
                        <div className="text-xs text-slate-400">CPU</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3 text-center">
                        <div className="text-xl font-bold text-slate-300">68%</div>
                        <div className="text-xs text-slate-400">Memory</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-400" />
                        Service Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {[
                        { service: 'API Gateway', status: 'operational', latency: '12ms' },
                        { service: 'Database Cluster', status: 'operational', latency: '3ms' },
                        { service: 'Authentication', status: 'operational', latency: '8ms' },
                        { service: 'File Storage', status: 'operational', latency: '45ms' },
                        { service: 'Background Jobs', status: 'operational', latency: '—' },
                    ].map(svc => (
                        <div key={svc.service} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span className="text-slate-300">{svc.service}</span>
                            </div>
                            <span className="text-slate-400 text-sm">{svc.latency}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function AlertsDrilldown() {
    const alerts = [
        { id: '1', message: 'High memory usage on db-02', severity: 'warning', time: '15 min ago', ack: false },
        { id: '2', message: 'API rate limit approaching', severity: 'info', time: '1 hr ago', ack: true },
        { id: '3', message: 'Backup completed successfully', severity: 'info', time: '2 hrs ago', ack: true },
        { id: '4', message: 'SSL certificate expires in 30 days', severity: 'warning', time: '1 day ago', ack: false },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-emerald-400">0</div>
                        <div className="text-xs text-slate-400">Critical</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">12</div>
                        <div className="text-xs text-slate-400">Resolved Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">2</div>
                        <div className="text-xs text-slate-400">Suppressed</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <Bell className="w-5 h-5 text-amber-400" />
                        Recent Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {alerts.map(alert => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {alert.severity === 'warning' ?
                                    <Warning className="w-5 h-5 text-amber-400" /> :
                                    <Bell className="w-5 h-5 text-blue-400" />
                                }
                                <div>
                                    <div className="font-medium text-white text-sm">{alert.message}</div>
                                    <div className="text-xs text-slate-400">{alert.time}</div>
                                </div>
                            </div>
                            {alert.ack && <Badge variant="outline" className="border-emerald-500 text-emerald-400">Ack</Badge>}
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function FilesDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <HardDrive className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">2.4 TB</div>
                        <div className="text-xs text-slate-400">Total Storage</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">456</div>
                        <div className="text-xs text-slate-400">Shared Files</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">24</div>
                        <div className="text-xs text-slate-400">Uploaded Today</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Storage by Type</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { type: 'Documents', size: '890 GB', percent: 37, color: 'bg-blue-500' },
                        { type: 'Video Telematics', size: '1.2 TB', percent: 50, color: 'bg-purple-500' },
                        { type: 'Images', size: '180 GB', percent: 8, color: 'bg-emerald-500' },
                        { type: 'Other', size: '130 GB', percent: 5, color: 'bg-slate-500' },
                    ].map(item => (
                        <div key={item.type} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{item.type}</span>
                                <span className="text-white font-medium">{item.size}</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
