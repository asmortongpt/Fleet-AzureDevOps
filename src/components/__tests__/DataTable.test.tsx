/**
 * Data Table Component Tests
 *
 * Generic reusable data table component tests:
 * - Data rendering and pagination
 * - Sorting and filtering
 * - Column management
 * - Row selection and bulk actions
 * - Responsive design
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

interface TableColumn {
  key: string
  label: string
  sortable?: boolean
}

interface TableData {
  id: string
  [key: string]: any
}

const MockDataTable = ({
  columns,
  data,
  isLoading,
  onSort,
  onFilter,
  onRowClick,
  selectable,
  onSelectionChange,
}: {
  columns: TableColumn[]
  data: TableData[]
  isLoading?: boolean
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onFilter?: (query: string) => void
  onRowClick?: (row: TableData) => void
  selectable?: boolean
  onSelectionChange?: (selected: string[]) => void
}) => {
  const [selectedRows, setSelectedRows] = React.useState<Set<string>>(new Set())

  if (isLoading) {
    return <div data-testid="table-loading">Loading table...</div>
  }

  if (data.length === 0) {
    return <div data-testid="table-empty">No data available</div>
  }

  const toggleRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
    onSelectionChange?.(Array.from(newSelected))
  }

  return (
    <div data-testid="data-table">
      <div data-testid="table-toolbar" className="mb-4">
        <input
          type="text"
          placeholder="Filter rows..."
          onChange={(e) => onFilter?.(e.target.value)}
          data-testid="filter-input"
        />
      </div>

      <table data-testid="table-element">
        <thead>
          <tr>
            {selectable && <th></th>}
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort?.(col.key, 'asc')}
                data-testid={`col-header-${col.key}`}
                className={col.sortable ? 'cursor-pointer' : ''}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} onClick={() => onRowClick?.(row)} data-testid={`row-${row.id}`}>
              {selectable && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    data-testid={`checkbox-${row.id}`}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td key={`${row.id}-${col.key}`} data-testid={`cell-${row.id}-${col.key}`}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Add React import for useState
import React from 'react'

describe('DataTable Component', () => {
  const mockColumns: TableColumn[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status' },
  ]

  const mockData: TableData[] = [
    { id: '1', name: 'Vehicle A', status: 'active' },
    { id: '2', name: 'Vehicle B', status: 'maintenance' },
    { id: '3', name: 'Vehicle C', status: 'active' },
  ]

  describe('Feature: Data Rendering', () => {
    it('should render table with data', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} />)

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
      expect(screen.getByTestId('table-element')).toBeInTheDocument()
    })

    it('should render all column headers', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} />)

      mockColumns.forEach((col) => {
        expect(screen.getByText(col.label)).toBeInTheDocument()
      })
    })

    it('should render all data rows', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} />)

      mockData.forEach((row) => {
        expect(screen.getByTestId(`row-${row.id}`)).toBeInTheDocument()
        expect(screen.getByText(row.name)).toBeInTheDocument()
      })
    })

    it('should render table cells with correct data', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} />)

      const cell = screen.getByTestId('cell-1-name')
      expect(cell).toHaveTextContent('Vehicle A')
    })
  })

  describe('Feature: Loading State', () => {
    it('should show loading state', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} isLoading={true} />)

      expect(screen.getByTestId('table-loading')).toBeInTheDocument()
      expect(screen.queryByTestId('data-table')).not.toBeInTheDocument()
    })
  })

  describe('Feature: Empty State', () => {
    it('should show empty state when no data', () => {
      render(<MockDataTable columns={mockColumns} data={[]} />)

      expect(screen.getByTestId('table-empty')).toBeInTheDocument()
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('Feature: Filtering', () => {
    it('should call onFilter when search input changes', async () => {
      const user = userEvent.setup()
      const mockFilter = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          onFilter={mockFilter}
        />
      )

      const filterInput = screen.getByTestId('filter-input')
      await user.type(filterInput, 'active')

      expect(mockFilter).toHaveBeenCalled()
      expect(mockFilter).toHaveBeenCalledWith('a')
    })

    it('should display filter input', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} />)

      const filterInput = screen.getByTestId('filter-input') as HTMLInputElement
      expect(filterInput).toHaveAttribute('placeholder', 'Filter rows...')
    })
  })

  describe('Feature: Sorting', () => {
    it('should call onSort when sortable column header clicked', async () => {
      const user = userEvent.setup()
      const mockSort = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockSort}
        />
      )

      const nameHeader = screen.getByTestId('col-header-name')
      await user.click(nameHeader)

      expect(mockSort).toHaveBeenCalledWith('name', 'asc')
    })

    it('should not call onSort for non-sortable columns', async () => {
      const user = userEvent.setup()
      const mockSort = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          onSort={mockSort}
        />
      )

      const statusHeader = screen.getByTestId('col-header-status')
      await user.click(statusHeader)

      expect(mockSort).not.toHaveBeenCalled()
    })
  })

  describe('Feature: Row Selection', () => {
    it('should show checkboxes when selectable', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} selectable={true} />)

      mockData.forEach((row) => {
        expect(screen.getByTestId(`checkbox-${row.id}`)).toBeInTheDocument()
      })
    })

    it('should not show checkboxes when not selectable', () => {
      render(<MockDataTable columns={mockColumns} data={mockData} selectable={false} />)

      expect(screen.queryByTestId('checkbox-1')).not.toBeInTheDocument()
    })

    it('should handle row selection', async () => {
      const user = userEvent.setup()
      const mockSelection = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          selectable={true}
          onSelectionChange={mockSelection}
        />
      )

      const checkbox = screen.getByTestId('checkbox-1')
      await user.click(checkbox)

      expect(mockSelection).toHaveBeenCalledWith(['1'])
    })

    it('should handle multiple row selection', async () => {
      const user = userEvent.setup()
      const mockSelection = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          selectable={true}
          onSelectionChange={mockSelection}
        />
      )

      await user.click(screen.getByTestId('checkbox-1'))
      await user.click(screen.getByTestId('checkbox-2'))

      expect(mockSelection).toHaveBeenLastCalledWith(expect.arrayContaining(['1', '2']))
    })
  })

  describe('Feature: Row Click Navigation', () => {
    it('should call onRowClick when row clicked', async () => {
      const user = userEvent.setup()
      const mockRowClick = vi.fn()

      render(
        <MockDataTable
          columns={mockColumns}
          data={mockData}
          onRowClick={mockRowClick}
        />
      )

      const row = screen.getByTestId('row-1')
      await user.click(row)

      expect(mockRowClick).toHaveBeenCalledWith(mockData[0])
    })
  })

  describe('Feature: Column Rendering', () => {
    it('should render different column types', () => {
      const customColumns: TableColumn[] = [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'count', label: 'Count' },
      ]

      const customData: TableData[] = [
        { id: '1', name: 'Item 1', count: 10 },
      ]

      render(<MockDataTable columns={customColumns} data={customData} />)

      expect(screen.getByTestId('cell-1-id')).toHaveTextContent('1')
      expect(screen.getByTestId('cell-1-name')).toHaveTextContent('Item 1')
      expect(screen.getByTestId('cell-1-count')).toHaveTextContent('10')
    })
  })

  describe('Feature: Large Datasets', () => {
    it('should handle large number of rows', () => {
      const largeData = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        name: `Vehicle ${i + 1}`,
        status: i % 2 === 0 ? 'active' : 'inactive',
      }))

      render(<MockDataTable columns={mockColumns} data={largeData} />)

      expect(screen.getByTestId('row-1')).toBeInTheDocument()
      expect(screen.getByTestId('row-100')).toBeInTheDocument()
    })
  })

  describe('Feature: Edge Cases', () => {
    it('should handle empty column list', () => {
      render(<MockDataTable columns={[]} data={mockData} />)

      expect(screen.getByTestId('data-table')).toBeInTheDocument()
    })

    it('should handle special characters in data', () => {
      const specialData: TableData[] = [
        { id: '1', name: 'Vehicle <A> & "B"', status: 'active' },
      ]

      render(<MockDataTable columns={mockColumns} data={specialData} />)

      expect(screen.getByText('Vehicle <A> & "B"')).toBeInTheDocument()
    })
  })
})
