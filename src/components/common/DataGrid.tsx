import { useMemo, useState } from "react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CaretLeft,
  CaretRight,
  CaretDoubleLeft,
  CaretDoubleRight,
  CaretUp,
  CaretDown,
  MagnifyingGlass,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

export interface DataGridProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  enableSearch?: boolean
  searchPlaceholder?: string
  enablePagination?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  className?: string
  emptyMessage?: string
}

export function DataGrid<TData>({
  data,
  columns,
  enableSearch = false,
  searchPlaceholder = "Search...",
  enablePagination = true,
  pageSize = 20,
  onRowClick,
  className,
  emptyMessage = "No results found",
}: DataGridProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className={cn("space-y-4", className)}>
      {enableSearch && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50 sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "h-10 font-semibold",
                      header.column.getCanSort() && "cursor-pointer select-none"
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getCanSort() && (
                        <div className="ml-auto">
                          {{
                            asc: <CaretUp className="w-4 h-4" />,
                            desc: <CaretDown className="w-4 h-4" />,
                          }[header.column.getIsSorted() as string] ?? (
                            <div className="w-4 h-4 opacity-30">
                              <CaretUp className="w-3 h-3 -mb-1" />
                              <CaretDown className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "h-8 transition-colors",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-muted-foreground">
            Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * pageSize,
              data.length
            )}{" "}
            of {data.length} results
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <CaretDoubleLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <CaretLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Page</span>
              <span className="font-medium">
                {table.getState().pagination.pageIndex + 1}
              </span>
              <span className="text-muted-foreground">of</span>
              <span className="font-medium">{table.getPageCount()}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <CaretRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <CaretDoubleRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
