/**
 * ComparisonSplitView — Draggable before/after slider comparing
 * the live 3D model (left) with an IMAGIN.studio reference photo (right).
 */

import { X } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';

interface ComparisonSplitViewProps {
  referenceImageUrl: string;
  onClose: () => void;
}

export function ComparisonSplitView({ referenceImageUrl, onClose }: ComparisonSplitViewProps) {
  const [splitPct, setSplitPct] = useState(50);
  const [imgError, setImgError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handlePointerDown = useCallback(() => {
    dragging.current = true;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(10, Math.min(90, (x / rect.width) * 100));
    setSplitPct(pct);
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  if (imgError) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 top-12 bottom-14 cursor-col-resize select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Reference image — right side, clipped from left */}
      <img
        src={referenceImageUrl}
        alt="Reference comparison"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${splitPct}%)` }}
        onError={() => setImgError(true)}
        crossOrigin="anonymous"
      />

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/40 cursor-col-resize z-20"
        style={{ left: `${splitPct}%`, transform: 'translateX(-50%)' }}
        onPointerDown={handlePointerDown}
      >
        {/* Grab handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#111]/80 border-2 border-white/40 flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-3 bg-white/40 rounded-full" />
            <div className="w-0.5 h-3 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div
        className="absolute top-4 text-[10px] font-medium text-white/40 bg-[#111]/60 px-2 py-0.5 rounded"
        style={{ left: `calc(${splitPct / 2}% - 20px)` }}
      >
        3D Model
      </div>
      <div
        className="absolute top-4 text-[10px] font-medium text-white/40 bg-[#111]/60 px-2 py-0.5 rounded"
        style={{ left: `calc(${splitPct + (100 - splitPct) / 2}% - 24px)` }}
      >
        Reference
      </div>

      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 z-30 p-1.5 rounded-lg bg-[#111]/80 border border-white/[0.04] text-white/40 hover:text-white/60 transition-colors pointer-events-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
