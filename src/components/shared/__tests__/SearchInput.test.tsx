import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { SearchInput } from '../SearchInput';

// Mock useDebounce hook
vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string, _delay: number) => {
    return value; // For testing, return immediately
  }
}));

describe('SearchInput', () => {
  let mockOnChange: vi.MockedFunction<(value: string) => void>;
  let mockOnDebouncedChange: vi.MockedFunction<(value: string) => void>;

  beforeEach(() => {
    mockOnChange = vi.fn<(value: string) => void>();
    mockOnDebouncedChange = vi.fn<(value: string) => void>();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      render(<SearchInput onChange={mockOnChange} placeholder="Search vehicles..." />);

      const input = screen.getByPlaceholderText('Search vehicles...');
      expect(input).toBeInTheDocument();
    });

    it('should render with default placeholder', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByPlaceholderText('Search...');
      expect(input).toBeInTheDocument();
    });

    it('should render search icon', () => {
      const { container } = render(<SearchInput onChange={mockOnChange} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not show clear button initially', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const clearButton = screen.queryByLabelText('Clear search');
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('controlled input', () => {
    it('should display controlled value', () => {
      render(<SearchInput value="test query" onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('should update when controlled value changes', () => {
      const { rerender } = render(<SearchInput value="initial" onChange={mockOnChange} />);

      let input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('initial');

      rerender(<SearchInput value="updated" onChange={mockOnChange} />);

      input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('updated');
    });

    it('should sync internal state with controlled value', () => {
      const { rerender } = render(<SearchInput value="" onChange={mockOnChange} />);

      rerender(<SearchInput value="external update" onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('external update');
    });
  });

  describe('user interaction', () => {
    it('should call onChange when user types', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      expect(mockOnChange).toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenLastCalledWith('test');
    });

    it('should update input value as user types', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      await user.type(input, 'hello');

      expect(input.value).toBe('hello');
    });

    it('should call onChange for each character typed', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'abc');

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'a');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'ab');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'abc');
    });

    it('should handle paste events', async () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      fireEvent.paste(input, {
        clipboardData: { getData: () => 'pasted text' }
      });

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('clear button', () => {
    it('should show clear button when input has value', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(input.value).toBe('');
    });

    it('should call onChange with empty string when cleared', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      mockOnChange.mockClear();

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should call onDebouncedChange when cleared', async () => {
      const user = userEvent.setup();
      render(
        <SearchInput
          onChange={mockOnChange}
          onDebouncedChange={mockOnDebouncedChange}
        />
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(mockOnDebouncedChange).toHaveBeenCalledWith('');
    });

    it('should hide clear button after clearing', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
      });
    });
  });

  describe('debounced change', () => {
    it('should call onDebouncedChange when provided', async () => {
      const user = userEvent.setup();
      render(
        <SearchInput
          onChange={mockOnChange}
          onDebouncedChange={mockOnDebouncedChange}
        />
      );

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      await waitFor(() => {
        expect(mockOnDebouncedChange).toHaveBeenCalled();
      });
    });

    it('should work without onDebouncedChange', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have role="searchbox"', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
    });

    it('should use placeholder as aria-label by default', () => {
      render(<SearchInput onChange={mockOnChange} placeholder="Search vehicles" />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Search vehicles');
    });

    it('should use custom aria-label when provided', () => {
      render(
        <SearchInput
          onChange={mockOnChange}
          placeholder="Search"
          ariaLabel="Search fleet vehicles"
        />
      );

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-label', 'Search fleet vehicles');
    });

    it('should have autocomplete="off"', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('autocomplete', 'off');
    });

    it('should have type="search"', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('type', 'search');
    });

    it('should support custom id', () => {
      render(<SearchInput onChange={mockOnChange} id="vehicle-search" />);

      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('id', 'vehicle-search');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');

      await user.tab();
      expect(input).toHaveFocus();

      await user.keyboard('test');
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should allow clear button to be keyboard accessible', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      const clearButton = screen.getByLabelText('Clear search');
      await user.tab();

      expect(clearButton).toHaveFocus();
    });
  });

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(<SearchInput onChange={mockOnChange} disabled={true} />);

      const input = screen.getByRole('searchbox');
      expect(input).toBeDisabled();
    });

    it('should enable input by default', () => {
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      expect(input).not.toBeDisabled();
    });

    it('should disable clear button when input is disabled', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="test" onChange={mockOnChange} disabled={true} />);

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <SearchInput onChange={mockOnChange} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have search icon on the left', () => {
      const { container } = render(<SearchInput onChange={mockOnChange} />);

      const icon = container.querySelector('.left-3');
      expect(icon).toBeInTheDocument();
    });

    it('should add padding for clear button when value exists', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'test');

      expect(input).toHaveClass('pr-9');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid typing', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, 'quicktypingtest');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle backspace', async () => {
      const user = userEvent.setup();
      render(<SearchInput value="test" onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should handle special characters', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, '@#$%^&*()');

      const inputElement = input as HTMLInputElement;
      expect(inputElement.value).toBe('@#$%^&*()');
    });

    it('should handle unicode characters', async () => {
      const user = userEvent.setup();
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, '你好世界');

      const inputElement = input as HTMLInputElement;
      expect(inputElement.value).toBe('你好世界');
    });

    it('should handle empty string value', () => {
      render(<SearchInput value="" onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should handle long text input', async () => {
      const user = userEvent.setup();
      const longText = 'a'.repeat(1000);
      render(<SearchInput onChange={mockOnChange} />);

      const input = screen.getByRole('searchbox');
      await user.type(input, longText);

      const inputElement = input as HTMLInputElement;
      expect(inputElement.value).toBe(longText);
    });
  });
});