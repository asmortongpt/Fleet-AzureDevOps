import React, { useEffect, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface FeatureTooltipProps {
  target: string
  title: string
  description: string
  onDismiss: () => void
  onDisableAll: () => void
}

interface Position {
  top: number
  left: number
  arrowLeft: number
  placement: 'below' | 'above'
}

const AUTO_DISMISS_MS = 10_000

export default function FeatureTooltip({
  target,
  title,
  description,
  onDismiss,
  onDisableAll,
}: FeatureTooltipProps) {
  const [position, setPosition] = useState<Position | null>(null)
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const interactedRef = useRef(false)

  const computePosition = useCallback(() => {
    const el = document.querySelector(target)
    if (!el) return null

    const rect = el.getBoundingClientRect()
    const tooltipWidth = 280
    const arrowSize = 8
    const gap = 12

    // Determine whether to place above or below the target
    const spaceBelow = window.innerHeight - rect.bottom
    const placement: 'below' | 'above' = spaceBelow < 160 ? 'above' : 'below'

    // Horizontal: center on the target, clamped to viewport
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipWidth - 12))

    // Arrow always points to center of target element
    const arrowLeft = Math.max(
      16,
      Math.min(rect.left + rect.width / 2 - left, tooltipWidth - 16)
    )

    let top: number
    if (placement === 'below') {
      top = rect.bottom + gap + arrowSize
    } else {
      // We need the tooltip height; estimate conservatively
      const estimatedHeight = 120
      top = rect.top - gap - arrowSize - estimatedHeight
    }

    return { top, left, arrowLeft, placement }
  }, [target])

  // Position on mount and window resize / scroll
  useEffect(() => {
    const update = () => {
      const pos = computePosition()
      if (pos) setPosition(pos)
    }

    // Initial positioning with a tiny delay to allow portal to mount
    const initialTimer = setTimeout(update, 50)

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      clearTimeout(initialTimer)
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [computePosition])

  // Recalculate once the tooltip is rendered so "above" placement accounts for actual height
  useEffect(() => {
    if (!position || position.placement !== 'above' || !tooltipRef.current) return
    const el = document.querySelector(target)
    if (!el) return

    const rect = el.getBoundingClientRect()
    const tooltipHeight = tooltipRef.current.offsetHeight
    const arrowSize = 8
    const gap = 12
    const correctedTop = rect.top - gap - arrowSize - tooltipHeight

    if (Math.abs(correctedTop - position.top) > 2) {
      setPosition((prev) => (prev ? { ...prev, top: correctedTop } : prev))
    }
  }, [position, target])

  // Fade in after position is calculated
  useEffect(() => {
    if (!position) return
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [position])

  // Auto-dismiss after 10 seconds if no interaction
  useEffect(() => {
    autoDismissRef.current = setTimeout(() => {
      if (!interactedRef.current) {
        onDismiss()
      }
    }, AUTO_DISMISS_MS)

    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current)
    }
  }, [onDismiss])

  const handleInteraction = useCallback(() => {
    interactedRef.current = true
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current)
      autoDismissRef.current = null
    }
  }, [])

  const handleDismiss = useCallback(() => {
    handleInteraction()
    onDismiss()
  }, [handleInteraction, onDismiss])

  const handleDisableAll = useCallback(() => {
    handleInteraction()
    onDisableAll()
  }, [handleInteraction, onDisableAll])

  if (!position) return null

  const tooltip = (
    <div
      ref={tooltipRef}
      role="tooltip"
      onMouseEnter={handleInteraction}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        maxWidth: 280,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
        pointerEvents: visible ? 'auto' : 'none',
        fontFamily: 'Montserrat, sans-serif',
      }}
    >
      {/* Arrow */}
      {position.placement === 'below' && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            left: position.arrowLeft - 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid #2A1878',
          }}
        />
      )}

      {/* Card */}
      <div
        style={{
          background: '#2A1878',
          border: '1px solid rgba(0, 204, 254, 0.15)',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(26, 6, 72, 0.5)',
          padding: 16,
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close tooltip"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            lineHeight: 0,
            color: 'rgba(255, 255, 255, 0.40)',
            transition: 'color 150ms',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.40)'
          }}
        >
          <X size={14} />
        </button>

        {/* Title */}
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            marginBottom: 6,
            paddingRight: 20,
          }}
        >
          {title}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 13,
            color: 'rgba(255, 255, 255, 0.65)',
            lineHeight: 1.5,
            marginBottom: 14,
          }}
        >
          {description}
        </div>

        {/* Actions row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={handleDismiss}
            style={{
              background: '#1F3076',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#332090'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1F3076'
            }}
          >
            Got it
          </button>
          <button
            onClick={handleDisableAll}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.40)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.40)'
            }}
          >
            Don't show tips
          </button>
        </div>
      </div>

      {/* Arrow below (when tooltip is above target) */}
      {position.placement === 'above' && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: position.arrowLeft - 8,
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #2A1878',
          }}
        />
      )}
    </div>
  )

  return createPortal(tooltip, document.body)
}
