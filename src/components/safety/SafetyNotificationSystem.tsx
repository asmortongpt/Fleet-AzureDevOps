/**
 * SafetyNotificationSystem - Real-time safety alerts and notifications
 * Push notifications for critical safety events, compliance deadlines, and incidents
 */

import { Bell, AlertTriangle, Info, CheckCircle, X, Eye, Clock, Siren } from 'lucide-react'
import { useMemo, useRef, useState, useEffect } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const fetcher = (url: string) =>
    fetch(url)
        .then((r) => r.json())
        .then((data) => data?.data ?? data)

export function SafetyNotificationSystem() {
    const [filter, setFilter] = useState<'all' | 'unread'>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [soundEnabled, setSoundEnabled] = useState(true)
    const lastUnreadCount = useRef(0)

    const query = useMemo(() => {
        const params = new URLSearchParams()
        if (filter === 'unread') params.set('unread_only', 'true')
        if (categoryFilter !== 'all') params.set('category', categoryFilter)
        params.set('limit', '100')
        return `/api/notifications?${params.toString()}`
    }, [filter, categoryFilter])

    const { data: rawNotifications, mutate } = useSWR<any[]>(query, fetcher, {
        refreshInterval: 30000,
        shouldRetryOnError: false
    })

    const notifications = useMemo<SafetyNotification[]>(() => {
        return (rawNotifications || []).map((n) => {
            const typeMap: Record<string, SafetyNotification['type']> = {
                info: 'info',
                warning: 'warning',
                success: 'success',
                error: 'critical',
                alert: 'critical',
                reminder: 'info'
            }
            const category = n.metadata?.category || n.related_entity_type || 'alert'
            return {
                id: n.id,
                type: typeMap[n.type] || 'info',
                title: n.title,
                message: n.message,
                timestamp: n.sent_at || n.created_at,
                read: n.is_read,
                actionable: Boolean(n.action_url),
                action_url: n.action_url || undefined,
                category,
                priority: n.priority || 'medium'
            }
        })
    }, [rawNotifications])

    useEffect(() => {
        const unreadCount = notifications.filter(n => !n.read).length
        if (soundEnabled && unreadCount > lastUnreadCount.current) {
            const audio = new Audio('/notification-sound.mp3')
            audio.play().catch(() => {
                // Autoplay restrictions
            })
        }
        lastUnreadCount.current = unreadCount
    }, [notifications, soundEnabled])

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false
        if (categoryFilter !== 'all' && n.category !== categoryFilter) return false
        return true
    })

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = async (id: string) => {
        await fetch(`/api/notifications/${id}/read`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        mutate()
    }

    const markAllAsRead = async () => {
        await fetch('/api/notifications/mark-all-read', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        })
        mutate()
    }

    const dismissNotification = async (id: string) => {
        await fetch(`/api/notifications/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        mutate()
    }

    const getNotificationIcon = (type: SafetyNotification['type']) => {
        switch (type) {
            case 'critical':
                return <Siren className="w-3 h-3 text-red-400" />
            case 'warning':
                return <AlertTriangle className="w-3 h-3 text-yellow-400" />
            case 'info':
                return <Info className="w-3 h-3 text-blue-700" />
            case 'success':
                return <CheckCircle className="w-3 h-3 text-green-400" />
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
        <div className="space-y-2 p-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Safety Notifications
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {unreadCount}
                            </Badge>
                        )}
                    </h2>
                    <p className="text-slate-700 mt-1">Real-time safety alerts and compliance notifications</p>
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
                <CardContent className="p-2">
                    <div className="flex gap-2 items-center">
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
                        <div className="ml-auto text-sm text-slate-700">
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
                        <div className="space-y-2 p-2">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12 text-slate-700">
                                    <Bell className="w-12 h-9 mx-auto mb-2 opacity-50" />
                                    <p>No notifications to display</p>
                                </div>
                            ) : (
                                filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-2 rounded-lg border transition-all ${
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
                                                            className="text-slate-700 hover:text-slate-300"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-slate-300 mb-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-700">
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
                            <div className="text-xs text-slate-700">Immediate notification for safety incidents</div>
                        </div>
                        <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-300 font-medium">Compliance Reminders</div>
                            <div className="text-xs text-slate-700">Training and certification expirations</div>
                        </div>
                        <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-300 font-medium">Daily Safety Summary</div>
                            <div className="text-xs text-slate-700">Email digest of safety activities</div>
                        </div>
                        <Badge variant="secondary">Disabled</Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default SafetyNotificationSystem
