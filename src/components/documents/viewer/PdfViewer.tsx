/**
 * PdfViewer - PDF viewer with annotations support
 * Features: Page navigation, zoom, annotations, text selection, search
 * Uses pdf.js for rendering (to be integrated)
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentMetadata, DocumentViewerState } from '@/lib/documents/types';

interface PdfViewerProps {
  document: DocumentMetadata;
  state: DocumentViewerState;
  onStateChange: (state: DocumentViewerState) => void;
}

export function PdfViewer({ document, state, onStateChange }: PdfViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnnotations, setShowAnnotations] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pageCount = document.pageCount || 10; // Mock page count
  const currentPage = state.currentPage || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pageCount) {
      onStateChange({ ...state, currentPage: newPage });
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          handlePreviousPage();
          break;
        case 'ArrowRight':
        case 'PageDown':
          e.preventDefault();
          handleNextPage();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount]);

  return (
    <div className="flex h-full">
      {/* Main PDF viewer */}
      <div className="flex-1 flex flex-col">
        {/* PDF toolbar */}
        <div className="flex items-center justify-between p-2 border-b bg-background">
          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentPage}
                onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                className="w-16 h-8 text-center"
                min={1}
                max={pageCount}
                aria-label="Current page"
              />
              <span className="text-sm text-muted-foreground">
                / {pageCount}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === pageCount}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-64"
                aria-label="Search PDF"
              />
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant={showAnnotations ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowAnnotations(!showAnnotations)}
              aria-label="Toggle annotations"
              aria-pressed={showAnnotations}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Annotations
            </Button>
          </div>
        </div>

        {/* PDF canvas */}
        <ScrollArea className="flex-1 bg-muted/30">
          <div
            ref={containerRef}
            className="flex items-start justify-center p-8"
            style={{
              transform: `scale(${state.zoom / 100}) rotate(${state.rotation}deg)`,
              transformOrigin: 'center top',
              transition: 'transform 0.2s ease',
            }}
          >
            {/* PDF.js canvas will be rendered here */}
            {/* For now, showing a placeholder */}
            <div className="bg-white shadow-2xl" style={{ width: 612, minHeight: 792 }}>
              <div className="p-12 space-y-4">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />
                <div className="h-8" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-4/5" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-8" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-5/6" />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                    <p className="text-sm text-muted-foreground mb-2">PDF Viewer</p>
                    <p className="text-xs text-muted-foreground">
                      Page {currentPage} of {pageCount}
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      Integrate pdf.js for full PDF rendering
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Annotations sidebar */}
      {showAnnotations && (
        <div className="w-80 border-l bg-card flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Annotations</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Comments and highlights
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                No annotations yet
              </div>
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <Button size="sm" className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Add comment
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
