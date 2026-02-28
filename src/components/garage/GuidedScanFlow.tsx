/**
 * GuidedScanFlow - 8-angle guided capture walkthrough component.
 *
 * Walks the user through capturing photos of a vehicle from 8
 * standardised angles (front, front-left, left, rear-left, rear,
 * rear-right, right, front-right) before submitting for scanning.
 */

import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
  Play,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/utils';

// ============================================================================
// Constants
// ============================================================================

const CAPTURE_ANGLES = [
  { label: 'Front', instruction: 'Stand directly in front of the vehicle, centered on the grille', icon: '\u2191' },
  { label: 'Front-Left', instruction: 'Move to the front-left corner at a 45\u00B0 angle', icon: '\u2197' },
  { label: 'Left Side', instruction: 'Stand at the left side, centered on the doors', icon: '\u2192' },
  { label: 'Rear-Left', instruction: 'Move to the rear-left corner at a 45\u00B0 angle', icon: '\u2198' },
  { label: 'Rear', instruction: 'Stand directly behind the vehicle, centered', icon: '\u2193' },
  { label: 'Rear-Right', instruction: 'Move to the rear-right corner at a 45\u00B0 angle', icon: '\u2199' },
  { label: 'Right Side', instruction: 'Stand at the right side, centered on the doors', icon: '\u2190' },
  { label: 'Front-Right', instruction: 'Move to the front-right corner at a 45\u00B0 angle', icon: '\u2196' },
] as const;

// ============================================================================
// Types
// ============================================================================

interface GuidedScanFlowProps {
  onComplete: (files: File[]) => void;
  onCancel: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function GuidedScanFlow({ onComplete, onCancel }: GuidedScanFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [captures, setCaptures] = useState<(File | null)[]>(() => Array(8).fill(null));
  const [previews, setPreviews] = useState<(string | null)[]>(() => Array(8).fill(null));

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Revoke old preview if any
      const oldPreview = previews[currentStep];
      if (oldPreview) URL.revokeObjectURL(oldPreview);

      const newPreview = URL.createObjectURL(file);

      setCaptures((prev) => {
        const copy = [...prev];
        copy[currentStep] = file;
        return copy;
      });
      setPreviews((prev) => {
        const copy = [...prev];
        copy[currentStep] = newPreview;
        return copy;
      });

      // Reset file input so re-selecting the same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [currentStep, previews]
  );

  const handleRetake = useCallback(() => {
    const oldPreview = previews[currentStep];
    if (oldPreview) URL.revokeObjectURL(oldPreview);

    setCaptures((prev) => {
      const copy = [...prev];
      copy[currentStep] = null;
      return copy;
    });
    setPreviews((prev) => {
      const copy = [...prev];
      copy[currentStep] = null;
      return copy;
    });
  }, [currentStep, previews]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep((s) => Math.min(7, s + 1));
  }, []);

  const handleSubmit = useCallback(() => {
    const files = captures.filter((f): f is File => f !== null);
    if (files.length === 8) {
      onComplete(files);
    }
  }, [captures, onComplete]);

  const allCaptured = captures.every((c) => c !== null);
  const capturedCount = captures.filter((c) => c !== null).length;
  const currentAngle = CAPTURE_ANGLES[currentStep];
  const hasCurrent = captures[currentStep] !== null;

  return (
    <div className="space-y-4">
      {/* Progress dots row */}
      <div className="flex items-center justify-center gap-2">
        {CAPTURE_ANGLES.map((angle, i) => {
          const isCaptured = captures[i] !== null;
          const isCurrent = i === currentStep;
          return (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                'w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all',
                isCaptured && !isCurrent && 'bg-emerald-500 text-white',
                isCurrent && 'ring-2 ring-emerald-500 bg-emerald-500/20 text-emerald-400',
                !isCaptured && !isCurrent && 'border border-[var(--border-strong)] text-[var(--text-muted)]'
              )}
              title={angle.label}
            >
              {isCaptured ? (
                <Check className="w-3 h-3" />
              ) : (
                <span>{i + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Current angle info */}
      <div className="text-center">
        <div className="text-2xl mb-1">{currentAngle.icon}</div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{currentAngle.label}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{currentAngle.instruction}</p>
      </div>

      {/* Capture area */}
      <div className="min-h-[180px] flex items-center justify-center">
        {hasCurrent && previews[currentStep] ? (
          <div className="relative w-full max-w-sm">
            <img
              src={previews[currentStep]!}
              alt={`${currentAngle.label} capture`}
              className="w-full h-auto rounded-xl border border-[var(--border-subtle)] max-h-[200px] object-contain bg-[var(--surface-0)]"
            />
            <button
              onClick={handleRetake}
              className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--surface-2)]/90 text-xs text-[var(--text-primary)] hover:text-white hover:bg-white/[0.12] transition-colors border border-[var(--border-subtle)]"
            >
              <RotateCcw className="w-3 h-3" />
              Retake
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 cursor-pointer px-8 py-6 rounded-xl border-2 border-dashed border-[var(--border-strong)] hover:border-emerald-500/40 bg-white/[0.02] transition-colors w-full max-w-sm">
            <Camera className="w-8 h-8 text-[var(--text-muted)]" />
            <span className="text-sm text-[var(--text-secondary)]">Tap to capture {currentAngle.label}</span>
            <span className="text-[10px] text-[var(--text-muted)]">Use your device camera or select a photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleCapture}
            />
          </label>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors',
            currentStep === 0
              ? 'text-[var(--text-muted)] cursor-not-allowed'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
          )}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Previous
        </button>

        <span className="text-[10px] text-[var(--text-tertiary)] tabular-nums">
          {currentStep + 1} of 8 &middot; {capturedCount} captured
        </span>

        <button
          onClick={handleNext}
          disabled={currentStep === 7 || !hasCurrent}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors',
            currentStep === 7 || !hasCurrent
              ? 'text-[var(--text-muted)] cursor-not-allowed'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06]'
          )}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Submit section */}
      {allCaptured && (
        <button
          onClick={handleSubmit}
          className="w-full py-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          Start Scan ({capturedCount}/8 photos)
        </button>
      )}

      {/* Cancel */}
      <div className="text-center">
        <button
          onClick={onCancel}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
        >
          Cancel guided scan
        </button>
      </div>
    </div>
  );
}
