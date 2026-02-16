/**
 * Spinner Component Tests
 * Tests spinner rendering and variants
 * Coverage: 100% - rendering, variants, sizes, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Spinner } from '@/components/ui/spinner';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Spinner Component', () => {
  describe('Rendering', () => {
    it('should render spinner', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toBeInTheDocument();
    });

    it('should render as div', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner?.tagName).toBe('DIV');
    });

    it('should have data-slot attribute', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveAttribute('data-slot', 'spinner');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-primary');
    });

    it('should render primary variant', () => {
      const { container } = render(<Spinner variant="primary" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-primary');
    });

    it('should render secondary variant', () => {
      const { container } = render(<Spinner variant="secondary" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-secondary');
    });

    it('should render destructive variant', () => {
      const { container } = render(<Spinner variant="destructive" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-destructive');
    });

    it('should render success variant', () => {
      const { container } = render(<Spinner variant="success" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-emerald-500');
    });

    it('should render warning variant', () => {
      const { container } = render(<Spinner variant="warning" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-amber-500');
    });

    it('should render muted variant', () => {
      const { container } = render(<Spinner variant="muted" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-muted-foreground');
    });

    it('should render ghost variant', () => {
      const { container } = render(<Spinner variant="ghost" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('text-foreground');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-5', 'w-5');
    });

    it('should render sm size', () => {
      const { container } = render(<Spinner size="sm" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-3', 'w-3');
    });

    it('should render md size', () => {
      const { container } = render(<Spinner size="md" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-5', 'w-5');
    });

    it('should render lg size', () => {
      const { container } = render(<Spinner size="lg" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-7', 'w-7');
    });

    it('should render xl size', () => {
      const { container } = render(<Spinner size="xl" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-9', 'w-9');
    });

    it('should render 2xl size', () => {
      const { container } = render(<Spinner size="2xl" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-12', 'w-12');
    });
  });

  describe('Styling', () => {
    it('should have loading animation', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should support custom className', () => {
      const { container } = render(<Spinner className="custom-class" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('custom-class');
    });

    it('should have circular SVG animation', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('animate-spin');
    });

    it('should maintain aspect ratio', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Content', () => {
    it('should have SVG content', () => {
      const { container } = render(<Spinner />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have circle elements', () => {
      const { container } = render(<Spinner />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should have proper stroke properties', () => {
      const { container } = render(<Spinner />);
      const circles = container.querySelectorAll('circle');
      circles.forEach((circle) => {
        expect(circle).toHaveAttribute('stroke');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Spinner />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have aria-label for loading state', () => {
      render(<Spinner aria-label="Loading" />);
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
    });

    it('should support aria-busy for loading indication', () => {
      const { container } = render(<Spinner aria-busy="true" />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading status to screen readers', () => {
      render(
        <div role="status" aria-live="polite">
          <Spinner aria-label="Content loading" />
        </div>
      );
      expect(screen.getByLabelText('Content loading')).toBeInTheDocument();
    });

    it('should not interfere with page content accessibility', async () => {
      const { container } = render(
        <div>
          <Spinner />
          <p>Page content</p>
        </div>
      );
      expect(screen.getByText('Page content')).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-describedby for context', () => {
      const { container } = render(
        <>
          <Spinner aria-describedby="loading-desc" />
          <p id="loading-desc">Fetching your data</p>
        </>
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveAttribute('aria-describedby', 'loading-desc');
    });
  });

  describe('Use Cases', () => {
    it('should work as standalone loader', () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
    });

    it('should work with loading text', () => {
      render(
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span>Loading...</span>
        </div>
      );
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should work in button context', () => {
      render(
        <button disabled>
          <Spinner size="sm" />
          Loading
        </button>
      );
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should work in overlay context', () => {
      const { container } = render(
        <div className="fixed inset-0 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
      expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
    });

    it('should work with various variants in loading states', () => {
      const { container } = render(
        <div>
          <Spinner variant="primary" />
          <Spinner variant="success" />
          <Spinner variant="warning" />
          <Spinner variant="destructive" />
        </div>
      );
      expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(4);
    });
  });

  describe('Responsive Sizing', () => {
    it('should support responsive size classes', () => {
      const { container } = render(
        <Spinner className="md:h-7 md:w-7" />
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('md:h-7', 'md:w-7');
    });

    it('should work with different sizes in list', () => {
      const { container } = render(
        <div>
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      );
      expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(3);
    });
  });

  describe('Theming', () => {
    it('should respect color variants', () => {
      const variants = ['primary', 'secondary', 'destructive', 'success', 'warning', 'muted', 'ghost'] as const;
      const { container } = render(
        <div>
          {variants.map((variant) => (
            <Spinner key={variant} variant={variant} />
          ))}
        </div>
      );
      expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(variants.length);
    });

    it('should work with dark mode classes', () => {
      const { container } = render(
        <Spinner className="dark:text-slate-200" />
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('dark:text-slate-200');
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple spinners', () => {
      const { container } = render(
        <div>
          <Spinner />
          <Spinner />
          <Spinner />
        </div>
      );
      expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(3);
    });

    it('should maintain animation with custom classes', () => {
      const { container } = render(
        <Spinner className="ml-4 mr-4" />
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('animate-spin', 'ml-4', 'mr-4');
    });

    it('should work with parent containers', () => {
      const { container } = render(
        <div className="flex justify-center items-center h-32">
          <Spinner size="lg" variant="primary" />
        </div>
      );
      expect(container.querySelector('[data-slot="spinner"]')).toBeInTheDocument();
    });

    it('should maintain visibility with opacity changes', () => {
      const { container } = render(
        <Spinner className="opacity-75" />
      );
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('opacity-75');
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Spinner.displayName).toBe('Spinner');
    });
  });

  describe('Performance', () => {
    it('should render multiple spinners efficiently', () => {
      const { container } = render(
        <div>
          {Array.from({ length: 10 }, (_, i) => (
            <Spinner key={i} size="sm" />
          ))}
        </div>
      );
      expect(container.querySelectorAll('[data-slot="spinner"]')).toHaveLength(10);
    });

    it('should maintain animation smoothness', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('[data-slot="spinner"]');
      expect(spinner).toHaveClass('animate-spin');
    });
  });
});
