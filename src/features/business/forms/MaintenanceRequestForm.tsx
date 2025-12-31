import React, { useState } from 'react';

interface MaintenanceRequestProps {
  currentTheme: any;
  setActiveView: (view: string) => void;
  vehicles?: any[];
}

const MaintenanceRequestForm: React.FC<MaintenanceRequestProps> = ({
  currentTheme,
  setActiveView,
  vehicles = []
}) => {
  const [request, setRequest] = useState({
    vehicleId: '',
    issueType: '',
    description: '',
    priority: 'medium',
    requestedDate: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log('Maintenance Request:', request);
    alert('Maintenance request submitted successfully!');
    setActiveView('dashboard');
  };

  return (
    <div style={{ padding: '20px', background: currentTheme.bg, minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setActiveView('dashboard')}
          style={{
            padding: '8px 16px',
            background: currentTheme.secondary,
            color: currentTheme.text,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
      
      <h1 style={{ color: currentTheme.text, marginBottom: '24px' }}>
        Maintenance Request Form
      </h1>
      
      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.text }}>
            Vehicle ID
          </label>
          <select
            value={request.vehicleId}
            onChange={(e) => setRequest({...request, vehicleId: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text
            }}
          >
            <option value="">Select Vehicle</option>
            {vehicles.slice(0, 10).map(vehicle => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.id} - {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.text }}>
            Issue Type
          </label>
          <select
            value={request.issueType}
            onChange={(e) => setRequest({...request, issueType: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text
            }}
          >
            <option value="">Select Issue Type</option>
            <option value="engine">Engine Problems</option>
            <option value="brakes">Brake Issues</option>
            <option value="tires">Tire Replacement</option>
            <option value="oil">Oil Change</option>
            <option value="electrical">Electrical Issues</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.text }}>
            Priority
          </label>
          <select
            value={request.priority}
            onChange={(e) => setRequest({...request, priority: e.target.value})}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text
            }}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: currentTheme.text }}>
            Description
          </label>
          <textarea
            value={request.description}
            onChange={(e) => setRequest({...request, description: e.target.value})}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: `1px solid ${currentTheme.border}`,
              background: currentTheme.surface,
              color: currentTheme.text,
              resize: 'vertical'
            }}
            placeholder="Describe the maintenance issue in detail..."
          />
        </div>
        
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '16px',
            background: currentTheme.primary,
            color: currentTheme.primaryText,
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Submit Maintenance Request
        </button>
      </form>
    </div>
  );
};

export default MaintenanceRequestForm;