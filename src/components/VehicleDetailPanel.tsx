import React from 'react';

import { openEntityDetail } from '../services/drilldownService';

/**
 * Component for displaying vehicle details.
 * @component
 */
const VehicleDetailPanel: React.FC = () => {
  const handleRowClick = (id: string, name: string) => {
    openEntityDetail('vehicle', id, name);
  };

  return (
    <div>
      {/* Example usage of the drilldown service */}
      <div onClick={() => handleRowClick('vehicleId', 'vehicleName')}>
        Click to view vehicle details
      </div>
    </div>
  );
};

export default VehicleDetailPanel;