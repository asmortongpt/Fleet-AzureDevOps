import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HubPage } from './hub-page'

describe('HubPage Component', () => {
  describe('Rendering', () => {
    it('should render hub page container', () => {
      const { container } = render(
        <HubPage title="Test Hub">Content</HubPage>
      )
      expect(container.querySelector('[class*="page"]')).toBeInTheDocument()
    })

    it('should display title', () => {
      render(<HubPage title="Dashboard">Content</HubPage>)
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should render children content', () => {
      render(<HubPage title="Title">Page Content</HubPage>)
      expect(screen.getByText('Page Content')).toBeInTheDocument()
    })

    it('should render with description', () => {
      render(
        <HubPage title="Title" description="Page description">
          Content
        </HubPage>
      )
      expect(screen.getByText('Page description')).toBeInTheDocument()
    })

    it('should render with actions', () => {
      render(
        <HubPage title="Title" actions={<button>Action</button>}>
          Content
        </HubPage>
      )
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have page layout styling', () => {
      const { container } = render(
        <HubPage title="Title">Content</HubPage>
      )
      expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument()
    })

    it('should have responsive width', () => {
      const { container } = render(
        <HubPage title="Title">Content</HubPage>
      )
      expect(container.querySelector('[class*="w-"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(
        <HubPage title="Main Title">Content</HubPage>
      )
      const heading = container.querySelector('h1, h2')
      expect(heading).toBeInTheDocument()
    })

    it('should be semantic markup', () => {
      const { container } = render(
        <HubPage title="Title">Content</HubPage>
      )
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle long titles', () => {
      const longTitle = 'A'.repeat(100)
      render(<HubPage title={longTitle}>Content</HubPage>)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle complex children', () => {
      render(
        <HubPage title="Title">
          <div><section><p>Complex structure</p></section></div>
        </HubPage>
      )
      expect(screen.getByText('Complex structure')).toBeInTheDocument()
    })
  })
})
