import { Settings2, X } from 'lucide-react';
import { memo, useState } from 'react';

import { useMapMarkerSettings } from '@/stores/useMapMarkerSettings';
import type { MarkerStyle, MarkerSize } from '@/stores/useMapMarkerSettings';
import { getMarkerPreviewSvg, STATUS_COLORS } from '@/utils/vehicle-map-icons';

const STYLE_OPTIONS: { value: MarkerStyle; label: string }[] = [
  { value: 'pin', label: 'Pin' },
  { value: 'circle', label: 'Circle' },
  { value: 'badge', label: 'Badge' },
];

const SIZE_OPTIONS: { value: MarkerSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

export const MapMarkerSettings = memo(function MapMarkerSettings() {
  const [open, setOpen] = useState(false);
  const {
    markerStyle,
    markerSize,
    showLabels,
    setMarkerStyle,
    setMarkerSize,
    setShowLabels,
  } = useMapMarkerSettings();

  return (
    <div className="absolute top-2 right-[7.5rem] z-20">
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 h-7 px-2 rounded-md backdrop-blur-sm border transition-all shadow-lg text-[10px] font-medium ${
          open
            ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
            : 'bg-[#242424]/90 border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15]'
        }`}
        title="Marker settings"
      >
        <Settings2 className="h-3 w-3" />
        <span>Markers</span>
      </button>

      {/* Settings panel */}
      {open && (
        <div className="absolute top-9 right-0 w-[240px] rounded-lg border border-white/[0.08] bg-[#242424]/95 backdrop-blur-sm shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
            <span className="text-[11px] font-semibold text-white/80">Marker Settings</span>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            {/* Style selector */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                Style
              </span>
              <div className="flex gap-2">
                {STYLE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setMarkerStyle(value)}
                    className={`flex-1 flex flex-col items-center gap-1.5 py-2 px-1 rounded-md border transition-all ${
                      markerStyle === value
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                    }`}
                  >
                    <img
                      src={getMarkerPreviewSvg('truck', STATUS_COLORS.active, value)}
                      alt={label}
                      className="h-7 w-auto"
                    />
                    <span
                      className={`text-[9px] font-medium ${
                        markerStyle === value ? 'text-emerald-400' : 'text-white/50'
                      }`}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size selector */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                Size
              </span>
              <div className="flex gap-1">
                {SIZE_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setMarkerSize(value)}
                    className={`flex-1 py-1 rounded-md border text-[10px] font-medium transition-all ${
                      markerSize === value
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/[0.12]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Labels toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
                Vehicle Labels
              </span>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`relative w-8 h-4 rounded-full transition-colors ${
                  showLabels ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                    showLabels ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Live preview row */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40 block mb-1.5">
                Preview
              </span>
              <div className="flex items-end gap-2 p-2 rounded-md bg-white/[0.03] border border-white/[0.06]">
                {(['truck', 'sedan', 'suv', 'van'] as const).map((type) => (
                  <img
                    key={type}
                    src={getMarkerPreviewSvg(type, STATUS_COLORS.active, markerStyle)}
                    alt={type}
                    className="h-8 w-auto"
                  />
                ))}
                <img
                  src={getMarkerPreviewSvg('bus', STATUS_COLORS.idle, markerStyle)}
                  alt="idle"
                  className="h-8 w-auto"
                />
                <img
                  src={getMarkerPreviewSvg('emergency', STATUS_COLORS.emergency, markerStyle)}
                  alt="emergency"
                  className="h-8 w-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
