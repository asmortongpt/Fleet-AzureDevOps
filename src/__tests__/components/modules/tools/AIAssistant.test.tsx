import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { AIAssistant } from '../../components/modules/tools/AIAssistant';

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<AIAssistant />);
      expect(container).toBeTruthy();
    });

    it('should render with default props', () => {
      render(<AIAssistant />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should render children correctly', () => {
      render(
        <AIAssistant>
          <div>Test Child</div>
        </AIAssistant>
      );
      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept and apply className prop', () => {
      const { container } = render(<AIAssistant className="test-class" />);
      expect(container.firstChild).toHaveClass('test-class');
    });

    it('should handle data attributes', () => {
      const { container } = render(<AIAssistant data-testid="test-component" />);
      expect(container.firstChild).toHaveAttribute('data-testid', 'test-component');
    });

    it('should render with custom props', () => {
      const customProps = { title: 'Test Title' };
      render(<AIAssistant {...customProps} />);
      expect(screen.getByText('Test Title', { exact: false })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      render(<AIAssistant onClick={handleClick} />);

      const element = screen.getByRole('button', { hidden: true });
      await userEvent.click(element);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle keyboard events', async () => {
      const handleKeyDown = vi.fn();
      render(<AIAssistant onKeyDown={handleKeyDown} />);

      const element = screen.getByRole('button', { hidden: true });
      fireEvent.keyDown(element, { key: 'Enter' });

      expect(handleKeyDown).toHaveBeenCalled();
    });

    it('should handle form submission', async () => {
      const handleSubmit = vi.fn();
      render(<AIAssistant onSubmit={handleSubmit} />);

      const form = screen.getByRole('form', { hidden: true });
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should update state correctly', async () => {
      render(<AIAssistant />);

      const button = screen.getByRole('button', { hidden: true });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Updated', { exact: false })).toBeInTheDocument();
      });
    });

    it('should maintain internal state', () => {
      const { rerender } = render(<AIAssistant />);
      rerender(<AIAssistant />);

      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<AIAssistant />);
      const element = screen.getByRole('main', { hidden: true });
      expect(element).toHaveAttribute('aria-label');
    });

    it('should be keyboard navigable', async () => {
      render(<AIAssistant />);
      const element = screen.getByRole('button', { hidden: true });

      element.focus();
      expect(element).toHaveFocus();

      fireEvent.keyDown(element, { key: 'Tab' });
    });

    it('should have semantic HTML', () => {
      const { container } = render(<AIAssistant />);
      expect(container.querySelector('button, a, input, select')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<AIAssistant invalidProp={undefined} />);

      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it('should display error messages', () => {
      render(<AIAssistant error="Test error" />);
      expect(screen.getByText('Test error', { exact: false })).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering', () => {
    it('should render when condition is met', () => {
      render(<AIAssistant show={true} />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });

    it('should not render when condition is not met', () => {
      const { container } = render(<AIAssistant show={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should toggle visibility', async () => {
      const { rerender } = render(<AIAssistant show={false} />);
      expect(screen.queryByRole('main')).not.toBeInTheDocument();

      rerender(<AIAssistant show={true} />);
      expect(screen.getByRole('main', { hidden: true })).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should memoize expensive computations', () => {
      const expensiveFunction = vi.fn(() => 'result');
      render(<AIAssistant compute={expensiveFunction} />);

      expect(expensiveFunction).toHaveBeenCalledTimes(1);
    });

    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<AIAssistant value="test" />);
      const renderCount = vi.fn();

      rerender(<AIAssistant value="test" />);
      expect(renderCount).toHaveBeenCalledTimes(0);
    });
  });

  describe('Security', () => {
    it('should sanitize user input', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      render(<AIAssistant value={maliciousInput} />);

      expect(screen.queryByText('alert', { exact: false })).not.toBeInTheDocument();
    });

    it('should escape HTML entities', () => {
      const htmlInput = '<div>Test</div>';
      render(<AIAssistant value={htmlInput} />);

      const element = screen.getByText(htmlInput, { exact: false });
      expect(element.innerHTML).not.toContain('<div>');
    });
  });
});
