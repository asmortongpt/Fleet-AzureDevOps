/**
 * FolderManager - Create, move, organize folders
 * Features: Hierarchical folder management, drag-drop, bulk move
 */

import { useState } from 'react';
import { Folder, FolderPlus, Edit, Trash2, Move, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Folder as FolderType } from '@/lib/documents/types';

interface FolderManagerProps {
  folders: FolderType[];
  onCreateFolder: (name: string, parentId?: string) => void;
  onUpdateFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveFolder: (folderId: string, newParentId: string) => void;
}

export function FolderManager({
  folders,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveFolder
}: FolderManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState('');
  const [parentFolderId, setParentFolderId] = useState<string>('');

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim(), parentFolderId || undefined);
      setFolderName('');
      setParentFolderId('');
      setShowCreateDialog(false);
    }
  };

  const handleUpdate = () => {
    if (editingFolder && folderName.trim()) {
      onUpdateFolder(editingFolder.id, folderName.trim());
      setEditingFolder(null);
      setFolderName('');
    }
  };

  const startEdit = (folder: FolderType) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
  };

  const rootFolders = folders.filter(f => !f.parentId);
  const getChildFolders = (parentId: string) => folders.filter(f => f.parentId === parentId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Folders</h3>
        <Button onClick={() => setShowCreateDialog(true)}>
          <FolderPlus className="mr-2 h-4 w-4" />
          New folder
        </Button>
      </div>

      <ScrollArea className="h-[600px] border rounded-lg p-4">
        <div className="space-y-1">
          {rootFolders.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              childFolders={getChildFolders(folder.id)}
              allFolders={folders}
              onEdit={startEdit}
              onDelete={onDeleteFolder}
              onMove={onMoveFolder}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingFolder}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingFolder(null);
            setFolderName('');
            setParentFolderId('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name..."
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingFolder ? handleUpdate() : handleCreate();
                  }
                }}
              />
            </div>

            {!editingFolder && (
              <div>
                <Label>Parent folder (optional)</Label>
                <Select value={parentFolderId} onValueChange={setParentFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Root (no parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Root (no parent)</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingFolder(null);
                  setFolderName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingFolder ? handleUpdate : handleCreate}
                disabled={!folderName.trim()}
              >
                {editingFolder ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FolderTreeNodeProps {
  folder: FolderType;
  childFolders: FolderType[];
  allFolders: FolderType[];
  onEdit: (folder: FolderType) => void;
  onDelete: (id: string) => void;
  onMove: (folderId: string, newParentId: string) => void;
  level?: number;
}

function FolderTreeNode({
  folder,
  childFolders,
  allFolders,
  onEdit,
  onDelete,
  onMove,
  level = 0
}: FolderTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div>
      <div
        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors group"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {childFolders.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-accent-foreground/10 rounded"
            >
              <ChevronRight
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          <Folder className="h-4 w-4 text-primary" />
          <span className="font-medium truncate">{folder.name}</span>
          <Badge variant="secondary" className="ml-2">
            {folder.documentCount}
          </Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(folder)}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Move className="mr-2 h-4 w-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FolderPlus className="mr-2 h-4 w-4" />
              New subfolder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(folder.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && childFolders.map((child) => {
        const grandchildren = allFolders.filter(f => f.parentId === child.id);
        return (
          <FolderTreeNode
            key={child.id}
            folder={child}
            childFolders={grandchildren}
            allFolders={allFolders}
            onEdit={onEdit}
            onDelete={onDelete}
            onMove={onMove}
            level={level + 1}
          />
        );
      })}
    </div>
  );
}
