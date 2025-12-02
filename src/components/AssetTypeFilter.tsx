/**
 * AssetTypeFilter Component
 * Multi-asset vehicle filtering component
 *
 * Features:
 * - Filter by asset category (passenger vehicle, heavy equipment, trailer, etc.)
 * - Filter by asset type (excavator, bulldozer, flatbed, etc.)
 * - Filter by power type (self-powered, towed, etc.)
 * - Filter by operational status
 * - Filter by primary metric (odometer, engine hours, PTO hours, etc.)
 * - Filter by road legal status
 * - Group and location filtering
 */

import React, { useState } from 'react'
import {
  Funnel,
  X,
  Truck,
  Engine,
  Wrench,
  CheckCircle,
  Calendar,
  MapPin,
  Users
} from '@phosphor-icons/react'

// Import types from backend
import type {
  AssetCategory,
  AssetType,
  PowerType,
  OperationalStatus,
  PrimaryMetric
} from '../../api/src/types/asset.types'

interface AssetTypeFilterProps {
  onFilterChange: (filters: FilterState) => void
  onClear: () => void
  activeFilters?: FilterState
}

export interface FilterState {
  asset_category?: AssetCategory
  asset_type?: AssetType
  power_type?: PowerType
  operational_status?: OperationalStatus
  primary_metric?: PrimaryMetric
  is_road_legal?: boolean
  location_id?: string
  group_id?: string
  fleet_id?: string
}

// Filter options derived from backend enums
const assetCategories: { value: AssetCategory; label: string; icon: typeof Truck }[] = [
  { value: 'PASSENGER_VEHICLE', label: 'Passenger Vehicle', icon: Truck },
  { value: 'HEAVY_EQUIPMENT', label: 'Heavy Equipment', icon: Engine },
  { value: 'TRAILER', label: 'Trailer', icon: Truck },
  { value: 'TRACTOR', label: 'Tractor', icon: Engine },
  { value: 'SPECIALTY', label: 'Specialty Equipment', icon: Wrench },
  { value: 'NON_POWERED', label: 'Non-Powered Asset', icon: Truck }
]

