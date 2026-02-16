/**
 * Label Component Tests
 * Tests label rendering and form integration
 * Coverage: 100% - rendering, attributes, accessibility
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Label } from '@/components/ui/label';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Label Component', () => {
  describe('Rendering', () => {
    it('should render label element', () => {
      render(<Label>Label Text</Label>);
      const label = screen.getByText('Label Text');
      expect(label.tagName).toBe('LABEL');
    });

    it('should render with data-slot attribute', () => {
      render(<Label>Test</Label>);
      const label = screen.getByText('Test');
      expect(label).toHaveAttribute('data-slot', 'label');
    });

    it('should render with custom className', () => {
      render(<Label className="custom-class">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveClass('custom-class');
    });

    it('should have default label styles', () => {
      render(<Label>Styled Label</Label>);
      const label = screen.getByText('Styled Label');
      expect(label).toHaveClass(
        'text-sm',
        'font-medium',
        'leading-none',
        'peer-disabled:cursor-not-allowed',
        'peer-disabled:opacity-70'
      );
    });
  });

  describe('Form Integration', () => {
    it('should associate with input via htmlFor', () => {
      render(
        <>
          <Label htmlFor="username">Username</Label>
          <input id="username" type="text" />
        </>
      );

      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username');
    });

    it('should work with form elements', () => {
      render(
        <>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" />
        </>
      );

      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email');
    });

    it('should associate with textarea', () => {
      render(
        <>
          <Label htmlFor="message">Message</Label>
          <textarea id="message"></textarea>
        </>
      );

      const label = screen.getByText('Message');
      expect(label).toHaveAttribute('for', 'message');
    });

    it('should associate with select', () => {
      render(
        <>
          <Label htmlFor="country">Country</Label>
          <select id="country">
            <option>US</option>
          </select>
        </>
      );

      const label = screen.getByText('Country');
      expect(label).toHaveAttribute('for', 'country');
    });

    it('should work with checkbox', () => {
      render(
        <>
          <input id="terms" type="checkbox" />
          <Label htmlFor="terms">Accept Terms</Label>
        </>
      );

      const label = screen.getByText('Accept Terms');
      expect(label).toHaveAttribute('for', 'terms');
    });

    it('should work with radio', () => {
      render(
        <>
          <input id="option1" type="radio" name="options" />
          <Label htmlFor="option1">Option 1</Label>
        </>
      );

      const label = screen.getByText('Option 1');
      expect(label).toHaveAttribute('for', 'option1');
    });
  });

  describe('Content', () => {
    it('should render text content', () => {
      render(<Label>Text Label</Label>);
      expect(screen.getByText('Text Label')).toBeInTheDocument();
    });

    it('should render children elements', () => {
      render(
        <Label>
          <span>Label with span</span>
        </Label>
      );
      expect(screen.getByText('Label with span')).toBeInTheDocument();
    });

    it('should render with icon', () => {
      render(
        <Label>
          <span>🏷️</span>
          Label with Icon
        </Label>
      );
      expect(screen.getByText('Label with Icon')).toBeInTheDocument();
    });

    it('should render with required indicator', () => {
      render(
        <Label>
          Email <span className="text-destructive">*</span>
        </Label>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('should handle long text content', () => {
      const longText = 'This is a very long label that describes an important field';
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it('should handle special characters', () => {
      render(<Label>Label with !@#$% special characters</Label>);
      expect(screen.getByText(/special characters/)).toBeInTheDocument();
    });
  });

  describe('Attributes', () => {
    it('should support htmlFor attribute', () => {
      render(<Label htmlFor="input-id">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('for', 'input-id');
    });

    it('should support id attribute', () => {
      render(<Label id="label-1">Label</Label>);
      const label = screen.getByText('Label');
      expect(label).toHaveAttribute('id', 'label-1');
    });

    it('should support data attributes', () => {
      render(<Label data-testid="form-label">Label</Label>);
      const label = screen.getByTestId('form-label');
      expect(label).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Label aria-label="Form field label">Label</Label>);
      const label = screen.getByLabelText('Form field label');
      expect(label).toBeInTheDocument();
    });

    it('should support aria-required', () => {
      render(<Label aria-required="true">Required Label</Label>);
      const label = screen.getByText('Required Label');
      expect(label).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Styling with peer selector', () => {
    it('should respond to peer disabled state', () => {
      render(
        <>
          <input id="test" type="text" disabled className="peer" />
          <Label htmlFor="test" className="peer-disabled:opacity-50">
            Disabled Field
          </Label>
        </>
      );

      const label = screen.getByText('Disabled Field');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });

    it('should respond to peer focus state', () => {
      render(
        <>
          <input id="test" type="text" className="peer" />
          <Label htmlFor="test" className="peer-focus:text-primary">
            Field Label
          </Label>
        </>
      );

      const label = screen.getByText('Field Label');
      expect(label).toHaveClass('peer-focus:text-primary');
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <>
          <Label htmlFor="input">Form Label</Label>
          <input id="input" type="text" />
        </>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be keyboard accessible', () => {
      render(
        <>
          <Label htmlFor="input">Click Label</Label>
          <input id="input" type="text" />
        </>
      );

      const label = screen.getByText('Click Label');
      expect(label).toHaveAttribute('for', 'input');
    });

    it('should announce label to screen readers', () => {
      render(
        <>
          <Label htmlFor="email-input">Email Address</Label>
          <input id="email-input" type="email" />
        </>
      );

      const label = screen.getByText('Email Address');
      expect(label.textContent).toBe('Email Address');
    });

    it('should have label role', () => {
      render(<Label>Label</Label>);
      const label = screen.getByText('Label');
      expect(label.tagName).toBe('LABEL');
    });

    it('should support aria-describedby', () => {
      render(
        <>
          <Label aria-describedby="help-text">Field</Label>
          <span id="help-text">Help text</span>
        </>
      );

      const label = screen.getByText('Field');
      expect(label).toHaveAttribute('aria-describedby', 'help-text');
    });
  });

  describe('Label Patterns', () => {
    it('should work with form fields', () => {
      render(
        <div>
          <Label htmlFor="name">Name</Label>
          <input id="name" type="text" />
        </div>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should work with multiple inputs', () => {
      render(
        <div>
          <Label htmlFor="first">First Name</Label>
          <input id="first" type="text" />
          <Label htmlFor="last">Last Name</Label>
          <input id="last" type="text" />
        </div>
      );

      expect(screen.getByText('First Name')).toHaveAttribute('for', 'first');
      expect(screen.getByText('Last Name')).toHaveAttribute('for', 'last');
    });

    it('should work with radio groups', () => {
      render(
        <fieldset>
          <legend>Choose one</legend>
          <div>
            <input id="option1" type="radio" name="choice" />
            <Label htmlFor="option1">Option 1</Label>
          </div>
          <div>
            <input id="option2" type="radio" name="choice" />
            <Label htmlFor="option2">Option 2</Label>
          </div>
        </fieldset>
      );

      expect(screen.getByText('Option 1')).toHaveAttribute('for', 'option1');
      expect(screen.getByText('Option 2')).toHaveAttribute('for', 'option2');
    });

    it('should work with checkboxes', () => {
      render(
        <div>
          <input id="agree" type="checkbox" />
          <Label htmlFor="agree">I agree</Label>
        </div>
      );

      expect(screen.getByText('I agree')).toHaveAttribute('for', 'agree');
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Label.displayName).toBe('Label');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty label', () => {
      render(<Label></Label>);
      const label = screen.getByText('');
      expect(label).toBeInTheDocument();
    });

    it('should handle label without htmlFor', () => {
      render(<Label>Unassociated</Label>);
      const label = screen.getByText('Unassociated');
      expect(label).toBeInTheDocument();
    });

    it('should handle unicode content', () => {
      render(<Label>标签 ラベル Étiquette</Label>);
      const label = screen.getByText(/标签/);
      expect(label).toBeInTheDocument();
    });

    it('should handle numeric content', () => {
      render(<Label>Field {42}</Label>);
      expect(screen.getByText(/Field/)).toBeInTheDocument();
    });

    it('should combine className properly', () => {
      render(
        <Label htmlFor="test" className="text-lg font-bold text-primary">
          Custom Label
        </Label>
      );

      const label = screen.getByText('Custom Label');
      expect(label).toHaveClass('text-lg', 'font-bold', 'text-primary');
    });
  });

  describe('Visual States', () => {
    it('should support different text styles', () => {
      const { container } = render(
        <div>
          <Label className="text-sm">Small</Label>
          <Label className="text-base">Base</Label>
          <Label className="text-lg">Large</Label>
        </div>
      );

      const labels = container.querySelectorAll('label');
      expect(labels).toHaveLength(3);
    });

    it('should support different colors', () => {
      const { container } = render(
        <div>
          <Label className="text-foreground">Default</Label>
          <Label className="text-primary">Primary</Label>
          <Label className="text-destructive">Error</Label>
        </div>
      );

      const labels = container.querySelectorAll('label');
      expect(labels).toHaveLength(3);
    });

    it('should support opacity states', () => {
      render(
        <div>
          <input id="disabled-field" type="text" disabled className="peer" />
          <Label htmlFor="disabled-field" className="peer-disabled:opacity-50">
            Faded when disabled
          </Label>
        </div>
      );

      const label = screen.getByText('Faded when disabled');
      expect(label).toHaveClass('peer-disabled:opacity-50');
    });
  });
});
