import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from './table'

describe('Table Components', () => {
  describe('Table Root', () => {
    it('renders table root', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument()
    })

    it('has table data-slot', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(container.querySelector('[data-slot="table"]')).toBeInTheDocument()
    })

    it('has table container wrapper', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-container"]')).toBeInTheDocument()
    })

    it('has overflow-x-auto for responsive scrolling', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const container_div = container.querySelector('[data-slot="table-container"]')
      expect(container_div).toHaveClass('overflow-x-auto')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table className="custom-table">
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const table = container.querySelector('[data-slot="table"]')
      expect(table).toHaveClass('custom-table')
    })

    it('renders caption-bottom class', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const table = container.querySelector('[data-slot="table"]')
      expect(table).toHaveClass('caption-bottom')
    })

    it('has text-sm class', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const table = container.querySelector('[data-slot="table"]')
      expect(table).toHaveClass('text-sm')
    })
  })

  describe('TableHeader', () => {
    it('renders table header', () => {
      const { container } = render(
        <Table>
          <TableHeader data-testid="header">
            <TableRow>
              <TableHead>Column 1</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByTestId('header')).toBeInTheDocument()
    })

    it('has table header data-slot', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-header"]')).toBeInTheDocument()
    })

    it('has border-b class', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const header = container.querySelector('[data-slot="table-header"]')
      expect(header).toHaveClass('border-b')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableHeader className="custom-header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const header = container.querySelector('[data-slot="table-header"]')
      expect(header).toHaveClass('custom-header')
    })

    it('can contain multiple rows', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column 1</TableHead>
              <TableHead>Column 2</TableHead>
              <TableHead>Column 3</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByText('Column 1')).toBeInTheDocument()
      expect(screen.getByText('Column 2')).toBeInTheDocument()
      expect(screen.getByText('Column 3')).toBeInTheDocument()
    })
  })

  describe('TableBody', () => {
    it('renders table body', () => {
      const { container } = render(
        <Table>
          <TableBody data-testid="body">
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByTestId('body')).toBeInTheDocument()
    })

    it('has table body data-slot', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-body"]')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableBody className="custom-body">
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const body = container.querySelector('[data-slot="table-body"]')
      expect(body).toHaveClass('custom-body')
    })

    it('can contain multiple rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByText('Row 1')).toBeInTheDocument()
      expect(screen.getByText('Row 2')).toBeInTheDocument()
      expect(screen.getByText('Row 3')).toBeInTheDocument()
    })
  })

  describe('TableFooter', () => {
    it('renders table footer', () => {
      const { container } = render(
        <Table>
          <TableFooter data-testid="footer">
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('has table footer data-slot', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-footer"]')).toBeInTheDocument()
    })

    it('has muted background', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      const footer = container.querySelector('[data-slot="table-footer"]')
      expect(footer).toHaveClass('bg-muted/50')
    })

    it('has border-t class', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      const footer = container.querySelector('[data-slot="table-footer"]')
      expect(footer).toHaveClass('border-t')
    })

    it('has font-medium class', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      const footer = container.querySelector('[data-slot="table-footer"]')
      expect(footer).toHaveClass('font-medium')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableFooter className="custom-footer">
            <TableRow>
              <TableCell>Total</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      const footer = container.querySelector('[data-slot="table-footer"]')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('TableRow', () => {
    it('renders table row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="row">
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByTestId('row')).toBeInTheDocument()
    })

    it('has table row data-slot', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-row"]')).toBeInTheDocument()
    })

    it('has hover:bg-muted/50 class', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const row = container.querySelector('[data-slot="table-row"]')
      expect(row).toHaveClass('hover:bg-muted/50')
    })

    it('has border-b class', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const row = container.querySelector('[data-slot="table-row"]')
      expect(row).toHaveClass('border-b')
    })

    it('has transition-colors class', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const row = container.querySelector('[data-slot="table-row"]')
      expect(row).toHaveClass('transition-colors')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow className="custom-row">
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const row = container.querySelector('[data-slot="table-row"]')
      expect(row).toHaveClass('custom-row')
    })

    it('can contain multiple cells', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell 1</TableCell>
              <TableCell>Cell 2</TableCell>
              <TableCell>Cell 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByText('Cell 1')).toBeInTheDocument()
      expect(screen.getByText('Cell 2')).toBeInTheDocument()
      expect(screen.getByText('Cell 3')).toBeInTheDocument()
    })
  })

  describe('TableHead', () => {
    it('renders table header cell', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="head">Column Name</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(screen.getByTestId('head')).toBeInTheDocument()
    })

    it('has table head data-slot', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-head"]')).toBeInTheDocument()
    })

    it('has proper height', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const head = container.querySelector('[data-slot="table-head"]')
      expect(head).toHaveClass('h-8')
    })

    it('has foreground color', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const head = container.querySelector('[data-slot="table-head"]')
      expect(head).toHaveClass('text-foreground')
    })

    it('has font-medium class', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const head = container.querySelector('[data-slot="table-head"]')
      expect(head).toHaveClass('font-medium')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="custom-head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const head = container.querySelector('[data-slot="table-head"]')
      expect(head).toHaveClass('custom-head')
    })
  })

  describe('TableCell', () => {
    it('renders table data cell', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="cell">Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByTestId('cell')).toBeInTheDocument()
    })

    it('has table cell data-slot', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-cell"]')).toBeInTheDocument()
    })

    it('has padding', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const cell = container.querySelector('[data-slot="table-cell"]')
      expect(cell).toHaveClass('p-2')
    })

    it('has middle alignment', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const cell = container.querySelector('[data-slot="table-cell"]')
      expect(cell).toHaveClass('align-middle')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="custom-cell">Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      const cell = container.querySelector('[data-slot="table-cell"]')
      expect(cell).toHaveClass('custom-cell')
    })

    it('can contain complex content', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <button>Click me</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })
  })

  describe('TableCaption', () => {
    it('renders table caption', () => {
      render(
        <Table>
          <TableCaption data-testid="caption">Table description</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByTestId('caption')).toBeInTheDocument()
    })

    it('has table caption data-slot', () => {
      const { container } = render(
        <Table>
          <TableCaption>Description</TableCaption>
        </Table>
      )
      expect(container.querySelector('[data-slot="table-caption"]')).toBeInTheDocument()
    })

    it('has muted foreground color', () => {
      const { container } = render(
        <Table>
          <TableCaption>Description</TableCaption>
        </Table>
      )
      const caption = container.querySelector('[data-slot="table-caption"]')
      expect(caption).toHaveClass('text-muted-foreground')
    })

    it('has small text size', () => {
      const { container } = render(
        <Table>
          <TableCaption>Description</TableCaption>
        </Table>
      )
      const caption = container.querySelector('[data-slot="table-caption"]')
      expect(caption).toHaveClass('text-sm')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Table>
          <TableCaption className="custom-caption">Description</TableCaption>
        </Table>
      )
      const caption = container.querySelector('[data-slot="table-caption"]')
      expect(caption).toHaveClass('custom-caption')
    })
  })

  describe('Complete Table', () => {
    it('renders full table with all components', () => {
      render(
        <Table>
          <TableCaption>Sample table with all components</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>User</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell colSpan={2}>2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      expect(screen.getByText('Sample table with all components')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('renders data table pattern', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>1</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>$100</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2</TableCell>
              <TableCell>Inactive</TableCell>
              <TableCell>$200</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('supports accessibility attributes', () => {
      const { container } = render(
        <Table role="grid" aria-label="Data table">
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      const table = container.querySelector('[data-slot="table"]')
      expect(table).toHaveAttribute('role', 'grid')
    })
  })
})
