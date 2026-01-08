import { Filter, X, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface FilterOption {
  id: string;
  label: string;
  value: string | number;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface MobileFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterGroups: FilterGroup[];
  selectedFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onReset?: () => void;
  title?: string;
  className?: string;
}

export function MobileFilterSheet({
  open,
  onOpenChange,
  filterGroups,
  selectedFilters,
  onFiltersChange,
  onReset,
  title = 'Filters',
  className
}: MobileFilterSheetProps) {
  const [localFilters, setLocalFilters] = useState(selectedFilters);

  const handleCheckboxChange = (groupId: string, optionId: string, checked: boolean) => {
    const current = (localFilters[groupId] as string[]) || [];
    const updated = checked
      ? [...current, optionId]
      : current.filter((id: string) => id !== optionId);

    setLocalFilters({
      ...localFilters,
      [groupId]: updated
    });
  };

  const handleRadioChange = (groupId: string, optionId: string) => {
    setLocalFilters({
      ...localFilters,
      [groupId]: optionId
    });
  };

  const handleRangeChange = (groupId: string, value: number[]) => {
    setLocalFilters({
      ...localFilters,
      [groupId]: value
    });
  };

  const handleToggleChange = (groupId: string, checked: boolean) => {
    setLocalFilters({
      ...localFilters,
      [groupId]: checked
    });
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalFilters({});
    if (onReset) {
      onReset();
    }
  };

  const activeFilterCount = Object.keys(localFilters).reduce((count, key) => {
    const value = localFilters[key];
    if (Array.isArray(value)) {
      return count + value.length;
    }
    if (value !== undefined && value !== null && value !== '') {
      return count + 1;
    }
    return count;
  }, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn('h-[85vh] p-0 flex flex-col', className)}
        data-testid="mobile-filter-sheet"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {title}
              {activeFilterCount > 0 && (
                <Badge variant="default" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </SheetTitle>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-blue-600"
                data-testid="reset-filters-btn"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Filter Groups */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-6">
            {filterGroups.map((group) => (
              <div key={group.id} className="space-y-3">
                <Label className="text-base font-semibold">{group.label}</Label>

                {group.type === 'checkbox' && group.options && (
                  <div className="space-y-3">
                    {group.options.map((option) => {
                      const isChecked = (localFilters[group.id] as string[] || []).includes(option.id);
                      return (
                        <div key={option.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`${group.id}-${option.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(group.id, option.id, checked as boolean)
                            }
                            className="touch-manipulation"
                            data-testid={`filter-checkbox-${option.id}`}
                          />
                          <Label
                            htmlFor={`${group.id}-${option.id}`}
                            className="flex-1 flex items-center justify-between cursor-pointer touch-manipulation"
                          >
                            <span>{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-sm text-muted-foreground">
                                ({option.count})
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                )}

                {group.type === 'radio' && group.options && (
                  <div className="grid grid-cols-2 gap-2">
                    {group.options.map((option) => {
                      const isSelected = localFilters[group.id] === option.id;
                      return (
                        <Button
                          key={option.id}
                          variant={isSelected ? 'default' : 'outline'}
                          size="lg"
                          onClick={() => handleRadioChange(group.id, option.id)}
                          className="h-12 touch-manipulation"
                          data-testid={`filter-radio-${option.id}`}
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="ml-2 text-xs opacity-70">
                              ({option.count})
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}

                {group.type === 'range' && (
                  <div className="space-y-4 pt-2">
                    <Slider
                      min={group.min || 0}
                      max={group.max || 100}
                      step={group.step || 1}
                      value={localFilters[group.id] as number[] || [group.min || 0, group.max || 100]}
                      onValueChange={(value) => handleRangeChange(group.id, value)}
                      className="touch-manipulation"
                      data-testid={`filter-range-${group.id}`}
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>
                        {(localFilters[group.id] as number[])?.[0] || group.min || 0}
                        {group.unit}
                      </span>
                      <span>
                        {(localFilters[group.id] as number[])?.[1] || group.max || 100}
                        {group.unit}
                      </span>
                    </div>
                  </div>
                )}

                {group.type === 'toggle' && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`toggle-${group.id}`} className="flex-1">
                      Enable {group.label}
                    </Label>
                    <Checkbox
                      id={`toggle-${group.id}`}
                      checked={localFilters[group.id] as boolean || false}
                      onCheckedChange={(checked) =>
                        handleToggleChange(group.id, checked as boolean)
                      }
                      className="touch-manipulation"
                      data-testid={`filter-toggle-${group.id}`}
                    />
                  </div>
                )}

                <Separator />
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer with Actions */}
        <SheetFooter className="px-4 py-4 border-t mt-auto">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 touch-manipulation"
              data-testid="cancel-filters-btn"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleApply}
              className="flex-1 h-12 touch-manipulation"
              data-testid="apply-filters-btn"
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Quick filter chips component for showing active filters
interface ActiveFilterChipsProps {
  filters: Record<string, any>;
  filterGroups: FilterGroup[];
  onRemoveFilter: (groupId: string, optionId?: string) => void;
  onOpenFilters: () => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  filterGroups,
  onRemoveFilter,
  onOpenFilters,
  className
}: ActiveFilterChipsProps) {
  const activeFilters: Array<{ groupId: string; groupLabel: string; label: string; value?: string }> = [];

  Object.entries(filters).forEach(([groupId, value]) => {
    const group = filterGroups.find((g) => g.id === groupId);
    if (!group) return;

    if (Array.isArray(value) && value.length > 0) {
      value.forEach((optionId) => {
        const option = group.options?.find((o) => o.id === optionId);
        if (option) {
          activeFilters.push({
            groupId,
            groupLabel: group.label,
            label: option.label,
            value: optionId
          });
        }
      });
    } else if (value !== undefined && value !== null && value !== '') {
      activeFilters.push({
        groupId,
        groupLabel: group.label,
        label: String(value)
      });
    }
  });

  if (activeFilters.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className={cn('h-9 touch-manipulation', className)}
        data-testid="open-filters-btn"
      >
        <Filter className="h-4 w-4 mr-2" />
        Add Filters
      </Button>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)} data-testid="active-filter-chips">
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.groupId}-${filter.value || index}`}
          variant="secondary"
          className="pl-3 pr-1 py-1.5 h-auto text-xs"
        >
          <span className="mr-1.5">{filter.label}</span>
          <button
            onClick={() => onRemoveFilter(filter.groupId, filter.value)}
            className="ml-1 hover:bg-slate-200 rounded-full p-0.5 touch-manipulation"
            aria-label={`Remove ${filter.label} filter`}
            data-testid={`remove-filter-${filter.groupId}-${filter.value}`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenFilters}
        className="h-7 px-2 text-xs touch-manipulation"
        data-testid="edit-filters-btn"
      >
        <Filter className="h-3 w-3 mr-1" />
        Edit
      </Button>
    </div>
  );
}
