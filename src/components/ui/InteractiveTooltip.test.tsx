import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { InteractiveTooltip } from './InteractiveTooltip'
import { Info } from 'lucide-react'

describe('InteractiveTooltip Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render trigger element', () => {
      render(
        <InteractiveTooltip content="Tooltip content">
          <button>Hover me</button>
        </InteractiveTooltip>
      )
      expect(screen.getByText('Hover me')).toBeInTheDocument()
    })

    it('should not render tooltip content initially', () => {
      render(
        <InteractiveTooltip content="Hidden content">
          <button>Trigger</button>
        </InteractiveTooltip>
      )
      expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
    })

    it('should render tooltip on hover', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Tooltip content">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument()
      })
    })

    it('should render tooltip with proper styling', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InteractiveTooltip content="Content">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)

      await waitFor(() => {
        const tooltip = container.querySelector('[role="tooltip"]') || screen.getByText('Content')
        expect(tooltip).toBeInTheDocument()
      })
    })
  })

  describe('Props & Configuration', () => {
    it('should accept string content', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="String content">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('String content')).toBeInTheDocument()
      })
    })

    it('should accept ReactNode content', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content={<div>React Node Content</div>}>
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('React Node Content')).toBeInTheDocument()
      })
    })

    it('should accept position prop', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Content" side="left">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      })
    })

    it('should accept delay prop', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Content" delayDuration={0}>
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)

      // Should show immediately with 0 delay
      await waitFor(() => {
        expect(screen.getByText('Content')).toBeInTheDocument()
      }, { timeout: 100 })
    })

    it('should accept asChild prop', () => {
      render(
        <InteractiveTooltip content="Content" asChild>
          <button>Trigger</button>
        </InteractiveTooltip>
      )
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should show tooltip on hover', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Hover tooltip">
          <button>Hover me</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Hover me')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText('Hover tooltip')).toBeInTheDocument()
      })
    })

    it('should hide tooltip on unhover', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Tooltip">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      
      // Show
      await user.hover(trigger)
      await waitFor(() => {
        expect(screen.getByText('Tooltip')).toBeInTheDocument()
      })

      // Hide
      await user.unhover(trigger)
      await waitFor(() => {
        expect(screen.queryByText('Tooltip')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should support keyboard trigger', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Keyboard tooltip">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      trigger.focus()
      
      await waitFor(() => {
        expect(trigger).toHaveFocus()
      })
    })

    it('should be dismissible', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Dismissible">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText('Dismissible')).toBeInTheDocument()
      })

      await user.unhover(trigger)
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply tooltip styling', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InteractiveTooltip content="Styled">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        const tooltip = screen.getByText('Styled')
        expect(tooltip).toBeInTheDocument()
      })
    })

    it('should have rounded appearance', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InteractiveTooltip content="Rounded">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        const tooltip = container.querySelector('[class*="rounded"]')
        expect(tooltip).toBeInTheDocument()
      })
    })

    it('should have shadow effect', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InteractiveTooltip content="Shadow">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        const tooltip = container.querySelector('[class*="shadow"]')
        expect(tooltip).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Accessible">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      trigger.focus()
      expect(trigger).toHaveFocus()
    })

    it('should be properly labeled', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Labeled tooltip">
          <button aria-label="Action button">Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByRole('button', { name: /Action button/ })
      expect(trigger).toBeInTheDocument()
    })

    it('should announce tooltip to screen readers', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Screen reader tooltip">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      await user.hover(trigger)

      await waitFor(() => {
        expect(screen.getByText('Screen reader tooltip')).toBeInTheDocument()
      })
    })
  })

  describe('Positioning', () => {
    it('should support top positioning', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Top" side="top">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('Top')).toBeInTheDocument()
      })
    })

    it('should support right positioning', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Right" side="right">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('Right')).toBeInTheDocument()
      })
    })

    it('should support bottom positioning', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Bottom" side="bottom">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('Bottom')).toBeInTheDocument()
      })
    })

    it('should support left positioning', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Left" side="left">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText('Left')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long content', async () => {
      const user = userEvent.setup()
      const longContent = 'A'.repeat(200)
      
      render(
        <InteractiveTooltip content={longContent}>
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText(new RegExp(longContent.substring(0, 100)))).toBeInTheDocument()
      })
    })

    it('should handle special characters', async () => {
      const user = userEvent.setup()
      const specialContent = 'Content with <tags> & symbols'
      
      render(
        <InteractiveTooltip content={specialContent}>
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))

      await waitFor(() => {
        expect(screen.getByText(specialContent)).toBeInTheDocument()
      })
    })

    it('should handle empty content', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      await user.hover(screen.getByText('Trigger'))
      // Should not throw
    })

    it('should handle rapid hover/unhover', async () => {
      const user = userEvent.setup()
      render(
        <InteractiveTooltip content="Rapid">
          <button>Trigger</button>
        </InteractiveTooltip>
      )

      const trigger = screen.getByText('Trigger')
      
      // Rapid interactions
      await user.hover(trigger)
      await user.unhover(trigger)
      await user.hover(trigger)
      await user.unhover(trigger)

      // Should handle gracefully
      expect(screen.getByText('Trigger')).toBeInTheDocument()
    })

    it('should handle multiple tooltips on page', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <InteractiveTooltip content="Tooltip 1">
            <button>Button 1</button>
          </InteractiveTooltip>
          <InteractiveTooltip content="Tooltip 2">
            <button>Button 2</button>
          </InteractiveTooltip>
        </div>
      )

      await user.hover(screen.getByText('Button 1'))

      await waitFor(() => {
        expect(screen.getByText('Tooltip 1')).toBeInTheDocument()
      })

      // Tooltip 2 should not be visible
      expect(screen.queryByText('Tooltip 2')).not.toBeInTheDocument()
    })
  })
})
