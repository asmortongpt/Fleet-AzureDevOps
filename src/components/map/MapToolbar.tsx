import { memo } from 'react';
import { Maximize2, Target } from 'lucide-react';

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
          className="flex items-center gap-1 h-7 px-2 rounded-md bg-[#242424]/90 backdrop-blur-sm border border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15] transition-all shadow-lg text-[10px] font-medium"
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
          className={`flex items-center gap-1 h-7 px-2 rounded-md bg-[#242424]/90 backdrop-blur-sm border transition-all shadow-lg text-[10px] font-medium ${
            hasSelectedVehicle
              ? 'border-white/[0.08] text-white/60 hover:text-emerald-400 hover:border-emerald-500/30'
              : 'border-white/[0.04] text-white/20 cursor-not-allowed'
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
