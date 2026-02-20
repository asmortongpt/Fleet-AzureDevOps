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
  Activity,
  BookOpen
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'

import useSWR from 'swr'

import { apiFetcher } from '@/lib/api-fetcher'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import HubPage from '@/components/ui/hub-page'
import { Section } from '@/components/ui/section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  StatCard,
} from '@/components/visualizations'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime } from '@/utils/format-helpers'
import { formatNumber } from '@/utils/format-helpers'



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
  const { push } = useDrilldown()
  const { data: users, error: usersError } = useSWR<any[]>(
    '/api/users?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams, error: teamsError } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingCourses, error: trainingCoursesError } = useSWR<any[]>(
    '/api/training/courses?limit=200',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: trainingProgress, error: trainingProgressError } = useSWR<any[]>(
    '/api/training/progress',
    fetcher,
    { shouldRetryOnError: false }
  )

  const peopleError = usersError || teamsError || trainingCoursesError || trainingProgressError

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
      .map((user: any) => {
        const activityType = user.status ? formatEnum(user.status) : 'Added'
        return {
          type: activityType,
          name: user.name || `${user.first_name} ${user.last_name}`.trim(),
          department: user.role ? formatEnum(user.role) : 'Team Member',
          date: formatDate(user.created_at)
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

  if (peopleError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load people data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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
        <StatCard
          title="On Leave"
          value={formatNumber(inactiveUsers.length)}
          icon={UserX}
          description="PTO / Vacation"
        />
        <StatCard
          title="Avg Tenure"
          value={avgTenureYears > 0 ? `${avgTenureYears.toFixed(1)} yrs` : '—'}
          icon={Award}
          description="Employee retention"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left Column: Employee List */}
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
                    className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5 cursor-pointer hover:bg-white/[0.04]"
                    onClick={() => push({
                      id: dept.id,
                      type: 'team',
                      label: dept.name,
                      data: { teamId: dept.id, teamLead: dept.team_lead_name, memberCount: dept.member_count, isActive: dept.is_active },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: dept.id,
                          type: 'team',
                          label: dept.name,
                          data: { teamId: dept.id, teamLead: dept.team_lead_name, memberCount: dept.member_count, isActive: dept.is_active },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for team ${dept.name}`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Lead: {dept.team_lead_name || '—'} -- {formatNumber(dept.member_count || 0)} members
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

        {/* Right Column: Recent Activity + Training */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="Recent Activity"
            description="Latest HR updates"
            icon={<Activity className="h-4 w-4" />}
          >
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
              ) : (
                <div className="space-y-1.5">
                  {recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 rounded border border-white/[0.08] bg-[#242424] p-2.5 cursor-pointer hover:bg-white/[0.04]"
                      onClick={() => push({
                        id: `activity-${index}`,
                        type: 'user',
                        label: activity.name,
                        data: { name: activity.name, department: activity.department, type: activity.type, date: activity.date },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          push({
                            id: `activity-${index}`,
                            type: 'user',
                            label: activity.name,
                            data: { name: activity.name, department: activity.department, type: activity.type, date: activity.date },
                          })
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${activity.name}`}
                    >
                      <UserPlus className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.name} -- {activity.department}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.date}</p>
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
                  {trainingProgressData.map((training) => (
                    <div key={training.program} className="rounded border border-white/[0.08] bg-[#242424] p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{training.program}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(training.completed)}/{formatNumber(training.enrolled)} ({training.enrolled > 0 ? Math.round((training.completed / training.enrolled) * 100) : 0}%)
                        </p>
                      </div>
                      <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-1.5">
                        <div
                          className="bg-foreground/60 rounded-full h-1.5"
                          style={{ width: `${training.enrolled > 0 ? (training.completed / training.enrolled) * 100 : 0}%` }}
                        />
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
 * Communication Tab - Messaging and announcements
 */
const CommunicationTabContent = memo(function CommunicationTabContent() {
  const { push } = useDrilldown()
  const { data: communicationLogs, error: communicationLogsError } = useSWR<any[]>(
    '/api/communication-logs?limit=50',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: announcements, error: announcementsError } = useSWR<any[]>(
    '/api/announcements?limit=20',
    fetcher,
    { shouldRetryOnError: false }
  )
  const { data: notifications, error: notificationsError } = useSWR<any>(
    '/api/notifications?limit=50',
    rawFetcher,
    { shouldRetryOnError: false }
  )
  const { data: teams, error: commTeamsError } = useSWR<any[]>(
    '/api/internal-teams',
    fetcher,
    { shouldRetryOnError: false }
  )

  const communicationError = communicationLogsError || announcementsError || notificationsError || commTeamsError

  const messages = Array.isArray(communicationLogs) ? communicationLogs : []
  const announcementRows = Array.isArray(announcements) ? announcements : []
  const channelRows = Array.isArray(teams) ? teams : []
  const unreadCount = typeof notifications?.unread_count === 'number' ? notifications.unread_count : 0

  if (communicationError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load communication data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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
        <StatCard
          title="Announcements"
          value={formatNumber(announcementRows.length)}
          icon={Megaphone}
          description="This week"
        />
        <StatCard
          title="Response Time"
          value="—"
          icon={Clock}
          description="Avg response"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left Column: Communication Log */}
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
                    className="flex items-start gap-2 rounded border border-white/[0.08] bg-[#242424] p-2.5 cursor-pointer hover:bg-white/[0.04]"
                    onClick={() => push({
                      id: msg.id,
                      type: 'user',
                      label: msg.from_address || 'System',
                      data: { messageId: msg.id, from: msg.from_address, subject: msg.subject, sentAt: msg.sent_at },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: msg.id,
                          type: 'user',
                          label: msg.from_address || 'System',
                          data: { messageId: msg.id, from: msg.from_address, subject: msg.subject, sentAt: msg.sent_at },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View details for message from ${msg.from_address || 'System'}`}
                  >
                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{msg.from_address || 'System'}</p>
                        {!msg.is_read && <Badge variant="default">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{msg.subject || msg.message_body || 'Message'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(msg.sent_at)}
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
                      className="flex items-center justify-between rounded border border-white/[0.08] bg-[#242424] p-2.5 cursor-pointer hover:bg-white/[0.04]"
                      onClick={() => push({
                        id: channel.id,
                        type: 'team',
                        label: channel.name,
                        data: { teamId: channel.id, memberCount: channel.member_count },
                      })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          push({
                            id: channel.id,
                            type: 'team',
                            label: channel.name,
                            data: { teamId: channel.id, memberCount: channel.member_count },
                          })
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for channel ${channel.name}`}
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
  const { data: tasks, error: tasksError } = useSWR<any[]>(
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

  const handleViewTask = (task: any) => {
    push({
      id: task.id,
      type: 'task',
      label: task.title,
      data: { taskId: task.id, status: task.status, priority: task.priority, dueDate: task.dueDate },
    })
  }

  if (tasksError) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Unable to load tasks data. Please try again.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-1.5 p-1.5 overflow-hidden">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-1.5 shrink-0">
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
        <StatCard
          title="Team Productivity"
          value={productivity > 0 ? `${productivity}%` : '—'}
          icon={TrendingUp}
          description="Task completion rate"
        />
      </div>

      {/* Main Content: Two columns */}
      <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-1 gap-1.5 overflow-hidden">
        {/* Left Column: Task Board */}
        <Section
          title="Task Board"
          description="Team tasks organized by status"
          icon={<CheckSquare className="h-4 w-4" />}
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
                      column.tasks.map((task: any) => (
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
                              task.priority === 'high' ? 'destructive' :
                              task.priority === 'medium' ? 'secondary' : 'outline'
                            } className="text-[10px]">
                              {formatEnum(task.priority || 'low')}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Right Column: Task List + Schedule */}
        <div className="flex flex-col gap-1.5 min-h-0">
          <Section
            title="This Week's Schedule"
            description="Important meetings and deadlines"
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
        </div>
      </div>
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

              <TabsContent value="people" className="flex-1 min-h-0 overflow-hidden">
                <QueryErrorBoundary>
                  <PeopleTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="communication" className="flex-1 min-h-0 overflow-hidden">
                <QueryErrorBoundary>
                  <CommunicationTabContent />
                </QueryErrorBoundary>
              </TabsContent>

              <TabsContent value="work" className="flex-1 min-h-0 overflow-hidden">
                <QueryErrorBoundary>
                  <WorkTabContent />
                </QueryErrorBoundary>
              </TabsContent>
        </Tabs>
      </div>
    </HubPage>
  )
}
