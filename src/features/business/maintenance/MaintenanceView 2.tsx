import React from 'react';

interface MaintenanceViewProps {
  currentTheme: any;
  vehicles: any[];
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ currentTheme, vehicles }) => {
  return (
    <div style={{
      padding: '24px',
      background: currentTheme.surface,
      borderRadius: '12px'
    }}>
      <h2 style={{ color: currentTheme.text, marginBottom: '20px' }}>Maintenance Management</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {vehicles.filter(v => v.status === 'maintenance').map(vehicle => (
          <div key={vehicle.id} style={{
            background: currentTheme.card,
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${currentTheme.border}`
          }}>
            <h3 style={{ color: currentTheme.text }}>{vehicle.make} {vehicle.model}</h3>
            <p style={{ color: currentTheme.textMuted }}>Plate: {vehicle.plateNumber}</p>
            <p style={{ color: currentTheme.textMuted }}>Mileage: {vehicle.mileage.toLocaleString()}</p>
            <p style={{ color: currentTheme.warning }}>In Maintenance</p>
          </div>
        ))}
      </div>

      {vehicles.filter(v => v.status === 'maintenance').length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: currentTheme.textMuted
        }}>
          <p>No vehicles currently in maintenance</p>
        </div>
      )}
    </div>
  )
};

export default MaintenanceView;