/**
 * PeopleCommunicationHub - Command Center Redesign
 *
 * People-focused directory layout with:
 * - HeroMetrics inline strip (Total Employees, On Duty, Avg Tenure)
 * - Responsive people directory grid (3-4 cols) with avatar, name, role, department, status dot
 * - Click-to-open profile flyout (via DrilldownContext)
 * - Communication tab: Slack-style message thread list
 * - Simple horizontal tabs: People, Communication
 */

import {
  Users,
  MessageSquare,
  Clock,
  UserCheck,
  Award,
  Search,
  Inbox,
  Hash,
  Megaphone,
  BookOpen,
} from 'lucide-react'
import { useState, memo, useMemo } from 'react'
import useSWR from 'swr'

import { QueryErrorBoundary } from '@/components/errors/QueryErrorBoundary'
import { Badge } from '@/components/ui/badge'
import { GlowCard } from '@/components/ui/glow-card'
import { HeroMetrics, type HeroMetric } from '@/components/ui/hero-metrics'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { apiFetcher } from '@/lib/api-fetcher'
import { formatEnum } from '@/utils/format-enum'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format-helpers'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts'

const fetcher = apiFetcher

const rawFetcher = (url: string) =>
  fetch(url, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      return res.json()
    })

// ============================================================================
// HELPERS
// ============================================================================

/** Extract initials from a name string (up to 2 chars). */
function getInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return parts[0].slice(0, 2).toUpperCase()
}

