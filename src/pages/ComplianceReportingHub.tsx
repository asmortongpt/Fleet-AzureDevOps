/**
 * Compliance Reporting Hub
 * Comprehensive FedRAMP and NIST 800-53 compliance reporting dashboard
 * Route: /compliance/reporting
 */

import { useState, useEffect } from 'react'
import {
  Shield,
  ChartBar,
  FileText,
  CheckCircle,
  Warning,
  X,
  Calendar,
  Download,
  Play,
  ListChecks
} from '@phosphor-icons/react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard } from '@/components/ui/stat-card'

interface ComplianceSummary {
  total_controls: number
  fedramp_required: number
  implemented: number
  partially_implemented: number
  not_implemented: number
  planned: number
  compliance_percentages: {
    low: number
    moderate: number
    high: number
  }
}

interface AuditSummary {
  total_events: number
  events_by_control: Record<string, number>
  events_by_severity: Record<string, number>
  recent_critical_events: number
}

interface Control {
  id: string
  family: string
  title: string
  description: string
  baseline: string[]
  fedramp_required: boolean
  implementation_status: string
  evidence_locations?: string[]
}

interface ComplianceReport {
  id: string
  report_type: string
  baseline: string
  generated_at: string
  period_start: string
  period_end: string
  overall_compliance: number
  summary: {
    total_controls: number
    implemented: number
    partially_implemented: number
    not_implemented: number
    compliance_percentage: number
  }
}

function DashboardContent() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null)
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComplianceSummary()
  }, [])

  const fetchComplianceSummary = async () => {
    try {
      const response = await fetch('/api/compliance/summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data.controls_summary)
        setAuditSummary(data.audit_summary)
      }
    } catch (error) {
      console.error('Error fetching compliance summary:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Dashboard</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall Compliance"
          value={`${summary?.compliance_percentages.moderate || 0}%`}
          variant="success"
          icon={<CheckCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Controls Implemented"
          value={`${summary?.implemented || 0}/${summary?.total_controls || 0}`}
          variant="primary"
        />
        <StatCard
          title="Partially Implemented"
          value={summary?.partially_implemented || 0}
          variant="warning"
          icon={<Warning className="w-6 h-6" />}
        />
        <StatCard
          title="Critical Events (24h)"
          value={auditSummary?.recent_critical_events || 0}
          variant={auditSummary?.recent_critical_events ? 'error' : 'default'}
        />
      </div>

      {/* FedRAMP Baseline Compliance */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          FedRAMP Baseline Compliance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {summary?.compliance_percentages.low || 0}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">FedRAMP Low</div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${summary?.compliance_percentages.low || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {summary?.compliance_percentages.moderate || 0}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">FedRAMP Moderate</div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${summary?.compliance_percentages.moderate || 0}%` }}
              ></div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {summary?.compliance_percentages.high || 0}%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">FedRAMP High</div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all"
                style={{ width: `${summary?.compliance_percentages.high || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Activity Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Audit Activity (Last 30 Days)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {auditSummary?.total_events.toLocaleString() || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Total Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-600">
              {auditSummary?.events_by_severity?.INFO || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Info</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {auditSummary?.events_by_severity?.WARNING || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Warnings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {auditSummary?.events_by_severity?.ERROR || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Errors</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ControlsContent() {
  const [controls, setControls] = useState<Control[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchControls()
  }, [filter])

  const fetchControls = async () => {
    try {
      const url =
        filter === 'all'
          ? '/api/compliance/nist-controls'
          : `/api/compliance/nist-controls?status=${filter}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setControls(data.controls)
      }
    } catch (error) {
      console.error('Error fetching controls:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IMPLEMENTED':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
      case 'PARTIALLY_IMPLEMENTED':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'NOT_IMPLEMENTED':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'PLANNED':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      default:
        return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">NIST 800-53 Controls</h2>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">All Controls</option>
          <option value="IMPLEMENTED">Implemented</option>
          <option value="PARTIALLY_IMPLEMENTED">Partially Implemented</option>
          <option value="NOT_IMPLEMENTED">Not Implemented</option>
          <option value="PLANNED">Planned</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {controls.map(control => (
          <div
            key={control.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-semibold text-emerald-600">{control.id}</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      control.implementation_status
                    )}`}
                  >
                    {control.implementation_status.replace(/_/g, ' ')}
                  </span>
                  {control.fedramp_required && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20">
                      FedRAMP Required
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {control.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {control.description}
                </p>
                {control.evidence_locations && control.evidence_locations.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FileText className="w-4 h-4" />
                    <span>{control.evidence_locations.length} evidence files</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportsContent() {
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/compliance/reports?limit=20', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async (baseline: string) => {
    setGenerating(true)
    try {
      const response = await fetch('/api/compliance/fedramp/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          baseline,
          period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          period_end: new Date().toISOString()
        })
      })

      if (response.ok) {
        await fetchReports()
        alert('Report generated successfully!')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Compliance Reports</h2>
        <div className="flex gap-2">
          <button
            onClick={() => generateReport('LOW')}
            disabled={generating}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Generate Low
          </button>
          <button
            onClick={() => generateReport('MODERATE')}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Generate Moderate
          </button>
          <button
            onClick={() => generateReport('HIGH')}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Generate High
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map(report => (
          <div
            key={report.id}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/20">
                    {report.report_type}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    {report.baseline}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.overall_compliance >= 80
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    {report.overall_compliance}% Compliant
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                  {report.report_type} {report.baseline} Compliance Report
                </h3>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(report.generated_at).toLocaleDateString()}
                  </span>
                  <span>
                    Period: {new Date(report.period_start).toLocaleDateString()} -{' '}
                    {new Date(report.period_end).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <span className="text-emerald-600">
                    {report.summary.implemented} Implemented
                  </span>
                  <span className="text-yellow-600">
                    {report.summary.partially_implemented} Partial
                  </span>
                  <span className="text-red-600">
                    {report.summary.not_implemented} Not Implemented
                  </span>
                </div>
              </div>
              <button className="px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center gap-1">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No compliance reports generated yet</p>
            <p className="text-sm mt-1">Click a button above to generate your first report</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ComplianceReportingHub() {
  const tabs: HubTab[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartBar className="w-4 h-4" />, content: <DashboardContent /> },
    { id: 'controls', label: 'Controls', icon: <ListChecks className="w-4 h-4" />, content: <ControlsContent /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" />, content: <ReportsContent /> }
  ]

  return (
    <HubPage
      title="Compliance Reporting"
      icon={<Shield className="w-6 h-6" />}
      description="FedRAMP and NIST 800-53 compliance management and reporting"
      tabs={tabs}
      defaultTab="dashboard"
    />
  )
}

export default ComplianceReportingHub
