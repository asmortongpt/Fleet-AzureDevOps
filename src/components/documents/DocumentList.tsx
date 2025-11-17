/**
 * DocumentList - Table view with sortable columns
 * Features: Virtual scrolling, column sorting, row selection, context menu
 */

import { useRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useResizeObserver } from '@/hooks/useResizeObserver';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Eye,
  FileIcon,
  Calendar,
  HardDrive,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentMetadata, SortField, SortOrder } from '@/lib/documents/types';
import {
  formatFileSize,
  formatRelativeTime,
  getDocumentColor,
  generateTagColor
} from '@/lib/documents/utils';

interface DocumentListProps {
  documents: DocumentMetadata[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen?: (document: DocumentMetadata) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  isLoading?: boolean;
}

const ROW_HEIGHT = 72;

export function DocumentList({
  documents,
  selectedIds,
  onSelect,
  onOpen,
  sortField,
  sortOrder,
  onSort,
  isLoading = false
}: DocumentListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { height = 600 } = useResizeObserver(containerRef);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (isLoading) {
    return <DocumentListSkeleton />;
  }

  if (documents.length === 0) {
    return <EmptyState />;
  }

  const Row = ({ index, style }: any) => {
    const document = documents[index];
    const isSelected = selectedIds.has(document.id);

    return (
      <div style={style}>
        <DocumentRow
          document={document}
          isSelected={isSelected}
          onSelect={() => onSelect(document.id)}
          onOpen={() => onOpen?.(document)}
        />
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* Table header */}
      <div className="border-b bg-muted/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === documents.length && documents.length > 0}
                  onCheckedChange={() => {
                    // Handled by parent
                  }}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-12" />
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort('name')}
                  className="h-8 -ml-3"
                >
                  <FileIcon className="mr-2 h-4 w-4" />
                  Name
                  <SortIcon field="name" />
                </Button>
              </TableHead>
              <TableHead className="w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort('type')}
                  className="h-8 -ml-3"
                >
                  Type
                  <SortIcon field="type" />
                </Button>
              </TableHead>
              <TableHead className="w-32">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort('size')}
                  className="h-8 -ml-3"
                >
                  <HardDrive className="mr-2 h-4 w-4" />
                  Size
                  <SortIcon field="size" />
                </Button>
              </TableHead>
              <TableHead className="w-48">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSort('date')}
                  className="h-8 -ml-3"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Modified
                  <SortIcon field="date" />
                </Button>
              </TableHead>
              <TableHead className="w-64">
                <span className="flex items-center text-sm font-medium">
                  <TagIcon className="mr-2 h-4 w-4" />
                  Tags
                </span>
              </TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Virtualized rows */}
      <div className="flex-1 overflow-hidden">
        <List
          height={height - ROW_HEIGHT}
          itemCount={documents.length}
          itemSize={ROW_HEIGHT}
          width="100%"
          className="scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {Row}
        </List>
      </div>
    </div>
  );
}

interface DocumentRowProps {
  document: DocumentMetadata;
  isSelected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}

function DocumentRow({ document, isSelected, onSelect, onOpen }: DocumentRowProps) {
  return (
    <div
      className={`
        flex items-center gap-4 px-4 border-b h-[72px] hover:bg-accent/50
        transition-colors cursor-pointer
        ${isSelected ? 'bg-accent' : ''}
      `}
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
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          aria-label={`Select ${document.name}`}
        />
      </div>

      {/* Icon/Thumbnail */}
      <div className="w-12 h-12 flex-shrink-0">
        <div className={`w-full h-full rounded border-2 ${getDocumentColor(document.type)} bg-muted overflow-hidden`}>
          {document.thumbnailUrl ? (
            <img
              src={document.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileIcon className="h-6 w-6" />
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{document.name}</div>
        <div className="text-sm text-muted-foreground truncate">
          {document.folderPath || 'Root'}
        </div>
      </div>

      {/* Type */}
      <div className="w-32">
        <Badge variant="outline" className={getDocumentColor(document.type)}>
          {document.type}
        </Badge>
      </div>

      {/* Size */}
      <div className="w-32 text-sm text-muted-foreground">
        {formatFileSize(document.size)}
      </div>

      {/* Date */}
      <div className="w-48 text-sm text-muted-foreground">
        {formatRelativeTime(document.modifiedAt)}
      </div>

      {/* Tags */}
      <div className="w-64 flex flex-wrap gap-1">
        {document.tags.slice(0, 2).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className={`text-xs ${generateTagColor(tag)}`}
          >
            {tag}
          </Badge>
        ))}
        {document.tags.length > 2 && (
          <Badge variant="outline" className="text-xs">
            +{document.tags.length - 2}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
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
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function DocumentListSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileIcon className="w-12 h-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No documents found</h3>
      <p className="text-muted-foreground max-w-sm">
        Upload your first document to get started, or adjust your search filters.
      </p>
    </div>
  );
}
