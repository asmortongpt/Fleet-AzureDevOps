import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { InfoPopover } from './info-popover'

describe('InfoPopover Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('should render trigger button', () => {
      render(
        <InfoPopover
          title="Help"
          content="This is helpful information"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('should render with info icon by default', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="This is helpful information"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have aria-label on trigger button', () => {
      render(
        <InfoPopover
          title="Severity"
          content="Choose the appropriate level"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Help: Severity')
    })

    it('should have button type="button"', () => {
      render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })

    it('should render inline-flex trigger button', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('inline-flex')
    })

    it('should have focused state styling', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('focus:outline-none')
    })
  })

  describe('Props & Configuration', () => {
    it('should render info type by default', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon?.parentElement).toHaveClass('text-[#1e40af]')
    })

    it('should render help type with correct icon color', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
          type="help"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon?.parentElement).toHaveClass('text-[#334155]')
    })

    it('should render warning type with correct icon color', () => {
      const { container } = render(
        <InfoPopover
          title="Warning"
          content="Be careful"
          type="warning"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon?.parentElement).toHaveClass('text-[#b45309]')
    })

    it('should accept custom className', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
          className="custom-class"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should accept string content', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="This is a simple text content"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('This is a simple text content')).toBeInTheDocument()
      })
    })

    it('should accept ReactNode content', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content={<div><p>Complex content</p></div>}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Complex content')).toBeInTheDocument()
      })
    })

    it('should accept learnMoreUrl', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs/help"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Learn more in documentation')
        expect(link).toHaveAttribute('href', '/docs/help')
      })
    })

    it('should accept videoUrl', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          videoUrl="/videos/tutorial.mp4"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Watch 2-minute tutorial')
        expect(link).toHaveAttribute('href', '/videos/tutorial.mp4')
      })
    })

    it('should accept placement prop', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          placement="bottom"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Information')).toBeInTheDocument()
      })
    })
  })

  describe('User Interactions', () => {
    it('should open popover when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="This is helpful"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Help')).toBeInTheDocument()
        expect(screen.getByText('This is helpful')).toBeInTheDocument()
      })
    })

    it('should close popover when clicking outside', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <div>
          <InfoPopover
            title="Help"
            content="This is helpful"
          />
          <button>Outside</button>
        </div>
      )

      const infoButton = screen.getByRole('button', { name: /Help/ })
      await user.click(infoButton)

      await waitFor(() => {
        expect(screen.getByText('This is helpful')).toBeInTheDocument()
      })

      const outsideButton = screen.getByRole('button', { name: /Outside/ })
      await user.click(outsideButton)

      await waitFor(() => {
        expect(screen.queryByText('This is helpful')).not.toBeInTheDocument()
      })
    })

    it('should allow multiple toggles', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="This is helpful"
        />
      )

      const button = screen.getByRole('button')

      // Open
      await user.click(button)
      await waitFor(() => {
        expect(screen.getByText('This is helpful')).toBeInTheDocument()
      })

      // Close by clicking outside (simulated by clicking button again)
      // Note: In real Radix, clicking trigger toggles
      await user.click(button)
      await waitFor(() => {
        expect(screen.queryByText('This is helpful')).not.toBeInTheDocument()
      })
    })

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="This is helpful"
        />
      )

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')
      // Button should trigger with Enter
    })

    it('should open popover and display learnMoreUrl', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Learn more in documentation')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/docs')
        expect(link).toHaveAttribute('target', '_blank')
      })
    })

    it('should open popover and display videoUrl', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          videoUrl="/video.mp4"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Watch 2-minute tutorial')
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', '/video.mp4')
        expect(link).toHaveAttribute('target', '_blank')
      })
    })

    it('should display both links when both URLs provided', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
          videoUrl="/video.mp4"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Watch 2-minute tutorial')).toBeInTheDocument()
        expect(screen.getByText('Learn more in documentation')).toBeInTheDocument()
      })
    })
  })

  describe('Styling & Appearance', () => {
    it('should have small icon size', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon).toHaveClass('h-4')
      expect(icon).toHaveClass('w-4')
    })

    it('should apply hover effect on button', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('hover:text-foreground')
    })

    it('should apply transition on button', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('transition-colors')
    })

    it('should apply rounded button style', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('rounded-full')
    })

    it('should have focus ring styling', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      expect(button).toHaveClass('focus:ring-2')
    })

    it('should display popover with correct width', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const content = screen.getByText('Information')
        expect(content.closest('[class*="w-"]')).toBeInTheDocument()
      })
    })

    it('should display title with icon', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const title = screen.getByText('Help')
        expect(title).toHaveClass('font-semibold')
        expect(title).toHaveClass('text-sm')
      })
    })

    it('should style content text', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Helpful information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const content = screen.getByText('Helpful information')
        expect(content).toHaveClass('text-sm')
        expect(content).toHaveClass('text-muted-foreground')
      })
    })

    it('should style external links with correct colors', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Learn more in documentation')
        expect(link).toHaveClass('text-primary')
        expect(link).toHaveClass('hover:underline')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label describing help content', () => {
      render(
        <InfoPopover
          title="Severity"
          content="Choose the appropriate level"
        />
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Help: Severity')
    })

    it('should hide icon from screen readers', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should render title with proper heading structure', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const title = screen.getByText('Help')
        expect(title.tagName).toBe('H4')
      })
    })

    it('should have accessible link styling', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Learn more in documentation')
        expect(link.tagName).toBe('A')
        expect(link).toHaveAttribute('href')
      })
    })

    it('should support keyboard navigation to links', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const link = screen.getByText('Learn more in documentation')
        link.focus()
        expect(link).toHaveFocus()
      })
    })

    it('should have semantic structure for content', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const space = screen.getByText('Information').closest('.space-y-3')
        expect(space).toBeInTheDocument()
      })
    })
  })

  describe('Sub-components/Composition', () => {
    it('should render icon next to trigger text', () => {
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )
      const button = container.querySelector('button')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render popover content with proper sections', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Help')).toBeInTheDocument()
        expect(screen.getByText('Information')).toBeInTheDocument()
      })
    })

    it('should render separator when links present', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        const border = container.querySelector('.border-t')
        expect(border).toBeInTheDocument()
      })
    })

    it('should render video and docs links with icons', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <InfoPopover
          title="Help"
          content="Information"
          videoUrl="/video"
          learnMoreUrl="/docs"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText('Watch 2-minute tutorial')).toBeInTheDocument()
        expect(screen.getByText('Learn more in documentation')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long title', async () => {
      const user = userEvent.setup()
      const longTitle = 'A'.repeat(100)
      render(
        <InfoPopover
          title={longTitle}
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(longTitle)).toBeInTheDocument()
      })
    })

    it('should handle very long content', async () => {
      const user = userEvent.setup()
      const longContent = 'This is helpful information. '.repeat(20)
      render(
        <InfoPopover
          title="Help"
          content={longContent}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(new RegExp(longContent.substring(0, 50)))).toBeInTheDocument()
      })
    })

    it('should handle special characters in title', async () => {
      const user = userEvent.setup()
      const specialTitle = 'Help & <Info> "Details"'
      render(
        <InfoPopover
          title={specialTitle}
          content="Information"
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(specialTitle)).toBeInTheDocument()
      })
    })

    it('should handle special characters in content', async () => {
      const user = userEvent.setup()
      const specialContent = 'Information with <tags> & symbols'
      render(
        <InfoPopover
          title="Help"
          content={specialContent}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(specialContent)).toBeInTheDocument()
      })
    })

    it('should handle multiple popovers on same page', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <InfoPopover title="Help 1" content="Content 1" />
          <InfoPopover title="Help 2" content="Content 2" />
        </div>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)

      await user.click(buttons[0])
      await waitFor(() => {
        expect(screen.getByText('Content 1')).toBeInTheDocument()
      })
    })

    it('should handle undefined URLs gracefully', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
          learnMoreUrl={undefined}
          videoUrl={undefined}
        />
      )

      const button = screen.getByRole('button')
      await user.click(button)

      await waitFor(() => {
        expect(screen.queryByText('Learn more')).not.toBeInTheDocument()
        expect(screen.queryByText('Watch')).not.toBeInTheDocument()
      })
    })

    it('should handle rapid open/close cycles', async () => {
      const user = userEvent.setup()
      render(
        <InfoPopover
          title="Help"
          content="Information"
        />
      )

      const button = screen.getByRole('button')

      await user.click(button)
      await user.click(button)
      await user.click(button)

      // Should handle without errors
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should support all icon type variants without error', async () => {
      const user = userEvent.setup()
      const types: Array<'info' | 'help' | 'warning'> = ['info', 'help', 'warning']

      types.forEach(type => {
        const { unmount } = render(
          <InfoPopover
            title="Help"
            content="Information"
            type={type}
          />
        )

        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()

        unmount()
      })
    })

    it('should handle all placement options', async () => {
      const placements: Array<'top' | 'right' | 'bottom' | 'left'> = ['top', 'right', 'bottom', 'left']

      placements.forEach(placement => {
        const { unmount } = render(
          <InfoPopover
            title="Help"
            content="Information"
            placement={placement}
          />
        )

        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()

        unmount()
      })
    })
  })
})
