import { X, Save, Calendar as CalendarIcon, MapPin, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
  initialData?: {
    title: string;
    start: Date;
    end: Date;
    resource?: {
      type: 'maintenance' | 'reservation' | 'inspection' | 'meeting' | 'other';
      vehicleId?: string;
      driverId?: string;
      location?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
      description?: string;
    };
  };
}

const EventCreateModal: React.FC<EventCreateModalProps> = ({ isOpen, onClose,
 onSave,
 initialData
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    start: initialData?.start || new Date(),
    end: initialData?.end || new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    type: (initialData?.resource?.type as string) || 'other',
    vehicleId: initialData?.resource?.vehicleId || '',
    driverId: initialData?.resource?.driverId || '',
    location: initialData?.resource?.location || '',
    priority: (initialData?.resource?.priority as string) || 'normal',
    description: initialData?.resource?.description || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Event title is required';
    }

    if (formData.start >= formData.end) {
      newErrors.end = 'End time must be after start time';
    }

    if (formData.type === 'maintenance' && !formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle ID is required for maintenance events';
    }

    if (formData.type === 'reservation' && !formData.vehicleId.trim()) {
      newErrors.vehicleId = 'Vehicle ID is required for reservation events';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const eventData = {
      title: formData.title,
      start: formData.start,
      end: formData.end,
      resource: {
        type: formData.type,
        vehicleId: formData.vehicleId || undefined,
        driverId: formData.driverId || undefined,
        location: formData.location || undefined,
        priority: formData.priority,
        status: 'scheduled' as const,
        description: formData.description || undefined
      }
    };

    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  const eventTypes = [
    { value: 'maintenance', label: 'Maintenance', color: '#f59e0b' },
    { value: 'reservation', label: 'Vehicle Reservation', color: '#3b82f6' },
    { value: 'inspection', label: 'Inspection', color: '#10b981' },
    { value: 'meeting', label: 'Meeting', color: '#8b5cf6' },
    { value: 'other', label: 'Other', color: '#6b7280' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-800" />
            Create Fleet Event
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Event Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event title"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          {/* Date/Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.start.toISOString().slice(0, 16)}
                onChange={(e) => handleInputChange('start', new Date(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.end.toISOString().slice(0, 16)}
                onChange={(e) => handleInputChange('end', new Date(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.end && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.end}
                </p>
              )}
            </div>
          </div>
          {/* Vehicle ID (conditional) */}
          {(formData.type === 'maintenance' || formData.type === 'reservation') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle ID *
              </label>
              <input
                type="text"
                value={formData.vehicleId}
                onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.vehicleId ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., FL-001, FL-045"
              />
              {errors.vehicleId && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.vehicleId}
                </p>
              )}
            </div>
          )}

          {/* Driver ID (for reservations) */}
          {formData.type === 'reservation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver ID
              </label>
              <input
                type="text"
                value={formData.driverId}
                onChange={(e) => handleInputChange('driverId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., D-12345"
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter location"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Additional details about this event."
            />
          </div>
        </div>
        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventCreateModal;