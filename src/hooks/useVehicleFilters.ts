import { useMemo } from 'react';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  makeFilter: string;
}

export interface VehicleFilterState {
  searchTerm: string;
  status: string;
  type: string;
  location: string;
  department: string;
  make: string;
  assignedOnly: boolean;
  availableOnly: boolean;
}

export interface FilterStatsType {
  total: number;
  byStatus: Record<string, number>;
  byMake: Record<string, number>;
  all?: number; // Total count
  active?: number; // Active vehicles count
  inactive?: number; // Inactive vehicles count
  maintenance?: number; // Maintenance vehicles count
  outOfService?: number; // Out of service vehicles count
}

export function useVehicleFilters<T extends { number: string; make: string; model: string; status: string }>(
  vehicles: T[],
  options: FilterOptions
) {
  return useMemo(() => {
    let filtered = vehicles;

    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.number.toLowerCase().includes(query) ||
        v.make.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query)
      );
    }

    if (options.statusFilter && options.statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === options.statusFilter);
    }

    if (options.makeFilter && options.makeFilter !== 'all') {
      filtered = filtered.filter(v => v.make === options.makeFilter);
    }

    // Return object with filters and filterStats
    const filters: VehicleFilterState = {
      searchTerm: options.searchQuery,
      status: options.statusFilter,
      type: 'all',
      location: 'all',
      department: 'all',
      make: options.makeFilter,
      assignedOnly: false,
      availableOnly: false,
    };

    const filterStats: FilterStatsType = {
      total: vehicles.length,
      byStatus: {},
      byMake: {},
    };

    return { filtered, filters, filterStats };
  }, [vehicles, options.searchQuery, options.statusFilter, options.makeFilter]);
}
