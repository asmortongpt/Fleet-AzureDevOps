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

import React, { useState, useEffect } from 'react';
import { Shield, Users, LineChart, FileText, AlertTriangle, CheckCircle, Lock, Database, Cpu, Clock, TrendingUp, UserPlus, Download, Eye } from 'lucide-react';
// motion removed - React 19 incompatible
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
  const [userStats, setUserStats] = useState<UserStats>({
    total_users: 156,
    active_today: 89,
    by_role: {
      admin: 3,
      fleet_manager: 5,
      dispatcher: 8,
      maintenance_manager: 6,
      driver: 134
    }
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api_uptime: 99.98,
    api_error_rate: 0.12,
    database_connections: 24,
    avg_response_time_ms: 145,
    status: 'healthy'
  });

  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    failed_logins_24h: 3,
    active_sessions: 67,
    compliance_violations: 0,
    pending_audits: 2
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: 1,
      timestamp: '2026-01-14 10:23 AM',
      user: 'john.smith@fleet.com',
      action: 'Created new work order #5432',
      severity: 'info'
    },
    {
      id: 2,
      timestamp: '2026-01-14 10:15 AM',
      user: 'admin@fleet.com',
      action: 'Modified user permissions for sarah.johnson',
      severity: 'warning'
    },
    {
      id: 3,
      timestamp: '2026-01-14 09:58 AM',
      user: 'dispatcher@fleet.com',
      action: 'Emergency alert created for Route #48',
      severity: 'critical'
    }
  ]);

  // Quick actions
  const handleAddUser = () => {
    toast.success('Opening new user creation form...');
    // TODO: Open user creation dialog
  };

  const handleViewAuditLogs = () => {
    toast('Loading audit logs...');
    // TODO: Navigate to audit logs page
  };

  const handleGenerateReport = () => {
    toast.success('Generating executive report...');
    // TODO: Generate and download report
  };

  const handleConfigureSettings = () => {
    toast('Opening system configuration...');
    // TODO: Navigate to settings page
  };

  const handleExportData = () => {
    toast.success('Preparing data export...');
    // TODO: Export all system data
  };

  const handleViewUsers = () => {
    toast('Loading user management interface...');
    // TODO: Navigate to user management
  };

  const handleViewSecurityAlerts = () => {
    toast('Loading security alerts...');
    // TODO: Navigate to security dashboard
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
        return 'text-slate-700 bg-slate-800 border-slate-700';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'text-blue-700';
      case 'warning':
        return 'text-amber-400';
      case 'critical':
        return 'text-red-400';
      default:
        return 'text-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-2">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-sm font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-sm text-slate-700">System Management & Compliance Oversight</p>
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
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-300 text-sm">API Uptime</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.api_uptime}%</p>
          </div>

          {/* Error Rate */}
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-300 text-sm">Error Rate</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.api_error_rate}%</p>
          </div>

          {/* DB Connections */}
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-300 text-sm">DB Connections</span>
            </div>
            <p className="text-sm font-bold text-white">{systemHealth.database_connections}</p>
          </div>

          {/* Response Time */}
          <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-slate-300 text-sm">Avg Response</span>
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
          className="bg-slate-600 hover:bg-slate-700 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* User Management */}
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
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
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">Total Users</span>
                <span className="text-sm font-bold text-white">{userStats.total_users}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span>{userStats.active_today} active today</span>
              </div>
            </div>

            {/* By Role */}
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
              <p className="text-slate-700 text-sm mb-3 font-semibold">By Role</p>
              <div className="space-y-2">
                {Object.entries(userStats.by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 text-sm capitalize">
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
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
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
                  : "bg-slate-900/50 border-slate-700"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-slate-300 text-sm">Failed Logins (24h)</span>
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
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300 text-sm">Active Sessions</span>
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
                  <span className="text-sm text-slate-300 text-sm">Compliance Violations</span>
                </div>
                <span className="text-sm font-bold text-white">
                  {securityMetrics.compliance_violations}
                </span>
              </div>
            </div>

            {/* Pending Audits */}
            <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-slate-300 text-sm">Pending Audits</span>
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
        <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2">
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
                className="bg-slate-900/50 rounded-lg p-3 border border-slate-700"
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    activity.severity === 'critical' ? "bg-red-500" :
                    activity.severity === 'warning' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold mb-1",
                      getSeverityColor(activity.severity)
                    )}>
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-700">{activity.user}</p>
                    <p className="text-xs text-slate-500">{activity.timestamp}</p>
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
      <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700 p-2 mt-3">
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
          <Button size="sm"
            onClick={handleConfigureSettings}
            variant="outline"
            className="border-slate-600 text-sm text-slate-300 hover:bg-slate-700"
          >
            <Cpu className="w-4 h-4 mr-2" />
            System Settings
          </Button>
        </div>
      </Card>
    </div>
  );
}