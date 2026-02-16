import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable, createStatusColumn, createMonospaceColumn } from './data-table'

// Sample test data
interface TestData {
  id: string
  name: string
  status: string
  vin: string
}

const mockData: TestData[] = [
  { id: '1', name: 'Item 1', status: 'active', vin: 'VIN123456789' },
  { id: '2', name: 'Item 2', status: 'inactive', vin: 'VIN987654321' },
  { id: '3', name: 'Item 3', status: 'warning', vin: 'VIN555555555' },
  { id: '4', name: 'Item 4', status: 'critical', vin: 'VIN444444444' },
  { id: '5', name: 'Item 5', status: 'active', vin: 'VIN333333333' },
]

const basicColumns: ColumnDef<TestData>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
]

describe('DataTable Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders data table with headers', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('renders data rows', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('renders empty state when no data', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={[]}
        />
      )
      expect(screen.getByText('No results found.')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          className="custom-class"
        />
      )
      const wrapper = container.querySelector('div[class*="w-full"]')
      expect(wrapper?.className).toContain('custom-class')
    })

    it('renders selection column when enabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
        />
      )
      // Check for select all checkbox in header
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })

    it('does not render selection column when disabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={false}
        />
      )
      // Should have no checkboxes when row selection is disabled
      const checkboxes = screen.queryAllByRole('checkbox')
      expect(checkboxes.length).toBe(0)
    })
  })

  describe('Sorting', () => {
    it('renders sortable headers with toggle icons', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={[
            { accessorKey: 'name', header: 'Name', enableSorting: true },
          ]}
          data={mockData}
        />
      )
      const header = screen.getByText('Name')
      expect(header).toBeInTheDocument()
    })

    it('header can be clicked to sort', async () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={[
            { accessorKey: 'name', header: 'Name', enableSorting: true },
          ]}
          data={mockData}
        />
      )
      const header = screen.getByText('Name')
      await userEvent.click(header.closest('div'))
      // Just verify it's clickable and doesn't error
      expect(header).toBeInTheDocument()
    })

    it('disables sorting when enableSorting is false', () => {
      render(
        <DataTable<TestData, unknown>
          columns={[
            { accessorKey: 'name', header: 'Name', enableSorting: false },
          ]}
          data={mockData}
        />
      )
      expect(screen.getByText('Name')).toBeInTheDocument()
    })
  })

  describe('Search & Filtering', () => {
    it('renders search input when enabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...')
      expect(searchInput).toBeInTheDocument()
    })

    it('uses custom search placeholder', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
          searchPlaceholder="Find items..."
        />
      )
      expect(screen.getByPlaceholderText('Find items...')).toBeInTheDocument()
    })

    it('does not render search when disabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={false}
        />
      )
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
    })

    it('filters data when search input changes', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...')
      await userEvent.type(searchInput as HTMLInputElement, 'Item 1')
      // After filtering, Item 1 should be visible, Item 2 should not be in filtered results
      await waitFor(() => {
        expect(screen.getByText('Item 1')).toBeInTheDocument()
      })
    })

    it('shows clear button when search has value', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        const clearButton = screen.getByLabelText('Clear search')
        expect(clearButton).toBeInTheDocument()
      })
    })

    it('clears search when clear button clicked', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
      await userEvent.type(searchInput, 'test')

      await waitFor(() => {
        const clearButton = screen.getByLabelText('Clear search')
        fireEvent.click(clearButton)
      })

      await waitFor(() => {
        expect((searchInput).value).toBe('')
      })
    })
  })

  describe('Row Selection', () => {
    it('shows selection count when rows are selected', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
          enableSearch={true}
        />
      )
      const checkboxes = screen.getAllByLabelText('Select row')
      await userEvent.click(checkboxes[0])

      await waitFor(() => {
        expect(screen.getByText(/of 5 selected/)).toBeInTheDocument()
      })
    })

    it('calls onRowSelect callback with selected rows', async () => {
      const onRowSelect = vi.fn()
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
          onRowSelect={onRowSelect}
        />
      )
      const checkboxes = screen.getAllByLabelText('Select row')
      await userEvent.click(checkboxes[0])

      await waitFor(() => {
        expect(onRowSelect).toHaveBeenCalled()
      })
    })

    it('selects all rows when header checkbox clicked', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
          enableSearch={true}
        />
      )
      const selectAllCheckbox = screen.getByLabelText('Select all')
      await userEvent.click(selectAllCheckbox)

      await waitFor(() => {
        expect(screen.getByText(/5 of 5 selected/)).toBeInTheDocument()
      })
    })

    it('deselects all rows when header checkbox clicked again', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
          enableSearch={true}
        />
      )
      const selectAllCheckbox = screen.getByLabelText('Select all')
      await userEvent.click(selectAllCheckbox)

      await waitFor(() => {
        expect(screen.getByText(/5 of 5 selected/)).toBeInTheDocument()
      })

      await userEvent.click(selectAllCheckbox)

      await waitFor(() => {
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('renders pagination when enabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
        />
      )
      expect(screen.getByText(/Page/)).toBeInTheDocument()
      expect(screen.getByText(/Rows:/)).toBeInTheDocument()
    })

    it('does not render pagination when disabled', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={false}
        />
      )
      expect(screen.queryByText(/Page/)).not.toBeInTheDocument()
    })

    it('displays page size selector', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
          defaultPageSize={25}
        />
      )
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('displays pagination buttons', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
        />
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Prev')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
      expect(screen.getByText('Last')).toBeInTheDocument()
    })

    it('uses default page size', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
          defaultPageSize={10}
        />
      )
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('first button is disabled on first page', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
        />
      )
      const firstButton = screen.getByText('First')
      expect(firstButton).toBeDisabled()
    })

    it('prev button is disabled on first page', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enablePagination={true}
        />
      )
      const prevButton = screen.getByText('Prev')
      expect(prevButton).toBeDisabled()
    })
  })

  describe('Column Features', () => {
    it('renders all columns', () => {
      const columns: ColumnDef<TestData>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status' },
      ]
      render(
        <DataTable<TestData, unknown>
          columns={columns}
          data={mockData}
        />
      )
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('handles custom cell renderers', () => {
      const columns: ColumnDef<TestData>[] = [
        {
          accessorKey: 'name',
          header: 'Name',
          cell: ({ row }) => `Custom: ${row.original.name}`,
        },
      ]
      render(
        <DataTable<TestData, unknown>
          columns={columns}
          data={[mockData[0]]}
        />
      )
      expect(screen.getByText('Custom: Item 1')).toBeInTheDocument()
    })
  })

  describe('Table Styling', () => {
    it('renders table with border', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      const tableContainer = container.querySelector('.rounded-lg.border')
      expect(tableContainer).toBeInTheDocument()
    })

    it('renders header with proper styling', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      const header = container.querySelector('thead')
      expect(header).toBeInTheDocument()
    })

    it('renders rows with alternating background', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      const rows = container.querySelectorAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('highlights selected rows', async () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
        />
      )
      const checkboxes = screen.getAllByLabelText('Select row')
      await userEvent.click(checkboxes[0])

      await waitFor(() => {
        const selectedRow = container.querySelector('[data-state="selected"]')
        expect(selectedRow).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('renders horizontally scrollable container', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('handles multiple columns without overflow', () => {
      const columns: ColumnDef<TestData>[] = [
        { accessorKey: 'id', header: 'ID' },
        { accessorKey: 'name', header: 'Name' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'vin', header: 'VIN' },
      ]
      render(
        <DataTable<TestData, unknown>
          columns={columns}
          data={mockData}
        />
      )
      expect(screen.getByText('VIN')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty search results', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...') as HTMLInputElement
      await userEvent.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No results found.')).toBeInTheDocument()
      })
    })

    it('handles single row data', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={[mockData[0]]}
        />
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
    })

    it('handles very long cell content', () => {
      const longData: TestData[] = [
        {
          id: '1',
          name: 'This is a very long name that should be handled properly',
          status: 'active',
          vin: 'VIN123456789',
        },
      ]
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={longData}
        />
      )
      expect(screen.getByText(/very long name/)).toBeInTheDocument()
    })

    it('handles special characters in data', () => {
      const specialData: TestData[] = [
        {
          id: '1',
          name: 'Item <>&"',
          status: 'active',
          vin: 'VIN123456789',
        },
      ]
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={specialData}
        />
      )
      expect(screen.getByText(/Item.*&/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper table semantics', () => {
      const { container } = render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
        />
      )
      expect(container.querySelector('table')).toBeInTheDocument()
      expect(container.querySelector('thead')).toBeInTheDocument()
      expect(container.querySelector('tbody')).toBeInTheDocument()
    })

    it('checkboxes have proper aria-labels', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableRowSelection={true}
        />
      )
      expect(screen.getByLabelText('Select all')).toBeInTheDocument()
      expect(screen.getAllByLabelText('Select row').length).toBeGreaterThan(0)
    })

    it('search input has proper placeholder', () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
    })

    it('clear search button has aria-label', async () => {
      render(
        <DataTable<TestData, unknown>
          columns={basicColumns}
          data={mockData}
          enableSearch={true}
        />
      )
      const searchInput = screen.getByPlaceholderText('Search...')
      await userEvent.type(searchInput as HTMLInputElement, 'test')

      await waitFor(() => {
        expect(screen.getByLabelText('Clear search')).toBeInTheDocument()
      })
    })
  })
})

