/**
 * PeopleCommunicationHub - Consolidated People & Communication Dashboard
 *
 * Consolidates:
 * - PeopleHub (HR, team management, employee data)
 * - CommunicationHub (messaging, notifications, announcements)
 * - WorkHub (tasks, schedules, collaboration)
 *
 * Features:
 * - Team and employee management
 * - Internal communication and messaging
 * - Task and schedule coordination
 * - Collaboration tools
 * - WCAG 2.1 AA accessibility
 * - Performance optimized
 */

import { useState, Suspense, lazy, memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  MessageSquare,
  Briefcase,
  User,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  Bell,
  Send,
  Inbox,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Award,
  Target,
  TrendingUp,
  AlertCircle,
  FileText,
  Video,
  Hash,
  Megaphone,
  Activity,
  BookOpen
} from 'lucide-react'
import HubPage from '@/components/ui/hub-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import toast from 'react-hot-toast'
import logger from '@/utils/logger';
import {
  StatCard,
  ResponsiveBarChart,
  ResponsiveLineChart,
  ResponsivePieChart,
} from '@/components/visualizations'
import useSWR from 'swr'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const fadeInVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const staggerContainerVariant = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
}

const fetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())
    .then((data) => data?.data ?? data)

const rawFetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => res.json())

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * People Tab - HR and team management
 */
