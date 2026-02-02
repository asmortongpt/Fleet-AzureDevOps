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
  Warning,
  XCircle,
  TrendUp,
  TrendDown,
  FileText,
  Calendar,
  ChartBar,
  Download,
  Plus,
  MagnifyingGlass,
  Funnel,
  CaretDown,
} from '@phosphor-icons/react';
import React, { useState, useMemo, useCallback } from 'react';

import { HubPage } from '@/components/ui/hub-page';
import {
  useReactiveComplianceReportingData,
  getComplianceStatusColor,
  getSeverityBadgeClass,
  formatCompliancePercentage,
  type ComplianceFilters,
  type Violation,
  type AuditRecord,
} from '@/hooks/use-reactive-compliancereporting-data';

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
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-700',
  };

  const trendIcons = {
    up: <TrendUp className="w-4 h-4" />,
    down: <TrendDown className="w-4 h-4" />,
    stable: null,
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-700">
            {title}
          </p>
          <p className={`text-3xl font-bold mt-2 ${statusColors[status]}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-700 dark:text-gray-700 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${statusColors[status]} bg-opacity-10`}>
          {icon}
        </div>
      </div>
      {trend && trend !== 'stable' && (
        <div className="flex items-center mt-4 text-sm">
          {trendIcons[trend]}
          <span className={`ml-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
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
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onResolve(violation.id);
    }
  }, [onResolve, violation.id]);

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClass(violation.severity)}`}>
          {violation.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {violation.type}
        </span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-700 line-clamp-2">
          {violation.description}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-700">
        {new Date(violation.occurredAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          violation.status === 'OPEN' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
          violation.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {violation.status}
        </span>
      </td>
      <td className="px-4 py-3">
        {violation.status !== 'RESOLVED' && violation.status !== 'CLOSED' && (
          <button
            onClick={() => onResolve(violation.id)}
            onKeyDown={handleKeyDown}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-700 dark:hover:text-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
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
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {audit.type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-700">
        {audit.auditor}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-700">
        {audit.department}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-700">
        {new Date(audit.scheduledDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          audit.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-700' :
          audit.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
          audit.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-700'
        }`}>
          {audit.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-700">
        {audit.score !== undefined ? `${audit.score}%` : 'N/A'}
      </td>
      <td className="px-4 py-3">
        {audit.reportUrl && (
          <a
            href={audit.reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-700 dark:hover:text-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            aria-label={`View report for ${audit.type} audit`}
          >
            <FileText className="w-4 h-4" />
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="sr-only">Loading compliance data...</span>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6" role="alert">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
              Error Loading Data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
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
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Overall Compliance"
          value={formatCompliancePercentage(summary.overallCompliance)}
          status={summary.overallCompliance >= 90 ? 'success' : summary.overallCompliance >= 75 ? 'warning' : 'error'}
          icon={<Shield className="w-6 h-6" />}
        />
        <MetricCard
          title="Active Violations"
          value={summary.activeViolations}
          subtitle={`${criticalViolations.length} critical`}
          status={summary.activeViolations === 0 ? 'success' : summary.activeViolations < 5 ? 'warning' : 'error'}
          icon={<Warning className="w-6 h-6" />}
        />
        <MetricCard
          title="Pending Audits"
          value={summary.pendingAudits}
          subtitle={`${upcomingAudits.length} upcoming`}
          status="info"
          icon={<Calendar className="w-6 h-6" />}
        />
        <MetricCard
          title="Risk Score"
          value={summary.riskScore}
          status={summary.riskScore < 30 ? 'success' : summary.riskScore < 60 ? 'warning' : 'error'}
          icon={<ChartBar className="w-6 h-6" />}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Cost Impact
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            ${totalCostImpact.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-700 mt-2">
            Total violation costs
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Avg. Resolution Time
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-700">
            {Math.round(avgResolutionTime)} days
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-700 mt-2">
            Time to resolve violations
          </p>
        </div>
      </div>

      {/* Compliance by Category */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Compliance by Category
        </h3>
        <div className="space-y-4">
          {Object.entries(data.calculations.complianceByCategory).map(([category, stats]) => {
            const percentage = (stats.compliant / stats.total) * 100;
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatCompliancePercentage(percentage)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="sr-only">Loading violations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-700" />
            <input
              type="search"
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              aria-label="Search violations"
            />
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              aria-label="Filter violations"
            >
              <Funnel className="w-5 h-5" />
              <span>Filters</span>
              <CaretDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Severity
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-700 dark:text-gray-700">
                    No violations found
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="sr-only">Loading audits...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Audit Schedule
        </h2>
        <button
          onClick={handleScheduleAudit}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Schedule new audit"
        >
          <Plus className="w-5 h-5" />
          <span>Schedule Audit</span>
        </button>
      </div>

      {/* Audits Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Auditor
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Scheduled Date
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Score
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-700 uppercase tracking-wider">
                  Report
                </th>
              </tr>
            </thead>
            <tbody>
              {!data.data || data.data.audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-700 dark:text-gray-700">
                    No audits scheduled
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <span className="sr-only">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Compliance Reports
        </h2>
        <button
          onClick={handleGenerateReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Generate new report"
        >
          <Plus className="w-5 h-5" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!data.data || data.data.reports.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-700 dark:text-gray-700">
            No reports available
          </div>
        ) : (
          data.data.reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-700" />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  report.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  report.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-700'
                }`}>
                  {report.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {report.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-700 mb-4">
                {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
              </p>
              {report.downloadUrl && (
                <a
                  href={report.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-700 dark:hover:text-blue-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  aria-label={`Download ${report.title}`}
                >
                  <Download className="w-4 h-4" />
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
      icon: <ChartBar className="w-4 h-4" />,
      content: <DashboardTab data={complianceData} />,
    },
    {
      id: 'violations',
      label: 'Violations',
      icon: <Warning className="w-4 h-4" />,
      content: <ViolationsTab data={complianceData} />,
    },
    {
      id: 'audits',
      label: 'Audits',
      icon: <Calendar className="w-4 h-4" />,
      content: <AuditsTab data={complianceData} />,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText className="w-4 h-4" />,
      content: <ReportsTab data={complianceData} />,
    },
  ], [complianceData]);

  return (
    <HubPage
      title="Compliance Reporting"
      icon={<Shield className="w-4 h-4" />}
      description="FedRAMP and NIST 800-53 compliance management with real-time monitoring"
      tabs={tabs}
      defaultTab="dashboard"
    />
  );
}

export default ComplianceReportingHub;