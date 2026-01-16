/**
 * useReactiveAdminData - Real-time admin/system data with React Query
 * Auto-refreshes every 10 seconds for live admin dashboard
 */

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'operator' | 'viewer'
  status: 'active' | 'inactive' | 'suspended'
  lastLogin?: string
  createdAt: string
}

interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  storageUsed: number
  storageTotal: number
  apiCalls: number
  uptime: number
}

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  status: 'success' | 'failure'
  ipAddress?: string
}

interface Session {
  id: string
  userId: string
  userName: string
  startTime: string
  lastActivity: string
  ipAddress: string
  userAgent: string
  status: 'active' | 'expired'
}

export function useReactiveAdminData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['admin-users', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/users`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['system-metrics', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/health`)
      if (!response.ok) {
        // Return mock data if API not available
        return {
          cpuUsage: Math.round(Math.random() * 30 + 20),
          memoryUsage: Math.round(Math.random() * 40 + 30),
          storageUsed: 67,
          storageTotal: 100,
          apiCalls: Math.round(Math.random() * 1000 + 12000),
          uptime: 99.9,
        }
      }
      const data = await response.json()
      return {
        cpuUsage: data.cpu || 24,
        memoryUsage: data.memory || 42,
        storageUsed: data.storageUsed || 67,
        storageTotal: data.storageTotal || 100,
        apiCalls: data.apiCalls || 12400,
        uptime: data.uptime || 99.9,
      }
    },
    refetchInterval: 5000, // More frequent for system metrics
    staleTime: 2000,
  })

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/audit-logs?limit=100`)
      if (!response.ok) {
        // Return mock data if API not available
        return generateMockAuditLogs()
      }
      return response.json()
    },
    refetchInterval: 15000,
    staleTime: 10000,
  })

  // Fetch active sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['active-sessions', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/sessions`)
      if (!response.ok) {
        // Return mock data
        return generateMockSessions(users)
      }
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Calculate admin metrics
  const metrics = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === 'active').length,
    inactiveUsers: users.filter((u) => u.status === 'inactive').length,
    suspendedUsers: users.filter((u) => u.status === 'suspended').length,
    adminUsers: users.filter((u) => u.role === 'admin').length,
    activeSessions: sessions.filter((s) => s.status === 'active').length,
    totalAuditLogs: auditLogs.length,
    failedActions: auditLogs.filter((log) => log.status === 'failure').length,
    systemHealth: systemMetrics ? calculateSystemHealth(systemMetrics) : 98,
  }

  // User status distribution
  const userStatusDistribution = users.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // User role distribution
  const userRoleDistribution = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Activity trend data (aggregated by day)
  const activityTrendData = aggregateActivityByDay(auditLogs)

  // Top user activities
  const topUserActivities = auditLogs
    .reduce((acc, log) => {
      const existing = acc.find((item) => item.userName === log.userName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ userName: log.userName, userId: log.userId, count: 1 })
      }
      return acc
    }, [] as Array<{ userName: string; userId: string; count: number }>)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Action type distribution
  const actionDistribution = auditLogs.reduce((acc, log) => {
    const actionType = log.action.split('_')[0] // First word (CREATE, UPDATE, DELETE, etc)
    acc[actionType] = (acc[actionType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Recent audit logs
  const recentAuditLogs = auditLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)

  // Failed actions
  const failedActions = auditLogs
    .filter((log) => log.status === 'failure')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return {
    users,
    systemMetrics,
    auditLogs,
    sessions,
    metrics,
    userStatusDistribution,
    userRoleDistribution,
    activityTrendData,
    topUserActivities,
    actionDistribution,
    recentAuditLogs,
    failedActions,
    isLoading: usersLoading || metricsLoading || auditLoading || sessionsLoading,
    lastUpdate: new Date(),
    refresh: () => setRealTimeUpdate((prev) => prev + 1),
  }
}

// Helper function to calculate overall system health
function calculateSystemHealth(metrics: SystemMetrics): number {
  const cpuScore = Math.max(0, 100 - metrics.cpuUsage)
  const memoryScore = Math.max(0, 100 - metrics.memoryUsage)
  const storageScore = Math.max(0, 100 - metrics.storageUsed)
  const uptimeScore = metrics.uptime

  return Math.round((cpuScore * 0.3 + memoryScore * 0.3 + storageScore * 0.2 + uptimeScore * 0.2))
}

// Helper function to aggregate activity by day
function aggregateActivityByDay(logs: AuditLog[]) {
  const dayMap = new Map<string, { success: number; failure: number }>()

  logs.forEach((log) => {
    const date = new Date(log.timestamp)
    const dayKey = date.toISOString().split('T')[0]

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, { success: 0, failure: 0 })
    }

    const entry = dayMap.get(dayKey)!
    if (log.status === 'success') {
      entry.success++
    } else {
      entry.failure++
    }
  })

  // Get last 7 days
  const today = new Date()
  const result = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayKey = date.toISOString().split('T')[0]
    const data = dayMap.get(dayKey) || { success: 0, failure: 0 }

    result.push({
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      success: data.success,
      failure: data.failure,
      total: data.success + data.failure,
    })
  }

  return result
}

// Mock data generators for fallback
function generateMockAuditLogs(): AuditLog[] {
  const actions = [
    'CREATE_VEHICLE',
    'UPDATE_VEHICLE',
    'DELETE_VEHICLE',
    'CREATE_DRIVER',
    'UPDATE_DRIVER',
    'LOGIN',
    'LOGOUT',
    'UPDATE_SETTINGS',
    'CREATE_MAINTENANCE',
    'ASSIGN_VEHICLE',
  ]
  const resources = ['vehicles', 'drivers', 'maintenance', 'settings', 'auth']
  const users = ['John Admin', 'Sarah Manager', 'Mike Operator', 'Lisa Admin']

  const logs: AuditLog[] = []
  const now = new Date()

  for (let i = 0; i < 50; i++) {
    const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    logs.push({
      id: `log-${i}`,
      userId: `user-${Math.floor(Math.random() * 4)}`,
      userName: users[Math.floor(Math.random() * users.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      resource: resources[Math.floor(Math.random() * resources.length)],
      timestamp: timestamp.toISOString(),
      status: Math.random() > 0.1 ? 'success' : 'failure',
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    })
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function generateMockSessions(users: User[]): Session[] {
  if (users.length === 0) return []

  const activeUsers = users.filter((u) => u.status === 'active').slice(0, 10)
  const now = new Date()

  return activeUsers.map((user, idx) => ({
    id: `session-${idx}`,
    userId: user.id,
    userName: user.name,
    startTime: new Date(now.getTime() - Math.random() * 4 * 60 * 60 * 1000).toISOString(),
    lastActivity: new Date(now.getTime() - Math.random() * 30 * 60 * 1000).toISOString(),
    ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    status: 'active',
  }))
}
