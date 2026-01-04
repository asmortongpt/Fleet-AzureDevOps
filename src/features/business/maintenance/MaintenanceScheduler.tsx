import React, { useState, useEffect } from 'react';
import { maintenanceService } from '../../services/maintenanceService';
import { vehicleService, Vehicle } from '../../services/vehicleService';

interface MaintenanceSchedulerProps {
  currentTheme: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const serviceTypes = [
  'Oil Change',
  'Tire Rotation',
  'Brake Service',
  'Inspection',
  'Alignment',
  'Transmission Service',
  'Engine Repair',
  'Battery Service',
  'Air Filter',
  'Other'
];

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({
  currentTheme,
  onSuccess,
  onCancel
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'Oil Change',
    serviceDate: new Date().toISOString().split('T')[0],
    mileageAtService: '',
    cost: '',
    vendor: '',
    description: ''
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const record = {
        vehicleId: formData.vehicleId,
        serviceType: formData.serviceType,
        serviceDate: new Date(formData.serviceDate),
        mileageAtService: formData.mileageAtService ? parseInt(formData.mileageAtService) : undefined,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        vendor: formData.vendor || undefined,
        description: formData.description || undefined,
        status: 'Scheduled'
      }

      await maintenanceService.create(record);

      setSuccessMessage('Maintenance scheduled successfully!');

      // Reset form
      setFormData({
        vehicleId: '',
        serviceType: 'Oil Change',
        serviceDate: new Date().toISOString().split('T')[0],
        mileageAtService: '',
        cost: '',
        vendor: '',
        description: ''
      });

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      console.error('Failed to schedule maintenance:', err);
      setError(err.message || 'Failed to schedule maintenance');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${currentTheme.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: currentTheme.bg,
    color: currentTheme.text,
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: currentTheme.text
  }

  const buttonStyle = {
    padding: '10px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: loading ? 0.6 : 1
  }

  return (
    <div style={{
      backgroundColor: currentTheme.card,
      borderRadius: '12px',
      padding: '24px',
      border: `1px solid ${currentTheme.border}`
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: currentTheme.text,
        marginBottom: '24px'
      }}>
        Schedule Maintenance
      </h2>

      {error && (
        <div style={{
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#c00'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          color: '#060'
        }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>
              Vehicle <span style={{ color: currentTheme.danger }}>*</span>
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              <option value="">Select a vehicle</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.licensePlate || vehicle.vin} - {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>
              Service Type <span style={{ color: currentTheme.danger }}>*</span>
            </label>
            <select
              name="serviceType"
              value={formData.serviceType}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              {serviceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={labelStyle}>
              Service Date <span style={{ color: currentTheme.danger }}>*</span>
            </label>
            <input
              type="date"
              name="serviceDate"
              value={formData.serviceDate}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Mileage at Service
            </label>
            <input
              type="number"
              name="mileageAtService"
              value={formData.mileageAtService}
              onChange={handleInputChange}
              min="0"
              placeholder="Miles"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Estimated Cost
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="$0.00"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>
            Vendor/Service Provider
          </label>
          <input
            type="text"
            name="vendor"
            value={formData.vendor}
            onChange={handleInputChange}
            placeholder="e.g., ABC Auto Shop"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>
            Description/Notes
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Enter any additional details about the maintenance..."
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                ...buttonStyle,
                backgroundColor: currentTheme.surface,
                color: currentTheme.text
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...buttonStyle,
              backgroundColor: currentTheme.primary,
              color: '#fff'
            }}
          >
            {loading ? 'Scheduling...' : 'Schedule Maintenance'}
          </button>
        </div>
      </form>
    </div>
  )
};

export default MaintenanceScheduler;
