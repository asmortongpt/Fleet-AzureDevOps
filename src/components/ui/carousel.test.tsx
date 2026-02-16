import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from './carousel'

describe('Carousel Components', () => {
  describe('Carousel Root', () => {
    it('renders carousel', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })

    it('has carousel data-slot', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })

    it('has region role', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      expect(carousel).toHaveAttribute('role', 'region')
    })

    it('has roledescription carousel', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
    })

    it('supports horizontal orientation', () => {
      const { container } = render(
        <Carousel orientation="horizontal">
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })

    it('supports vertical orientation', () => {
      const { container } = render(
        <Carousel orientation="vertical">
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })

    it('accepts setApi callback', () => {
      const setApi = vi.fn()
      const { container } = render(
        <Carousel setApi={setApi}>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })
  })

  describe('CarouselContent', () => {
    it('renders carousel content', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent data-testid="content">
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('has carousel content data-slot', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel-content"]')).toBeInTheDocument()
    })

    it('has overflow hidden', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const content = container.querySelector('[data-slot="carousel-content"]')
      expect(content).toHaveClass('overflow-hidden')
    })

    it('renders multiple carousel items', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
            <CarouselItem>Slide 3</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByText('Slide 1')).toBeInTheDocument()
      expect(screen.getByText('Slide 2')).toBeInTheDocument()
      expect(screen.getByText('Slide 3')).toBeInTheDocument()
    })
  })

  describe('CarouselItem', () => {
    it('renders carousel item', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem data-testid="item">Content</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByTestId('item')).toBeInTheDocument()
    })

    it('has carousel item data-slot', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Content</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel-item"]')).toBeInTheDocument()
    })

    it('has group role', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Content</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const item = container.querySelector('[data-slot="carousel-item"]')
      expect(item).toHaveAttribute('role', 'group')
    })

    it('has slide roledescription', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Content</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const item = container.querySelector('[data-slot="carousel-item"]')
      expect(item).toHaveAttribute('aria-roledescription', 'slide')
    })

    it('has full basis size', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Content</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const item = container.querySelector('[data-slot="carousel-item"]')
      expect(item).toHaveClass('basis-full')
    })

    it('supports child content', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <div>Slide content</div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByText('Slide content')).toBeInTheDocument()
    })
  })

  describe('CarouselPrevious', () => {
    it('renders previous button', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
          <CarouselPrevious data-testid="prev-btn" />
        </Carousel>
      )
      expect(screen.getByTestId('prev-btn')).toBeInTheDocument()
    })

    it('has carousel previous data-slot', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel-previous"]')).toBeInTheDocument()
    })

    it('has sr-only text', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      )
      expect(container.querySelector('[class*="sr-only"]')).toBeInTheDocument()
    })

    it('shows left arrow icon', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      )
      const button = container.querySelector('[data-slot="carousel-previous"]')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('has outline variant by default', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      )
      const button = container.querySelector('[data-slot="carousel-previous"]')
      expect(button?.className).toContain('outline')
    })

    it('has icon size', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
        </Carousel>
      )
      const button = container.querySelector('[data-slot="carousel-previous"]')
      expect(button).toHaveClass('size-8')
    })
  })

  describe('CarouselNext', () => {
    it('renders next button', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
          <CarouselNext data-testid="next-btn" />
        </Carousel>
      )
      expect(screen.getByTestId('next-btn')).toBeInTheDocument()
    })

    it('has carousel next data-slot', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel-next"]')).toBeInTheDocument()
    })

    it('shows right arrow icon', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
          <CarouselNext />
        </Carousel>
      )
      const button = container.querySelector('[data-slot="carousel-next"]')
      const icon = button?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('handles arrow left key', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      fireEvent.keyDown(carousel!, { key: 'ArrowLeft' })
      expect(carousel).toBeInTheDocument()
    })

    it('handles arrow right key', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      fireEvent.keyDown(carousel!, { key: 'ArrowRight' })
      expect(carousel).toBeInTheDocument()
    })
  })

  describe('Multiple Slides', () => {
    it('renders many carousel items', () => {
      render(
        <Carousel>
          <CarouselContent>
            {Array.from({ length: 10 }).map((_, i) => (
              <CarouselItem key={i}>Slide {i + 1}</CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByText('Slide 1')).toBeInTheDocument()
      expect(screen.getByText('Slide 10')).toBeInTheDocument()
    })

    it('renders carousel with controls', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
            <CarouselItem>Slide 3</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel-previous"]')).toBeInTheDocument()
      expect(container.querySelector('[data-slot="carousel-next"]')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has semantic carousel structure', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      expect(carousel).toHaveAttribute('role', 'region')
      expect(carousel).toHaveAttribute('aria-roledescription', 'carousel')
    })

    it('marks items with slide role', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const item = container.querySelector('[data-slot="carousel-item"]')
      expect(item).toHaveAttribute('role', 'group')
      expect(item).toHaveAttribute('aria-roledescription', 'slide')
    })

    it('provides navigation labels', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
            <CarouselItem>Slide 2</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )
      expect(screen.getByText('Previous slide')).toBeInTheDocument()
      expect(screen.getByText('Next slide')).toBeInTheDocument()
    })
  })

  describe('Custom Content', () => {
    it('renders complex slide content', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <div className="slide">
                <img alt="slide" />
                <p>Caption</p>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByText('Caption')).toBeInTheDocument()
    })

    it('renders slide with button', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>
              <button>Click me</button>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })
  })

  describe('Responsiveness', () => {
    it('supports responsive className', () => {
      const { container } = render(
        <Carousel className="md:gap-4">
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      const carousel = container.querySelector('[data-slot="carousel"]')
      expect(carousel?.className).toContain('md:gap-4')
    })
  })

  describe('Edge Cases', () => {
    it('handles single slide', () => {
      render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Only slide</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )
      expect(screen.getByText('Only slide')).toBeInTheDocument()
    })

    it('handles empty carousel', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent />
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })

    it('renders without navigation buttons', () => {
      const { container } = render(
        <Carousel>
          <CarouselContent>
            <CarouselItem>Slide</CarouselItem>
          </CarouselContent>
        </Carousel>
      )
      expect(container.querySelector('[data-slot="carousel"]')).toBeInTheDocument()
    })
  })
})
