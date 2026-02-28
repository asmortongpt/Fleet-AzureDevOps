import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Plus, Save, FolderOpen, RotateCcw, X } from 'lucide-react'
import { FilterPill } from './FilterPill'
import { useSavedViews, type FilterCondition } from '@/hooks/use-saved-views'

interface SmartFilterBarProps {
  fields: { value: string; label: string }[]
  onFiltersChange: (filters: FilterCondition[]) => void
  className?: string
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [ref, onClose])
}

export function SmartFilterBar({ fields, onFiltersChange, className }: SmartFilterBarProps) {
  const [filters, setFilters] = useState<FilterCondition[]>([])
  const [saveOpen, setSaveOpen] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [viewName, setViewName] = useState('')

  const { views, saveView, deleteView, loadView } = useSavedViews()

  const saveRef = useRef<HTMLDivElement>(null)
  const loadRef = useRef<HTMLDivElement>(null)

  useClickOutside(saveRef, () => {
    setSaveOpen(false)
    setViewName('')
  })
  useClickOutside(loadRef, () => setLoadOpen(false))

  const updateFilters = useCallback(
    (next: FilterCondition[]) => {
      setFilters(next)
      onFiltersChange(next)
    },
    [onFiltersChange]
  )

  const handleAddFilter = useCallback(() => {
    const defaultField = fields[0]?.value ?? ''
    const newFilter: FilterCondition = {
      id: crypto.randomUUID(),
      field: defaultField,
      operator: 'equals',
      value: '',
    }
    updateFilters([...filters, newFilter])
  }, [fields, filters, updateFilters])

  const handleUpdateFilter = useCallback(
    (updated: FilterCondition) => {
      const next = filters.map((f) => (f.id === updated.id ? updated : f))
      updateFilters(next)
    },
    [filters, updateFilters]
  )

  const handleRemoveFilter = useCallback(
    (id: string) => {
      const next = filters.filter((f) => f.id !== id)
      updateFilters(next)
    },
    [filters, updateFilters]
  )

  const handleClearAll = useCallback(() => {
    updateFilters([])
  }, [updateFilters])

  const handleSaveView = useCallback(() => {
    const trimmed = viewName.trim()
    if (!trimmed || filters.length === 0) return
    saveView(trimmed, filters)
    setSaveOpen(false)
    setViewName('')
  }, [viewName, filters, saveView])

  const handleLoadView = useCallback(
    (id: string) => {
      const loaded = loadView(id)
      if (loaded) {
        // Assign new IDs so loaded filters are independent from the saved snapshot
        const withNewIds = loaded.map((f) => ({ ...f, id: crypto.randomUUID() }))
        updateFilters(withNewIds)
      }
      setLoadOpen(false)
    },
    [loadView, updateFilters]
  )

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveView()
    if (e.key === 'Escape') {
      setSaveOpen(false)
      setViewName('')
    }
  }

  return (
    <div
      className={`flex items-center gap-2 flex-wrap py-2 px-3 bg-[#111111] border border-[rgba(255,255,255,0.06)] rounded-xl ${className ?? ''}`}
      style={{ fontFamily: 'Montserrat, sans-serif' }}
    >
      {/* Active filter pills */}
      {filters.map((filter) => (
        <FilterPill
          key={filter.id}
          filter={filter}
          fields={fields}
          onUpdate={handleUpdateFilter}
          onRemove={handleRemoveFilter}
        />
      ))}

      {/* Add filter button */}
      <button
        type="button"
        onClick={handleAddFilter}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.40)] hover:border-[#00CCFE] hover:text-[#00CCFE] text-sm transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add filter
      </button>

      {/* Spacer to push action buttons right */}
      <div className="flex-1" />

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {/* Save View */}
        <div ref={saveRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setSaveOpen(!saveOpen)
              setLoadOpen(false)
            }}
            className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.40)] hover:text-[#00CCFE] transition-colors"
            title="Save View"
          >
            <Save className="w-4 h-4" />
          </button>
          {saveOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-3 min-w-[220px]">
              <label className="block text-xs text-[rgba(255,255,255,0.40)] mb-1.5">
                View name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyDown={handleSaveKeyDown}
                  autoFocus
                  placeholder="e.g. Active trucks"
                  className="flex-1 bg-[#111111] border border-[rgba(255,255,255,0.08)] rounded-lg px-2.5 py-1.5 text-sm text-white placeholder-[rgba(255,255,255,0.20)] outline-none focus:border-[#00CCFE] transition-colors"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                />
                <button
                  type="button"
                  onClick={handleSaveView}
                  disabled={!viewName.trim() || filters.length === 0}
                  className="px-3 py-1.5 rounded-lg bg-[#00CCFE]/10 text-[#00CCFE] text-sm font-medium hover:bg-[#00CCFE]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Save
                </button>
              </div>
              {filters.length === 0 && (
                <p className="text-xs text-[rgba(255,255,255,0.25)] mt-1.5">
                  Add filters before saving a view.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Load View */}
        <div ref={loadRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setLoadOpen(!loadOpen)
              setSaveOpen(false)
            }}
            className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.40)] hover:text-[#00CCFE] transition-colors"
            title="Load View"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          {loadOpen && (
            <div className="absolute top-full right-0 mt-1 z-50 bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.5)] p-1 min-w-[200px]">
              {views.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[rgba(255,255,255,0.30)]">
                  No saved views
                </div>
              ) : (
                views.map((view) => (
                  <div
                    key={view.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#242424] cursor-pointer group"
                  >
                    <span
                      onClick={() => handleLoadView(view.id)}
                      className="text-[rgba(255,255,255,0.85)] text-sm flex-1"
                    >
                      {view.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteView(view.id)
                      }}
                      className="text-[rgba(255,255,255,0.20)] hover:text-[#FF4300] p-0.5 transition-colors"
                      title="Delete view"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Clear All */}
        <button
          type="button"
          onClick={handleClearAll}
          className="p-1.5 rounded-lg hover:bg-[#1a1a1a] text-[rgba(255,255,255,0.40)] hover:text-[#FF4300] transition-colors"
          title="Clear All Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