/** Deterministic color for avatar backgrounds based on name hash. */
const avatarColors = [
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-teal-600',
  'bg-orange-600',
  'bg-cyan-600',
  'bg-fuchsia-600',
  'bg-lime-600',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

// ============================================================================
// PEOPLE DIRECTORY TAB
// ============================================================================

const PeopleTabContent = memo(function PeopleTabContent() {
  const { push } = useDrilldown()
  const [searchQuery, setSearchQuery] = useState('')

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

  // Only block on critical data — training is supplementary
  const peopleError = usersError
  const peopleLoading = usersLoading || teamsLoading

  const userRows = Array.isArray(users) ? users : []
  const teamRows = Array.isArray(teams) ? teams : []

  const activeUsers = userRows.filter((user: any) => user.status === 'active')

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

  // Build a lookup: team id -> team name
  const teamNameById = useMemo(() => {
    const map: Record<string, string> = {}
    teamRows.forEach((t: any) => { if (t.id && t.name) map[t.id] = t.name })
    return map
  }, [teamRows])

  // Training progress data
  const trainingProgressData = useMemo(() => {
    const courses = Array.isArray(trainingCourses) ? trainingCourses : []
    const progressRows = Array.isArray(trainingProgress) ? trainingProgress : []
    const progressByCourse = progressRows.reduce((acc: Record<string, { completed: number; total: number }>, row: any) => {
      const courseId = row.course_id
      if (!courseId) return acc
      if (!acc[courseId]) acc[courseId] = { completed: 0, total: 0 }
      acc[courseId].total += 1
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

  // Normalize people list
  const people = useMemo(() => {
    return userRows.map((user: any) => {
      const name = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown'
      const role = user.role ? formatEnum(user.role) : 'Team Member'
      const department = user.team_id ? (teamNameById[user.team_id] || 'Unassigned') : (user.department || 'Unassigned')
      const isActive = user.status === 'active'
      return { id: user.id, name, role, department, isActive, email: user.email }
    })
  }, [userRows, teamNameById])

  // Filter by search
  const filteredPeople = useMemo(() => {
    if (!searchQuery.trim()) return people
    const q = searchQuery.toLowerCase()
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
    )
  }, [people, searchQuery])

  // Role distribution
  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    people.forEach((p) => {
      const r = p.role || 'Unknown'
      counts[r] = (counts[r] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([role, count]) => ({ role, count, pct: people.length > 0 ? Math.round((count / people.length) * 100) : 0 }))
  }, [people])

  // Department distribution
  const deptDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    people.forEach((p) => {
      const d = p.department || 'Unassigned'
      counts[d] = (counts[d] || 0) + 1
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([dept, count]) => ({ dept, count, pct: people.length > 0 ? Math.round((count / people.length) * 100) : 0 }))
  }, [people])

  // Recent hires (users created in last 90 days)
  const recentHires = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    return people
      .filter((p) => {
        const user = userRows.find((u: any) => u.id === p.id)
        if (!user?.created_at) return false
        return new Date(user.created_at).getTime() > ninetyDaysAgo
      })
      .slice(0, 5)
  }, [people, userRows])

  // Headcount trend — monthly new hires over last 6 months
  const headcountTrend = useMemo(() => {
    const now = new Date()
    const months: { label: string; month: number; year: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({ label: d.toLocaleString('default', { month: 'short' }), month: d.getMonth(), year: d.getFullYear() })
    }
    return months.map((m) => {
      const count = userRows.filter((u: any) => {
        if (!u.created_at) return false
        const d = new Date(u.created_at)
        return d.getMonth() === m.month && d.getFullYear() === m.year
      }).length
      return { name: m.label, hires: count }
    })
  }, [userRows])

  // HeroMetrics data
  const heroMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'Total Employees',
      value: userRows.length,
      icon: Users,
      accent: 'emerald' as const,
      trend: 'up' as const,
      change: userRows.length > 0 ? Math.round((activeUsers.length / userRows.length) * 100) : 0,
    },
    {
      label: 'On Duty',
      value: activeUsers.length,
      icon: UserCheck,
      accent: 'emerald' as const,
      trend: activeUsers.length > userRows.length * 0.5 ? 'up' as const : 'down' as const,
      change: userRows.length > 0 ? Math.round((activeUsers.length / userRows.length) * 100) : 0,
    },
    {
      label: 'Teams',
      value: teamRows.length,
      icon: Users,
      accent: 'gray' as const,
    },
    {
      label: 'Avg Tenure',
      value: avgTenureYears > 0 ? `${avgTenureYears.toFixed(1)} yrs` : '\u2014',
      icon: Award,
      accent: 'amber' as const,
      trend: avgTenureYears >= 1 ? 'up' as const : 'neutral' as const,
      change: avgTenureYears > 0 ? Math.round(avgTenureYears * 10) : undefined,
    },
  ], [userRows.length, activeUsers.length, teamRows.length, avgTenureYears])

  const handlePersonClick = (person: typeof people[0]) => {
    push({
      id: person.id,
      type: 'user',
      label: person.name,
      data: {
        userId: person.id,
        userName: person.name,
        role: person.role,
        department: person.department,
        email: person.email,
      },
    })
  }

  if (peopleError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load people data. Please try again.
      </div>
    )
  }

  if (peopleLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-8">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 flex-1" />)}
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={heroMetrics} className="border-b border-white/[0.08]" />

      {/* Workforce Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-b border-white/[0.08]">
        {/* Role Distribution — Donut Chart */}
        <div className="px-6 py-4 border-r border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Role Distribution</h3>
            <span className="text-[11px] text-white/25">{roleDistribution.length} roles</span>
          </div>
          {roleDistribution.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <RechartsPieChart>
                  <Pie
                    data={roleDistribution.slice(0, 5).map(r => ({ name: r.role, value: r.count }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={48}
                    dataKey="value"
                    stroke="none"
                  >
                    {roleDistribution.slice(0, 5).map((_, idx) => (
                      <Cell key={idx} fill={['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#14b8a6'][idx % 5]} opacity={0.7} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {roleDistribution.slice(0, 5).map(({ role, count, pct }, idx) => (
                  <div key={role} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ['#10b981', '#f59e0b', '#ef4444', '#6b7280', '#14b8a6'][idx % 5] }} />
                    <span className="text-[11px] text-white/50 truncate flex-1">{role}</span>
                    <span className="text-[11px] text-white/30 tabular-nums">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/25">No role data</p>
          )}
        </div>

        {/* Workforce Stats */}
        <div className="px-6 py-4 border-r border-white/[0.08]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Workforce</h3>
          </div>
          <div className="space-y-3">
            {/* Active rate bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/60">Active Rate</span>
                <span className="text-xs font-semibold text-emerald-400">{people.length > 0 ? '100%' : '0%'}</span>
              </div>
              <div className="w-full h-4 rounded bg-white/[0.04] overflow-hidden">
                <div className="h-full rounded" style={{ width: '100%', background: 'linear-gradient(90deg, rgba(16,185,129,0.6) 0%, rgba(16,185,129,0.3) 100%)' }} />
              </div>
            </div>
            {/* Role breakdown with gradient bars */}
            {roleDistribution.slice(0, 3).map(({ role, count, pct }) => (
              <div key={role}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-white/60">{role}</span>
                  <span className="text-xs text-white/40">{count} ({pct}%)</span>
                </div>
                <div className="w-full h-4 rounded bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded" style={{
                    width: `${Math.max(pct, 3)}%`,
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.6) 0%, rgba(245,158,11,0.3) 100%)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Headcount Trend — AreaChart */}
        <div className="px-6 py-4">
          <GlowCard accent="#10b981">
          <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Headcount Trend</h3>
            <span className="text-[11px] text-white/25">Last 6 months</span>
          </div>
          {headcountTrend.some(d => d.hires > 0) ? (
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={headcountTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="peopleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="hires" stroke="#10b981" strokeWidth={2} fill="url(#peopleGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[130px] text-white/25 text-xs">No hire data available</div>
          )}
          </div>
          </GlowCard>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-3 border-b border-white/[0.08] flex items-center justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <Input
            placeholder="Search people by name, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/30 focus:border-emerald-500/50 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-white/30">{filteredPeople.length} of {people.length} people</span>
      </div>

      {/* People Directory Grid */}
      <div className="px-6 py-4 overflow-y-auto">
        {filteredPeople.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-white/40 text-sm">
            {searchQuery ? 'No people match your search.' : 'No people found.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                className="group flex items-center gap-3 rounded-lg p-3 cursor-pointer hover:bg-white/[0.07] hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,185,129,0.08)] transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${
                    person.role === 'Admin' ? '#f59e0b'
                    : person.role === 'Fleet Manager' ? '#a855f7'
                    : '#10b981'
                  }`,
                }}
                onClick={() => handlePersonClick(person)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handlePersonClick(person)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View profile for ${person.name}`}
              >
                {/* Avatar circle */}
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${avatarColor(person.name)}`}>
                  {getInitials(person.name)}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#242424] ${person.isActive ? 'bg-emerald-400' : 'bg-white/20'}`}
                  />
                </div>

                {/* Name / Role / Department */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors">
                    {person.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: person.role === 'Admin' ? 'rgba(245,158,11,0.15)'
                          : person.role === 'Fleet Manager' ? 'rgba(168,85,247,0.15)'
                          : 'rgba(16,185,129,0.1)',
                        color: person.role === 'Admin' ? '#f59e0b'
                          : person.role === 'Fleet Manager' ? '#a855f7'
                          : '#10b981',
                      }}
                    >{person.role}</span>
                    <span className="text-[10px] text-white/25">{person.department}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
})

// ============================================================================
// COMMUNICATION TAB (Slack-style thread list)
// ============================================================================

const CommunicationTabContent = memo(function CommunicationTabContent() {
  const { push } = useDrilldown()

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

  // Avg response time computation
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

  // HeroMetrics for communication
  const commMetrics: HeroMetric[] = useMemo(() => [
    {
      label: 'Unread',
      value: formatNumber(unreadCount),
      icon: Inbox,
      accent: unreadCount > 0 ? 'rose' as const : 'gray' as const,
    },
    {
      label: 'Channels',
      value: formatNumber(channelRows.length),
      icon: Hash,
      accent: 'emerald' as const,
    },
    {
      label: 'Announcements',
      value: formatNumber(announcementRows.length),
      icon: Megaphone,
      accent: 'amber' as const,
    },
    {
      label: 'Avg Response',
      value: avgResponseTime || '\u2014',
      icon: Clock,
      accent: 'gray' as const,
    },
  ], [unreadCount, channelRows.length, announcementRows.length, avgResponseTime])

  // Message volume by day (last 7 days)
  const messageVolume = useMemo(() => {
    const now = new Date()
    const days: { label: string; date: string }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        label: d.toLocaleString('default', { weekday: 'short' }),
        date: d.toISOString().slice(0, 10)
      })
    }
    return days.map(day => {
      const count = messages.filter((m: any) => {
        const ts = m.timestamp || m.created_at || m.createdAt
        if (!ts) return false
        return new Date(ts).toISOString().slice(0, 10) === day.date
      }).length
      return { name: day.label, messages: count }
    })
  }, [messages])

  if (communicationError) {
    return (
      <div className="flex items-center justify-center h-32 text-white/40 text-sm">
        Unable to load communication data. Please try again.
      </div>
    )
  }

  if (communicationLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex gap-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 flex-1" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {/* Hero Metrics Strip */}
      <HeroMetrics metrics={commMetrics} className="border-b border-white/[0.08]" />

      {/* Message Volume Chart */}
      {messageVolume.some(d => d.messages > 0) && (
        <div className="px-6 py-3 border-b border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Message Volume</h3>
            <span className="text-[11px] text-white/25">Last 7 days</span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <RechartsBarChart data={messageVolume} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }} />
              <Bar dataKey="messages" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.7} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Two-column layout: threads + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 min-h-0">
        {/* Message Thread List (Slack-style) */}
        <div className="lg:col-span-2 border-r border-white/[0.08] overflow-y-auto">
          <div className="px-6 py-4 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white/80">Messages</h3>
            <p className="text-xs text-white/30 mt-0.5">Recent team communications</p>
          </div>

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-white/40 text-sm">
              No messages yet.
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {messages.slice(0, 15).map((msg: any) => {
                const senderName = msg.sender_name || msg.from_user_id || 'System'
                const isUnread = msg.status === 'pending'
                const preview = msg.subject || msg.body || msg.message_body || 'Message'
                const timestamp = msg.timestamp || msg.created_at || msg.createdAt

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 px-6 py-3 cursor-pointer hover:bg-white/[0.04] transition-colors ${isUnread ? 'bg-white/[0.02]' : ''}`}
                    onClick={() => push({
                      id: msg.id,
                      type: 'message',
                      label: senderName,
                      data: { messageId: msg.id, sender: senderName, subject: msg.subject },
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        push({
                          id: msg.id,
                          type: 'message',
                          label: senderName,
                          data: { messageId: msg.id, sender: senderName, subject: msg.subject },
                        })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Message from ${senderName}: ${preview}`}
                  >
                    {/* Sender Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${avatarColor(senderName)}`}>
                      {getInitials(senderName)}
                    </div>

                    {/* Thread Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${isUnread ? 'font-semibold text-white' : 'font-medium text-white/70'}`}>
                          {senderName}
                        </span>
                        <span className="text-[11px] text-white/30 flex-shrink-0">
                          {formatDateTime(timestamp)}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${isUnread ? 'text-white/60' : 'text-white/40'}`}>
                        {preview}
                      </p>
                    </div>

                    {/* Unread Badge */}
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1">
                        <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Channels + Announcements */}
        <div className="overflow-y-auto">
          {/* Channels */}
          <div className="px-5 py-4 border-b border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 text-white/40" />
              Channels
            </h3>
          </div>
          {channelRows.length === 0 ? (
            <div className="px-5 py-4 text-xs text-white/30">No channels</div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {channelRows.map((channel: any) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.04] transition-colors cursor-pointer"
                  onClick={() => push({
                    id: channel.id,
                    type: 'channel',
                    label: `#${channel.name}`,
                    data: { channelId: channel.id, channelName: channel.name },
                  })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      push({
                        id: channel.id,
                        type: 'channel',
                        label: `#${channel.name}`,
                        data: { channelId: channel.id, channelName: channel.name },
                      })
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Channel ${channel.name}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
                    <span className="text-sm text-white/60 truncate">{channel.name}</span>
                  </div>
                  <span className="text-[11px] text-white/25 flex-shrink-0">{formatNumber(channel.member_count || 0)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Announcements */}
          <div className="px-5 py-4 border-b border-t border-white/[0.08]">
            <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
              <Megaphone className="h-3.5 w-3.5 text-white/40" />
              Announcements
            </h3>
          </div>
          {announcementRows.length === 0 ? (
            <div className="px-5 py-4 text-xs text-white/30">No announcements</div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {announcementRows.slice(0, 8).map((ann: any) => (
                <div key={ann.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {formatEnum(ann.type) || 'Announcement'}
                    </Badge>
                    <span className="text-[11px] text-white/25">
                      {formatDate(ann.published_at)}
                    </span>
                  </div>
                  <p className="text-sm text-white/60 leading-snug">{ann.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PeopleCommunicationHub() {
  const [activeTab, setActiveTab] = useState<'people' | 'communication'>('people')

  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08]">
        <div>
          <h1 className="text-lg font-semibold text-white/80">People & Communication</h1>
          <p className="text-xs text-white/30 mt-0.5">Team directory and internal messaging</p>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-0 border-b border-white/[0.08] px-6">
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'people'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
          onClick={() => setActiveTab('people')}
          data-testid="hub-tab-people"
        >
          <Users className="h-4 w-4" />
          People
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'communication'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
          onClick={() => setActiveTab('communication')}
          data-testid="hub-tab-communication"
        >
          <MessageSquare className="h-4 w-4" />
          Communication
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <QueryErrorBoundary>
          {activeTab === 'people' && <PeopleTabContent />}
          {activeTab === 'communication' && <CommunicationTabContent />}
        </QueryErrorBoundary>
      </div>
    </div>
  )
}
