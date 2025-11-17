/**
 * ImageViewer - Image viewer with zoom, pan, rotate, EXIF display
 * Features: Pan, zoom, rotate, EXIF metadata, filters
 */

import { useState, useRef, useEffect } from 'react';
import { Info, RotateCcw, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DocumentMetadata, DocumentViewerState } from '@/lib/documents/types';
import { formatRelativeTime } from '@/lib/documents/utils';

interface ImageViewerProps {
  document: DocumentMetadata;
  state: DocumentViewerState;
  onStateChange: (state: DocumentViewerState) => void;
}

export function ImageViewer({ document, state, onStateChange }: ImageViewerProps) {
  const [showExif, setShowExif] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (state.zoom > 100) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -25 : 25;
    const newZoom = Math.max(25, Math.min(400, state.zoom + delta));
    onStateChange({ ...state, zoom: newZoom });

    if (newZoom <= 100) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const resetView = () => {
    onStateChange({ ...state, zoom: 100, rotation: 0 });
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex h-full">
      {/* Main image viewer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={containerRef}
          className={`flex-1 flex items-center justify-center overflow-hidden bg-muted/30 ${
            isPanning ? 'cursor-grabbing' : state.zoom > 100 ? 'cursor-grab' : ''
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            style={{
              transform: `
                translate(${panOffset.x}px, ${panOffset.y}px)
                scale(${state.zoom / 100})
                rotate(${state.rotation}deg)
              `,
              transformOrigin: 'center',
              transition: isPanning ? 'none' : 'transform 0.2s ease',
            }}
          >
            <img
              ref={imageRef}
              src={document.url}
              alt={document.name}
              className="max-w-full max-h-full object-contain shadow-2xl"
              draggable={false}
              onError={(e) => {
                e.currentTarget.src = '/placeholders/image.svg';
              }}
            />
          </div>
        </div>

        {/* Image info overlay */}
        <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
          <div className="text-sm">
            {document.dimensions && (
              <span className="font-medium">
                {document.dimensions.width} × {document.dimensions.height}
              </span>
            )}
          </div>
        </div>

        {/* Reset view button */}
        {(state.zoom !== 100 || state.rotation !== 0 || panOffset.x !== 0 || panOffset.y !== 0) && (
          <div className="absolute bottom-4 right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={resetView}
              className="shadow-lg"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset view
            </Button>
          </div>
        )}
      </div>

      {/* EXIF sidebar */}
      {showExif && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Image Details</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExif(false)}
                aria-label="Close details"
              >
                ×
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Basic info */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <DetailRow label="File name" value={document.name} />
                  <DetailRow label="Type" value={document.mimeType} />
                  {document.dimensions && (
                    <DetailRow
                      label="Dimensions"
                      value={`${document.dimensions.width} × ${document.dimensions.height}`}
                    />
                  )}
                  <DetailRow
                    label="Modified"
                    value={formatRelativeTime(document.modifiedAt)}
                  />
                </div>
              </div>

              <Separator />

              {/* Location */}
              {document.location && (
                <>
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Location</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {document.location.lat.toFixed(6)}, {document.location.lng.toFixed(6)}
                        </span>
                      </div>
                      {document.capturedAt && (
                        <DetailRow
                          label="Captured"
                          value={formatRelativeTime(document.capturedAt)}
                        />
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* EXIF data */}
              {document.exif && Object.keys(document.exif).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">EXIF Data</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(document.exif).map(([key, value]) => (
                      <DetailRow key={key} label={key} value={String(value)} />
                    ))}
                  </div>
                </div>
              )}

              {/* AI insights */}
              {document.aiSummary && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground">
                      {document.aiSummary}
                    </p>
                  </div>
                </>
              )}

              {/* Tags */}
              {document.tags.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Toggle EXIF button */}
      {!showExif && (
        <div className="absolute top-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowExif(true)}
            className="shadow-lg"
          >
            <Info className="mr-2 h-4 w-4" />
            Details
          </Button>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right break-all">{value}</span>
    </div>
  );
}
