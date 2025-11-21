/**
 * DocumentExplorer - Main Document Management Interface
 * Features: Grid/List view toggle, virtual scrolling, search, filters, bulk actions
 */

import { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Download,
  Trash2,
  Share2,
  Tag,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DocumentGrid } from './DocumentGrid';
import { DocumentList } from './DocumentList';
import { DocumentSidebar } from './DocumentSidebar';
import { DocumentUploader } from './DocumentUploader';
import { useDocumentKeyboardShortcuts } from '@/hooks/documents/useKeyboardShortcuts';
import { DocumentMetadata, ViewMode, SortField, SortOrder } from '@/lib/documents/types';
import { filterDocuments, sortDocuments } from '@/lib/documents/utils';

interface DocumentExplorerProps {
  documents: DocumentMetadata[];
  onDocumentSelect?: (document: DocumentMetadata) => void;
  onDocumentOpen?: (document: DocumentMetadata) => void;
  onUpload?: (files: File[]) => void;
  onDelete?: (documentIds: string[]) => void;
  onShare?: (documentIds: string[]) => void;
  onTag?: (documentIds: string[], tags: string[]) => void;
  onMove?: (documentIds: string[], folderId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function DocumentExplorer({
  documents,
  onDocumentSelect,
  onDocumentOpen,
  onUpload,
  onDelete,
  onShare,
  onTag,
  onMove,
  onRefresh,
  isLoading = false,
}: DocumentExplorerProps) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();

  // Upload dialog
  const [showUploader, setShowUploader] = useState(false);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by folder
    if (currentFolderId) {
      filtered = filtered.filter(doc => doc.folderId === currentFolderId);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filterDocuments(filtered, { query: searchQuery });
    }

    // Sort
    filtered = sortDocuments(filtered, sortField, sortOrder);

    return filtered;
  }, [documents, searchQuery, currentFolderId, sortField, sortOrder]);

  // Selection handlers
  const handleSelect = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  // Bulk actions
  const handleBulkDelete = () => {
    if (onDelete && selectedIds.size > 0) {
      onDelete(Array.from(selectedIds));
      clearSelection();
    }
  };

  const handleBulkShare = () => {
    if (onShare && selectedIds.size > 0) {
      onShare(Array.from(selectedIds));
    }
  };

  const handleBulkDownload = () => {
    const selectedDocs = documents.filter(doc => selectedIds.has(doc.id));
    selectedDocs.forEach(doc => {
      window.open(doc.url, '_blank');
    });
  };

  // Keyboard shortcuts
  useDocumentKeyboardShortcuts({
    onUpload: () => setShowUploader(true),
    onSearch: () => document.getElementById('document-search')?.focus(),
    onRefresh: onRefresh,
    onSelectAll: handleSelectAll,
    onDelete: selectedIds.size > 0 ? handleBulkDelete : undefined,
    onEscape: clearSelection,
    onViewToggle: () => setViewMode(prev => prev === 'grid' ? 'list' : 'grid'),
  });

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <DocumentSidebar
        currentFolderId={currentFolderId}
        onFolderSelect={setCurrentFolderId}
        className="w-64 border-r"
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b bg-card">
          <div className="p-4 space-y-4">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">Documents</h1>
                <Badge variant="secondary" className="ml-2">
                  {filteredDocuments.length}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowUploader(true)}
                  size="sm"
                  aria-label="Upload documents (Ctrl+U)"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                  aria-label="Refresh documents (Ctrl+R)"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Search and filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="document-search"
                  placeholder="Search documents... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search documents"
                />
              </div>

              <Button variant="outline" size="icon" aria-label="Advanced filters">
                <Filter className="h-4 w-4" />
              </Button>

              <Separator orientation="vertical" className="h-8" />

              {/* View mode toggle */}
              <div className="flex gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Sort: {sortField}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortField('name')}>
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortField('date')}>
                    Date
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortField('size')}>
                    Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortField('type')}>
                    Type
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bulk actions bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-accent rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedIds.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDownload}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Tag
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Move
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Document view */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'grid' ? (
            <DocumentGrid
              documents={filteredDocuments}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onOpen={onDocumentOpen}
              isLoading={isLoading}
            />
          ) : (
            <DocumentList
              documents={filteredDocuments}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onOpen={onDocumentOpen}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={(field) => {
                if (field === sortField) {
                  setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortField(field);
                  setSortOrder('asc');
                }
              }}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Upload dialog */}
      {showUploader && (
        <DocumentUploader
          onUpload={onUpload}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}
