/**
 * TagManager - Tag creation, color coding, management
 * Features: Create, edit, delete tags, color customization, bulk operations
 */

import { useState } from 'react';
import { Plus, Edit, Trash2, Palette, Search } from 'lucide-react';import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tag } from '@/lib/documents/types';

interface TagManagerProps {
  tags: Tag[];
  onCreateTag: (name: string, color: string) => void;
  onUpdateTag: (id: string, name: string, color: string) => void;
  onDeleteTag: (id: string) => void;
}

const TAG_COLORS = [
  { name: 'Red', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { name: 'Orange', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { name: 'Yellow', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { name: 'Green', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { name: 'Blue', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { name: 'Indigo', class: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { name: 'Purple', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { name: 'Pink', class: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
];

export function TagManager({ tags, onCreateTag, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0].class);

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (tagName.trim()) {
      onCreateTag(tagName.trim(), tagColor);
      setTagName('');
      setShowCreateDialog(false);
    }
  };

  const handleUpdate = () => {
    if (editingTag && tagName.trim()) {
      onUpdateTag(editingTag.id, tagName.trim(), tagColor);
      setEditingTag(null);
      setTagName('');
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setTagName(tag.name);
    setTagColor(tag.color);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create tag
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Badge className={tag.color}>{tag.name}</Badge>
              <span className="text-sm text-muted-foreground">
                {tag.count} {tag.count === 1 ? 'document' : 'documents'}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => startEdit(tag)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit tag
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Palette className="mr-2 h-4 w-4" />
                  Change color
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteTag(tag.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateDialog || !!editingTag}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingTag(null);
            setTagName('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="tag-name">Tag name</Label>
              <Input
                id="tag-name"
                placeholder="Enter tag name..."
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    editingTag ? handleUpdate() : handleCreate();
                  }
                }}
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setTagColor(color.class)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      tagColor === color.class ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                    }`}
                  >
                    <Badge className={color.class}>{color.name}</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingTag(null);
                  setTagName('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={editingTag ? handleUpdate : handleCreate}
                disabled={!tagName.trim()}
              >
                {editingTag ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
