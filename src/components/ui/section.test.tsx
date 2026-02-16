import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Section } from './section'

describe('Section Component', () => {
  describe('Rendering', () => {
    it('should render section element', () => {
      const { container } = render(<Section>Content</Section>)
      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should display children', () => {
      render(<Section>Section Content</Section>)
      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })

    it('should have proper spacing', () => {
      const { container } = render(<Section>Content</Section>)
      const section = container.querySelector('section')
      expect(section).toHaveClass('space-y')
    })

    it('should accept title prop', () => {
      render(<Section title="Section Title">Content</Section>)
      expect(screen.getByText('Section Title')).toBeInTheDocument()
    })

    it('should accept description prop', () => {
      render(<Section description="Section Description">Content</Section>)
      expect(screen.getByText('Section Description')).toBeInTheDocument()
    })

    it('should render header when title provided', () => {
      const { container } = render(<Section title="Title">Content</Section>)
      const heading = container.querySelector('h2, h3')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have semantic section element', () => {
      const { container } = render(<Section>Content</Section>)
      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should apply responsive padding', () => {
      const { container } = render(<Section>Content</Section>)
      const section = container.querySelector('section')
      expect(section).toHaveClass('px')
      expect(section).toHaveClass('py')
    })

    it('should accept custom className', () => {
      const { container } = render(<Section className="custom">Content</Section>)
      const section = container.querySelector('section')
      expect(section).toHaveClass('custom')
    })
  })

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      const { container } = render(<Section title="Title">Content</Section>)
      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should render heading for title', () => {
      const { container } = render(<Section title="Title">Content</Section>)
      const heading = container.querySelector('h2, h3')
      expect(heading?.textContent).toBe('Title')
    })
  })

  describe('Edge Cases', () => {
    it('should handle long title', () => {
      const longTitle = 'A'.repeat(100)
      render(<Section title={longTitle}>Content</Section>)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle complex children', () => {
      render(
        <Section>
          <div><p>Nested content</p></div>
        </Section>
      )
      expect(screen.getByText('Nested content')).toBeInTheDocument()
    })
  })
})
