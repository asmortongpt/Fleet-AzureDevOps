/**
 * ReferencePhotoCard — Glassmorphism overlay showing real vehicle reference
 * images from IMAGIN.studio CDN. Displays model accuracy badge and lets
 * users cycle through 6 camera angles + apply the image as a 3D wrap.
 */

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, X, Minimize2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  IMAGIN_ANGLES,
  buildImaginUrl,
  type ImaginAngleId,
} from '@/utils/imagin-studio';

export interface ReferencePhotoCardProps {
  make: string;
  model: string;
  year: number;
  isExactMatch: boolean;
  matchedModelName: string | null;
  onApplyAsWrap?: () => void;
  onDismiss: () => void;
  hasActiveWrap: boolean;
  autoWrapApplied: boolean;
}

export function ReferencePhotoCard({
  make,
  model,
  year,
  isExactMatch,
  matchedModelName,
  onApplyAsWrap,
  onDismiss,
  hasActiveWrap,
  autoWrapApplied,
}: ReferencePhotoCardProps) {
  const [angle, setAngle] = useState<ImaginAngleId>('01');
  const [imgError, setImgError] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const imageUrl = buildImaginUrl(make, model, year, angle, 800);

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="absolute bottom-20 right-4 z-20 px-3 py-1.5 rounded-lg bg-[#111]/80 backdrop-blur-sm border border-white/[0.08] text-[10px] text-white/60 hover:text-white/80 transition-colors"
      >
        Show Reference
      </button>
    );
  }

  return (
    <div className="absolute bottom-20 right-4 z-20 w-72 bg-[#111]/80 backdrop-blur-md rounded-xl border border-white/[0.08] shadow-2xl overflow-hidden">
      {/* Header: accuracy badge + controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          {isExactMatch ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-medium text-emerald-400">
                Exact 3D Model
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400">
                Approximate{matchedModelName ? ` (${matchedModelName})` : ''}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-colors"
          >
            <Minimize2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div className="relative aspect-[16/9] bg-[#0a0a0a]">
        {imgError ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <ImageOff className="w-8 h-8 mb-1" />
            <span className="text-[10px]">Reference unavailable</span>
          </div>
        ) : (
          <img
            key={`${make}-${model}-${year}-${angle}`}
            src={imageUrl}
            alt={`${year} ${make} ${model} — ${IMAGIN_ANGLES.find((a) => a.id === angle)?.label || angle}`}
            className="w-full h-full object-contain"
            onError={() => setImgError(true)}
            loading="eager"
            crossOrigin="anonymous"
          />
        )}
        <div className="absolute bottom-1.5 left-2 text-[10px] font-medium text-white/70 drop-shadow-lg">
          {year} {make} {model}
        </div>
      </div>

      {/* Angle selector */}
      {!imgError && (
        <div className="flex items-center justify-center gap-1 px-2 py-1.5 border-t border-white/[0.08]">
          {IMAGIN_ANGLES.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAngle(a.id);
                setImgError(false);
              }}
              className={cn(
                'px-2 py-1 rounded text-[9px] font-medium transition-colors',
                angle === a.id
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/[0.05]'
              )}
              title={a.label}
            >
              {a.shortLabel}
            </button>
          ))}
        </div>
      )}

      {/* Apply as wrap — only for approximate matches */}
      {!isExactMatch && !imgError && onApplyAsWrap && (
        <div className="px-3 pb-2.5 pt-0.5">
          <button
            onClick={onApplyAsWrap}
            disabled={hasActiveWrap && autoWrapApplied}
            className={cn(
              'w-full py-1.5 rounded-lg text-[10px] font-medium transition-colors',
              hasActiveWrap && autoWrapApplied
                ? 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
            )}
          >
            {hasActiveWrap && autoWrapApplied
              ? 'Reference Wrap Applied'
              : 'Apply Reference as Wrap'}
          </button>
        </div>
      )}
    </div>
  );
}
