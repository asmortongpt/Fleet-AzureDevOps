import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import logger from '@/utils/logger';
import type {
  DrillThroughConfig,
  DrillThroughResult,
  DrillThroughEntityType,
  ExportFormat,
} from '../../types/drill-through';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseDrillThroughOptions {
  /** Entity type */
  entityType: DrillThroughEntityType;
  /** Initial filters */
  filters: Record<string, any>;
  /** Page size */
  pageSize?: number;
  /** Whether to fetch immediately */
  enabled?: boolean;
  /** Custom API endpoint */
  apiEndpoint?: string;
}

interface UseDrillThroughReturn {
  /** Current drill-through result */
  data: DrillThroughResult | undefined;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Current page number */
  page: number;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  previousPage: () => void;
  /** Update filters */
  setFilters: (filters: Record<string, any>) => void;
  /** Current filters */
  filters: Record<string, any>;
  /** Export data */
  exportData: (format: ExportFormat) => Promise<void>;
  /** Whether export is in progress */
  isExporting: boolean;
  /** Refetch data */
  refetch: () => void;
}

/**
 * Universal hook for drill-through functionality
 * Fetches underlying records for any aggregated metric
 */
export function useDrillThrough(options: UseDrillThroughOptions): UseDrillThroughReturn {
  const {
    entityType,
    filters: initialFilters,
    pageSize = 50,
    enabled = true,
    apiEndpoint,
  } = options;

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [isExporting, setIsExporting] = useState(false);

  // Construct API endpoint
  const endpoint =
    apiEndpoint || `/api/drill-through/${entityType}`;

  // Fetch drill-through data
  const { data, isLoading, error, refetch } = useQuery<DrillThroughResult>({
    queryKey: ['drill-through', entityType, filters, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        filters: JSON.stringify(filters),
      });

      const response = await fetch(`${API_BASE_URL}${endpoint}?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch drill-through data: ${response.statusText}`);
      }

      return response.json();
    },
    enabled,
    staleTime: 30000, // 30 seconds
  });

  // Navigation functions
  const goToPage = useCallback((newPage: number) => {
    if (data && newPage >= 1 && newPage <= data.totalPages) {
      setPage(newPage);
    }
  }, [data]);

  const nextPage = useCallback(() => {
    if (data && page < data.totalPages) {
      setPage((p) => p + 1);
    }
  }, [data, page]);

  const previousPage = useCallback(() => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  }, [page]);

  // Export function
  const exportData = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(true);
      try {
        const params = new URLSearchParams({
          filters: JSON.stringify(filters),
          format,
        });

        const response = await fetch(
          `${API_BASE_URL}${endpoint}/export?${params}`,
          {
            credentials: 'include',
          }
        );

        if (!response.ok) {
          throw new Error(`Export failed: ${response.statusText}`);
        }

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
        const filename =
          filenameMatch?.[1] ||
          `${entityType}_export_${new Date().toISOString()}.${format}`;

        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Track analytics
        await fetch(`${API_BASE_URL}/api/drill-through/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            entityType,
            filters,
            recordCount: data?.totalCount || 0,
            exported: true,
            exportFormat: format,
          }),
        });
      } catch (err) {
        logger.error('Export failed:', err);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [entityType, filters, data, endpoint]
  );

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    page,
    goToPage,
    nextPage,
    previousPage,
    setFilters,
    filters,
    exportData,
    isExporting,
    refetch,
  };
}
