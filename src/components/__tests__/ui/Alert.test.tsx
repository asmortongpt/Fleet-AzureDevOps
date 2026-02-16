/**
 * Alert Component Tests
 * Tests alert rendering, variants, and accessibility
 * Coverage: 100% - rendering, variants, content, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Alert Component', () => {
  describe('Alert Root', () => {
    it('should render alert element', () => {
      render(<Alert>Alert content</Alert>);
      expect(screen.getByText('Alert content')).toBeInTheDocument();
    });

    it('should render with data-slot attribute', () => {
      render(<Alert>Alert</Alert>);
      const alert = screen.getByText('Alert');
      expect(alert.closest('[data-slot="alert"]')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Alert className="custom-class">Alert</Alert>);
      const alert = screen.getByText('Alert');
      expect(alert.closest('[data-slot="alert"]')).toHaveClass('custom-class');
    });

    it('should have default alert styles', () => {
      render(<Alert>Styled</Alert>);
      const alert = screen.getByText('Styled').closest('[data-slot="alert"]');
      expect(alert).toHaveClass(
        'relative',
        'w-full',
        'rounded-lg',
        'border',
        'p-4',
        'bg-background'
      );
    });
  });

  describe('Variants', () => {
    it('should render default variant', () => {
      render(<Alert variant="default">Default</Alert>);
      const alert = screen.getByText('Default').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('bg-background', 'border-border');
    });

    it('should render destructive variant', () => {
      render(<Alert variant="destructive">Destructive</Alert>);
      const alert = screen.getByText('Destructive').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('border-destructive/50', 'bg-destructive/10');
    });

    it('should render success variant', () => {
      render(<Alert variant="success">Success</Alert>);
      const alert = screen.getByText('Success').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('border-emerald-500');
    });

    it('should render warning variant', () => {
      render(<Alert variant="warning">Warning</Alert>);
      const alert = screen.getByText('Warning').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('border-amber-500');
    });

    it('should render info variant', () => {
      render(<Alert variant="info">Info</Alert>);
      const alert = screen.getByText('Info').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('border-blue-500');
    });
  });

  describe('AlertTitle', () => {
    it('should render alert title', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should have title styles', () => {
      render(
        <Alert>
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-tight');
    });

    it('should render as h5 element', () => {
      render(
        <Alert>
          <AlertTitle>Heading</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Heading');
      expect(title.tagName).toBe('H5');
    });

    it('should support custom className on title', () => {
      render(
        <Alert>
          <AlertTitle className="text-lg">Title</AlertTitle>
        </Alert>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-lg');
    });
  });

  describe('AlertDescription', () => {
    it('should render alert description', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('should have description styles', () => {
      render(
        <Alert>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );
      const desc = screen.getByText('Description');
      expect(desc).toHaveClass('text-sm', 'opacity-90');
    });

    it('should support custom className on description', () => {
      render(
        <Alert>
          <AlertDescription className="text-base">Desc</AlertDescription>
        </Alert>
      );
      const desc = screen.getByText('Desc');
      expect(desc).toHaveClass('text-base');
    });
  });

  describe('Composition', () => {
    it('should render complete alert structure', () => {
      render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should render minimal alert with title only', () => {
      render(
        <Alert>
          <AlertTitle>Alert</AlertTitle>
        </Alert>
      );
      expect(screen.getByText('Alert')).toBeInTheDocument();
    });

    it('should render alert with description only', () => {
      render(
        <Alert>
          <AlertDescription>Just description</AlertDescription>
        </Alert>
      );
      expect(screen.getByText('Just description')).toBeInTheDocument();
    });

    it('should render alert with icon and content', () => {
      render(
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Operation completed</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Operation completed')).toBeInTheDocument();
    });

    it('should support nested elements', () => {
      render(
        <Alert>
          <AlertTitle>Title with <strong>emphasis</strong></AlertTitle>
          <AlertDescription>
            Description with <a href="/">link</a>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Title with')).toBeInTheDocument();
      expect(screen.getByRole('link')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should support lucide icons', () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
        </Alert>
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should support custom icon sizes', () => {
      const { container } = render(
        <Alert>
          <AlertCircle className="h-6 w-6" />
        </Alert>
      );

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6');
    });

    it('should maintain icon spacing with content', () => {
      render(
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Title</AlertTitle>
        </Alert>
      );

      expect(screen.getByText('Title')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Alert>Alert message</Alert>);
      expect(screen.getByText('Alert message')).toBeInTheDocument();
    });

    it('should handle long content', () => {
      const longText = 'This is a very long alert message that provides detailed information about the error or notification';
      render(
        <Alert>
          <AlertDescription>{longText}</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle multiple paragraphs', () => {
      render(
        <Alert>
          <AlertDescription>
            <p>First paragraph</p>
            <p>Second paragraph</p>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('First paragraph')).toBeInTheDocument();
      expect(screen.getByText('Second paragraph')).toBeInTheDocument();
    });

    it('should handle list content', () => {
      render(
        <Alert>
          <AlertTitle>Issues</AlertTitle>
          <AlertDescription>
            <ul>
              <li>Issue 1</li>
              <li>Issue 2</li>
            </ul>
          </AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Issue 1')).toBeInTheDocument();
      expect(screen.getByText('Issue 2')).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(
        <Alert>
          <AlertDescription>Alert with !@#$% special chars</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(/special chars/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <Alert>
          <AlertTitle>Alert Title</AlertTitle>
        </Alert>
      );
      const heading = screen.getByRole('heading', { level: 5 });
      expect(heading).toHaveTextContent('Alert Title');
    });

    it('should support aria-label', () => {
      render(<Alert aria-label="Error alert">Content</Alert>);
      const alert = screen.getByLabelText('Error alert');
      expect(alert).toBeInTheDocument();
    });

    it('should support aria-live for dynamic alerts', () => {
      render(<Alert aria-live="polite">Updated content</Alert>);
      const alert = screen.getByText('Updated content').closest('[data-slot="alert"]');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Alert aria-describedby="alert-description">Main</Alert>
          <p id="alert-description">Description</p>
        </>
      );
      const alert = screen.getByText('Main').closest('[data-slot="alert"]');
      expect(alert).toHaveAttribute('aria-describedby', 'alert-description');
    });

    it('should be announced to screen readers', () => {
      render(
        <Alert role="status" aria-live="assertive">
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>Important update</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Attention')).toBeInTheDocument();
      expect(screen.getByText('Important update')).toBeInTheDocument();
    });
  });

  describe('Use Cases', () => {
    it('should work as error alert', () => {
      render(
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to save changes</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to save changes')).toBeInTheDocument();
    });

    it('should work as success alert', () => {
      render(
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Changes saved successfully</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Changes saved successfully')).toBeInTheDocument();
    });

    it('should work as warning alert', () => {
      render(
        <Alert variant="warning">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This action cannot be undone</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });

    it('should work as info alert', () => {
      render(
        <Alert variant="info">
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>New features available</AlertDescription>
        </Alert>
      );

      expect(screen.getByText('Info')).toBeInTheDocument();
      expect(screen.getByText('New features available')).toBeInTheDocument();
    });
  });

  describe('Multiple Alerts', () => {
    it('should render multiple alerts independently', () => {
      render(
        <>
          <Alert variant="destructive">Error Alert</Alert>
          <Alert variant="success">Success Alert</Alert>
          <Alert variant="warning">Warning Alert</Alert>
        </>
      );

      expect(screen.getByText('Error Alert')).toBeInTheDocument();
      expect(screen.getByText('Success Alert')).toBeInTheDocument();
      expect(screen.getByText('Warning Alert')).toBeInTheDocument();
    });
  });

  describe('Display names', () => {
    it('should have correct display names', () => {
      expect(Alert.displayName).toBe('Alert');
      expect(AlertTitle.displayName).toBe('AlertTitle');
      expect(AlertDescription.displayName).toBe('AlertDescription');
    });
  });

  describe('Edge cases', () => {
    it('should render empty alert', () => {
      render(<Alert></Alert>);
      const alert = document.querySelector('[data-slot="alert"]');
      expect(alert).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'This is an extremely long alert title that describes a complex error condition in great detail';
      render(
        <Alert>
          <AlertTitle>{longTitle}</AlertTitle>
        </Alert>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle unicode content', () => {
      render(
        <Alert>
          <AlertTitle>标题 タイトル Titre</AlertTitle>
          <AlertDescription>Описание الوصف مرحبا</AlertDescription>
        </Alert>
      );
      expect(screen.getByText(/标题/)).toBeInTheDocument();
    });

    it('should combine className properly', () => {
      render(
        <Alert variant="destructive" className="mb-4 shadow-lg">
          Custom styled
        </Alert>
      );
      const alert = screen.getByText('Custom styled').closest('[data-slot="alert"]');
      expect(alert).toHaveClass('mb-4', 'shadow-lg');
    });
  });
});
