/**
 * CommunicationHub - Modern Communication Management Dashboard
 * Real-time messaging, notifications, and announcements with responsive visualizations
 */

import {
  ChatsCircle as CommunicationIcon,
  Envelope,
  Bell,
  Megaphone,
  PaperPlaneTilt,
  CheckCircle,
  Warning,
  Clock,
  Eye,
  TrendUp,
  Users,
  Plus,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Suspense } from 'react'

import ErrorBoundary from '@/components/common/ErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import HubPage from '@/components/ui/hub-page'
import { Skeleton } from '@/components/ui/skeleton'
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import { useReactiveCommunicationData } from '@/hooks/use-reactive-communication-data'

/**
 * Overview Tab - Communication metrics and status
 */
function CommunicationOverview() {
  const {
    metrics,
    messageTypeDistribution,
    messagesOverTimeData,
    highPriorityMessages,
    urgentNotifications,
    isLoading,
    lastUpdate,
  } = useReactiveCommunicationData()

  // Prepare chart data for message types
  const messageTypeChartData = Object.entries(messageTypeDistribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill:
      name === 'email'
        ? 'hsl(var(--primary))'
        : name === 'teams'
          ? 'hsl(var(--secondary))'
          : name === 'sms'
            ? 'hsl(var(--success))'
            : 'hsl(var(--accent))',
  }))

  return (
    <div className="space-y-6 p-6">
      {/* Header with Last Update */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Communication Overview</h2>
          <p className="text-muted-foreground">
            Monitor messages, notifications, and announcements across all channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="w-fit">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value={metrics?.totalMessages?.toString() || '0'}
          icon={Envelope}
          trend="up"
          change="+12"
          description="All channels"
          loading={isLoading}
        />
        <StatCard
          title="Sent Today"
          value={metrics?.sentToday?.toString() || '0'}
          icon={PaperPlaneTilt}
          trend="up"
          change="+8"
          description="Messages sent"
          loading={isLoading}
        />
        <StatCard
          title="Unread Notifications"
          value={metrics?.unreadNotifications?.toString() || '0'}
          icon={Bell}
          trend="down"
          change="-3"
          description="Require attention"
          loading={isLoading}
        />
        <StatCard
          title="Active Announcements"
          value={metrics?.activeAnnouncements?.toString() || '0'}
          icon={Megaphone}
          trend="neutral"
          description="Published"
          loading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Message Type Distribution */}
        <ResponsivePieChart
          title="Message Distribution by Channel"
          description="Messages grouped by communication channel"
          data={messageTypeChartData}
          innerRadius={60}
          loading={isLoading}
        />

        {/* Messages Over Time */}
        <ResponsiveLineChart
          title="Message Activity (Last 7 Days)"
          description="Daily message volume across all channels"
          data={messagesOverTimeData}
          height={300}
          showArea
          loading={isLoading}
        />
      </div>

      {/* Alert Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* High Priority Messages */}
        {highPriorityMessages.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Warning className="h-5 w-5 text-amber-500" />
                <CardTitle>High Priority Messages</CardTitle>
              </div>
              <CardDescription>Messages requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {highPriorityMessages.map((msg, idx) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{msg.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          From: {msg.from} • {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={msg.priority === 'urgent' ? 'destructive' : 'warning'}>
                        {msg.priority}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Urgent Notifications */}
        {urgentNotifications.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-500" />
                <CardTitle>Urgent Notifications</CardTitle>
              </div>
              <CardDescription>Critical notifications awaiting action</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {urgentNotifications.slice(0, 5).map((notif, idx) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{notif.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {notif.category.toUpperCase()} • {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={notif.type === 'error' ? 'destructive' : 'warning'}>
                        {notif.type}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

/**
 * Messages Tab - Message center and inbox
 */
function MessagesContent() {
  const { messages, recentMessages, metrics, isLoading, lastUpdate } = useReactiveCommunicationData()

  const deliveryRate = metrics.totalMessages > 0
    ? Math.round((metrics.messagesDelivered / metrics.totalMessages) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Message Center</h2>
          <p className="text-muted-foreground">
            Manage all communication channels in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Compose
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Messages"
          value={metrics?.totalMessages?.toString() || '0'}
          icon={Envelope}
          trend="up"
          description="All time"
          loading={isLoading}
        />
        <StatCard
          title="Delivered"
          value={metrics?.messagesDelivered?.toString() || '0'}
          icon={CheckCircle}
          trend="up"
          description={`${deliveryRate}% success rate`}
          loading={isLoading}
        />
        <StatCard
          title="Failed"
          value={metrics?.messagesFailed?.toString() || '0'}
          icon={Warning}
          trend="down"
          change="-2"
          description="Requires retry"
          loading={isLoading}
        />
        <StatCard
          title="Avg Response Time"
          value={metrics?.avgResponseTime || 'N/A'}
          icon={Clock}
          trend="down"
          change="-15min"
          description="Faster than last week"
          loading={isLoading}
        />
      </div>

      {/* Recent Messages List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Envelope className="h-5 w-5 text-blue-500" />
            <CardTitle>Recent Messages</CardTitle>
          </div>
          <CardDescription>Latest communications across all channels</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentMessages.length > 0 ? (
            <div className="space-y-3">
              {recentMessages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{msg.subject}</p>
                        {msg.attachments && msg.attachments > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {msg.attachments} attachment{msg.attachments > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        From: {msg.from} → To: {msg.to}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleString()} • via {msg.type.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          msg.status === 'read'
                            ? 'default'
                            : msg.status === 'delivered'
                              ? 'secondary'
                              : msg.status === 'failed'
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {msg.status}
                      </Badge>
                      {(msg.priority === 'high' || msg.priority === 'urgent') && (
                        <Badge variant="warning" className="text-xs">
                          {msg.priority}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Envelope className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Notifications Tab - Notification management
 */
function NotificationsContent() {
  const {
    notifications,
    unreadNotifications,
    notificationCategoryDistribution,
    metrics,
    isLoading,
    lastUpdate,
  } = useReactiveCommunicationData()

  // Prepare chart data for notification categories
  const notificationCategoryChartData = Object.entries(notificationCategoryDistribution).map(
    ([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    })
  )

  const readRate = notifications.length > 0
    ? Math.round(((notifications.length - unreadNotifications.length) / notifications.length) * 100)
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
          <p className="text-muted-foreground">
            Manage system and user notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          {unreadNotifications.length > 0 && (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Notifications"
          value={notifications.length.toString()}
          icon={Bell}
          trend="neutral"
          description="All notifications"
          loading={isLoading}
        />
        <StatCard
          title="Unread"
          value={unreadNotifications.length.toString()}
          icon={Warning}
          trend="down"
          change="-5"
          description="Require attention"
          loading={isLoading}
        />
        <StatCard
          title="Read Rate"
          value={`${readRate}%`}
          icon={TrendUp}
          trend="up"
          change="+3%"
          description="User engagement"
          loading={isLoading}
        />
      </div>

      {/* Notification Category Distribution */}
      <ResponsiveBarChart
        title="Notifications by Category"
        description="Distribution of notifications across different categories"
        data={notificationCategoryChartData}
        height={300}
        loading={isLoading}
      />

      {/* Unread Notifications List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" />
            <CardTitle>Unread Notifications ({unreadNotifications.length})</CardTitle>
          </div>
          <CardDescription>Notifications awaiting your attention</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : unreadNotifications.length > 0 ? (
            <div className="space-y-3">
              {unreadNotifications.map((notif, idx) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{notif.title}</p>
                        <Badge
                          variant={
                            notif.type === 'error'
                              ? 'destructive'
                              : notif.type === 'warning'
                                ? 'warning'
                                : notif.type === 'success'
                                  ? 'default'
                                  : 'secondary'
                          }
                          className="text-xs"
                        >
                          {notif.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {notif.category.toUpperCase()} • {new Date(notif.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {notif.actionUrl && (
                      <button className="ml-4 text-sm text-primary hover:underline">
                        View Details
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>All caught up! No unread notifications</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Announcements Tab - Company announcements
 */
function AnnouncementsContent() {
  const {
    announcements,
    activeAnnouncementsList,
    announcementEngagementData,
    metrics,
    isLoading,
    lastUpdate,
  } = useReactiveCommunicationData()

  const totalViews = announcements.reduce((sum, a) => sum + a.views, 0)
  const totalAcknowledged = announcements.reduce((sum, a) => sum + a.acknowledgedBy, 0)
  const avgEngagement = announcements.length > 0
    ? Math.round(
        announcements.reduce(
          (sum, a) => sum + (a.totalRecipients > 0 ? (a.acknowledgedBy / a.totalRecipients) * 100 : 0),
          0
        ) / announcements.length
      )
    : 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Announcements</h2>
          <p className="text-muted-foreground">
            Company-wide announcements and updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Last updated: {lastUpdate.toLocaleTimeString()}</Badge>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Active Announcements"
          value={metrics?.activeAnnouncements?.toString() || '0'}
          icon={Megaphone}
          trend="neutral"
          description="Currently published"
          loading={isLoading}
        />
        <StatCard
          title="Total Views"
          value={totalViews.toString()}
          icon={Eye}
          trend="up"
          change="+28"
          description="All announcements"
          loading={isLoading}
        />
        <StatCard
          title="Acknowledged"
          value={totalAcknowledged.toString()}
          icon={CheckCircle}
          trend="up"
          description="Users confirmed"
          loading={isLoading}
        />
        <StatCard
          title="Avg Engagement"
          value={`${avgEngagement}%`}
          icon={TrendUp}
          trend="up"
          change="+5%"
          description="Acknowledgment rate"
          loading={isLoading}
        />
      </div>

      {/* Announcement Engagement Chart */}
      <ResponsiveBarChart
        title="Announcement Engagement"
        description="Views and acknowledgments for recent announcements"
        data={announcementEngagementData}
        height={300}
        loading={isLoading}
      />

      {/* Active Announcements List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            <CardTitle>Active Announcements</CardTitle>
          </div>
          <CardDescription>Currently published announcements</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : activeAnnouncementsList.length > 0 ? (
            <div className="space-y-4">
              {activeAnnouncementsList.map((announcement, idx) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-lg border p-4 hover:bg-accent/50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <Badge
                          variant={
                            announcement.priority === 'high'
                              ? 'destructive'
                              : announcement.priority === 'normal'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {announcement.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {announcement.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        By {announcement.author} • Published{' '}
                        {new Date(announcement.publishDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm mb-3 line-clamp-2">{announcement.content}</p>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{announcement.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        {announcement.acknowledgedBy}/{announcement.totalRecipients} acknowledged
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>
                        {Math.round(
                          (announcement.acknowledgedBy / announcement.totalRecipients) * 100
                        )}
                        % engagement
                      </span>
                    </div>
                  </div>

                  {announcement.expiryDate && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires: {new Date(announcement.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Megaphone className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No active announcements</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Main CommunicationHub Component
 */
export default function CommunicationHub() {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <CommunicationIcon className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <CommunicationOverview />
        </ErrorBoundary>
      ),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <Envelope className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading messages...</div>}>
            <MessagesContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading notifications...</div>}>
            <NotificationsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
    {
      id: 'announcements',
      label: 'Announcements',
      icon: <Megaphone className="h-4 w-4" />,
      content: (
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6">Loading announcements...</div>}>
            <AnnouncementsContent />
          </Suspense>
        </ErrorBoundary>
      ),
    },
  ]

  return (
    <HubPage
      title="Communication Hub"
      description="Messaging, notifications, and announcements management"
      icon={<CommunicationIcon className="h-8 w-8" />}
      tabs={tabs}
      defaultTab="overview"
    />
  )
}
