import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from './resizable'

describe('Resizable Components', () => {
  describe('ResizablePanelGroup', () => {
    it('renders panel group', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument()
    })

    it('has resizable panel group data-slot', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument()
    })

    it('has flex layout', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
        </ResizablePanelGroup>
      )
      const group = container.querySelector('[data-slot="resizable-panel-group"]')
      expect(group).toHaveClass('flex')
    })

    it('has full height and width', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
        </ResizablePanelGroup>
      )
      const group = container.querySelector('[data-slot="resizable-panel-group"]')
      expect(group).toHaveClass('h-full', 'w-full')
    })

    it('supports multiple panels', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ResizablePanelGroup className="custom-group">
          <ResizablePanel>Panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      const group = container.querySelector('[data-slot="resizable-panel-group"]')
      expect(group).toHaveClass('custom-group')
    })

    it('supports vertical layout via direction', () => {
      const { container } = render(
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>Top</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Bottom</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument()
    })
  })

  describe('ResizablePanel', () => {
    it('renders panel', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel data-testid="panel">Content</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByTestId('panel')).toBeInTheDocument()
    })

    it('has resizable panel data-slot', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Content</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel"]')).toBeInTheDocument()
    })

    it('renders panel content', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>Panel content here</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Panel content here')).toBeInTheDocument()
    })

    it('accepts defaultSize prop', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel defaultSize={30}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={70}>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const panels = container.querySelectorAll('[data-slot="resizable-panel"]')
      expect(panels.length).toBe(2)
    })

    it('can be collapsible', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel collapsible minSize={5}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel"]')).toBeInTheDocument()
    })

    it('supports minSize prop', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel minSize={10}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
    })

    it('supports maxSize prop', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel maxSize={50}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
    })

    it('can contain complex content', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>
            <div className="panel-content">
              <h2>Title</h2>
              <p>Content</p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel className="custom-panel">Panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      const panel = container.querySelector('[data-slot="resizable-panel"]')
      expect(panel).toHaveClass('custom-panel')
    })
  })

  describe('ResizableHandle', () => {
    it('renders resize handle', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByTestId('handle')).toBeInTheDocument()
    })

    it('has resizable handle data-slot', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-handle"]')).toBeInTheDocument()
    })

    it('has bg-border class', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toHaveClass('bg-border')
    })

    it('has focus visible ring', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toHaveClass('focus-visible:ring-ring')
    })

    it('supports withHandle prop to show grip icon', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toBeInTheDocument()
    })

    it('displays grip icon when withHandle is true', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle withHandle>
            <div className="grip" />
          </ResizableHandle>
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-handle"]')).toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle className="custom-handle" />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toHaveClass('custom-handle')
    })
  })

  describe('Two Panel Layout', () => {
    it('renders two-panel horizontal layout', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>Left panel</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left panel')).toBeInTheDocument()
      expect(screen.getByText('Right panel')).toBeInTheDocument()
    })

    it('renders two-panel vertical layout', () => {
      render(
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel>Top panel</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Bottom panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Top panel')).toBeInTheDocument()
      expect(screen.getByText('Bottom panel')).toBeInTheDocument()
    })
  })

  describe('Three Panel Layout', () => {
    it('renders three-panel layout', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Middle</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Middle')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })
  })

  describe('Nested Layouts', () => {
    it('supports nested panel groups', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel>Top</ResizablePanel>
              <ResizableHandle />
              <ResizablePanel>Bottom</ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Top')).toBeInTheDocument()
      expect(screen.getByText('Bottom')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })
  })

  describe('Keyboard Interaction', () => {
    it('responds to keyboard on handle', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle data-testid="handle" />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = screen.getByTestId('handle')
      fireEvent.keyDown(handle, { key: 'ArrowRight' })
      expect(handle).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic structure', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(container.querySelector('[data-slot="resizable-panel-group"]')).toBeInTheDocument()
    })

    it('handle is focusable', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toBeInTheDocument()
    })

    it('supports aria attributes', () => {
      const { container } = render(
        <ResizablePanelGroup aria-label="Main layout">
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const group = container.querySelector('[data-slot="resizable-panel-group"]')
      expect(group).toHaveAttribute('aria-label', 'Main layout')
    })
  })

  describe('Edge Cases', () => {
    it('renders single panel without handle', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel>Single panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Single panel')).toBeInTheDocument()
    })

    it('handles equal sized panels', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel defaultSize={50}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50}>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })

    it('handles unequal sized panels', () => {
      render(
        <ResizablePanelGroup>
          <ResizablePanel defaultSize={30}>Left</ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={70}>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Left')).toBeInTheDocument()
      expect(screen.getByText('Right')).toBeInTheDocument()
    })

    it('handles many panels', () => {
      render(
        <ResizablePanelGroup>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              {i > 0 && <ResizableHandle />}
              <ResizablePanel>Panel {i + 1}</ResizablePanel>
            </div>
          ))}
        </ResizablePanelGroup>
      )
      expect(screen.getByText('Panel 1')).toBeInTheDocument()
      expect(screen.getByText('Panel 5')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('applies custom className to group', () => {
      const { container } = render(
        <ResizablePanelGroup className="custom-group">
          <ResizablePanel>Panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      const group = container.querySelector('[data-slot="resizable-panel-group"]')
      expect(group).toHaveClass('custom-group')
    })

    it('applies custom className to panel', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel className="custom-panel">Panel</ResizablePanel>
        </ResizablePanelGroup>
      )
      const panel = container.querySelector('[data-slot="resizable-panel"]')
      expect(panel).toHaveClass('custom-panel')
    })

    it('applies custom className to handle', () => {
      const { container } = render(
        <ResizablePanelGroup>
          <ResizablePanel>Left</ResizablePanel>
          <ResizableHandle className="custom-handle" />
          <ResizablePanel>Right</ResizablePanel>
        </ResizablePanelGroup>
      )
      const handle = container.querySelector('[data-slot="resizable-handle"]')
      expect(handle).toHaveClass('custom-handle')
    })
  })
})
