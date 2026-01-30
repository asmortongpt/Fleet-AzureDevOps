import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useCallback, useMemo } from 'react';
import { sanitizeInput } from '../utils/security';
import logger from '@/utils/logger';

// ============================================================================
// Validation Schemas
// ============================================================================

const ComplianceMetricSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['SAFETY', 'ENVIRONMENTAL', 'REGULATORY', 'OPERATIONAL', 'FINANCIAL']),
  name: z.string().min(1).max(100),
  value: z.number(),
  target: z.number(),
  unit: z.string().max(20),
  status: z.enum(['COMPLIANT', 'WARNING', 'VIOLATION', 'PENDING']),
  trend: z.enum(['UP', 'DOWN', 'STABLE']),
  lastUpdated: z.string().datetime(),
  description: z.string().max(500).optional(),
});

const ViolationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['SAFETY', 'ENVIRONMENTAL', 'REGULATORY', 'MAINTENANCE', 'OPERATIONAL']),
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
  description: z.string().min(1).max(1000),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  occurredAt: z.string().datetime(),
  resolvedAt: z.string().datetime().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  cost: z.number().min(0).optional(),
  correctiveAction: z.string().max(2000).optional(),
});

const AuditRecordSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['INTERNAL', 'EXTERNAL', 'REGULATORY', 'SAFETY', 'QUALITY']),
  auditor: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  scheduledDate: z.string().datetime(),
  completedDate: z.string().datetime().optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  score: z.number().min(0).max(100).optional(),
  findings: z.number().min(0),
  criticalFindings: z.number().min(0),
  reportUrl: z.string().url().optional(),
});

const ComplianceTrendSchema = z.object({
  date: z.string().datetime(),
  complianceRate: z.number().min(0).max(100),
  violations: z.number().min(0),
  resolved: z.number().min(0),
  pending: z.number().min(0),
  costImpact: z.number().min(0),
});

const RegulatoryUpdateSchema = z.object({
  id: z.string().uuid(),
  regulation: z.string().min(1).max(200),
  agency: z.string().min(1).max(100),
  effectiveDate: z.string().datetime(),
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLIANT', 'NON_COMPLIANT']),
  description: z.string().max(2000),
  actionRequired: z.string().max(2000).optional(),
  deadline: z.string().datetime().optional(),
});

const ComplianceReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  type: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'INCIDENT', 'AUDIT', 'CUSTOM']),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  generatedAt: z.string().datetime(),
  generatedBy: z.string().min(1).max(100),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SUBMITTED']),
  downloadUrl: z.string().url().optional(),
  summary: z.string().max(5000).optional(),
});

const ComplianceDataSchema = z.object({
  metrics: z.array(ComplianceMetricSchema),
  violations: z.array(ViolationSchema),
  audits: z.array(AuditRecordSchema),
  trends: z.array(ComplianceTrendSchema),
  regulatoryUpdates: z.array(RegulatoryUpdateSchema),
  reports: z.array(ComplianceReportSchema),
  summary: z.object({
    overallCompliance: z.number().min(0).max(100),
    activeViolations: z.number().min(0),
    pendingAudits: z.number().min(0),
    upcomingDeadlines: z.number().min(0),
    riskScore: z.number().min(0).max(100),
    lastAssessment: z.string().datetime(),
  }),
});

// ============================================================================
// Types
// ============================================================================

export type ComplianceMetric = z.infer<typeof ComplianceMetricSchema>;
export type Violation = z.infer<typeof ViolationSchema>;
export type AuditRecord = z.infer<typeof AuditRecordSchema>;
export type ComplianceTrend = z.infer<typeof ComplianceTrendSchema>;
export type RegulatoryUpdate = z.infer<typeof RegulatoryUpdateSchema>;
export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;
export type ComplianceData = z.infer<typeof ComplianceDataSchema>;

export interface ComplianceFilters {
  dateRange: { start: Date; end: Date };
  categories: string[];
  severity: string[];
  status: string[];
  department: string | null;
  search: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function fetchComplianceData(filters: ComplianceFilters): Promise<ComplianceData> {
  const params = new URLSearchParams({
    startDate: filters.dateRange.start.toISOString(),
    endDate: filters.dateRange.end.toISOString(),
    ...(filters.categories.length && { categories: filters.categories.join(',') }),
    ...(filters.severity.length && { severity: filters.severity.join(',') }),
    ...(filters.status.length && { status: filters.status.join(',') }),
    ...(filters.department && { department: sanitizeInput(filters.department) }),
    ...(filters.search && { search: sanitizeInput(filters.search) }),
  });

  const response = await fetch(`/api/compliance/data?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch compliance data: ${response.statusText}`);
  }

  const data = await response.json();
  return ComplianceDataSchema.parse(data);
}

