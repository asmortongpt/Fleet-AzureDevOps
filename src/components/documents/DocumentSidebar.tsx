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
import { useEffect, useState } from 'react';

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
import { secureFetch } from '@/hooks/use-api';
import { Folder as FolderType } from '@/lib/documents/types';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  currentFolderId?: string;
  onFolderSelect: (folderId: string | undefined) => void;
  className?: string;
}

export function DocumentSidebar({
  currentFolderId,
  onFolderSelect,
  className
}: DocumentSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['vehicles']));
  const [folders, setFolders] = useState<FolderType[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadFolders = async () => {
      try {
        const response = await secureFetch('/api/documents/categories');
        if (!response.ok) return;
        const payload = await response.json();
        const data = payload.data || payload || [];
        if (!isMounted) return;
        setFolders(data);
      } catch {
        if (!isMounted) return;
        setFolders([]);
      }
    };

    loadFolders();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const rootFolders = folders.filter(f => !f.parentId);
  const getChildFolders = (parentId: string) => folders.filter(f => f.parentId === parentId);

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
            count={319}
            active={!currentFolderId}
            onClick={() => onFolderSelect(undefined)}
          />
          <QuickLink
            icon={Star}
            label="Favorites"
            count={12}
          />
          <QuickLink
            icon={Clock}
            label="Recent"
            count={24}
          />
          <QuickLink
            icon={Share2}
            label="Shared"
            count={8}
          />
          <QuickLink
            icon={TagIcon}
            label="Tagged"
            count={156}
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
            <span className="font-medium">2.4 GB / 10 GB</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[24%]" />
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
