import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonStatCard,
  SkeletonAvatar,
  SkeletonTableRow,
  SkeletonList,
  SkeletonGrid,
  SkeletonChart,
  SkeletonHubPage,
} from './skeleton'

describe('Skeleton Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders skeleton div', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toBeInTheDocument()
    })

    it('has pulse animation class', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('has muted background color', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('bg-muted/60')
    })

    it('has rounded corners', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('rounded-lg')
    })

    it('renders with custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-20" />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('h-10', 'w-20')
    })

    it('merges custom className with defaults', () => {
      const { container } = render(<Skeleton className="custom-class" />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('custom-class')
      expect(skeleton).toHaveClass('animate-pulse')
    })

    it('accepts custom HTML attributes', () => {
      const { container } = render(
        <Skeleton data-testid="custom-skeleton" aria-label="loading" />
      )
      const skeleton = screen.getByTestId('custom-skeleton')
      expect(skeleton).toHaveAttribute('aria-label', 'loading')
    })
  })

  describe('Styling & Appearance', () => {
    it('has proper sizing classes', () => {
      const { container } = render(<Skeleton className="h-4 w-32" />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('h-4', 'w-32')
    })

    it('can have different border radius', () => {
      const { container } = render(<Skeleton className="rounded-full" />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton?.className).toContain('rounded-full')
    })
  })
})

describe('SkeletonText Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders skeleton text with default 3 lines', () => {
      const { container } = render(<SkeletonText />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders custom number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBe(5)
    })

    it('renders single line when lines=1', () => {
      const { container } = render(<SkeletonText lines={1} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBe(1)
    })

    it('renders many lines when lines=10', () => {
      const { container } = render(<SkeletonText lines={10} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBe(10)
    })
  })

  describe('Layout', () => {
    it('has spacing between lines', () => {
      const { container } = render(<SkeletonText />)
      const wrapper = container.querySelector('div.space-y-2')
      expect(wrapper).toBeInTheDocument()
    })

    it('renders full width for all lines except last', () => {
      const { container } = render(<SkeletonText lines={3} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons[0]).toHaveClass('w-full')
      expect(skeletons[1]).toHaveClass('w-full')
    })
  })

  describe('Last Line Width Variations', () => {
    it('uses 3/4 width by default for last line', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="3/4" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons[1]?.className).toContain('w-3/4')
    })

    it('uses full width when specified', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="full" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons[1]).toHaveClass('w-full')
    })

    it('uses 1/2 width when specified', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="1/2" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons[1]?.className).toContain('w-1/2')
    })

    it('uses 1/4 width when specified', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="1/4" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons[1]?.className).toContain('w-1/4')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonText className="gap-3" />)
      const wrapper = container.querySelector('div')
      expect(wrapper?.className).toContain('gap-3')
    })

    it('accepts custom HTML attributes', () => {
      const { container } = render(<SkeletonText data-testid="text-skeleton" />)
      expect(container.querySelector('[data-testid="text-skeleton"]')).toBeInTheDocument()
    })
  })
})