async function resolveViolation(violationId: string, resolution: {
  status: string;
  correctiveAction: string;
  cost?: number;
}): Promise<void> {
  const response = await fetch(`/api/compliance/violations/${violationId}/resolve`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: JSON.stringify({
      status: sanitizeInput(resolution.status),
      correctiveAction: sanitizeInput(resolution.correctiveAction),
      cost: resolution.cost,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve violation: ${response.statusText}`);
  }
}

async function scheduleAudit(audit: {
  type: string;
  auditor: string;
  department: string;
  scheduledDate: Date;
}): Promise<void> {
  const response = await fetch('/api/compliance/audits/schedule', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: JSON.stringify({
      type: sanitizeInput(audit.type),
      auditor: sanitizeInput(audit.auditor),
      department: sanitizeInput(audit.department),
      scheduledDate: audit.scheduledDate.toISOString(),
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to schedule audit: ${response.statusText}`);
  }
}

async function generateComplianceReport(params: {
  type: string;
  period: { start: Date; end: Date };
  includeDetails: boolean;
}): Promise<{ reportId: string; downloadUrl: string }> {
  const response = await fetch('/api/compliance/reports/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
    },
    body: JSON.stringify({
      type: sanitizeInput(params.type),
      periodStart: params.period.start.toISOString(),
      periodEnd: params.period.end.toISOString(),
      includeDetails: params.includeDetails,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to generate report: ${response.statusText}`);
  }

  return response.json();
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useReactiveComplianceReportingData(filters: ComplianceFilters) {
  const queryClient = useQueryClient();

  // Main data query with 10-second refresh
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['compliance-data', filters],
    queryFn: () => fetchComplianceData(filters),
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
    gcTime: 300000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized calculations
  const calculations = useMemo(() => {
    if (!data) return null;

    const criticalViolations = data.violations.filter(v =>
      v.severity === 'CRITICAL' && v.status === 'OPEN'
    );

    const upcomingAudits = data.audits.filter(a =>
      a.status === 'SCHEDULED' &&
      new Date(a.scheduledDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    );

    const complianceByCategory = data.metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = { compliant: 0, total: 0 };
      }
      acc[metric.category].total++;
      if (metric.status === 'COMPLIANT') {
        acc[metric.category].compliant++;
      }
      return acc;
    }, {} as Record<string, { compliant: number; total: number }>);

    const monthlyViolationTrend = data.trends.slice(-12).map(t => ({
      month: new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      violations: t.violations,
      resolved: t.resolved,
      pending: t.pending,
    }));

    const totalCostImpact = data.violations
      .filter(v => v.cost)
      .reduce((sum, v) => sum + (v.cost || 0), 0);

    const avgResolutionTime = data.violations
      .filter(v => v.resolvedAt)
      .reduce((acc, v) => {
        const time = new Date(v.resolvedAt!).getTime() - new Date(v.occurredAt).getTime();
        return acc + time / (1000 * 60 * 60 * 24); // Convert to days
      }, 0) / data.violations.filter(v => v.resolvedAt).length || 0;

    return {
      criticalViolations,
      upcomingAudits,
      complianceByCategory,
      monthlyViolationTrend,
      totalCostImpact,
      avgResolutionTime,
    };
  }, [data]);

  // Action handlers
  const handleResolveViolation = useCallback(async (
    violationId: string,
    resolution: { status: string; correctiveAction: string; cost?: number }
  ) => {
    try {
      await resolveViolation(violationId, resolution);
      await queryClient.invalidateQueries({ queryKey: ['compliance-data'] });
      return { success: true };
    } catch (error) {
      logger.error('Failed to resolve violation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [queryClient]);

  const handleScheduleAudit = useCallback(async (audit: {
    type: string;
    auditor: string;
    department: string;
    scheduledDate: Date;
  }) => {
    try {
      await scheduleAudit(audit);
      await queryClient.invalidateQueries({ queryKey: ['compliance-data'] });
      return { success: true };
    } catch (error) {
      logger.error('Failed to schedule audit:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [queryClient]);

  const handleGenerateReport = useCallback(async (params: {
    type: string;
    period: { start: Date; end: Date };
    includeDetails: boolean;
  }) => {
    try {
      const result = await generateComplianceReport(params);
      await queryClient.invalidateQueries({ queryKey: ['compliance-data'] });
      return { success: true, ...result };
    } catch (error) {
      logger.error('Failed to generate report:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [queryClient]);

  return {
    // Data
    data,
    calculations,

    // State
    isLoading,
    error: error instanceof Error ? error.message : null,

    // Actions
    refetch,
    resolveViolation: handleResolveViolation,
    scheduleAudit: handleScheduleAudit,
    generateReport: handleGenerateReport,

    // Utilities
    invalidateCache: () => queryClient.invalidateQueries({ queryKey: ['compliance-data'] }),
  };
}

// ============================================================================
// Export Utilities
// ============================================================================

export function getComplianceStatusColor(status: string): string {
  switch (status) {
    case 'COMPLIANT': return '#10b981';
    case 'WARNING': return '#f59e0b';
    case 'VIOLATION': return '#ef4444';
    case 'PENDING': return '#6b7280';
    default: return '#9ca3af';
  }
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'HIGH': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'LOW': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function formatCompliancePercentage(value: number): string {
  return `${Math.round(value)}%`;
}