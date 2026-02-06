/**
 * DocumentSidebar - Folder tree navigation with drag-drop
 * Features: Nested folders, drag-drop, folder management, quick filters
 */

import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FolderPlus,
  Star,
  Clock,
  Share2,
  Tag as TagIcon,
  FileText
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DocumentMetadata, Folder as FolderType } from '@/lib/documents/types';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  documents?: DocumentMetadata[];
  currentFolderId?: string;
  onFolderSelect: (folderId: string | undefined) => void;
  className?: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; path: string }> = {
  'incident-reports': { label: 'Incident Reports', color: 'text-red-500', path: '/incidents' },
  evidence: { label: 'Evidence', color: 'text-blue-800', path: '/evidence' },
  'vehicle-docs': { label: 'Vehicle Documents', color: 'text-green-500', path: '/vehicles' },
  maintenance: { label: 'Maintenance Records', color: 'text-amber-500', path: '/maintenance' },
  insurance: { label: 'Insurance', color: 'text-purple-500', path: '/insurance' },
  contracts: { label: 'Contracts', color: 'text-orange-500', path: '/contracts' },
  legal: { label: 'Legal', color: 'text-rose-500', path: '/legal' },
  personal: { label: 'Personnel', color: 'text-slate-600', path: '/personnel' },
  uncategorized: { label: 'Uncategorized', color: 'text-slate-400', path: '/uncategorized' }
};

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function DocumentSidebar({
  documents = [],
  currentFolderId,
  onFolderSelect,
  className
}: DocumentSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const folderData = useMemo(() => {
    const folderMap = new Map<string, FolderType>();

    documents.forEach((doc) => {
      const category = doc.category || 'uncategorized';
      const meta = CATEGORY_META[category] || {
        label: category
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        color: 'text-slate-500',
        path: `/${category}`,
      };

      const existing = folderMap.get(category);
      if (existing) {
        existing.documentCount += 1;
        existing.modifiedAt = doc.modifiedAt > existing.modifiedAt ? doc.modifiedAt : existing.modifiedAt;
      } else {
        folderMap.set(category, {
          id: category,
          name: meta.label,
          path: meta.path,
          color: meta.color,
          documentCount: 1,
          createdAt: doc.createdAt,
          modifiedAt: doc.modifiedAt,
        });
      }
    });

    return Array.from(folderMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);

  const quickStats = useMemo(() => {
    const total = documents.length;
    const now = new Date();
    const recentCutoff = new Date(now);
    recentCutoff.setDate(now.getDate() - 30);

    const favorites = documents.filter((doc) =>
      (doc.tags || []).some((tag) => ['favorite', 'starred', 'important'].includes(tag.toLowerCase()))
    ).length;

    const recent = documents.filter((doc) => doc.createdAt && doc.createdAt >= recentCutoff).length;
    const shared = documents.filter((doc) => doc.isShared).length;
    const tagged = documents.filter((doc) => (doc.tags || []).length > 0).length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

    return { total, favorites, recent, shared, tagged, totalSize };
  }, [documents]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootFolders = folderData;
  const getChildFolders = (_parentId: string) => [] as FolderType[];

  return (
    <aside className={cn('flex flex-col bg-sidebar border-r', className)}>
      {/* Header */}
      <div className="p-2 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-sidebar-foreground">Documents</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick actions */}
        <div className="space-y-1">
          <QuickLink
            icon={FileText}
            label="All Documents"
            count={quickStats.total}
            active={!currentFolderId}
            onClick={() => onFolderSelect(undefined)}
          />
          <QuickLink
            icon={Star}
            label="Favorites"
            count={quickStats.favorites}
          />
          <QuickLink
            icon={Clock}
            label="Recent"
            count={quickStats.recent}
          />
          <QuickLink
            icon={Share2}
            label="Shared"
            count={quickStats.shared}
          />
          <QuickLink
            icon={TagIcon}
            label="Tagged"
            count={quickStats.tagged}
          />
        </div>
      </div>

      {/* Folders */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-1.5 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folders
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Create folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-0.5">
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                isActive={currentFolderId === folder.id}
                isExpanded={expandedFolders.has(folder.id)}
                onToggle={() => toggleFolder(folder.id)}
                onSelect={() => onFolderSelect(folder.id)}
                level={0}
              >
                {getChildFolders(folder.id).map((child) => (
                  <FolderNode
                    key={child.id}
                    folder={child}
                    isActive={currentFolderId === child.id}
                    isExpanded={expandedFolders.has(child.id)}
                    onToggle={() => toggleFolder(child.id)}
                    onSelect={() => onFolderSelect(child.id)}
                    level={1}
                  />
                ))}
              </FolderNode>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer - Storage info */}
      <div className="p-2 border-t">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Storage used</span>
            <span className="font-medium">{formatBytes(quickStats.totalSize)}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface QuickLinkProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

function QuickLink({ icon: Icon, label, count, active, onClick }: QuickLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="ml-auto">
          {count}
        </Badge>
      )}
    </button>
  );
}

interface FolderNodeProps {
  folder: FolderType;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  level: number;
  children?: React.ReactNode;
}

function FolderNode({
  folder,
  isActive,
  isExpanded,
  onToggle,
  onSelect,
  level,
  children
}: FolderNodeProps) {
  const hasChildren = !!children;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50 text-sidebar-foreground',
          level > 0 && 'ml-2'
        )}
      >
        {/* Expand/collapse */}
        {hasChildren ? (
          <button
            onClick={onToggle}
            className="p-0.5 hover:bg-sidebar-accent rounded"
            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Folder icon and name */}
        <button
          onClick={onSelect}
          className="flex-1 flex items-center gap-2 min-w-0"
        >
          {isExpanded ? (
            <FolderOpen className={cn('h-4 w-4 flex-shrink-0', folder.color)} />
          ) : (
            <Folder className={cn('h-4 w-4 flex-shrink-0', folder.color)} />
          )}
          <span className="truncate">{folder.name}</span>
        </button>

        {/* Count */}
        <Badge variant="secondary" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          {folder.documentCount}
        </Badge>

        {/* Actions */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                aria-label={`Actions for ${folder.name}`}
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FolderPlus className="mr-2 h-4 w-4" />
                New subfolder
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Rename
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

      {/* Children */}
      {isExpanded && children}
    </div>
  );
}
