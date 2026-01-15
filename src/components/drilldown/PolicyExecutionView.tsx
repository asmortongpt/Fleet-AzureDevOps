/**
 * PolicyExecutionView - Policy execution history and details
 *
 * Shows automated policy executions including:
 * - List of execution events
 * - Execution status and results
 * - Actions taken automatically
 * - Filter by status, policy, date range
 * - Drill down to execution details
 */

import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Shield,
  Car,
  User,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { DrilldownDataTable, DrilldownColumn } from '@/components/drilldown/DrilldownDataTable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { cn } from '@/lib/utils'

interface PolicyExecutionViewProps {
  policyId?: string
  entityType?: 'vehicle' | 'driver' | 'trip'
  entityId?: string
}

interface PolicyExecution {
  id: string
  execution_number: string
  policy_id: string
  policy_name: string
  policy_number: string
  executed_at: string
  execution_type: 'scheduled' | 'event_triggered' | 'manual'
  entity_type: 'vehicle' | 'driver' | 'trip'
  entity_id: string
  entity_name: string
  result: 'passed' | 'failed' | 'warning' | 'error'
  confidence_score?: number
  actions_taken: ActionTaken[]
  duration_ms: number
  triggered_by?: string
  error_message?: string
  metadata?: Record<string, any>
}

interface ActionTaken {
  action_type: string
  status: 'completed' | 'failed' | 'pending'
  details: string
  timestamp: string
}

