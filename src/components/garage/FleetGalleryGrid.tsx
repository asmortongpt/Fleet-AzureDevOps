/**
 * FleetGalleryGrid — Responsive grid of fleet vehicles with IMAGIN.studio
 * thumbnails, model accuracy badges, and click-to-enter navigation.
 */

import { useState, useMemo } from 'react';
import { Search, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildImaginUrl } from '@/utils/imagin-studio';
import { resolveLocalModelUrl } from '@/utils/model-resolution';
import { formatEnum } from '@/utils/format-enum';

interface GalleryVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vehicleType?: string;
  status?: string;
}

interface FleetGalleryGridProps {
  vehicles: GalleryVehicle[];
  onSelectVehicle: (id: string) => void;
  onClose: () => void;
}

function statusColor(status: string): string {
  switch (status) {
    case 'active': case 'available': return 'text-emerald-400 bg-emerald-500/20';
    case 'in_service': case 'in_use': return 'text-sky-400 bg-sky-500/20';
    case 'pending': case 'scheduled': return 'text-amber-400 bg-amber-500/20';
    case 'inactive': case 'out_of_service': return 'text-rose-400 bg-rose-500/20';
    default: return 'text-white/50 bg-white/[0.08]';
  }
}

export function FleetGalleryGrid({ vehicles, onSelectVehicle, onClose }: FleetGalleryGridProps) {
  const [search, setSearch] = useState('');
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter(
      (v) =>
        `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q)
    );
  }, [vehicles, search]);

  return (
    <div className="absolute inset-0 z-15 top-12 bottom-14 bg-[#111]/95 backdrop-blur-sm overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#111]/90 backdrop-blur-md border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white/80">Fleet Gallery</h2>
          <span className="text-[10px] text-white/40">{filtered.length} vehicles</span>
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search make, model..."
              className="h-8 pl-8 pr-3 w-56 text-xs bg-white/[0.05] border border-white/[0.08] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
        {filtered.map((v) => {
          const resolution = resolveLocalModelUrl(v.make, v.model, v.vehicleType);
          const thumbUrl = buildImaginUrl(v.make, v.model, v.year, '01', 400);
          const hasError = imgErrors.has(v.id);

          return (
            <button
              key={v.id}
              onClick={() => onSelectVehicle(v.id)}
              className="group text-left bg-[#1a1a1a] rounded-xl border border-white/[0.08] hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[16/9] bg-[#0a0a0a] overflow-hidden">
                {hasError ? (
                  <div className="flex items-center justify-center h-full text-white/15">
                    <span className="text-xs">No preview</span>
                  </div>
                ) : (
                  <img
                    src={thumbUrl}
                    alt={`${v.year} ${v.make} ${v.model}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={() => setImgErrors((prev) => new Set(prev).add(v.id))}
                  />
                )}
                {/* Accuracy badge overlay */}
                <div className="absolute top-2 right-2">
                  {resolution.isExactMatch ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#111]/80 backdrop-blur-sm">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-[8px] font-medium text-emerald-400">Exact</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#111]/80 backdrop-blur-sm">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                      <span className="text-[8px] font-medium text-amber-400">Approx</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="px-3 py-2.5">
                <div className="text-xs font-medium text-white/80 truncate">
                  {v.year} {v.make} {v.model}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {v.status && (
                    <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', statusColor(v.status))}>
                      {formatEnum(v.status)}
                    </span>
                  )}
                  {!resolution.isExactMatch && resolution.matchedModelName && (
                    <span className="text-[9px] text-white/30 truncate">
                      3D: {resolution.matchedModelName}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <Search className="w-8 h-8 mb-2" />
          <p className="text-sm">No vehicles match "{search}"</p>
        </div>
      )}
    </div>
  );
}
