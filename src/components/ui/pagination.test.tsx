import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination'

describe('Pagination Component', () => {
  describe('Rendering', () => {
    it('should render pagination nav', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
          </PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('should render pagination content', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Test</PaginationContent>
        </Pagination>
      )
      expect(screen.getByText('Test')).toBeInTheDocument()
    })

    it('should render pagination item', () => {
      const { container } = render(
        <PaginationItem><button>1</button></PaginationItem>
      )
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should render pagination link', () => {
      render(
        <PaginationLink href="#1">
          1
        </PaginationLink>
      )
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should render previous button', () => {
      render(
        <PaginationPrevious href="#" />
      )
      const prev = screen.getByRole('link')
      expect(prev).toBeInTheDocument()
    })

    it('should render next button', () => {
      render(
        <PaginationNext href="#" />
      )
      const next = screen.getByRole('link')
      expect(next).toBeInTheDocument()
    })

    it('should render ellipsis', () => {
      const { container } = render(
        <PaginationEllipsis />
      )
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have flex layout', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('[class*="flex"]')).toBeInTheDocument()
    })

    it('should have proper spacing', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('[class*="gap"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have nav role', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('should have aria-label on nav', () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>Item</PaginationContent>
        </Pagination>
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('aria-label')
    })

    it('should hide ellipsis from screen readers', () => {
      const { container } = render(
        <PaginationEllipsis />
      )
      const ellipsis = container.querySelector('[aria-hidden="true"]')
      expect(ellipsis).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle many pagination items', () => {
      const items = Array.from({ length: 10 }, (_, i) => (
        <PaginationItem key={i}>
          <PaginationLink href={`#${i}`}>{i + 1}</PaginationLink>
        </PaginationItem>
      ))

      render(
        <Pagination>
          <PaginationContent>{items}</PaginationContent>
        </Pagination>
      )

      Array.from({ length: 10 }, (_, i) => {
        expect(screen.getByText(String(i + 1))).toBeInTheDocument()
      })
    })
  })
})
