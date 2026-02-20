/**
 * Admin Dashboard - Workflow-Optimized View
 * Role: admin / tenant_admin (Level 9-10)
 *
 * Primary Focus:
 * - User management & role assignments
 * - System health & performance monitoring
 * - Compliance & security oversight
 * - Audit logs & reporting
 */

import { Shield, Users, LineChart, FileText, AlertTriangle, CheckCircle, Lock, Database, Cpu, Clock, TrendingUp, UserPlus, Download, Eye } from 'lucide-react';
import React, { useMemo } from 'react';
// motion removed - React 19 incompatible
import toast from 'react-hot-toast';

import { useNavigation } from '@/contexts/NavigationContext';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useReactiveAdminData } from '@/hooks/use-reactive-admin-data';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/format-helpers';

interface UserStats {
  total_users: number;
  active_today: number;
  by_role: {
    admin: number;
    fleet_manager: number;
    dispatcher: number;
    maintenance_manager: number;
    driver: number;
  };
}

interface SystemHealth {
  api_uptime: number;
  api_error_rate: number;
  database_connections: number;
  avg_response_time_ms: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface SecurityMetrics {
  failed_logins_24h: number;
  active_sessions: number;
  compliance_violations: number;
  pending_audits: number;
}

interface RecentActivity {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  severity: 'info' | 'warning' | 'critical';
}

export function AdminDashboard() {
  const adminData = useReactiveAdminData();

  const userStats = useMemo<UserStats>(() => ({
    total_users: adminData.metrics.totalUsers || 0,
    active_today: adminData.metrics.activeUsers || 0,
    by_role: {
      admin: adminData.userRoleDistribution.admin || 0,
      fleet_manager: adminData.userRoleDistribution.fleet_manager || 0,
      dispatcher: adminData.userRoleDistribution.dispatcher || 0,
      maintenance_manager: adminData.userRoleDistribution.maintenance_manager || 0,
      driver: adminData.userRoleDistribution.driver || 0,
    }
  }), [adminData.metrics, adminData.userRoleDistribution]);

  const systemHealth = useMemo<SystemHealth>(() => ({
    api_uptime: 99.9,
    api_error_rate: 0,
    database_connections: adminData.systemMetrics?.activeConnections ?? 0,
    avg_response_time_ms: adminData.systemMetrics?.apiResponseTime ?? 0,
    status: adminData.metrics.systemHealth > 95 ? 'healthy' as const : adminData.metrics.systemHealth > 85 ? 'warning' as const : 'critical' as const
  }), [adminData.systemMetrics, adminData.metrics.systemHealth]);

  const securityMetrics = useMemo<SecurityMetrics>(() => ({
    failed_logins_24h: adminData.metrics.failedActions || 0,
    active_sessions: adminData.metrics.activeSessions || 0,
    compliance_violations: adminData.actionDistribution?.security || 0,
    pending_audits: adminData.failedActions?.length || 0
  }), [adminData.metrics, adminData.actionDistribution, adminData.failedActions]);

  const recentActivity = useMemo<RecentActivity[]>(() => {
    return (adminData.recentAuditLogs || []).slice(0, 5).map((log) => ({
      id: Number(log.id ?? 0),
      timestamp: log.timestamp ? formatDateTime(log.timestamp) : '',
      user: log.userName || log.userId || 'System',
      action: log.action || log.resource || 'Activity',
      severity: log.status === 'failure' ? 'critical' : 'info'
    }));
  }, [adminData.recentAuditLogs]);

  const { navigateTo } = useNavigation();

  // Quick actions
  const handleAddUser = () => {
    toast.success('Opening new user creation form...');
    navigateTo('admin-hub-consolidated');
  };

  const handleViewAuditLogs = () => {
    toast('Loading audit logs...');
    navigateTo('admin-hub-consolidated');
  };

  const handleGenerateReport = () => {
    toast.success('Generating executive report...');
    navigateTo('reports');
  };

  const handleConfigureSettings = () => {
    toast('Opening system configuration...');
    navigateTo('settings');
  };

  const handleExportData = () => {
    toast.success('Preparing data export...');
    navigateTo('admin-hub-consolidated');
  };

  const handleViewUsers = () => {
    toast('Loading user management interface...');
    navigateTo('admin-hub-consolidated');
  };

  const handleViewSecurityAlerts = () => {
    toast('Loading security alerts...');
    navigateTo('admin-hub-consolidated');
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400 bg-green-950/30 border-green-500/30';
      case 'warning':
        return 'text-amber-400 bg-amber-950/30 border-amber-500/30';
      case 'critical':
        return 'text-red-400 bg-red-950/30 border-red-500/30';
      default:
        return 'text-white/40 bg-[#242424] border-white/[0.08]';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-emerald-400';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-white/40';
    }
  };

