import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card } from '@/components/ui/card';

export interface TrendDataPoint {
  [key: string]: string | number;
}

interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  xField: string;
  yField: string;
  colorField?: string;
  onDrillDown?: (dataPoint: TrendDataPoint) => void;
  className?: string;
}

/**
 * TrendChart - Line chart for time-series data with drill-down
 *
 * Features:
 * - Responsive container
 * - Interactive tooltips
 * - Multi-series support via color field
 * - Click to drill down
 * - Accessible chart with proper labels
 */
export function TrendChart({
  title,
  data,
  xField,
  yField,
  colorField,
  onDrillDown,
  className = ''
}: TrendChartProps) {
  // Group data by color field if provided
  const series = useMemo(() => {
    if (!colorField) {
      return [{ name: yField, data, color: '#6366f1' }];
    }

    const grouped: Record<string, TrendDataPoint[]> = {};
    data.forEach((point) => {
      const key = String(point[colorField]);
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(point);
    });

    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#3b82f6', // blue
      '#ef4444', // red
      '#14b8a6', // teal
    ];

    return Object.entries(grouped).map(([name, seriesData], index) => ({
      name,
      data: seriesData,
      color: colors[index % colors.length]
    }));
  }, [data, colorField, yField]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700">{entry.name}:</span>
            <span className="font-medium text-gray-900">
              {typeof entry.value === 'number'
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Handle click
  const handleClick = (data: any) => {
    if (onDrillDown && data?.activePayload?.[0]?.payload) {
      onDrillDown(data.activePayload[0].payload);
    }
  };

  return (
    <Card className={`p-3 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={data}
          onClick={handleClick}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey={xField}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
                compactDisplay: 'short'
              }).format(value)
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e5e7eb' }} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={yField}
              data={s.data}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 4, fill: s.color }}
              activeDot={{ r: 6, cursor: onDrillDown ? 'pointer' : 'default' }}
              name={s.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {onDrillDown && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Click on any data point to drill down
        </p>
      )}
    </Card>
  );
}
