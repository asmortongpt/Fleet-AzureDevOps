import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  VEHICLE_TYPE_LABELS,
  STATUS_COLORS,
} from '@/utils/vehicle-map-icons';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  charging: 'Charging',
  service: 'In Service',
  emergency: 'Emergency',
  offline: 'Offline',
};

export const MapLegend = memo(function MapLegend() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-20">
      <div
        className="rounded-lg border border-white/[0.08] bg-[#242424]/95 backdrop-blur-sm shadow-lg"
        style={{ minWidth: expanded ? 260 : undefined }}
      >
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-white/80 hover:text-white transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse map legend' : 'Expand map legend'}
        >
          {expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
          )}
          <span className="text-[11px] font-medium select-none">Legend</span>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-0 px-2.5 pb-2 pt-0.5 border-t border-white/[0.08]">
            {/* Vehicle types column */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 leading-none">
                Vehicle Type
              </span>
              <div className="mt-1 flex flex-col gap-[3px]">
                {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0 border border-white/20"
                      style={{ backgroundColor: '#10b981' }}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-white/60 leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status colors column */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 leading-none">
                Status
              </span>
              <div className="mt-1 flex flex-col gap-[3px]">
                {Object.entries(STATUS_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] text-white/60 leading-tight">
                      {STATUS_LABELS[key] ?? key}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
