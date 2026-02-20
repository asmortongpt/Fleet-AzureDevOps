/**
 * ComplianceReportingHub - Enterprise Compliance Management Dashboard
 *
 * Features:
 * - Real-time compliance metrics with 10s refresh
 * - Violation tracking and resolution workflow
 * - Audit scheduling and management
 * - Regulatory update tracking
 * - Automated report generation
 * - WCAG 2.1 AA compliant
 * - XSS/CSRF protection
 *
 * @module pages/ComplianceReportingHub
 */

import {
  Shield,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Calendar,
  BarChart,
  Download,
  Plus,
  Search,
  Filter,
  ChevronDown,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';

import { HubPage } from '@/components/ui/hub-page';
import { useDrilldown } from '@/contexts/DrilldownContext';
import {
  useReactiveComplianceReportingData,
  getComplianceStatusColor,
  getSeverityBadgeClass,
  formatCompliancePercentage,
  type ComplianceFilters,
  type Violation,
  type AuditRecord,
} from '@/hooks/use-reactive-compliancereporting-data';
import { formatEnum } from '@/utils/format-enum';
import { formatCurrency, formatDate } from '@/utils/format-helpers';

// ============================================================================
// Types
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'success' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
}

interface ViolationRowProps {
  violation: Violation;
  onResolve: (id: string) => void;
}

interface AuditRowProps {
  audit: AuditRecord;
}

// ============================================================================
// Metric Card Component
// ============================================================================

const MetricCard = React.memo<MetricCardProps>(({
  title,
  value,
  subtitle,
  trend,
  status = 'info',
  icon,
}) => {
  const statusColors = {
    success: 'text-[hsl(var(--chart-2))]',
    warning: 'text-[hsl(var(--chart-3))]',
    error: 'text-[hsl(var(--chart-6))]',
    info: 'text-[hsl(var(--chart-1))]',
  };

  const statusBackgrounds = {
    success: 'bg-[hsl(var(--chart-2)/0.12)]',
    warning: 'bg-[hsl(var(--chart-3)/0.12)]',
    error: 'bg-[hsl(var(--chart-6)/0.12)]',
    info: 'bg-[hsl(var(--chart-1)/0.12)]',
  };

  const trendIcons = {
    up: <TrendingUp className="h-4 w-4" />,
    down: <TrendingDown className="h-4 w-4" />,
    stable: null,
  };

  return (
    <div className="bg-[#242424] text-card-foreground rounded-lg p-4 border border-white/[0.08]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p className={`text-2xl font-bold mt-1 ${statusColors[status]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${statusColors[status]} ${statusBackgrounds[status]}`}>
          {icon}
        </div>
      </div>
      {trend && trend !== 'stable' && (
        <div className="flex items-center mt-2 text-xs">
          {trendIcons[trend]}
          <span className={`ml-1 ${trend === 'up' ? 'text-[hsl(var(--chart-2))]' : 'text-[hsl(var(--chart-6))]'}`}>
            {trend === 'up' ? 'Improving' : 'Declining'}
          </span>
        </div>
      )}
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

// ============================================================================
// Violation Row Component
// ============================================================================

const ViolationRow = React.memo<ViolationRowProps>(({ violation, onResolve }) => {
  const { push } = useDrilldown();

  const handleDrilldown = useCallback(() => {
    push({
      id: violation.id,
      type: 'violation',
      label: violation.description || formatEnum(violation.type),
      data: { violationId: violation.id },
    });
  }, [push, violation]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDrilldown();
    }
  }, [handleDrilldown]);

  const handleResolveKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onResolve(violation.id);
    }
  }, [onResolve, violation.id]);

  return (
    <tr
      className="border-b border-white/[0.08] cursor-pointer"
      onClick={handleDrilldown}
      onKeyDown={handleRowKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for violation: ${violation.description || formatEnum(violation.type)}`}
    >
      <td className="px-3 py-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(violation.severity)}`}>
          {formatEnum(violation.severity)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="text-sm font-medium text-foreground">
          {formatEnum(violation.type)}
        </span>
      </td>
      <td className="px-3 py-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {violation.description}
        </p>
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {formatDate(violation.occurredAt)}
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          violation.status === 'OPEN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          violation.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {formatEnum(violation.status)}
        </span>
      </td>
      <td className="px-3 py-2">
        {violation.status !== 'RESOLVED' && violation.status !== 'CLOSED' && (
          <button
            onClick={(e) => { e.stopPropagation(); onResolve(violation.id); }}
            onKeyDown={handleResolveKeyDown}
            className="text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            aria-label={`Resolve violation: ${violation.description}`}
          >
            Resolve
          </button>
        )}
      </td>
    </tr>
  );
});

ViolationRow.displayName = 'ViolationRow';

// ============================================================================
// Audit Row Component
// ============================================================================

