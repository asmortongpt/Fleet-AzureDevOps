/**
 * DocumentMapFilter Component
 *
 * Provides filtering controls for the document map:
 * - Category selection
 * - Search by filename/address
 * - Map style toggle
 * - Document count display
 */

import { useState, useTransition } from 'react'

import type { DocumentCategory } from '@/lib/types'

export interface DocumentMapFilterProps {
  categories: DocumentCategory[]
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  mapStyle: 'osm' | 'dark' | 'satellite'
  onMapStyleChange: (style: 'osm' | 'dark' | 'satellite') => void
  totalDocuments: number
  filteredDocuments: number
}

/**
 * DocumentMapFilter - Filtering and search controls for document map
 */
export function DocumentMapFilter({
  categories,
  selectedCategories,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  mapStyle,
  onMapStyleChange,
  totalDocuments,
  filteredDocuments
}: DocumentMapFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [_isPending, startTransition] = useTransition()

  // Toggle category selection
  const toggleCategory = (categoryName: string) => {
    startTransition(() => {
      if (selectedCategories.includes(categoryName)) {
        onCategoryChange(selectedCategories.filter(c => c !== categoryName))
      } else {
        onCategoryChange([...selectedCategories, categoryName])
      }
    })
  }

  // Clear all filters
  const clearFilters = () => {
    startTransition(() => {
      onCategoryChange([])
      onSearchChange('')
    })
  }

  const hasActiveFilters = selectedCategories.length > 0 || searchQuery.trim().length > 0

  return (
    <div className="absolute top-4 right-4 z-[1000] max-w-sm">
      {/* Filter Panel */}
      <div className="bg-white dark:bg-[#18181b] rounded-lg border border-white/[0.08] dark:border-white/[0.08]">
        {/* Header */}
        <div
          className="flex items-center justify-between p-2 cursor-pointer border-b border-white/[0.08] dark:border-white/[0.08]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-3 h-3 text-white/70 dark:text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <h3 className="font-semibold text-white/80 dark:text-white/80">
              Filters
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-emerald-500/10 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Document count */}
            <span className="text-sm text-white/70 dark:text-white/40">
              {filteredDocuments} / {totalDocuments}
            </span>

            {/* Expand/collapse icon */}
            <svg
              className={`w-3 h-3 text-white/40 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Filter content */}
        {isExpanded && (
          <div className="p-2 space-y-2">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-white/40 dark:text-white/60 mb-2">
                Search Documents
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => startTransition(() => onSearchChange(e.target.value))}
                  placeholder="Search by filename or address..."
                  className="w-full px-3 py-2 pl-10 border border-white/[0.08] dark:border-white/[0.08] rounded-lg bg-white dark:bg-white/[0.08] text-white/80 dark:text-white/80 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-3 h-3 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-white/40 dark:text-white/60 mb-2">
                  Categories
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] dark:hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.categoryName)}
                        onChange={() => toggleCategory(category.categoryName)}
                        className="w-4 h-4 text-emerald-800 border-white/[0.08] rounded focus:ring-emerald-500"
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-white/40 dark:text-white/60 flex-1">
                        {category.categoryName}
                      </span>
                      {category.documentCount !== undefined && (
                        <span className="text-xs text-white/40 dark:text-white/40">
                          {category.documentCount}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Map Style */}
            <div>
              <label className="block text-sm font-medium text-white/40 dark:text-white/60 mb-2">
                Map Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onMapStyleChange('osm')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'osm'
                      ? 'bg-emerald-500/50 text-white'
                      : 'bg-white/[0.05] dark:bg-white/[0.08] text-white/40 dark:text-white/60 hover:bg-white/[0.06] dark:hover:bg-white/[0.15]'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => onMapStyleChange('dark')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'dark'
                      ? 'bg-emerald-500/50 text-white'
                      : 'bg-white/[0.05] dark:bg-white/[0.08] text-white/40 dark:text-white/60 hover:bg-white/[0.06] dark:hover:bg-white/[0.15]'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => onMapStyleChange('satellite')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-emerald-500/50 text-white'
                      : 'bg-white/[0.05] dark:bg-white/[0.08] text-white/40 dark:text-white/60 hover:bg-white/[0.06] dark:hover:bg-white/[0.15]'
                  }`}
                >
                  Satellite
                </button>
              </div>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 bg-white/[0.05] dark:bg-white/[0.08] text-white/40 dark:text-white/60 text-sm font-medium rounded-lg hover:bg-white/[0.06] dark:hover:bg-white/[0.15] transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}