describe('SkeletonCard Component', () => {
  describe('Rendering', () => {
    it('renders skeleton card', () => {
      const { container } = render(<SkeletonCard />)
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toBeInTheDocument()
    })

    it('has border styling', () => {
      const { container } = render(<SkeletonCard />)
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toHaveClass('border')
    })

    it('has rounded corners', () => {
      const { container } = render(<SkeletonCard />)
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toHaveClass('rounded-md')
    })

    it('has padding', () => {
      const { container } = render(<SkeletonCard />)
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toHaveClass('p-2')
    })

    it('has internal spacing', () => {
      const { container } = render(<SkeletonCard />)
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toHaveClass('space-y-2')
    })

    it('contains header skeleton and text skeletons', () => {
      const { container } = render(<SkeletonCard />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Structure', () => {
    it('has flex header with gap', () => {
      const { container } = render(<SkeletonCard />)
      const header = container.querySelector('div.flex.items-center.gap-3')
      expect(header).toBeInTheDocument()
    })

    it('has text content area', () => {
      const { container } = render(<SkeletonCard />)
      const textArea = container.querySelector('div.flex-1.space-y-2')
      expect(textArea).toBeInTheDocument()
    })
  })
})

describe('SkeletonStatCard Component', () => {
  describe('Rendering', () => {
    it('renders skeleton stat card', () => {
      const { container } = render(<SkeletonStatCard />)
      const card = container.querySelector('div[data-slot="skeleton-stat-card"]')
      expect(card).toBeInTheDocument()
    })

    it('has proper styling', () => {
      const { container } = render(<SkeletonStatCard />)
      const card = container.querySelector('div[data-slot="skeleton-stat-card"]')
      expect(card).toHaveClass('rounded-md', 'border', 'p-2', 'space-y-3')
    })

    it('has header with spacing', () => {
      const { container } = render(<SkeletonStatCard />)
      const header = container.querySelector('div.flex.items-center.justify-between')
      expect(header).toBeInTheDocument()
    })

    it('contains multiple skeleton elements', () => {
      const { container } = render(<SkeletonStatCard />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBeGreaterThanOrEqual(3)
    })
  })
})

describe('SkeletonAvatar Component', () => {
  describe('Rendering & Sizes', () => {
    it('renders skeleton avatar with default size', () => {
      const { container } = render(<SkeletonAvatar />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar?.className).toContain('h-8')
      expect(avatar?.className).toContain('w-10')
    })

    it('renders small size avatar', () => {
      const { container } = render(<SkeletonAvatar size="sm" />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toHaveClass('h-8', 'w-8')
    })

    it('renders large size avatar', () => {
      const { container } = render(<SkeletonAvatar size="lg" />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toHaveClass('h-9', 'w-12')
    })

    it('renders xl size avatar', () => {
      const { container } = render(<SkeletonAvatar size="xl" />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toHaveClass('h-16', 'w-16')
    })

    it('has circular shape', () => {
      const { container } = render(<SkeletonAvatar />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toHaveClass('rounded-full')
    })

    it('does not grow', () => {
      const { container } = render(<SkeletonAvatar />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toHaveClass('shrink-0')
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonAvatar className="custom-class" />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar?.className).toContain('custom-class')
    })
  })
})

describe('SkeletonTableRow Component', () => {
  describe('Rendering', () => {
    it('renders skeleton table row', () => {
      const { container } = render(<SkeletonTableRow />)
      const row = container.querySelector('div[data-slot="skeleton-table-row"]')
      expect(row).toBeInTheDocument()
    })

    it('has flex layout', () => {
      const { container } = render(<SkeletonTableRow />)
      const row = container.querySelector('div[data-slot="skeleton-table-row"]')
      expect(row).toHaveClass('flex', 'items-center', 'gap-2')
    })

    it('has padding', () => {
      const { container } = render(<SkeletonTableRow />)
      const row = container.querySelector('div[data-slot="skeleton-table-row"]')
      expect(row).toHaveClass('py-3', 'px-2')
    })

    it('has bottom border', () => {
      const { container } = render(<SkeletonTableRow />)
      const row = container.querySelector('div[data-slot="skeleton-table-row"]')
      expect(row).toHaveClass('border-b')
    })

    it('contains checkbox skeleton', () => {
      const { container } = render(<SkeletonTableRow />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      const checkboxSkeleton = Array.from(skeletons).find(s => s.className.includes('h-4') && s.className.includes('w-4'))
      expect(checkboxSkeleton).toBeInTheDocument()
    })

    it('contains avatar skeleton', () => {
      const { container } = render(<SkeletonTableRow />)
      const avatar = container.querySelector('div[data-slot="skeleton"]')
      expect(avatar).toBeInTheDocument()
    })
  })
})

describe('SkeletonList Component', () => {
  describe('Rendering with Variants', () => {
    it('renders skeleton list with card variant (default)', () => {
      const { container } = render(<SkeletonList />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton-card"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders custom count of items', () => {
      const { container } = render(<SkeletonList count={5} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton-card"]')
      expect(skeletons.length).toBe(5)
    })

    it('renders stat variant', () => {
      const { container } = render(<SkeletonList variant="stat" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders row variant', () => {
      const { container } = render(<SkeletonList variant="row" />)
      const rows = container.querySelectorAll('div[data-slot="skeleton-table-row"]')
      expect(rows.length).toBe(3)
    })

    it('single item list', () => {
      const { container } = render(<SkeletonList count={1} variant="card" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton-card"]')
      expect(skeletons.length).toBe(1)
    })

    it('many items list', () => {
      const { container } = render(<SkeletonList count={10} variant="card" />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton-card"]')
      expect(skeletons.length).toBe(10)
    })
  })

  describe('Spacing', () => {
    it('has space-y-3 for card variant', () => {
      const { container } = render(<SkeletonList variant="card" />)
      const wrapper = container.querySelector('div[data-slot="skeleton-list"]')
      expect(wrapper).toHaveClass('space-y-3')
    })

    it('has divide-y for row variant', () => {
      const { container } = render(<SkeletonList variant="row" />)
      const wrapper = container.querySelector('div[data-slot="skeleton-list"]')
      expect(wrapper).toHaveClass('divide-y')
    })
  })
})

describe('SkeletonGrid Component', () => {
  describe('Rendering', () => {
    it('renders skeleton grid with default count and columns', () => {
      const { container } = render(<SkeletonGrid />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(cards.length).toBe(4)
    })

    it('renders custom count of items', () => {
      const { container } = render(<SkeletonGrid count={6} columns={3} />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(cards.length).toBe(6)
    })

    it('renders single item', () => {
      const { container } = render(<SkeletonGrid count={1} />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(cards.length).toBe(1)
    })

    it('renders many items', () => {
      const { container } = render(<SkeletonGrid count={12} />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(cards.length).toBe(12)
    })
  })

  describe('Column Layouts', () => {
    it('renders 2 column layout', () => {
      const { container } = render(<SkeletonGrid columns={2} />)
      const grid = container.querySelector('div[data-slot="skeleton-grid"]')
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('sm:grid-cols-2')
    })

    it('renders 3 column layout', () => {
      const { container } = render(<SkeletonGrid columns={3} />)
      const grid = container.querySelector('div[data-slot="skeleton-grid"]')
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('sm:grid-cols-2')
      expect(grid?.className).toContain('lg:grid-cols-3')
    })

    it('renders 4 column layout', () => {
      const { container } = render(<SkeletonGrid columns={4} />)
      const grid = container.querySelector('div[data-slot="skeleton-grid"]')
      expect(grid?.className).toContain('grid-cols-1')
      expect(grid?.className).toContain('sm:grid-cols-2')
      expect(grid?.className).toContain('lg:grid-cols-4')
    })
  })

  describe('Spacing', () => {
    it('has gap between items', () => {
      const { container } = render(<SkeletonGrid />)
      const grid = container.querySelector('div[data-slot="skeleton-grid"]')
      expect(grid).toHaveClass('gap-3')
    })
  })
})

describe('SkeletonChart Component', () => {
  describe('Rendering', () => {
    it('renders skeleton chart', () => {
      const { container } = render(<SkeletonChart />)
      const chart = container.querySelector('div[data-slot="skeleton-chart"]')
      expect(chart).toBeInTheDocument()
    })

    it('has border and padding', () => {
      const { container } = render(<SkeletonChart />)
      const chart = container.querySelector('div[data-slot="skeleton-chart"]')
      expect(chart).toHaveClass('border', 'p-2')
    })

    it('has header with title and buttons', () => {
      const { container } = render(<SkeletonChart />)
      const header = container.querySelector('div.flex.items-center.justify-between')
      expect(header).toBeInTheDocument()
    })

    it('has large chart area', () => {
      const { container } = render(<SkeletonChart />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      const chartArea = Array.from(skeletons).find(s => s.className.includes('h-48'))
      expect(chartArea).toBeInTheDocument()
    })

    it('has full width layout', () => {
      const { container } = render(<SkeletonChart />)
      const chartArea = container.querySelector('div[data-slot="skeleton"][class*="w-full"]')
      expect(chartArea).toBeInTheDocument()
    })
  })
})

describe('SkeletonHubPage Component', () => {
  describe('Rendering', () => {
    it('renders skeleton hub page', () => {
      const { container } = render(<SkeletonHubPage />)
      const page = container.querySelector('div[data-slot="skeleton-hub-page"]')
      expect(page).toBeInTheDocument()
    })

    it('has padding', () => {
      const { container } = render(<SkeletonHubPage />)
      const page = container.querySelector('div[data-slot="skeleton-hub-page"]')
      expect(page).toHaveClass('p-2')
    })

    it('has vertical spacing', () => {
      const { container } = render(<SkeletonHubPage />)
      const page = container.querySelector('div[data-slot="skeleton-hub-page"]')
      expect(page).toHaveClass('space-y-2')
    })
  })

  describe('Structure', () => {
    it('contains header section', () => {
      const { container } = render(<SkeletonHubPage />)
      const header = container.querySelector('div.flex.flex-col')
      expect(header).toBeInTheDocument()
    })

    it('contains tabs', () => {
      const { container } = render(<SkeletonHubPage />)
      const tabs = container.querySelectorAll('div.flex.gap-2')
      expect(tabs.length).toBeGreaterThan(0)
    })

    it('contains stats grid', () => {
      const { container } = render(<SkeletonHubPage />)
      const statCards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(statCards.length).toBe(4)
    })

    it('contains content cards', () => {
      const { container } = render(<SkeletonHubPage />)
      const charts = container.querySelectorAll('div[data-slot="skeleton-chart"]')
      expect(charts.length).toBeGreaterThan(0)
    })

    it('contains card content', () => {
      const { container } = render(<SkeletonHubPage />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-card"]')
      expect(cards.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Classes', () => {
    it('has responsive header layout', () => {
      const { container } = render(<SkeletonHubPage />)
      const header = container.querySelector('div.flex.flex-col.sm\\:flex-row')
      expect(header).toBeInTheDocument()
    })

    it('has responsive spacing', () => {
      const { container } = render(<SkeletonHubPage />)
      const page = container.querySelector('div[data-slot="skeleton-hub-page"]')
      expect(page?.className).toContain('sm:space-y-2')
    })

    it('has responsive grid layout', () => {
      const { container } = render(<SkeletonHubPage />)
      const gridContainer = container.querySelector('div.grid.grid-cols-1.lg\\:grid-cols-3')
      expect(gridContainer).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonHubPage className="custom-class" />)
      const page = container.querySelector('div[data-slot="skeleton-hub-page"]')
      expect(page?.className).toContain('custom-class')
    })
  })
})

describe('Skeleton Animations', () => {
  describe('Pulse Animation', () => {
    it('all skeletons have pulse animation', () => {
      const { container } = render(
        <div>
          <Skeleton />
          <SkeletonText />
          <SkeletonCard />
          <SkeletonAvatar />
          <SkeletonChart />
        </div>
      )
      const allSkeletons = container.querySelectorAll('[class*="animate-pulse"]')
      expect(allSkeletons.length).toBeGreaterThan(0)
    })

    it('individual Skeleton has pulse', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveClass('animate-pulse')
    })
  })
})

describe('Accessibility', () => {
  describe('Semantic HTML', () => {
    it('uses div elements appropriately', () => {
      const { container } = render(<Skeleton />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('skeleton components are div-based', () => {
      const { container } = render(<SkeletonCard />)
      expect(container.querySelector('div')).toBeInTheDocument()
    })
  })

  describe('ARIA Attributes', () => {
    it('accepts aria attributes on Skeleton', () => {
      const { container } = render(<Skeleton aria-label="loading" />)
      expect(container.querySelector('div[aria-label="loading"]')).toBeInTheDocument()
    })

    it('accepts aria attributes on SkeletonText', () => {
      const { container } = render(<SkeletonText aria-busy="true" />)
      expect(container.querySelector('div[aria-busy="true"]')).toBeInTheDocument()
    })
  })

  describe('Data Attributes', () => {
    it('Skeleton has data-slot attribute', () => {
      const { container } = render(<Skeleton />)
      const skeleton = container.querySelector('div[data-slot="skeleton"]')
      expect(skeleton).toHaveAttribute('data-slot', 'skeleton')
    })

    it('SkeletonCard has data-slot attribute', () => {
      const { container } = render(<SkeletonCard />)
      expect(container.querySelector('div[data-slot="skeleton-card"]')).toBeInTheDocument()
    })

    it('SkeletonTableRow has data-slot attribute', () => {
      const { container } = render(<SkeletonTableRow />)
      expect(container.querySelector('div[data-slot="skeleton-table-row"]')).toBeInTheDocument()
    })

    it('SkeletonHubPage has data-slot attribute', () => {
      const { container } = render(<SkeletonHubPage />)
      expect(container.querySelector('div[data-slot="skeleton-hub-page"]')).toBeInTheDocument()
    })
  })
})

describe('Edge Cases & Integration', () => {
  describe('Large Rendering', () => {
    it('renders large skeleton grid without errors', () => {
      const { container } = render(<SkeletonGrid count={20} columns={4} />)
      const cards = container.querySelectorAll('div[data-slot="skeleton-stat-card"]')
      expect(cards.length).toBe(20)
    })

    it('renders long skeleton text without errors', () => {
      const { container } = render(<SkeletonText lines={50} />)
      const skeletons = container.querySelectorAll('div[data-slot="skeleton"]')
      expect(skeletons.length).toBe(50)
    })

    it('renders large skeleton list without errors', () => {
      const { container } = render(<SkeletonList count={25} variant="row" />)
      const rows = container.querySelectorAll('div[data-slot="skeleton-table-row"]')
      expect(rows.length).toBe(25)
    })
  })

  describe('Composition', () => {
    it('skeletons can be composed together', () => {
      const { container } = render(
        <div>
          <SkeletonCard />
          <SkeletonStatCard />
          <SkeletonChart />
        </div>
      )
      expect(container.querySelector('div[data-slot="skeleton-card"]')).toBeInTheDocument()
      expect(container.querySelector('div[data-slot="skeleton-stat-card"]')).toBeInTheDocument()
      expect(container.querySelector('div[data-slot="skeleton-chart"]')).toBeInTheDocument()
    })

    it('can nest skeleton components', () => {
      const { container } = render(
        <SkeletonCard>
          <Skeleton />
        </SkeletonCard>
      )
      const card = container.querySelector('div[data-slot="skeleton-card"]')
      expect(card).toBeInTheDocument()
    })
  })
})
