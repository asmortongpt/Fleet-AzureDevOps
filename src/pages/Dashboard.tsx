import { RefreshCw } from 'lucide-react';
import React from 'react';

import { ActiveIssues } from '@/components/dashboard/ActiveIssues';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SystemHealth } from '@/components/dashboard/SystemHealth';
import { TopSignals } from '@/components/dashboard/TopSignals';
import { Button } from '@/components/ui/button';

/**
 * Fleet Management Dashboard - Primary Landing Page
 *
 * PURPOSE: Provide real-time operational intelligence at a glance
 *
 * DESIGN PRINCIPLES:
 * - Immediate answer to "Is Fleet working?"
 * - Health metrics with status indicators
 * - Clear visual hierarchy
 * - Time-based context for all data
 * - Action-oriented alerts and signals
 *
 * CONTAINS:
 * 1. Global System Health - real-time health metrics
 * 2. Active Issues - alerts requiring attention
 * 3. Recent Activity - operational events with context
 * 4. Top 5 Signals - key performance indicators
 */
export default function Dashboard() {
  const [lastRefresh, setLastRefresh] = React.useState(new Date());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    setLastRefresh(new Date());

    // Force refresh by triggering re-renders in child components
    // This will cause all useEffect hooks to re-fetch data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, []);

  // Auto-refresh every 2 minutes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto p-4 lg:p-6 max-w-[1800px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Fleet Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time system status and operational intelligence
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={isRefreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              Refresh
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live</span>
            </div>
            <span>•</span>
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Column: System Health + Active Issues */}
          <div className="lg:col-span-5 space-y-4 lg:space-y-6">
            {/* System Health - Priority 1 */}
            <SystemHealth key={lastRefresh.toISOString()} />

            {/* Active Issues - Priority 2 */}
            <ActiveIssues key={lastRefresh.toISOString()} />
          </div>

          {/* Middle Column: Top Signals */}
          <div className="lg:col-span-4">
            <TopSignals
              key={lastRefresh.toISOString()}
              className="h-full"
            />
          </div>

          {/* Right Column: Recent Activity */}
          <div className="lg:col-span-3">
            <RecentActivity
              key={lastRefresh.toISOString()}
              className="h-full"
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 p-4 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Real-time monitoring</span>
              <span>•</span>
              <span>Live data</span>
              <span>•</span>
              <span>Auto-refresh every 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Data source:</span>
              <code className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                /api/dashboard/*
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
