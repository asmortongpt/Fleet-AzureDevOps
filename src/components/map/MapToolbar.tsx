import { Maximize2, Target } from 'lucide-react';
import { memo } from 'react';

interface MapToolbarProps {
  onFitAll?: () => void;
  onCenterSelected?: () => void;
  hasSelectedVehicle?: boolean;
}

/**
 * Floating map toolbar for fleet map controls.
 * Positioned top-right, below the Google native controls.
 */
export const MapToolbar = memo(function MapToolbar({
  onFitAll,
  onCenterSelected,
  hasSelectedVehicle = false,
}: MapToolbarProps) {
  return (
    <div className="absolute top-2 right-14 z-20 flex gap-1">
      {/* Fit all vehicles */}
      {onFitAll && (
        <button
          onClick={onFitAll}
          className="flex items-center gap-1 h-7 px-2 rounded-md bg-[var(--surface-2)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-default)] transition-all text-[10px] font-medium"
          title="Fit all vehicles"
        >
          <Maximize2 className="h-3 w-3" />
          <span>Fit All</span>
        </button>
      )}

      {/* Center on selected */}
      {onCenterSelected && (
        <button
          onClick={onCenterSelected}
          disabled={!hasSelectedVehicle}
          className={`flex items-center gap-1 h-7 px-2 rounded-md bg-[var(--surface-2)] border transition-all text-[10px] font-medium ${
            hasSelectedVehicle
              ? 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30'
              : 'border-[var(--border-subtle)] text-[var(--text-muted)] cursor-not-allowed'
          }`}
          title="Center on selected vehicle"
        >
          <Target className="h-3 w-3" />
          <span>Center</span>
        </button>
      )}
    </div>
  );
});