const assetTypesByCategory: Record<AssetCategory, { value: AssetType; label: string }[]> = {
  PASSENGER_VEHICLE: [
    { value: 'SEDAN', label: 'Sedan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'TRUCK', label: 'Truck' },
    { value: 'VAN', label: 'Van' }
  ],
  HEAVY_EQUIPMENT: [
    { value: 'EXCAVATOR', label: 'Excavator' },
    { value: 'BULLDOZER', label: 'Bulldozer' },
    { value: 'LOADER', label: 'Loader' },
    { value: 'BACKHOE', label: 'Backhoe' },
    { value: 'GRADER', label: 'Grader' },
    { value: 'ROLLER', label: 'Roller' },
    { value: 'CRANE', label: 'Crane' },
    { value: 'FORKLIFT', label: 'Forklift' }
  ],
  TRAILER: [
    { value: 'FLATBED', label: 'Flatbed' },
    { value: 'ENCLOSED', label: 'Enclosed' },
    { value: 'DUMP', label: 'Dump' },
    { value: 'LOWBOY', label: 'Lowboy' },
    { value: 'REFRIGERATED', label: 'Refrigerated' }
  ],
  TRACTOR: [
    { value: 'FARM_TRACTOR', label: 'Farm Tractor' },
    { value: 'ROAD_TRACTOR', label: 'Road Tractor' }
  ],
  SPECIALTY: [
    { value: 'GENERATOR', label: 'Generator' },
    { value: 'COMPRESSOR', label: 'Compressor' },
    { value: 'PUMP', label: 'Pump' },
    { value: 'WELDER', label: 'Welder' }
  ],
  NON_POWERED: [
    { value: 'OTHER', label: 'Other' }
  ]
}

const powerTypes: { value: PowerType; label: string }[] = [
  { value: 'SELF_POWERED', label: 'Self-Powered' },
  { value: 'TOWED', label: 'Towed' },
  { value: 'CARRIED', label: 'Carried' },
  { value: 'STATIONARY', label: 'Stationary' },
  { value: 'MANUAL', label: 'Manual' }
]

const operationalStatuses: { value: OperationalStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Available', color: 'text-green-600' },
  { value: 'IN_USE', label: 'In Use', color: 'text-blue-600' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'text-orange-600' },
  { value: 'RESERVED', label: 'Reserved', color: 'text-purple-600' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'text-red-600' }
]

const primaryMetrics: { value: PrimaryMetric; label: string }[] = [
  { value: 'ODOMETER', label: 'Odometer (Miles)' },
  { value: 'ENGINE_HOURS', label: 'Engine Hours' },
  { value: 'PTO_HOURS', label: 'PTO Hours' },
  { value: 'AUX_HOURS', label: 'Auxiliary Hours' },
  { value: 'CYCLES', label: 'Cycle Count' },
  { value: 'CALENDAR', label: 'Calendar-Based' }
]

export const AssetTypeFilter: React.FC<AssetTypeFilterProps> = ({
  onFilterChange,
  onClear,
  activeFilters = {}
}) => {
  const [filters, setFilters] = useState<FilterState>(activeFilters)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }

    // Clear asset_type if category changes
    if (key === 'asset_category') {
      delete newFilters.asset_type
    }

    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearAll = () => {
    setFilters({})
    onClear()
  }

  const activeFilterCount = Object.keys(filters).filter(key => filters[key as keyof FilterState] !== undefined).length

  const availableAssetTypes = filters.asset_category
    ? assetTypesByCategory[filters.asset_category]
    : []

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Funnel className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Asset Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <X className="w-5 h-5" /> : <Funnel className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
          {filters.asset_category && (
            <FilterPill
              label={`Category: ${assetCategories.find(c => c.value === filters.asset_category)?.label}`}
              onRemove={() => handleClearFilter('asset_category')}
            />
          )}
          {filters.asset_type && (
            <FilterPill
              label={`Type: ${availableAssetTypes.find(t => t.value === filters.asset_type)?.label}`}
              onRemove={() => handleClearFilter('asset_type')}
            />
          )}
          {filters.power_type && (
            <FilterPill
              label={`Power: ${powerTypes.find(p => p.value === filters.power_type)?.label}`}
              onRemove={() => handleClearFilter('power_type')}
            />
          )}
          {filters.operational_status && (
            <FilterPill
              label={`Status: ${operationalStatuses.find(s => s.value === filters.operational_status)?.label}`}
              onRemove={() => handleClearFilter('operational_status')}
            />
          )}
          {filters.primary_metric && (
            <FilterPill
              label={`Metric: ${primaryMetrics.find(m => m.value === filters.primary_metric)?.label}`}
              onRemove={() => handleClearFilter('primary_metric')}
            />
          )}
          {filters.is_road_legal !== undefined && (
            <FilterPill
              label={`Road Legal: ${filters.is_road_legal ? 'Yes' : 'No'}`}
              onRemove={() => handleClearFilter('is_road_legal')}
            />
          )}
        </div>
      )}

      {/* Filter Options */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Asset Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Truck className="w-4 h-4 inline mr-1" />
              Asset Category
            </label>
            <select
              value={filters.asset_category || ''}
              onChange={(e) => handleFilterChange('asset_category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {assetCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Type (conditional on category) */}
          {filters.asset_category && availableAssetTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Engine className="w-4 h-4 inline mr-1" />
                Asset Type
              </label>
              <select
                value={filters.asset_type || ''}
                onChange={(e) => handleFilterChange('asset_type', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                {availableAssetTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Power Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Engine className="w-4 h-4 inline mr-1" />
              Power Type
            </label>
            <select
              value={filters.power_type || ''}
              onChange={(e) => handleFilterChange('power_type', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Power Types</option>
              {powerTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Operational Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Operational Status
            </label>
            <select
              value={filters.operational_status || ''}
              onChange={(e) => handleFilterChange('operational_status', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              {operationalStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Primary Tracking Metric
            </label>
            <select
              value={filters.primary_metric || ''}
              onChange={(e) => handleFilterChange('primary_metric', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Metrics</option>
              {primaryMetrics.map(metric => (
                <option key={metric.value} value={metric.value}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* Road Legal */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.is_road_legal === true}
                onChange={(e) => handleFilterChange('is_road_legal', e.target.checked ? true : undefined)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Road Legal Only
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

// Filter Pill Component
const FilterPill: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
  <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
    <span>{label}</span>
    <button
      onClick={onRemove}
      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
    >
      <X className="w-3 h-3" />
    </button>
  </div>
)

export default AssetTypeFilter
