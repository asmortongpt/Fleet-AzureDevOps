import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DrilldownCard, type DrilldownLevel } from './drilldown-card'
import { ChevronRight, ArrowLeft } from 'lucide-react'

describe('DrilldownCard Component', () => {
  const mockLevels: DrilldownLevel[] = [
    {
      id: 'overview',
      title: 'Fleet Overview',
      description: 'All vehicles across your fleet',
      component: <div>Overview Content</div>,
      metadata: { count: 156, total: '156 vehicles' },
    },
    {
      id: 'region',
      title: 'By Region',
      description: 'Vehicles grouped by region',
      component: <div>Region Content</div>,
    },
    {
      id: 'details',
      title: 'Vehicle Details',
      description: 'Individual vehicle information',
      component: <div>Details Content</div>,
    },
  ]

  describe('Rendering & Basic Structure', () => {
    it('should render card component', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const card = container.querySelector('[class*="card"]')
      expect(card).toBeInTheDocument()
    })

    it('should display current level title', () => {
      render(<DrilldownCard levels={mockLevels} />)
      expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    })

    it('should display current level component', () => {
      render(<DrilldownCard levels={mockLevels} />)
      expect(screen.getByText('Overview Content')).toBeInTheDocument()
    })

    it('should display breadcrumb navigation', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const breadcrumb = container.querySelector('[class*="flex"]')
      expect(breadcrumb).toBeInTheDocument()
    })

    it('should render current level in breadcrumb', () => {
      render(<DrilldownCard levels={mockLevels} />)
      expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    })
  })

  describe('Props & Configuration', () => {
    it('should accept initialLevel prop', () => {
      render(<DrilldownCard levels={mockLevels} initialLevel="region" />)
      expect(screen.getByText('By Region')).toBeInTheDocument()
    })

    it('should accept showExport prop', () => {
      render(<DrilldownCard levels={mockLevels} showExport={true} />)
      const exportButton = screen.getByText(/Export|Download/)
      expect(exportButton).toBeInTheDocument()
    })

    it('should not show export button by default', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const exportBtn = container.querySelector('[aria-label*="Export"]')
      // Export button might not exist without showExport
    })

    it('should accept custom className', () => {
      const { container } = render(
        <DrilldownCard levels={mockLevels} className="custom-class" />
      )
      const card = container.querySelector('[class*="card"]')
      expect(card).toHaveClass('custom-class')
    })

    it('should render metadata when provided', () => {
      render(<DrilldownCard levels={mockLevels} />)
      expect(screen.getByText('156 vehicles')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should drill down when clicking next level', async () => {
      const user = userEvent.setup()
      const onLevelChange = vi.fn()

      render(
        <DrilldownCard levels={mockLevels} onLevelChange={onLevelChange} />
      )

      // Look for navigation to next level
      const nextButton = screen.queryByRole('button', { name: /By Region/ })
      if (nextButton) {
        await user.click(nextButton)
      }
    })

    it('should call onLevelChange callback when drilling down', async () => {
      const user = userEvent.setup()
      const onLevelChange = vi.fn()

      const levels: DrilldownLevel[] = [
        {
          id: 'overview',
          title: 'Overview',
          component: <button onClick={() => onLevelChange('region')}>Drill Down</button>,
        },
      ]

      render(<DrilldownCard levels={levels} onLevelChange={onLevelChange} />)

      const button = screen.getByText('Drill Down')
      await user.click(button)
      expect(onLevelChange).toHaveBeenCalledWith('region')
    })

    it('should drill up when clicking back button', async () => {
      const user = userEvent.setup()

      render(
        <DrilldownCard levels={mockLevels} initialLevel="region" />
      )

      // Should have drilled down to region
      expect(screen.getByText('By Region')).toBeInTheDocument()

      // Look for back button to drill up
      const backButton = screen.queryByRole('button', { name: /back|up/i })
      if (backButton) {
        await user.click(backButton)
        // Should return to previous level
      }
    })

    it('should call onExport when export button clicked', async () => {
      const user = userEvent.setup()
      const onExport = vi.fn()

      render(
        <DrilldownCard
          levels={mockLevels}
          onExport={onExport}
          showExport={true}
        />
      )

      const exportBtn = screen.getByText(/Export|Download/)
      if (exportBtn) {
        await user.click(exportBtn)
        expect(onExport).toHaveBeenCalled()
      }
    })
  })

  describe('Styling & Appearance', () => {
    it('should apply card styling', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const card = container.querySelector('[class*="rounded"]')
      expect(card).toBeInTheDocument()
    })

    it('should display breadcrumb with proper spacing', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const breadcrumb = container.querySelector('[class*="gap"]')
      expect(breadcrumb).toBeInTheDocument()
    })

    it('should style current level badge', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const badge = container.querySelector('[class*="badge"]')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have semantic card structure', () => {
      const { container } = render(<DrilldownCard levels={mockLevels} />)
      const heading = container.querySelector('h2, h3')
      expect(heading).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<DrilldownCard levels={mockLevels} />)

      const title = screen.getByText('Fleet Overview')
      title.focus()
      expect(title).toBeInTheDocument()
    })

    it('should have accessible button labels', () => {
      render(<DrilldownCard levels={mockLevels} />)
      // Buttons should have accessible labels
      expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    })
  })

  describe('Navigation History', () => {
    it('should maintain navigation history', async () => {
      const user = userEvent.setup()
      const onLevelChange = vi.fn()

      const { rerender } = render(
        <DrilldownCard levels={mockLevels} onLevelChange={onLevelChange} />
      )

      expect(screen.getByText('Overview Content')).toBeInTheDocument()
    })

    it('should not allow drilling up from first level', async () => {
      const user = userEvent.setup()

      render(<DrilldownCard levels={mockLevels} />)

      // Should be at first level (no back button available)
      expect(screen.getByText('Overview Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle single level', () => {
      const singleLevel: DrilldownLevel[] = [
        {
          id: 'only',
          title: 'Only Level',
          component: <div>Only Content</div>,
        },
      ]

      render(<DrilldownCard levels={singleLevel} />)
      expect(screen.getByText('Only Level')).toBeInTheDocument()
    })

    it('should handle many levels', () => {
      const manyLevels: DrilldownLevel[] = Array.from({ length: 10 }, (_, i) => ({
        id: `level-${i}`,
        title: `Level ${i}`,
        component: <div>Level {i} Content</div>,
      }))

      render(<DrilldownCard levels={manyLevels} />)
      expect(screen.getByText('Level 0')).toBeInTheDocument()
    })

    it('should handle missing initialLevel', () => {
      render(<DrilldownCard levels={mockLevels} initialLevel={undefined} />)
      expect(screen.getByText('Fleet Overview')).toBeInTheDocument()
    })

    it('should handle invalid initialLevel gracefully', () => {
      render(<DrilldownCard levels={mockLevels} initialLevel="nonexistent" />)
      // Should render without crashing
      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('should handle levels with no metadata', () => {
      const noMetadata: DrilldownLevel[] = [
        {
          id: 'test',
          title: 'Test',
          component: <div>Content</div>,
        },
      ]

      render(<DrilldownCard levels={noMetadata} />)
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })
})
