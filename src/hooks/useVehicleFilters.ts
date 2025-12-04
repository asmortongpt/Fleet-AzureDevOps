import { useMemo } from 'react';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: string;
  makeFilter: string;
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

    return filtered;
  }, [vehicles, options.searchQuery, options.statusFilter, options.makeFilter]);
}
