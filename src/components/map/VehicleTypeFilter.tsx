/**
 * Floating vehicle type filter panel for the fleet map.
 *
 * Shows vehicle type toggles with counts, status filter, and a search box.
 * Positioned as a floating overlay on the bottom-left of the map.
 */
import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { VEHICLE_TYPE_LABELS, STATUS_COLORS } from '@/utils/vehicle-map-icons';

export interface VehicleFilters {
  /** Set of vehicle types to show (empty = show all) */
  visibleTypes: Set<string>;
  /** Set of statuses to show (empty = show all) */
  visibleStatuses: Set<string>;
  /** Text search across vehicle name/number */
  search: string;
}

interface VehicleTypeFilterProps {
  vehicles: any[];
  filters: VehicleFilters;
  onFiltersChange: (filters: VehicleFilters) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  idle: 'Idle',
  charging: 'Charging',
  service: 'In Service',
  emergency: 'Emergency',
  offline: 'Offline',
  assigned: 'Assigned',
  dispatched: 'Dispatched',
  en_route: 'En Route',
  on_site: 'On Site',
  completed: 'Completed',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

export const VehicleTypeFilter = memo(function VehicleTypeFilter({
  vehicles,
  filters,
  onFiltersChange,
}: VehicleTypeFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [showStatuses, setShowStatuses] = useState(false);

  // Count vehicles per type
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const t = v.type || v.vehicle_type || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [vehicles]);

  // Count vehicles per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const s = v.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [vehicles]);

  // All types present in data
  const availableTypes = useMemo(
    () => Object.keys(typeCounts).sort((a, b) => (typeCounts[b] || 0) - (typeCounts[a] || 0)),
    [typeCounts],
  );

  const availableStatuses = useMemo(
    () => Object.keys(statusCounts).sort((a, b) => (statusCounts[b] || 0) - (statusCounts[a] || 0)),
    [statusCounts],
  );

  // Active filter count for badge
  const activeFilterCount =
    (filters.visibleTypes.size > 0 ? 1 : 0) +
    (filters.visibleStatuses.size > 0 ? 1 : 0) +
    (filters.search ? 1 : 0);

  // Visible vehicle count (after filters)
  const visibleCount = useMemo(() => {
    return vehicles.filter((v) => {
      if (filters.visibleTypes.size > 0 && !filters.visibleTypes.has(v.type || v.vehicle_type || 'unknown'))
        return false;
      if (filters.visibleStatuses.size > 0 && !filters.visibleStatuses.has(v.status || 'unknown'))
        return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const name = (v.name || '').toLowerCase();
        const num = (v.vehicleNumber || v.number || '').toLowerCase();
        const make = (v.make || '').toLowerCase();
        const model = (v.model || '').toLowerCase();
        if (!name.includes(q) && !num.includes(q) && !make.includes(q) && !model.includes(q))
          return false;
      }
      return true;
    }).length;
  }, [vehicles, filters]);

  function toggleType(type: string) {
    const next = new Set(filters.visibleTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onFiltersChange({ ...filters, visibleTypes: next });
  }

  function toggleStatus(status: string) {
    const next = new Set(filters.visibleStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onFiltersChange({ ...filters, visibleStatuses: next });
  }

  function clearAll() {
    onFiltersChange({
      visibleTypes: new Set(),
      visibleStatuses: new Set(),
      search: '',
    });
  }

  return (
    <div className="absolute bottom-4 left-4 z-30 max-w-[280px]">
      {/* Collapsed: just the toggle button */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 bg-[var(--surface-2)] text-[var(--text-primary)] rounded-lg px-3 py-2 text-xs font-medium border border-[var(--border-subtle)] hover:bg-[#161616] transition-colors"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filter Vehicles</span>
          {activeFilterCount > 0 && (
            <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 h-4 min-w-[16px]">
              {activeFilterCount}
            </Badge>
          )}
          <span className="text-[var(--text-tertiary)] ml-1">{visibleCount}/{vehicles.length}</span>
        </button>
      ) : (
        <div className="bg-[var(--surface-2)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[var(--text-secondary)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Vehicle Filters</span>
              <span className="text-[10px] text-[var(--text-tertiary)]">{visibleCount}/{vehicles.length}</span>
            </div>
            <div className="flex items-center gap-1">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 px-1"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                className="p-0.5 rounded hover:bg-[var(--surface-glass-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-muted)]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                placeholder="Search name, number..."
                className="w-full bg-white/[0.05] border border-[var(--border-subtle)] rounded text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pl-7 pr-2 py-1.5 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Vehicle Types */}
          <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
            <div className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Vehicle Type</div>
            <div className="flex flex-wrap gap-1">
              {availableTypes.map((type) => {
                const isActive = filters.visibleTypes.size === 0 || filters.visibleTypes.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                      isActive
                        ? 'bg-white/[0.1] text-[var(--text-primary)] border border-[var(--border-strong)]'
                        : 'bg-white/[0.03] text-[var(--text-muted)] border border-white/[0.05]'
                    }`}
                  >
                    <span>{VEHICLE_TYPE_LABELS[type] || type}</span>
                    <span className={`text-[10px] ${isActive ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                      {typeCounts[type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter (collapsible) */}
          <div className="px-3 py-2">
            <button
              onClick={() => setShowStatuses(!showStatuses)}
              className="flex items-center justify-between w-full text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5"
            >
              <span>Status</span>
              {showStatuses ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showStatuses && (
              <div className="flex flex-wrap gap-1">
                {availableStatuses.map((status) => {
                  const isActive = filters.visibleStatuses.size === 0 || filters.visibleStatuses.has(status);
                  const dotColor = STATUS_COLORS[status] || '#6b7280';
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        isActive
                          ? 'bg-white/[0.1] text-[var(--text-primary)] border border-[var(--border-strong)]'
                          : 'bg-white/[0.03] text-[var(--text-muted)] border border-white/[0.05]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: isActive ? dotColor : '#4b5563' }}
                      />
                      <span>{STATUS_LABELS[status] || status}</span>
                      <span className={`text-[10px] ${isActive ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
                        {statusCounts[status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
