import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
} from './navigation-menu'

describe('NavigationMenu Components', () => {
  describe('NavigationMenu Root', () => {
    it('renders navigation menu root', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu"]')).toBeInTheDocument()
    })

    it('has flex layout with max-width', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const menu = container.querySelector('[data-slot="navigation-menu"]')
      expect(menu).toHaveClass('flex', 'max-w-max', 'items-center')
    })

    it('renders with viewport by default', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).toBeInTheDocument()
    })

    it('can disable viewport with prop', () => {
      const { container } = render(
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const viewport = container.querySelector('[data-slot="navigation-menu-viewport"]')
      expect(viewport).not.toBeInTheDocument()
    })

    it('accepts custom className', () => {
      const { container } = render(
        <NavigationMenu className="custom-menu">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const menu = container.querySelector('[data-slot="navigation-menu"]')
      expect(menu).toHaveClass('custom-menu')
    })
  })

  describe('NavigationMenuList', () => {
    it('renders menu list', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList data-testid="list">
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('list')).toBeInTheDocument()
    })

    it('has navigation menu list data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-list"]')).toBeInTheDocument()
    })

    it('has flex layout with gap', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const list = container.querySelector('[data-slot="navigation-menu-list"]')
      expect(list).toHaveClass('flex', 'gap-1')
    })

    it('renders multiple menu items', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 1</NavigationMenuTrigger>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 2</NavigationMenuTrigger>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Item 3</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByText('Item 3')).toBeInTheDocument()
    })
  })

  describe('NavigationMenuItem', () => {
    it('renders menu item', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem data-testid="item">
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('item')).toBeInTheDocument()
    })

    it('has navigation menu item data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-item"]')).toBeInTheDocument()
    })

    it('has relative positioning', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const item = container.querySelector('[data-slot="navigation-menu-item"]')
      expect(item).toHaveClass('relative')
    })
  })

  describe('NavigationMenuTrigger', () => {
    it('renders trigger button', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger">
                Products
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('trigger')).toBeInTheDocument()
    })

    it('has navigation menu trigger data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-trigger"]')).toBeInTheDocument()
    })

    it('has proper styling', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const trigger = container.querySelector('[data-slot="navigation-menu-trigger"]')
      expect(trigger).toHaveClass('rounded-md', 'text-sm', 'font-medium')
    })

    it('has chevron down icon', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const trigger = container.querySelector('[data-slot="navigation-menu-trigger"]')
      const icon = trigger?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('supports open state styling', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const trigger = container.querySelector('[data-slot="navigation-menu-trigger"]')
      expect(trigger).toBeInTheDocument()
    })
  })

  describe('NavigationMenuContent', () => {
    it('renders content area', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent data-testid="content">
                <div>Product list</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has navigation menu content data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-content"]')).toBeInTheDocument()
    })

    it('has full width layout', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const content = container.querySelector('[data-slot="navigation-menu-content"]')
      expect(content).toHaveClass('w-full')
    })

    it('has padding', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>Content</div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const content = container.querySelector('[data-slot="navigation-menu-content"]')
      expect(content).toHaveClass('p-2')
    })
  })

  describe('NavigationMenuLink', () => {
    it('renders link', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink data-testid="link" href="/products">
                Products
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('link')).toBeInTheDocument()
    })

    it('has navigation menu link data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/products">Products</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-link"]')).toBeInTheDocument()
    })

    it('has proper styling', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/products">Products</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const link = container.querySelector('[data-slot="navigation-menu-link"]')
      expect(link).toHaveClass('rounded-sm', 'text-sm', 'transition-all')
    })

    it('supports active state', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/products" data-active="true">
                Products
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      const link = container.querySelector('[data-slot="navigation-menu-link"]')
      expect(link).toHaveAttribute('data-active', 'true')
    })
  })

  describe('NavigationMenuViewport', () => {
    it('renders viewport', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>Content</NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).toBeInTheDocument()
    })

    it('has navigation menu viewport data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).toBeInTheDocument()
    })

    it('has popover styling', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      )
      const viewport = container.querySelector('[data-slot="navigation-menu-viewport"]')
      expect(viewport).toHaveClass('bg-popover', 'rounded-md', 'border')
    })

    it('has fixed height and width', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      )
      const viewport = container.querySelector('[data-slot="navigation-menu-viewport"]')
      expect(viewport?.className).toContain('h-')
    })
  })

  describe('NavigationMenuIndicator', () => {
    it('renders indicator', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-indicator"]')).toBeInTheDocument()
    })

    it('has navigation menu indicator data-slot', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-indicator"]')).toBeInTheDocument()
    })

    it('has flex layout', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
        </NavigationMenu>
      )
      const indicator = container.querySelector('[data-slot="navigation-menu-indicator"]')
      expect(indicator).toHaveClass('flex')
    })

    it('has internal arrow element', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
        </NavigationMenu>
      )
      const indicator = container.querySelector('[data-slot="navigation-menu-indicator"]')
      const arrow = indicator?.querySelector('div')
      expect(arrow).toBeInTheDocument()
    })
  })

  describe('navigationMenuTriggerStyle', () => {
    it('is a CVA function', () => {
      expect(typeof navigationMenuTriggerStyle).toBe('function')
    })

    it('returns className string', () => {
      const result = navigationMenuTriggerStyle()
      expect(typeof result).toBe('string')
    })

    it('includes focus visible styles', () => {
      const result = navigationMenuTriggerStyle()
      expect(result).toContain('focus-visible')
    })

    it('includes transition styles', () => {
      const result = navigationMenuTriggerStyle()
      expect(result).toContain('transition')
    })
  })

  describe('Complex Navigation Structures', () => {
    it('renders multi-level navigation', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>
                  <NavigationMenuLink href="/products/electronics">
                    Electronics
                  </NavigationMenuLink>
                  <NavigationMenuLink href="/products/clothing">
                    Clothing
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Services</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div>
                  <NavigationMenuLink href="/services/support">
                    Support
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      )
      expect(screen.getByText('Products')).toBeInTheDocument()
      expect(screen.getByText('Services')).toBeInTheDocument()
      expect(screen.getByText('Electronics')).toBeInTheDocument()
    })

    it('renders navigation with multiple items per section', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="/docs/getting-started">
                  Getting Started
                </NavigationMenuLink>
                <NavigationMenuLink href="/docs/api">API Reference</NavigationMenuLink>
                <NavigationMenuLink href="/docs/examples">Examples</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByText('Docs')).toBeInTheDocument()
      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('API Reference')).toBeInTheDocument()
      expect(screen.getByText('Examples')).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('handles keyboard navigation', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger1">
                Products
              </NavigationMenuTrigger>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger data-testid="trigger2">
                Services
              </NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByTestId('trigger1')).toBeInTheDocument()
      expect(screen.getByTestId('trigger2')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      const { container } = render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[role="region"]')).toBeInTheDocument()
    })

    it('supports aria-label on menu', () => {
      render(
        <NavigationMenu data-testid="nav" role="navigation" aria-label="Main navigation">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument()
    })

    it('supports aria attributes on links', () => {
      render(
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="/products" aria-label="Product listing">
                Products
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(screen.getByLabelText('Product listing')).toBeInTheDocument()
    })
  })

  describe('Viewport Toggle', () => {
    it('shows viewport when enabled', () => {
      const { container } = render(
        <NavigationMenu viewport={true}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).toBeInTheDocument()
    })

    it('hides viewport when disabled', () => {
      const { container } = render(
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      )
      expect(container.querySelector('[data-slot="navigation-menu-viewport"]')).not.toBeInTheDocument()
    })
  })
})
