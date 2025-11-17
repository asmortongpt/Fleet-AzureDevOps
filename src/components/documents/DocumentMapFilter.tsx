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
  const [isPending, startTransition] = useTransition()

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer border-b border-gray-200 dark:border-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
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
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Filters
            </h3>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Document count */}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredDocuments} / {totalDocuments}
            </span>

            {/* Expand/collapse icon */}
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
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
          <div className="p-4 space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Documents
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => startTransition(() => onSearchChange(e.target.value))}
                  placeholder="Search by filename or address..."
                  className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.categoryName)}
                        onChange={() => toggleCategory(category.categoryName)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                        {category.categoryName}
                      </span>
                      {category.documentCount !== undefined && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Map Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onMapStyleChange('osm')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'osm'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => onMapStyleChange('dark')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'dark'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => onMapStyleChange('satellite')}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    mapStyle === 'satellite'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
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
