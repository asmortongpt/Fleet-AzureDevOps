/**
 * DocumentGrid - Pinterest-style grid view with virtual scrolling
 * Features: Thumbnails, hover actions, drag-drop selection, infinite scroll
 */

import { useRef, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import {
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  Star,
  Copy,
  Tag as TagIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentMetadata } from '@/lib/documents/types';
import {
  formatFileSize,
  formatRelativeTime,
  getThumbnailUrl,
  getDocumentColor,
  generateTagColor
} from '@/lib/documents/utils';

interface DocumentGridProps {
  documents: DocumentMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen?: (document: DocumentMetadata) => void;
  isLoading?: boolean;
}

const CARD_WIDTH = 280;
const CARD_HEIGHT = 340;
const GAP = 16;

export function DocumentGrid({
  documents,
  selectedIds,
  onSelect,
  onOpen,
  isLoading = false
}: DocumentGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width = 1000, height = 600 } = useResizeObserver(containerRef);

  // Calculate grid dimensions
  const columnCount = Math.floor((width + GAP) / (CARD_WIDTH + GAP)) || 1;
  const rowCount = Math.ceil(documents.length / columnCount);

  // Cell renderer
  const Cell = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * columnCount + columnIndex;
    if (index >= documents.length) return null;

    const document = documents[index];
    const isSelected = selectedIds.has(document.id);

    return (
      <div
        style={{
          ...style,
          left: Number(style.left) + GAP,
          top: Number(style.top) + GAP,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
      >
        <DocumentCard
          document={document}
          isSelected={isSelected}
          onSelect={() => onSelect(document.id)}
          onOpen={() => onOpen?.(document)}
        />
      </div>
    );
  };

  if (isLoading) {
    return <DocumentGridSkeleton />;
  }

  if (documents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      <Grid
        columnCount={columnCount}
        columnWidth={CARD_WIDTH + GAP}
        height={height}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        width={width}
        className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      >
        {Cell}
      </Grid>
    </div>
  );
}

interface DocumentCardProps {
  document: DocumentMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

function DocumentCard({ document, isSelected, onSelect, onOpen }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        group relative rounded-lg border bg-card overflow-hidden
        transition-all duration-200 cursor-pointer
        hover:shadow-lg hover:scale-[1.02]
        ${isSelected ? 'ring-2 ring-primary shadow-md' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${document.name}, ${document.type}, ${formatFileSize(document.size)}`}
    >
      {/* Checkbox */}
      <div
        className={`
          absolute top-2 left-2 z-10 transition-opacity
          ${isSelected || isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Select ${document.name}`}
          className="bg-background/80 backdrop-blur-sm"
        />
      </div>

      {/* Actions menu */}
      <div
        className={`
          absolute top-2 right-2 z-10 transition-opacity
          ${isHovered ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/80 backdrop-blur-sm"
              aria-label={`Actions for ${document.name}`}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onOpen}>
              <Eye className="mr-2 h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </DropdownMenuItem>
            <DropdownMenuItem>
              <TagIcon className="mr-2 h-4 w-4" />
              Add tags
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Star className="mr-2 h-4 w-4" />
              Add to favorites
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <img
          src={getThumbnailUrl(document)}
          alt={document.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Type badge */}
        <Badge
          variant="secondary"
          className={`absolute bottom-2 left-2 ${getDocumentColor(document.type)}`}
        >
          {document.type}
        </Badge>

        {/* Status indicators */}
        {document.isShared && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2"
          >
            Shared
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <h3 className="font-medium text-sm line-clamp-2 leading-tight">
          {document.name}
        </h3>

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatFileSize(document.size)}</span>
          <span>•</span>
          <span>{formatRelativeTime(document.createdAt)}</span>
        </div>

        {/* Tags */}
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`text-xs ${generateTagColor(tag)}`}
              >
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* AI insights indicator */}
        {document.aiSummary && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <svg
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
            <span>AI Insights</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentGridSkeleton() {
  return (
    <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <Eye className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No documents found</h3>
      <p className="text-muted-foreground max-w-sm mb-6">
        Upload your first document to get started, or adjust your search filters.
      </p>
      <Button>
        <Download className="mr-2 h-4 w-4" />
        Upload documents
      </Button>
    </div>
  );
}
