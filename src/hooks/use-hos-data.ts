import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import logger from '@/utils/logger';

/**
 * HOS (Hours of Service) & ELD Data Hooks
 *
 * Provides React Query hooks for DOT-compliant HOS tracking:
 * - HOS Logs (driver duty status tracking)
 * - DVIR Reports (Driver Vehicle Inspection Reports)
 * - HOS Violations (automated compliance monitoring)
 * - DOT Reports (regulatory reporting)
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DutyStatus = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';
export type InspectionType = 'pre_trip' | 'post_trip' | 'enroute';
export type DefectSeverity = 'minor' | 'major' | 'critical';
export type ViolationSeverity = 'warning' | 'minor' | 'major' | 'critical';
export type ViolationStatus = 'open' | 'acknowledged' | 'resolved' | 'disputed';
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual' | 'custom';

export interface HOSLocation {
  lat: number;
  lng: number;
  address?: string;
  city?: string;
  state?: string;
}

export interface HOSLog {
  id: string;
  driver_id: string;
  vehicle_id?: string;
  duty_status: DutyStatus;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  start_location: HOSLocation;
  end_location?: HOSLocation;
  start_odometer?: number;
  end_odometer?: number;
  miles_driven?: number;
  notes?: string;
  trailer_number?: string;
  shipping_document_number?: string;
  is_violation: boolean;
  violation_type?: string;
  violation_details?: string;
  eld_device_id?: string;
  eld_sequence_id?: number;
  is_manual_entry: boolean;
  manual_entry_reason?: string;
  certified_by?: string;
  certified_at?: string;
  certification_signature?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface DVIRDefect {
  component: string;
  defect_description: string;
  severity: DefectSeverity;
  photo_urls?: string[];
}

export interface DVIRReport {
  id: string;
  driver_id: string;
  vehicle_id: string;
  inspection_type: InspectionType;
  defects_found: boolean;
  defects?: DVIRDefect[];
  vehicle_safe_to_operate: boolean;
  location: HOSLocation;
  inspection_datetime: string;
  odometer?: number;
  driver_signature: string;
  driver_signature_datetime: string;
  mechanic_id?: string;
  mechanic_signature?: string;
  mechanic_review_datetime?: string;
  repairs_completed: boolean;
  repairs_notes?: string;
  general_notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface HOSViolation {
  id: string;
  driver_id: string;
  hos_log_id?: string;
  violation_type: string;
  violation_datetime: string;
  description: string;
  regulation_reference?: string;
  severity: ViolationSeverity;
  status: ViolationStatus;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface DOTReport {
  id: string;
  report_type: ReportType;
  period_start: string;
  period_end: string;
  driver_id?: string;
  report_data: any;
  total_driving_hours?: number;
  total_on_duty_hours?: number;
  total_violations?: number;
  total_miles?: number;
  generated_by?: string;
  generated_at: string;
  pdf_url?: string;
  csv_url?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

export interface HOSLogFilters {
  tenant_id: string;
  driver_id?: string;
  start_date?: string;
  end_date?: string;
  duty_status?: DutyStatus;
}

export interface DVIRFilters {
  tenant_id: string;
  driver_id?: string;
  vehicle_id?: string;
  start_date?: string;
  end_date?: string;
  defects_found?: boolean;
}

export interface HOSViolationFilters {
  tenant_id: string;
  driver_id?: string;
  start_date?: string;
  end_date?: string;
  status?: ViolationStatus;
  severity?: ViolationSeverity;
}

// ============================================================================
// INPUT TYPES FOR MUTATIONS
// ============================================================================

export interface CreateHOSLogInput {
  driver_id: string;
  vehicle_id?: string;
  duty_status: DutyStatus;
  start_time: string;
  end_time?: string;
  start_location: HOSLocation;
  end_location?: HOSLocation;
  start_odometer?: number;
  end_odometer?: number;
  notes?: string;
  trailer_number?: string;
  shipping_document_number?: string;
  is_manual_entry?: boolean;
  manual_entry_reason?: string;
  tenant_id: string;
}

export interface UpdateHOSLogInput {
  id: string;
  notes?: string;
  certification_signature?: string;
  tenant_id: string;
}

export interface CreateDVIRInput {
  driver_id: string;
  vehicle_id: string;
  inspection_type: InspectionType;
  defects_found: boolean;
  vehicle_safe_to_operate: boolean;
  location: HOSLocation;
  odometer?: number;
  driver_signature: string;
  general_notes?: string;
  defects?: DVIRDefect[];
  tenant_id: string;
}

export interface ResolveViolationInput {
  id: string;
  resolution_notes: string;
  tenant_id: string;
}

// ============================================================================
// SECURE FETCH (imported from use-api.ts pattern)
// ============================================================================

/**
 * Get CSRF token for secure API calls
 */
