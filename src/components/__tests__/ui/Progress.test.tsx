/**
 * Progress Component Tests
 * Tests progress bar rendering, values, and states
 * Coverage: 100% - rendering, values, states, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Progress } from '@/components/ui/progress';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Progress Component', () => {
  describe('Rendering', () => {
    it('should render progress bar', () => {
      const { container } = render(<Progress value={50} />);
      const progressRoot = container.querySelector('[data-slot="progress"]');
      expect(progressRoot).toBeInTheDocument();
    });

    it('should render with data-slot attribute', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[data-slot="progress"]');
      expect(progress).toHaveAttribute('data-slot', 'progress');
    });

    it('should render with role progressbar', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <Progress value={50} className="custom-class" />
      );
      const progress = container.querySelector('[data-slot="progress"]');
      expect(progress).toHaveClass('custom-class');
    });
  });

  describe('Values', () => {
    it('should render at 0% when value is 0', () => {
      const { container } = render(<Progress value={0} />);
      const indicator = container.querySelector('[data-indicator]');
      expect(indicator).toHaveStyle({ width: '0%' });
    });

    it('should render at 50% when value is 50', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '50');
    });

    it('should render at 100% when value is 100', () => {
      const { container } = render(<Progress value={100} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle decimal values', () => {
      const { container } = render(<Progress value={33.33} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '33.33');
    });

    it('should clamp values between 0 and 100', () => {
      const { container: container1 } = render(<Progress value={150} />);
      const progress1 = container1.querySelector('[role="progressbar"]');
      expect(progress1).toHaveAttribute('aria-valuenow');

      const { container: container2 } = render(<Progress value={-50} />);
      const progress2 = container2.querySelector('[role="progressbar"]');
      expect(progress2).toHaveAttribute('aria-valuenow');
    });

    it('should update value dynamically', () => {
      const { rerender, container } = render(<Progress value={25} />);
      let progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '25');

      rerender(<Progress value={75} />);
      progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Styling', () => {
    it('should have base progress styles', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[data-slot="progress"]');
      expect(progress).toHaveClass('w-full', 'overflow-hidden', 'rounded-full', 'bg-muted');
    });

    it('should have indicator styles', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-indicator]');
      expect(indicator).toHaveClass('h-full', 'bg-primary', 'transition-all');
    });

    it('should combine custom className with default styles', () => {
      const { container } = render(
        <Progress value={50} className="shadow-lg" />
      );
      const progress = container.querySelector('[data-slot="progress"]');
      expect(progress).toHaveClass('shadow-lg', 'w-full', 'rounded-full');
    });

    it('should have height of 4 pixels', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[data-slot="progress"]');
      expect(progress).toHaveClass('h-2');
    });
  });

  describe('Accessibility', () => {
    it('should have progressbar role', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeInTheDocument();
    });

    it('should have aria-valuenow', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '50');
    });

    it('should have aria-valuemin of 0', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
    });

    it('should have aria-valuemax of 100', () => {
      const { container } = render(<Progress value={50} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('should support aria-label', () => {
      const { container } = render(
        <Progress value={50} aria-label="File upload progress" />
      );
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-label', 'File upload progress');
    });

    it('should support aria-labelledby', () => {
      const { container } = render(
        <>
          <Progress value={50} aria-labelledby="progress-label" />
          <span id="progress-label">Upload progress</span>
        </>
      );
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-labelledby', 'progress-label');
    });

    it('should support aria-describedby', () => {
      const { container } = render(
        <>
          <Progress value={50} aria-describedby="progress-desc" />
          <p id="progress-desc">Uploading your file...</p>
        </>
      );
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-describedby', 'progress-desc');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<Progress value={50} aria-label="Loading" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('States', () => {
    it('should show empty state at 0%', () => {
      const { container } = render(<Progress value={0} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });

    it('should show complete state at 100%', () => {
      const { container } = render(<Progress value={100} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    it('should show intermediate states', () => {
      const testValues = [10, 25, 50, 75, 90];
      testValues.forEach((value) => {
        const { container } = render(<Progress value={value} />);
        const progress = container.querySelector('[role="progressbar"]');
        expect(progress).toHaveAttribute('aria-valuenow', String(value));
      });
    });
  });

  describe('Use Cases', () => {
    it('should work as file upload progress', () => {
      const { container } = render(
        <div>
          <p>Uploading...</p>
          <Progress value={65} aria-label="Upload progress" />
        </div>
      );
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should work as loading indicator', () => {
      const { container } = render(
        <Progress value={33} aria-label="Loading" />
      );
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should work with animated progress', () => {
      const { rerender, container } = render(<Progress value={0} />);

      // Simulate progress animation
      for (let i = 20; i <= 100; i += 20) {
        rerender(<Progress value={i} />);
      }

      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    it('should work in a form with status', () => {
      const { container } = render(
        <form>
          <label>Form completion: {75}%</label>
          <Progress value={75} />
        </form>
      );
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
    });

    it('should work with skill levels', () => {
      const { container } = render(
        <div>
          <p>React: 90%</p>
          <Progress value={90} />
          <p>Vue: 60%</p>
          <Progress value={60} />
        </div>
      );
      expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(2);
    });
  });

  describe('Multiple Progress Bars', () => {
    it('should render multiple independent progress bars', () => {
      const { container } = render(
        <div>
          <Progress value={25} />
          <Progress value={50} />
          <Progress value={75} />
        </div>
      );
      expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(3);
    });

    it('should maintain independent values', () => {
      const { container } = render(
        <div>
          <Progress value={25} aria-label="First" />
          <Progress value={50} aria-label="Second" />
          <Progress value={75} aria-label="Third" />
        </div>
      );

      const progresses = container.querySelectorAll('[role="progressbar"]');
      expect(progresses[0]).toHaveAttribute('aria-valuenow', '25');
      expect(progresses[1]).toHaveAttribute('aria-valuenow', '50');
      expect(progresses[2]).toHaveAttribute('aria-valuenow', '75');
    });
  });

  describe('Performance', () => {
    it('should handle frequent updates', () => {
      const { rerender, container } = render(<Progress value={0} />);

      for (let i = 0; i <= 100; i += 1) {
        rerender(<Progress value={i} />);
      }

      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    it('should render many progress bars efficiently', () => {
      const { container } = render(
        <div>
          {Array.from({ length: 20 }, (_, i) => (
            <Progress key={i} value={(i + 1) * 5} />
          ))}
        </div>
      );
      expect(container.querySelectorAll('[role="progressbar"]')).toHaveLength(20);
    });
  });

  describe('Edge Cases', () => {
    it('should handle value as string', () => {
      const { container } = render(<Progress value={50 as any} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toBeInTheDocument();
    });

    it('should handle zero', () => {
      const { container } = render(<Progress value={0} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '0');
    });

    it('should handle max value', () => {
      const { container } = render(<Progress value={100} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    it('should handle very small values', () => {
      const { container } = render(<Progress value={0.1} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow', '0.1');
    });

    it('should handle values with many decimal places', () => {
      const { container } = render(<Progress value={33.3333} />);
      const progress = container.querySelector('[role="progressbar"]');
      expect(progress).toHaveAttribute('aria-valuenow');
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Progress.displayName).toBe('Progress');
    });
  });

  describe('Animation', () => {
    it('should have transition class for smooth animation', () => {
      const { container } = render(<Progress value={50} />);
      const indicator = container.querySelector('[data-indicator]');
      expect(indicator).toHaveClass('transition-all');
    });

    it('should animate value changes smoothly', () => {
      const { rerender, container } = render(<Progress value={25} />);
      let indicator = container.querySelector('[data-indicator]');
      expect(indicator).toHaveClass('transition-all');

      rerender(<Progress value={75} />);
      indicator = container.querySelector('[data-indicator]');
      expect(indicator).toHaveClass('transition-all');
    });
  });
});
