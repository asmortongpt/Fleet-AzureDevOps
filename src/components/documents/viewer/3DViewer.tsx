/**
 * 3DViewer - 3D model viewer (STL, OBJ, GLTF, etc.)
 * Placeholder for future integration with Three.js viewer
 * Fleet already has @react-three/fiber and @react-three/drei installed
 */

import { Download, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentMetadata } from '@/lib/documents/types';

interface ThreeDViewerProps {
  document: DocumentMetadata;
}

export function ThreeDViewer({ document }: ThreeDViewerProps) {
  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  return (
    <div className="flex items-center justify-center h-full bg-muted/30">
      <div className="text-center max-w-md p-8">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-background flex items-center justify-center text-indigo-600">
          <Box className="w-12 h-12" />
        </div>

        <h3 className="text-xl font-semibold mb-2">{document.name}</h3>
        <p className="text-muted-foreground mb-6">3D Model</p>

        <div className="bg-card border rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            3D model preview will be available soon with interactive controls for rotation,
            zoom, and inspection.
          </p>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Supported formats:</strong></p>
            <ul className="list-disc list-inside">
              <li>STL (Stereolithography)</li>
              <li>OBJ (Wavefront)</li>
              <li>GLTF/GLB (GL Transmission Format)</li>
              <li>FBX (Autodesk Filmbox)</li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <p><strong>Features coming soon:</strong></p>
            <ul className="list-disc list-inside">
              <li>360° rotation and zoom</li>
              <li>Wireframe and solid views</li>
              <li>Measurements and annotations</li>
              <li>Material and texture inspection</li>
            </ul>
          </div>
        </div>

        <Button onClick={handleDownload} size="lg">
          <Download className="mr-2 h-5 w-5" />
          Download model
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Uses Three.js (@react-three/fiber is already installed)
        </p>
      </div>
    </div>
  );
}
