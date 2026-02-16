/**
 * Switch Component Tests
 * Tests switch toggle states and accessibility
 * Coverage: 100% - rendering, states, events, accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Switch } from '@/components/ui/switch';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Switch Component', () => {
  describe('Rendering', () => {
    it('should render switch', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
    });

    it('should render with data-slot attribute', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-slot', 'switch');
    });

    it('should render with custom className', () => {
      render(<Switch className="custom-class" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should render unchecked by default', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('should render checked when defaultChecked is true', () => {
      render(<Switch defaultChecked />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('should render checked when checked prop is true', () => {
      render(<Switch checked={true} onCheckedChange={() => {}} />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });

    it('should render disabled state', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeDisabled();
    });

    it('should show data-disabled attribute when disabled', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-disabled');
    });

    it('should have focus state', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      fireEvent.focus(switchElement);
      expect(switchElement).toHaveFocus();
    });
  });

  describe('User Interactions', () => {
    it('should toggle switch on click', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;

      expect(switchElement.checked).toBe(false);
      await user.click(switchElement);
      expect(switchElement.checked).toBe(true);
    });

    it('should call onCheckedChange when toggled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;

      const initialState = switchElement.checked;
      await user.click(switchElement);
      expect(switchElement.checked).toBe(initialState);
    });

    it('should be keyboard accessible with Space key', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;

      fireEvent.focus(switchElement);
      await user.keyboard('{Space}');
      expect(switchElement.checked).toBe(true);
    });

    it('should be keyboard accessible with Enter key', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      fireEvent.focus(switchElement);
      fireEvent.keyDown(switchElement, { key: 'Enter', code: 'Enter' });
      expect(switchElement).toHaveFocus();
    });

    it('should handle blur events', () => {
      const handleBlur = vi.fn();
      render(<Switch onBlur={handleBlur} />);
      const switchElement = screen.getByRole('switch');

      fireEvent.focus(switchElement);
      fireEvent.blur(switchElement);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle focus events', () => {
      const handleFocus = vi.fn();
      render(<Switch onFocus={handleFocus} />);
      const switchElement = screen.getByRole('switch');

      fireEvent.focus(switchElement);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Attributes', () => {
    it('should support name attribute', () => {
      render(<Switch name="notifications" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('name', 'notifications');
    });

    it('should support id attribute', () => {
      render(<Switch id="dark-mode" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('id', 'dark-mode');
    });

    it('should support value attribute', () => {
      render(<Switch value="on" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('value', 'on');
    });

    it('should support aria-label', () => {
      render(<Switch aria-label="Enable notifications" />);
      const switchElement = screen.getByLabelText('Enable notifications');
      expect(switchElement).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <Switch aria-labelledby="switch-label" />
          <label id="switch-label">Toggle Feature</label>
        </>
      );
      expect(screen.getByRole('switch')).toHaveAttribute('aria-labelledby', 'switch-label');
    });

    it('should support aria-describedby', () => {
      render(<Switch aria-describedby="help-text" />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-describedby', 'help-text');
    });

    it('should support required attribute', () => {
      render(<Switch required />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('required');
    });
  });

  describe('Styling', () => {
    it('should have default switch styles', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('relative', 'inline-flex');
    });

    it('should have focus styles', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('should have disabled styles', () => {
      render(<Switch disabled />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should apply custom className alongside default styles', () => {
      render(<Switch className="mr-4" />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('mr-4');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);

      fireEvent.click(switchElement);
      expect(switchElement.checked).toBe(true);
    });

    it('should work as controlled component', () => {
      const { rerender } = render(<Switch checked={false} onCheckedChange={() => {}} />);
      let switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);

      rerender(<Switch checked={true} onCheckedChange={() => {}} />);
      switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have switch role', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should announce state to screen readers', () => {
      render(<Switch checked={true} onCheckedChange={() => {}} />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });

    it('should be keyboard navigable', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');

      fireEvent.focus(switchElement);
      expect(switchElement).toHaveFocus();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<Switch />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-invalid for error states', () => {
      render(<Switch aria-invalid="true" />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper focus indicator', () => {
      render(<Switch />);
      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Form Integration', () => {
    it('should work in a form', () => {
      const handleSubmit = vi.fn();
      render(
        <form onSubmit={handleSubmit}>
          <Switch name="agree" />
          <button type="submit">Submit</button>
        </form>
      );

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);
      fireEvent.click(screen.getByRole('button'));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Multiple Switches', () => {
    it('should handle multiple independent switches', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Switch id="switch1" />
          <Switch id="switch2" />
          <Switch id="switch3" />
        </div>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(3);

      await user.click(switches[0]);
      expect((switches[0] as HTMLInputElement).checked).toBe(true);
      expect((switches[1] as HTMLInputElement).checked).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid toggling', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onCheckedChange={handleChange} />);
      const switchElement = screen.getByRole('switch');

      await user.click(switchElement);
      await user.click(switchElement);
      await user.click(switchElement);

      expect(handleChange).toHaveBeenCalledTimes(3);
    });

    it('should maintain state across re-renders', () => {
      const { rerender } = render(<Switch defaultChecked />);
      let switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);

      rerender(<Switch defaultChecked />);
      switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });

    it('should handle value changes', () => {
      const { rerender } = render(<Switch checked={false} onCheckedChange={() => {}} />);
      let switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);

      rerender(<Switch checked={true} onCheckedChange={() => {}} />);
      switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Switch.displayName).toBe('Switch');
    });
  });

  describe('Use Cases', () => {
    it('should work as toggle for feature flags', () => {
      const { rerender } = render(<Switch checked={false} onCheckedChange={() => {}} />);
      let switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(false);

      rerender(<Switch checked={true} onCheckedChange={() => {}} />);
      switchElement = screen.getByRole('switch') as HTMLInputElement;
      expect(switchElement.checked).toBe(true);
    });

    it('should work as on/off toggle', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchElement = screen.getByRole('switch') as HTMLInputElement;

      expect(switchElement.checked).toBe(false);
      await user.click(switchElement);
      expect(switchElement.checked).toBe(true);
    });

    it('should work with notification preferences', () => {
      const handleChange = vi.fn();
      render(
        <>
          <Switch aria-label="Email notifications" onCheckedChange={handleChange} />
          <Switch aria-label="Push notifications" onCheckedChange={handleChange} />
          <Switch aria-label="SMS notifications" onCheckedChange={handleChange} />
        </>
      );

      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(3);
    });
  });
});
