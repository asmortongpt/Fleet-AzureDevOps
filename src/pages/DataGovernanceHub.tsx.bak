/**
 * Data Governance & Master Data Management Hub
 * Super admin only - complete control over data quality, lineage, and master data
 *
 * Only visible to: SuperAdmin roles
 *
 * Features:
 * - Master Data Management (MDM) for canonical data entities
 * - Data Quality monitoring and profiling
 * - Data Lineage tracking
 * - Reference Data management
 * - Data Catalog with metadata
 * - Data Stewardship workflows
 * - PII/Sensitive Data identification and masking
 * - Data Retention policies
 */

import { Database, BarChart, Workflow, BookOpen, ShieldCheck, Clock, AlertTriangle as WarningIcon, CheckCircle, Eye, Lock, Users, Table, Search, Download, Upload, Pencil, Trash2, Info } from 'lucide-react'
import { useState } from 'react'

import { HubPage, HubTab } from '@/components/ui/hub-page'
import { StatCard } from '@/components/ui/stat-card'

// ============================================================================
// Overview Dashboard
// ============================================================================

function OverviewContent() {
  const dataQualityScore = 94.2
  const masterRecords = 12547
  const dataIssues = 23
  const stewardshipTasks = 7

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Governance Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Enterprise data quality, lineage, and master data management</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <StatCard
          title="Data Quality Score"
          value={`${dataQualityScore}%`}
          variant="success"
          icon={<CheckCircle className="w-4 h-4" />}
        />
        <StatCard
          title="Master Records"
          value={masterRecords.toLocaleString()}
          icon={<Database className="w-4 h-4" />}
        />
        <StatCard
          title="Data Issues"
          value={dataIssues.toString()}
          variant="warning"
          icon={<WarningIcon className="w-4 h-4" />}
        />
        <StatCard
          title="Stewardship Tasks"
          value={stewardshipTasks.toString()}
          variant="info"
          icon={<Users className="w-4 h-4" />}
        />
      </div>

      {/* Master Data Domains */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Master Data Domains</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <MasterDataDomainCard
            domain="Vehicles"
            records={3247}
            qualityScore={97.3}
            lastUpdated="2 hours ago"
            steward="Fleet Operations Team"
          />
          <MasterDataDomainCard
            domain="Drivers"
            records={856}
            qualityScore={95.8}
            lastUpdated="1 day ago"
            steward="HR Department"
          />
          <MasterDataDomainCard
            domain="Vendors"
            records={423}
            qualityScore={92.1}
            lastUpdated="3 hours ago"
            steward="Procurement Team"
            hasIssues
          />
          <MasterDataDomainCard
            domain="Parts & Inventory"
            records={5847}
            qualityScore={91.5}
            lastUpdated="4 hours ago"
            steward="Maintenance Team"
            hasIssues
          />
          <MasterDataDomainCard
            domain="Locations"
            records={184}
            qualityScore={98.2}
            lastUpdated="1 week ago"
            steward="Operations Team"
          />
          <MasterDataDomainCard
            domain="Cost Centers"
            records={67}
            qualityScore={99.1}
            lastUpdated="2 days ago"
            steward="Finance Team"
          />
        </div>
      </div>

      {/* Data Quality Issues */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Recent Data Quality Issues</h3>
        <div className="space-y-3">
          <DataIssueItem
            issue="Duplicate vendor records detected"
            domain="Vendors"
            severity="medium"
            count={5}
            assignedTo="Data Steward"
          />
          <DataIssueItem
            issue="Missing VIN numbers for vehicles"
            domain="Vehicles"
            severity="high"
            count={3}
            assignedTo="Fleet Operations"
          />
          <DataIssueItem
            issue="Inconsistent part number format"
            domain="Parts & Inventory"
            severity="low"
            count={15}
            assignedTo="Maintenance Team"
          />
        </div>
      </div>
    </div>
  )
}

function MasterDataDomainCard({
  domain,
  records,
  qualityScore,
  lastUpdated,
  steward,
  hasIssues = false
}: {
  domain: string
  records: number
  qualityScore: number
  lastUpdated: string
  steward: string
  hasIssues?: boolean
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2 hover:border-blue-300 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{domain}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{records.toLocaleString()} records</p>
        </div>
        {hasIssues && <WarningIcon className="w-3 h-3 text-yellow-600" />}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Quality Score</span>
          <span className={`font-semibold ${qualityScore >= 95 ? 'text-green-600' : qualityScore >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
            {qualityScore}%
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Updated {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Users className="w-3 h-3" />
          <span>{steward}</span>
        </div>
      </div>
    </div>
  )
}

function DataIssueItem({
  issue,
  domain,
  severity,
  count,
  assignedTo
}: {
  issue: string
  domain: string
  severity: 'low' | 'medium' | 'high'
  count: number
  assignedTo: string
}) {
  const severityColors = {
    low: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  }

  return (
    <div className="flex items-start justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${severityColors[severity]}`}>
            {severity}
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-white">{issue}</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{domain}</span>
          <span>•</span>
          <span>{count} instances</span>
          <span>•</span>
          <span>Assigned to: {assignedTo}</span>
        </div>
      </div>
      <button className="px-3 py-1 text-sm text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
        View
      </button>
    </div>
  )
}

// ============================================================================
// Master Data Management
// ============================================================================

function MasterDataContent() {
  const [selectedDomain, setSelectedDomain] = useState<string>('vehicles')

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Master Data Management</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Canonical source of truth for critical business entities</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Upload className="w-3 h-3" />
            Import Master Data
          </button>
          <button className="px-2 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download className="w-3 h-3" />
            Export Master Data
          </button>
        </div>
      </div>

      {/* Domain Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['vehicles', 'drivers', 'vendors', 'parts', 'locations', 'cost-centers'].map((domain) => (
          <button
            key={domain}
            onClick={() => setSelectedDomain(domain)}
            className={`px-2 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedDomain === domain
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {domain.charAt(0).toUpperCase() + domain.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* MDM Principles */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border-2 border-blue-200 dark:border-blue-800 p-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-800 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Master Data Management Principles</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li><strong>Single Source of Truth:</strong> One canonical record per entity across all systems</li>
              <li><strong>Data Quality Rules:</strong> Automated validation and cleansing of master records</li>
              <li><strong>Governance Workflows:</strong> Approval processes for master data changes</li>
              <li><strong>Golden Records:</strong> Best-of-breed data from multiple sources merged into golden records</li>
              <li><strong>Survivorship Rules:</strong> Define which source system wins for each attribute</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Master Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{selectedDomain} Master Data</h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search master data..."
                className="pl-10 pr-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <button className="px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Add Record
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quality</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Steward</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {/* Sample rows */}
              <MasterDataRow
                id="VEH-001"
                name="2024 Ford F-150"
                status="active"
                quality={98}
                steward="Fleet Ops"
                lastUpdated="2 hours ago"
              />
              <MasterDataRow
                id="VEH-002"
                name="2023 Chevy Silverado"
                status="active"
                quality={95}
                steward="Fleet Ops"
                lastUpdated="1 day ago"
              />
              <MasterDataRow
                id="VEH-003"
                name="2022 Ram 1500"
                status="inactive"
                quality={100}
                steward="Fleet Ops"
                lastUpdated="3 days ago"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MasterDataRow({
  id,
  name,
  status,
  quality,
  steward,
  lastUpdated
}: {
  id: string
  name: string
  status: string
  quality: number
  steward: string
  lastUpdated: string
}) {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-sm font-mono text-slate-900 dark:text-white">{id}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-sm font-medium text-slate-900 dark:text-white">{name}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === 'active'
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}>
          {status}
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className={`text-sm font-semibold ${quality >= 95 ? 'text-green-600' : quality >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
          {quality}%
        </span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-sm text-slate-600 dark:text-slate-400">{steward}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <span className="text-sm text-slate-600 dark:text-slate-400">{lastUpdated}</span>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button className="p-1 text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-1 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 rounded transition-colors">
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ============================================================================
// Data Quality
// ============================================================================

function DataQualityContent() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Quality Management</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and improve data quality across all domains</p>
        </div>
        <button className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Run Quality Check
        </button>
      </div>

      {/* Data Quality Dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <DataQualityDimensionCard dimension="Accuracy" score={96.2} />
        <DataQualityDimensionCard dimension="Completeness" score={93.8} />
        <DataQualityDimensionCard dimension="Consistency" score={94.5} />
        <DataQualityDimensionCard dimension="Timeliness" score={91.3} />
        <DataQualityDimensionCard dimension="Validity" score={97.1} />
        <DataQualityDimensionCard dimension="Uniqueness" score={98.7} />
      </div>

      {/* Quality Rules */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Data Quality Rules</h3>
        <div className="space-y-3">
          <QualityRuleItem
            rule="VIN number must be 17 characters"
            domain="Vehicles"
            passing={3244}
            failing={3}
            severity="high"
          />
          <QualityRuleItem
            rule="Driver license must not be expired"
            domain="Drivers"
            passing={851}
            failing={5}
            severity="high"
          />
          <QualityRuleItem
            rule="Vendor email must be valid format"
            domain="Vendors"
            passing={418}
            failing={5}
            severity="medium"
          />
          <QualityRuleItem
            rule="Part number must follow standard format"
            domain="Parts"
            passing={5832}
            failing={15}
            severity="low"
          />
        </div>
      </div>

      {/* Data Profiling */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Data Profiling Results</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Statistical analysis of data patterns and anomalies</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Field Completeness</h4>
            <div className="space-y-2">
              <ProfilingBar label="VIN" percentage={99.1} />
              <ProfilingBar label="Make/Model" percentage={100} />
              <ProfilingBar label="License Plate" percentage={98.3} />
              <ProfilingBar label="Odometer" percentage={95.7} />
            </div>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <h4 className="font-medium text-slate-900 dark:text-white mb-3">Data Patterns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Duplicate records</span>
                <span className="font-semibold text-slate-900 dark:text-white">5 (0.15%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Null values</span>
                <span className="font-semibold text-slate-900 dark:text-white">138 (4.2%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Outliers detected</span>
                <span className="font-semibold text-slate-900 dark:text-white">12 (0.37%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DataQualityDimensionCard({ dimension, score }: { dimension: string; score: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{dimension}</p>
      <p className={`text-sm font-bold ${score >= 95 ? 'text-green-600' : score >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
        {score}%
      </p>
    </div>
  )
}

function QualityRuleItem({
  rule,
  domain,
  passing,
  failing,
  severity
}: {
  rule: string
  domain: string
  passing: number
  failing: number
  severity: 'low' | 'medium' | 'high'
}) {
  const total = passing + failing
  const passRate = ((passing / total) * 100).toFixed(1)

  const severityColors = {
    low: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  }

  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${severityColors[severity]}`}>
              {severity}
            </span>
            <span className="text-sm font-medium text-slate-900 dark:text-white">{rule}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">{domain}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">{passing.toLocaleString()} passing</p>
          <p className="text-sm font-semibold text-red-600">{failing} failing</p>
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-600 dark:text-slate-400">Pass Rate</span>
          <span className="font-medium">{passRate}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${parseFloat(passRate) >= 95 ? 'bg-green-600' : parseFloat(passRate) >= 90 ? 'bg-yellow-600' : 'bg-red-600'}`}
            style={{ width: `${passRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ProfilingBar({ label, percentage }: { label: string; percentage: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================================================
// Data Lineage
// ============================================================================

function DataLineageContent() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Lineage</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Track data flow from source to consumption</p>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md border-2 border-blue-200 dark:border-blue-800 p-3">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-800 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Data Lineage Capabilities</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
              <li><strong>Source Tracking:</strong> Identify original data sources for any field</li>
              <li><strong>Transformation Trail:</strong> See all transformations applied to data</li>
              <li><strong>Impact Analysis:</strong> Understand downstream effects of data changes</li>
              <li><strong>Compliance Support:</strong> Document data flow for audits and regulations</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lineage Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Sample Lineage: Vehicle Odometer</h3>
        <div className="space-y-2">
          <LineageStep
            step={1}
            source="Telematics Device"
            process="Data Collection"
            description="Raw odometer reading collected every 15 minutes"
            timestamp="2025-01-05 10:00 AM"
          />
          <LineageStep
            step={2}
            source="ETL Pipeline"
            process="Data Validation"
            description="Validate reading is numeric and within reasonable range"
            timestamp="2025-01-05 10:01 AM"
          />
          <LineageStep
            step={3}
            source="Data Warehouse"
            process="Data Storage"
            description="Store validated reading in vehicles.odometer_history table"
            timestamp="2025-01-05 10:02 AM"
          />
          <LineageStep
            step={4}
            source="Analytics Engine"
            process="Data Aggregation"
            description="Calculate daily average and total distance traveled"
            timestamp="2025-01-05 11:00 PM"
          />
          <LineageStep
            step={5}
            source="Fleet Dashboard"
            process="Data Presentation"
            description="Display current odometer reading and trends to users"
            timestamp="2025-01-05 11:05 PM"
          />
        </div>
      </div>
    </div>
  )
}

function LineageStep({
  step,
  source,
  process,
  description,
  timestamp
}: {
  step: number
  source: string
  process: string
  description: string
  timestamp: string
}) {
  return (
    <div className="relative pl-3">
      <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {step}
      </div>
      {step < 5 && (
        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-blue-300 dark:bg-blue-700" />
      )}
      <div className="pb-3">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-semibold text-slate-900 dark:text-white">{process}</h4>
          <span className="text-xs text-slate-500">{timestamp}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{description}</p>
        <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded">
          {source}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// Reference Data
// ============================================================================

function ReferenceDataContent() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Reference Data</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage lookup tables, codes, and standard values</p>
        </div>
        <button className="px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          Add Reference Table
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <ReferenceTableCard
          name="Vehicle Makes"
          records={43}
          description="Standard vehicle manufacturers"
          lastUpdated="2 weeks ago"
        />
        <ReferenceTableCard
          name="Fuel Types"
          records={8}
          description="Fuel type classifications"
          lastUpdated="1 month ago"
        />
        <ReferenceTableCard
          name="Maintenance Categories"
          records={15}
          description="Work order categorization"
          lastUpdated="3 days ago"
        />
        <ReferenceTableCard
          name="DOT Violation Codes"
          records={127}
          description="Federal DOT violation classifications"
          lastUpdated="1 week ago"
        />
        <ReferenceTableCard
          name="State Codes"
          records={50}
          description="US state abbreviations"
          lastUpdated="6 months ago"
        />
        <ReferenceTableCard
          name="Driver License Classes"
          records={12}
          description="Commercial driver license types"
          lastUpdated="2 months ago"
        />
      </div>
    </div>
  )
}

function ReferenceTableCard({
  name,
  records,
  description,
  lastUpdated
}: {
  name: string
  records: number
  description: string
  lastUpdated: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3 hover:border-blue-300 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
        <Table className="w-4 h-4 text-blue-800" />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{records} records</span>
        <span className="text-xs text-slate-500">Updated {lastUpdated}</span>
      </div>
    </div>
  )
}

// ============================================================================
// Data Security & Privacy
// ============================================================================

function DataSecurityContent() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Security & Privacy</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">PII/sensitive data identification and protection</p>
        </div>
      </div>

      {/* Sensitive Data Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <StatCard
          title="PII Fields Identified"
          value="47"
          icon={<Lock className="w-4 h-4" />}
        />
        <StatCard
          title="Masked Fields"
          value="42"
          variant="success"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <StatCard
          title="Encryption Applied"
          value="100%"
          variant="success"
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </div>

      {/* Sensitive Data Classification */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Sensitive Data Classification</h3>
        <div className="space-y-3">
          <SensitiveDataItem
            field="drivers.social_security_number"
            classification="PII - High Sensitivity"
            protection="Encrypted at rest, Masked in UI"
            accessRestricted="HR, Admin only"
          />
          <SensitiveDataItem
            field="drivers.drivers_license_number"
            classification="PII - Medium Sensitivity"
            protection="Encrypted at rest, Partial masking"
            accessRestricted="HR, Fleet Manager, Admin"
          />
          <SensitiveDataItem
            field="drivers.phone_number"
            classification="PII - Low Sensitivity"
            protection="Encrypted at rest"
            accessRestricted="All authenticated users"
          />
          <SensitiveDataItem
            field="vendors.bank_account"
            classification="Financial - High Sensitivity"
            protection="Encrypted at rest, Tokenized, Masked"
            accessRestricted="Finance, Admin only"
          />
        </div>
      </div>

      {/* Data Retention Policies */}
      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-3">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Data Retention Policies</h3>
        <div className="space-y-3">
          <RetentionPolicyItem
            dataType="Vehicle Service Records"
            retentionPeriod="7 years"
            reason="DOT compliance requirement"
            autoDelete={true}
          />
          <RetentionPolicyItem
            dataType="Driver HOS Logs"
            retentionPeriod="6 months"
            reason="FMCSA regulation"
            autoDelete={true}
          />
          <RetentionPolicyItem
            dataType="Fuel Transaction Data"
            retentionPeriod="3 years"
            reason="Tax audit requirements"
            autoDelete={false}
          />
          <RetentionPolicyItem
            dataType="Vehicle Telematics"
            retentionPeriod="1 year"
            reason="Operational analysis"
            autoDelete={true}
          />
        </div>
      </div>
    </div>
  )
}

function SensitiveDataItem({
  field,
  classification,
  protection,
  accessRestricted
}: {
  field: string
  classification: string
  protection: string
  accessRestricted: string
}) {
  return (
    <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex items-start gap-3">
        <Lock className="w-3 h-3 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm font-mono text-slate-900 dark:text-white">{field}</code>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded">
              {classification}
            </span>
          </div>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Protection:</span>
              <span className="text-slate-900 dark:text-white">{protection}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-400">Access:</span>
              <span className="text-slate-900 dark:text-white">{accessRestricted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RetentionPolicyItem({
  dataType,
  retentionPeriod,
  reason,
  autoDelete
}: {
  dataType: string
  retentionPeriod: string
  reason: string
  autoDelete: boolean
}) {
  return (
    <div className="flex items-start justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-slate-900 dark:text-white">{dataType}</h4>
          {autoDelete && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
              Auto-Delete
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{reason}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Retain for {retentionPeriod}</span>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Data Catalog
// ============================================================================

function DataCatalogContent() {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Catalog</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Searchable inventory of all data assets with metadata</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search data catalog..."
            className="pl-10 pr-2 py-2 w-96 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Database Tables</h3>
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          <CatalogItem
            name="vehicles"
            type="Table"
            description="Master vehicle inventory and attributes"
            fields={27}
            steward="Fleet Operations"
            tags={['master-data', 'vehicles', 'core']}
          />
          <CatalogItem
            name="drivers"
            type="Table"
            description="Driver information and credentials"
            fields={19}
            steward="HR Department"
            tags={['master-data', 'drivers', 'pii']}
          />
          <CatalogItem
            name="work_orders"
            type="Table"
            description="Maintenance work orders and service history"
            fields={15}
            steward="Maintenance Team"
            tags={['operational', 'maintenance']}
          />
          <CatalogItem
            name="fuel_transactions"
            type="Table"
            description="Fuel purchases and consumption data"
            fields={12}
            steward="Fleet Operations"
            tags={['operational', 'financial']}
          />
        </div>
      </div>
    </div>
  )
}

function CatalogItem({
  name,
  type,
  description,
  fields,
  steward,
  tags
}: {
  name: string
  type: string
  description: string
  fields: number
  steward: string
  tags: string[]
}) {
  return (
    <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <code className="text-sm font-mono font-semibold text-slate-900 dark:text-white">{name}</code>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded">
              {type}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Table className="w-4 h-4" />
              <span>{fields} fields</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              <span>{steward}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button className="px-3 py-1 text-sm text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
          View Details
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// Main Hub Export
// ============================================================================

export default function DataGovernanceHub() {
  const tabs: HubTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Database className="w-3 h-3" />,
      content: <OverviewContent />
    },
    {
      id: 'master-data',
      label: 'Master Data',
      icon: <Database className="w-3 h-3" />,
      content: <MasterDataContent />
    },
    {
      id: 'data-quality',
      label: 'Data Quality',
      icon: <BarChart className="w-3 h-3" />,
      content: <DataQualityContent />
    },
    {
      id: 'lineage',
      label: 'Data Lineage',
      icon: <Workflow className="w-3 h-3" />,
      content: <DataLineageContent />
    },
    {
      id: 'reference-data',
      label: 'Reference Data',
      icon: <BookOpen className="w-3 h-3" />,
      content: <ReferenceDataContent />
    },
    {
      id: 'security',
      label: 'Security & Privacy',
      icon: <ShieldCheck className="w-3 h-3" />,
      content: <DataSecurityContent />
    },
    {
      id: 'catalog',
      label: 'Data Catalog',
      icon: <Search className="w-3 h-3" />,
      content: <DataCatalogContent />
    }
  ]

  return (
    <HubPage
      title="Data Governance & Master Data Management"
      description="Enterprise data quality, lineage, and master data management"
      icon={<Database className="w-4 h-4" />}
      tabs={tabs}
      defaultTab="overview"
      gradient="from-emerald-900/20 via-teal-900/10 to-transparent"
      superAdminOnly
    />
  )
}
