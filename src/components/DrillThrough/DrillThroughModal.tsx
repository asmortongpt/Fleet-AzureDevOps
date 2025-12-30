import { X, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useDrillThrough } from '../../hooks/drill-through/useDrillThrough';
import type { DrillThroughConfig, ExportFormat } from '../../types/drill-through';

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
      alert('Export failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {config.title}
            </h2>
            {config.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {config.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            {config.enableFilters !== false && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            )}
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {config.enableExport !== false && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Export:</span>
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
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(data.summary).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-red-800 dark:text-red-200">
                Error loading data: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && sortedData.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No records found matching the selected filters.
            </div>
          )}

          {!isLoading && !error && sortedData.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    {config.columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600 ${
                          column.sortable !== false ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''
                        }`}
                        style={{ width: column.width }}
                        onClick={() =>
                          column.sortable !== false && handleSort(column.key)
                        }
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {column.sortable !== false && sortBy === column.key && (
                            <span className="text-blue-600 dark:text-blue-400">
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
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {config.columns.map((column) => (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
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
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((page - 1) * (data.pageSize ?? 0)) + 1} to{' '}
              {Math.min(page * (data.pageSize ?? 0), data.totalCount ?? 0)} of{' '}
              {(data.totalCount ?? 0).toLocaleString()} records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={previousPage}
                disabled={page === 1}
                className="px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={nextPage}
                disabled={page === data.totalPages}
                className="px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      return new Date(value as string | Date).toLocaleDateString();
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value as number);
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}