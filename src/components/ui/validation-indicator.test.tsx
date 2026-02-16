import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ValidationIndicator } from './validation-indicator'

describe('ValidationIndicator Component', () => {
  describe('Rendering', () => {
    it('should render valid state', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render invalid state', () => {
      const { container } = render(<ValidationIndicator state="invalid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render idle state', () => {
      const { container } = render(<ValidationIndicator state="idle" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render with message', () => {
      render(<ValidationIndicator state="invalid" message="Error text" />)
      expect(screen.getByText('Error text')).toBeInTheDocument()
    })

    it('should have icon for each state', () => {
      const { container: validContainer } = render(<ValidationIndicator state="valid" />)
      expect(validContainer.querySelector('svg')).toBeInTheDocument()

      const { container: invalidContainer } = render(<ValidationIndicator state="invalid" />)
      expect(invalidContainer.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply success color for valid state', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      const icon = container.querySelector('[class*="text-green"]')
      expect(icon).toBeInTheDocument()
    })

    it('should apply error color for invalid state', () => {
      const { container } = render(<ValidationIndicator state="invalid" />)
      const icon = container.querySelector('[class*="text-red"]')
      expect(icon).toBeInTheDocument()
    })

    it('should have appropriate size classes', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-4')
      expect(icon).toHaveClass('w-4')
    })
  })

  describe('Edge Cases', () => {
    it('should handle long error messages', () => {
      const longMsg = 'A'.repeat(100)
      render(<ValidationIndicator state="invalid" message={longMsg} />)
      expect(screen.getByText(longMsg)).toBeInTheDocument()
    })

    it('should handle missing message', () => {
      const { container } = render(<ValidationIndicator state="valid" />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should handle all state variants', () => {
      const states = ['valid', 'invalid', 'idle'] as const
      states.forEach(state => {
        const { unmount } = render(<ValidationIndicator state={state} />)
        expect(document.body).toContainElement(document.body.firstChild)
        unmount()
      })
    })
  })
})
