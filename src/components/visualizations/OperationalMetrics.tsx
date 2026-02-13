import { TrendingUp, TrendingDown, Minus, Clock, Fuel, Zap, Navigation } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

/**
 * Operational Metrics Gauges
 *
 * Real-time operational KPIs with visual indicators
 * - On-time performance
 * - Utilization rates
 * - Efficiency metrics
 * - Live updating values
 * - Trend indicators
 */

interface Metric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}

interface OperationalMetricsProps {
  metrics?: Metric[];
  layout?: 'grid' | 'row';
}

const defaultMetrics: Metric[] = [
  {
    id: 'on-time',
    label: 'On-Time Performance',
    value: 94,
    target: 95,
    unit: '%',
    trend: 'up',
    trendValue: 2.5,
    icon: Clock,
    color: 'green'
  },
  {
    id: 'utilization',
    label: 'Fleet Utilization',
    value: 78,
    target: 85,
    unit: '%',
    trend: 'down',
    trendValue: -1.2,
    icon: Zap,
    color: 'blue'
  },
  {
    id: 'fuel-efficiency',
    label: 'Fuel Efficiency',
    value: 8.2,
    target: 8.5,
    unit: 'MPG',
    trend: 'up',
    trendValue: 0.3,
    icon: Fuel,
    color: 'amber'
  },
  {
    id: 'distance',
    label: 'Distance Today',
    value: 2847,
    target: 3000,
    unit: 'mi',
    trend: 'stable',
    trendValue: 0,
    icon: Navigation,
    color: 'purple'
  }
];

export function OperationalMetrics({ metrics = defaultMetrics, layout = 'grid' }: OperationalMetricsProps) {
  // Get color classes
  const getColorClasses = (color: Metric['color'], isAccent = false) => {
    const colors = {
      blue: isAccent ? 'bg-blue-500 text-blue-700' : 'text-blue-700 bg-blue-50 border-blue-200',
      green: isAccent ? 'bg-green-500 text-green-700' : 'text-green-700 bg-green-50 border-green-200',
      amber: isAccent ? 'bg-amber-500 text-amber-700' : 'text-amber-700 bg-amber-50 border-amber-200',
      purple: isAccent ? 'bg-purple-500 text-purple-700' : 'text-purple-700 bg-purple-50 border-purple-200',
      red: isAccent ? 'bg-red-500 text-red-700' : 'text-red-700 bg-red-50 border-red-200'
    };
    return colors[color];
  };

  // Get progress color
  const getProgressColor = (color: Metric['color']) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      amber: 'bg-amber-500',
      purple: 'bg-purple-500',
      red: 'bg-red-500'
    };
    return colors[color];
  };

  // Get trend icon
  const getTrendIcon = (trend?: Metric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      case 'stable':
        return <Minus className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Get trend color
  const getTrendColor = (trend?: Metric['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-slate-500';
      default:
        return 'text-slate-500';
    }
  };

  const gridClass = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
    : 'flex flex-col sm:flex-row gap-4';

  return (
    <div className={gridClass}>
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const percentage = (metric.value / metric.target) * 100;
        const isAboveTarget = metric.value >= metric.target;

        return (
          <Card
            key={metric.id}
            className={`border-l-4 ${getColorClasses(metric.color).split(' ').find(c => c.startsWith('border-'))}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Icon className={`h-4 w-4 ${getColorClasses(metric.color).split(' ').find(c => c.startsWith('text-'))}`} />
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Main value */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">
                    {metric.value.toLocaleString()}
                  </span>
                  <span className="text-sm text-slate-600">{metric.unit}</span>
                </div>

                {/* Trend indicator */}
                {metric.trend && (
                  <div className={`flex items-center gap-1 text-xs mt-1 ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    <span>
                      {metric.trendValue !== undefined && Math.abs(metric.trendValue)}
                      {metric.unit === '%' ? 'pp' : metric.unit} from yesterday
                    </span>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Target: {metric.target}{metric.unit}</span>
                  <span className="font-medium">{percentage.toFixed(0)}%</span>
                </div>
                <Progress
                  value={Math.min(percentage, 100)}
                  className="h-2"
                  indicatorClassName={getProgressColor(metric.color)}
                />
              </div>

              {/* Status indicator */}
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Status</span>
                  <span className={`font-medium ${isAboveTarget ? 'text-green-600' : 'text-amber-600'}`}>
                    {isAboveTarget ? 'Above Target' : 'Below Target'}
                  </span>
                </div>
              </div>

              {/* Real-time indicator */}
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>Live</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Gauge variant for circular display
interface GaugeProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: Metric['color'];
  size?: 'sm' | 'md' | 'lg';
}

export function CircularGauge({
  value,
  max,
  label,
  unit,
  color = 'blue',
  size = 'md'
}: GaugeProps) {
  const percentage = (value / max) * 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizes = {
    sm: { svg: 100, text: 'text-xl', label: 'text-xs' },
    md: { svg: 140, text: 'text-3xl', label: 'text-sm' },
    lg: { svg: 180, text: 'text-4xl', label: 'text-base' }
  };

  const colorMap = {
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    amber: 'stroke-amber-500',
    purple: 'stroke-purple-500',
    red: 'stroke-red-500'
  };

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative" style={{ width: sizes[size].svg, height: sizes[size].svg }}>
        <svg className="transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            className={colorMap[color]}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${sizes[size].text} font-bold text-slate-900`}>{value}</span>
          <span className="text-xs text-slate-600">{unit}</span>
        </div>
      </div>

      <span className={`${sizes[size].label} font-medium text-slate-700 mt-2 text-center`}>
        {label}
      </span>
    </div>
  );
}
