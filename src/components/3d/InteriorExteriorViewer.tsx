import React from 'react';

export interface InteriorExteriorViewerProps {
  vehicleId?: string;
  mode?: 'interior' | 'exterior';
}

export const InteriorExteriorViewer: React.FC<InteriorExteriorViewerProps> = ({ vehicleId, mode = 'exterior' }) => {
  return <div className="viewer-stub">3D {mode} View - Vehicle {vehicleId}</div>;
};

export default InteriorExteriorViewer;
