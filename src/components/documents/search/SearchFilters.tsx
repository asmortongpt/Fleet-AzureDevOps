/**
 * SearchFilters - Advanced filters panel
 * Features: Type, date range, size, tags, categories
 */

import { useState, useTransition } from 'react';
import { Calendar, Tag, FileType, HardDrive, User, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchFilters as Filters, DocumentType, FileCategory } from '@/lib/documents/types';
import { formatFileSize } from '@/lib/documents/utils';

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  availableTags?: string[];
}

export function SearchFilters({ filters, onChange, availableTags = [] }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const documentTypes: DocumentType[] = [
    'pdf', 'image', 'video', 'audio', 'document', 'spreadsheet',
    'presentation', 'code', 'archive', '3d-model'
  ];

  const categories: FileCategory[] = [
    'incident-reports', 'evidence', 'vehicle-docs', 'maintenance',
    'contracts', 'insurance', 'legal', 'personal'
  ];

  const toggleType = (type: DocumentType) => {
    startTransition(() => {
      const types = filters.types || [];
      const newTypes = types.includes(type)
        ? types.filter(t => t !== type)
        : [...types, type];
      onChange({ ...filters, types: newTypes });
    });
  };

  const toggleCategory = (category: FileCategory) => {
    startTransition(() => {
      const categories = filters.categories || [];
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories, category];
      onChange({ ...filters, categories: newCategories });
    });
  };

  const toggleTag = (tag: string) => {
    startTransition(() => {
      const tags = filters.tags || [];
      const newTags = tags.includes(tag)
        ? tags.filter(t => t !== tag)
        : [...tags, tag];
      onChange({ ...filters, tags: newTags });
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      onChange({});
    });
  };

  const activeFilterCount =
    (filters.types?.length || 0) +
    (filters.categories?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.hasOcr ? 1 : 0) +
    (filters.hasAiInsights ? 1 : 0);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className={isPending ? 'opacity-70' : ''}
        >
          <FileType className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Filters</h3>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className={`max-h-[500px] transition-opacity duration-200 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="p-4 space-y-6">
            {/* Document Types */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <FileType className="h-4 w-4" />
                Document Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {documentTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.types?.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Categories */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4" />
                Categories
              </Label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${category}`}
                      checked={filters.categories?.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={`cat-${category}`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {category.replace(/-/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Tags */}
            {availableTags.length > 0 && (
              <>
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4" />
                    Tags
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag}
                        variant={filters.tags?.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Date Range */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4" />
                Date Range
              </Label>
              <div className="space-y-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      {filters.dateFrom ? filters.dateFrom.toLocaleDateString() : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) =>
                        startTransition(() => onChange({ ...filters, dateFrom: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      {filters.dateTo ? filters.dateTo.toLocaleDateString() : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) =>
                        startTransition(() => onChange({ ...filters, dateTo: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            {/* AI Features */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4" />
                AI Features
              </Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-ocr"
                    checked={filters.hasOcr}
                    onCheckedChange={(checked) =>
                      startTransition(() =>
                        onChange({ ...filters, hasOcr: checked as boolean })
                      )
                    }
                  />
                  <label htmlFor="has-ocr" className="text-sm font-medium cursor-pointer">
                    Has OCR text
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="has-ai"
                    checked={filters.hasAiInsights}
                    onCheckedChange={(checked) =>
                      startTransition(() =>
                        onChange({ ...filters, hasAiInsights: checked as boolean })
                      )
                    }
                  />
                  <label htmlFor="has-ai" className="text-sm font-medium cursor-pointer">
                    Has AI insights
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
