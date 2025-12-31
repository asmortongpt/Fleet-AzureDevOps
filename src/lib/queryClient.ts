/**
 * React Query Configuration with IndexedDB persistence
 */

import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 3,
        networkMode: 'offlineFirst',
      },
    },
  });
}

export const queryKeys = {
  vehicles: {
    all: ['vehicles'] as const,
    lists: () => [...queryKeys.vehicles.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.vehicles.all, id] as const,
  },
  drivers: {
    all: ['drivers'] as const,
    lists: () => [...queryKeys.drivers.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.drivers.all, id] as const,
  },
};

export default createQueryClient;
