import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  describe('rendering', () => {
    it('should render with active status', () => {
      render(<StatusBadge status="active" />);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Active');
      expect(badge).toHaveAttribute('aria-label', 'Status: Active');
    });

    it('should render with maintenance status', () => {
      render(<StatusBadge status="maintenance" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Maintenance');
      expect(badge).toHaveAttribute('aria-label', 'Status: Maintenance');
    });

    it('should render with out-of-service status', () => {
      render(<StatusBadge status="out-of-service" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Out of Service');
    });

    it('should render with emergency status', () => {
      render(<StatusBadge status="emergency" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Emergency');
    });

    it('should render with idle status', () => {
      render(<StatusBadge status="idle" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Idle');
    });

    it('should render with in-transit status', () => {
      render(<StatusBadge status="in-transit" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('In Transit');
    });

    it('should render with parked status', () => {
      render(<StatusBadge status="parked" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Parked');
    });
  });

  describe('case insensitivity', () => {
    it('should handle uppercase status', () => {
      render(<StatusBadge status="ACTIVE" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Active');
    });

    it('should handle mixed case status', () => {
      render(<StatusBadge status="MaiNteNanCe" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Maintenance');
    });
  });

  describe('unknown status', () => {
    it('should render unknown status as-is', () => {
      render(<StatusBadge status="custom-status" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('custom-status');
    });

    it('should apply default styling for unknown status', () => {
      render(<StatusBadge status="unknown" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-muted');
    });
  });

  describe('icon display', () => {
    it('should show icon by default', () => {
      const { container } = render(<StatusBadge status="active" />);

      // Check for SVG icon
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should hide icon when showIcon is false', () => {
      const { container } = render(<StatusBadge status="active" showIcon={false} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Active');

      const icon = container.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });

    it('should show icon when showIcon is true', () => {
      const { container } = render(<StatusBadge status="maintenance" showIcon={true} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should apply custom className', () => {
      render(<StatusBadge status="active" className="custom-class" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('custom-class');
    });

    it('should apply success color for active status', () => {
      render(<StatusBadge status="active" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-success');
    });

    it('should apply warning color for maintenance status', () => {
      render(<StatusBadge status="maintenance" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-warning');
    });

    it('should apply destructive color for out-of-service status', () => {
      render(<StatusBadge status="out-of-service" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-destructive');
    });

    it('should apply destructive color for emergency status', () => {
      render(<StatusBadge status="emergency" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('text-destructive');
    });
  });

  describe('accessibility', () => {
    it('should have role="status"', () => {
      render(<StatusBadge status="active" />);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should have descriptive aria-label', () => {
      render(<StatusBadge status="maintenance" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Status: Maintenance');
    });

    it('should mark icon as aria-hidden', () => {
      const { container } = render(<StatusBadge status="active" />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should provide aria-label for custom status', () => {
      render(<StatusBadge status="custom-status" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Status: custom-status');
    });
  });

  describe('all status configurations', () => {
    const statuses = [
      'active',
      'in-transit',
      'parked',
      'idle',
      'maintenance',
      'out-of-service',
      'emergency'
    ];

    statuses.forEach(status => {
      it(`should render ${status} status correctly`, () => {
        render(<StatusBadge status={status} />);

        const badge = screen.getByRole('status');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Status:'));
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty string status', () => {
      render(<StatusBadge status="" />);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });

    it('should handle very long status text', () => {
      const longStatus = 'this-is-a-very-long-status-that-should-still-render-correctly';
      render(<StatusBadge status={longStatus} />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent(longStatus);
    });

    it('should handle status with special characters', () => {
      render(<StatusBadge status="status-with-dashes" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('status-with-dashes');
    });
  });

  describe('className merging', () => {
    it('should merge className with default classes', () => {
      render(<StatusBadge status="active" className="extra-class" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('extra-class');
      expect(badge).toHaveClass('flex');
      expect(badge).toHaveClass('items-center');
    });

    it('should allow className override', () => {
      render(<StatusBadge status="active" className="bg-custom" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('bg-custom');
    });
  });
});