const AuditRow = React.memo<AuditRowProps>(({ audit }) => {
  const { push } = useDrilldown();

  const handleDrilldown = useCallback(() => {
    push({
      id: audit.id,
      type: 'audit',
      label: `${formatEnum(audit.type)} Audit - ${audit.department}`,
      data: { auditId: audit.id },
    });
  }, [push, audit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDrilldown();
    }
  }, [handleDrilldown]);

  return (
    <tr
      className="border-b border-white/[0.08] cursor-pointer"
      onClick={handleDrilldown}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${formatEnum(audit.type)} audit in ${audit.department}`}
    >
      <td className="px-3 py-2">
        <span className="text-sm font-medium text-foreground">
          {formatEnum(audit.type)}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {audit.auditor}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {audit.department}
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {formatDate(audit.scheduledDate)}
      </td>
      <td className="px-3 py-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          audit.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-700' :
          audit.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          audit.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          'bg-muted/40 text-muted-foreground'
        }`}>
          {formatEnum(audit.status)}
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-muted-foreground">
        {audit.score !== undefined ? `${audit.score}%` : '--'}
      </td>
      <td className="px-3 py-2">
        {audit.reportUrl && (
          <a
            href={audit.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
            aria-label={`View report for ${audit.type} audit`}
          >
            <FileText className="h-4 w-4" />
          </a>
        )}
      </td>
    </tr>
  );
});

AuditRow.displayName = 'AuditRow';

// ============================================================================
// Dashboard Tab Component
// ============================================================================

