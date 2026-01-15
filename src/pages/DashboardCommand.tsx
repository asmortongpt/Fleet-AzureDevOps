import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface DashboardStats {
  healthScore: number;
  activeIssues: {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedArea: string;
    timestamp: string;
  }[];
  recentActivity: {
    id: string;
    action: string;
    outcome: string;
    timestamp: string;
  }[];
  topSignals: {
    id: string;
    label: string;
    value: string;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  healthTrend: {
    timestamp: string;
    score: number;
  }[];
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard stats');
  }
  return response.json();
};

const DashboardCommand: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'5m' | '1h' | '24h'>('1h');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats', timeRange],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000,
    staleTime: 30000,
  });

  const getHealthGradient = (score: number) => {
    return `linear-gradient(to right, #ef4444 0%, #fbbf24 ${score}%, #22c55e 100%)`;
  };

  const getTrendDirection = (trend: { score: number }[] | undefined) => {
    if (!trend || trend.length < 2) return 'neutral';
    const lastTwo = trend.slice(-2);
    return lastTwo[1].score > lastTwo[0].score ? 'up' : lastTwo[1].score < lastTwo[0].score ? 'down' : 'neutral';
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <AlertTriangle className="mx-auto text-red-500 w-8 h-8 mb-2" />
          <p className="text-lg font-medium text-gray-900">Error loading dashboard</p>
          <p className="text-sm text-gray-500 mt-1">{error?.message || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Fleet Command Center</h1>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 col-span-1 lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">System Health</h2>
            {isLoading ? (
              <div className="h-12 bg-gray-200 rounded-md animate-pulse w-1/2" />
            ) : (
              <>
                <div
                  className="h-6 rounded-md mb-2"
                  style={{ background: getHealthGradient(data?.healthScore || 0) }}
                />
                <p className="text-2xl font-bold text-gray-900">{data?.healthScore}% Operational</p>
                <p className="text-sm text-gray-500">
                  Trend: {getTrendDirection(data?.healthTrend).toUpperCase()}
                </p>
              </>
            )}
          </div>

          {/* Health Trend Chart */}
          <div className="bg-white rounded-lg shadow-md p-6 col-span-1 lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Health Trend</h2>
            <div className="flex gap-2 mb-4">
              {['5m', '1h', '24h'].map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range as '5m' | '1h' | '24h')}
                  className="text-sm"
                >
                  {range}
                </Button>
              ))}
            </div>
            {isLoading ? (
              <div className="h-64 bg-gray-200 rounded-md animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.healthTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="timestamp" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Issues */}
          <div className="bg-white rounded-lg shadow-md p-6 col-span-1 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Active Issues</h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-md animate-pulse" />
                  ))}
              </div>
            ) : data?.activeIssues.length ? (
              <div className="space-y-4">
                {data.activeIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-4 rounded-md border-l-4 ${
                      issue.severity === 'critical'
                        ? 'border-red-500 bg-red-50'
                        : issue.severity === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{issue.message}</p>
                    <p className="text-sm text-gray-500">
                      {issue.affectedArea} • {new Date(issue.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active issues detected.</p>
            )}
          </div>

          {/* Top Signals */}
          <div className="bg-white rounded-lg shadow-md p-6 col-span-1">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Signals</h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded-md animate-pulse" />
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                {data?.topSignals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="flex items-center justify-between">
                    <span className="text-gray-900 font-medium">{signal.label}</span>
                    <span
                      className={`flex items-center gap-1 ${
                        signal.impact === 'positive'
                          ? 'text-green-500'
                          : signal.impact === 'negative'
                          ? 'text-red-500'
                          : 'text-gray-500'
                      }`}
                    >
                      {signal.value}
                      {signal.impact === 'positive' && <CheckCircle className="w-4 h-4" />}
                      {signal.impact === 'negative' && <AlertTriangle className="w-4 h-4" />}
                      {signal.impact === 'neutral' && <Clock className="w-4 h-4" />}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6 col-span-1 lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            {isLoading ? (
              <div className="space-y-4">
                {Array(3)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded-md animate-pulse" />
                  ))}
              </div>
            ) : data?.recentActivity.length ? (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 rounded-md bg-gray-50">
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">
                      {activity.outcome} • {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCommand;