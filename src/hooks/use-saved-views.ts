import { useState, useCallback, useEffect } from 'react'

export interface FilterCondition {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: string | number | string[]
}

export interface SavedView {
  id: string
  name: string
  filters: FilterCondition[]
  createdAt: string
}

const STORAGE_KEY = 'fleet_saved_views'

function loadFromStorage(): SavedView[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as SavedView[]
  } catch {
    return []
  }
}

function persistToStorage(views: SavedView[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
  } catch {
    // localStorage may be full or unavailable
  }
}

export function useSavedViews() {
  const [views, setViews] = useState<SavedView[]>(() => loadFromStorage())

  // Sync to localStorage whenever views change
  useEffect(() => {
    persistToStorage(views)
  }, [views])

  const saveView = useCallback((name: string, filters: FilterCondition[]) => {
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters: [...filters],
      createdAt: new Date().toISOString(),
    }
    setViews((prev) => [...prev, newView])
  }, [])

  const deleteView = useCallback((id: string) => {
    setViews((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const loadView = useCallback(
    (id: string): FilterCondition[] | null => {
      const view = views.find((v) => v.id === id)
      if (!view) return null
      return [...view.filters]
    },
    [views]
  )

  return { views, saveView, deleteView, loadView }
}
