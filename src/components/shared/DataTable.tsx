import { ReactNode } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LoadingSkeleton } from "./LoadingSkeleton"

interface Column<T> {
  key: string
  header: string
  accessor: (item: T) => ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  emptyMessage?: string
  caption?: string
  className?: string
  onSort?: (key: string) => void
  sortKey?: string
  sortDirection?: "asc" | "desc"
}

/**
 * Accessible data table component with built-in loading and empty states
 *
 * Features:
 * - Proper table semantics (scope, caption)
 * - Loading skeleton
 * - Empty state
 * - Sortable columns with aria-sort
 * - Keyboard accessible
 * - Responsive with horizontal scroll
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={vehicles}
 *   columns={[
 *     { key: 'name', header: 'Vehicle', accessor: v => v.name, sortable: true },
 *     { key: 'status', header: 'Status', accessor: v => <StatusBadge status={v.status} /> }
 *   ]}
 *   loading={isLoading}
 *   emptyMessage="No vehicles found"
 *   caption="Fleet vehicle list"
 * />
 * ```
 */
export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  emptyMessage = "No data available",
  caption,
  className,
  onSort,
  sortKey,
  sortDirection
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSkeleton type="table" count={5} />
  }

  const isEmpty = data.length === 0

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSort) {
      onSort(key)
    }
  }

  const getAriaSort = (key: string, sortable?: boolean) => {
    if (!sortable) return undefined
    if (sortKey !== key) return "none"
    return sortDirection === "asc" ? "ascending" : "descending"
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            {caption && (
              <caption className="sr-only">{caption}</caption>
            )}
            <thead className="border-b bg-muted/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn(
                      "text-left p-4 font-medium",
                      column.sortable && "cursor-pointer hover:bg-muted/70 select-none",
                      column.className
                    )}
                    onClick={() => handleSort(column.key, column.sortable)}
                    aria-sort={getAriaSort(column.key, column.sortable)}
                    tabIndex={column.sortable ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (column.sortable && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault()
                        handleSort(column.key, column.sortable)
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        <span aria-hidden="true">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isEmpty ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="p-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                (data || []).map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td
                        key={`${item.id}-${column.key}`}
                        className={cn("p-4", column.className)}
                      >
                        {column.accessor(item)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