  return (
    <div className="min-h-screen bg-[#111] p-2">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-sm font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-sm text-white/40">System Management & Compliance Oversight</p>
      </div>

      {/* System Health Summary */}
      <Card className={cn(
        "backdrop-blur-xl p-2 mb-3",
        systemHealth.status === 'healthy'
          ? "bg-green-950/20 border-green-500/30"
          : systemHealth.status === 'warning'
          ? "bg-amber-950/20 border-amber-500/30"
          : "bg-red-950/20 border-red-500/30"
      )}>
        <div className="flex items-center gap-2 mb-3">
          <LineChart className={cn(
            "w-4 h-4",
            systemHealth.status === 'healthy' ? "text-green-400" : "text-amber-400"
          )} />
          <h2 className="text-sm font-bold text-white">System Health</h2>
          <div className={cn(
            "ml-auto px-3 py-1 rounded-full text-sm font-semibold",
            getHealthStatusColor(systemHealth.status)
          )}>
            {systemHealth.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* API Uptime */}
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-white/60 text-sm">API Uptime</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.api_uptime}%</p>
          </div>

          {/* Error Rate */}
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-white/60 text-sm">Error Rate</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.api_error_rate}%</p>
          </div>

          {/* DB Connections */}
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-white/60 text-sm">DB Connections</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.database_connections}</p>
          </div>

          {/* Response Time */}
          <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-white/60 text-sm">Avg Response</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.avg_response_time_ms}ms</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mb-3 flex flex-wrap gap-3">
        <Button size="sm"
          onClick={handleAddUser}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add User
        </Button>
        <Button size="sm"
          onClick={handleViewAuditLogs}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Audit Logs
        </Button>
        <Button size="sm"
          onClick={handleGenerateReport}
          className="bg-white/[0.15] hover:bg-white/[0.06] text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* User Management */}
        <Card className="bg-[#242424] backdrop-blur-xl border-white/[0.08] p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">Users</h2>
            </div>
            <Button size="sm"
              variant="ghost"
              className="text-cyan-400 hover:bg-cyan-400/10"
              onClick={handleViewUsers}
            >
              View All
            </Button>
          </div>

          <div className="space-y-3">
            {/* Total Users */}
            <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Total Users</span>
                <span className="text-sm font-bold text-white">{userStats.total_users}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>{userStats.active_today} active today</span>
              </div>
            </div>

            {/* By Role */}
            <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
              <p className="text-white/40 text-sm mb-3 font-semibold">By Role</p>
              <div className="space-y-2">
                {Object.entries(userStats.by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-white/60 text-sm capitalize">
                      {role.replace('_', ' ')}
                    </span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button size="sm"
            onClick={handleAddUser}
            className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        </Card>

        {/* Security & Compliance */}
        <Card className="bg-[#242424] backdrop-blur-xl border-white/[0.08] p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Security</h2>
            </div>
          </div>

          <div className="space-y-3">
            {/* Failed Logins */}
            <div
              className={cn(
                "rounded-lg p-2 border transition-all",
                securityMetrics.failed_logins_24h > 5
                  ? "bg-red-950/30 border-red-500/30"
                  : "bg-white/[0.03] border-white/[0.08]"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/60 text-sm">Failed Logins (24h)</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {securityMetrics.failed_logins_24h}
                </span>
              </div>
              {securityMetrics.failed_logins_24h > 5 && (
                <p className="text-xs text-red-400 mt-2">⚠️ Above normal threshold</p>
              )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-white/60 text-sm">Active Sessions</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {securityMetrics.active_sessions}
                </span>
              </div>
            </div>

            {/* Compliance Violations */}
            <div
              className={cn(
                "rounded-lg p-2 border transition-all",
                securityMetrics.compliance_violations > 0
                  ? "bg-red-950/30 border-red-500/30"
                  : "bg-green-950/30 border-green-500/30"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {securityMetrics.compliance_violations > 0 ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-sm text-white/60 text-sm">Compliance Violations</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {securityMetrics.compliance_violations}
                </span>
              </div>
            </div>

            {/* Pending Audits */}
            <div className="bg-white/[0.03] rounded-lg p-2 border border-white/[0.08]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-white/60 text-sm">Pending Audits</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {securityMetrics.pending_audits}
                </span>
              </div>
            </div>
          </div>

          <Button size="sm"
            onClick={handleViewSecurityAlerts}
            variant="outline"
            className="w-full mt-2 border-violet-400 text-violet-400 hover:bg-violet-400/10"
          >
            <Shield className="w-4 h-4 mr-2" />
            View Security Dashboard
          </Button>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#242424] backdrop-blur-xl border-white/[0.08] p-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LineChart className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Recent Activity</h2>
            </div>
          </div>

          <div className="space-y-3 mb-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.08]"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    activity.severity === 'critical' ? "bg-red-500" :
                    activity.severity === 'warning' ? "bg-amber-500" : "bg-emerald-500"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold mb-1",
                      getSeverityColor(activity.severity)
                    )}>
                      {activity.action}
                    </p>
                    <p className="text-xs text-white/40">{activity.user}</p>
                    <p className="text-xs text-white/40">{activity.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm"
            onClick={handleViewAuditLogs}
            variant="outline"
            className="w-full border-amber-400 text-amber-400 hover:bg-amber-400/10"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Audit Log
          </Button>
        </Card>
      </div>

      {/* Export & Reporting */}
      <Card className="bg-[#242424] backdrop-blur-xl border-white/[0.08] p-2 mt-3">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-green-400" />
          <h2 className="text-sm font-bold text-white">Reports & Data Export</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button size="sm"
            onClick={handleGenerateReport}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Executive Report
          </Button>
          <Button size="sm"
            onClick={handleExportData}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Button size="sm"
            onClick={handleConfigureSettings}
            variant="outline"
            className="border-white/[0.12] text-sm text-white/60 hover:bg-white/[0.06]"
          >
            <Cpu className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}
