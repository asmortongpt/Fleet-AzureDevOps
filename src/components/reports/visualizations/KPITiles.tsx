import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';
import logger from '@/utils/logger';

export interface KPIMeasure {
  id: string;
  label: string;
  value: number;
  format: 'currency' | 'integer' | 'percent' | 'decimal';
  trend?: {
    direction: 'up' | 'down' | 'flat';
    value: number;
    label: string;
  };
  target?: number;
}

interface KPITilesProps {
  measures: KPIMeasure[];
  layout?: 'grid' | 'horizontal';
  className?: string;
}

/**
 * KPITiles - Display key performance indicators with formatting
 *
 * Features:
 * - Multiple format types (currency, integer, percent, decimal)
 * - Trend indicators with direction and value
 * - Target comparison with progress bar
 * - Responsive grid or horizontal layout
 * - Accessible markup with ARIA labels
 */
export function KPITiles({ measures, layout = 'grid', className = '' }: KPITilesProps) {
  // Format value based on type
  const formatValue = (value: number, format: KPIMeasure['format']): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);

      case 'percent':
        return `${(value * 100).toFixed(1)}%`;

      case 'decimal':
        return value.toFixed(2);

      case 'integer':
      default:
        return new Intl.NumberFormat('en-US').format(Math.round(value));
    }
  };

  // Get trend icon
  const getTrendIcon = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'flat':
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  // Get trend color
  const getTrendColor = (direction: 'up' | 'down' | 'flat') => {
    switch (direction) {
      case 'up':
        return 'text-green-600 bg-green-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'flat':
      default:
        return 'text-slate-700 bg-gray-50';
    }
  };

  // Calculate progress to target
  const calculateProgress = (value: number, target: number): number => {
    if (!target) return 0;
    return Math.min((value / target) * 100, 100);
  };

  const gridClass = layout === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2'
    : 'flex flex-wrap gap-2';

  return (
    <div className={`${gridClass} ${className}`}>
      {measures.map((measure) => {
        const progress = measure.target ? calculateProgress(measure.value, measure.target) : null;
        const progressColor = progress && progress >= 90 ? 'bg-green-500' : progress && progress >= 70 ? 'bg-yellow-500' : 'bg-red-500';

        return (
          <Card
            key={measure.id}
            className="p-3 hover:shadow-md transition-shadow"
            role="article"
            aria-label={`${measure.label} KPI: ${formatValue(measure.value, measure.format)}`}
          >
            {/* Label and trend */}
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wide">
                {measure.label}
              </h3>
              {measure.trend && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(measure.trend.direction)}`}
                  aria-label={`Trend: ${measure.trend.label}`}
                >
                  {getTrendIcon(measure.trend.direction)}
                  <span>{measure.trend.value}%</span>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mb-3">
              <div className="text-base font-bold text-gray-900">
                {formatValue(measure.value, measure.format)}
              </div>
              {measure.trend && (
                <div className="text-xs text-gray-500 mt-1">
                  {measure.trend.label}
                </div>
              )}
            </div>

            {/* Target progress */}
            {measure.target && progress !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span>Target: {formatValue(measure.target, measure.format)}</span>
                  <span className="font-medium">{progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progress: ${progress.toFixed(0)}%`}
                  />
                </div>
              </div>
            )}

            {/* Drill-down indicator */}
            <div className="mt-2 pt-3 border-t border-gray-100">
              <button
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                onClick={() => {
                  // Handle drill-down
                  logger.info('Drill down into', measure.id);
                }}
              >
                <span>View Details</span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
