/**
 * CommandPalette - Cmd+K global search overlay
 *
 * Searches module registry. Results grouped by category.
 * Selecting a result opens the appropriate panel.
 * Glass-morphism design consistent with CTA Fleet branding.
 */
import { Search, X, ArrowRight } from 'lucide-react'
import { useState, useCallback, useEffect, useRef } from 'react'

import { searchModules, type ModuleDefinition, type ModuleCategory } from '@/config/module-registry'
import { usePanel } from '@/contexts/PanelContext'
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
      const timerId = setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
      return () => clearTimeout(timerId)
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
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--overlay-backdrop)' }}
        onClick={close}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-[var(--radius-xl)] overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-2)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3.5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search modules..."
            className="flex-1 bg-transparent text-[var(--text-sm)] outline-none"
            style={{ color: 'var(--text-primary)', caretColor: 'var(--accent-primary)' }}
          />
          <button
            onClick={close}
            className="transition-colors duration-[var(--duration-fast)]"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)' }}
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto py-2">
          {query && results.length === 0 && (
            <p className="text-[var(--text-xs)] text-center py-8" style={{ color: 'var(--text-muted)' }}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!query && (
            <p className="text-[var(--text-xs)] text-center py-8" style={{ color: 'var(--text-muted)' }}>
              Type to search across all modules and records
            </p>
          )}

          {Object.entries(grouped).map(([cat, mods]) => (
            <div key={cat}>
              <div className="px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: 'var(--text-tertiary)' }}>
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
                      'w-full flex items-center justify-between px-4 py-2.5 text-[var(--text-sm)] transition-all duration-[var(--duration-fast)]',
                    )}
                    style={{
                      backgroundColor: isSelected ? 'var(--surface-glass-active)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
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
        <div
          className="flex items-center gap-4 px-4 py-2 text-[10px]"
          style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
        >
          <span><kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>&uarr;&darr;</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>Enter</kbd> Open</span>
          <span><kbd className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'var(--surface-glass)', border: '1px solid var(--border-subtle)' }}>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  )
}
