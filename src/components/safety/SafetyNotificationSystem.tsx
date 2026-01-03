/**
 * SafetyNotificationSystem - Real-time safety alerts and notifications
 * Push notifications for critical safety events, compliance deadlines, and incidents
 */

import { useState, useEffect } from 'react'
import {
    Bell,
    Warning,
    Info,
    CheckCircle,
    X,
    Eye,
    EyeSlash,
    Clock,
    Siren
} from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface SafetyNotification {
    id: string
    type: 'critical' | 'warning' | 'info' | 'success'
    title: string
    message: string
    timestamp: string
    read: boolean
    actionable: boolean
    action_url?: string
    category: 'incident' | 'compliance' | 'training' | 'inspection' | 'alert'
    priority: 'high' | 'medium' | 'low'
}

const DEMO_NOTIFICATIONS: SafetyNotification[] = [
    {
        id: '1',
        type: 'critical',
        title: 'Critical Safety Incident Reported',
        message: 'Forklift collision in Warehouse B. Emergency response activated. Immediate management review required.',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false,
        actionable: true,
        action_url: '/safety/incidents/2024-045',
        category: 'incident',
        priority: 'high'
    },
    {
        id: '2',
        type: 'warning',
        title: 'OSHA Certification Expiring Soon',
        message: 'Forklift operator certification for Sarah Williams expires in 7 days. Schedule renewal training.',
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        read: false,
        actionable: true,
        action_url: '/safety/training',
        category: 'training',
        priority: 'high'
    },
    {
        id: '3',
        type: 'info',
        title: 'Monthly Safety Inspection Due',
        message: 'Vehicle fleet safety inspection for December 2024 is due by end of week.',
        timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
        read: false,
        actionable: true,
        action_url: '/safety/inspections',
        category: 'inspection',
        priority: 'medium'
    },
    {
        id: '4',
        type: 'warning',
        title: 'Near Miss Report Submitted',
        message: 'Employee reported near miss in loading dock area. Investigation required within 24 hours.',
        timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
        read: true,
        actionable: true,
        action_url: '/safety/incidents/2024-044',
        category: 'incident',
        priority: 'medium'
    },
    {
        id: '5',
        type: 'success',
        title: 'Safety Training Completed',
        message: 'John Smith completed OSHA Hazard Communication training with 95% score.',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        read: true,
        actionable: false,
        category: 'training',
        priority: 'low'
    },
    {
        id: '6',
        type: 'info',
        title: 'Safety Alert: Weather Conditions',
        message: 'Severe weather alert for region. All drivers advised to exercise extreme caution.',
        timestamp: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        read: true,
        actionable: false,
        category: 'alert',
        priority: 'medium'
    }
]

export function SafetyNotificationSystem() {
    const [notifications, setNotifications] = useState<SafetyNotification[]>(DEMO_NOTIFICATIONS)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [soundEnabled, setSoundEnabled] = useState(true)

    useEffect(() => {
        // Simulate real-time notifications
        const interval = setInterval(() => {
            // In production, this would be replaced with WebSocket connection
            // For demo, randomly add a new notification every 30 seconds
            if (Math.random() > 0.7) {
                const newNotification: SafetyNotification = {
                    id: `${Date.now()}`,
                    type: ['critical', 'warning', 'info'][Math.floor(Math.random() * 3)] as any,
                    title: 'New Safety Alert',
                    message: 'This is a simulated real-time notification',
                    timestamp: new Date().toISOString(),
                    read: false,
                    actionable: true,
                    category: ['incident', 'compliance', 'training'][Math.floor(Math.random() * 3)] as any,
                    priority: 'medium'
                }

                setNotifications(prev => [newNotification, ...prev])

                if (soundEnabled) {
                    // Play notification sound
                    const audio = new Audio('/notification-sound.mp3')
                    audio.play().catch(() => {
                        // Handle autoplay restrictions
                    })
                }
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [soundEnabled])

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false
        if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
        return true
    })

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const getNotificationIcon = (type: SafetyNotification['type']) => {
        switch (type) {
            case 'critical':
                return <Siren className="w-5 h-5 text-red-400" />
            case 'warning':
                return <Warning className="w-5 h-5 text-yellow-400" />
            case 'info':
                return <Info className="w-5 h-5 text-blue-400" />
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-400" />
        }
    }

    const getNotificationStyle = (type: SafetyNotification['type']) => {
        switch (type) {
            case 'critical':
                return 'border-red-500/50 bg-red-500/10'
            case 'warning':
                return 'border-yellow-500/50 bg-yellow-500/10'
            case 'info':
                return 'border-blue-500/50 bg-blue-500/10'
            case 'success':
                return 'border-green-500/50 bg-green-500/10'
        }
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Bell className="w-6 h-6" />
                        Safety Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                            </Badge>
                        )}
                    </h2>
                    <p className="text-slate-400 mt-1">Real-time safety alerts and compliance notifications</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="gap-2"
                    >
                        {soundEnabled ? (
                            <>
                                <Bell className="w-4 h-4" />
                                Sound On
                            </>
                        ) : (
                            <>
                                <Bell className="w-4 h-4 opacity-50" />
                                Sound Off
                            </>
                        )}
                    </Button>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead}>
                            Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                        <div className="flex gap-2 items-center">
                            <label className="text-sm text-slate-300">Filter:</label>
                            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Notifications</SelectItem>
                                    <SelectItem value="unread">Unread Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="text-sm text-slate-300">Category:</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-600 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    <SelectItem value="incident">Incidents</SelectItem>
                                    <SelectItem value="compliance">Compliance</SelectItem>
                                    <SelectItem value="training">Training</SelectItem>
                                    <SelectItem value="inspection">Inspections</SelectItem>
                                    <SelectItem value="alert">Alerts</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="ml-auto text-sm text-slate-400">
                            Showing {filteredNotifications.length} of {notifications.length} notifications
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notifications List */}
            <Card className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                    <CardTitle className="text-white">Recent Notifications</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                        <div className="space-y-2 p-4">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No notifications to display</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg border transition-all ${
                                            getNotificationStyle(notification.type)
                                        } ${
                                            notification.read ? 'opacity-60' : ''
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h4 className="font-medium text-white flex items-center gap-2">
                                                        {notification.title}
                                                        {!notification.read && (
                                                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                                        )}
                                                    </h4>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Badge variant="outline" className="text-xs">
                                                            {notification.category}
                                                        </Badge>
                                                        <button
                                                            onClick={() => dismissNotification(notification.id)}
                                                            className="text-slate-400 hover:text-slate-300"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-300 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTimestamp(notification.timestamp)}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {!notification.read && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => markAsRead(notification.id)}
                                                                className="h-7 text-xs gap-1"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                Mark Read
                                                            </Button>
                                                        )}
                                                        {notification.actionable && notification.action_url && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 text-xs"
                                                            >
                                                                View Details
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
                <CardHeader>
                    <CardTitle className="text-white text-sm">Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-300 font-medium">Critical Incident Alerts</div>
                            <div className="text-xs text-slate-400">Immediate notification for safety incidents</div>
                        </div>
                        <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-300 font-medium">Compliance Reminders</div>
                            <div className="text-xs text-slate-400">Training and certification expirations</div>
                        </div>
                        <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-300 font-medium">Daily Safety Summary</div>
                            <div className="text-xs text-slate-400">Email digest of safety activities</div>
                        </div>
                        <Badge variant="secondary">Disabled</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SafetyNotificationSystem
