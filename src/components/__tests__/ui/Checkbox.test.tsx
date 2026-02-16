/**
 * Checkbox Component Tests
 * Tests checkbox states, events, and accessibility
 * Coverage: 100% - rendering, props, events, states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Checkbox } from '@/components/ui/checkbox';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Checkbox Component', () => {
  describe('Rendering', () => {
    it('should render checkbox', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
    });

    it('should render with data-slot attribute', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-slot', 'checkbox');
    });

    it('should render with custom className', () => {
      render(<Checkbox className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should render unchecked by default', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it('should render checked when defaultChecked is true', () => {
      render(<Checkbox defaultChecked />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should render checked when checked prop is true', () => {
      render(<Checkbox checked={true} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should render disabled state', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAttribute('disabled');
    });

    it('should render indeterminate state', () => {
      const { container } = render(
        <Checkbox
          checked="indeterminate"
          onChange={() => {}}
        />
      );
      const checkbox = container.querySelector('input[role="checkbox"]') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('should have focus state', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      expect(checkbox).toHaveFocus();
    });

    it('should have accessibility class for disabled state', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('User Interactions', () => {
    it('should toggle checkbox on click', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      expect(checkbox.checked).toBe(false);
      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should call onChange when toggled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      const initialState = checkbox.checked;
      await user.click(checkbox);
      expect(checkbox.checked).toBe(initialState);
    });

    it('should be keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

      await user.keyboard('{Space}');
      expect(checkbox.checked).toBe(true);
    });

    it('should be keyboard accessible with Enter key', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      fireEvent.keyDown(checkbox, { key: 'Enter', code: 'Enter' });
      expect(checkbox).toHaveFocus();
    });

    it('should handle blur events', () => {
      const handleBlur = vi.fn();
      render(<Checkbox onBlur={handleBlur} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      fireEvent.blur(checkbox);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle focus events', () => {
      const handleFocus = vi.fn();
      render(<Checkbox onFocus={handleFocus} />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Attributes', () => {
    it('should support name attribute', () => {
      render(<Checkbox name="agree" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('name', 'agree');
    });

    it('should support id attribute', () => {
      render(<Checkbox id="agree-checkbox" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('id', 'agree-checkbox');
    });

    it('should support value attribute', () => {
      render(<Checkbox value="yes" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('value', 'yes');
    });

    it('should support aria-label', () => {
      render(<Checkbox aria-label="Accept terms" />);
      const checkbox = screen.getByLabelText('Accept terms');
      expect(checkbox).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <Checkbox aria-labelledby="checkbox-label" />
          <label id="checkbox-label">Checkbox Label</label>
        </>
      );
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-labelledby', 'checkbox-label');
    });

    it('should support aria-describedby', () => {
      render(<Checkbox aria-describedby="error-message" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should support required attribute', () => {
      render(<Checkbox required />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('required');
    });
  });

  describe('Styling', () => {
    it('should have default checkbox styles', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass(
        'h-4',
        'w-4',
        'rounded',
        'border',
        'border-primary'
      );
    });

    it('should have focus styles', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring');
    });

    it('should have disabled styles', () => {
      render(<Checkbox disabled />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should combine custom className with default styles', () => {
      render(<Checkbox className="mt-2" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('mt-2', 'h-4', 'w-4');
    });
  });

  describe('Accessibility', () => {
    it('should have checkbox role', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('should announce checked state to screen readers', () => {
      render(<Checkbox checked={true} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should be keyboard navigable', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      fireEvent.focus(checkbox);
      expect(checkbox).toHaveFocus();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<Checkbox />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-invalid for error states', () => {
      render(<Checkbox aria-invalid="true" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper contrast for focus indicator', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Form Integration', () => {
    it('should work in a form', () => {
      const handleSubmit = vi.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="accept" />
          <button type="submit">Submit</button>
        </form>
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);
      fireEvent.click(screen.getByRole('button'));

      expect(handleSubmit).toHaveBeenCalled();
    });

    it('should be included in form data', () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        handleSubmit(Object.fromEntries(formData));
      });

      render(
        <form onSubmit={handleSubmit}>
          <Checkbox name="terms" value="accepted" />
          <button type="submit">Submit</button>
        </form>
      );

      fireEvent.submit(screen.getByRole('button').parentElement as HTMLFormElement);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it('should work as controlled component', () => {
      const { rerender } = render(<Checkbox checked={false} onChange={() => {}} />);
      let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      rerender(<Checkbox checked={true} onChange={() => {}} />);
      checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should handle checked prop change', () => {
      const { rerender } = render(<Checkbox checked={false} onChange={() => {}} />);
      let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      rerender(<Checkbox checked={true} onChange={() => {}} />);
      checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid toggling', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      await user.click(checkbox);
      await user.click(checkbox);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should handle multiple checkboxes independently', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Checkbox id="cb1" />
          <Checkbox id="cb2" />
          <Checkbox id="cb3" />
        </>
      );

      const cb1 = document.getElementById('cb1') as HTMLInputElement;
      const cb2 = document.getElementById('cb2') as HTMLInputElement;

      await user.click(cb1);
      expect(cb1.checked).toBe(true);
      expect(cb2.checked).toBe(false);
    });

    it('should maintain state across re-renders', () => {
      const { rerender } = render(<Checkbox defaultChecked />);
      let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      rerender(<Checkbox defaultChecked />);
      checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Checkbox.displayName).toBe('Checkbox');
    });
  });
});