const DashboardTab = React.memo<{
  data: ReturnType<typeof useReactiveComplianceReportingData>;
}>(({ data }) => {
  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="sr-only">Loading compliance data...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4" role="alert">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-destructive mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-destructive">
              Error Loading Data
            </h3>
            <p className="text-xs text-destructive/80 mt-1">
              {data.error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data.data || !data.calculations) {
    return null;
  }

  const { summary } = data.data;
  const { criticalViolations, upcomingAudits, totalCostImpact, avgResolutionTime } = data.calculations;

  return (
    <div className="flex flex-col gap-2 h-full overflow-auto">
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard
          title="Overall Compliance"
          value={formatCompliancePercentage(summary.overallCompliance)}
          status={summary.overallCompliance >= 90 ? 'success' : summary.overallCompliance >= 75 ? 'warning' : 'error'}
          icon={<Shield className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Violations"
          value={summary.activeViolations}
          subtitle={`${criticalViolations.length} critical`}
          status={summary.activeViolations === 0 ? 'success' : summary.activeViolations < 5 ? 'warning' : 'error'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          title="Pending Audits"
          value={summary.pendingAudits}
          subtitle={`${upcomingAudits.length} upcoming`}
          status="info"
          icon={<Calendar className="h-5 w-5" />}
        />
        <MetricCard
          title="Risk Score"
          value={summary.riskScore}
          status={summary.riskScore < 30 ? 'success' : summary.riskScore < 60 ? 'warning' : 'error'}
          icon={<BarChart className="h-5 w-5" />}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#242424] text-card-foreground rounded-lg p-4 border border-white/[0.08]">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Cost Impact
          </h3>
          <p className="text-2xl font-bold text-destructive">
            {formatCurrency(totalCostImpact)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total violation costs
          </p>
        </div>

        <div className="bg-[#242424] text-card-foreground rounded-lg p-4 border border-white/[0.08]">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Avg. Resolution Time
          </h3>
          <p className="text-2xl font-bold text-primary">
            {Math.round(avgResolutionTime)} days
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Time to resolve violations
          </p>
        </div>
      </div>

      {/* Compliance by Category */}
      <div className="bg-[#242424] text-card-foreground rounded-lg p-4 border border-white/[0.08]">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Compliance by Category
        </h3>
        <div className="space-y-3">
          {Object.entries(data.calculations.complianceByCategory).map(([category, stats]) => {
            const percentage = (stats.compliant / stats.total) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {category}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {formatCompliancePercentage(percentage)}
                  </span>
                </div>
                <div className="w-full bg-muted/40 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getComplianceStatusColor(
                        percentage >= 90 ? 'COMPLIANT' : percentage >= 75 ? 'WARNING' : 'VIOLATION'
                      ),
                    }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${category} compliance: ${percentage}%`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

DashboardTab.displayName = 'DashboardTab';

// ============================================================================
// Violations Tab Component
// ============================================================================

const ViolationsTab = React.memo<{
  data: ReturnType<typeof useReactiveComplianceReportingData>;
}>(({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  const handleResolveViolation = useCallback(async (violationId: string) => {
    const resolution = {
      status: 'IN_PROGRESS',
      correctiveAction: 'Under review',
    };
    await data.resolveViolation(violationId, resolution);
  }, [data]);

  const filteredViolations = useMemo(() => {
    if (!data.data) return [];

    return data.data.violations.filter((violation) => {
      const matchesSearch = violation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = selectedSeverity.length === 0 || selectedSeverity.includes(violation.severity);
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(violation.status);

      return matchesSearch && matchesSeverity && matchesStatus;
    });
  }, [data.data, searchTerm, selectedSeverity, selectedStatus]);

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="sr-only">Loading violations...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      {/* Search and Filters */}
      <div className="bg-[#242424] text-card-foreground rounded-lg p-3 border border-white/[0.08]">
        <div className="flex flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm border border-white/[0.08] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background/70 text-foreground"
              aria-label="Search violations"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-white/[0.08] rounded-lg text-muted-foreground"
              aria-label="Filter violations"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-[#242424] text-card-foreground rounded-lg border border-white/[0.08] overflow-hidden flex-1">
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full" role="table">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Severity
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
                  </td>
                </tr>
              ) : (
                filteredViolations.map((violation) => (
                  <ViolationRow
                    key={violation.id}
                    violation={violation}
                    onResolve={handleResolveViolation}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

ViolationsTab.displayName = 'ViolationsTab';

// ============================================================================
// Audits Tab Component
// ============================================================================

const AuditsTab = React.memo<{
  data: ReturnType<typeof useReactiveComplianceReportingData>;
}>(({ data }) => {
  const handleScheduleAudit = useCallback(async () => {
    const audit = {
      type: 'INTERNAL',
      auditor: 'Compliance Team',
      department: 'Operations',
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };
    await data.scheduleAudit(audit);
  }, [data]);

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="sr-only">Loading audits...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-foreground">
          Audit Schedule
        </h2>
        <button
          onClick={handleScheduleAudit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Schedule new audit"
        >
          <Plus className="h-4 w-4" />
          <span>Schedule Audit</span>
        </button>
      </div>

      {/* Audits Table */}
      <div className="bg-[#242424] text-card-foreground rounded-lg border border-white/[0.08] overflow-hidden flex-1">
        <div className="max-h-[200px] overflow-y-auto">
          <table className="w-full" role="table">
            <thead className="bg-muted/40 sticky top-0">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Auditor
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Report
                </th>
              </tr>
            </thead>
            <tbody>
              {!data.data || data.data.audits.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
                  </td>
                </tr>
              ) : (
                data.data.audits.map((audit) => (
                  <AuditRow key={audit.id} audit={audit} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

AuditsTab.displayName = 'AuditsTab';

// ============================================================================
// Reports Tab Component
// ============================================================================

const ReportsTab = React.memo<{
  data: ReturnType<typeof useReactiveComplianceReportingData>;
}>(({ data }) => {
  const { push } = useDrilldown();

  const handleGenerateReport = useCallback(async () => {
    const params = {
      type: 'MONTHLY',
      period: {
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        end: new Date(),
      },
      includeDetails: true,
    };
    const result = await data.generateReport(params);
    if (result.success && 'downloadUrl' in result) {
      window.open(result.downloadUrl, '_blank');
    }
  }, [data]);

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <span className="sr-only">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-foreground">
          Compliance Reports
        </h2>
        <button
          onClick={handleGenerateReport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Generate new report"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[200px]">
        {!data.data || data.data.reports.length === 0 ? (
          <div className="col-span-full">
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">No records found</div>
          </div>
        ) : (
          data.data.reports.map((report) => (
            <div
              key={report.id}
              className="bg-[#242424] text-card-foreground rounded-lg p-4 border border-white/[0.08] cursor-pointer"
              onClick={() => push({
                id: report.id,
                type: 'report',
                label: report.title,
                data: { reportId: report.id },
              })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  push({
                    id: report.id,
                    type: 'report',
                    label: report.title,
                    data: { reportId: report.id },
                  });
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`View details for report: ${report.title}`}
            >
              <div className="flex items-start justify-between mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  report.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  report.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-muted/40 text-muted-foreground'
                }`}>
                  {formatEnum(report.status)}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {report.title}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {formatDate(report.period.start)} - {formatDate(report.period.end)}
              </p>
              {report.downloadUrl && (
                <a
                  href={report.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-primary text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary rounded px-1.5 py-0.5"
                  aria-label={`Download ${report.title}`}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
});

ReportsTab.displayName = 'ReportsTab';

// ============================================================================
// Main Component
// ============================================================================

export function ComplianceReportingHub() {
  const [filters, setFilters] = useState<ComplianceFilters>({
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    categories: [],
    severity: [],
    status: [],
    department: null,
    search: '',
  });

  const complianceData = useReactiveComplianceReportingData(filters);

  const tabs = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart className="h-4 w-4" />,
      content: <DashboardTab data={complianceData} />,
    },
    {
      id: 'violations',
      label: 'Violations',
      icon: <AlertTriangle className="h-4 w-4" />,
      content: <ViolationsTab data={complianceData} />,
    },
    {
      id: 'audits',
      label: 'Audits',
      icon: <Calendar className="h-4 w-4" />,
      content: <AuditsTab data={complianceData} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="h-4 w-4" />,
      content: <ReportsTab data={complianceData} />,
    },
  ], [complianceData]);

  return (
    <HubPage
      className="cta-hub cta-compliance-hub"
      title="Compliance Reporting"
      icon={<Shield className="h-4 w-4" />}
      description="FedRAMP and NIST 800-53 compliance management with real-time monitoring"
      tabs={tabs}
      defaultTab="dashboard"
    />
  );
}

export default ComplianceReportingHub;
