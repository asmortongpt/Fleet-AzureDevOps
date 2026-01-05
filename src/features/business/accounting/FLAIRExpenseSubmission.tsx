/**
 * FLAIR Expense Submission Component
 * Interface for submitting expenses to Florida's FLAIR accounting system
 * Supports travel, mileage, fuel, maintenance and other fleet-related expenses
 */

import React, { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { flairIntegrationService, FLAIRExpenseEntry, FLAIRDocument } from '../../services/FLAIRIntegration';

// Component props interface
interface FLAIRExpenseSubmissionProps {
  onSubmissionComplete?: (entry: FLAIRExpenseEntry) => void;
  onError?: (error: string) => void;
  className?: string;
}

// Expense type configuration
type ExpenseType =
  | 'travel_mileage'
  | 'fuel'
  | 'maintenance'
  | 'vehicle_rental'
  | 'parking'
  | 'tolls';

const EXPENSE_TYPES: Record<
  ExpenseType,
  {
    label: string;
    icon: string;
    description: string;
    requiresApproval: boolean;
    documentationRequired: boolean;
  }
> = {
  travel_mileage: {
    label: 'Travel Mileage',
    icon: '🚗',
    description: 'Mileage reimbursement for official travel',
    requiresApproval: true,
    documentationRequired: true
  },
  fuel: {
    label: 'Fuel Purchase',
    icon: '⛽',
    description: 'Fuel purchases for state vehicles',
    requiresApproval: false,
    documentationRequired: true
  },
  maintenance: {
    label: 'Vehicle Maintenance',
    icon: '🔧',
    description: 'Vehicle maintenance and repairs',
    requiresApproval: true,
    documentationRequired: true
  },
  vehicle_rental: {
    label: 'Vehicle Rental',
    icon: '🚙',
    description: 'Vehicle rental expenses',
    requiresApproval: true,
    documentationRequired: true
  },
  parking: {
    label: 'Parking Fees',
    icon: '🅿️',
    description: 'Parking fees during official travel',
    requiresApproval: false,
    documentationRequired: false
  },
  tolls: {
    label: 'Toll Charges',
    icon: '💳',
    description: 'Toll charges during official travel',
    requiresApproval: false,
    documentationRequired: false
  }
};

// Expense type selector
const ExpenseTypeSelector: React.FC<{
  selectedType: ExpenseType | null;
  onSelect: (type: ExpenseType) => void;
}> = ({ selectedType, onSelect }) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Select Expense Type</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(EXPENSE_TYPES).map(([type, config]) => (
          <button
            key={type}
            onClick={() => onSelect(type as ExpenseType)}
            className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${
              selectedType === type
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-2 sm:space-x-3">
              <span className="text-xl sm:text-2xl">{config.icon}</span>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">{config.label}</h4>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{config.description}</p>
                <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                  {config.requiresApproval && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Approval Required
                    </span>
                  )}
                  {config.documentationRequired && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Documentation Required
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Fuel expense form
const FuelExpenseForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    fuelAmount: '',
    fuelCost: '',
    transactionDate: '',
    vendorName: '',
    cardNumber: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      fuelAmount: parseFloat(formData.fuelAmount),
      fuelCost: parseFloat(formData.fuelCost)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle ID/License Plate
          </label>
          <input
            type="text"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            placeholder="e.g., FL-001 or ABC123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
          <input
            type="text"
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
            placeholder="e.g., Shell, BP, Exxon"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fuel Amount (Gallons)
          </label>
          <input
            type="number"
            value={formData.fuelAmount}
            onChange={(e) => setFormData({ ...formData, fuelAmount: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
          <input
            type="number"
            value={formData.fuelCost}
            onChange={(e) => setFormData({ ...formData, fuelCost: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
          <input
            type="date"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fleet Card Number (Last 4 digits)
          </label>
          <input
            type="text"
            value={formData.cardNumber}
            onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
            placeholder="****"
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes about the fuel purchase"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

// Maintenance expense form
const MaintenanceExpenseForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    maintenanceType: '',
    amount: '',
    transactionDate: '',
    vendorName: '',
    workOrderNumber: '',
    description: ''
  });

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_replacement', label: 'Tire Replacement' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'engine_repair', label: 'Engine Repair' },
    { value: 'transmission_service', label: 'Transmission Service' },
    { value: 'inspection', label: 'State Inspection' },
    { value: 'other', label: 'Other Maintenance' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vehicle ID/License Plate
          </label>
          <input
            type="text"
            value={formData.vehicleId}
            onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
            placeholder="e.g., FL-001 or ABC123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance Type</label>
          <select
            value={formData.maintenanceType}
            onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select maintenance type</option>
            {maintenanceTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Date</label>
          <input
            type="date"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Service Provider</label>
          <input
            type="text"
            value={formData.vendorName}
            onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
            placeholder="e.g., Joe's Auto Shop"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Order Number</label>
          <input
            type="text"
            value={formData.workOrderNumber}
            onChange={(e) => setFormData({ ...formData, workOrderNumber: e.target.value })}
            placeholder="WO-2023-12345"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description of Work</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the maintenance work performed"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

// Vehicle rental form
const VehicleRentalForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    rentalCompany: '',
    vehicleType: '',
    rentalPeriodStart: '',
    rentalPeriodEnd: '',
    dailyRate: '',
    totalCost: '',
    pickupLocation: '',
    dropoffLocation: '',
    purposeCode: '',
    description: ''
  });

  const purposeCodes = [
    { code: 'MEETING', label: 'Official Meeting' },
    { code: 'TRAINING', label: 'Training/Conference' },
    { code: 'INSPECTION', label: 'Site Inspection' },
    { code: 'TRANSPORT', label: 'Personnel Transport' },
    { code: 'EMERGENCY', label: 'Emergency Response' },
    { code: 'OTHER', label: 'Other Official Business' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dailyRate: parseFloat(formData.dailyRate),
      totalCost: parseFloat(formData.totalCost)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rental Company</label>
          <input
            type="text"
            value={formData.rentalCompany}
            onChange={(e) => setFormData({ ...formData, rentalCompany: e.target.value })}
            placeholder="e.g., Enterprise, Hertz, Avis"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
          <input
            type="text"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
            placeholder="e.g., Compact Car, SUV, Van"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rental Start Date</label>
          <input
            type="date"
            value={formData.rentalPeriodStart}
            onChange={(e) => setFormData({ ...formData, rentalPeriodStart: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rental End Date</label>
          <input
            type="date"
            value={formData.rentalPeriodEnd}
            onChange={(e) => setFormData({ ...formData, rentalPeriodEnd: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Daily Rate</label>
          <input
            type="number"
            value={formData.dailyRate}
            onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Cost</label>
          <input
            type="number"
            value={formData.totalCost}
            onChange={(e) => setFormData({ ...formData, totalCost: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose Code</label>
          <select
            value={formData.purposeCode}
            onChange={(e) => setFormData({ ...formData, purposeCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select purpose</option>
            {purposeCodes.map((purpose) => (
              <option key={purpose.code} value={purpose.code}>
                {purpose.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
          <input
            type="text"
            value={formData.pickupLocation}
            onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
            placeholder="Address or location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Drop-off Location</label>
          <input
            type="text"
            value={formData.dropoffLocation}
            onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
            placeholder="Address or location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the purpose and details of the rental"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

// Parking fees form
const ParkingFeesForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    location: '',
    amount: '',
    transactionDate: '',
    duration: '',
    purposeCode: '',
    description: ''
  });

  const purposeCodes = [
    { code: 'MEETING', label: 'Official Meeting' },
    { code: 'TRAINING', label: 'Training/Conference' },
    { code: 'COURT', label: 'Court Appearance' },
    { code: 'INSPECTION', label: 'Site Inspection' },
    { code: 'CLIENT_VISIT', label: 'Client Visit' },
    { code: 'OTHER', label: 'Other Official Business' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Parking Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Downtown Parking Garage, Meter #123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 2 hours, 30 minutes"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose Code</label>
          <select
            value={formData.purposeCode}
            onChange={(e) => setFormData({ ...formData, purposeCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select purpose</option>
            {purposeCodes.map((purpose) => (
              <option key={purpose.code} value={purpose.code}>
                {purpose.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about the parking expense"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

// Toll charges form
const TollChargesForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    tollRoad: '',
    amount: '',
    transactionDate: '',
    transponderNumber: '',
    originLocation: '',
    destinationLocation: '',
    purposeCode: '',
    description: ''
  });

  const purposeCodes = [
    { code: 'MEETING', label: 'Official Meeting' },
    { code: 'TRAINING', label: 'Training/Conference' },
    { code: 'INSPECTION', label: 'Site Inspection' },
    { code: 'TRANSPORT', label: 'Personnel Transport' },
    { code: 'EMERGENCY', label: 'Emergency Response' },
    { code: 'OTHER', label: 'Other Official Business' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Toll Road/Authority
          </label>
          <input
            type="text"
            value={formData.tollRoad}
            onChange={(e) => setFormData({ ...formData, tollRoad: e.target.value })}
            placeholder="e.g., Florida Turnpike, I-95 Express"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={formData.transactionDate}
            onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transponder/SunPass Number
          </label>
          <input
            type="text"
            value={formData.transponderNumber}
            onChange={(e) => setFormData({ ...formData, transponderNumber: e.target.value })}
            placeholder="e.g., SP-123456789"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Origin</label>
          <input
            type="text"
            value={formData.originLocation}
            onChange={(e) => setFormData({ ...formData, originLocation: e.target.value })}
            placeholder="Starting location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
          <input
            type="text"
            value={formData.destinationLocation}
            onChange={(e) => setFormData({ ...formData, destinationLocation: e.target.value })}
            placeholder="Ending location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="sm:col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose Code</label>
          <select
            value={formData.purposeCode}
            onChange={(e) => setFormData({ ...formData, purposeCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select purpose</option>
            {purposeCodes.map((purpose) => (
              <option key={purpose.code} value={purpose.code}>
                {purpose.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional details about the travel"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Continue'}
        </button>
      </div>
    </form>
  );
};

// Travel mileage form
const TravelMileageForm: React.FC<{
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState({
    originAddress: '',
    destinationAddress: '',
    mileage: '',
    mileageRate: '0.67', // Current Florida rate
    travelDate: '',
    purposeCode: '',
    description: ''
  });

  const purposeCodes = [
    { code: 'MEETING', label: 'Official Meeting' },
    { code: 'TRAINING', label: 'Training/Conference' },
    { code: 'INSPECTION', label: 'Site Inspection' },
    { code: 'CLIENT_VISIT', label: 'Client Visit' },
    { code: 'COURT', label: 'Court Appearance' },
    { code: 'OTHER', label: 'Other Official Business' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      mileage: parseFloat(formData.mileage),
      mileageRate: parseFloat(formData.mileageRate)
    });
  };

  const totalAmount = (parseFloat(formData.mileage) || 0) * (parseFloat(formData.mileageRate) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Origin Address</label>
          <input
            type="text"
            value={formData.originAddress}
            onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
            placeholder="e.g., 1317 Winewood Blvd, Tallahassee, FL 32399"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={formData.destinationAddress}
            onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
            placeholder="e.g., 2555 Shumard Oak Blvd, Tallahassee, FL 32399"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Mileage</label>
          <input
            type="number"
            value={formData.mileage}
            onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
            placeholder="0.0"
            step="0.1"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mileage Rate (per mile)
          </label>
          <input
            type="number"
            value={formData.mileageRate}
            onChange={(e) => setFormData({ ...formData, mileageRate: e.target.value })}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Travel Date</label>
          <input
            type="date"
            value={formData.travelDate}
            onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Purpose Code</label>
          <select
            value={formData.purposeCode}
            onChange={(e) => setFormData({ ...formData, purposeCode: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select purpose</option>
            {purposeCodes.map((purpose) => (
              <option key={purpose.code} value={purpose.code}>
                {purpose.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of the travel purpose"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Total amount display */}
      {totalAmount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Total Reimbursement:</span>
            <span className="text-lg font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Form actions */}
      <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting || totalAmount <= 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Submitting...' : 'Submit to FLAIR'}
        </button>
      </div>
    </form>
  );
};

// Document upload component
const DocumentUpload: React.FC<{
  documents: FLAIRDocument[];
  onDocumentAdd: (document: FLAIRDocument) => void;
  onDocumentRemove: (documentId: string) => void;
  required?: boolean;
}> = ({ documents, onDocumentAdd, onDocumentRemove, required = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const document: FLAIRDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        documentType: 'receipt', // Default type
        base64Content: base64.split(',')[1], // Remove data URL prefix
        checksum: `md5_${Date.now()}` // Would be actual MD5 in production
      };

      onDocumentAdd(document);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Supporting Documents</h4>
        {required && <span className="text-sm text-red-600">* Required</span>}
      </div>

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📎</div>
          <div className="text-sm text-gray-600 mb-2">
            Drag and drop files here, or{' '}
            <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
              browse
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
          <div className="text-xs text-gray-500">
            Supports PDF, images, and Office documents (max 10MB each)
          </div>
        </div>
      </div>

      {/* Document list */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📄</span>
                <div>
                  <div className="font-medium text-sm">{doc.fileName}</div>
                  <div className="text-xs text-gray-500">
                    {(doc.fileSize / 1024).toFixed(1)} KB • Uploaded{' '}
                    {new Date(doc.uploadedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDocumentRemove(doc.id)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main FLAIR expense submission component
export const FLAIRExpenseSubmission: React.FC<FLAIRExpenseSubmissionProps> = ({
  onSubmissionComplete,
  onError,
  className = ''
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'select' | 'form' | 'documents' | 'review'>(
    'select'
  );
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [formData, setFormData] = useState<any>(null);
  const [documents, setDocuments] = useState<FLAIRDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle expense type selection
  const handleTypeSelect = (type: ExpenseType) => {
    setSelectedType(type);
    setCurrentStep('form');
  };

  // Handle form submission
  const handleFormSubmit = (data: any) => {
    setFormData(data);

    const config = EXPENSE_TYPES[selectedType!];

    if (config.documentationRequired) {
      setCurrentStep('documents');
    } else {
      setCurrentStep('review');
    }
  };

  // Handle document management
  const handleDocumentAdd = (document: FLAIRDocument) => {
    setDocuments((prev) => [...prev, document]);
  };

  const handleDocumentRemove = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  // Handle final submission
  const handleFinalSubmit = async () => {
    if (!selectedType || !formData || !user) {
      setError('Missing required information');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let expenseEntry: FLAIRExpenseEntry;

      if (selectedType === 'travel_mileage') {
        expenseEntry = await flairIntegrationService.submitTravelMileageExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          originAddress: formData.originAddress,
          destinationAddress: formData.destinationAddress,
          mileage: formData.mileage,
          mileageRate: formData.mileageRate,
          travelDate: formData.travelDate,
          purposeCode: formData.purposeCode,
          supportingDocuments: documents
        });
      } else if (selectedType === 'fuel') {
        expenseEntry = await flairIntegrationService.submitFuelExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          vehicleId: formData.vehicleId,
          fuelAmount: formData.fuelAmount,
          fuelCost: formData.fuelCost,
          transactionDate: formData.transactionDate,
          vendorName: formData.vendorName,
          supportingDocuments: documents
        });
      } else if (selectedType === 'maintenance') {
        expenseEntry = await flairIntegrationService.submitMaintenanceExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          vehicleId: formData.vehicleId,
          maintenanceType: formData.maintenanceType,
          amount: formData.amount,
          transactionDate: formData.transactionDate,
          vendorName: formData.vendorName,
          workOrderNumber: formData.workOrderNumber,
          supportingDocuments: documents
        });
      } else if (selectedType === 'vehicle_rental') {
        expenseEntry = await flairIntegrationService.submitVehicleRentalExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          rentalCompany: formData.rentalCompany,
          vehicleType: formData.vehicleType,
          rentalPeriodStart: formData.rentalPeriodStart,
          rentalPeriodEnd: formData.rentalPeriodEnd,
          dailyRate: formData.dailyRate,
          totalCost: formData.totalCost,
          pickupLocation: formData.pickupLocation,
          dropoffLocation: formData.dropoffLocation,
          purposeCode: formData.purposeCode,
          supportingDocuments: documents
        });
      } else if (selectedType === 'parking') {
        expenseEntry = await flairIntegrationService.submitParkingExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          location: formData.location,
          amount: formData.amount,
          transactionDate: formData.transactionDate,
          duration: formData.duration,
          purposeCode: formData.purposeCode,
          supportingDocuments: documents
        });
      } else if (selectedType === 'tolls') {
        expenseEntry = await flairIntegrationService.submitTollExpense({
          employeeId: user.employeeId,
          employeeName: user.fullName,
          department: user.department,
          tollRoad: formData.tollRoad,
          amount: formData.amount,
          transactionDate: formData.transactionDate,
          transponderNumber: formData.transponderNumber,
          originLocation: formData.originLocation,
          destinationLocation: formData.destinationLocation,
          purposeCode: formData.purposeCode,
          supportingDocuments: documents
        });
      } else {
        throw new Error('Unsupported expense type');
      }

      onSubmissionComplete?.(expenseEntry);

      // Reset form
      setCurrentStep('select');
      setSelectedType(null);
      setFormData(null);
      setDocuments([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Submission failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 'select':
        return <ExpenseTypeSelector selectedType={selectedType} onSelect={handleTypeSelect} />;

      case 'form':
        if (selectedType === 'travel_mileage') {
          return (
            <TravelMileageForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        } else if (selectedType === 'fuel') {
          return (
            <FuelExpenseForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        } else if (selectedType === 'maintenance') {
          return (
            <MaintenanceExpenseForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        } else if (selectedType === 'vehicle_rental') {
          return (
            <VehicleRentalForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        } else if (selectedType === 'parking') {
          return (
            <ParkingFeesForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        } else if (selectedType === 'tolls') {
          return (
            <TollChargesForm
              onSubmit={handleFormSubmit}
              onCancel={() => setCurrentStep('select')}
              isSubmitting={isSubmitting}
            />
          );
        }
        return <div>Unsupported expense type</div>;

      case 'documents':
        const config = EXPENSE_TYPES[selectedType!];
        return (
          <div className="space-y-6">
            <DocumentUpload
              documents={documents}
              onDocumentAdd={handleDocumentAdd}
              onDocumentRemove={handleDocumentRemove}
              required={config.documentationRequired}
            />
            <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
              <button
                onClick={() => setCurrentStep('form')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentStep('review')}
                disabled={config.documentationRequired && documents.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Review →
              </button>
            </div>
          </div>
        );

      case 'review':
        const expenseConfig = EXPENSE_TYPES[selectedType!];
        const totalAmount = (() => {
          switch (selectedType) {
            case 'travel_mileage':
              return (formData?.mileage || 0) * (formData?.mileageRate || 0);
            case 'fuel':
              return formData?.fuelCost || 0;
            case 'vehicle_rental':
              return formData?.totalCost || 0;
            default:
              return formData?.amount || 0;
          }
        })();

        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review Submission</h3>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{expenseConfig.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{expenseConfig.label}</h4>
                  <p className="text-sm text-gray-600">{expenseConfig.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Employee:</span>
                  <div>{user?.fullName}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Department:</span>
                  <div>{user?.department}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Amount:</span>
                  <div className="text-lg font-semibold text-green-600">
                    ${totalAmount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Documents:</span>
                  <div>{documents.length} attached</div>
                </div>
              </div>
            </div>

            {expenseConfig.requiresApproval && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-600">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <strong>Approval Required:</strong> This expense will require supervisor
                    approval before processing.
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
              <button
                onClick={() => setCurrentStep(documents.length > 0 ? 'documents' : 'form')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting to FLAIR...' : 'Submit to FLAIR'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">FLAIR Expense Submission</h2>
        <p className="text-gray-600">
          Submit fleet-related expenses to Florida's FLAIR accounting system
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600">❌</span>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Step content */}
      {renderStep()}
    </div>
  );
};

export default FLAIRExpenseSubmission;
