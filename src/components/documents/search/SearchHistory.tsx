/**
 * SearchHistory - Recent searches tracking
 * Features: Recent searches, clear history, quick replay
 */

import { Clock, X, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/documents/utils';

interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount?: number;
}

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSearch: (query: string) => void;
  onClear: () => void;
  onRemove: (index: number) => void;
  maxItems?: number;
}

export function SearchHistory({
  history,
  onSearch,
  onClear,
  onRemove,
  maxItems = 20
}: SearchHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No search history</p>
      </div>
    );
  }

  const displayedHistory = history.slice(0, maxItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Recent Searches
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-xs"
        >
          Clear all
        </Button>
      </div>

      <ScrollArea className="max-h-96">
        <div className="space-y-1">
          {displayedHistory.map((item, index) => (
            <div
              key={index}
              className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <button
                onClick={() => onSearch(item.query)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{item.query}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{formatRelativeTime(item.timestamp)}</span>
                    {item.resultCount !== undefined && (
                      <>
                        <span>•</span>
                        <span>{item.resultCount} results</span>
                      </>
                    )}
                  </div>
                </div>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemove(index)}
                aria-label="Remove from history"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {history.length > maxItems && (
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Showing {maxItems} of {history.length} searches
        </div>
      )}

      {/* Popular searches (optional feature) */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4" />
          Popular Searches
        </h4>
        <div className="flex flex-wrap gap-2">
          {['incident reports', 'vehicle damage', 'insurance docs', 'evidence photos'].map((search) => (
            <Badge
              key={search}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => onSearch(search)}
            >
              {search}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
