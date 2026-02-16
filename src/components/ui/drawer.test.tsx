import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerPortal,
  DrawerOverlay,
} from './drawer'

describe('Drawer Component', () => {
  describe('Rendering & Structure', () => {
    it('renders drawer with all subcomponents', () => {
      render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
              <DrawerDescription>Description</DrawerDescription>
            </DrawerHeader>
            <div>Content</div>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('renders trigger button', () => {
      render(
        <Drawer open={false}>
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const trigger = screen.getByRole('button', { name: /open drawer/i })
      expect(trigger).toBeInTheDocument()
    })

    it('has data-slot attributes', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      expect(container.querySelector('[data-slot="drawer"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="drawer-content"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="drawer-title"]')).toBeInTheDocument()
    })
  })

  describe('Overlay Behavior', () => {
    it('renders overlay when drawer is open', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const overlay = container.querySelector('[data-slot="drawer-overlay"]')
      expect(overlay).toBeInTheDocument()
    })

    it('applies correct overlay styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const overlay = container.querySelector('[data-slot="drawer-overlay"]')
      expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50', 'bg-black/60', 'backdrop-blur-sm')
    })

    it('overlay has animation classes', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const overlay = container.querySelector('[data-slot="drawer-overlay"]')
      expect(overlay).toHaveClass('data-[state=open]:animate-in', 'data-[state=closed]:animate-out')
    })

    it('accepts custom overlay className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerOverlay className="custom-overlay">
            <DrawerContent>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerContent>
          </DrawerOverlay>
        </Drawer>
      )

      const overlay = container.querySelector('[data-slot="drawer-overlay"]')
      expect(overlay).toHaveClass('custom-overlay')
    })
  })

  describe('Content Styling - Directional Support', () => {
    it('applies base content styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass('fixed', 'z-50', 'flex', 'flex-col', 'bg-background/95', 'backdrop-blur-xl')
    })

    it('supports bottom drawer direction', () => {
      const { container } = render(
        <Drawer open={true} direction="bottom">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass(
        'data-[vaul-drawer-direction=bottom]:inset-x-0',
        'data-[vaul-drawer-direction=bottom]:bottom-0',
        'data-[vaul-drawer-direction=bottom]:rounded-t-2xl'
      )
    })

    it('supports top drawer direction', () => {
      const { container } = render(
        <Drawer open={true} direction="top">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass(
        'data-[vaul-drawer-direction=top]:inset-x-0',
        'data-[vaul-drawer-direction=top]:top-0',
        'data-[vaul-drawer-direction=top]:rounded-b-2xl'
      )
    })

    it('supports right drawer direction', () => {
      const { container } = render(
        <Drawer open={true} direction="right">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass(
        'data-[vaul-drawer-direction=right]:inset-y-0',
        'data-[vaul-drawer-direction=right]:right-0',
        'data-[vaul-drawer-direction=right]:rounded-l-2xl'
      )
    })

    it('supports left drawer direction', () => {
      const { container } = render(
        <Drawer open={true} direction="left">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass(
        'data-[vaul-drawer-direction=left]:inset-y-0',
        'data-[vaul-drawer-direction=left]:left-0',
        'data-[vaul-drawer-direction=left]:rounded-r-2xl'
      )
    })

    it('has border styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass('border-border/50')
    })

    it('accepts custom content className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent className="custom-content">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass('custom-content')
    })

    it('renders drag handle for bottom drawer', () => {
      const { container } = render(
        <Drawer open={true} direction="bottom">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const dragHandle = container.querySelector('.group-data-[vaul-drawer-direction=bottom]\\/drawer-content\\:block')
      expect(dragHandle).toBeDefined()
    })
  })

  describe('Header Component', () => {
    it('renders header with correct styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )

      const header = container.querySelector('[data-slot="drawer-header"]')
      expect(header).toHaveClass('flex', 'flex-col', 'gap-2', 'text-center', 'sm:text-left')
    })

    it('accepts custom header className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerHeader className="custom-header">
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )

      const header = container.querySelector('[data-slot="drawer-header"]')
      expect(header).toHaveClass('custom-header')
    })
  })

  describe('Footer Component', () => {
    it('renders footer with correct styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerFooter>
              <button>Cancel</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )

      const footer = container.querySelector('[data-slot="drawer-footer"]')
      expect(footer).toHaveClass('flex', 'flex-col-reverse', 'gap-2', 'sm:flex-row', 'sm:justify-end')
    })

    it('accepts custom footer className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerFooter className="custom-footer">
              <button>Cancel</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )

      const footer = container.querySelector('[data-slot="drawer-footer"]')
      expect(footer).toHaveClass('custom-footer')
    })
  })

  describe('Title Component', () => {
    it('renders title text', () => {
      render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Drawer Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Drawer Title')).toBeInTheDocument()
    })

    it('applies title styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const title = container.querySelector('[data-slot="drawer-title"]')
      expect(title).toHaveClass('text-lg', 'font-semibold')
    })

    it('accepts custom title className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle className="custom-title">Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const title = container.querySelector('[data-slot="drawer-title"]')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('Description Component', () => {
    it('renders description text', () => {
      render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerDescription>Drawer description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Drawer description')).toBeInTheDocument()
    })

    it('applies description styling', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )

      const description = container.querySelector('[data-slot="drawer-description"]')
      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('accepts custom description className', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerDescription className="custom-desc">Description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )

      const description = container.querySelector('[data-slot="drawer-description"]')
      expect(description).toHaveClass('custom-desc')
    })
  })

  describe('Close Button', () => {
    it('renders close button for side drawers by default', () => {
      const { container } = render(
        <Drawer open={true} direction="right">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const closeButton = container.querySelector('[data-slot="drawer-close"]')
      expect(closeButton).toBeInTheDocument()
    })

    it('close button is not rendered when showClose is false', () => {
      const { container } = render(
        <Drawer open={true} direction="right">
          <DrawerContent showClose={false}>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      const closeButton = content?.querySelector('[data-slot="drawer-close"]')
      expect(closeButton).not.toBeInTheDocument()
    })

    it('applies correct styling to close button', () => {
      const { container } = render(
        <Drawer open={true} direction="right">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const closeButton = container.querySelector('[data-slot="drawer-close"]')
      expect(closeButton).toHaveClass('absolute', 'top-4', 'right-4', 'rounded-lg', 'p-2')
    })
  })

  describe('Accessibility', () => {
    it('has dialog role on content', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveAttribute('role', 'dialog')
    })

    it('title and description are linked to content', () => {
      render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
            <DrawerDescription>Description</DrawerDescription>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
    })

    it('supports aria-label on content', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent aria-label="Custom drawer label">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom drawer label')
    })
  })

  describe('Portal Behavior', () => {
    it('portal renders content in separate DOM node', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const portal = container.querySelector('[data-slot="drawer-portal"]')
      expect(portal).toBeInTheDocument()
    })

    it('renders custom portal container', () => {
      render(
        <Drawer open={true}>
          <DrawerPortal>
            <DrawerContent>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      )

      expect(screen.getByText('Title')).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads additional props on content', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent data-testid="custom-content" aria-label="Custom label">
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-testid="custom-content"]')
      expect(content).toHaveAttribute('aria-label', 'Custom label')
    })

    it('spreads additional props on title', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerTitle data-testid="custom-title">Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const title = container.querySelector('[data-testid="custom-title"]')
      expect(title).toBeInTheDocument()
    })

    it('spreads additional props on trigger', () => {
      render(
        <Drawer open={false}>
          <DrawerTrigger data-testid="trigger-btn">Open</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const trigger = screen.getByTestId('trigger-btn')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('Complete Drawer Workflow', () => {
    it('renders complete drawer with all components', () => {
      render(
        <Drawer open={true} direction="bottom">
          <DrawerTrigger>Open Drawer</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer Title</DrawerTitle>
              <DrawerDescription>This is a drawer</DrawerDescription>
            </DrawerHeader>
            <div>Drawer content</div>
            <DrawerFooter>
              <DrawerClose>Close</DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Drawer Title')).toBeInTheDocument()
      expect(screen.getByText('This is a drawer')).toBeInTheDocument()
      expect(screen.getByText('Drawer content')).toBeInTheDocument()
    })

    it('combines all components in realistic scenario', () => {
      render(
        <Drawer open={true} direction="right">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>
                Configure your preferences
              </DrawerDescription>
            </DrawerHeader>
            <div>Settings content</div>
            <DrawerFooter>
              <button>Cancel</button>
              <button>Save</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )

      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Configure your preferences')).toBeInTheDocument()
      expect(screen.getByText('Settings content')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('has responsive header text alignment', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
            </DrawerHeader>
          </DrawerContent>
        </Drawer>
      )

      const header = container.querySelector('[data-slot="drawer-header"]')
      expect(header).toHaveClass('text-center', 'sm:text-left')
    })

    it('has responsive footer layout', () => {
      const { container } = render(
        <Drawer open={true}>
          <DrawerContent>
            <DrawerFooter>
              <button>Cancel</button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )

      const footer = container.querySelector('[data-slot="drawer-footer"]')
      expect(footer).toHaveClass('flex-col-reverse', 'sm:flex-row', 'sm:justify-end')
    })

    it('side drawer has responsive width on mobile', () => {
      const { container } = render(
        <Drawer open={true} direction="right">
          <DrawerContent>
            <DrawerTitle>Title</DrawerTitle>
          </DrawerContent>
        </Drawer>
      )

      const content = container.querySelector('[data-slot="drawer-content"]')
      expect(content).toHaveClass('data-[vaul-drawer-direction=right]:w-[85vw]', 'data-[vaul-drawer-direction=right]:sm:w-[400px]')
    })
  })
})
