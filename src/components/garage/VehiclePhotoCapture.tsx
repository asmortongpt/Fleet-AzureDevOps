/**
 * VehiclePhotoCapture - 8-angle guided photo capture for vehicle showcase photos.
 *
 * Presents a thumbnail strip of 8 angle slots, a main capture/preview area,
 * and auto-advances to the next empty slot after each capture. Users can
 * skip angles (not all 8 are required) and click "Done" when satisfied.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { Camera, Check, RotateCcw, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
] as const

// ============================================================================
// Types
// ============================================================================

interface VehiclePhotoCaptureProps {
  onCapture: (files: File[]) => void
  maxPhotos?: number // default 8
}

// ============================================================================
// Helpers
// ============================================================================

/** Find the index of the next empty slot after `fromIndex`, wrapping around. Returns -1 if all filled. */
function findNextEmptySlot(captures: (File | null)[], fromIndex: number): number {
  const len = captures.length
  for (let offset = 1; offset <= len; offset++) {
    const idx = (fromIndex + offset) % len
    if (captures[idx] === null) return idx
  }
  return -1
}

// ============================================================================
// Component
// ============================================================================

export function VehiclePhotoCapture({ onCapture, maxPhotos = 8 }: VehiclePhotoCaptureProps) {
  const angleCount = Math.min(maxPhotos, CAPTURE_ANGLES.length)

  const [selectedSlot, setSelectedSlot] = useState(0)
  const [captures, setCaptures] = useState<(File | null)[]>(() => Array(angleCount).fill(null))
  const [previews, setPreviews] = useState<(string | null)[]>(() => Array(angleCount).fill(null))

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup preview blob URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) URL.revokeObjectURL(url)
      })
    }
    // Only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Revoke old preview blob if re-capturing this slot
      const oldPreview = previews[selectedSlot]
      if (oldPreview) URL.revokeObjectURL(oldPreview)

      const newPreview = URL.createObjectURL(file)

      setCaptures((prev) => {
        const copy = [...prev]
        copy[selectedSlot] = file
        return copy
      })
      setPreviews((prev) => {
        const copy = [...prev]
        copy[selectedSlot] = newPreview
        return copy
      })

      // Reset input so selecting the same file fires onChange again
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Auto-advance to next empty slot
      setCaptures((latestCaptures) => {
        // We need to look at the captures _after_ this update to find the next empty.
        // Since state batching means we can't read the new value synchronously,
        // we compute it from the copy we just created.
        const updated = [...latestCaptures]
        updated[selectedSlot] = file
        const nextEmpty = findNextEmptySlot(updated, selectedSlot)
        if (nextEmpty !== -1) {
          // Schedule the slot selection outside this setState
          setTimeout(() => setSelectedSlot(nextEmpty), 0)
        }
        return updated
      })
    },
    [selectedSlot, previews]
  )

  const handleRetake = useCallback(() => {
    const oldPreview = previews[selectedSlot]
    if (oldPreview) URL.revokeObjectURL(oldPreview)

    setCaptures((prev) => {
      const copy = [...prev]
      copy[selectedSlot] = null
      return copy
    })
    setPreviews((prev) => {
      const copy = [...prev]
      copy[selectedSlot] = null
      return copy
    })
  }, [selectedSlot, previews])

  const handleRemove = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.stopPropagation()
      const oldPreview = previews[index]
      if (oldPreview) URL.revokeObjectURL(oldPreview)

      setCaptures((prev) => {
        const copy = [...prev]
        copy[index] = null
        return copy
      })
      setPreviews((prev) => {
        const copy = [...prev]
        copy[index] = null
        return copy
      })
    },
    [previews]
  )

  const handleDone = useCallback(() => {
    const files = captures.filter((f): f is File => f !== null)
    if (files.length > 0) {
      onCapture(files)
    }
  }, [captures, onCapture])

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const capturedCount = captures.filter((c) => c !== null).length
  const currentAngle = CAPTURE_ANGLES[selectedSlot]
  const hasCurrentPhoto = captures[selectedSlot] !== null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-4">
      {/* ---- Thumbnail strip ---- */}
      <div className="flex items-center justify-center gap-1.5 px-2">
        {CAPTURE_ANGLES.slice(0, angleCount).map((angle, i) => {
          const isCaptured = captures[i] !== null
          const isSelected = i === selectedSlot
          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedSlot(i)}
              className={cn(
                'relative w-10 h-10 rounded-lg border flex-shrink-0 overflow-hidden transition-all',
                'border-white/[0.08] bg-white/[0.03]',
                isSelected && 'ring-2 ring-emerald-500',
                !isCaptured && !isSelected && 'hover:bg-white/[0.06]'
              )}
              title={angle.label}
            >
              {isCaptured && previews[i] ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${previews[i]})` }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  {/* Remove button on hover */}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(i, e)}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </>
              ) : (
                <span className="text-[10px] font-medium text-white/30">{i + 1}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ---- Angle guide ---- */}
      <div className="text-center px-4">
        <div className="text-2xl mb-1">{currentAngle.icon}</div>
        <h3 className="text-sm font-semibold text-white/90">
          {currentAngle.label}
        </h3>
        <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
          {currentAngle.instruction}
        </p>
      </div>

      {/* ---- Main capture area ---- */}
      <div className="min-h-[200px] flex items-center justify-center px-4">
        {hasCurrentPhoto && previews[selectedSlot] ? (
          <div className="relative w-full max-w-sm">
            <img
              src={previews[selectedSlot]!}
              alt={`${currentAngle.label} capture`}
              className="w-full h-auto rounded-xl border border-white/[0.08] max-h-[220px] object-contain bg-[#0a0a0a]"
            />
            <button
              type="button"
              onClick={handleRetake}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#111]/90 text-xs text-white/70 hover:text-white hover:bg-white/[0.12] transition-colors border border-white/[0.08]"
            >
              <RotateCcw className="w-3 h-3" />
              Retake
            </button>
          </div>
        ) : (
          <label
            className={cn(
              'flex flex-col items-center gap-3 cursor-pointer px-8 py-8 rounded-xl w-full max-w-sm transition-colors',
              'border-2 border-dashed border-white/[0.12] hover:border-emerald-500/40 bg-white/[0.02]'
            )}
          >
            <Camera className="w-10 h-10 text-white/30" />
            <div className="text-center">
              <span className="text-sm text-white/60 block">
                Tap to capture {currentAngle.label}
              </span>
              <span className="text-[10px] text-white/30 block mt-1">
                Use your device camera or select a photo
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* ---- Quick actions row ---- */}
      <div className="flex items-center justify-center gap-2 px-4">
        {selectedSlot > 0 && (
          <button
            type="button"
            onClick={() => setSelectedSlot((s) => Math.max(0, s - 1))}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            Previous
          </button>
        )}
        {!hasCurrentPhoto && (
          <button
            type="button"
            onClick={() => {
              const nextEmpty = findNextEmptySlot(captures, selectedSlot)
              if (nextEmpty !== -1 && nextEmpty !== selectedSlot) {
                setSelectedSlot(nextEmpty)
              } else if (selectedSlot < angleCount - 1) {
                setSelectedSlot((s) => s + 1)
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
          >
            Skip this angle
          </button>
        )}
        {hasCurrentPhoto && selectedSlot < angleCount - 1 && (
          <button
            type="button"
            onClick={() => setSelectedSlot((s) => Math.min(angleCount - 1, s + 1))}
            className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
          >
            Next
          </button>
        )}
      </div>

      {/* ---- Summary footer ---- */}
      <div className="space-y-2 px-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/40 tabular-nums flex items-center gap-1.5">
            <ImagePlus className="w-3.5 h-3.5" />
            {capturedCount}/{angleCount} photos captured
          </span>
          {capturedCount > 0 && capturedCount < angleCount && (
            <span className="text-[10px] text-white/30">
              {angleCount - capturedCount} remaining (optional)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleDone}
          disabled={capturedCount === 0}
          className={cn(
            'w-full py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
            capturedCount > 0
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-white/[0.04] text-white/20 cursor-not-allowed'
          )}
        >
          <Check className="w-4 h-4" />
          Done ({capturedCount} photo{capturedCount !== 1 ? 's' : ''})
        </button>
      </div>
    </div>
  )
}