async function getCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return (data.csrfToken || data.token || '') as string;
    }
    return '';
  } catch (error) {
    logger.error('[HOS CSRF] Error fetching token:', error);
    return '';
  }
}

/**
 * Secure fetch with CSRF protection and credentials
 */
async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add CSRF token for state-changing requests
  if (isStateChanging) {
    const token = await getCsrfToken();
    if (token) {
      (headers as Record<string, string>)['X-CSRF-Token'] = token;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  return response;
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

const hosQueryKeys = {
  logs: (filters: HOSLogFilters) => ['hos', 'logs', filters] as QueryKey,
  logSummary: (driverId: string, tenantId: string) => ['hos', 'logs', 'summary', driverId, tenantId] as QueryKey,
  dvir: (filters: DVIRFilters) => ['hos', 'dvir', filters] as QueryKey,
  violations: (filters: HOSViolationFilters) => ['hos', 'violations', filters] as QueryKey,
  dotReports: (tenantId: string) => ['hos', 'dot-reports', tenantId] as QueryKey,
};

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch HOS logs with filtering
 */
export function useHOSLogs(filters: HOSLogFilters) {
  return useQuery<HOSLog[], Error>({
    queryKey: hosQueryKeys.logs(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      );
      const res = await secureFetch(`/api/hos/logs?${params}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch HOS logs');
      }
      const data = await res.json();
      return data.data || data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (HOS data is more dynamic)
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Refetch on focus for compliance data
    enabled: !!filters.tenant_id,
  });
}

/**
 * Fetch HOS summary for a specific driver
 */
export function useHOSLogSummary(driverId: string, tenantId: string) {
  return useQuery({
    queryKey: hosQueryKeys.logSummary(driverId, tenantId),
    queryFn: async () => {
      const params = new URLSearchParams({ tenant_id: tenantId });
      const res = await secureFetch(`/api/hos/logs/driver/${driverId}/summary?${params}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch HOS summary');
      }
      const data = await res.json();
      return data.data || data;
    },
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!driverId && !!tenantId,
  });
}

/**
 * Fetch DVIR reports with filtering
 */
export function useDVIRReports(filters: DVIRFilters) {
  return useQuery<DVIRReport[], Error>({
    queryKey: hosQueryKeys.dvir(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      );
      const res = await secureFetch(`/api/hos/dvir?${params}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch DVIR reports');
      }
      const data = await res.json();
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!filters.tenant_id,
  });
}

/**
 * Fetch HOS violations with filtering
 */
export function useHOSViolations(filters: HOSViolationFilters) {
  return useQuery<HOSViolation[], Error>({
    queryKey: hosQueryKeys.violations(filters),
    queryFn: async () => {
      const params = new URLSearchParams(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      );
      const res = await secureFetch(`/api/hos/violations?${params}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to fetch violations');
      }
      const data = await res.json();
      return data.data || data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!filters.tenant_id,
  });
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Mutations for HOS logs
 */
export function useHOSLogMutations() {
  const queryClient = useQueryClient();

  const createLog = useMutation<HOSLog, Error, CreateHOSLogInput>({
    mutationFn: async (logData) => {
      const res = await secureFetch('/api/hos/logs', {
        method: 'POST',
        body: JSON.stringify(logData),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create HOS log');
      }
      const data = await res.json();
      return data.data || data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all HOS log queries for this tenant
      queryClient.invalidateQueries({
        queryKey: ['hos', 'logs'],
        predicate: (query) => {
          const filters = query.queryKey[2] as HOSLogFilters;
          return filters?.tenant_id === variables.tenant_id;
        }
      });
      // Also invalidate driver summary if available
      if (variables.driver_id) {
        queryClient.invalidateQueries({
          queryKey: hosQueryKeys.logSummary(variables.driver_id, variables.tenant_id)
        });
      }
      // Invalidate violations as new log may create violations
      queryClient.invalidateQueries({
        queryKey: ['hos', 'violations'],
        predicate: (query) => {
          const filters = query.queryKey[2] as HOSViolationFilters;
          return filters?.tenant_id === variables.tenant_id;
        }
      });
    },
    onError: (error) => {
      logger.error('[HOS] Create log failed:', error);
    },
  });

  const updateLog = useMutation<HOSLog, Error, UpdateHOSLogInput>({
    mutationFn: async (logData) => {
      const res = await secureFetch(`/api/hos/logs/${logData.id}`, {
        method: 'PATCH',
        body: JSON.stringify(logData),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to update HOS log');
      }
      const data = await res.json();
      return data.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hos', 'logs'],
        predicate: (query) => {
          const filters = query.queryKey[2] as HOSLogFilters;
          return filters?.tenant_id === variables.tenant_id;
        }
      });
    },
    onError: (error) => {
      logger.error('[HOS] Update log failed:', error);
    },
  });

  return { createLog, updateLog };
}

/**
 * Mutations for DVIR reports
 */
export function useDVIRMutations() {
  const queryClient = useQueryClient();

  const createDVIR = useMutation<DVIRReport, Error, CreateDVIRInput>({
    mutationFn: async (dvirData) => {
      const res = await secureFetch('/api/hos/dvir', {
        method: 'POST',
        body: JSON.stringify(dvirData),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create DVIR report');
      }
      const data = await res.json();
      return data.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hos', 'dvir'],
        predicate: (query) => {
          const filters = query.queryKey[2] as DVIRFilters;
          return filters?.tenant_id === variables.tenant_id;
        }
      });
    },
    onError: (error) => {
      logger.error('[HOS] Create DVIR failed:', error);
    },
  });

  return { createDVIR };
}

/**
 * Mutations for HOS violations
 */
export function useViolationMutations() {
  const queryClient = useQueryClient();

  const resolveViolation = useMutation<HOSViolation, Error, ResolveViolationInput>({
    mutationFn: async ({ id, resolution_notes, tenant_id }) => {
      const res = await secureFetch(`/api/hos/violations/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes, tenant_id }),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to resolve violation');
      }
      const data = await res.json();
      return data.data || data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['hos', 'violations'],
        predicate: (query) => {
          const filters = query.queryKey[2] as HOSViolationFilters;
          return filters?.tenant_id === variables.tenant_id;
        }
      });
    },
    onError: (error) => {
      logger.error('[HOS] Resolve violation failed:', error);
    },
  });

  return { resolveViolation };
}

// ============================================================================
// COMPUTED/DERIVED HOOKS
// ============================================================================

/**
 * Calculate driver HOS compliance metrics from logs
 */
export function useHOSMetrics(driverId: string, tenantId: string, date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const startDate = targetDate;
  const endDate = new Date(targetDate);
  endDate.setDate(endDate.getDate() + 1);

  const { data: logs } = useHOSLogs({
    tenant_id: tenantId,
    driver_id: driverId,
    start_date: startDate,
    end_date: endDate.toISOString().split('T')[0],
  });

  const { data: violations } = useHOSViolations({
    tenant_id: tenantId,
    driver_id: driverId,
  });

  const metrics = {
    drivingHours: 0,
    onDutyHours: 0,
    availableHours: 11,
    violations: violations?.filter(v => v.status === 'open').length || 0,
    isCompliant: true,
  };

  if (logs) {
    logs.forEach(log => {
      const minutes = log.duration_minutes || 0;
      if (log.duty_status === 'driving') {
        metrics.drivingHours += minutes / 60;
      }
      if (log.duty_status === 'driving' || log.duty_status === 'on_duty_not_driving') {
        metrics.onDutyHours += minutes / 60;
      }
    });

    metrics.availableHours = Math.max(0, 11 - metrics.drivingHours);
    metrics.isCompliant = metrics.drivingHours <= 11 && metrics.onDutyHours <= 14;
  }

  return metrics;
}
