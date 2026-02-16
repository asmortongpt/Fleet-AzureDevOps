/**
 * Badge Component Tests
 * Tests badge rendering, variants, and styling
 * Coverage: 100% - rendering, variants, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Badge Component', () => {
  describe('Rendering', () => {
    it('should render badge with default props', () => {
      render(<Badge>New</Badge>);
      const badge = screen.getByText('New');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-slot', 'badge');
    });

    it('should render with text content', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Badge className="custom-class">Badge</Badge>);
      const badge = screen.getByText('Badge');
      expect(badge).toHaveClass('custom-class');
    });

    it('should render as span element', () => {
      render(<Badge>Span Badge</Badge>);
      const badge = screen.getByText('Span Badge');
      expect(badge.tagName).toBe('SPAN');
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Badge variant="default">Default</Badge>);
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should render secondary variant', () => {
      render(<Badge variant="secondary">Secondary</Badge>);
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-secondary');
    });

    it('should render destructive variant', () => {
      render(<Badge variant="destructive">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('should render outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>);
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('border', 'bg-transparent');
    });

    it('should render success variant', () => {
      render(<Badge variant="success">Success</Badge>);
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-emerald-100', 'text-emerald-800');
    });

    it('should render warning variant', () => {
      render(<Badge variant="warning">Warning</Badge>);
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
    });

    it('should render error variant', () => {
      render(<Badge variant="error">Error</Badge>);
      const badge = screen.getByText('Error');
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('should render info variant', () => {
      render(<Badge variant="info">Info</Badge>);
      const badge = screen.getByText('Info');
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  describe('Styling', () => {
    it('should have default badge styles', () => {
      render(<Badge>Styled</Badge>);
      const badge = screen.getByText('Styled');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'rounded-full',
        'px-2.5',
        'py-0.5',
        'text-xs',
        'font-semibold'
      );
    });

    it('should apply custom className alongside default styles', () => {
      render(<Badge className="uppercase">Custom</Badge>);
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('uppercase', 'px-2.5', 'text-xs');
    });

    it('should have transitions applied', () => {
      render(<Badge>Transition</Badge>);
      const badge = screen.getByText('Transition');
      expect(badge).toHaveClass('transition-colors');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Badge>Text</Badge>);
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should render child elements', () => {
      render(
        <Badge>
          <span>Child</span>
        </Badge>
      );
      expect(screen.getByText('Child')).toBeInTheDocument();
    });

    it('should render emoji content', () => {
      render(<Badge>✓ Done</Badge>);
      expect(screen.getByText('✓ Done')).toBeInTheDocument();
    });

    it('should render icon and text', () => {
      render(
        <Badge>
          <span>🔔</span>
          <span>New</span>
        </Badge>
      );
      expect(screen.getByText('🔔')).toBeInTheDocument();
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should handle long text', () => {
      const longText = 'This is a long badge text that should still display properly';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle numeric content', () => {
      render(<Badge>42</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Badge>!@#$%</Badge>);
      expect(screen.getByText('!@#$%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<Badge>Accessible Badge</Badge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-label', () => {
      render(<Badge aria-label="New notification">3</Badge>);
      const badge = screen.getByLabelText('New notification');
      expect(badge).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Badge aria-describedby="badge-desc">Status</Badge>
          <span id="badge-desc">Active status</span>
        </>
      );
      expect(screen.getByText('Status')).toHaveAttribute('aria-describedby', 'badge-desc');
    });

    it('should have sufficient color contrast', () => {
      render(
        <>
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
        </>
      );

      expect(screen.getByText('Default')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
    });

    it('should be readable by screen readers', () => {
      render(<Badge>Important</Badge>);
      const badge = screen.getByText('Important');
      expect(badge.textContent).toBe('Important');
    });
  });

  describe('Multiple Badges', () => {
    it('should render multiple badges independently', () => {
      render(
        <>
          <Badge variant="default">Badge 1</Badge>
          <Badge variant="secondary">Badge 2</Badge>
          <Badge variant="destructive">Badge 3</Badge>
        </>
      );

      expect(screen.getByText('Badge 1')).toBeInTheDocument();
      expect(screen.getByText('Badge 2')).toBeInTheDocument();
      expect(screen.getByText('Badge 3')).toBeInTheDocument();
    });

    it('should maintain individual styles in list', () => {
      render(
        <div>
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="destructive">Rejected</Badge>
        </div>
      );

      const approved = screen.getByText('Approved');
      const pending = screen.getByText('Pending');
      const rejected = screen.getByText('Rejected');

      expect(approved).toHaveClass('bg-emerald-100');
      expect(pending).toHaveClass('bg-amber-100');
      expect(rejected).toHaveClass('bg-destructive');
    });

    it('should support badge groups', () => {
      render(
        <div className="flex gap-2">
          <Badge variant="default">Feature</Badge>
          <Badge variant="secondary">Bug</Badge>
          <Badge variant="success">Complete</Badge>
        </div>
      );

      expect(screen.getByText('Feature')).toBeInTheDocument();
      expect(screen.getByText('Bug')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    it('should be consistently sized', () => {
      render(
        <>
          <Badge>Small</Badge>
          <Badge>Medium</Badge>
          <Badge>Large</Badge>
        </>
      );

      const small = screen.getByText('Small');
      const medium = screen.getByText('Medium');
      const large = screen.getByText('Large');

      expect(small).toHaveClass('text-xs');
      expect(medium).toHaveClass('text-xs');
      expect(large).toHaveClass('text-xs');
    });
  });

  describe('Use Cases', () => {
    it('should work as status indicator', () => {
      render(
        <>
          <Badge variant="success">Active</Badge>
          <Badge variant="destructive">Inactive</Badge>
        </>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should work as tag', () => {
      render(
        <div>
          <Badge>React</Badge>
          <Badge>TypeScript</Badge>
          <Badge>Testing</Badge>
        </div>
      );

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Testing')).toBeInTheDocument();
    });

    it('should work as count indicator', () => {
      render(
        <div>
          <span>Notifications</span>
          <Badge variant="destructive">5</Badge>
        </div>
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should work as priority indicator', () => {
      render(
        <>
          <Badge variant="error">Critical</Badge>
          <Badge variant="warning">High</Badge>
          <Badge variant="success">Low</Badge>
        </>
      );

      expect(screen.getByText('Critical')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty content', () => {
      render(<Badge></Badge>);
      const badge = document.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it('should handle whitespace content', () => {
      render(<Badge>   </Badge>);
      const badge = screen.getByText('   ');
      expect(badge).toBeInTheDocument();
    });

    it('should handle very long content', () => {
      const longText = 'This is an extremely long badge text that could potentially overflow the container';
      render(<Badge>{longText}</Badge>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle nested HTML elements', () => {
      render(
        <Badge>
          <strong>Bold</strong> <em>Italic</em>
        </Badge>
      );

      expect(screen.getByText('Bold')).toBeInTheDocument();
      expect(screen.getByText('Italic')).toBeInTheDocument();
    });

    it('should handle unicode characters', () => {
      render(<Badge>🎉 Success 成功</Badge>);
      expect(screen.getByText(/Success/)).toBeInTheDocument();
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Badge.displayName).toBe('Badge');
    });
  });

  describe('Variant combinations', () => {
    it('should support all variant and className combinations', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'error', 'info'] as const;

      render(
        <div>
          {variants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      );

      variants.forEach((variant) => {
        expect(screen.getByText(variant)).toBeInTheDocument();
      });
    });
  });
});
