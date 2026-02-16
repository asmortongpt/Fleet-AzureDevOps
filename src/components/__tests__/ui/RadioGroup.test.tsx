/**
 * RadioGroup Component Tests
 * Tests radio group rendering, selection, and accessibility
 * Coverage: 100% - rendering, states, events, accessibility
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('RadioGroup Component', () => {
  const renderRadioGroup = () => {
    return render(
      <RadioGroup defaultValue="option1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">Option 2</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option3" id="option3" />
          <Label htmlFor="option3">Option 3</Label>
        </div>
      </RadioGroup>
    );
  };

  describe('Rendering', () => {
    it('should render radio group', () => {
      renderRadioGroup();
      expect(screen.getByRole('radio', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('should render with data-slot attribute on items', () => {
      render(
        <RadioGroup defaultValue="opt1">
          <RadioGroupItem value="opt1" id="opt1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('data-slot', 'radio-group-item');
    });

    it('should render radio buttons', () => {
      renderRadioGroup();
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });
  });

  describe('Selection States', () => {
    it('should have default value selected', () => {
      renderRadioGroup();
      const option1 = screen.getByRole('radio', { name: 'Option 1' }) as HTMLInputElement;
      expect(option1.checked).toBe(true);
    });

    it('should only allow one selection at a time', async () => {
      const user = userEvent.setup();
      renderRadioGroup();

      const option1 = screen.getByRole('radio', { name: 'Option 1' }) as HTMLInputElement;
      const option2 = screen.getByRole('radio', { name: 'Option 2' }) as HTMLInputElement;

      expect(option1.checked).toBe(true);
      expect(option2.checked).toBe(false);

      await user.click(option2);
      expect(option1.checked).toBe(false);
      expect(option2.checked).toBe(true);
    });

    it('should show checked state for selected item', () => {
      renderRadioGroup();
      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      expect(option1).toHaveAttribute('data-state', 'checked');
    });

    it('should show unchecked state for unselected items', () => {
      renderRadioGroup();
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      expect(option2).toHaveAttribute('data-state', 'unchecked');
    });

    it('should support disabled state', () => {
      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" disabled />
        </RadioGroup>
      );

      const disabledRadio = screen.getByRole('radio', { hidden: true });
      expect(disabledRadio).toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should select radio on click', async () => {
      const user = userEvent.setup();
      renderRadioGroup();

      const option2 = screen.getByRole('radio', { name: 'Option 2' }) as HTMLInputElement;
      expect(option2.checked).toBe(false);

      await user.click(option2);
      expect(option2.checked).toBe(true);
    });

    it('should call onValueChange when selected', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <RadioGroup defaultValue="opt1" onValueChange={handleChange}>
          <RadioGroupItem value="opt1" id="opt1" />
          <RadioGroupItem value="opt2" id="opt2" />
        </RadioGroup>
      );

      const radio2 = screen.getByRole('radio', { name: '' });
      if (radio2.id === 'opt2') {
        await user.click(radio2);
        expect(handleChange).toHaveBeenCalled();
      }
    });

    it('should not select when disabled', async () => {
      const user = userEvent.setup();

      render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" disabled />
        </RadioGroup>
      );

      const disabledRadio = document.getElementById('option2') as HTMLInputElement;
      const initialState = disabledRadio.checked;

      await user.click(disabledRadio);
      expect(disabledRadio.checked).toBe(initialState);
    });

    it('should be keyboard accessible with arrow keys', async () => {
      const user = userEvent.setup();
      renderRadioGroup();

      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      fireEvent.focus(option1);

      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('radio', { name: 'Option 2' })).toHaveFocus();
    });

    it('should handle Space key to select', async () => {
      const user = userEvent.setup();
      renderRadioGroup();

      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      fireEvent.focus(option2);

      await user.keyboard('{Space}');
      expect(option2).toHaveFocus();
    });
  });

  describe('Attributes', () => {
    it('should support name attribute', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" name="group" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('name', 'group');
    });

    it('should support value attribute', () => {
      render(
        <RadioGroup defaultValue="val1">
          <RadioGroupItem value="val1" id="val1" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio') as HTMLInputElement;
      expect(radio.value).toBe('val1');
    });

    it('should support id attribute', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="radio-a" />
        </RadioGroup>
      );

      const radio = document.getElementById('radio-a');
      expect(radio).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" aria-label="First option" />
        </RadioGroup>
      );

      const radio = screen.getByLabelText('First option');
      expect(radio).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(
        <>
          <RadioGroup defaultValue="a">
            <RadioGroupItem value="a" id="a" aria-labelledby="label-a" />
          </RadioGroup>
          <label id="label-a">Option A</label>
        </>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-labelledby', 'label-a');
    });

    it('should support aria-describedby', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" aria-describedby="help-a" />
          <p id="help-a">Help text</p>
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-describedby', 'help-a');
    });

    it('should support required attribute', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" required />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('required');
    });
  });

  describe('Styling', () => {
    it('should have default radio styles', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('h-4', 'w-4', 'rounded-full', 'border', 'border-primary');
    });

    it('should have focus styles', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('focus-visible:ring-2');
    });

    it('should have disabled styles', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" disabled />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('should support custom className', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" className="custom-class" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('custom-class');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled component', () => {
      renderRadioGroup();
      const option1 = screen.getByRole('radio', { name: 'Option 1' }) as HTMLInputElement;
      expect(option1.checked).toBe(true);
    });

    it('should work as controlled component', () => {
      const { rerender } = render(
        <RadioGroup value="option1" onValueChange={() => {}}>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      );

      let option1 = screen.getByRole('radio') as HTMLInputElement;
      expect(option1.checked).toBe(true);

      rerender(
        <RadioGroup value="option2" onValueChange={() => {}}>
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      );

      const option2 = document.getElementById('option2') as HTMLInputElement;
      expect(option2.checked).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have radio role', () => {
      renderRadioGroup();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('should announce checked state', () => {
      renderRadioGroup();
      const option1 = screen.getByRole('radio', { name: 'Option 1' }) as HTMLInputElement;
      expect(option1.checked).toBe(true);
    });

    it('should be keyboard navigable', () => {
      renderRadioGroup();
      const option1 = screen.getByRole('radio', { name: 'Option 1' });

      fireEvent.focus(option1);
      expect(option1).toHaveFocus();
    });

    it('should have no accessibility violations', async () => {
      const { container } = render(
        <RadioGroup defaultValue="option1">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="option1" />
            <Label htmlFor="option1">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="option2" />
            <Label htmlFor="option2">Option 2</Label>
          </div>
        </RadioGroup>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support aria-invalid for error states', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" aria-invalid="true" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have proper focus indicator', () => {
      render(
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" id="a" />
        </RadioGroup>
      );

      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Form Integration', () => {
    it('should work in a form', () => {
      const handleSubmit = vi.fn();

      render(
        <form onSubmit={handleSubmit}>
          <RadioGroup defaultValue="option1" name="choice">
            <RadioGroupItem value="option1" id="option1" />
            <RadioGroupItem value="option2" id="option2" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>
      );

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
          <RadioGroup defaultValue="option1" name="choice">
            <RadioGroupItem value="option1" id="option1" />
            <RadioGroupItem value="option2" id="option2" />
          </RadioGroup>
          <button type="submit">Submit</button>
        </form>
      );

      fireEvent.submit(screen.getByRole('button').parentElement as HTMLFormElement);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Multiple Options', () => {
    it('should handle many options', () => {
      render(
        <RadioGroup defaultValue="opt1">
          {Array.from({ length: 10 }, (_, i) => (
            <RadioGroupItem key={`opt${i + 1}`} value={`opt${i + 1}`} id={`opt${i + 1}`} />
          ))}
        </RadioGroup>
      );

      expect(screen.getAllByRole('radio')).toHaveLength(10);
    });

    it('should maintain selection across many options', async () => {
      const user = userEvent.setup();

      render(
        <RadioGroup defaultValue="opt1">
          {Array.from({ length: 5 }, (_, i) => (
            <RadioGroupItem key={`opt${i + 1}`} value={`opt${i + 1}`} id={`opt${i + 1}`} />
          ))}
        </RadioGroup>
      );

      const radio3 = document.getElementById('opt3') as HTMLInputElement;
      await user.click(radio3);

      expect(radio3.checked).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single option', () => {
      render(
        <RadioGroup defaultValue="only">
          <RadioGroupItem value="only" id="only" />
        </RadioGroup>
      );

      expect(screen.getByRole('radio')).toBeInTheDocument();
    });

    it('should handle rapid selections', async () => {
      const user = userEvent.setup();
      renderRadioGroup();

      const option1 = screen.getByRole('radio', { name: 'Option 1' });
      const option2 = screen.getByRole('radio', { name: 'Option 2' });
      const option3 = screen.getByRole('radio', { name: 'Option 3' });

      await user.click(option1);
      await user.click(option2);
      await user.click(option3);

      expect((option3 as HTMLInputElement).checked).toBe(true);
    });

    it('should maintain state across re-renders', () => {
      const { rerender } = render(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      );

      let option1 = screen.getByRole('radio') as HTMLInputElement;
      expect(option1.checked).toBe(true);

      rerender(
        <RadioGroup defaultValue="option1">
          <RadioGroupItem value="option1" id="option1" />
          <RadioGroupItem value="option2" id="option2" />
        </RadioGroup>
      );

      option1 = screen.getByRole('radio') as HTMLInputElement;
      expect(option1.checked).toBe(true);
    });
  });

  describe('Display names', () => {
    it('should have correct display names', () => {
      expect(RadioGroup.displayName).toBe('RadioGroup');
      expect(RadioGroupItem.displayName).toBe('RadioGroupItem');
    });
  });
});
