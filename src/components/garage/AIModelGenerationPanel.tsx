/**
 * AIModelGenerationPanel — Glassmorphism panel showing AI 3D model
 * generation workflow: idle → queued → processing → complete → error.
 */

import { Sparkles, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

import { cn } from '@/lib/utils';

type GenerationStatus = 'idle' | 'queued' | 'processing' | 'complete' | 'error';

const STAGES = [
  'Analyzing reference images',
  'Building geometry',
  'Applying textures',
  'Optimizing mesh',
];

interface AIModelGenerationPanelProps {
  vehicleId: string;
  vehicleName: string;
  referenceImageUrl: string;
  onClose: () => void;
  onModelGenerated: (modelUrl: string) => void;
}

export function AIModelGenerationPanel({
  vehicleId,
  vehicleName,
  referenceImageUrl,
  onClose,
  onModelGenerated,
}: AIModelGenerationPanelProps) {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleGenerate = async () => {
    setStatus('queued');
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/vehicle-3d/generate-model', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId,
          referenceImageUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to start generation');

      const data = await response.json();
      jobIdRef.current = data.jobId;
      setStatus('processing');

      // Poll for progress
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/vehicle-3d/generate-model/${jobIdRef.current}/status`,
            { credentials: 'include' }
          );
          if (!pollRes.ok) throw new Error('Poll failed');

          const pollData = await pollRes.json();
          setProgress(pollData.progress || 0);
          setStage(pollData.stage || '');

          if (pollData.status === 'complete') {
            cleanup();
            setStatus('complete');
            setGeneratedModelUrl(pollData.modelUrl);
          } else if (pollData.status === 'error') {
            cleanup();
            setStatus('error');
            setError(pollData.error || 'Generation failed');
          }
        } catch {
          cleanup();
          setStatus('error');
          setError('Lost connection to generation service');
        }
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start generation');
    }
  };

  const handleApply = () => {
    if (generatedModelUrl) {
      onModelGenerated(generatedModelUrl);
    }
  };

  const stageIndex = STAGES.indexOf(stage);

  return (
    <div className="absolute right-4 top-16 z-30 w-80 bg-[var(--surface-1)]/95 backdrop-blur-sm rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-[var(--text-primary)]">AI Model Generation</span>
        </div>
        <button
          onClick={() => { cleanup(); onClose(); }}
          className="p-1 rounded hover:bg-[var(--surface-glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reference preview */}
      <div className="px-4 pt-3">
        <div className="relative aspect-[16/9] bg-[var(--surface-0)] rounded-lg overflow-hidden">
          <img
            src={referenceImageUrl}
            alt={vehicleName}
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
          <div className="absolute bottom-1.5 left-2 text-[10px] font-medium text-[var(--text-secondary)]">
            {vehicleName}
          </div>
        </div>
      </div>

      {/* Status-specific content */}
      <div className="px-4 py-3 space-y-3">
        {status === 'idle' && (
          <>
            <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
              Generate an AI-powered exact 3D model from reference images. This replaces the approximate GLB with a custom model.
            </p>
            <button
              onClick={handleGenerate}
              className="w-full py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Exact 3D Model
            </button>
          </>
        )}

        {status === 'queued' && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 className="w-5 h-5 text-emerald-400 animate-spin shrink-0" />
            <div>
              <div className="text-xs font-medium text-[var(--text-primary)]">Queued for generation...</div>
              <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Estimated: ~2 minutes</div>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-secondary)] font-medium">{stage || 'Processing...'}</span>
              <span className="text-emerald-400 font-mono">{progress}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Stage indicators */}
            <div className="space-y-1">
              {STAGES.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    i < stageIndex ? 'bg-emerald-500' :
                    i === stageIndex ? 'bg-emerald-400 animate-pulse' :
                    'bg-white/[0.12]'
                  )} />
                  <span className={cn(
                    'text-[9px]',
                    i <= stageIndex ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'
                  )}>
                    {s}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'complete' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 py-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-medium text-emerald-400">Model Generated</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">Ready to apply</div>
              </div>
            </div>
            <button
              onClick={handleApply}
              className="w-full py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
            >
              Apply Model
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 py-1">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-xs font-medium text-rose-400">Generation Failed</div>
                <div className="text-[10px] text-[var(--text-tertiary)]">{error}</div>
              </div>
            </div>
            <button
              onClick={() => { setStatus('idle'); setError(null); }}
              className="w-full py-2 rounded-lg text-xs font-medium bg-white/[0.08] text-[var(--text-secondary)] hover:bg-white/[0.12] transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
