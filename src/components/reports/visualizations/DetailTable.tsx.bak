import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface TableColumn {
  field: string;
  label: string;
  format?: 'currency' | 'integer' | 'percent' | 'date' | 'text';
  sortable?: boolean;
  width?: string;
}

interface DetailTableProps {
  title: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  pageSize?: number;
  onExport?: (format: 'csv' | 'xlsx') => void;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * DetailTable - Paginated, sortable data table for report details
 *
 * Features:
 * - Column sorting
 * - Pagination with page size selection
 * - Multiple format types
 * - Export to CSV/XLSX
 * - Responsive with horizontal scroll
 * - Accessible with ARIA labels
 */
export function DetailTable({
  title,
  columns,
  data,
  pageSize = 50,
  onExport,
  className = ''
}: DetailTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);

  // Format value based on column type
  const formatValue = (value: any, format?: TableColumn['format']): string => {
    if (value === null || value === undefined) return '-';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value);

      case 'percent':
        return `${(value * 100).toFixed(1)}%`;

      case 'integer':
        return new Intl.NumberFormat('en-US').format(Math.round(value));

      case 'date':
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

      case 'text':
      default:
        return String(value);
    }
  };

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, rowsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-indigo-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-indigo-600" />
    );
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {onExport && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('csv')}
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport('xlsx')}
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.field}
                  scope="col"
                  className={`px-2 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.field)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable !== false && getSortIcon(column.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.field}
                    className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap"
                  >
                    {formatValue(row[column.field], column.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
            {Math.min(currentPage * rowsPerPage, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="rows-per-page" className="text-sm text-gray-700">
              Rows per page:
            </label>
            <select
              id="rows-per-page"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="min-w-[2.5rem]"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
