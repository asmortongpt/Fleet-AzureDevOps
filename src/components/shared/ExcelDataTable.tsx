import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Filter, X, Download, Search } from 'lucide-react';
import React, { useState } from 'react';

interface ExcelDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  title?: string;
  enableFilters?: boolean;
  enableExport?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function ExcelDataTable<T>({
  data,
  columns,
  title,
  enableFilters = true,
  enableExport = true,
  onRowClick,
  className = ''
}: ExcelDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });
  const [globalFilter, setGlobalFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExportCSV = () => {
    const headers = table.getAllColumns().map(col => col.id).join(',');
    const rows = table.getFilteredRowModel().rows.map(row =>
      row.getVisibleCells().map(cell => {
        const value = cell.getValue();
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full backdrop-blur-xl bg-slate-900/95 border border-slate-700/60 rounded-lg shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          <p className="text-sm text-slate-400 mt-0.5">
            {table.getFilteredRowModel().rows.length} of {data.length} records
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="Search all columns..."
              className="pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64"
            />
          </div>

          {/* Filter Toggle */}
          {enableFilters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Filters
            </button>
          )}

          {/* Export Button */}
          {enableExport && (
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Column Filters */}
      {showFilters && (
        <div className="px-6 py-4 border-b border-slate-700/60 bg-slate-800/40">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {table.getAllColumns().filter(col => col.getCanFilter()).map(column => (
              <div key={column.id} className="flex flex-col gap-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  {column.id}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={(column.getFilterValue() as string) ?? ''}
                    onChange={e => column.setFilterValue(e.target.value)}
                    placeholder={`Filter ${column.id}...`}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  {column.getFilterValue() && (
                    <button
                      onClick={() => column.setFilterValue('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700/50 rounded"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {columnFilters.length > 0 && (
            <button
              onClick={() => setColumnFilters([])}
              className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium transition-all"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-800/95 backdrop-blur-sm z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-slate-700/60">
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:text-blue-400' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-slate-500">
                            {{
                              asc: <ChevronUp className="w-4 h-4 text-blue-400" />,
                              desc: <ChevronDown className="w-4 h-4 text-blue-400" />,
                            }[header.column.getIsSorted() as string] ?? <ChevronDown className="w-4 h-4 opacity-30" />}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/60' : ''
                } transition-colors`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-slate-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-4">
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => table.setPageSize(Number(e.target.value))}
            className="px-3 py-2 bg-slate-900/80 border border-slate-600/50 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {[25, 50, 100, 200].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>

          <span className="text-sm text-slate-400">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            First
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            Next
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded-lg text-sm font-medium transition-all"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
