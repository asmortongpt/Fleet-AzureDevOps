import React from 'react';

import { useBranding } from '../context/BrandingContext';

interface MetricCardProps {
  title: string;
  value: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => {
  const { brandingConfig } = useBranding();
  const borderColor = brandingConfig ? brandingConfig.secondaryColor : 'border-gray-200';

  return (
    <div className={`metric-card border ${borderColor}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
};

export default MetricCard;