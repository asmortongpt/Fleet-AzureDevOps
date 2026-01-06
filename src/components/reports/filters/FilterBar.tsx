import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateRange, DateRangePicker } from './DateRangePicker';
import { subMonths } from 'date-fns';

export interface FilterValues {
  dateRange: DateRange;
  businessArea: string;
  division: string;
  department: string;
  shop: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  onApply: () => void;
  availableDivisions?: string[];
  availableDepartments?: string[];
  availableShops?: string[];
}

/**
 * FilterBar - Comprehensive filter controls for reports
 *
 * Features:
 * - Date range selection with presets
 * - Business area filter
 * - Cascading filters (Division > Department > Shop)
 * - Dynamic options based on parent selections
 * - Clear all functionality
 * - Apply/Reset controls
 */
export function FilterBar({
  filters,
  onChange,
  onApply,
  availableDivisions = [],
  availableDepartments = [],
  availableShops = []
}: FilterBarProps) {
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(localFilters) !== JSON.stringify(filters);
    setHasChanges(changed);
  }, [localFilters, filters]);

  // Update local filter
  const updateFilter = <K extends keyof FilterValues>(key: K, value: FilterValues[K]) => {
    setLocalFilters((prev) => {
      const updated = { ...prev, [key]: value };

      // Cascade reset for hierarchical filters
      if (key === 'businessArea') {
        updated.division = 'All';
        updated.department = 'All';
        updated.shop = 'All';
      } else if (key === 'division') {
        updated.department = 'All';
        updated.shop = 'All';
      } else if (key === 'department') {
        updated.shop = 'All';
      }

      return updated;
    });
  };

  // Apply filters
  const handleApply = () => {
    onChange(localFilters);
    onApply();
  };

  // Reset filters
  const handleReset = () => {
    const defaultFilters: FilterValues = {
      dateRange: {
        start: subMonths(new Date(), 12),
        end: new Date(),
        label: 'Last 12 Months'
      },
      businessArea: 'All',
      division: 'All',
      department: 'All',
      shop: 'All'
    };
    setLocalFilters(defaultFilters);
    onChange(defaultFilters);
    onApply();
  };

  // Check if any filters are active
  const hasActiveFilters =
    localFilters.businessArea !== 'All' ||
    localFilters.division !== 'All' ||
    localFilters.department !== 'All' ||
    localFilters.shop !== 'All';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Date Range */}
        <div>
          <label htmlFor="date-range" className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <DateRangePicker
            value={localFilters.dateRange}
            onChange={(range) => updateFilter('dateRange', range)}
            className="w-full"
          />
        </div>

        {/* Business Area */}
        <div>
          <label htmlFor="business-area" className="block text-sm font-medium text-gray-700 mb-1">
            Business Area
          </label>
          <div className="relative">
            <select
              id="business-area"
              value={localFilters.businessArea}
              onChange={(e) => updateFilter('businessArea', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All</option>
              <option value="Fleet">Fleet</option>
              <option value="StarMetro">StarMetro</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Division */}
        <div>
          <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">
            Division
          </label>
          <div className="relative">
            <select
              id="division"
              value={localFilters.division}
              onChange={(e) => updateFilter('division', e.target.value)}
              disabled={localFilters.businessArea === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="All">All Divisions</option>
              {availableDivisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
          <div className="relative">
            <select
              id="department"
              value={localFilters.department}
              onChange={(e) => updateFilter('department', e.target.value)}
              disabled={localFilters.division === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="All">All Departments</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Shop */}
        <div>
          <label htmlFor="shop" className="block text-sm font-medium text-gray-700 mb-1">
            Shop
          </label>
          <div className="relative">
            <select
              id="shop"
              value={localFilters.shop}
              onChange={(e) => updateFilter('shop', e.target.value)}
              disabled={localFilters.department === 'All'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none bg-white pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="All">All Shops</option>
              {availableShops.map((shop) => (
                <option key={shop} value={shop}>
                  {shop}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {hasActiveFilters && (
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-indigo-500 rounded-full" />
              Filters active
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasActiveFilters && !hasChanges}
            size="sm"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasChanges}
            size="sm"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
