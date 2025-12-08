import { Search } from "lucide-react";
import React from 'react';

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Filter {
  id: string;
  label: string;
  type: 'search' | 'select';
  options?: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

export interface FilterPanelProps {
  filters: Filter[];
}

export function FilterPanel({ filters }: FilterPanelProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
      {filters.map(filter => (
        <div key={filter.id} className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          {filter.type === 'search' ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                aria-label={`Filter by ${filter.label}`}
                type="search"
                placeholder={`Search ${filter.label.toLowerCase()}...`}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${filter.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}
    </div>
  );
}
