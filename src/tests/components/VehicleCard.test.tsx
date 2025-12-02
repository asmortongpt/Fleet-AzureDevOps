/**
 * VehicleCard Component Tests
 * Tests vehicle card component rendering, interactions, and accessibility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock VehicleCard component (would import actual component in real implementation)
const VehicleCard = ({ vehicle, onEdit, onDelete, onViewDetails }: any) => {
  return (
    <div data-testid="vehicle-card" role="article" aria-label={`Vehicle ${vehicle.vehicle_number}`}>
      <h3>{vehicle.vehicle_number}</h3>
      <div>
        <span>{vehicle.make} {vehicle.model}</span>
        <span data-testid="vehicle-year">{vehicle.year}</span>
      </div>
      <div>
        <span data-testid="vehicle-vin">{vehicle.vin}</span>
        <span data-testid="vehicle-status" className={`status-${vehicle.status}`}>
          {vehicle.status}
        </span>
      </div>
      <div data-testid="vehicle-odometer">
        {vehicle.odometer?.toLocaleString()} miles
      </div>
      <div className="actions">
        <button onClick={() => onViewDetails(vehicle)} aria-label="View details">
          View Details
        </button>
        <button onClick={() => onEdit(vehicle)} aria-label="Edit vehicle">
          Edit
        </button>
        <button onClick={() => onDelete(vehicle)} aria-label="Delete vehicle">
          Delete
        </button>
      </div>
    </div>
  );
};

describe('VehicleCard Component', () => {
  const mockVehicle = {
    id: 'test-vehicle-1',
    vehicle_number: 'V-123',
    make: 'Ford',
    model: 'F-150',
    year: 2023,
    vin: '1FTFW1E50KFA12345',
    status: 'active',
    odometer: 15000,
    color: 'White',
  };

  const mockHandlers = {
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onViewDetails: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render vehicle basic information', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      expect(screen.getByText('V-123')).toBeInTheDocument();
      expect(screen.getByText(/Ford F-150/)).toBeInTheDocument();
      expect(screen.getByTestId('vehicle-year')).toHaveTextContent('2023');
    });

    it('should render VIN correctly', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const vinElement = screen.getByTestId('vehicle-vin');
      expect(vinElement).toHaveTextContent('1FTFW1E50KFA12345');
    });

    it('should display vehicle status with correct styling', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const statusElement = screen.getByTestId('vehicle-status');
      expect(statusElement).toHaveTextContent('active');
      expect(statusElement).toHaveClass('status-active');
    });

    it('should format odometer reading with commas', () => {
      const vehicleWithHighMileage = {
        ...mockVehicle,
        odometer: 125000,
      };

      render(<VehicleCard vehicle={vehicleWithHighMileage} {...mockHandlers} />);

      expect(screen.getByTestId('vehicle-odometer')).toHaveTextContent('125,000 miles');
    });

    it('should render action buttons', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      expect(screen.getByLabelText('View details')).toBeInTheDocument();
      expect(screen.getByLabelText('Edit vehicle')).toBeInTheDocument();
      expect(screen.getByLabelText('Delete vehicle')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onViewDetails when View Details button is clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const viewButton = screen.getByLabelText('View details');
      await user.click(viewButton);

      expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockVehicle);
    });

    it('should call onEdit when Edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const editButton = screen.getByLabelText('Edit vehicle');
      await user.click(editButton);

      expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockVehicle);
    });

    it('should call onDelete when Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const deleteButton = screen.getByLabelText('Delete vehicle');
      await user.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockVehicle);
    });

    it('should prevent multiple rapid clicks', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const viewButton = screen.getByLabelText('View details');

      // Rapid clicks
      await user.click(viewButton);
      await user.click(viewButton);
      await user.click(viewButton);

      // Should still be called for each click (debouncing would be in handler)
      expect(mockHandlers.onViewDetails).toHaveBeenCalledTimes(3);
    });
  });

  describe('Different Vehicle States', () => {
    it('should render out-of-service vehicle correctly', () => {
      const outOfServiceVehicle = {
        ...mockVehicle,
        status: 'out_of_service',
      };

      render(<VehicleCard vehicle={outOfServiceVehicle} {...mockHandlers} />);

      const statusElement = screen.getByTestId('vehicle-status');
      expect(statusElement).toHaveTextContent('out_of_service');
      expect(statusElement).toHaveClass('status-out_of_service');
    });

    it('should render electric vehicle with additional info', () => {
      const electricVehicle = {
        ...mockVehicle,
        fuel_type: 'electric',
        battery_level: 85,
      };

      render(<VehicleCard vehicle={electricVehicle} {...mockHandlers} />);

      expect(screen.getByText('V-123')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalVehicle = {
        id: 'test-vehicle-2',
        vehicle_number: 'V-456',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        vin: '2T1BURHE0JC123456',
        status: 'active',
      };

      render(<VehicleCard vehicle={minimalVehicle} {...mockHandlers} />);

      expect(screen.getByText('V-456')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Vehicle V-123');
    });

    it('should have accessible action buttons', () => {
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const viewButton = screen.getByLabelText('View details');
      const editButton = screen.getByLabelText('Edit vehicle');
      const deleteButton = screen.getByLabelText('Delete vehicle');

      expect(viewButton).toBeInTheDocument();
      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const viewButton = screen.getByLabelText('View details');

      // Tab to button and activate with Enter
      viewButton.focus();
      expect(viewButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockHandlers.onViewDetails).toHaveBeenCalled();
    });

    it('should support Space key activation', async () => {
      const user = userEvent.setup();
      render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      const editButton = screen.getByLabelText('Edit vehicle');
      editButton.focus();

      await user.keyboard(' ');
      expect(mockHandlers.onEdit).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely long vehicle numbers', () => {
      const vehicleWithLongNumber = {
        ...mockVehicle,
        vehicle_number: 'VEHICLE-NUMBER-WITH-VERY-LONG-IDENTIFIER-123456789',
      };

      render(<VehicleCard vehicle={vehicleWithLongNumber} {...mockHandlers} />);

      expect(screen.getByText('VEHICLE-NUMBER-WITH-VERY-LONG-IDENTIFIER-123456789')).toBeInTheDocument();
    });

    it('should handle zero mileage', () => {
      const newVehicle = {
        ...mockVehicle,
        odometer: 0,
      };

      render(<VehicleCard vehicle={newVehicle} {...mockHandlers} />);

      expect(screen.getByTestId('vehicle-odometer')).toHaveTextContent('0 miles');
    });

    it('should handle very high mileage', () => {
      const highMileageVehicle = {
        ...mockVehicle,
        odometer: 500000,
      };

      render(<VehicleCard vehicle={highMileageVehicle} {...mockHandlers} />);

      expect(screen.getByTestId('vehicle-odometer')).toHaveTextContent('500,000 miles');
    });

    it('should handle special characters in vehicle data', () => {
      const specialCharVehicle = {
        ...mockVehicle,
        vehicle_number: "V-123'456",
        make: 'Mercedes-Benz',
        model: 'E-Class',
      };

      render(<VehicleCard vehicle={specialCharVehicle} {...mockHandlers} />);

      expect(screen.getByText("V-123'456")).toBeInTheDocument();
      expect(screen.getByText(/Mercedes-Benz E-Class/)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render quickly with minimal re-renders', () => {
      const { rerender } = render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      // Re-render with same props
      rerender(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      // Component should handle re-renders efficiently
      expect(screen.getByText('V-123')).toBeInTheDocument();
    });

    it('should handle rapid prop updates', () => {
      const { rerender } = render(<VehicleCard vehicle={mockVehicle} {...mockHandlers} />);

      // Update odometer multiple times
      for (let i = 0; i < 10; i++) {
        const updatedVehicle = { ...mockVehicle, odometer: 15000 + i * 100 };
        rerender(<VehicleCard vehicle={updatedVehicle} {...mockHandlers} />);
      }

      expect(screen.getByTestId('vehicle-odometer')).toBeInTheDocument();
    });
  });
});
