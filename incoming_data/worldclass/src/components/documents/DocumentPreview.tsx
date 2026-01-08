// Fleet Application - Advanced Document Preview Component
// Supports PDFs, images, and text files with full-screen mode

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCw,
  FileText,
  Image as ImageIcon,
  File
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  open: boolean;
  onClose: () => void;
  document: {
    id: string;
    title: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_path: string;
    content_text?: string;
  };
  downloadUrl: string;
}

export function DocumentPreview({ open, onClose, document, downloadUrl }: DocumentPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Reset state when document changes
  useEffect(() => {
    if (open) {
      setPageNumber(1);
      setScale(1.0);
      setRotation(0);
      setIsFullscreen(false);
      setLoading(true);
      setError(null);
      setImageLoaded(false);
    }
  }, [document.id, open]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePreviousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = downloadUrl;
    link.download = document.file_name;
    link.click();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const isPDF = document.file_type === 'application/pdf';
  const isImage = document.file_type?.startsWith('image/');
  const isText = document.file_type?.startsWith('text/') ||
                 document.file_type === 'application/json' ||
                 document.file_type === 'application/xml';

  const renderPreview = () => {
    if (loading && !imageLoaded) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading document...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <File className="h-12 w-12 mx-auto mb-4" />
            <p>{error}</p>
            <Button onClick={handleDownload} className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Download Instead
            </Button>
          </div>
        </div>
      );
    }

    // PDF Preview
    if (isPDF) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Document
            file={downloadUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading PDF...</p>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>

          {/* Page Navigation */}
          {numPages > 1 && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={pageNumber <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-700">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pageNumber >= numPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Image Preview
    if (isImage) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img
            src={downloadUrl}
            alt={document.title}
            className="max-w-full max-h-full object-contain shadow-lg"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out'
            }}
            onLoad={() => {
              setImageLoaded(true);
              setLoading(false);
            }}
            onError={() => {
              setError('Failed to load image');
              setLoading(false);
            }}
          />
        </div>
      );
    }

    // Text Preview
    if (isText && document.content_text) {
      return (
        <ScrollArea className="h-full w-full p-6">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">
            {document.content_text}
          </pre>
        </ScrollArea>
      );
    }

    // Unsupported file type
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <File className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Preview not available for this file type</p>
          <p className="text-sm text-gray-500 mb-4">
            {document.file_type || 'Unknown file type'}
          </p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download to View
          </Button>
        </div>
      </div>
    );
  };

  const getFileIcon = () => {
    if (isPDF) return <FileText className="h-5 w-5" />;
    if (isImage) return <ImageIcon className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "transition-all duration-300",
          isFullscreen
            ? "max-w-full h-full w-screen m-0 rounded-none"
            : "max-w-6xl h-[90vh]"
        )}
      >
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getFileIcon()}
              <div>
                <DialogTitle className="text-lg">{document.title}</DialogTitle>
                <DialogDescription className="text-sm">
                  {document.file_name} • {formatFileSize(document.file_size)}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between border-b pb-3 px-1">
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            {(isPDF || isImage) && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 px-2">
                  <Slider
                    value={[scale * 100]}
                    onValueChange={([value]) => setScale(value / 100)}
                    min={50}
                    max={300}
                    step={10}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-600 w-12">
                    {Math.round(scale * 100)}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Rotate */}
            {(isPDF || isImage) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRotate}
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto bg-gray-100">
          {renderPreview()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
