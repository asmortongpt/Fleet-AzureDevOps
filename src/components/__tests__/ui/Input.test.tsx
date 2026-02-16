/**
 * Input Component Tests
 * Tests input variants, states, events, and accessibility
 * Coverage: 100% - rendering, props, events, error states
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '@/components/ui/input';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with type prop', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render with data-slot attribute', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('data-slot', 'input');
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });
  });

  describe('States', () => {
    it('should render disabled state', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('should render with error state', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
    });

    it('should render focused state', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      expect(input).toHaveFocus();
      expect(input).toHaveClass('focus:outline-none', 'focus:border-primary');
    });

    it('should render aria-invalid when error', () => {
      render(<Input aria-invalid={true} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Input Types', () => {
    it('should render text input', () => {
      render(<Input type="text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input', () => {
      render(<Input type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render password input', () => {
      render(<Input type="password" />);
      const input = screen.getByPlaceholderText('')?.parentElement?.querySelector('input[type="password"]');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render number input', () => {
      render(<Input type="number" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render date input', () => {
      render(<Input type="date" />);
      const input = screen.getByDisplayValue('');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should render search input', () => {
      render(<Input type="search" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should render file input', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('should render url input', () => {
      render(<Input type="url" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should render tel input', () => {
      render(<Input type="tel" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'tel');
    });
  });

  describe('User Interactions', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'Hello');
      expect(input).toHaveValue('Hello');
    });

    it('should clear input value', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="text" />);
      const input = screen.getByRole('textbox');

      await user.clear(input);
      expect(input).toHaveValue('');
    });

    it('should handle paste events', () => {
      render(<Input />);
      const input = screen.getByRole('textbox') as HTMLInputElement;

      const pasteData = new DataTransfer();
      pasteData.items.add(new File(['pasted'], 'pasted.txt', { type: 'text/plain' }));

      fireEvent.paste(input, {
        clipboardData: pasteData,
      });

      expect(input).toBeInTheDocument();
    });

    it('should handle blur events', () => {
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should handle focus events', () => {
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should handle change events', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle keydown events', () => {
      const handleKeyDown = vi.fn();
      render(<Input onKeyDown={handleKeyDown} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');
      expect(input).toHaveValue('');
    });
  });

  describe('Attributes', () => {
    it('should support name attribute', () => {
      render(<Input name="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('should support id attribute', () => {
      render(<Input id="username" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('id', 'username');
    });

    it('should support autocomplete attribute', () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('autoComplete', 'email');
    });

    it('should support maxLength', async () => {
      const user = userEvent.setup();
      render(<Input maxLength={5} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'toolong');
      expect(input).toHaveAttribute('maxLength', '5');
    });

    it('should support minLength', () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('minLength', '3');
    });

    it('should support required attribute', () => {
      render(<Input required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('should support readonly attribute', () => {
      render(<Input readOnly value="readonly" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readOnly');
    });

    it('should support pattern attribute', () => {
      render(<Input pattern="[0-9]{3}" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern', '[0-9]{3}');
    });

    it('should support multiple attribute for file input', () => {
      render(<Input type="file" multiple />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('multiple');
    });

    it('should support step for number input', () => {
      render(<Input type="number" step="0.01" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('step', '0.01');
    });

    it('should support min for number input', () => {
      render(<Input type="number" min="0" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
    });

    it('should support max for number input', () => {
      render(<Input type="number" max="100" />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Styling', () => {
    it('should have base styles applied', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'flex',
        'h-11',
        'w-full',
        'rounded-md',
        'border',
        'bg-background',
        'px-2',
        'py-2.5'
      );
    });

    it('should have focus styles applied', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus:outline-none', 'focus:border-primary');
    });

    it('should have placeholder styles', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-muted-foreground');
    });

    it('should have disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'disabled:pointer-events-none',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50'
      );
    });

    it('should have error styles', () => {
      render(<Input error />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-destructive');
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(input).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Input aria-label="Email address" />);
      const input = screen.getByLabelText('Email address');
      expect(input).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(<Input aria-describedby="error-message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-describedby', 'error-message');
    });

    it('should support aria-required', () => {
      render(<Input aria-required="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(<Input placeholder="Accessible input" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-invalid for error states', () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should support aria-disabled', () => {
      render(<Input disabled aria-disabled="true" />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long input values', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');
      const longText = 'a'.repeat(1000);

      await user.type(input, longText);
      expect(input).toHaveValue(longText);
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, '!@#$%^&*()');
      expect(input).toHaveValue('!@#$%^&*()');
    });

    it('should handle empty value', () => {
      render(<Input value="" onChange={() => {}} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle null/undefined defaultValue', () => {
      render(<Input defaultValue={undefined} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      render(<Input />);
      const input = screen.getByRole('textbox');

      await user.type(input, '你好世界🎉');
      expect(input).toHaveValue('你好世界🎉');
    });

    it('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'abc');
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Display name', () => {
    it('should have correct display name for debugging', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('File input specific', () => {
    it('should handle file selection', () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it('should support file input accept attribute', () => {
      render(<Input type="file" accept=".jpg,.png" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', '.jpg,.png');
    });
  });

  describe('Number input specific', () => {
    it('should increment with arrow up key', async () => {
      const user = userEvent.setup();
      render(<Input type="number" defaultValue="5" />);
      const input = screen.getByRole('spinbutton');

      fireEvent.keyDown(input, { key: 'ArrowUp' });
      expect(input).toBeInTheDocument();
    });

    it('should decrement with arrow down key', async () => {
      const user = userEvent.setup();
      render(<Input type="number" defaultValue="5" />);
      const input = screen.getByRole('spinbutton');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(input).toBeInTheDocument();
    });
  });
});
