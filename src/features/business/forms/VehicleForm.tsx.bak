/**
 * Vehicle Data Entry Form
 * Allows manual input of vehicle data to the real database
 * 0% Mock Data - All data saved to SQLite database
 */

import React, { useState } from 'react';

import { api } from '@/lib/api';

interface VehicleFormData {
  fleet_number: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  type: string;
  fuel_type: string;
  status: string;
  department: string;
  mileage: number;
  fuel_level: number;
}

interface VehicleFormProps {
  onSuccess?: (vehicle: any) => void;
  onCancel?: () => void;
}

const VehicleForm: React.FC<VehicleFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState<VehicleFormData>({
    fleet_number: '',
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    license_plate: '',
    type: 'sedan',
    fuel_type: 'gas',
    status: 'active',
    department: 'Operations',
    mileage: 0,
    fuel_level: 100
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'mileage' || name === 'fuel_level'
        ? parseInt(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const vehicle = await api.post('/vehicles', formData);
      // console.log('✅ Vehicle created in database:', vehicle);

      if (onSuccess) {
        onSuccess(vehicle);
      }

      // Reset form
      setFormData({
        fleet_number: '',
        vin: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        license_plate: '',
        type: 'sedan',
        fuel_type: 'gas',
        status: 'active',
        department: 'Operations',
        mileage: 0,
        fuel_level: 100
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
      console.error('❌ Vehicle creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm max-w-2xl mx-auto">
      <h2 className="text-sm font-bold mb-3 text-gray-800">Add New Vehicle</h2>
      <p className="text-sm text-slate-700 mb-2">
        🔄 Real Database Entry - Data will be saved to SQLite database
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-2 py-3 rounded mb-2">
          Error: {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label htmlFor="fleet_number" className="block text-sm font-medium text-gray-700 mb-1">
              Fleet Number *
            </label>
            <input
              type="text"
              id="fleet_number"
              name="fleet_number"
              value={formData.fleet_number}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., FL-001"
            />
          </div>

          <div>
            <label htmlFor="vin" className="block text-sm font-medium text-gray-700 mb-1">
              VIN *
            </label>
            <input
              type="text"
              id="vin"
              name="vin"
              value={formData.vin}
              onChange={handleChange}
              required
              maxLength={17}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="17-character VIN"
            />
          </div>

          <div>
            <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
              Make *
            </label>
            <input
              type="text"
              id="make"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ford"
            />
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., F-150"
            />
          </div>

          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              min={1990}
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700 mb-1">
              License Plate *
            </label>
            <input
              type="text"
              id="license_plate"
              name="license_plate"
              value={formData.license_plate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., ABC-123"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="pickup">Pickup Truck</option>
              <option value="van">Van</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Type *
            </label>
            <select
              id="fuel_type"
              name="fuel_type"
              value={formData.fuel_type}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gas">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="maintenance">In Maintenance</option>
              <option value="retired">Retired</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department *
            </label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Operations">Operations</option>
              <option value="Administration">Administration</option>
              <option value="Emergency Response">Emergency Response</option>
              <option value="Investigations">Investigations</option>
              <option value="Facilities">Facilities</option>
              <option value="Client Transport">Client Transport</option>
              <option value="District 1">District 1</option>
              <option value="District 2">District 2</option>
              <option value="District 3">District 3</option>
            </select>
          </div>

          <div>
            <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">
              Current Mileage
            </label>
            <input
              type="number"
              id="mileage"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="fuel_level" className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Level (%)
            </label>
            <input
              type="number"
              id="fuel_level"
              name="fuel_level"
              value={formData.fuel_level}
              onChange={handleChange}
              min={0}
              max={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white py-2 px-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Vehicle...' : 'Create Vehicle'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VehicleForm;