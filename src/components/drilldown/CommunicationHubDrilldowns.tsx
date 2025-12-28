/**
 * CommunicationHubDrilldowns - Drilldown components for Communication hub
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    ChatCircle, EnvelopeSimple, Clock, CheckCircle, Robot,
    Users, TrendUp, Bell, Archive, Envelope
} from '@phosphor-icons/react'

export function AiAgentDrilldown() {
    const conversations = [
        { id: '1', user: 'John Smith', topic: 'Vehicle Status', status: 'resolved', time: '2 min ago' },
        { id: '2', user: 'Jane Doe', topic: 'Fuel Card Issue', status: 'active', time: '5 min ago' },
        { id: '3', user: 'Bob Wilson', topic: 'Route Change', status: 'resolved', time: '12 min ago' },
        { id: '4', user: 'Alice Brown', topic: 'Maintenance ETA', status: 'resolved', time: '18 min ago' },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <Robot className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">94%</div>
                        <div className="text-xs text-slate-400">Satisfaction</div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-400">1.2s</div>
                        <div className="text-xs text-slate-400">Avg Response</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-900/30 border-purple-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-400">89</div>
                        <div className="text-xs text-slate-400">Conversations</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <ChatCircle className="w-5 h-5 text-blue-400" />
                        Recent Conversations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {conversations.map(conv => (
                        <div key={conv.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div>
                                <div className="font-medium text-white">{conv.user}</div>
                                <div className="text-xs text-slate-400">{conv.topic} • {conv.time}</div>
                            </div>
                            <Badge variant="outline" className={conv.status === 'resolved' ? 'border-emerald-500 text-emerald-400' : 'border-blue-500 text-blue-400'}>
                                {conv.status}
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function MessagesDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-blue-900/30 border-blue-700/50">
                    <CardContent className="p-4 text-center">
                        <ChatCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">234</div>
                        <div className="text-xs text-slate-400">Messages Today</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-slate-300">12</div>
                        <div className="text-xs text-slate-400">Channels</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">8</div>
                        <div className="text-xs text-slate-400">Automations</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Channel Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { channel: '#dispatch', messages: 89, active: true },
                        { channel: '#maintenance', messages: 56, active: true },
                        { channel: '#drivers', messages: 45, active: true },
                        { channel: '#safety', messages: 28, active: false },
                        { channel: '#general', messages: 16, active: false },
                    ].map(ch => (
                        <div key={ch.channel} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${ch.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                <span className="text-slate-300">{ch.channel}</span>
                            </div>
                            <span className="text-white font-medium">{ch.messages} msgs</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function EmailDrilldown() {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <EnvelopeSimple className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-white">24</div>
                        <div className="text-xs text-slate-400">Templates</div>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">42%</div>
                        <div className="text-xs text-slate-400">Open Rate</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">12</div>
                        <div className="text-xs text-slate-400">Scheduled</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[
                        { name: 'Weekly Fleet Update', sent: 156, opened: 72, rate: 46 },
                        { name: 'Maintenance Reminder', sent: 48, opened: 38, rate: 79 },
                        { name: 'Safety Bulletin', sent: 156, opened: 52, rate: 33 },
                    ].map(campaign => (
                        <div key={campaign.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">{campaign.name}</span>
                                <span className="text-white">{campaign.rate}% opened</span>
                            </div>
                            <Progress value={campaign.rate} className="h-2 bg-slate-700" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

export function HistoryDrilldown() {
    const history = [
        { id: '1', type: 'email', subject: 'Weekly Fleet Report', recipients: 45, time: '2 hrs ago' },
        { id: '2', type: 'sms', subject: 'Route Update Alert', recipients: 12, time: '4 hrs ago' },
        { id: '3', type: 'push', subject: 'Maintenance Reminder', recipients: 8, time: '6 hrs ago' },
        { id: '4', type: 'email', subject: 'Safety Bulletin', recipients: 156, time: '1 day ago' },
    ]

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
                <Card className="bg-emerald-900/30 border-emerald-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">456</div>
                        <div className="text-xs text-slate-400">This Week</div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">12</div>
                        <div className="text-xs text-slate-400">Flagged</div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 text-center">
                        <Archive className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-slate-300">3.2K</div>
                        <div className="text-xs text-slate-400">Archived</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Recent Communications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {history.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {item.type === 'email' ? <Envelope className="w-5 h-5 text-blue-400" /> :
                                    item.type === 'sms' ? <ChatCircle className="w-5 h-5 text-emerald-400" /> :
                                        <Bell className="w-5 h-5 text-purple-400" />}
                                <div>
                                    <div className="font-medium text-white">{item.subject}</div>
                                    <div className="text-xs text-slate-400">{item.recipients} recipients • {item.time}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
