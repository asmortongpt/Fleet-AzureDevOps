import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AspectRatio } from './aspect-ratio'

describe('AspectRatio Component', () => {
  describe('Rendering & Basic Structure', () => {
    it('renders aspect ratio with data-slot attribute', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="image.jpg" alt="test" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('renders with children content', () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3}>
          <div className="test-child">Content</div>
        </AspectRatio>
      )
      const child = container.querySelector('.test-child')
      expect(child).toBeInTheDocument()
      expect(child?.textContent).toBe('Content')
    })

    it('renders with default ratio', () => {
      const { container } = render(
        <AspectRatio>
          <div>Content</div>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })
  })

  describe('Aspect Ratio - Standard Ratios', () => {
    it('renders with 16:9 aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="video.jpg" alt="video" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('renders with 4:3 aspect ratio', () => {
      const { container } = render(
        <AspectRatio ratio={4 / 3}>
          <img src="image.jpg" alt="image" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('renders with 1:1 square ratio', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <img src="square.jpg" alt="square" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('renders with 21:9 cinema ratio', () => {
      const { container } = render(
        <AspectRatio ratio={21 / 9}>
          <video>Cinema content</video>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })
  })

  describe('Props Spreading', () => {
    it('spreads HTML attributes', () => {
      const { container } = render(
        <AspectRatio
          data-testid="aspect-ratio"
          id="ar-1"
          className="custom-aspect-ratio"
          ratio={16 / 9}
        >
          <img src="test.jpg" alt="test" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-testid="aspect-ratio"]')
      expect(aspectRatio).toHaveAttribute('id', 'ar-1')
      expect(aspectRatio).toHaveClass('custom-aspect-ratio')
    })

    it('accepts style prop', () => {
      const { container } = render(
        <AspectRatio
          ratio={1}
          style={{ maxWidth: '400px' }}
        >
          <div>Content</div>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toHaveStyle('maxWidth: 400px')
    })
  })

  describe('Content Types', () => {
    it('works with image elements', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="photo.jpg" alt="photo" />
        </AspectRatio>
      )
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'photo.jpg')
      expect(img).toHaveAttribute('alt', 'photo')
    })

    it('works with video elements', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <video src="video.mp4" />
        </AspectRatio>
      )
      const video = container.querySelector('video')
      expect(video).toBeInTheDocument()
    })

    it('works with div content', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div className="content">
            <h2>Title</h2>
            <p>Description</p>
          </div>
        </AspectRatio>
      )
      const content = container.querySelector('.content')
      expect(content).toBeInTheDocument()
      expect(content?.querySelector('h2')).toBeInTheDocument()
    })

    it('works with canvas element', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <canvas />
        </AspectRatio>
      )
      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('works with iframe', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <iframe src="https://example.com" />
        </AspectRatio>
      )
      const iframe = container.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
    })

    it('works with multiple children', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="bg.jpg" alt="background" />
          <div className="overlay">Overlay</div>
        </AspectRatio>
      )
      const img = container.querySelector('img')
      const overlay = container.querySelector('.overlay')
      expect(img).toBeInTheDocument()
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('preserves alt text on images', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <img src="photo.jpg" alt="Scenic mountain view" />
        </AspectRatio>
      )
      const img = container.querySelector('img')
      expect(img).toHaveAttribute('alt', 'Scenic mountain view')
    })

    it('preserves aria attributes on content', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div aria-label="Interactive content" role="application">
            Content
          </div>
        </AspectRatio>
      )
      const content = container.querySelector('[role="application"]')
      expect(content).toHaveAttribute('aria-label', 'Interactive content')
    })
  })

  describe('Responsive Behavior', () => {
    it('responds to container width changes', () => {
      const { container, rerender } = render(
        <div style={{ width: '400px' }}>
          <AspectRatio ratio={16 / 9}>
            <img src="image.jpg" alt="image" />
          </AspectRatio>
        </div>
      )
      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()

      rerender(
        <div style={{ width: '800px' }}>
          <AspectRatio ratio={16 / 9}>
            <img src="image.jpg" alt="image" />
          </AspectRatio>
        </div>
      )
      const updatedImg = container.querySelector('img')
      expect(updatedImg).toBeInTheDocument()
    })

    it('maintains aspect ratio when width changes', () => {
      const { container } = render(
        <AspectRatio ratio={1}>
          <div />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })
  })

  describe('Common Use Cases', () => {
    it('works for thumbnail grid layout', () => {
      const { container } = render(
        <div className="grid grid-cols-3 gap-4">
          <AspectRatio ratio={1}>
            <img src="thumb1.jpg" alt="thumbnail 1" />
          </AspectRatio>
          <AspectRatio ratio={1}>
            <img src="thumb2.jpg" alt="thumbnail 2" />
          </AspectRatio>
          <AspectRatio ratio={1}>
            <img src="thumb3.jpg" alt="thumbnail 3" />
          </AspectRatio>
        </div>
      )
      const images = container.querySelectorAll('img')
      expect(images).toHaveLength(3)
    })

    it('works for video embed wrapper', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9}>
          <iframe src="https://youtube.com/embed/video" />
        </AspectRatio>
      )
      const iframe = container.querySelector('iframe')
      expect(iframe).toHaveAttribute('src', 'https://youtube.com/embed/video')
    })

    it('works for image gallery with different ratios', () => {
      const { container } = render(
        <div>
          <AspectRatio ratio={16 / 9}>
            <img src="wide.jpg" alt="wide" />
          </AspectRatio>
          <AspectRatio ratio={1}>
            <img src="square.jpg" alt="square" />
          </AspectRatio>
          <AspectRatio ratio={9 / 16}>
            <img src="tall.jpg" alt="tall" />
          </AspectRatio>
        </div>
      )
      const images = container.querySelectorAll('img')
      expect(images).toHaveLength(3)
      expect(images[0]).toHaveAttribute('alt', 'wide')
      expect(images[1]).toHaveAttribute('alt', 'square')
      expect(images[2]).toHaveAttribute('alt', 'tall')
    })
  })

  describe('Styling with Custom Classes', () => {
    it('accepts className prop', () => {
      const { container } = render(
        <AspectRatio ratio={16 / 9} className="bg-gray-200 rounded-lg overflow-hidden">
          <img src="image.jpg" alt="image" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toHaveClass('bg-gray-200', 'rounded-lg', 'overflow-hidden')
    })

    it('combines data-slot with custom classes', () => {
      const { container } = render(
        <AspectRatio ratio={1} className="border-2 border-blue-500">
          <div>Content</div>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toHaveClass('border-2', 'border-blue-500')
      expect(aspectRatio?.getAttribute('data-slot')).toBe('aspect-ratio')
    })
  })

  describe('Edge Cases', () => {
    it('handles very small ratio', () => {
      const { container } = render(
        <AspectRatio ratio={0.1}>
          <div>Very wide</div>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('handles very large ratio', () => {
      const { container } = render(
        <AspectRatio ratio={100}>
          <div>Very tall</div>
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })

    it('handles no ratio prop (uses default)', () => {
      const { container } = render(
        <AspectRatio>
          <img src="default.jpg" alt="default ratio" />
        </AspectRatio>
      )
      const aspectRatio = container.querySelector('[data-slot="aspect-ratio"]')
      expect(aspectRatio).toBeInTheDocument()
    })
  })
})
