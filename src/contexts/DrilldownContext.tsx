/**
 * DrilldownContext - Multi-layer data navigation system
 * Enables users to drill down through multiple levels of related data
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
export interface DrilldownLevel {
  id: string
  type: string
  label: string
  data: any
  timestamp: number
}

export interface DrilldownContextType {
  levels: DrilldownLevel[]
  currentLevel: DrilldownLevel | null
  push: (level: Omit<DrilldownLevel, 'timestamp'>) => void
  pop: () => void
  reset: () => void
  goToLevel: (index: number) => void
  canGoBack: boolean
  canGoForward: boolean
}

const DrilldownContext = createContext<DrilldownContextType | undefined>(undefined)

export function DrilldownProvider({ children }: { children: ReactNode }) {
  const [levels, setLevels] = useState<DrilldownLevel[]>([])

  const push = useCallback((level: Omit<DrilldownLevel, 'timestamp'>) => {
    setLevels(prev => [...prev, { ...level, timestamp: Date.now() }])
  }, [])

  const pop = useCallback(() => {
    setLevels(prev => prev.slice(0, -1))
  }, [])

  const reset = useCallback(() => {
    setLevels([])
  }, [])

  const goToLevel = useCallback((index: number) => {
    setLevels(prev => prev.slice(0, index + 1))
  }, [])

  const currentLevel = levels[levels.length - 1] || null
  const canGoBack = levels.length > 0
  const canGoForward = false // Could implement forward navigation with history

  return (
    <DrilldownContext.Provider
      value={{
        levels,
        currentLevel,
        push,
        pop,
        reset,
        goToLevel,
        canGoBack,
        canGoForward,
      }}
    >
      {children}
    </DrilldownContext.Provider>
  )
}

export function useDrilldown() {
  const context = useContext(DrilldownContext)
  if (!context) {
    throw new Error('useDrilldown must be used within DrilldownProvider')
  }
  return context
}
