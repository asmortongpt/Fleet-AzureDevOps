import { useState, useCallback, useEffect, useRef } from 'react'

interface FeatureTip {
  id: string
  target: string
  title: string
  description: string
  session: number
}

const FEATURE_TIPS: FeatureTip[] = [
  {
    id: 'search',
    target: '[data-tip="search"]',
    title: 'Quick Search',
    description: 'Press \u2318K to search vehicles, drivers, routes, and more.',
    session: 1,
  },
  {
    id: 'vehicle-detail',
    target: '[data-tip="vehicle"]',
    title: 'Vehicle Details',
    description: 'Click any vehicle to see real-time details and history.',
    session: 1,
  },
  {
    id: 'drag-widgets',
    target: '[data-tip="dashboard"]',
    title: 'Custom Dashboard',
    description: 'Drag and drop widgets to customize your dashboard layout.',
    session: 2,
  },
  {
    id: 'context-menu',
    target: '[data-tip="row"]',
    title: 'Quick Actions',
    description: 'Right-click any row for quick actions like edit, assign, or export.',
    session: 2,
  },
  {
    id: 'saved-views',
    target: '[data-tip="filter"]',
    title: 'Saved Views',
    description: 'Save filter combinations as Views for one-click access.',
    session: 3,
  },
  {
    id: 'shortcuts',
    target: '[data-tip="shortcuts"]',
    title: 'Keyboard Shortcuts',
    description: 'Press ? to see all available keyboard shortcuts.',
    session: 3,
  },
]

const STORAGE_KEY = 'fleet_feature_discovery'

interface DiscoveryState {
  shownTips: string[]
  sessionCount: number
  disabled: boolean
}

function loadState(): DiscoveryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DiscoveryState
      return {
        shownTips: Array.isArray(parsed.shownTips) ? parsed.shownTips : [],
        sessionCount: typeof parsed.sessionCount === 'number' ? parsed.sessionCount : 0,
        disabled: typeof parsed.disabled === 'boolean' ? parsed.disabled : false,
      }
    }
  } catch {
    // Corrupted storage; start fresh
  }
  return { shownTips: [], sessionCount: 0, disabled: false }
}

function saveState(state: DiscoveryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable; silently ignore
  }
}

export function useFeatureDiscovery() {
  const sessionIncrementedRef = useRef(false)
  const [state, setState] = useState<DiscoveryState>(() => {
    const loaded = loadState()
    // Increment session count once on first mount per page load
    if (!sessionIncrementedRef.current) {
      sessionIncrementedRef.current = true
      const updated = { ...loaded, sessionCount: loaded.sessionCount + 1 }
      saveState(updated)
      return updated
    }
    return loaded
  })

  // Derive the current tip to show: first tip matching the current session
  // that has not been shown yet and whose target element exists in the DOM.
  const [currentTip, setCurrentTip] = useState<FeatureTip | null>(null)
  const tipResolvedRef = useRef(false)

  useEffect(() => {
    // Only resolve once per page load and only if not disabled
    if (tipResolvedRef.current || state.disabled) {
      return
    }

    // Use a short delay so the DOM has time to render target elements
    const timer = setTimeout(() => {
      if (tipResolvedRef.current) return

      const sessionNumber = state.sessionCount
      const candidates = FEATURE_TIPS.filter(
        (tip) => tip.session <= sessionNumber && !state.shownTips.includes(tip.id)
      )

      for (const candidate of candidates) {
        const el = document.querySelector(candidate.target)
        if (el) {
          setCurrentTip(candidate)
          tipResolvedRef.current = true
          return
        }
      }

      // No matching tip found with a visible target; nothing to show
      tipResolvedRef.current = true
    }, 500)

    return () => clearTimeout(timer)
  }, [state.disabled, state.sessionCount, state.shownTips])

  const dismissTip = useCallback(() => {
    if (!currentTip) return
    setState((prev) => {
      const updated: DiscoveryState = {
        ...prev,
        shownTips: [...prev.shownTips, currentTip.id],
      }
      saveState(updated)
      return updated
    })
    setCurrentTip(null)
  }, [currentTip])

  const disableAll = useCallback(() => {
    setState((prev) => {
      const updated: DiscoveryState = {
        ...prev,
        disabled: true,
        // Also mark the current tip as shown so it doesn't linger
        shownTips: currentTip
          ? [...prev.shownTips, currentTip.id]
          : prev.shownTips,
      }
      saveState(updated)
      return updated
    })
    setCurrentTip(null)
  }, [currentTip])

  return { currentTip, dismissTip, disableAll }
}
