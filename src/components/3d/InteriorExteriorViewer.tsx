import { Box, Eye } from 'lucide-react';
import React from 'react';

export interface InteriorExteriorViewerProps {
  vehicleId?: string;
  mode?: 'interior' | 'exterior';
}

export const InteriorExteriorViewer: React.FC<InteriorExteriorViewerProps> = ({ vehicleId, mode = 'exterior' }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6">
      <div className="rounded-full bg-muted p-3 mb-3">
        {mode === 'interior' ? (
          <Eye className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Box className="h-8 w-8 text-muted-foreground" />
        )}
      </div>
      <p className="text-sm font-medium text-muted-foreground">
        3D {mode === 'interior' ? 'Interior' : 'Exterior'} Viewer
      </p>
      <p className="text-xs text-muted-foreground/70 mt-1 text-center">
        3D viewer requires WebGL support.{vehicleId ? ` Vehicle: ${vehicleId}` : ''}
      </p>
    </div>
  );
};

export default InteriorExteriorViewer;
