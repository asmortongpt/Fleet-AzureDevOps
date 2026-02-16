import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { VirtualTable } from './virtual-table'

describe('VirtualTable Component', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))

  describe('Rendering', () => {
    it('should render virtualized container', () => {
      const { container } = render(
        <VirtualTable items={mockItems} itemSize={40} height={400}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render visible items', () => {
      render(
        <VirtualTable items={mockItems.slice(0, 10)} itemSize={40} height={400}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(screen.getByText('Item 0')).toBeInTheDocument()
    })

    it('should accept custom className', () => {
      const { container } = render(
        <VirtualTable
          items={mockItems.slice(0, 10)}
          itemSize={40}
          height={400}
          className="custom"
        >
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toHaveClass('custom')
    })
  })

  describe('Virtualization', () => {
    it('should only render visible items', () => {
      const { container } = render(
        <VirtualTable items={mockItems} itemSize={40} height={400}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      // Should not render all 1000 items
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeLessThan(1000)
    })

    it('should handle dynamic item height', () => {
      const { container } = render(
        <VirtualTable items={mockItems.slice(0, 100)} itemSize={60} height={600}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle different container heights', () => {
      const { container } = render(
        <VirtualTable items={mockItems.slice(0, 50)} itemSize={40} height={200}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toHaveStyle({ height: '200px' })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty items', () => {
      const { container } = render(
        <VirtualTable items={[]} itemSize={40} height={400}>
          {(item: any) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle single item', () => {
      render(
        <VirtualTable items={[mockItems[0]]} itemSize={40} height={400}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(screen.getByText('Item 0')).toBeInTheDocument()
    })

    it('should handle very large item size', () => {
      const { container } = render(
        <VirtualTable items={mockItems.slice(0, 5)} itemSize={500} height={2000}>
          {(item) => <div>{item.name}</div>}
        </VirtualTable>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })
})
