/**
 * Interior/Exterior 3D Vehicle Viewer
 * Auto-generated component stub for production build
 */
import React from 'react';

export interface InteriorExteriorViewerProps {
  vehicleId?: string;
  mode?: 'interior' | 'exterior';
  className?: string;
}

export const InteriorExteriorViewer: React.FC<InteriorExteriorViewerProps> = ({
  vehicleId,
  mode = 'exterior',
  className = ''
}) => {
  return (
    <div className={`interior-exterior-viewer ${className}`}>
      <div className="viewer-placeholder">
        <p>3D {mode} View</p>
        {vehicleId && <p>Vehicle: {vehicleId}</p>}
      </div>
    </div>
  );
};

export default InteriorExteriorViewer;
