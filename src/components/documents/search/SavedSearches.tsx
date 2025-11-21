/**
 * SavedSearches - Save and manage search queries
 * Features: Save searches, quick access, edit, delete
 */

import { useState } from 'react';
import { Save, Star, Trash2, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SavedSearch, SearchFilters } from '@/lib/documents/types';
import { formatRelativeTime } from '@/lib/documents/utils';

interface SavedSearchesProps {
  savedSearches: SavedSearch[];
  onSave: (name: string, filters: SearchFilters) => void;
  onLoad: (search: SavedSearch) => void;
  onDelete: (id: string) => void;
  currentFilters?: SearchFilters;
}

export function SavedSearches({
  savedSearches,
  onSave,
  onLoad,
  onDelete,
  currentFilters
}: SavedSearchesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');

  const handleSave = () => {
    if (searchName.trim() && currentFilters) {
      onSave(searchName.trim(), currentFilters);
      setSearchName('');
      setIsDialogOpen(false);
    }
  };

  const getFilterCount = (filters: SearchFilters) => {
    return (
      (filters.types?.length || 0) +
      (filters.categories?.length || 0) +
      (filters.tags?.length || 0) +
      (filters.dateFrom ? 1 : 0) +
      (filters.dateTo ? 1 : 0) +
      (filters.hasOcr ? 1 : 0) +
      (filters.hasAiInsights ? 1 : 0)
    );
  };

  return (
    <div>
      {/* Save current search button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save search
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save search</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="search-name">Search name</Label>
              <Input
                id="search-name"
                placeholder="e.g., Recent incident reports"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>

            {currentFilters && (
              <div>
                <Label className="text-xs text-muted-foreground">Current filters</Label>
                <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                  {currentFilters.query && (
                    <div className="mb-2">
                      <strong>Query:</strong> {currentFilters.query}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {currentFilters.types?.map((type) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                    {currentFilters.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!searchName.trim()}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved searches list */}
      {savedSearches.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Saved Searches</h4>
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <button
                onClick={() => onLoad(search)}
                className="flex-1 flex items-start gap-3 text-left"
              >
                <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{search.name}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {getFilterCount(search.filters)} filters
                    </Badge>
                    {search.lastUsed && (
                      <span>Last used {formatRelativeTime(search.lastUsed)}</span>
                    )}
                  </div>
                </div>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onLoad(search)}>
                    <Search className="mr-2 h-4 w-4" />
                    Load search
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(search.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
