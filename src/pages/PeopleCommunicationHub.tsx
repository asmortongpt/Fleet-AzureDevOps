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

import {
  Users,
  MessageSquare,
  Briefcase,
  User,
  Calendar,
  CheckSquare,
  Inbox,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Award,
  Target,
  TrendingUp,
  Hash,
  Megaphone,
  BookOpen,
  Plus,
  Video,
  ExternalLink,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import { toast } from 'sonner'
import useSWR, { mutate } from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import HubPage from '@/components/ui/hub-page'
import { Input } from '@/components/ui/input'
import { Section } from '@/components/ui/section'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  StatCard,
} from '@/components/visualizations'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime , formatNumber } from '@/utils/format-helpers'



const fetcher = apiFetcher

const rawFetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      return res.json()
    })

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

/**
 * People Tab - HR and team management
 */
const PeopleTabContent = memo(function PeopleTabContent() {
  const { data: users, error: usersError, isLoading: usersLoading } = useSWR<any[]>(
    '/api/users?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams, error: teamsError, isLoading: teamsLoading } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingCourses, error: trainingCoursesError, isLoading: trainingCoursesLoading } = useSWR<any[]>(
    '/api/training/courses?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingProgress, error: trainingProgressError, isLoading: trainingProgressLoading } = useSWR<any[]>(
    '/api/training/progress',
    fetcher,
    { shouldRetryOnError: false }
  )

  const peopleError = usersError || teamsError || trainingCoursesError || trainingProgressError
  const peopleLoading = usersLoading || teamsLoading || trainingCoursesLoading || trainingProgressLoading

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

  // P1-6: Renamed to "Recently Added Users" — sorted by created_at desc
  const recentUsers = useMemo(() => {
    return userRows
      .slice()
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 4)
      .map((user: any) => {
        return {
          isActive: user.status === 'active',
          name: user.name || `${user.first_name} ${user.last_name}`.trim(),
          department: user.role ? formatEnum(user.role) : 'Team Member',
          createdAt: user.created_at
        }
      })
  }, [userRows])

  const trainingProgressData = useMemo(() => {
    const courses = Array.isArray(trainingCourses) ? trainingCourses : []
    const progressRows = Array.isArray(trainingProgress) ? trainingProgress : []
    const progressByCourse = progressRows.reduce((acc: Record<string, { completed: number; total: number }>, row: any) => {
      const courseId = row.course_id
      if (!courseId) return acc
      if (!acc[courseId]) acc[courseId] = { completed: 0, total: 0 }
      acc[courseId].total += 1
      // P1-8: Fix training completion — completed_modules is a string (status column alias), not array
      // Only check numeric progress >= 100 or status string === 'completed'
      if (Number(row.progress) >= 100 || row.completed_modules === 'completed') {
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

  if (peopleError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load people data. Please try again.
      </div>
    )
  }

  // P1-5: Loading state
  if (peopleLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Total Employees"
          value={formatNumber(userRows.length)}
          icon={Users}
          description="Active team members"
        />
        <StatCard
          title="On Duty"
          value={formatNumber(activeUsers.length)}
          icon={UserCheck}
          description="Currently working"
        />
        {/* P0-2: Fix "On Leave" → "Inactive" — is_active===false means deactivated, not on leave */}
        <StatCard
          title="Inactive"
          value={formatNumber(inactiveUsers.length)}
          icon={UserX}
          description="Deactivated accounts"
        />
        <StatCard
          title="Avg Tenure"
          value={avgTenureYears > 0 ? `${avgTenureYears.toFixed(1)} yrs` : '\u2014'}
          icon={Award}
          description="Employee retention"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left Column: Team Overview */}
        {/* P1-11: Action button placeholder for team management */}
        <Section
          title="Team Overview"
          description="Department breakdown and headcount"
          icon={<Users className="h-4 w-4" />}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {teamRows.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-1.5">
                {teamRows.map((dept: any) => (
                  <div
                    key={dept.id}
                    className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5"
                    title="Team details coming soon"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Lead: {dept.team_lead_name || '\u2014'} -- {formatNumber(dept.member_count || 0)} members
                        </p>
                      </div>
                    </div>
                    <Badge variant={dept.is_active ? 'default' : 'secondary'}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Right Column: Recently Added Users + Training */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* P1-6: Renamed from "Recent Activity" to "Recently Added Users" */}
          <Section
            title="Recently Added Users"
            description="Newest team members"
            icon={<UserPlus className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentUsers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {recentUsers.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded border border-white/[0.08] bg-[#242424] p-2.5"
                      title="User details coming soon"
                    >
                      {/* P1-6: UserPlus for active, UserX for inactive */}
                      {user.isActive ? (
                        <UserPlus className="h-4 w-4 text-emerald-400 mt-0.5" />
                      ) : (
                        <UserX className="h-4 w-4 text-muted-foreground mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.department}
                        </p>
                        <p className="text-xs text-muted-foreground">Added on {formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Training & Development"
            description="Ongoing training programs"
            icon={<BookOpen className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {trainingProgressData.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {trainingProgressData.map((training) => {
                    // P1-7: Conditional progress bar colors
                    const completionPct = training.enrolled > 0 ? (training.completed / training.enrolled) * 100 : 0
                    return (
                      <div key={training.program} className="rounded border border-white/[0.08] bg-[#242424] p-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{training.program}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(training.completed)}/{formatNumber(training.enrolled)} ({Math.round(completionPct)}%)
                          </p>
                        </div>
                        <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-1.5">
                          <div
                            className={`rounded-full h-1.5 ${
                              completionPct > 75 ? 'bg-emerald-500' :
                              completionPct > 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${completionPct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
})

/**
 * Communication Tab - Messaging and announcements
 */
const CommunicationTabContent = memo(function CommunicationTabContent() {
  const { data: communicationLogs, error: communicationLogsError, isLoading: commLogsLoading } = useSWR<any[]>(
    '/api/communication-logs?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: announcements, error: announcementsError, isLoading: announcementsLoading } = useSWR<any[]>(
    '/api/announcements?limit=20',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: notifications, error: notificationsError, isLoading: notificationsLoading } = useSWR<any>(
    '/api/notifications?limit=50',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams, error: commTeamsError, isLoading: commTeamsLoading } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )

  const communicationError = communicationLogsError || announcementsError || notificationsError || commTeamsError
  const communicationLoading = commLogsLoading || announcementsLoading || notificationsLoading || commTeamsLoading

  const messages = Array.isArray(communicationLogs) ? communicationLogs : []
  const announcementRows = Array.isArray(announcements) ? announcements : []
  const channelRows = Array.isArray(teams) ? teams : []
  const unreadCount = typeof notifications?.data?.unread_count === 'number' ? notifications.data.unread_count : (typeof notifications?.unread_count === 'number' ? notifications.unread_count : 0)

  // Compute average response time from message timestamps (proxy: avg gap between consecutive messages)
  const avgResponseTime = useMemo(() => {
    if (messages.length < 2) return null
    const timestamps = messages
      .map((m: any) => new Date(m.created_at || m.createdAt || m.timestamp).getTime())
      .filter((t: number) => !isNaN(t))
      .sort((a: number, b: number) => a - b)
    if (timestamps.length < 2) return null
    let totalGap = 0
    for (let i = 1; i < timestamps.length; i++) {
      totalGap += timestamps[i] - timestamps[i - 1]
    }
    const avgMs = totalGap / (timestamps.length - 1)
    const avgMin = Math.round(avgMs / 60000)
    if (avgMin < 60) return `${avgMin}m`
    const hours = Math.round(avgMin / 60)
    return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
  }, [messages])

  if (communicationError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load communication data. Please try again.
      </div>
    )
  }

  // P1-5: Loading state
  if (communicationLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Unread Messages"
          value={formatNumber(unreadCount)}
          icon={Inbox}
          description="Team inbox"
        />
        <StatCard
          title="Active Channels"
          value={formatNumber(channelRows.length)}
          icon={Hash}
          description="Communication channels"
        />
        {/* P1-9: Fix "Announcements" KPI description — no date filter exists */}
        <StatCard
          title="Announcements"
          value={formatNumber(announcementRows.length)}
          icon={Megaphone}
          description="Total published"
        />
        <StatCard
          title="Response Time"
          value={avgResponseTime || '\u2014'}
          icon={Clock}
          description="Avg response"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left Column: Communication Log */}
        {/* P1-11: Add "Compose" button */}
        <Section
          title="Recent Messages"
          description="Latest team communications"
          icon={<MessageSquare className="h-4 w-4" />}
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
            ) : (
              <div className="space-y-1.5">
                {messages.slice(0, 8).map((msg: any) => (
                  <div
                    key={msg.id}
                    className="flex items-start gap-2 rounded border border-white/[0.08] bg-[#242424] p-2.5"
                    title="Message details coming soon"
                  >
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        {/* P0-3: Fix from_address → sender_name */}
                        <p className="text-sm font-medium text-foreground truncate">{msg.sender_name || 'System'}</p>
                        {/* P1-12: Fix is_read badge — use status field instead of non-existent is_read */}
                        {msg.status === 'pending' && <Badge variant="default">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.subject || msg.message_body || 'Message'}</p>
                      {/* P0-3: Fix sent_at → created_at */}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Right Column: Announcements + Channels */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Announcements"
            description="Company-wide notifications"
            icon={<Megaphone className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {announcementRows.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {announcementRows.slice(0, 5).map((announcement: any) => (
                    <div key={announcement.id} className="rounded border border-white/[0.08] bg-[#242424] p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="secondary">{formatEnum(announcement.type) || 'Announcement'}</Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(announcement.published_at)}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-foreground">{announcement.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Communication Channels"
            description="Team channels and groups"
            icon={<Hash className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {channelRows.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {channelRows.map((channel: any) => (
                    <div
                      key={channel.id}
                      className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5"
                      title="Channel details coming soon"
                    >
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">#{channel.name}</p>
                          <p className="text-xs text-muted-foreground">{formatNumber(channel.member_count || 0)} members</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
})

/**
 * Work Tab - Tasks, schedules, and collaboration
 */
const WorkTabContent = memo(function WorkTabContent() {
  const { push } = useDrilldown()
  const { data: tasks, error: tasksError, isLoading: tasksLoading } = useSWR<any[]>(
    '/api/tasks?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )

  // Calendar events for upcoming meetings
  const now = new Date()
  const calendarKey = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    return `/api/calendar/events?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
  }, [])
  const { data: calendarData } = useSWR<any>(
    calendarKey,
    fetcher,
    { shouldRetryOnError: false }
  )
  const meetings = useMemo(() => {
    const events = Array.isArray(calendarData?.events) ? calendarData.events : (Array.isArray(calendarData) ? calendarData : [])
    return events
      .filter((e: any) => e.event_type === 'meeting' || e.event_type === 'conference' || e.subject || e.attendees)
      .slice(0, 5)
  }, [calendarData])

  // Meeting detail dialog
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)

  const handleJoinMeeting = (meeting: any) => {
    const meetingUrl = meeting.onlineMeetingUrl || meeting.online_meeting_url || meeting.location
    if (meetingUrl && (meetingUrl.startsWith('http://') || meetingUrl.startsWith('https://'))) {
      window.open(meetingUrl, '_blank', 'noopener,noreferrer')
    } else {
      // Show meeting details dialog if no URL available
      setSelectedMeeting(meeting)
    }
  }

  // P0-4: Add Task dialog state
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', status: 'pending' })

  const taskRows = Array.isArray(tasks) ? tasks : []

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

  // P1-10: Fix productivity calculation — use tasks due this week as denominator
  const dueThisWeek = taskRows.filter((task: any) => {
    if (!task.dueDate) return false
    const due = new Date(task.dueDate)
    return due.getTime() >= now.getTime() - 7 * 24 * 60 * 60 * 1000 && due.getTime() <= now.getTime() + 7 * 24 * 60 * 60 * 1000
  })
  const productivity = dueThisWeek.length > 0
    ? Math.round((completedThisWeek.length / dueThisWeek.length) * 100)
    : (taskRows.length > 0 ? Math.round((completedThisWeek.length / taskRows.length) * 100) : 0)

  // P1-13: Cap tasks at 5 per column
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
        tasks: tasksForColumn.slice(0, 5)
      }
    })
  }, [taskRows])

  const handleViewTask = (task: any) => {
    push({
      id: task.id,
      type: 'task',
      label: task.title,
      data: { taskId: task.id, status: task.status, priority: task.priority, dueDate: task.dueDate },
    })
  }

  // P0-4: Create task handler
  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required')
      return
    }
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newTask)
      })
      if (res.ok) {
        toast.success('Task created')
        setShowAddTask(false)
        setNewTask({ title: '', description: '', priority: 'medium', status: 'pending' })
        mutate('/api/tasks?limit=200')
      } else {
        toast.error('Failed to create task')
      }
    } catch {
      toast.error('Failed to create task')
    }
  }

  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load tasks data. Please try again.
      </div>
    )
  }

  // P1-5: Loading state
  if (tasksLoading) {
    return (
      <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
        <div className="grid grid-cols-4 gap-1.5">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 p-1.5 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5">
        <StatCard
          title="Active Tasks"
          value={formatNumber(activeTasks.length)}
          icon={CheckSquare}
          description="Assigned to team"
        />
        <StatCard
          title="Completed This Week"
          value={formatNumber(completedThisWeek.length)}
          icon={Target}
          description="Task completion"
        />
        <StatCard
          title="Upcoming Deadlines"
          value={formatNumber(upcomingDeadlines.length)}
          icon={Calendar}
          description="Next 7 days"
        />
        {/* P1-10: Renamed to "Weekly Completion Rate" */}
        <StatCard
          title="Weekly Completion Rate"
          value={`${productivity}%`}
          icon={TrendingUp}
          description="Of all tasks"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* Left Column: Task Board */}
        {/* P0-4: Add Task button in Section actions */}
        <Section
          title="Task Board"
          description="Team tasks organized by status"
          icon={<CheckSquare className="h-4 w-4" />}
          actions={
            <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
              <Plus className="h-3 w-3 mr-1" /> Add Task
            </Button>
          }
        >
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-3 gap-1.5">
              {taskColumns.map((column) => (
                <div key={column.status}>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-semibold text-foreground">{column.status}</h3>
                    <Badge variant="outline" className="text-[10px]">{formatNumber(column.count)}</Badge>
                  </div>
                  <div className="space-y-1">
                    {column.tasks.length === 0 ? (
                      <div className="text-xs text-muted-foreground">No tasks</div>
                    ) : (
                      column.tasks.map((task: any) => {
                        // P1-13: Show due date, color red if overdue
                        const dueDate = task.dueDate ? new Date(task.dueDate) : null
                        const isOverdue = dueDate ? dueDate.getTime() < now.getTime() : false
                        return (
                          <div
                            key={task.id}
                            className="rounded border border-white/[0.08] bg-[#242424] p-2 cursor-pointer hover:bg-white/[0.04]"
                            onClick={() => push({
                              id: task.id,
                              type: 'task',
                              label: task.title,
                              data: { taskId: task.id, status: task.status, priority: task.priority, assignedTo: task.assignedToId },
                            })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                push({
                                  id: task.id,
                                  type: 'task',
                                  label: task.title,
                                  data: { taskId: task.id, status: task.status, priority: task.priority, assignedTo: task.assignedToId },
                                })
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label={`View details for task: ${task.title}`}
                          >
                            <p className="text-xs font-medium text-foreground">{task.title}</p>
                            <div className="flex items-center justify-between mt-1">
                              <Badge variant={
                                task.priority === 'high' || task.priority === 'urgent' ? 'destructive' :
                                task.priority === 'medium' ? 'secondary' : 'outline'
                              } className="text-[10px]">
                                {formatEnum(task.priority || 'low')}
                              </Badge>
                            </div>
                            {dueDate && (
                              <p className={`text-[10px] mt-1 ${isOverdue ? 'text-rose-400' : 'text-muted-foreground'}`}>
                                {isOverdue ? 'Overdue: ' : 'Due: '}{formatDate(task.dueDate)}
                              </p>
                            )}
                          </div>
                        )
                      })
                    )}
                    {/* P1-13: "View All" link when more tasks exist */}
                    {column.count > 5 && (
                      <button
                        className="text-xs text-emerald-400 hover:underline w-full text-center py-1"
                        onClick={() => push({
                          id: `tasks-${column.key}`,
                          type: 'tasks',
                          label: column.status,
                          data: { filter: column.key },
                        })}
                      >
                        View All ({formatNumber(column.count)})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Right Column: Upcoming Deadlines */}
        <div className="flex flex-col gap-1.5 min-h-0">
          {/* P1-13: Rename "This Week's Schedule" to "Upcoming Deadlines" */}
          <Section
            title="Upcoming Deadlines"
            description="Tasks due in the next 7 days"
            icon={<Calendar className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {upcomingDeadlines.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingDeadlines.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Due {formatDateTime(item.dueDate)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleViewTask(item)}>View</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>

          {/* Upcoming Meetings */}
          <Section
            title="Upcoming Meetings"
            description="Scheduled meetings this week"
            icon={<Video className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {meetings.length === 0 ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">No upcoming meetings</div>
              ) : (
                <div className="space-y-1.5">
                  {meetings.map((meeting: any) => (
                    <div key={meeting.id} className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{meeting.subject || meeting.title || 'Meeting'}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(meeting.start || meeting.start_time)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleJoinMeeting(meeting)}>
                        {(meeting.onlineMeetingUrl || meeting.online_meeting_url || (meeting.location && meeting.location.startsWith('http'))) ? (
                          <><ExternalLink className="h-3 w-3 mr-1" />Join</>
                        ) : (
                          'Details'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Meeting Details Dialog */}
      <Dialog open={!!selectedMeeting} onOpenChange={(open) => { if (!open) setSelectedMeeting(null); }}>
        <DialogContent className="bg-[#242424] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>{selectedMeeting?.subject || selectedMeeting?.title || 'Meeting Details'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Time</p>
              <p className="text-foreground">{formatDateTime(selectedMeeting?.start || selectedMeeting?.start_time)} - {formatDateTime(selectedMeeting?.end || selectedMeeting?.end_time)}</p>
            </div>
            {selectedMeeting?.location && (
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="text-foreground">{selectedMeeting.location}</p>
              </div>
            )}
            {selectedMeeting?.description && (
              <div>
                <p className="text-muted-foreground text-xs">Description</p>
                <p className="text-foreground text-xs">{selectedMeeting.description}</p>
              </div>
            )}
            {selectedMeeting?.attendees && (
              <div>
                <p className="text-muted-foreground text-xs">Attendees</p>
                <p className="text-foreground text-xs">
                  {Array.isArray(selectedMeeting.attendees)
                    ? selectedMeeting.attendees.map((a: any) => typeof a === 'string' ? a : (a.name || a.email || '')).join(', ')
                    : String(selectedMeeting.attendees)
                  }
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMeeting(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* P0-4: Add Task Dialog */}
      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="bg-[#242424] border-white/[0.08]">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={newTask.title}
              onChange={e => setNewTask(p => ({...p, title: e.target.value}))}
              className="bg-[#1a1a1a] border-white/[0.08]"
            />
            <Input
              placeholder="Description"
              value={newTask.description}
              onChange={e => setNewTask(p => ({...p, description: e.target.value}))}
              className="bg-[#1a1a1a] border-white/[0.08]"
            />
            <select
              className="w-full rounded-md bg-[#1a1a1a] border border-white/[0.08] text-white/80 p-2 text-sm"
              value={newTask.priority}
              onChange={e => setNewTask(p => ({...p, priority: e.target.value}))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button onClick={handleCreateTask}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
      className="cta-hub"
    >
      <div className="flex flex-col h-full gap-1.5 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
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
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>

              <TabsContent value="people" className="flex-1 min-h-0 overflow-y-auto">
                <QueryErrorBoundary>
                  <PeopleTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="communication" className="flex-1 min-h-0 overflow-y-auto">
                <QueryErrorBoundary>
                  <CommunicationTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="work" className="flex-1 min-h-0 overflow-y-auto">
                <QueryErrorBoundary>
                  <WorkTabContent />
                </QueryErrorBoundary>
              </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
