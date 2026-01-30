/**
 * Dynamic Report Renderer
 * Renders reports dynamically based on report definitions from the reporting library
 */

import { FileDown, FileText } from 'lucide-react';
import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

import type { ReportDefinition, ReportVisual, ReportMeasure } from '../../services/ReportLoaderService';
import logger from '@/utils/logger';

interface DynamicReportRendererProps {
  report: ReportDefinition;
  data: any[];
  filters?: Record<string, any>;
  onExport?: (format: 'csv' | 'xlsx' | 'pdf') => void;
  onDrillthrough?: (targetReport: string, params: Record<string, any>) => void;
}

const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // green-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
];

/**
 * Table Renderer Component - Extracted to use hooks properly
 */
interface TableRendererProps {
  visual: ReportVisual;
  data: any[];
  formatValue: (value: any, format?: string) => string;
}

const TableRenderer: React.FC<TableRendererProps> = ({ visual, data, formatValue }) => {
  const pageSize = visual.pagination?.pageSize || 50;
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(data.length / pageSize);

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 mb-3">
      <h3 className="text-base font-semibold text-white mb-3">{visual.title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {visual.columns!.map((col) => (
                <th key={col.field} className="px-2 py-3 text-left text-sm font-semibold text-white/80">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                {visual.columns!.map((col) => (
                  <td key={col.field} className="px-2 py-3 text-sm text-white/90">
                    {formatValue(row[col.field], col.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
          <div className="text-sm text-white/60">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DynamicReportRenderer: React.FC<DynamicReportRendererProps> = ({
  report,
  data,
  filters,
  onExport,
  onDrillthrough
}) => {
  const [drilldownState, setDrilldownState] = useState<Record<string, any>>({});

  /**
   * Format value based on format type
   */
  const formatValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);

      case 'percent':
        return `${(value * 100).toFixed(1)}%`;

      case 'integer':
        return new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 0
        }).format(value);

      case 'decimal':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);

      case 'date':
        return new Date(value).toLocaleDateString('en-US');

      default:
        return String(value);
    }
  };

  /**
   * Calculate measure value from data
   */
  const calculateMeasure = (measure: ReportMeasure, dataset: any[]): number => {
    if (!dataset || dataset.length === 0) return 0;

    if (measure.expression) {
      // Handle expressions like "available_vehicle_count/total_vehicle_count"
      // Uses mathjs for safe mathematical expression evaluation
      try {
        // Lazy import mathjs to avoid bundle bloat
        const math = require('mathjs');
        const context = dataset[0];

        // Create safe evaluation scope from first data row
        const scope: Record<string, number> = {};
        Object.keys(context).forEach(key => {
          const value = context[key];
          scope[key] = typeof value === 'number' ? value : 0;
        });

        // Parse and compile the expression safely
        const node = math.parse(measure.expression);
        const code = node.compile();
        const result = code.evaluate(scope);

        return typeof result === 'number' ? result : 0;
      } catch (error) {
        logger.warn(`Failed to evaluate expression: ${measure.expression}`, error);
        return 0;
      }
    }

    if (!measure.field) return 0;

    const values = dataset.map(row => row[measure.field!]).filter(v => v !== null && v !== undefined);

    switch (measure.aggregation) {
      case 'sum':
        return values.reduce((acc, val) => acc + Number(val), 0);

      case 'avg':
        return values.reduce((acc, val) => acc + Number(val), 0) / values.length;

      case 'count':
        return values.length;

      case 'distinctCount':
        return new Set(values).size;

      case 'min':
        return Math.min(...values.map(Number));

      case 'max':
        return Math.max(...values.map(Number));

      default:
        return values.reduce((acc, val) => acc + Number(val), 0);
    }
  };

  /**
   * Render KPI Tiles
   */
  const renderKPITiles = (visual: ReportVisual) => {
    if (!visual.measures) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {visual.measures.map((measure) => {
          const value = calculateMeasure(measure, data);
          const formattedValue = formatValue(value, measure.format);

          return (
            <div
              key={measure.id}
              className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="text-sm text-white/60 mb-2">{measure.label}</div>
              <div className="text-base font-bold text-white">{formattedValue}</div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * Render Line Chart
   */
  const renderLineChart = (visual: ReportVisual) => {
    if (!visual.encoding) return null;

    const { x, y, color } = visual.encoding;
    if (!x || !y) return null;

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 mb-3">
        <h3 className="text-base font-semibold text-white mb-3">{visual.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={x.field} stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            {color ? (
              // Multiple lines by category
              Array.from(new Set(data.map(d => d[color.field]))).map((category, idx) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={y.field}
                  data={data.filter(d => d[color.field] === category)}
                  name={String(category)}
                  stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={y.field}
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  /**
   * Render Bar Chart
   */
  const renderBarChart = (visual: ReportVisual) => {
    if (!visual.encoding) return null;

    const { x, y, color } = visual.encoding;
    if (!x || !y) return null;

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 mb-3">
        <h3 className="text-base font-semibold text-white mb-3">{visual.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey={x.field} stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey={y.field} fill={CHART_COLORS[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  /**
   * Render Pie Chart
   */
  const renderPieChart = (visual: ReportVisual) => {
    if (!visual.encoding) return null;

    const { x, y } = visual.encoding;
    if (!x || !y) return null;

    // Aggregate data for pie chart
    const pieData = data.reduce((acc, row) => {
      const category = row[x.field];
      const value = row[y.field];

      const existing = acc.find((item: any) => item.name === category);
      if (existing) {
        existing.value += Number(value);
      } else {
        acc.push({ name: category, value: Number(value) });
      }

      return acc;
    }, [] as any[]);

    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 mb-3">
        <h3 className="text-base font-semibold text-white mb-3">{visual.title}</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => entry.name}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0,0,0,0.9)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  /**
   * Render Data Table
   */
  const renderTable = (visual: ReportVisual) => {
    if (!visual.columns) return null;
    return <TableRenderer visual={visual} data={data} formatValue={formatValue} />;
  };

  /**
   * Render visual based on type
   */
  const renderVisual = (visual: ReportVisual) => {
    switch (visual.type) {
      case 'kpiTiles':
        return renderKPITiles(visual);

      case 'line':
        return renderLineChart(visual);

      case 'bar':
        return renderBarChart(visual);

      case 'pie':
        return renderPieChart(visual);

      case 'table':
        return renderTable(visual);

      default:
        return (
          <div className="bg-white/5 backdrop-blur-xl rounded-lg p-3 border border-white/10 mb-3">
            <div className="text-white/60">Unsupported visual type: {visual.type}</div>
          </div>
        );
    }
  };

  /**
   * Render export buttons
   */
  const renderExportButtons = () => {
    if (!report.exports || !onExport) return null;

    return (
      <div className="flex gap-3 mb-3">
        {report.exports.map((exp, idx) => (
          <button
            key={idx}
            onClick={() => onExport(exp.format)}
            className="flex items-center gap-2 px-2 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            {exp.format === 'pdf' ? (
              <FileText className="w-4 h-4" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            Export {exp.format.toUpperCase()}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="p-3">
      {/* Report Header */}
      <div className="mb-3">
        <h2 className="text-base font-bold text-white mb-2">{report.title}</h2>
        {report.description && (
          <p className="text-white/60">{report.description}</p>
        )}
      </div>

      {/* Export Buttons */}
      {renderExportButtons()}

      {/* Visuals */}
      {report.visuals.map((visual) => (
        <div key={visual.id}>
          {renderVisual(visual)}
        </div>
      ))}

      {/* No Data State */}
      {data.length === 0 && (
        <div className="bg-white/5 backdrop-blur-xl rounded-lg p-12 border border-white/10 text-center">
          <div className="text-white/60 text-sm">No data available for the selected filters</div>
        </div>
      )}
    </div>
  );
};

export default DynamicReportRenderer;
