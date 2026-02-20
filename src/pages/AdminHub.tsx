/**
 * AdminHub - Professional Administration Dashboard
 *
 * Enterprise-grade admin management with:
 * - Professional table-based layout (NO cards)
 * - CTA branded styling
 * - User management, audit logs, system monitoring
 * - Advanced sorting, filtering, pagination
 * - All data visible upfront
 */

import { type ColumnDef } from '@tanstack/react-table'
import {
  User,
  Mail,
  Shield,
  Activity,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DataTable, createStatusColumn, createMonospaceColumn } from '@/components/ui/data-table'
import { secureFetch } from '@/hooks/use-api'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/utils/format-helpers'

interface AdminUser {
  id: number
  username: string
  email: string
  role: 'Super Admin' | 'Admin' | 'Manager' | 'User' | 'Read-Only'
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending'
  lastLogin?: string
  loginCount: number
  createdAt: string
  department: string
  permissions: string[]
  twoFactorEnabled: boolean
}

interface AuditLog {
  id: number
  timestamp: string
  user: string
  action: string
  resource: string
  status: 'Success' | 'Failed' | 'Warning'
  ipAddress: string
  details?: string
}

export default function AdminHub() {
  const [selectedUsers, setSelectedUsers] = useState<AdminUser[]>([])
  const [selectedLogs, setSelectedLogs] = useState<AuditLog[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users')
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadAdminData = async () => {
      try {
        setIsLoading(true)
        const [usersResponse, auditResponse] = await Promise.all([
          secureFetch('/api/users?limit=200').catch(() => null),
          secureFetch('/api/audit-logs?limit=200').catch(() => null),
        ])

        if (!cancelled) {
          if (usersResponse?.ok) {
            const usersPayload = await usersResponse.json()
            const users = (usersPayload.data || usersPayload || []) as any[]
            setAdminUsers(
              users.map((user) => ({
                id: user.id,
                username: user.email?.split('@')[0] || user.email || '',
                email: user.email || '',
                role: (user.role || 'User') as AdminUser['role'],
                status: (user.status === 'active' ? 'Active' : 'Inactive') as AdminUser['status'],
                lastLogin: user.last_login_at || undefined,
                loginCount: user.login_count ?? 0,
                createdAt: user.created_at || '',
                department: user.department || '',
                permissions: user.permissions || [],
                twoFactorEnabled: Boolean(user.mfa_enabled ?? user.two_factor_enabled),
              }))
            )
          } else {
            setAdminUsers([])
          }

          if (auditResponse?.ok) {
            const auditPayload = await auditResponse.json()
            const logs = (auditPayload.data || auditPayload || []) as any[]
            setAuditLogs(
              logs.map((log) => ({
                id: log.id,
                timestamp: log.timestamp,
                user: log.userName || log.user || '',
                action: log.action || '',
                resource: log.resource || '',
                status: (String(log.status).toLowerCase() === 'failed' ? 'Failed' : String(log.status).toLowerCase() === 'warning' ? 'Warning' : 'Success') as AuditLog['status'],
                ipAddress: log.ipAddress || '',
                details: log.metadata?.details || log.details || '',
              }))
            )
          } else {
            setAuditLogs([])
          }
        }
      } catch {
        if (!cancelled) {
          setAdminUsers([])
          setAuditLogs([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadAdminData()
    return () => {
      cancelled = true
    }
  }, [])

  // User table columns
  const userColumns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      {
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
              <User className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <span className="font-semibold text-white">{row.getValue('username')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-gray-200 text-sm">{row.getValue('email')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.getValue('role') as string
          const roleColors: Record<string, string> = {
            'Super Admin': 'bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30',
            'Admin': 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
            'Manager': 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30',
            'User': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            'Read-Only': 'bg-muted/40 text-muted-foreground border-border/50',
          }
          return (
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              roleColors[role] || 'bg-muted/40 text-muted-foreground border-border/50'
            )}>
              <Shield className="h-3 w-3 mr-1" />
              {role}
            </span>
          )
        },
      },
      createStatusColumn<AdminUser>('status', 'Status'),
      {
        accessorKey: 'department',
        header: 'Department',
        cell: ({ row }) => (
          <span className="text-gray-200">{row.getValue('department')}</span>
        ),
      },
      {
        accessorKey: 'twoFactorEnabled',
        header: '2FA',
        cell: ({ row }) => {
          const enabled = row.getValue('twoFactorEnabled') as boolean
          return enabled ? (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">Enabled</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <XCircle className="h-4 w-4 text-[hsl(var(--destructive))]" />
              <span className="text-[hsl(var(--destructive))] text-sm font-medium">Disabled</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'loginCount',
        header: 'Logins',
        cell: ({ row }) => (
          <span className="text-white font-medium">{formatNumber(row.getValue('loginCount') as number)}</span>
        ),
      },
      {
        accessorKey: 'lastLogin',
        header: 'Last Login',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-gray-400 text-xs">{row.getValue('lastLogin') || 'Never'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-gray-200 text-sm">{row.getValue('createdAt')}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-[hsl(var(--primary))]/20"
              title="View Details"
            >
              <Eye className="h-4 w-4 text-[hsl(var(--primary))]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-[hsl(var(--warning))]/20"
              title="Edit User"
            >
              <Edit className="h-4 w-4 text-[hsl(var(--warning))]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-[hsl(var(--destructive))]/20"
              title="Delete User"
            >
              <Trash2 className="h-4 w-4 text-[hsl(var(--destructive))]" />
            </Button>
          </div>
        ),
      },
    ],
    []
  )

  // Audit log table columns
  const auditColumns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-white font-mono text-sm">{row.getValue('timestamp')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'user',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[hsl(var(--primary))]" />
            <span className="text-white font-medium">{row.getValue('user')}</span>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const action = row.getValue('action') as string
          const actionColors: Record<string, string> = {
            'CREATE': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            'UPDATE': 'bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))] border-[hsl(var(--primary))]/30',
            'DELETE': 'bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30',
            'EXPORT': 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
          }
          return (
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
              actionColors[action] || 'bg-muted/40 text-muted-foreground border-border/50'
            )}>
              {action}
            </span>
          )
        },
      },
      {
        accessorKey: 'resource',
        header: 'Resource',
        cell: ({ row }) => (
          <span className="text-gray-200 text-sm">{row.getValue('resource')}</span>
        ),
      },
      createStatusColumn<AuditLog>('status', 'Status'),
      createMonospaceColumn<AuditLog>('ipAddress', 'IP Address'),
      {
        accessorKey: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <span className="text-gray-400 text-xs">{row.getValue('details') || '-'}</span>
        ),
      },
    ],
    []
  )

  // Calculate admin statistics
  const adminStats = useMemo(() => {
    const totalUsers = adminUsers.length
    const activeUsers = adminUsers.filter((u) => u.status === 'Active').length
    const suspendedUsers = adminUsers.filter((u) => u.status === 'Suspended').length
    const total2FA = adminUsers.filter((u) => u.twoFactorEnabled).length
    const totalLogins = adminUsers.reduce((sum, u) => sum + u.loginCount, 0)
    const recentActivity = auditLogs.length
    const successRate = Math.round(
      (auditLogs.filter((l) => l.status === 'Success').length / auditLogs.length) * 100
    )

    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      total2FA,
      totalLogins,
      recentActivity,
      successRate,
    }
  }, [adminUsers, auditLogs])

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-3 space-y-3">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[hsl(var(--warning))] to-[hsl(var(--destructive))]" />
        <div className="pt-3">
          <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
          <p className="text-sm text-gray-300">
            Intelligent Technology. Integrated Partnership. - ArchonY: Intelligent Performance
          </p>
        </div>
      </div>

      {/* Stats Bar - Compact and Professional */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        <StatCard
          label="Total Users"
          value={adminStats.totalUsers}
          icon={<Users className="h-5 w-5 text-[hsl(var(--primary))]" />}
          trend="neutral"
        />
        <StatCard
          label="Active"
          value={adminStats.activeUsers}
          icon={<Activity className="h-5 w-5 text-emerald-400" />}
          trend="up"
        />
        <StatCard
          label="Suspended"
          value={adminStats.suspendedUsers}
          icon={<AlertTriangle className="h-5 w-5 text-[hsl(var(--destructive))]" />}
          trend="down"
        />
        <StatCard
          label="2FA Enabled"
          value={adminStats.total2FA}
          icon={<Shield className="h-5 w-5 text-emerald-400" />}
          trend="up"
        />
        <StatCard
          label="Total Logins"
          value={`${(adminStats.totalLogins / 1000).toFixed(1)}K`}
          icon={<Activity className="h-5 w-5 text-[hsl(var(--primary))]" />}
          trend="neutral"
        />
        <StatCard
          label="Recent Activity"
          value={adminStats.recentActivity}
          icon={<Database className="h-5 w-5 text-[hsl(var(--warning))]" />}
          trend="neutral"
        />
        <StatCard
          label="Success Rate"
          value={`${adminStats.successRate}%`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          trend="up"
        />
      </div>

      {/* Tab Selection */}
      <div className="flex gap-2 border-b border-[hsl(var(--primary))]/20 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            'px-4 py-2 rounded-t-lg font-medium transition-all',
            activeTab === 'users'
              ? 'bg-[hsl(var(--muted))] text-white border-b-2 border-[hsl(var(--primary))]'
              : 'text-gray-400 hover:text-white hover:bg-[hsl(var(--card))]'
          )}
        >
          <Users className="inline h-4 w-4 mr-2" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={cn(
            'px-4 py-2 rounded-t-lg font-medium transition-all',
            activeTab === 'audit'
              ? 'bg-[hsl(var(--muted))] text-white border-b-2 border-[hsl(var(--primary))]'
              : 'text-gray-400 hover:text-white hover:bg-[hsl(var(--card))]'
          )}
        >
          <Activity className="inline h-4 w-4 mr-2" />
          Audit Logs
        </button>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">System Users</h2>
              <p className="text-xs text-gray-300 mt-0.5">
                {selectedUsers.length > 0 && `${selectedUsers.length} selected • `}
                All users visible • Professional table layout
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-[hsl(var(--card))] border-[hsl(var(--primary))]/20 text-white hover:bg-[hsl(var(--primary))]/20"
              >
                Export Users
              </Button>
              <Button className="bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white">
                Add User
              </Button>
            </div>
          </div>

          {(!isLoading && adminUsers.length === 0) ? (
            <div className="rounded-lg border border-[hsl(var(--primary))]/20 bg-[hsl(var(--card))] p-6 text-sm text-gray-200">
              No users found for this tenant.
            </div>
          ) : (
            <DataTable
              columns={userColumns}
              data={adminUsers}
              searchPlaceholder="Search users by name, email, role, department..."
              onRowSelect={setSelectedUsers}
              enableRowSelection={true}
              enableSearch={true}
              enablePagination={true}
              defaultPageSize={25}
            />
          )}
        </div>
      )}

      {/* Audit Logs Table */}
      {activeTab === 'audit' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
              <p className="text-xs text-gray-300 mt-0.5">
                {selectedLogs.length > 0 && `${selectedLogs.length} selected • `}
                All logs visible • Professional table layout
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-[hsl(var(--card))] border-[hsl(var(--primary))]/20 text-white hover:bg-[hsl(var(--primary))]/20"
              >
                Export Logs
              </Button>
              <Button
                variant="outline"
                className="bg-[hsl(var(--card))] border-[hsl(var(--primary))]/20 text-white hover:bg-[hsl(var(--primary))]/20"
              >
                Filter by Date
              </Button>
            </div>
          </div>

          {(!isLoading && auditLogs.length === 0) ? (
            <div className="rounded-lg border border-[hsl(var(--primary))]/20 bg-[hsl(var(--card))] p-6 text-sm text-gray-200">
              No audit logs available.
            </div>
          ) : (
            <DataTable
              columns={auditColumns}
              data={auditLogs}
              searchPlaceholder="Search logs by user, action, resource, IP..."
              onRowSelect={setSelectedLogs}
              enableRowSelection={true}
              enableSearch={true}
              enablePagination={true}
              defaultPageSize={25}
            />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-3 border-t border-[hsl(var(--primary))]/10">
        CTA Administration • ArchonY Platform • Secure access management • Professional data tables
      </div>
    </div>
  )
}

// Professional Stat Card Component
interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ label, value, icon, trend = 'neutral' }: StatCardProps) {
  return (
    <div className="bg-[hsl(var(--muted))] border border-[hsl(var(--primary))]/20 rounded-lg p-3 hover:border-[hsl(var(--primary))]/40 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] font-semibold text-gray-300 uppercase tracking-wide">
          {label}
        </div>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <div className="text-xl font-bold text-white">{value}</div>
        {trend !== 'neutral' && (
          <div className={cn(
            'flex items-center text-xs mb-1',
            trend === 'up' ? 'text-emerald-400' : 'text-[hsl(var(--destructive))]'
          )}>
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
