import React from 'react';

const PredictiveMaintenanceHub = ({ currentTheme }: any) => {
  return (
    <div style={{ padding: '20px', background: currentTheme.surface, borderRadius: '8px' }}>
      <h2 style={{ color: currentTheme.text }}>Predictive Maintenance Hub</h2>
      <p style={{ color: currentTheme.textMuted }}>Predictive maintenance features coming soon.</p>
    </div>
  )
};

export default PredictiveMaintenanceHub;