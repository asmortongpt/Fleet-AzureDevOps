import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ResponsiveTable } from './responsive-table'

describe('ResponsiveTable Component', () => {
  describe('Rendering', () => {
    it('should render responsive wrapper', () => {
      const { container } = render(
        <ResponsiveTable>
          <table><tr><td>Content</td></tr></table>
        </ResponsiveTable>
      )
      expect(container.querySelector('[class*="overflow"]')).toBeInTheDocument()
    })

    it('should render children table', () => {
      render(
        <ResponsiveTable>
          <table><tr><td>Test</td></tr></table>
        </ResponsiveTable>
      )
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  describe('Responsiveness', () => {
    it('should apply overflow styling', () => {
      const { container } = render(
        <ResponsiveTable>
          <table><tr><td>Content</td></tr></table>
        </ResponsiveTable>
      )
      const wrapper = container.querySelector('[class*="overflow"]')
      expect(wrapper).toBeInTheDocument()
    })

    it('should work on mobile screens', () => {
      const { container } = render(
        <ResponsiveTable>
          <table><tr><td>Mobile Content</td></tr></table>
        </ResponsiveTable>
      )
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle large tables', () => {
      const rows = Array.from({ length: 100 }, (_, i) => (
        <tr key={i}><td>Row {i}</td></tr>
      ))

      render(
        <ResponsiveTable>
          <table><tbody>{rows}</tbody></table>
        </ResponsiveTable>
      )

      expect(screen.getByText('Row 0')).toBeInTheDocument()
    })

    it('should handle tables with many columns', () => {
      const cols = Array.from({ length: 20 }, (_, i) => (
        <td key={i}>Col {i}</td>
      ))

      render(
        <ResponsiveTable>
          <table><tr>{cols}</tr></table>
        </ResponsiveTable>
      )

      expect(screen.getByText('Col 0')).toBeInTheDocument()
    })
  })
})
