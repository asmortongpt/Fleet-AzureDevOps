/**
 * SemanticSearch - Natural language search
 * Features: Semantic search, similar documents, AI-powered relevance
 */

import { useState, useTransition } from 'react';
import { Search, Sparkles, FileText, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentMetadata } from '@/lib/documents/types';
import { formatFileSize, formatRelativeTime, getDocumentColor } from '@/lib/documents/utils';

interface SemanticSearchResult extends DocumentMetadata {
  relevanceScore: number;
  matchReason: string;
}

interface SemanticSearchProps {
  onSearch: (query: string) => Promise<SemanticSearchResult[]>;
}

export function SemanticSearch({ onSearch }: SemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = async () => {
    if (!query.trim()) return;

    startTransition(async () => {
      const searchResults = await onSearch(query.trim());
      setResults(searchResults);
    });
  };

  const exampleQueries = [
    'Documents about vehicle damage from last month',
    'Insurance claims with high severity',
    'Maintenance reports needing immediate action',
    'Evidence photos from traffic incidents',
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Semantic Search
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Search using natural language and context
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Describe what you're looking for..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
          />
          <Button onClick={handleSearch} disabled={!query.trim() || isPending}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {results.length === 0 && !isPending ? (
          <div className="p-6">
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-muted-foreground opacity-30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Try searching with natural language
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Example Queries
              </h4>
              {exampleQueries.map((example, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(example)}
                  className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <p className="text-sm">{example}</p>
                </button>
              ))}
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Analyzing documents with AI...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">
                {results.length} {results.length === 1 ? 'Result' : 'Results'}
              </h4>
              <Badge variant="outline">
                Sorted by relevance
              </Badge>
            </div>

            <Separator />

            <div className="space-y-3">
              {results.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function SearchResultCard({ result }: { result: SemanticSearchResult }) {
  return (
    <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
      <div className="flex items-start gap-3">
        <FileText className={`h-5 w-5 mt-0.5 ${getDocumentColor(result.type)}`} />

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h4 className="font-medium truncate">{result.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {result.type}
              </Badge>
              <span>{formatFileSize(result.size)}</span>
              <span>•</span>
              <span>{formatRelativeTime(result.createdAt)}</span>
            </div>
          </div>

          {/* Relevance score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Relevance</span>
              <span className="font-medium">{Math.round(result.relevanceScore * 100)}%</span>
            </div>
            <Progress value={result.relevanceScore * 100} className="h-1.5" />
          </div>

          {/* Match reason */}
          <div className="flex items-start gap-2 p-2 bg-muted rounded text-xs">
            <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">{result.matchReason}</p>
          </div>

          {/* Tags */}
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {result.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{result.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
