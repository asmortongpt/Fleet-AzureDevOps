/**
 * DocumentSearch - Global search with live results
 * Features: Live search, recent searches, suggestions, filters
 */

import { useState, useEffect, useRef, useTransition } from 'react';
import { Search, Clock, X, Filter, Loader2, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DocumentMetadata, SearchFilters } from '@/lib/documents/types';
import { formatFileSize, formatRelativeTime, getDocumentColor } from '@/lib/documents/utils';

interface DocumentSearchProps {
  documents: DocumentMetadata[];
  onSelectDocument?: (document: DocumentMetadata) => void;
  onFiltersChange?: (filters: SearchFilters) => void;
  recentSearches?: string[];
  onSaveSearch?: (query: string) => void;
}

export function DocumentSearch({
  documents,
  onSelectDocument,
  onFiltersChange,
  recentSearches = [],
  onSaveSearch
}: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<DocumentMetadata[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Perform search with transition for responsive UI
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Simulate search delay (replace with actual search logic)
    const timer = setTimeout(() => {
      // Wrap expensive filtering in startTransition to keep input responsive
      startTransition(() => {
        const searchResults = documents.filter(doc => {
          const searchText = `${doc.name} ${doc.ocrText || ''} ${doc.aiSummary || ''} ${doc.tags.join(' ')}`.toLowerCase();
          return searchText.includes(query.toLowerCase());
        });

        setResults(searchResults);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, documents]);

  const handleSelectDocument = (document: DocumentMetadata) => {
    if (onSelectDocument) {
      onSelectDocument(document);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
          <CommandInput
            ref={inputRef}
            placeholder="Search documents, content, tags..."
            value={query}
            onValueChange={setQuery}
            onFocus={() => setIsOpen(true)}
            className="flex-1"
          />

          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Button
            variant={showFilters ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {isOpen && (
          <CommandList>
            {/* Loading state */}
            {isPending && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* No query - show recent searches */}
            {!query && !isPending && recentSearches.length > 0 && (
              <CommandGroup heading="Recent Searches">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => handleRecentSearch(search)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    {search}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* No results */}
            {query && !isPending && results.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    No documents found
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* Search results */}
            {query && !isPending && results.length > 0 && (
              <>
                <CommandGroup heading={`${results.length} Results`}>
                  {results.slice(0, 10).map((document) => (
                    <CommandItem
                      key={document.id}
                      onSelect={() => handleSelectDocument(document)}
                      className="flex items-start gap-3 p-3"
                    >
                      <FileText className={`h-5 w-5 mt-0.5 ${getDocumentColor(document.type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{document.name}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {document.type}
                          </Badge>
                          <span>{formatFileSize(document.size)}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(document.createdAt)}</span>
                        </div>

                        {/* Preview text from OCR or AI summary */}
                        {(document.ocrText || document.aiSummary) && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {document.ocrText?.substring(0, 150) || document.aiSummary}
                          </p>
                        )}

                        {/* AI insights indicator */}
                        {document.aiSummary && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Insights available</span>
                          </div>
                        )}

                        {/* Tags */}
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {document.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {document.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{document.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {results.length > 10 && (
                  <div className="p-2 text-center text-xs text-muted-foreground border-t">
                    Showing 10 of {results.length} results
                  </div>
                )}
              </>
            )}
          </CommandList>
        )}
      </Command>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
