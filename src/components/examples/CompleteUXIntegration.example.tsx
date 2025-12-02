/**
 * Complete UX Integration Example
 *
 * This example demonstrates how to use all UX components together
 * in a realistic vehicle management scenario.
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { LoadingOverlay } from '../LoadingOverlay';
import { SkeletonTable } from '../SkeletonLoader';
import { ErrorMessage, FieldError } from '../ErrorMessage';
import { ToastContainer } from '../Toast';
import { Breadcrumb } from '../Breadcrumb';
import { useFormValidation } from '../../hooks/useFormValidation';
import { useToast } from '../../hooks/useToast';

// Mock API functions (replace with real API calls)
const mockFetchVehicles = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve([
      { id: '1', vin: '1HGCM82633A123456', make: 'Honda', model: 'Accord', year: 2023 },
      { id: '2', vin: '1HGCM82633A789012', make: 'Toyota', model: 'Camry', year: 2022 },
    ]), 1500)
  );

const mockCreateVehicle = (data: any) =>
  new Promise((resolve, reject) =>
    setTimeout(() => {
      if (Math.random() > 0.2) {
        resolve({ id: Date.now().toString(), ...data });
      } else {
        reject(new Error('Network error occurred'));
      }
    }, 1000)
  );

interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
}

export const CompleteUXIntegrationExample: React.FC = () => {
  // State management
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Toast management
  const { toasts, addToast, removeToast } = useToast();

  // Form validation
  const { values, errors, touched, handleChange, handleBlur, validateAll, reset } =
    useFormValidation(
      {
        vin: '',
        make: '',
        model: '',
        year: '',
        license_plate: '',
        color: ''
      },
      {
        vin: {
          required: true,
          minLength: 17,
          maxLength: 17,
          pattern: /^[A-HJ-NPR-Z0-9]{17}$/,
        },
        make: { required: true, minLength: 2, maxLength: 50 },
        model: { required: true, minLength: 1, maxLength: 50 },
        year: {
          required: true,
          custom: (value) => {
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1900 || year > currentYear + 1) {
              return `Year must be between 1900 and ${currentYear + 1}`;
            }
          },
        },
        license_plate: { required: true, minLength: 2, maxLength: 10 },
        color: { required: false },
      }
    );

  // Breadcrumb configuration
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Fleet Management', href: '/fleet' },
    { label: 'Vehicles' },
  ];

  // Load vehicles on mount
  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setIsLoadingVehicles(true);
    setLoadError(null);

    try {
      const data = await mockFetchVehicles() as Vehicle[];
      setVehicles(data);
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load vehicles');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    if (!validateAll()) {
      addToast('Please fix form errors before submitting', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newVehicle = await mockCreateVehicle(values) as Vehicle;
      setVehicles((prev) => [...prev, newVehicle]);
      addToast('Vehicle created successfully!', 'success');
      reset();
      setShowForm(false);
    } catch (error: any) {
      addToast(error.message || 'Failed to create vehicle', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    reset();
    setShowForm(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="mt-2 text-gray-600">
            Manage your fleet vehicles and view detailed information
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Vehicle
          </button>
        )}
      </div>

      {/* Add Vehicle Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Add New Vehicle</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VIN Field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={values.vin}
                  onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('vin')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    touched.vin && errors.vin ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1HGCM82633A123456"
                  maxLength={17}
                />
                {touched.vin && errors.vin && <FieldError message={errors.vin} />}
              </div>

              {/* Make Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={values.make}
                  onChange={(e) => handleChange('make', e.target.value)}
                  onBlur={() => handleBlur('make')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    touched.make && errors.make ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Honda"
                />
                {touched.make && errors.make && <FieldError message={errors.make} />}
              </div>

              {/* Model Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={values.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  onBlur={() => handleBlur('model')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    touched.model && errors.model ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Accord"
                />
                {touched.model && errors.model && <FieldError message={errors.model} />}
              </div>

              {/* Year Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={values.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  onBlur={() => handleBlur('year')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    touched.year && errors.year ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="2023"
                />
                {touched.year && errors.year && <FieldError message={errors.year} />}
              </div>

              {/* License Plate Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={values.license_plate}
                  onChange={(e) => handleChange('license_plate', e.target.value.toUpperCase())}
                  onBlur={() => handleBlur('license_plate')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    touched.license_plate && errors.license_plate
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="ABC1234"
                />
                {touched.license_plate && errors.license_plate && (
                  <FieldError message={errors.license_plate} />
                )}
              </div>

              {/* Color Field (Optional) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={values.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Black"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelForm}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Vehicle'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Vehicles</h2>
        </div>

        <div className="p-6">
          {/* Loading State */}
          {isLoadingVehicles && <SkeletonTable rows={5} />}

          {/* Error State */}
          {!isLoadingVehicles && loadError && (
            <ErrorMessage
              title="Failed to Load Vehicles"
              message={loadError}
              onRetry={loadVehicles}
            />
          )}

          {/* Success State */}
          {!isLoadingVehicles && !loadError && vehicles.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="mt-2">No vehicles found. Add your first vehicle to get started.</p>
            </div>
          )}

          {!isLoadingVehicles && !loadError && vehicles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VIN
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Make
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {vehicle.vin}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.make}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {vehicle.year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Loading Overlay (shown during submission) */}
      {isSubmitting && <LoadingOverlay message="Creating vehicle..." />}
    </div>
  );
};

export default CompleteUXIntegrationExample;
