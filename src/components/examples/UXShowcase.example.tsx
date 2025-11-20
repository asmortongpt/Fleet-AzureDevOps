/**
 * UX Components Showcase
 *
 * Visual demonstration of all UX components for testing and reference.
 * This file can be used as a style guide or component library preview.
 */

import React, { useState } from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import { LoadingOverlay } from '../LoadingOverlay';
import { SkeletonTable } from '../SkeletonLoader';import { ErrorMessage, FieldError } from '../ErrorMessage';
import { ToastContainer } from '../Toast';import { Breadcrumb } from '../Breadcrumb';
import { useToast } from '../../hooks/useToast';

export const UXShowcase: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const handleShowToast = (type: 'success' | 'error' | 'info' | 'warning') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'An error occurred during the operation.',
      info: 'Here is some important information.',
      warning: 'Please review this warning message.'
    };
    addToast(messages[type], type);
  };

  const handleShowOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-2">UX Components Showcase</h1>
        <p className="text-gray-600">
          Visual demonstration of all UX improvement components
        </p>
      </div>

      {/* Breadcrumb */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Breadcrumb Navigation</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Components', href: '/components' },
              { label: 'Showcase' }
            ]}
          />
        </div>
      </section>

      {/* Loading Spinners */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Loading Spinners</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-sm font-medium mb-2">Small</p>
              <LoadingSpinner size="sm" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Medium (Default)</p>
              <LoadingSpinner size="md" />
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Large</p>
              <LoadingSpinner size="lg" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">In Button</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded flex items-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Loading...
            </button>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Loading Overlay</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={handleShowOverlay}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Show Loading Overlay (2 seconds)
          </button>
          {showOverlay && <LoadingOverlay message="Processing your request..." />}
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Skeleton Loaders</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="font-semibold">Loading Table Data...</h3>
          </div>
          <SkeletonTable rows={3} />
        </div>
      </section>

      {/* Error Messages */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Error Messages</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Standard Error Message</p>
            <ErrorMessage message="Failed to load vehicle data. Please check your connection." />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Error with Custom Title</p>
            <ErrorMessage
              title="Connection Error"
              message="Unable to reach the server. Please try again later."
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Error with Retry Button</p>
            <ErrorMessage
              title="Failed to Load Data"
              message="An unexpected error occurred while fetching vehicles."
              onRetry={() => alert('Retry clicked!')}
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Field Error (for forms)</p>
            <div className="max-w-md">
              <input
                type="text"
                placeholder="Vehicle VIN"
                className="w-full px-3 py-2 border border-red-500 rounded"
              />
              <FieldError message="VIN must be exactly 17 characters" />
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Toast Notifications</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleShowToast('success')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Success Toast
            </button>
            <button
              onClick={() => handleShowToast('error')}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Error Toast
            </button>
            <button
              onClick={() => handleShowToast('info')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Info Toast
            </button>
            <button
              onClick={() => handleShowToast('warning')}
              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
            >
              Warning Toast
            </button>
          </div>
        </div>
      </section>

      {/* Empty State */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Empty State Example</h2>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-500 mb-4">
            Get started by adding your first vehicle to the fleet.
          </p>
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Add Vehicle
          </button>
        </div>
      </section>

      {/* Form States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Form States</h2>
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Normal State
              </label>
              <input
                type="text"
                placeholder="Enter value"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Error State
              </label>
              <input
                type="text"
                placeholder="Invalid value"
                className="w-full px-3 py-2 border border-red-500 rounded focus:ring-2 focus:ring-red-500"
              />
              <FieldError message="This field is required" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Disabled State
              </label>
              <input
                type="text"
                placeholder="Disabled field"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div className="flex gap-4">
              <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Normal Button
              </button>
              <button
                disabled
                className="bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed"
              >
                Disabled Button
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-20 bg-blue-600 rounded mb-2"></div>
            <p className="text-sm font-medium">Primary (Blue)</p>
            <p className="text-xs text-gray-500">Actions, Links</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-20 bg-green-600 rounded mb-2"></div>
            <p className="text-sm font-medium">Success (Green)</p>
            <p className="text-xs text-gray-500">Confirmations</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-20 bg-red-600 rounded mb-2"></div>
            <p className="text-sm font-medium">Error (Red)</p>
            <p className="text-xs text-gray-500">Errors, Warnings</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="h-20 bg-yellow-500 rounded mb-2"></div>
            <p className="text-sm font-medium">Warning (Yellow)</p>
            <p className="text-xs text-gray-500">Cautions</p>
          </div>
        </div>
      </section>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default UXShowcase;
