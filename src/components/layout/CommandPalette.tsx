/**
 * CommandPalette - Cmd+K global search overlay
 *
 * Searches module registry. Results grouped by category.
 * Selecting a result opens the appropriate panel.
 * Glass-morphism design consistent with ArchonY branding.
 */
import { Search, X, ArrowRight } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { usePanel } from '@/contexts/PanelContext'
import { searchModules, getModule, type ModuleDefinition, type ModuleCategory } from '@/config/module-registry'
import { cn } from '@/lib/utils'

const categoryLabels: Record<ModuleCategory, string> = {
  fleet: 'Fleet',
  operations: 'Operations',
  maintenance: 'Maintenance',
  safety: 'Safety',
  analytics: 'Analytics',
  admin: 'Admin',
}

export function CommandPalette() {
  const { state, dispatch, openPanel } = usePanel()
  const { commandPaletteOpen } = state
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = query ? searchModules(query) : []

  // Global Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        dispatch({ type: 'TOGGLE_COMMAND_PALETTE' })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [dispatch])

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [commandPaletteOpen])

  const close = useCallback(() => {
    dispatch({ type: 'SET_COMMAND_PALETTE', payload: false })
    setQuery('')
  }, [dispatch])

  const handleSelect = useCallback(
    (mod: ModuleDefinition) => {
      openPanel({
        id: `cmd-${mod.id}-${Date.now()}`,
        moduleId: mod.id,
        title: mod.label,
        width: mod.panelWidth,
        category: mod.category,
      })
      close()
    },
    [openPanel, close]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    },
    [close, results, selectedIndex, handleSelect]
  )

  if (!commandPaletteOpen) return null

  // Group results by category
  const grouped = results.reduce<Record<string, ModuleDefinition[]>>((acc, mod) => {
    const cat = mod.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(mod)
    return acc
  }, {})

  let flatIndex = 0

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0A0E27] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-[#41B2E3]/50 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search modules, vehicles, drivers..."
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
          />
          <button
            onClick={close}
            className="text-white/25 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {query && results.length === 0 && (
            <p className="text-xs text-white/25 text-center py-8">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!query && (
            <p className="text-xs text-white/25 text-center py-8">
              Type to search across all modules and records
            </p>
          )}

          {Object.entries(grouped).map(([cat, mods]) => (
            <div key={cat}>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#41B2E3]/40">
                  {categoryLabels[cat as ModuleCategory] ?? cat}
                </span>
              </div>
              {mods.map(mod => {
                const idx = flatIndex++
                const isSelected = idx === selectedIndex

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleSelect(mod)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all',
                      isSelected
                        ? 'bg-[#41B2E3]/[0.08] text-white'
                        : 'text-white/50 hover:bg-white/[0.03] hover:text-white/80'
                    )}
                  >
                    <span>{mod.label}</span>
                    <ArrowRight className={cn('w-3 h-3 transition-opacity', isSelected ? 'opacity-60' : 'opacity-0')} />
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[10px] text-white/15">
          <span><kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[10px] border border-white/[0.06]">&uarr;&darr;</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[10px] border border-white/[0.06]">Enter</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-[10px] border border-white/[0.06]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
