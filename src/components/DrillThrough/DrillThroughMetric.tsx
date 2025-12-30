import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

import type { DrillThroughConfig } from '../../types/drill-through';

import { DrillThroughModal } from './DrillThroughModal';

interface DrillThroughMetricProps {
  /** Display value */
  value: string | number;
  /** Drill-through configuration */
  config: DrillThroughConfig;
  /** Optional className for styling */
  className?: string;
  /** Optional label */
  label?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Custom tooltip */
  tooltip?: string;
}

/**
 * Clickable metric component that opens drill-through modal
 * Wraps any aggregated metric to make it drillable
 *
 * @example
 * <DrillThroughMetric
 *   value="50"
 *   label="vehicles in region"
 *   config={{
 *     entityType: 'vehicles',
 *     filters: { region: 'North' },
 *     title: 'Vehicles in North Region',
 *     columns: [
 *       { key: 'vin', label: 'VIN' },
 *       { key: 'make', label: 'Make' },
 *       { key: 'model', label: 'Model' },
 *     ],
 *   }}
 * />
 */
export function DrillThroughMetric({
  value,
  config,
  className = '',
  label,
  showIcon = true,
  tooltip,
}: DrillThroughMetricProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const defaultTooltip = `Click to view ${config.title?.toLowerCase() ?? 'details'}`;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-dashed underline-offset-2 hover:decoration-solid transition-all cursor-pointer ${className}`}
        title={tooltip || defaultTooltip}
        type="button"
      >
        <span className="font-semibold">{value}</span>
        {label && <span className="font-normal">{label}</span>}
        {showIcon && <ChevronRight className="w-4 h-4 opacity-50" />}
      </button>

      <DrillThroughModal
        config={config}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

/**
 * Inline variant for use within paragraphs/text
 */
export function DrillThroughInline({
  value,
  config,
  className = '',
}: Omit<DrillThroughMetricProps, 'label' | 'showIcon'>) {
  return (
    <DrillThroughMetric
      value={value}
      config={config}
      className={`text-inherit ${className}`}
      showIcon={false}
    />
  );
}