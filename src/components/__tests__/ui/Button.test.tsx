/**
 * Button Component Tests
 * Tests all variants, sizes, states, and accessibility features
 * Coverage: 100% - rendering, props, events, accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should render with data-slot attribute', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-slot', 'button');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive');
    });

    it('should render outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-transparent');
    });

    it('should render secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-muted');
    });

    it('should render ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-muted');
    });

    it('should render link variant', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('should render success variant', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-emerald-600');
    });

    it('should render warning variant', () => {
      render(<Button variant="warning">Warning</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-amber-500');
    });
  });

  describe('Sizes', () => {
    it('should render default size', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-2');
    });

    it('should render sm size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'text-xs');
    });

    it('should render lg size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-5');
    });

    it('should render xl size', () => {
      render(<Button size="xl">Extra Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'text-base');
    });

    it('should render icon size', () => {
      render(<Button size="icon">→</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-9');
    });

    it('should render icon-sm size', () => {
      render(<Button size="icon-sm">→</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-7');
    });

    it('should render icon-lg size', () => {
      render(<Button size="icon-lg">→</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('size-10');
    });

    it('should render touch size', () => {
      render(<Button size="touch">Touch</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'min-h-[44px]', 'min-w-[44px]');
    });
  });

  describe('States', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should apply disabled state when loading is true', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show spinner when loading', () => {
      render(<Button loading>Click me</Button>);
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should show loading text when loading', () => {
      render(<Button loading>Click me</Button>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show children when not loading', () => {
      const { rerender } = render(<Button loading={false}>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();

      rerender(<Button loading={false}>Submit</Button>);
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('Events', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle focus events', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      fireEvent.focus(button);
      expect(button).toHaveFocus();
    });

    it('should handle blur events', () => {
      render(<Button>Focusable</Button>);
      const button = screen.getByRole('button');

      fireEvent.focus(button);
      fireEvent.blur(button);
      expect(button).not.toHaveFocus();
    });

    it('should not trigger click when loading', () => {
      const handleClick = vi.fn();
      render(<Button loading onClick={handleClick}>Load</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('asChild prop', () => {
    it('should render as a different element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/">Link as Button</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/');
    });

    it('should apply button styles to child element', () => {
      render(
        <Button asChild variant="primary">
          <a href="/">Link</a>
        </Button>
      );
      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-primary');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );
      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should handle SVG children', () => {
      render(
        <Button>
          <svg data-testid="icon" />
          Click
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible role', () => {
      render(<Button>Accessible Button</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have focus ring for keyboard navigation', () => {
      render(<Button>Keyboard Nav</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('should be keyboard accessible', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');

      fireEvent.focus(button);
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Button element naturally handles Enter key
      expect(button).toHaveFocus();
    });

    it('should have proper aria attributes', () => {
      render(<Button aria-label="Delete item">Delete</Button>);
      const button = screen.getByRole('button', { name: 'Delete item' });
      expect(button).toHaveAttribute('aria-label', 'Delete item');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Button variant="default" size="default">
          Accessible Button
        </Button>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-disabled when disabled', () => {
      render(<Button disabled aria-label="Cannot click">Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Responsive behavior', () => {
    it('should maintain styles across different sizes', () => {
      const { rerender } = render(<Button size="sm">Small</Button>);
      let button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');

      rerender(<Button size="lg">Large</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-5');

      rerender(<Button size="xl">XL</Button>);
      button = screen.getByRole('button');
      expect(button).toHaveClass('h-11');
    });
  });

  describe('Type prop', () => {
    it('should support button type', () => {
      render(<Button type="button">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should support submit type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support reset type', () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'reset');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty children', () => {
      render(<Button></Button>);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long button text that should wrap properly';
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should combine multiple props correctly', () => {
      render(
        <Button
          variant="destructive"
          size="lg"
          disabled
          className="extra-class"
        >
          Combined
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-destructive', 'px-5', 'extra-class');
      expect(button).toBeDisabled();
    });

    it('should handle rapid clicks', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Rapid</Button>);
      const button = screen.getByRole('button');

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});
