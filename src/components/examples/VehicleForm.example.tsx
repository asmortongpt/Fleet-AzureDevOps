import React, { useState } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ErrorMessage, FieldError } from '../ErrorMessage';
import { useFormValidation } from '../../hooks/useFormValidation';

export const VehicleFormExample: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { values, errors, touched, handleChange, handleBlur, validateAll } = useFormValidation(
    {
      vin: '',
      make: '',
      model: '',
      year: '',
      license_plate: ''
    },
    {
      vin: { required: true, minLength: 17, maxLength: 17 },
      make: { required: true, minLength: 2 },
      model: { required: true, minLength: 2 },
      year: {
        required: true,
        custom: (value) => {
          const year = parseInt(value);
          if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
            return 'Invalid year';
          }
        }
      },
      license_plate: { required: true }
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      return;
    }

    setLoading(true);
    try {
      // Submit form...
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      console.log('Form submitted:', values);
    } catch (error) {
      setSubmitError('Failed to create vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {submitError && (
        <ErrorMessage message={submitError} onRetry={() => handleSubmit} />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          VIN <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.vin}
          onChange={(e) => handleChange('vin', e.target.value)}
          onBlur={() => handleBlur('vin')}
          className={`mt-1 block w-full rounded-md border ${
            touched.vin && errors.vin ? 'border-red-500' : 'border-gray-300'
          } px-3 py-2`}
        />
        {touched.vin && errors.vin && <FieldError message={errors.vin} />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Make <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.make}
            onChange={(e) => handleChange('make', e.target.value)}
            onBlur={() => handleBlur('make')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {touched.make && errors.make && <FieldError message={errors.make} />}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.model}
            onChange={(e) => handleChange('model', e.target.value)}
            onBlur={() => handleBlur('model')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
          {touched.model && errors.model && <FieldError message={errors.model} />}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
      >
        {loading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Saving...
          </>
        ) : (
          'Save Vehicle'
        )}
      </button>
    </form>
  );
};
