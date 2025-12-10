/**
 * ImageViewer - Image viewer with zoom, pan, rotate, EXIF display
 * Features: Pan, zoom, rotate, EXIF metadata, filters
 */

import { Info, RotateCcw, MapPin } from 'lucide-react';
import { useState, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
             aria-label="Action button">
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
                onClick={() => setShowExif(false)} aria-label="Action button"
                aria-label="Close details"
              >
