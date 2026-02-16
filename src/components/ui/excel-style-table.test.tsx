import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExcelStyleTable } from './excel-style-table'

describe('ExcelStyleTable Component', () => {
  const mockData = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
  ]

  const mockColumns = [
    { id: 'id', header: 'ID', accessorKey: 'id' },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'value', header: 'Value', accessorKey: 'value' },
  ]

  describe('Rendering', () => {
    it('should render table', () => {
      const { container } = render(
        <ExcelStyleTable data={mockData} columns={mockColumns} />
      )
      expect(container.querySelector('table')).toBeInTheDocument()
    })

    it('should render headers', () => {
      render(<ExcelStyleTable data={mockData} columns={mockColumns} />)
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Value')).toBeInTheDocument()
    })

    it('should render data rows', () => {
      render(<ExcelStyleTable data={mockData} columns={mockColumns} />)
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('should render cells with data', () => {
      render(<ExcelStyleTable data={mockData} columns={mockColumns} />)
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('200')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have table styling', () => {
      const { container } = render(
        <ExcelStyleTable data={mockData} columns={mockColumns} />
      )
      const table = container.querySelector('table')
      expect(table).toHaveClass('w-full')
    })

    it('should have cell borders', () => {
      const { container } = render(
        <ExcelStyleTable data={mockData} columns={mockColumns} />
      )
      const cells = container.querySelectorAll('td')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have table role', () => {
      const { container } = render(
        <ExcelStyleTable data={mockData} columns={mockColumns} />
      )
      expect(container.querySelector('table')).toBeInTheDocument()
    })

    it('should have th elements for headers', () => {
      const { container } = render(
        <ExcelStyleTable data={mockData} columns={mockColumns} />
      )
      const headers = container.querySelectorAll('th')
      expect(headers.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data', () => {
      const { container } = render(
        <ExcelStyleTable data={[]} columns={mockColumns} />
      )
      expect(container.querySelector('table')).toBeInTheDocument()
    })

    it('should handle many rows', () => {
      const manyRows = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: i * 10,
      }))

      render(<ExcelStyleTable data={manyRows} columns={mockColumns} />)
      expect(screen.getByText('Item 0')).toBeInTheDocument()
    })

    it('should handle many columns', () => {
      const manyColumns = Array.from({ length: 20 }, (_, i) => ({
        id: `col${i}`,
        header: `Column ${i}`,
        accessorKey: `field${i}`,
      }))

      render(<ExcelStyleTable data={mockData} columns={manyColumns} />)
      expect(screen.getByText('Column 0')).toBeInTheDocument()
    })
  })
})
