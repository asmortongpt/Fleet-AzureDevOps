import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Calendar } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

// Preset date ranges
const PRESETS: Array<{ label: string; getValue: () => DateRange }> = [
  {
    label: 'Last 7 Days',
    getValue: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 7 Days'
    })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
      label: 'Last 30 Days'
    })
  },
  {
    label: 'Last 3 Months',
    getValue: () => ({
      start: subMonths(new Date(), 3),
      end: new Date(),
      label: 'Last 3 Months'
    })
  },
  {
    label: 'Last 6 Months',
    getValue: () => ({
      start: subMonths(new Date(), 6),
      end: new Date(),
      label: 'Last 6 Months'
    })
  },
  {
    label: 'Last 12 Months',
    getValue: () => ({
      start: subMonths(new Date(), 12),
      end: new Date(),
      label: 'Last 12 Months'
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
      label: 'This Month'
    })
  },
  {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
        label: 'Last Month'
      };
    }
  },
  {
    label: 'This Year',
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
      label: 'This Year'
    })
  },
  {
    label: 'Last Year',
    getValue: () => {
      const lastYear = subYears(new Date(), 1);
      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear),
        label: 'Last Year'
      };
    }
  }
];

/**
 * DateRangePicker - Comprehensive date range selector for reports
 *
 * Features:
 * - Common presets (Last 7 days, Last 12 months, etc.)
 * - Custom date range selection
 * - Accessible keyboard navigation
 * - Clear visual feedback
 */
export function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const displayText = useMemo(() => {
    return `${format(value.start, 'MMM d, yyyy')} - ${format(value.end, 'MMM d, yyyy')}`;
  }, [value]);

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue();
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);

      if (start <= end) {
        onChange({
          start,
          end,
          label: 'Custom Range'
        });
        setIsOpen(false);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-start text-left font-normal ${className}`}
          aria-label="Select date range"
        >
          <Calendar className="mr-2 h-4 w-4" />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Preset ranges */}
          <div>
            <h4 className="text-sm font-medium mb-2 text-gray-700">Quick Select</h4>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className={`justify-start ${value.label === preset.label ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : ''}`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom range */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 text-gray-700">Custom Range</h4>
            <div className="space-y-2">
              <div>
                <label htmlFor="custom-start" className="block text-xs text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  id="custom-start"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="custom-end" className="block text-xs text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  id="custom-end"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <Button
                onClick={handleCustomRange}
                disabled={!customStart || !customEnd}
                className="w-full"
                size="sm"
              >
                Apply Custom Range
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
