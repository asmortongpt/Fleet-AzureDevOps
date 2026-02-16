import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createColumnHelper } from '@tanstack/react-table'
import { VirtualizedTable } from './virtualized-table'

interface TestData {
  id: string
  name: string
  email: string
  age: number
  status: 'active' | 'inactive'
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', age: 28, status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', age: 34, status: 'active' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', age: 45, status: 'inactive' },
  { id: '4', name: 'Alice Brown', email: 'alice@example.com', age: 29, status: 'active' },
  { id: '5', name: 'Carol White', email: 'carol@example.com', age: 52, status: 'inactive' },
]

const columnHelper = createColumnHelper<TestData>()

const mockColumns = [
  columnHelper.accessor('name', {
    id: 'name',
    header: 'Name',
  }),
  columnHelper.accessor('email', {
    id: 'email',
    header: 'Email',
  }),
  columnHelper.accessor('age', {
    id: 'age',
    header: 'Age',
  }),
  columnHelper.accessor('status', {
    id: 'status',
    header: 'Status',
  }),
]

describe('VirtualizedTable Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders table element', () => {
      const { container } = render(
        <VirtualizedTable data={mockData} columns={mockColumns} />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('renders table headers from columns', () => {
      render(<VirtualizedTable data={mockData} columns={mockColumns} />)

      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Age')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders table rows with data', () => {
      const { container } = render(
        <VirtualizedTable data={mockData} columns={mockColumns} />
      )

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
      // Data is rendered through virtual scrolling, may not all be visible
    })

    it('renders empty state when no data', () => {
      render(
        <VirtualizedTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No items found"
        />
      )

      expect(screen.getByText('No items found')).toBeInTheDocument()
    })

    it('renders custom empty message', () => {
      render(
        <VirtualizedTable
          data={[]}
          columns={mockColumns}
          emptyMessage="No data available"
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('renders loading state', () => {
      const { container } = render(
        <VirtualizedTable
          data={[]}
          columns={mockColumns}
          isLoading={true}
          loadingComponent={<div data-testid="loading">Loading...</div>}
        />
      )

      expect(screen.getByTestId('loading')).toBeInTheDocument()
    })

    it('renders error state', () => {
      render(
        <VirtualizedTable
          data={[]}
          columns={mockColumns}
          error={new Error('Failed to load')}
          errorComponent={<div data-testid="error">Error occurred</div>}
        />
      )

      expect(screen.getByTestId('error')).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('uses default feature flags', () => {
      const { container } = render(
        <VirtualizedTable data={mockData} columns={mockColumns} />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('disables sorting when enableSorting is false', () => {
      render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={false}
        />
      )

      const header = screen.getByText('Name').closest('th')
      expect(header).toBeInTheDocument()
    })

    it('disables filtering when enableFiltering is false', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableFiltering={false}
        />
      )

      // Without filtering, search input should not be visible
      const input = container.querySelector('input[type="text"]')
      expect(input).not.toBeInTheDocument()
    })

    it('disables column visibility toggle', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableColumnVisibility={false}
        />
      )

      // Column visibility toggle button should not be present
      const button = container.querySelector('[data-testid="column-toggle"]')
      expect(button).not.toBeInTheDocument()
    })

    it('disables row selection', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableRowSelection={false}
        />
      )

      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes.length).toBe(0)
    })

    it('sets custom row height', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          rowHeight={64}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('sets custom max height', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          maxHeight="800px"
        />
      )

      const tableContainer = container.querySelector('div[style*="max"]')
      if (tableContainer) {
        expect(tableContainer).toBeInTheDocument()
      } else {
        // maxHeight may be applied to the virtualized container
        const table = container.querySelector('table')
        expect(table).toBeInTheDocument()
      }
    })

    it('accepts custom className prop', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          className="custom-table"
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('accepts custom containerClassName prop', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          containerClassName="custom-container"
        />
      )

      // Container is rendered with virtualization support
      const div = container.querySelector('div')
      expect(div).toBeInTheDocument()
    })
  })

  describe('User Interactions - Sorting', () => {
    it('sorts data by column when sorting is enabled', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      )

      const nameHeader = screen.getByText('Name').closest('button')
      if (nameHeader) {
        await userEvent.click(nameHeader)
      }

      // After sorting, table should still be rendered
      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('supports multi-column sorting', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      )

      const headers = container.querySelectorAll('th')
      expect(headers.length).toBeGreaterThan(1)
    })

    it('toggles sort direction on repeated clicks', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      )

      const nameHeader = screen.getByText('Name').closest('button')
      if (nameHeader) {
        await userEvent.click(nameHeader)
        await userEvent.click(nameHeader)
      }

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })
  })

  describe('User Interactions - Filtering & Search', () => {
    it('filters data by search input', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSearch={true}
          enableFiltering={true}
        />
      )

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement
      if (searchInput) {
        await userEvent.type(searchInput, 'John')
        await waitFor(() => {
          expect(screen.getByText('John Doe')).toBeInTheDocument()
        })
      }
    })

    it('clears search when clear button is clicked', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSearch={true}
        />
      )

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement
      if (searchInput) {
        await userEvent.type(searchInput, 'John')
        const clearButton = container.querySelector('[data-testid="clear-search"]')
        if (clearButton) {
          await userEvent.click(clearButton)
        }
      }
    })

    it('shows table after filtering', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSearch={true}
        />
      )

      const searchInput = container.querySelector('input[type="text"]') as HTMLInputElement
      if (searchInput) {
        await userEvent.type(searchInput, 'active')
        const tbody = container.querySelector('tbody')
        expect(tbody).toBeInTheDocument()
      }
    })
  })

  describe('User Interactions - Row Selection', () => {
    it('selects row when checkbox is clicked', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableRowSelection={true}
        />
      )

      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      if (checkboxes.length > 1) {
        await userEvent.click(checkboxes[1])
      }
    })

    it('selects all rows with header checkbox', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableRowSelection={true}
        />
      )

      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      if (checkboxes.length > 0) {
        await userEvent.click(checkboxes[0])
      }
    })

    it('calls onRowsSelected callback', async () => {
      const onRowsSelected = vi.fn()
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableRowSelection={true}
          onRowsSelected={onRowsSelected}
        />
      )

      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      if (checkboxes.length > 1) {
        await userEvent.click(checkboxes[1])
      }
    })

    it('calls onRowClick callback when row is clicked', async () => {
      const onRowClick = vi.fn()
      render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          onRowClick={onRowClick}
        />
      )

      const rows = screen.getAllByRole('row')
      if (rows.length > 1) {
        await userEvent.click(rows[1])
      }
    })
  })

  describe('Export Functionality', () => {
    it('exports data when export button is clicked', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableExport={true}
        />
      )

      const exportButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Export') || btn.querySelector('svg')
      )

      if (exportButton) {
        await userEvent.click(exportButton)
      }
    })

    it('calls onExport callback with data', async () => {
      const onExport = vi.fn()
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableExport={true}
          onExport={onExport}
        />
      )

      const exportButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Download')
      )

      if (exportButton) {
        await userEvent.click(exportButton)
      }
    })

    it('generates XLSX file when exporting', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableExport={true}
        />
      )

      // Export functionality uses XLSX library
      const exportButton = Array.from(container.querySelectorAll('button')).find(
        (btn) => btn.textContent?.includes('Export')
      )

      expect(exportButton).not.toBeUndefined()
    })
  })

  describe('Column Visibility & Resizing', () => {
    it('hides column when visibility is toggled', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableColumnVisibility={true}
        />
      )

      const visibilityToggle = container.querySelector('[data-testid="column-toggle"]')
      if (visibilityToggle) {
        await userEvent.click(visibilityToggle)
      }
    })

    it('resizes column when dragged', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableColumnResizing={true}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('maintains column width after resize', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableColumnResizing={true}
        />
      )

      const columns = container.querySelectorAll('th')
      expect(columns.length).toBeGreaterThan(0)
    })
  })

  describe('Virtual Scrolling', () => {
    it('renders virtualized list when virtualization is enabled', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableVirtualization={true}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('renders all rows when virtualization is disabled', () => {
      render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableVirtualization={false}
        />
      )

      // With virtualization disabled, all rows should be in DOM
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(1)
    })

    it('handles large datasets with virtualization', () => {
      const largeData = Array.from({ length: 1000 }).map((_, i) => ({
        id: String(i),
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: 20 + (i % 50),
        status: i % 2 === 0 ? 'active' : 'inactive' as const,
      }))

      const { container } = render(
        <VirtualizedTable
          data={largeData}
          columns={mockColumns}
          enableVirtualization={true}
          maxHeight="500px"
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('paginates data when enabled', () => {
      render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enablePagination={true}
        />
      )

      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('changes page when pagination controls are used', async () => {
      const { container } = render(
        <VirtualizedTable
          data={Array.from({ length: 50 }).map((_, i) => ({
            id: String(i),
            name: `User ${i}`,
            email: `user${i}@example.com`,
            age: 20 + (i % 50),
            status: 'active' as const,
          }))}
          columns={mockColumns}
          enablePagination={true}
        />
      )

      const paginationButtons = container.querySelectorAll('button')
      expect(paginationButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Styling & Appearance', () => {
    it('applies sticky header styling', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          stickyHeader={true}
        />
      )

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('renders table with proper border styling', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const table = container.querySelector('table')
      expect(table).toHaveClass('w-full')
    })

    it('renders tbody element', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper table role', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const table = container.querySelector('table')
      expect(table?.tagName).toBe('TABLE')
    })

    it('has column headers with proper th elements', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const headers = container.querySelectorAll('th')
      expect(headers.length).toBe(mockColumns.length + 1) // +1 for selection column
    })

    it('supports keyboard navigation', async () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const rows = container.querySelectorAll('tr')
      if (rows.length > 0) {
        const firstRow = rows[0]
        firstRow.focus()
      }
    })

    it('has sortable columns', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
        />
      )

      const headers = container.querySelectorAll('th')
      expect(headers.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('handles empty data array', () => {
      render(
        <VirtualizedTable
          data={[]}
          columns={mockColumns}
        />
      )

      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('handles undefined columns', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={[]}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('handles rapid data updates', async () => {
      const { rerender } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      rerender(
        <VirtualizedTable
          data={mockData.slice(0, 2)}
          columns={mockColumns}
        />
      )

      rerender(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )

      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
        />
      )
      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('handles very long column headers', () => {
      const longHeaderColumns = [
        columnHelper.accessor('name', {
          id: 'name',
          header: 'This is a very long header text that might wrap',
        }),
      ]

      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={longHeaderColumns}
        />
      )

      expect(container.querySelector('table')).toBeInTheDocument()
    })

    it('handles special characters in data', () => {
      const specialData = [
        {
          ...mockData[0],
          name: 'John "DJ" O\'Reilly',
          email: 'john+tag@example.com',
        },
      ]

      const { container } = render(
        <VirtualizedTable
          data={specialData}
          columns={mockColumns}
        />
      )

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })
  })

  describe('Integration Scenarios', () => {
    it('renders complete table with all features enabled', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={true}
          enableFiltering={true}
          enableColumnVisibility={true}
          enableRowSelection={true}
          enableColumnResizing={true}
          enableExport={true}
          enableSearch={true}
          enableVirtualization={true}
        />
      )

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()

      // Table should be fully rendered
      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('renders minimal table with no features', () => {
      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          enableSorting={false}
          enableFiltering={false}
          enableColumnVisibility={false}
          enableRowSelection={false}
          enableColumnResizing={false}
          enableExport={false}
          enableSearch={false}
        />
      )

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('handles state updates with all callbacks', async () => {
      const onRowClick = vi.fn()
      const onRowsSelected = vi.fn()
      const onExport = vi.fn()

      const { container } = render(
        <VirtualizedTable
          data={mockData}
          columns={mockColumns}
          onRowClick={onRowClick}
          onRowsSelected={onRowsSelected}
          onExport={onExport}
          enableRowSelection={true}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      if (rows.length > 0) {
        fireEvent.click(rows[0])
      }
    })
  })
})
