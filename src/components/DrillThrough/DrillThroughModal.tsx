import { X, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useDrillThrough } from '../../hooks/drill-through/useDrillThrough';
import type { DrillThroughConfig, ExportFormat } from '../../types/drill-through';

import { formatCurrency, formatDate, formatNumber } from '@/utils/format-helpers';
import logger from '@/utils/logger';

interface DrillThroughModalProps {
  /** Drill-through configuration */
  config: DrillThroughConfig;
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
}

/**
 * Universal drill-through modal component
 * Displays underlying records for any aggregated metric with export functionality
 */
export function DrillThroughModal({ config, isOpen, onClose }: DrillThroughModalProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const {
    data,
    isLoading,
    error,
    page,
    nextPage,
    previousPage,
    
    
    
    exportData,
    isExporting,
    refetch,
  } = useDrillThrough({
    entityType: config.entityType,
    filters: config.filters,
    enabled: isOpen,
    apiEndpoint: config.apiEndpoint,
  });

  // Handle column sort
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(columnKey);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!data?.data || !sortBy) return data?.data || [];

    return [...data.data].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      if (aVal === bVal) return 0;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.data, sortBy, sortDirection]);

  // Export handlers
  const handleExport = async (format: ExportFormat) => {
    try {
      await exportData(format);
    } catch (err) {
      logger.error('Export failed:', err);
      toast.error('Export failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
      <div className="bg-[#111111] rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/[0.04]">
          <div>
            <h2 className="text-sm font-bold text-white">
              {config.title}
            </h2>
            {config.description && (
              <p className="text-sm text-white/60 mt-1">
                {config.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b border-white/[0.04] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            {config.enableFilters !== false && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-2 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white/[0.04] text-white/60 border border-white/[0.04]'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            )}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-2 py-2 rounded-lg flex items-center gap-2 bg-white/[0.04] text-white/60 border border-white/[0.04] hover:bg-white/[0.06] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {config.enableExport !== false && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">Export:</span>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting || !data?.data?.length}
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                CSV
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={isExporting || !data?.data?.length}
                className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting || !data?.data?.length}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                PDF
              </button>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {data?.summary && (
          <div className="p-2 bg-emerald-500/5 border-b border-white/[0.04]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(data.summary).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-white/40 uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {typeof value === 'number' ? formatNumber(value) : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-2">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-emerald-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-center">
              <p className="text-red-800 dark:text-red-200">
                Error loading data: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && sortedData.length === 0 && (
            <div className="text-center py-12 text-white/40">
              No records found matching the selected filters.
            </div>
          )}

          {!isLoading && !error && sortedData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.04]">
                    {config.columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-2 py-3 text-left text-sm font-semibold text-white border-b border-white/[0.04] ${
                          column.sortable !== false ? 'cursor-pointer hover:bg-white/[0.06]' : ''
                        }`}
                        style={{ width: column.width }}
                        onClick={() =>
                          column.sortable !== false && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable !== false && sortBy === column.key && (
                            <span className="text-emerald-800 dark:text-emerald-700">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className="hover:bg-white/[0.04] transition-colors"
                    >
                      {config.columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-2 py-3 text-sm text-white/80 border-b border-white/[0.04]"
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : formatValue(row[column.key], column.type)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-2 border-t border-white/[0.04] bg-white/[0.02]">
            <p className="text-sm text-white/60">
              Showing {((page - 1) * (data.pageSize ?? 0)) + 1} to{' '}
              {Math.min(page * (data.pageSize ?? 0), data.totalCount ?? 0)} of{' '}
              {formatNumber(data.totalCount ?? 0)} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={previousPage}
                disabled={page === 1}
                className="px-3 py-2 rounded bg-white/[0.04] text-white/60 border border-white/[0.04] hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-white/60">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={page === data.totalPages}
                className="px-3 py-2 rounded bg-white/[0.04] text-white/60 border border-white/[0.04] hover:bg-white/[0.06] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to format values based on type
function formatValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '—';

  switch (type) {
    case 'date':
      return formatDate(value as string | Date);
    case 'currency':
      return formatCurrency(value as number);
    case 'number':
      return typeof value === 'number' ? formatNumber(value) : String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}