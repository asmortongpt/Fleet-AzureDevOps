/**
 * DocumentClassification - Auto-tagging UI
 * Features: AI-suggested tags, categories, auto-classification
 */

import { useState } from 'react';
import { Tag, Sparkles, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentMetadata, FileCategory } from '@/lib/documents/types';
import { generateTagColor } from '@/lib/documents/utils';

interface SuggestedTag {
  name: string;
  confidence: number;
  source: 'ai' | 'content' | 'metadata';
}

interface DocumentClassificationProps {
  document: DocumentMetadata;
  suggestedTags: SuggestedTag[];
  onApplyTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onChangeCategory: (category: FileCategory) => void;
}

export function DocumentClassification({
  document,
  suggestedTags,
  onApplyTag,
  onRemoveTag,
  onChangeCategory
}: DocumentClassificationProps) {
  const [newTag, setNewTag] = useState('');
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const handleAddTag = () => {
    if (newTag.trim() && !document.tags.includes(newTag.trim())) {
      onApplyTag(newTag.trim());
      setNewTag('');
    }
  };

  const highConfidenceTags = suggestedTags.filter(t => t.confidence > 0.7);
  const mediumConfidenceTags = suggestedTags.filter(t => t.confidence > 0.4 && t.confidence <= 0.7);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Classification
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          AI-powered tagging and categorization
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {/* Current tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Current Tags
                </span>
                <Badge variant="secondary">{document.tags.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`${generateTagColor(tag)} flex items-center gap-1 pr-1`}
                    >
                      {tag}
                      <button
                        onClick={() => onRemoveTag(tag)}
                        className="ml-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tags yet</p>
              )}

              <Separator className="my-4" />

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                  }}
                />
                <Button onClick={handleAddTag} disabled={!newTag.trim()} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI-suggested tags */}
          {highConfidenceTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Suggested Tags
                  <Badge variant="outline" className="ml-auto">High Confidence</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {highConfidenceTags.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.name}
                      suggestion={suggestion}
                      isApplied={document.tags.includes(suggestion.name)}
                      onApply={() => onApplyTag(suggestion.name)}
                      onRemove={() => onRemoveTag(suggestion.name)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medium confidence suggestions */}
          {mediumConfidenceTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    More Suggestions
                    <Badge variant="outline">Medium Confidence</Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                  >
                    {showAllSuggestions ? 'Hide' : 'Show all'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showAllSuggestions && (
                <CardContent>
                  <div className="space-y-3">
                    {mediumConfidenceTags.map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.name}
                        suggestion={suggestion}
                        isApplied={document.tags.includes(suggestion.name)}
                        onApply={() => onApplyTag(suggestion.name)}
                        onRemove={() => onRemoveTag(suggestion.name)}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Category classification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Badge variant="secondary" className="capitalize">
                  {document.category.replace(/-/g, ' ')}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Change category to improve organization and discovery
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  isApplied,
  onApply,
  onRemove
}: {
  suggestion: SuggestedTag;
  isApplied: boolean;
  onApply: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className={generateTagColor(suggestion.name)}>
            {suggestion.name}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {suggestion.source}
          </Badge>
        </div>
        <div className="space-y-1">
          <Progress value={suggestion.confidence * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground">
            {Math.round(suggestion.confidence * 100)}% confidence
          </p>
        </div>
      </div>

      {isApplied ? (
        <Button variant="ghost" size="sm" onClick={onRemove} className="ml-2">
          <Check className="mr-1 h-4 w-4 text-green-500" />
          Applied
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onApply} className="ml-2">
          <Plus className="mr-1 h-4 w-4" />
          Apply
        </Button>
      )}
    </div>
  );
}
