/**
 * DocumentViewer - Universal document preview
 * Routes to specialized viewers based on document type
 */

import { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Printer,
  MoreVertical,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PdfViewer } from './viewer/PdfViewer';
import { ImageViewer } from './viewer/ImageViewer';
import { VideoViewer } from './viewer/VideoViewer';
import { CodeViewer } from './viewer/CodeViewer';
import { useViewerKeyboardShortcuts } from '@/hooks/documents/useKeyboardShortcuts';
import { DocumentMetadata, DocumentViewerState } from '@/lib/documents/types';
import { formatFileSize, formatRelativeTime } from '@/lib/documents/utils';

interface DocumentViewerProps {
  document: DocumentMetadata;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function DocumentViewer({
  document,
  onClose,
  onNext,
  onPrevious
}: DocumentViewerProps) {
  const [viewerState, setViewerState] = useState<DocumentViewerState>({
    zoom: 100,
    rotation: 0,
    currentPage: 1,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewer controls
  const handleZoomIn = () => {
    setViewerState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 25, 400) }));
  };

  const handleZoomOut = () => {
    setViewerState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 25, 25) }));
  };

  const handleZoomReset = () => {
    setViewerState(prev => ({ ...prev, zoom: 100 }));
  };

  const handleRotateRight = () => {
    setViewerState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }));
  };

  const handleRotateLeft = () => {
    setViewerState(prev => ({ ...prev, rotation: (prev.rotation - 90 + 360) % 360 }));
  };

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Keyboard shortcuts
  useViewerKeyboardShortcuts({
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onZoomReset: handleZoomReset,
    onRotateLeft: handleRotateLeft,
    onRotateRight: handleRotateRight,
    onNextPage: onNext,
    onPrevPage: onPrevious,
    onFullscreen: toggleFullscreen,
    onDownload: handleDownload,
    onClose,
  });

  // Render appropriate viewer based on document type
  const renderViewer = () => {
    switch (document.type) {
      case 'pdf':
        return (
          <PdfViewer
            document={document}
            state={viewerState}
            onStateChange={setViewerState}
          />
        );

      case 'image':
        return (
          <ImageViewer
            document={document}
            state={viewerState}
            onStateChange={setViewerState}
          />
        );

      case 'video':
      case 'audio':
        return (
          <VideoViewer
            document={document}
          />
        );

      case 'code':
        return (
          <CodeViewer
            document={document}
          />
        );

      case 'document':
      case 'spreadsheet':
      case 'presentation':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Office document preview coming soon
              </p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download to view
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Preview not available for this file type
              </p>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download file
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className={`max-w-7xl h-[90vh] p-0 ${isFullscreen ? 'max-w-full h-screen' : ''}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Navigation */}
            {(onPrevious || onNext) && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onPrevious}
                  disabled={!onPrevious}
                  aria-label="Previous document"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onNext}
                  disabled={!onNext}
                  aria-label="Next document"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Document info */}
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold truncate">{document.name}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{document.type}</Badge>
                <span>{formatFileSize(document.size)}</span>
                <span>•</span>
                <span>{formatRelativeTime(document.modifiedAt)}</span>
              </div>
            </div>
          </div>

          {/* Viewer controls */}
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            {(document.type === 'pdf' || document.type === 'image') && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={viewerState.zoom <= 25}
                  aria-label="Zoom out (Ctrl+-)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="px-2 text-sm font-medium min-w-[4rem] text-center">
                  {viewerState.zoom}%
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={viewerState.zoom >= 400}
                  aria-label="Zoom in (Ctrl++)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Rotation */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRotateRight}
                  aria-label="Rotate right (Ctrl+])"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />
              </>
            )}

            {/* Fullscreen */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              aria-label="Toggle fullscreen (F)"
            >
              <Maximize className="h-4 w-4" />
            </Button>

            {/* Download */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleDownload}
              aria-label="Download (Ctrl+D)"
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* More actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  View details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close viewer (Esc)"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Viewer content */}
        <div className="flex-1 overflow-hidden bg-muted/30">
          {renderViewer()}
        </div>

        {/* Page indicator for PDFs */}
        {document.type === 'pdf' && document.pageCount && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm border rounded-full px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">
              Page {viewerState.currentPage} of {document.pageCount}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
