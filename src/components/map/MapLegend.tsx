import { memo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMapMarkerSettings } from '@/stores/useMapMarkerSettings';

import {
  VEHICLE_TYPE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  getMarkerPreviewSvg,
} from '@/utils/vehicle-map-icons';

export const MapLegend = memo(function MapLegend() {
  const [expanded, setExpanded] = useState(false);
  const { markerStyle } = useMapMarkerSettings();

  return (
    <div className="absolute top-4 left-4 z-20">
      <div
        className="rounded-lg border border-white/[0.08] bg-[#242424]/95 backdrop-blur-sm shadow-lg"
        style={{ minWidth: expanded ? 280 : undefined }}
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
          {/* Inline colour key when collapsed */}
          {!expanded && (
            <div className="flex items-center gap-1 ml-2">
              {Object.entries(STATUS_COLORS).map(([key, color]) => (
                <span
                  key={key}
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                  title={STATUS_LABELS[key] ?? key}
                />
              ))}
            </div>
          )}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="px-2.5 pb-2.5 pt-0.5 border-t border-white/[0.08]">
            {/* Status colours — primary section */}
            <div className="mb-2">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 leading-none block mb-1.5">
                Status Colours
              </span>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                {Object.entries(STATUS_COLORS).map(([key, color]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <img
                      src={getMarkerPreviewSvg('sedan', color, markerStyle)}
                      alt={STATUS_LABELS[key] ?? key}
                      className="h-5 w-auto"
                    />
                    <span className="text-[10px] text-white/70 leading-tight">
                      {STATUS_LABELS[key] ?? key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle types */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 leading-none block mb-1.5">
                Vehicle Types
              </span>
              <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                {Object.entries(VEHICLE_TYPE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <img
                      src={getMarkerPreviewSvg(key, '#10b981', markerStyle)}
                      alt={label}
                      className="h-5 w-auto"
                    />
                    <span className="text-[10px] text-white/60 leading-tight">
                      {label}
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