const PeopleTabContent = memo(function PeopleTabContent() {
  const { data: users } = useSWR<any[]>(
    '/api/users?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingCourses } = useSWR<any[]>(
    '/api/training/courses?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingProgress } = useSWR<any[]>(
    '/api/training/progress',
    fetcher,
    { shouldRetryOnError: false }
  )

  const userRows = Array.isArray(users) ? users : []
  const teamRows = Array.isArray(teams) ? teams : []

  const activeUsers = userRows.filter((user: any) => user.status === 'active')
  const inactiveUsers = userRows.filter((user: any) => user.status !== 'active')

  const avgTenureYears = useMemo(() => {
    const tenureYears = userRows
      .map((user: any) => user.created_at)
      .filter(Boolean)
      .map((date: string) => {
        const created = new Date(date)
        if (Number.isNaN(created.getTime())) return 0
        return (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365)
      })
      .filter((years: number) => years > 0)
    if (tenureYears.length === 0) return 0
    return tenureYears.reduce((sum, years) => sum + years, 0) / tenureYears.length
  }, [userRows])

  const recentActivity = useMemo(() => {
    return userRows
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 4)
      .map((user: any) => ({
        type: 'New Hire',
        name: user.name || `${user.first_name} ${user.last_name}`.trim(),
        department: user.role || 'Team Member',
        date: user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'
      }))
  }, [userRows])

  const trainingProgressData = useMemo(() => {
    const courses = Array.isArray(trainingCourses) ? trainingCourses : []
    const progressRows = Array.isArray(trainingProgress) ? trainingProgress : []
    const progressByCourse = progressRows.reduce((acc: Record<string, { completed: number; total: number }>, row: any) => {
      const courseId = row.course_id
      if (!courseId) return acc
      if (!acc[courseId]) acc[courseId] = { completed: 0, total: 0 }
      acc[courseId].total += 1
      if (Number(row.progress) >= 100 || row.completed_modules?.length === row.total_modules?.length) {
        acc[courseId].completed += 1
      }
      return acc
    }, {})

    return courses.map((course: any) => {
      const stats = progressByCourse[course.id] || { completed: 0, total: 0 }
      return {
        program: course.title || 'Training Program',
        enrolled: stats.total,
        completed: stats.completed
      }
    }).filter((course: any) => course.enrolled > 0)
  }, [trainingCourses, trainingProgress])

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* People Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={userRows.length}
          icon={Users}
          description="Active team members"
        />
        <StatCard
          title="On Duty"
          value={activeUsers.length}
          icon={UserCheck}
          description="Currently working"
        />
        <StatCard
          title="On Leave"
          value={inactiveUsers.length}
          icon={UserX}
          description="PTO/vacation"
        />
        <StatCard
          title="Avg Tenure"
          value={avgTenureYears > 0 ? `${avgTenureYears.toFixed(1)} yrs` : "—"}
          icon={Award}
          description="Employee retention"
        />
      </motion.div>

      {/* Team Overview */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Overview
            </CardTitle>
            <CardDescription>Department breakdown and headcount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No teams configured.</div>
              ) : (
                teamRows.map((dept: any) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Lead: {dept.team_lead_name || 'Unassigned'} · {dept.member_count || 0} members
                        </p>
                      </div>
                    </div>
                    <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest HR updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent activity.</div>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.name} · {activity.department}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.date}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Training & Development
            </CardTitle>
            <CardDescription>Ongoing training programs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingProgressData.length === 0 ? (
                <div className="text-sm text-muted-foreground">No training data available.</div>
              ) : (
                trainingProgressData.map((training) => (
                  <div key={training.program} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{training.program}</p>
                      <p className="text-sm text-muted-foreground">
                        {training.completed}/{training.enrolled} ({Math.round((training.completed / training.enrolled) * 100)}%)
                      </p>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{ width: `${training.enrolled > 0 ? (training.completed / training.enrolled) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Communication Tab - Messaging and announcements
 */
const CommunicationTabContent = memo(function CommunicationTabContent() {
  const { data: communicationLogs } = useSWR<any[]>(
    '/api/communication-logs?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: announcements } = useSWR<any[]>(
    '/api/announcements?limit=20',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: notifications } = useSWR<any>(
    '/api/notifications?limit=50',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )

  const messages = Array.isArray(communicationLogs) ? communicationLogs : []
  const announcementRows = Array.isArray(announcements) ? announcements : []
  const channelRows = Array.isArray(teams) ? teams : []
  const unreadCount = typeof notifications?.unread_count === 'number' ? notifications.unread_count : 0

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Communication Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Unread Messages"
          value={unreadCount}
          icon={Inbox}
          description="Team inbox"
        />
        <StatCard
          title="Active Channels"
          value={channelRows.length}
          icon={Hash}
          description="Communication channels"
        />
        <StatCard
          title="Announcements"
          value={announcementRows.length}
          icon={Megaphone}
          description="This week"
        />
        <StatCard
          title="Response Time"
          value="—"
          icon={Clock}
          description="Avg response"
        />
      </motion.div>

      {/* Recent Messages */}
      <motion.div variants={fadeInVariant} className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Messages
            </CardTitle>
            <CardDescription>Latest team communications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent messages.</div>
              ) : (
                messages.slice(0, 5).map((msg: any) => (
                  <div key={msg.id} className={`flex items-start gap-3 p-3 border rounded-lg ${msg.is_read ? '' : 'bg-blue-50 dark:bg-blue-950'}`}>
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{msg.from_address || 'System'}</p>
                        {!msg.is_read && <Badge variant="default">New</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{msg.subject || msg.message_body || 'Message'}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
            <CardDescription>Company-wide notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {announcementRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No announcements available.</div>
              ) : (
                announcementRows.slice(0, 5).map((announcement: any) => (
                  <div key={announcement.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary">{announcement.type || 'Announcement'}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {announcement.published_at ? new Date(announcement.published_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <p className="font-medium">{announcement.title}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Communication Channels */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Communication Channels
            </CardTitle>
            <CardDescription>Team channels and groups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {channelRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">No communication channels available.</div>
              ) : (
                channelRows.map((channel: any) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">#{channel.name}</p>
                        <p className="text-sm text-muted-foreground">{channel.member_count || 0} members</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

/**
 * Work Tab - Tasks, schedules, and collaboration
 */
const WorkTabContent = memo(function WorkTabContent() {
  const { data: tasks } = useSWR<any[]>(
    '/api/tasks?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )

  const taskRows = Array.isArray(tasks) ? tasks : []
  const now = new Date()

  const activeTasks = taskRows.filter((task: any) => (task.status || '').toLowerCase() !== 'completed')
  const completedThisWeek = taskRows.filter((task: any) => {
    if ((task.status || '').toLowerCase() !== 'completed') return false
    const completedAt = task.completedAt ? new Date(task.completedAt) : null
    if (!completedAt) return false
    return completedAt.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000
  })
  const upcomingDeadlines = taskRows.filter((task: any) => {
    if (!task.dueDate) return false
    const due = new Date(task.dueDate)
    return due.getTime() >= now.getTime() && due.getTime() <= now.getTime() + 7 * 24 * 60 * 60 * 1000
  })

  const productivity = taskRows.length > 0
    ? Math.round((completedThisWeek.length / taskRows.length) * 100)
    : 0

  const taskColumns = useMemo(() => {
    const columns = [
      { status: 'To Do', key: 'pending' },
      { status: 'In Progress', key: 'in_progress' },
      { status: 'Completed', key: 'completed' },
    ]

    return columns.map((column) => {
      const tasksForColumn = taskRows.filter((task: any) => (task.status || '').toLowerCase() === column.key)
      return {
        ...column,
        count: tasksForColumn.length,
        tasks: tasksForColumn.slice(0, 3)
      }
    })
  }, [taskRows])

  // Handler for joining meetings
  const handleJoinMeeting = (eventName: string) => {
    toast.success(`Joining meeting: ${eventName}`)
    logger.info('Join meeting clicked:', eventName)
    // TODO: Add real meeting join functionality (Teams/Outlook integration)
  }

  return (
    <motion.div
      variants={staggerContainerVariant}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Work Statistics */}
      <motion.div variants={fadeInVariant} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Tasks"
          value={activeTasks.length}
          icon={CheckSquare}
          description="Assigned to team"
        />
        <StatCard
          title="Completed This Week"
          value={completedThisWeek.length}
          icon={Target}
          description="Task completion"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={upcomingDeadlines.length}
          icon={Calendar}
          description="Next 7 days"
        />
        <StatCard
          title="Team Productivity"
          value={productivity > 0 ? `${productivity}%` : "—"}
          icon={TrendingUp}
          description="Task completion rate"
        />
      </motion.div>

      {/* Task Board */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Task Board
            </CardTitle>
            <CardDescription>Team tasks organized by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {taskColumns.map((column) => (
                <div key={column.status} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{column.status}</h3>
                    <Badge variant="outline">{column.count}</Badge>
                  </div>
                  <div className="space-y-2">
                    {column.tasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No tasks</div>
                    ) : (
                      column.tasks.map((task: any) => (
                        <div key={task.id} className="p-3 border rounded-lg bg-card">
                          <p className="font-medium text-sm">{task.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">{task.assignedToId || 'Unassigned'}</p>
                            <Badge variant={
                              task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {task.priority || 'low'}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Schedule */}
      <motion.div variants={fadeInVariant}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              This Week's Schedule
            </CardTitle>
            <CardDescription>Important meetings and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.length === 0 ? (
                <div className="text-sm text-muted-foreground">No upcoming deadlines.</div>
              ) : (
                upcomingDeadlines.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due {item.dueDate ? new Date(item.dueDate).toLocaleString() : '—'}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleJoinMeeting(item.title)}>View</Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PeopleCommunicationHub() {
  const [activeTab, setActiveTab] = useState('people')

  return (
    <HubPage
      title="People & Communication"
      description="Team management, internal communication, and work coordination"
      icon={Users}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="people" className="flex items-center gap-2" data-testid="hub-tab-people">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">People</span>
            </TabsTrigger>
            <TabsTrigger value="communication" className="flex items-center gap-2" data-testid="hub-tab-communication">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Communication</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2" data-testid="hub-tab-work">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Work</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="people" className="mt-6">
                <ErrorBoundary>
                  <PeopleTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="communication" className="mt-6">
                <ErrorBoundary>
                  <CommunicationTabContent />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="work" className="mt-6">
                <ErrorBoundary>
                  <WorkTabContent />
                </ErrorBoundary>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </HubPage>
  )
}
