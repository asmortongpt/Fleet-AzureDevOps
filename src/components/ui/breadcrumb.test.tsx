import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChevronRight } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from './breadcrumb'

describe('Breadcrumb Component', () => {
  describe('Breadcrumb Root - Rendering', () => {
    it('renders breadcrumb with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const breadcrumb = container.querySelector('[data-slot="breadcrumb"]')
      expect(breadcrumb).toBeInTheDocument()
    })

    it('renders as nav HTML element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const nav = container.querySelector('nav')
      expect(nav).toBeInTheDocument()
      expect(nav?.tagName).toBe('NAV')
    })

    it('renders with aria-label for accessibility', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb trail')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Breadcrumb className="custom-breadcrumb">
          <BreadcrumbList />
        </Breadcrumb>
      )
      const breadcrumb = container.querySelector('[data-slot="breadcrumb"]')
      expect(breadcrumb).toHaveClass('custom-breadcrumb')
    })
  })

  describe('BreadcrumbList - Rendering', () => {
    it('renders breadcrumb list with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toBeInTheDocument()
    })

    it('renders as ol HTML element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const ol = container.querySelector('ol')
      expect(ol).toBeInTheDocument()
      expect(ol?.tagName).toBe('OL')
    })

    it('applies list styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('flex', 'flex-wrap', 'items-center')
    })

    it('applies responsive gap styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('gap-1.5', 'sm:gap-2.5')
    })

    it('applies text styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('applies word break styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('break-words')
    })
  })

  describe('BreadcrumbItem - Rendering', () => {
    it('renders breadcrumb item with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const item = container.querySelector('[data-slot="breadcrumb-item"]')
      expect(item).toBeInTheDocument()
    })

    it('renders as li HTML element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const li = container.querySelector('li')
      expect(li).toBeInTheDocument()
      expect(li?.tagName).toBe('LI')
    })

    it('applies flexbox styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const item = container.querySelector('[data-slot="breadcrumb-item"]')
      expect(item).toHaveClass('inline-flex', 'items-center', 'gap-1.5')
    })
  })

  describe('BreadcrumbLink - Rendering', () => {
    it('renders breadcrumb link with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const link = container.querySelector('[data-slot="breadcrumb-link"]')
      expect(link).toBeInTheDocument()
    })

    it('renders as anchor element by default', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })

    it('renders link text content', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Home')).toBeInTheDocument()
    })

    it('applies hover styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const link = container.querySelector('[data-slot="breadcrumb-link"]')
      expect(link).toHaveClass('hover:text-foreground', 'transition-colors')
    })

    it('supports custom className on link', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="custom-link">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const link = container.querySelector('[data-slot="breadcrumb-link"]')
      expect(link).toHaveClass('custom-link')
    })
  })

  describe('BreadcrumbPage - Rendering', () => {
    it('renders breadcrumb page with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toBeInTheDocument()
    })

    it('renders as span element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const span = container.querySelector('span[data-slot="breadcrumb-page"]')
      expect(span).toBeInTheDocument()
      expect(span?.tagName).toBe('SPAN')
    })

    it('renders page text content', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Products</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('has role="link" for semantics', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toHaveAttribute('role', 'link')
    })

    it('has aria-disabled="true"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toHaveAttribute('aria-disabled', 'true')
    })

    it('has aria-current="page"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toHaveAttribute('aria-current', 'page')
    })

    it('applies text styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toHaveClass('text-foreground', 'font-normal')
    })
  })

  describe('BreadcrumbSeparator - Rendering', () => {
    it('renders breadcrumb separator with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separator = container.querySelector('[data-slot="breadcrumb-separator"]')
      expect(separator).toBeInTheDocument()
    })

    it('renders as li element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separators = container.querySelectorAll('li')
      expect(separators.length).toBeGreaterThan(0)
    })

    it('renders default ChevronRight icon', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const svg = container.querySelector('[data-slot="breadcrumb-separator"] svg')
      expect(svg).toBeInTheDocument()
    })

    it('supports custom separator content', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('/')).toBeInTheDocument()
    })

    it('has role="presentation"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separator = container.querySelector('[data-slot="breadcrumb-separator"]')
      expect(separator).toHaveAttribute('role', 'presentation')
    })

    it('has aria-hidden="true"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separator = container.querySelector('[data-slot="breadcrumb-separator"]')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    it('applies SVG sizing styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separator = container.querySelector('[data-slot="breadcrumb-separator"]')
      expect(separator).toHaveClass('[&>svg]:size-3.5')
    })
  })

  describe('BreadcrumbEllipsis - Rendering', () => {
    it('renders breadcrumb ellipsis with data-slot attribute', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(ellipsis).toBeInTheDocument()
    })

    it('renders as span element', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const span = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(span?.tagName).toBe('SPAN')
    })

    it('renders MoreHorizontal icon', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const icon = container.querySelector('[data-slot="breadcrumb-ellipsis"] svg')
      expect(icon).toBeInTheDocument()
    })

    it('has role="presentation"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(ellipsis).toHaveAttribute('role', 'presentation')
    })

    it('has aria-hidden="true"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true')
    })

    it('has screen reader text "More"', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const srText = screen.getByText('More')
      expect(srText).toHaveClass('sr-only')
    })

    it('applies sizing and centering styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(ellipsis).toHaveClass('flex', 'size-9', 'items-center', 'justify-center')
    })
  })

  describe('Complete Breadcrumb Compositions', () => {
    it('renders simple breadcrumb path', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('renders multi-level breadcrumb', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs/api">API</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Reference</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Docs')).toBeInTheDocument()
      expect(screen.getByText('API')).toBeInTheDocument()
      expect(screen.getByText('Reference')).toBeInTheDocument()
    })

    it('renders breadcrumb with ellipsis', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbEllipsis />
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('More')).toBeInTheDocument()
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('renders breadcrumb with custom separator', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Products</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('/')).toBeInTheDocument()
      expect(screen.getByText('Products')).toBeInTheDocument()
    })
  })

  describe('Breadcrumb Props Spreading', () => {
    it('spreads HTML attributes on Breadcrumb', () => {
      const { container } = render(
        <Breadcrumb data-testid="main-breadcrumb" id="breadcrumb-1">
          <BreadcrumbList />
        </Breadcrumb>
      )
      const breadcrumb = container.querySelector('[data-testid="main-breadcrumb"]')
      expect(breadcrumb).toHaveAttribute('id', 'breadcrumb-1')
    })

    it('spreads HTML attributes on BreadcrumbList', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList data-testid="breadcrumb-list" className="custom-list" />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-testid="breadcrumb-list"]')
      expect(list).toHaveClass('custom-list')
    })

    it('spreads HTML attributes on BreadcrumbItem', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem data-testid="item-1" id="item-1">
              Home
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const item = container.querySelector('[data-testid="item-1"]')
      expect(item).toHaveAttribute('id', 'item-1')
    })

    it('spreads HTML attributes on BreadcrumbLink', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" target="_blank" rel="noopener">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const link = container.querySelector('a')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener')
    })
  })

  describe('Breadcrumb Accessibility', () => {
    it('breadcrumb nav has aria-label', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb trail')
    })

    it('current page has aria-current="page"', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Current</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const page = container.querySelector('[data-slot="breadcrumb-page"]')
      expect(page).toHaveAttribute('aria-current', 'page')
    })

    it('separators are hidden from screen readers', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const separator = container.querySelector('[data-slot="breadcrumb-separator"]')
      expect(separator).toHaveAttribute('aria-hidden', 'true')
    })

    it('ellipsis is hidden from screen readers but labeled', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbEllipsis />
          </BreadcrumbList>
        </Breadcrumb>
      )
      const ellipsis = container.querySelector('[data-slot="breadcrumb-ellipsis"]')
      expect(ellipsis).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByText('More')).toHaveClass('sr-only')
    })

    it('links are navigable and properly formatted', () => {
      render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>About</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const homeLink = screen.getByText('Home').closest('a')
      expect(homeLink).toHaveAttribute('href', '/')
      expect(screen.getByText('About')).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Breadcrumb Styling Variants', () => {
    it('supports custom styling on all components', () => {
      const { container } = render(
        <Breadcrumb className="custom-breadcrumb">
          <BreadcrumbList className="custom-list">
            <BreadcrumbItem className="custom-item">
              <BreadcrumbLink href="/" className="custom-link">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="custom-sep" />
            <BreadcrumbItem>
              <BreadcrumbPage className="custom-page">Page</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )

      expect(container.querySelector('[data-slot="breadcrumb"]')).toHaveClass('custom-breadcrumb')
      expect(container.querySelector('[data-slot="breadcrumb-list"]')).toHaveClass('custom-list')
      expect(container.querySelector('[data-slot="breadcrumb-item"]')).toHaveClass('custom-item')
      expect(container.querySelector('[data-slot="breadcrumb-link"]')).toHaveClass('custom-link')
      expect(container.querySelector('[data-slot="breadcrumb-page"]')).toHaveClass('custom-page')
    })

    it('maintains default styling when no custom className provided', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )

      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('text-muted-foreground', 'text-sm')
    })
  })

  describe('Breadcrumb Responsive Behavior', () => {
    it('applies responsive gap styling', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList />
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('gap-1.5')
      expect(list?.className).toContain('sm:gap-2.5')
    })

    it('supports responsive customization', () => {
      const { container } = render(
        <Breadcrumb>
          <BreadcrumbList className="md:gap-4">
            <BreadcrumbItem>Home</BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )
      const list = container.querySelector('[data-slot="breadcrumb-list"]')
      expect(list).toHaveClass('md:gap-4')
    })
  })
})