interface ExecutionStatistics {
  total_executions: number
  successful: number
  failed: number
  warnings: number
  errors: number
  avg_duration_ms: number
  avg_confidence: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PolicyExecutionView({
  policyId,
  entityType,
  entityId,
}: PolicyExecutionViewProps) {
  const { push } = useDrilldown()
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  // Build query params
  const queryParams = new URLSearchParams()
  if (policyId) queryParams.append('policyId', policyId)
  if (entityType) queryParams.append('entityType', entityType)
  if (entityId) queryParams.append('entityId', entityId)
  if (filterStatus !== 'all') queryParams.append('result', filterStatus)
  if (filterDateFrom) queryParams.append('dateFrom', filterDateFrom)
  if (filterDateTo) queryParams.append('dateTo', filterDateTo)

  // Fetch executions
  const { data: executions, error, isLoading, mutate } = useSWR<PolicyExecution[]>(
    `/api/policy-executions?${queryParams.toString()}`,
    fetcher
  )

  // Fetch statistics
  const { data: stats } = useSWR<ExecutionStatistics>(
    `/api/policy-executions/statistics?${queryParams.toString()}`,
    fetcher
  )

  // Filter by search term
  const filteredExecutions = executions?.filter((exec) => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      exec.execution_number.toLowerCase().includes(searchLower) ||
      exec.policy_name.toLowerCase().includes(searchLower) ||
      exec.entity_name.toLowerCase().includes(searchLower)
    )
  })

  const handleViewExecution = (execution: PolicyExecution) => {
    push({
      id: `execution-${execution.id}`,
      type: 'execution-detail',
      label: `Execution ${execution.execution_number}`,
      data: { executionId: execution.id, execution },
    })
  }

  const getResultColor = (
    result: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (result?.toLowerCase()) {
      case 'passed':
        return 'default'
      case 'failed':
        return 'destructive'
      case 'warning':
        return 'secondary'
      case 'error':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'passed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getExecutionTypeIcon = (type: string) => {
    switch (type) {
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'event_triggered':
        return <Zap className="h-4 w-4" />
      case 'manual':
        return <Play className="h-4 w-4" />
      default:
        return <Play className="h-4 w-4" />
    }
  }

  // Table columns
  const columns: DrilldownColumn<PolicyExecution>[] = [
    {
      key: 'execution_number',
      header: 'Execution #',
      sortable: true,
      render: (exec) => (
        <div>
          <p className="font-mono text-sm">{exec.execution_number}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(exec.executed_at).toLocaleString()}
          </p>
        </div>
      ),
    },
    {
      key: 'policy',
      header: 'Policy',
      drilldown: {
        recordType: 'policy',
        getRecordId: (exec) => exec.policy_id,
        getRecordLabel: (exec) => exec.policy_name,
      },
      render: (exec) => (
        <div>
          <p className="font-medium text-sm">{exec.policy_name}</p>
          <p className="text-xs text-muted-foreground">#{exec.policy_number}</p>
        </div>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      drilldown: {
        recordType: 'auto', // Will be determined by entity_type
        getRecordId: (exec) => exec.entity_id,
        getRecordLabel: (exec) => exec.entity_name,
        getRecordData: (exec) => ({
          [`${exec.entity_type}Id`]: exec.entity_id,
        }),
      },
      render: (exec) => (
        <div className="flex items-center gap-2">
          {exec.entity_type === 'vehicle' && <Car className="h-4 w-4 text-muted-foreground" />}
          {exec.entity_type === 'driver' && <User className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="font-medium text-sm capitalize">{exec.entity_type}</p>
            <p className="text-xs text-muted-foreground">{exec.entity_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'execution_type',
      header: 'Type',
      sortable: true,
      render: (exec) => (
        <div className="flex items-center gap-2">
          {getExecutionTypeIcon(exec.execution_type)}
          <span className="text-sm capitalize">{exec.execution_type.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'result',
      header: 'Result',
      sortable: true,
      render: (exec) => (
        <div className="flex items-center gap-2">
          {getResultIcon(exec.result)}
          <Badge variant={getResultColor(exec.result)} className="capitalize">
            {exec.result}
          </Badge>
        </div>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      sortable: true,
      render: (exec) =>
        exec.confidence_score !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    exec.confidence_score >= 0.9
                      ? 'bg-green-500'
                      : exec.confidence_score >= 0.7
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${exec.confidence_score * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-medium min-w-[3ch]">
              {Math.round(exec.confidence_score * 100)}%
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">N/A</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (exec) => (
        <div className="text-sm">
          <span className="font-medium">{exec.actions_taken.length}</span>
          <span className="text-muted-foreground ml-1">
            (
            {exec.actions_taken.filter((a) => a.status === 'completed').length} completed)
          </span>
        </div>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      sortable: true,
      render: (exec) => (
        <span className="text-sm">
          {exec.duration_ms < 1000
            ? `${exec.duration_ms}ms`
            : `${(exec.duration_ms / 1000).toFixed(2)}s`}
        </span>
      ),
    },
  ]

  return (
    <DrilldownContent loading={false} error={null}>
      <div className="space-y-2">
        {/* Header */}
        <div>
          <h3 className="text-sm font-bold">Policy Execution History</h3>
          <p className="text-sm text-muted-foreground">
            Automated policy executions and enforcement actions
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{stats.total_executions}</div>
                <p className="text-xs text-muted-foreground">Executions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Passed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-green-600">{stats.successful}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_executions > 0
                    ? Math.round((stats.successful / stats.total_executions) * 100)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-red-600">{stats.failed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_executions > 0
                    ? Math.round((stats.failed / stats.total_executions) * 100)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold text-yellow-600">{stats.warnings}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_executions > 0
                    ? Math.round((stats.warnings / stats.total_executions) * 100)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">
                  {stats.avg_duration_ms < 1000
                    ? `${Math.round(stats.avg_duration_ms)}ms`
                    : `${(stats.avg_duration_ms / 1000).toFixed(2)}s`}
                </div>
                <p className="text-xs text-muted-foreground">Duration</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Confidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{Math.round(stats.avg_confidence * 100)}%</div>
                <p className="text-xs text-muted-foreground">Average</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Search</label>
                <Input
                  placeholder="Search executions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Result</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Results</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Executions Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Executions ({filteredExecutions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DrilldownDataTable
              data={filteredExecutions || []}
              columns={columns}
              recordType="execution-detail"
              getRecordId={(exec) => exec.id}
              getRecordLabel={(exec) => `Execution ${exec.execution_number}`}
              getRecordData={(exec) => ({ executionId: exec.id, execution: exec })}
              isLoading={isLoading}
              emptyMessage="No executions found"
            />
          </CardContent>
        </Card>
      </div>
    </DrilldownContent>
  )
}
