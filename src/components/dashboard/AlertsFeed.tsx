import { Warning, Lightning, Wrench, Info, Circle, Clock } from "@phosphor-icons/react"
import { motion } from "framer-motion"
import { useMemo } from "react"

import { cn } from "@/lib/utils"

interface Alert {
  id: string
  type: "critical" | "warning" | "info" | "maintenance"
  title: string
  message: string
  vehicleId?: string
  vehicleName?: string
  timestamp: Date
  isRead?: boolean
}

interface AlertsFeedProps {
  alerts: Alert[]
  onAlertClick?: (alert: Alert) => void
  maxHeight?: string
  showTimestamp?: boolean
}

export function AlertsFeed({
  alerts,
  onAlertClick,
  maxHeight = "100%",
  showTimestamp = true
}: AlertsFeedProps) {
  const sortedAlerts = useMemo(
    () => [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
    [alerts]
  )

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "critical":
        return <Warning className="w-3.5 h-3.5" weight="fill" />
      case "warning":
        return <Lightning className="w-3.5 h-3.5" weight="fill" />
      case "maintenance":
        return <Wrench className="w-3.5 h-3.5" weight="fill" />
      default:
        return <Info className="w-3.5 h-3.5" weight="fill" />
    }
  }

  const getAlertStyle = (type: Alert["type"]) => {
    const styles = {
      critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
      warning: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
      maintenance: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
      info: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    }
    return styles[type]
  }

  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const stats = useMemo(() => {
    const critical = alerts.filter(a => a.type === "critical").length
    const warning = alerts.filter(a => a.type === "warning").length
    const unread = alerts.filter(a => !a.isRead).length
    return { critical, warning, unread }
  }, [alerts])

  return (
    <div className="compact-card h-full">
      <div className="compact-card-header">
        <div className="compact-card-title">
          <Warning className="w-4 h-4" />
          Alerts & Notifications
        </div>
        <div className="flex items-center gap-2">
          {stats.critical > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-400 rounded-full border border-red-200 dark:border-red-900">
              {stats.critical} Critical
            </span>
          )}
          {stats.unread > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-100 dark:bg-blue-950 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-900">
              {stats.unread} New
            </span>
          )}
        </div>
      </div>
      <div className="scrollable-content" style={{ maxHeight }}>
        <div className="space-y-1 p-2">
          {sortedAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Circle className="w-8 h-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">No alerts</p>
              <p className="text-[10px] text-muted-foreground/70">All systems operational</p>
            </div>
          ) : (
            sortedAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                className={cn(
                  "p-2 rounded-md border cursor-pointer transition-all duration-200 hover:shadow-sm",
                  !alert.isRead && "bg-blue-50/50 dark:bg-blue-950/10",
                  alert.isRead && "opacity-80 hover:opacity-100"
                )}
                onClick={() => onAlertClick?.(alert)}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.5) }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-start gap-2">
                  <div className={cn("compact-list-item-icon mt-0.5", getAlertStyle(alert.type))}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="font-semibold text-xs text-foreground leading-tight">
                        {alert.title}
                      </div>
                      {!alert.isRead && (
                        <Circle
                          className="w-2 h-2 fill-blue-500 text-blue-500 flex-shrink-0 mt-1"
                          weight="fill"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-snug mb-1">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      {alert.vehicleName && (
                        <span className="font-medium">{alert.vehicleName}</span>
                      )}
                      {showTimestamp && (
                        <>
                          {alert.vehicleName && <span>•</span>}
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimestamp(alert.timestamp)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Compact Activity Feed (for recent events)
interface Activity {
  id: string
  type: string
  vehicleId?: string
  vehicleName?: string
  description: string
  timestamp: Date
}

interface ActivityFeedProps {
  activities: Activity[]
  maxHeight?: string
  maxItems?: number
}

export function ActivityFeed({ activities, maxHeight = "100%", maxItems }: ActivityFeedProps) {
  const displayActivities = useMemo(
    () => maxItems ? activities.slice(0, maxItems) : activities,
    [activities, maxItems]
  )

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="compact-card h-full">
      <div className="compact-card-header">
        <div className="compact-card-title">
          <Circle className="w-4 h-4 animate-pulse" weight="fill" />
          Live Activity
        </div>
        <div className="text-xs text-muted-foreground">
          {activities.length} events
        </div>
      </div>
      <div className="scrollable-content" style={{ maxHeight }}>
        <div className="space-y-0.5 p-2">
          {displayActivities.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            displayActivities.map((activity, index) => (
              <motion.div
                key={activity.id}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-muted/30 transition-colors"
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
              >
                <Circle
                  className="w-1.5 h-1.5 mt-1.5 fill-blue-500 text-blue-500 flex-shrink-0"
                  weight="fill"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-foreground leading-tight mb-0.5">
                    {activity.type.replace(/[_:]/g, ' ')}
                  </div>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">
                    {activity.vehicleName || activity.vehicleId || 'System'} • {activity.description}
                  </p>
                </div>
                <span className="text-[9px] text-muted-foreground flex-shrink-0">
                  {formatTimestamp(activity.timestamp)}
                </span>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
