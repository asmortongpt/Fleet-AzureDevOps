import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

describe('Tabs Component', () => {
  describe('Rendering & Structure', () => {
    it('renders tabs with list and content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Content 1')).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      expect(container.querySelector('[data-slot="tabs"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-trigger"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="tabs-content"]')).toBeInTheDocument()
    })

    it('renders multiple tabs', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
          <TabsContent value="tab3">Content 3</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
      expect(screen.getByText('Tab 2')).toBeInTheDocument()
      expect(screen.getByText('Tab 3')).toBeInTheDocument()
    })
  })

  describe('List Styling', () => {
    it('applies list styling', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const list = container.querySelector('[data-slot="tabs-list"]')
      expect(list).toHaveClass('inline-flex', 'h-10', 'items-center', 'justify-center', 'rounded-lg', 'bg-muted', 'p-1')
    })

    it('accepts custom list className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList className="custom-list">
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const list = container.querySelector('[data-slot="tabs-list"]')
      expect(list).toHaveClass('custom-list')
    })
  })

  describe('Trigger Styling', () => {
    it('applies trigger styling', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('inline-flex', 'items-center', 'justify-center', 'whitespace-nowrap', 'rounded-md', 'px-3', 'py-1.5', 'text-sm', 'font-medium')
    })

    it('has hover effect', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('hover:bg-muted-foreground/20')
    })

    it('has active state styling', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('data-[state=active]:bg-background', 'data-[state=active]:shadow-sm')
    })

    it('has focus ring', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('has transition effect', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('transition-colors')
    })

    it('accepts custom trigger className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" className="custom-trigger">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveClass('custom-trigger')
    })
  })

  describe('Content Styling', () => {
    it('applies content styling', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-slot="tabs-content"]')
      expect(content).toHaveClass('mt-2')
    })

    it('has animation classes', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-slot="tabs-content"]')
      expect(content).toHaveClass('data-[state=active]:animate-in', 'data-[state=inactive]:animate-out')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="custom-content">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-slot="tabs-content"]')
      expect(content).toHaveClass('custom-content')
    })
  })

  describe('Default Value', () => {
    it('sets default tab value', () => {
      render(
        <Tabs defaultValue="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })

  describe('Controlled Value', () => {
    it('supports controlled value prop', () => {
      const { rerender } = render(
        <Tabs value="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Content 1')).toBeInTheDocument()

      rerender(
        <Tabs value="tab2">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Content 2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('trigger has button role', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = screen.getByRole('button')
      expect(trigger).toBeInTheDocument()
    })

    it('trigger has aria-selected for active state', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-slot="tabs-trigger"]')
      expect(trigger).toHaveAttribute('aria-selected')
    })

    it('content has tabpanel role', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-slot="tabs-content"]')
      expect(content).toHaveAttribute('role', 'tabpanel')
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on trigger', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1" data-testid="custom-trigger">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      const trigger = container.querySelector('[data-testid="custom-trigger"]')
      expect(trigger).toBeInTheDocument()
    })

    it('spreads additional props on content', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" data-testid="custom-content">Content</TabsContent>
        </Tabs>
      )
      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Complete Tabs Workflow', () => {
    it('renders complete tabs interface', () => {
      render(
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Overview content</TabsContent>
          <TabsContent value="details">Details content</TabsContent>
          <TabsContent value="settings">Settings content</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('realistic dashboard use case', () => {
      render(
        <Tabs defaultValue="metrics">
          <TabsList>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="metrics">
            <div>Metric data here</div>
          </TabsContent>
          <TabsContent value="analytics">
            <div>Analytics data here</div>
          </TabsContent>
          <TabsContent value="reports">
            <div>Reports data here</div>
          </TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Metrics')).toBeInTheDocument()
      expect(screen.getByText('Metric data here')).toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('supports disabled trigger', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2" disabled>Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      const disabledTrigger = screen.getByRole('button', { name: /tab 2/i })
      expect(disabledTrigger).toBeDisabled()
    })
  })

  describe('Orientation', () => {
    it('supports vertical orientation', () => {
      render(
        <Tabs defaultValue="tab1" orientation="vertical">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })

    it('supports horizontal orientation', () => {
      render(
        <Tabs defaultValue="tab1" orientation="horizontal">
          <TabsList>
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content 1</TabsContent>
          <TabsContent value="tab2">Content 2</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Tab 1')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('renders empty tabs list', () => {
      const { container } = render(
        <Tabs defaultValue="tab1">
          <TabsList />
        </Tabs>
      )
      expect(container.querySelector('[data-slot="tabs-list"]')).toBeInTheDocument()
    })

    it('renders with complex trigger content', () => {
      render(
        <Tabs defaultValue="tab1">
          <TabsList>
            <TabsTrigger value="tab1">
              <span>Icon</span>
              <span>Label</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tab1">Content</TabsContent>
        </Tabs>
      )
      expect(screen.getByText('Label')).toBeInTheDocument()
    })
  })
})
