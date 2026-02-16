import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
  CardGlass,
  CardCompact,
  CardPremium,
  CardOrangeAccent,
  CardBlueAccent,
} from './card'

describe('Card Components', () => {
  describe('Base Card Component', () => {
    it('renders card element', () => {
      const { container } = render(<Card>Card content</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Card content')
    })

    it('has correct base styling classes', () => {
      const { container } = render(<Card>Test</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('bg-card', 'text-card-foreground', 'border', 'rounded-xl')
    })

    it('applies hover lift effect', () => {
      const { container } = render(<Card>Hoverable</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('hover:-translate-y-0.5', 'hover:shadow-lg')
    })

    it('applies smooth transitions', () => {
      const { container } = render(<Card>Transition</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('transition-all', 'duration-300')
    })

    it('has shadow styling', () => {
      const { container } = render(<Card>Shadow</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('shadow-md')
    })

    it('accepts custom className', () => {
      const { container } = render(<Card className="custom-class">Custom</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('custom-class')
    })

    it('forwards ref correctly', () => {
      const ref = { current: null }
      const { container } = render(<Card ref={ref}>Ref</Card>)

      expect(ref.current).toBe(container.querySelector('[data-slot="card"]'))
    })

    it('spreads additional props', () => {
      const { container } = render(
        <Card
          data-testid="test-card"
          aria-label="Test card"
          role="region"
        >
          Props
        </Card>
      )
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveAttribute('data-testid', 'test-card')
      expect(card).toHaveAttribute('aria-label', 'Test card')
      expect(card).toHaveAttribute('role', 'region')
    })

    it('has border with reduced opacity', () => {
      const { container } = render(<Card>Border</Card>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('border-border/60')
    })
  })

  describe('CardHeader Sub-component', () => {
    it('renders card header', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header content</CardHeader>
        </Card>
      )
      const header = container.querySelector('[data-slot="card-header"]')

      expect(header).toBeInTheDocument()
      expect(header).toHaveTextContent('Header content')
    })

    it('applies grid layout', () => {
      const { container } = render(
        <Card>
          <CardHeader>Grid</CardHeader>
        </Card>
      )
      const header = container.querySelector('[data-slot="card-header"]')

      expect(header).toHaveClass('grid', '@container/card-header')
    })

    it('accepts custom className', () => {
      const { container } = render(
        <Card>
          <CardHeader className="custom-header">Header</CardHeader>
        </Card>
      )
      const header = container.querySelector('[data-slot="card-header"]')

      expect(header).toHaveClass('custom-header')
    })
  })

  describe('CardTitle Sub-component', () => {
    it('renders card title with correct styling', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title Text</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = container.querySelector('[data-slot="card-title"]')

      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Title Text')
      expect(title).toHaveClass('font-semibold', 'text-base')
    })

    it('has correct color classes', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Color</CardTitle>
          </CardHeader>
        </Card>
      )
      const title = container.querySelector('[data-slot="card-title"]')

      expect(title).toHaveClass('text-foreground')
    })
  })

  describe('CardDescription Sub-component', () => {
    it('renders card description', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = container.querySelector('[data-slot="card-description"]')

      expect(description).toBeInTheDocument()
      expect(description).toHaveTextContent('Description text')
    })

    it('has muted foreground color', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardDescription>Muted</CardDescription>
          </CardHeader>
        </Card>
      )
      const description = container.querySelector('[data-slot="card-description"]')

      expect(description).toHaveClass('text-muted-foreground', 'text-sm')
    })
  })

  describe('CardContent Sub-component', () => {
    it('renders card content', () => {
      const { container } = render(
        <Card>
          <CardContent>Content here</CardContent>
        </Card>
      )
      const content = container.querySelector('[data-slot="card-content"]')

      expect(content).toBeInTheDocument()
      expect(content).toHaveTextContent('Content here')
    })

    it('has padding styling', () => {
      const { container } = render(
        <Card>
          <CardContent>Padding</CardContent>
        </Card>
      )
      const content = container.querySelector('[data-slot="card-content"]')

      expect(content).toHaveClass('px-3')
    })
  })

  describe('CardFooter Sub-component', () => {
    it('renders card footer', () => {
      const { container } = render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      )
      const footer = container.querySelector('[data-slot="card-footer"]')

      expect(footer).toBeInTheDocument()
      expect(footer).toHaveTextContent('Footer content')
    })

    it('uses flex layout', () => {
      const { container } = render(
        <Card>
          <CardFooter>Flex</CardFooter>
        </Card>
      )
      const footer = container.querySelector('[data-slot="card-footer"]')

      expect(footer).toHaveClass('flex', 'items-center')
    })
  })

  describe('CardAction Sub-component', () => {
    it('renders card action element', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardAction>Action button</CardAction>
          </CardHeader>
        </Card>
      )
      const action = container.querySelector('[data-slot="card-action"]')

      expect(action).toBeInTheDocument()
      expect(action).toHaveTextContent('Action button')
    })

    it('positions action in top right', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardAction>Button</CardAction>
          </CardHeader>
        </Card>
      )
      const action = container.querySelector('[data-slot="card-action"]')

      expect(action).toHaveClass('col-start-2', 'row-span-2', 'justify-self-end')
    })
  })

  describe('CardGlass Variant', () => {
    it('renders glass card variant', () => {
      const { container } = render(<CardGlass>Glass</CardGlass>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toBeInTheDocument()
    })

    it('has glass styling', () => {
      const { container } = render(<CardGlass>Glass</CardGlass>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('bg-card', 'rounded-lg')
      expect(card).toHaveClass('shadow-sm')
    })

    it('applies hover effects', () => {
      const { container } = render(<CardGlass>Glass</CardGlass>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('hover:border-border/80')
    })
  })

  describe('CardCompact Variant', () => {
    it('renders compact card variant', () => {
      const { container } = render(<CardCompact>Compact</CardCompact>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toBeInTheDocument()
    })

    it('has compact sizing with padding', () => {
      const { container } = render(<CardCompact>Compact</CardCompact>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('p-3', 'rounded-lg')
    })

    it('has shadow and hover effects', () => {
      const { container } = render(<CardCompact>Compact</CardCompact>)
      const card = container.querySelector('[data-slot="card"]')

      expect(card).toHaveClass('shadow-sm', 'hover:border-border/80')
    })
  })

  describe('CardPremium Variant', () => {
    it('renders premium card variant', () => {
      const { container } = render(<CardPremium>Premium</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Premium')
    })

    it('has gradient background', () => {
      const { container } = render(<CardPremium>Gradient</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('bg-gradient-to-br', 'from-card', 'via-card', 'to-card/95')
    })

    it('has shadow and elevation', () => {
      const { container } = render(<CardPremium>Shadow</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('shadow-lg', 'shadow-black/20')
    })

    it('applies Blue Skies hover effects', () => {
      const { container } = render(<CardPremium>Hover</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('hover:shadow-[#41B2E3]/10', 'hover:border-[#41B2E3]/40')
    })

    it('applies hover lift effect', () => {
      const { container } = render(<CardPremium>Lift</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('hover:-translate-y-0.5')
    })

    it('has overflow hidden for pseudo-elements', () => {
      const { container } = render(<CardPremium>Overflow</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('overflow-hidden')
    })

    it('has smooth transitions', () => {
      const { container } = render(<CardPremium>Transition</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('transition-all', 'duration-300', 'ease-out')
    })
  })

  describe('CardOrangeAccent Variant', () => {
    it('renders orange accent card', () => {
      const { container } = render(<CardOrangeAccent>Orange</CardOrangeAccent>)
      const card = container.querySelector('[data-slot="card-orange-accent"]')

      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Orange')
    })

    it('has orange accent styling and shadows', () => {
      const { container } = render(<CardOrangeAccent>Orange</CardOrangeAccent>)
      const card = container.querySelector('[data-slot="card-orange-accent"]')

      // Check for the key styling indicators of orange accent
      expect(card).toHaveClass('rounded-xl', 'p-4', 'shadow-md')
      // The orange shadow tint should be present
      expect(card?.className).toContain('[#FF6B35]')
    })

    it('has orange shadow glow', () => {
      const { container } = render(<CardOrangeAccent>Glow</CardOrangeAccent>)
      const card = container.querySelector('[data-slot="card-orange-accent"]')

      // Check for shadow styling
      expect(card).toHaveClass('shadow-md')
    })

    it('applies hover lift effect', () => {
      const { container } = render(<CardOrangeAccent>Hover</CardOrangeAccent>)
      const card = container.querySelector('[data-slot="card-orange-accent"]')

      expect(card).toHaveClass('hover:-translate-y-0.5', 'hover:shadow-lg')
    })

    it('has smooth transitions', () => {
      const { container } = render(<CardOrangeAccent>Transition</CardOrangeAccent>)
      const card = container.querySelector('[data-slot="card-orange-accent"]')

      expect(card).toHaveClass('transition-all', 'duration-300')
    })
  })

  describe('CardBlueAccent Variant', () => {
    it('renders blue accent card', () => {
      const { container } = render(<CardBlueAccent>Blue</CardBlueAccent>)
      const card = container.querySelector('[data-slot="card-blue-accent"]')

      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('Blue')
    })

    it('has blue accent styling and shadows', () => {
      const { container } = render(<CardBlueAccent>Blue</CardBlueAccent>)
      const card = container.querySelector('[data-slot="card-blue-accent"]')

      // Check for the key styling indicators of blue accent
      expect(card).toHaveClass('rounded-xl', 'p-4', 'shadow-md')
      // The blue shadow tint should be present
      expect(card?.className).toContain('[#41B2E3]')
    })

    it('has blue shadow glow', () => {
      const { container } = render(<CardBlueAccent>Glow</CardBlueAccent>)
      const card = container.querySelector('[data-slot="card-blue-accent"]')

      // Check for shadow styling
      expect(card).toHaveClass('shadow-md')
    })

    it('applies hover lift effect', () => {
      const { container } = render(<CardBlueAccent>Hover</CardBlueAccent>)
      const card = container.querySelector('[data-slot="card-blue-accent"]')

      expect(card).toHaveClass('hover:-translate-y-0.5', 'hover:shadow-lg')
    })

    it('has smooth transitions', () => {
      const { container } = render(<CardBlueAccent>Transition</CardBlueAccent>)
      const card = container.querySelector('[data-slot="card-blue-accent"]')

      expect(card).toHaveClass('transition-all', 'duration-300')
    })
  })

  describe('Card Composition', () => {
    it('renders complete card structure', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      )

      const card = container.querySelector('[data-slot="card"]')
      const header = container.querySelector('[data-slot="card-header"]')
      const title = container.querySelector('[data-slot="card-title"]')
      const description = container.querySelector('[data-slot="card-description"]')
      const content = container.querySelector('[data-slot="card-content"]')
      const footer = container.querySelector('[data-slot="card-footer"]')

      expect(card).toBeInTheDocument()
      expect(header).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(content).toBeInTheDocument()
      expect(footer).toBeInTheDocument()
    })

    it('maintains proper visual hierarchy', () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Subtitle</CardDescription>
          </CardHeader>
        </Card>
      )

      const title = container.querySelector('[data-slot="card-title"]')
      const description = container.querySelector('[data-slot="card-description"]')

      expect(title).toHaveClass('text-base', 'font-semibold')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('Visual Enhancement Features', () => {
    it('supports brand color accents with colored shadows', () => {
      const { container: orangeContainer } = render(<CardOrangeAccent>Orange</CardOrangeAccent>)
      const { container: blueContainer } = render(<CardBlueAccent>Blue</CardBlueAccent>)

      const orangeCard = orangeContainer.querySelector('[data-slot="card-orange-accent"]')
      const blueCard = blueContainer.querySelector('[data-slot="card-blue-accent"]')

      // Both accent variants should have their respective brand colors in shadows
      expect(orangeCard?.className).toContain('[#FF6B35]')
      expect(blueCard?.className).toContain('[#41B2E3]')

      // Both should have rounded and padded styling
      expect(orangeCard).toHaveClass('rounded-xl', 'p-4')
      expect(blueCard).toHaveClass('rounded-xl', 'p-4')
    })

    it('premium variant has enhanced depth with gradients', () => {
      const { container } = render(<CardPremium>Premium Depth</CardPremium>)
      const card = container.querySelector('[data-slot="card-premium"]')

      expect(card).toHaveClass('bg-gradient-to-br')
      expect(card).toHaveClass('shadow-lg')
      expect(card).toHaveClass('relative')
    })

    it('all card variants render with proper styling', () => {
      const variants = [
        <Card>Base</Card>,
        <CardGlass>Glass</CardGlass>,
        <CardCompact>Compact</CardCompact>,
        <CardPremium>Premium</CardPremium>,
        <CardOrangeAccent>Orange</CardOrangeAccent>,
        <CardBlueAccent>Blue</CardBlueAccent>,
      ]

      variants.forEach((variant) => {
        const { container } = render(variant)
        const card = container.querySelector('[data-slot*="card"]')
        // All variants should have some form of hover shadow effect
        expect(card?.className).toContain('hover')
      })
    })
  })
})