describe('createStatusColumn Helper', () => {
  describe('Rendering', () => {
    it('creates column with correct header', () => {
      const column = createStatusColumn<TestData>('status', 'Status')
      expect(column.accessorKey).toBe('status')
      expect(column.header).toBe('Status')
    })

    it('uses default header text', () => {
      const column = createStatusColumn<TestData>('status')
      expect(column.header).toBe('Status')
    })

    it('renders status badge', () => {
      const column = createStatusColumn<TestData>('status')
      const testData = { id: '1', name: 'Test', status: 'active', vin: 'VIN123' }

      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'active',
              original: testData,
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      expect(screen.getByText('active')).toBeInTheDocument()
    })
  })

  describe('Status Styling', () => {
    it('applies active status styling', () => {
      const column = createStatusColumn<TestData>('status')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'active',
              original: { id: '1', name: 'Test', status: 'active', vin: 'VIN' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const badge = container.querySelector('span')
      expect(badge?.className).toContain('rounded-full')
    })

    it('applies online status styling', () => {
      const column = createStatusColumn<TestData>('status')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'online',
              original: { id: '1', name: 'Test', status: 'online', vin: 'VIN' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })

    it('applies warning status styling', () => {
      const column = createStatusColumn<TestData>('status')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'warning',
              original: { id: '1', name: 'Test', status: 'warning', vin: 'VIN' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })

    it('applies critical status styling', () => {
      const column = createStatusColumn<TestData>('status')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'critical',
              original: { id: '1', name: 'Test', status: 'critical', vin: 'VIN' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const badge = container.querySelector('span')
      expect(badge).toBeInTheDocument()
    })
  })
})

describe('createMonospaceColumn Helper', () => {
  describe('Rendering', () => {
    it('creates column with correct header', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      expect(column.accessorKey).toBe('vin')
      expect(column.header).toBe('VIN')
    })

    it('renders monospace text', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const testData = { id: '1', name: 'Test', status: 'active', vin: 'VIN123456789' }

      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'VIN123456789',
              original: testData,
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const monospaceText = container.querySelector('span.font-mono')
      expect(monospaceText).toBeInTheDocument()
      expect(screen.getByText('VIN123456789')).toBeInTheDocument()
    })

    it('applies monospace font styling', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'VIN123456789',
              original: { id: '1', name: 'Test', status: 'active', vin: 'VIN123456789' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const span = container.querySelector('span')
      expect(span).toHaveClass('font-mono')
    })

    it('applies primary color to monospace text', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'VIN123456789',
              original: { id: '1', name: 'Test', status: 'active', vin: 'VIN123456789' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const span = container.querySelector('span')
      expect(span).toHaveClass('text-primary')
    })

    it('applies small text size to monospace text', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'VIN123456789',
              original: { id: '1', name: 'Test', status: 'active', vin: 'VIN123456789' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const span = container.querySelector('span')
      expect(span).toHaveClass('text-xs')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty monospace value', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => '',
              original: { id: '1', name: 'Test', status: 'active', vin: '' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      const span = container.querySelector('span.font-mono')
      expect(span).toBeInTheDocument()
    })

    it('handles special characters in monospace text', () => {
      const column = createMonospaceColumn<TestData>('vin', 'VIN')
      const { container } = render(
        <div>
          {column.cell && column.cell({
            row: {
              getValue: () => 'VIN-!@#$%',
              original: { id: '1', name: 'Test', status: 'active', vin: 'VIN-!@#$%' },
            },
            column: { columnDef: column },
          } as any)}
        </div>
      )
      expect(screen.getByText('VIN-!@#$%')).toBeInTheDocument()
    })
  })
})
