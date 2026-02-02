import { AlertCircle, AlertTriangle, Info, XCircle } from 'lucide-react';
import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

type IssueSeverity = 'critical' | 'warning' | 'info';

interface Issue {
  id: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  details: string;
  timestamp: string;
  affectedSystems: string[];
}

interface ActiveIssuesProps {
  className?: string;
}

/**
 * ActiveIssues Component
 *
 * PURPOSE: Display operational alerts requiring attention
 *
 * SEVERITY LEVELS:
 * - Critical: Action required immediately (red)
 * - Warning: Attention needed soon (orange/yellow)
 * - Info: FYI, no action required (blue)
 */
export function ActiveIssues({ className }: ActiveIssuesProps) {
  const [issues, setIssues] = React.useState<Issue[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActiveIssues = async () => {
      try {
        // Fetch dashboard stats to detect issues
        const [dashboardStats, maintenanceAlerts] = await Promise.all([
          fetch('/api/dashboard/stats', { credentials: 'include' })
            .then(res => res.json())
            .catch(() => null),
          fetch('/api/dashboard/maintenance/alerts', { credentials: 'include' })
            .then(res => res.json())
            .catch(() => null)
        ]);

        const detectedIssues: Issue[] = [];

        // Detect issues from API data
        if (maintenanceAlerts) {
          // Overdue maintenance = Critical
          if (maintenanceAlerts.overdue_count > 0) {
            detectedIssues.push({
              id: 'overdue-maintenance',
              severity: 'critical',
              title: 'Overdue Maintenance',
              description: `${maintenanceAlerts.overdue_count} vehicles have overdue maintenance`,
              details: `${maintenanceAlerts.overdue?.map((m: any) => m.vehicle_name).join(', ')}`,
              timestamp: new Date().toISOString(),
              affectedSystems: ['Maintenance', 'Fleet']
            });
          }

          // Upcoming maintenance = Warning
          if (maintenanceAlerts.upcoming_count > 0) {
            detectedIssues.push({
              id: 'upcoming-maintenance',
              severity: 'warning',
              title: 'Upcoming Maintenance',
              description: `${maintenanceAlerts.upcoming_count} vehicles need maintenance in 7 days`,
              details: `${maintenanceAlerts.upcoming?.slice(0, 3).map((m: any) => m.vehicle_name).join(', ')}`,
              timestamp: new Date().toISOString(),
              affectedSystems: ['Maintenance']
            });
          }

          // Open work orders = Info
          if (maintenanceAlerts.open_work_orders > 5) {
            detectedIssues.push({
              id: 'open-work-orders',
              severity: 'info',
              title: 'Work Orders in Progress',
              description: `${maintenanceAlerts.open_work_orders} work orders currently active`,
              details: `Status: In progress`,
              timestamp: new Date().toISOString(),
              affectedSystems: ['Maintenance', 'Operations']
            });
          }
        }

        if (dashboardStats) {
          // Maintenance vehicles = Warning if >10% of fleet
          const maintenanceCount = dashboardStats.maintenance_vehicles || 0;
          const totalVehicles = dashboardStats.total_vehicles || 1;
          const maintenancePercent = (maintenanceCount / totalVehicles) * 100;

          if (maintenancePercent > 10) {
            detectedIssues.push({
              id: 'high-maintenance',
              severity: 'warning',
              title: 'High Maintenance Rate',
              description: `${maintenancePercent.toFixed(1)}% of fleet is in maintenance`,
              details: `${maintenanceCount} of ${totalVehicles} vehicles`,
              timestamp: new Date().toISOString(),
              affectedSystems: ['Fleet', 'Maintenance']
            });
          }

          // Low active vehicles = Info
          const activeCount = dashboardStats.active_vehicles || 0;
          if (activeCount < totalVehicles * 0.7) {
            detectedIssues.push({
              id: 'low-active',
              severity: 'info',
              title: 'Fleet Utilization',
              description: `Only ${activeCount} vehicles active`,
              details: `${((activeCount / totalVehicles) * 100).toFixed(1)}% utilization`,
              timestamp: new Date().toISOString(),
              affectedSystems: ['Fleet', 'Operations']
            });
          }
        }

        // Sort by severity (critical first)
        const sortedIssues = detectedIssues.sort((a, b) => {
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        });

        setIssues(sortedIssues);
      } catch (error) {
        logger.error('Failed to fetch active issues:', error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveIssues();
    const interval = setInterval(fetchActiveIssues, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const severityConfig = {
    critical: {
      icon: <XCircle className="h-5 w-5" />,
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-300 dark:border-red-800',
      text: 'text-red-700 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      label: 'CRITICAL'
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      border: 'border-orange-300 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-400',
      badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
      label: 'WARNING'
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-300 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-700',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      label: 'INFO'
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Active Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Active Issues</span>
          <div className="flex items-center gap-2">
            {issues.filter(i => i.severity === 'critical').length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold">
                <XCircle className="h-3 w-3" />
                {issues.filter(i => i.severity === 'critical').length}
              </div>
            )}
            {issues.filter(i => i.severity === 'warning').length > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 text-xs font-semibold">
                <AlertTriangle className="h-3 w-3" />
                {issues.filter(i => i.severity === 'warning').length}
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-emerald-600 mb-3" />
            <h3 className="font-semibold text-lg mb-1">All Systems Normal</h3>
            <p className="text-sm text-muted-foreground">
              No active issues detected. Fleet is operating smoothly.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {issues.map((issue) => {
                const config = severityConfig[issue.severity];

                return (
                  <div
                    key={issue.id}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                      config.bg,
                      config.border
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('mt-0.5', config.text)}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-xs font-bold px-2 py-0.5 rounded', config.badge)}>
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(issue.timestamp).toLocaleTimeString()}
                          </span>
                        </div>

                        <h4 className={cn('font-semibold text-sm mb-1', config.text)}>
                          {issue.title}
                        </h4>

                        <p className="text-sm text-muted-foreground mb-2">
                          {issue.description}
                        </p>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-muted-foreground">Details:</span>
                            <span className={config.text}>{issue.details}</span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-muted-foreground">Affected:</span>
                            <div className="flex gap-1">
                              {issue.affectedSystems.map((system) => (
                                <span
                                  key={system}
                                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                                >
                                  {system}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className="pt-3 text-xs text-muted-foreground border-t mt-3">
          {issues.length} active {issues.length === 1 ? 'issue' : 'issues'} detected across {new Set(issues.flatMap(i => i.affectedSystems)).size} systems
        </div>
      </CardContent>
    </Card>
  );
}
