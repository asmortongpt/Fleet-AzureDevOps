/**
 * PolicyDetailPanel - Level 2 drilldown for policy details
 * Shows comprehensive policy information with execution history, compliance tracking, and violations
 */

import {
  Shield,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  TrendingUp,
  Users,
  Car,
  Target,
  BarChart3,
} from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

interface PolicyDetailPanelProps {
  policyId: string
}

interface PolicyData {
  id: string
  policy_number: string
  name: string
  description: string
  category: string
  type: 'safety' | 'maintenance' | 'compliance' | 'operational' | 'environmental'
  status: 'active' | 'inactive' | 'draft' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  effective_date: string
  expiry_date?: string
  created_by?: string
  created_date: string
  last_updated?: string
  compliance_score?: number
  enforcement_level: 'advisory' | 'warning' | 'mandatory' | 'critical'
  applies_to: 'all' | 'vehicles' | 'drivers' | 'specific'
  violation_count?: number
  execution_count?: number
  success_rate?: number
}

interface ExecutionHistory {
  id: string
  timestamp: string
  entity_type: 'vehicle' | 'driver' | 'trip'
  entity_id: string
  entity_name: string
  result: 'passed' | 'failed' | 'warning'
  details?: string
  action_taken?: string
  user_name?: string
}

interface Violation {
  id: string
  date: string
  entity_type: 'vehicle' | 'driver' | 'trip'
  entity_id: string
  entity_name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  status: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
  assigned_to?: string
  resolution_date?: string
  resolution_notes?: string
}

interface ComplianceMetric {
  period: string
  total_checks: number
  passed: number
  failed: number
  warnings: number
  compliance_rate: number
}

interface AffectedEntity {
  id: string
  type: 'vehicle' | 'driver' | 'department'
  name: string
  compliance_status: 'compliant' | 'warning' | 'violation'
  last_check_date?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function PolicyDetailPanel({ policyId }: PolicyDetailPanelProps) {
  const { push } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')

  // Main policy data
  const { data: policy, error, isLoading, mutate } = useSWR<PolicyData>(
    `/api/policies/${policyId}`,
    fetcher
  )

  // Execution history
  const { data: executionHistory } = useSWR<ExecutionHistory[]>(
    policyId ? `/api/policies/${policyId}/executions` : null,
    fetcher
  )

  // Violations
  const { data: violations } = useSWR<Violation[]>(
    policyId ? `/api/policies/${policyId}/violations` : null,
    fetcher
  )

  // Compliance metrics
  const { data: complianceMetrics } = useSWR<ComplianceMetric[]>(
    policyId ? `/api/policies/${policyId}/compliance-metrics` : null,
    fetcher
  )

  // Affected entities
  const { data: affectedEntities } = useSWR<AffectedEntity[]>(
    policyId ? `/api/policies/${policyId}/affected-entities` : null,
    fetcher
  )

  const handleViewEntity = (entityType: string, entityId: string, entityName: string) => {
    push({
      id: `${entityType}-${entityId}`,
      type: entityType,
      label: entityName,
      data: { [`${entityType}Id`]: entityId },
    })
  }

  const handleViewViolation = (violation: Violation) => {
    push({
      id: `violation-${violation.id}`,
      type: 'violation',
      label: `Violation - ${violation.entity_name}`,
      data: { violationId: violation.id, violation },
    })
  }

  const getStatusColor = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
      case 'archived':
        return 'secondary'
      case 'draft':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getPriorityColor = (priority: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getSeverityColor = (severity: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getResultIcon = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />
    }
  }

  const getComplianceStatusColor = (status: string): 'default' | 'destructive' | 'secondary' => {
    switch (status?.toLowerCase()) {
      case 'compliant':
        return 'default'
      case 'violation':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const openViolations = violations?.filter(v => v.status === 'open').length || 0
  const resolvedViolations = violations?.filter(v => v.status === 'resolved').length || 0

  return (
    <DrilldownContent loading={isLoading} error={error} onRetry={() => mutate()}>
      {policy && (
        <div className="space-y-6">
          {/* Policy Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">{policy.name}</h3>
              <p className="text-sm text-muted-foreground">Policy #{policy.policy_number}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={getStatusColor(policy.status)}>
                  {policy.status}
                </Badge>
                <Badge variant={getPriorityColor(policy.priority)}>
                  {policy.priority} Priority
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {policy.type}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {policy.enforcement_level}
                </Badge>
              </div>
            </div>
            <Shield className="h-12 w-12 text-primary" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policy.compliance_score || 0}%</div>
                <Progress value={policy.compliance_score || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{policy.execution_count || 0}</div>
                {policy.success_rate !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {policy.success_rate.toFixed(1)}% success
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Open Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{openViolations}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {resolvedViolations} resolved
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Applies To
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold capitalize">{policy.applies_to}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {affectedEntities?.length || 0} entities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="executions">Executions</TabsTrigger>
              <TabsTrigger value="violations">Violations ({violations?.length || 0})</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="affected">Affected ({affectedEntities?.length || 0})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              {/* Policy Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Policy Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium capitalize">{policy.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium capitalize">{policy.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Enforcement Level</p>
                      <Badge variant={policy.enforcement_level === 'critical' ? 'destructive' : 'default'}>
                        {policy.enforcement_level}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Applies To</p>
                      <p className="font-medium capitalize">{policy.applies_to}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{policy.created_by || 'N/A'}</p>
                      {policy.created_date && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(policy.created_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {policy.last_updated
                          ? new Date(policy.last_updated).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Effective Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Effective Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Effective Date</span>
                    <span className="font-medium">
                      {new Date(policy.effective_date).toLocaleDateString()}
                    </span>
                  </div>
                  {policy.expiry_date && (
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm">Expiry Date</span>
                      <span className={`font-medium ${new Date(policy.expiry_date) < new Date() ? 'text-destructive' : ''}`}>
                        {new Date(policy.expiry_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              {policy.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{policy.description}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Executions Tab */}
            <TabsContent value="executions" className="space-y-4">
              {executionHistory && executionHistory.length > 0 ? (
                <div className="space-y-3">
                  {executionHistory.slice(0, 20).map((execution) => (
                    <Card key={execution.id}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {getResultIcon(execution.result)}
                              <div>
                                <p className="font-medium capitalize">
                                  {execution.entity_type}: {execution.entity_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {execution.details || `Policy ${execution.result}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                {new Date(execution.timestamp).toLocaleString()}
                              </p>
                              <Badge variant={execution.result === 'passed' ? 'default' : execution.result === 'failed' ? 'destructive' : 'secondary'}>
                                {execution.result}
                              </Badge>
                            </div>
                          </div>

                          {execution.action_taken && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground">Action Taken</p>
                              <p className="text-sm mt-1">{execution.action_taken}</p>
                            </div>
                          )}

                          {execution.user_name && (
                            <p className="text-xs text-muted-foreground pt-2 border-t">
                              Executed by {execution.user_name}
                            </p>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEntity(execution.entity_type, execution.entity_id, execution.entity_name)}
                            className="w-full"
                          >
                            View {execution.entity_type}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {executionHistory.length > 20 && (
                    <p className="text-sm text-center text-muted-foreground">
                      +{executionHistory.length - 20} more executions
                    </p>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No execution history</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Violations Tab */}
            <TabsContent value="violations" className="space-y-4">
              {violations && violations.length > 0 ? (
                <div className="space-y-3">
                  {violations.map((violation) => (
                    <Card
                      key={violation.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewViolation(violation)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={getSeverityColor(violation.severity)}>
                                  {violation.severity}
                                </Badge>
                                <Badge variant={violation.status === 'resolved' ? 'default' : violation.status === 'open' ? 'destructive' : 'secondary'}>
                                  {violation.status}
                                </Badge>
                              </div>
                              <p className="font-medium capitalize">
                                {violation.entity_type}: {violation.entity_name}
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {violation.description}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xs text-muted-foreground">
                                {new Date(violation.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {violation.assigned_to && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">Assigned to</p>
                              <p className="text-sm font-medium">{violation.assigned_to}</p>
                            </div>
                          )}

                          {violation.status === 'resolved' && violation.resolution_date && (
                            <div className="pt-2 border-t">
                              <p className="text-xs text-muted-foreground">Resolved</p>
                              <p className="text-sm">
                                {new Date(violation.resolution_date).toLocaleDateString()}
                              </p>
                              {violation.resolution_notes && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {violation.resolution_notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-sm text-muted-foreground">No violations recorded</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent value="compliance" className="space-y-4">
              {complianceMetrics && complianceMetrics.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Compliance Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {complianceMetrics.map((metric, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{metric.period}</span>
                              <span className="text-sm font-bold">{metric.compliance_rate.toFixed(1)}%</span>
                            </div>
                            <Progress value={metric.compliance_rate} />
                            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium">{metric.total_checks}</span> checks
                              </div>
                              <div className="text-green-600">
                                <span className="font-medium">{metric.passed}</span> passed
                              </div>
                              <div className="text-red-600">
                                <span className="font-medium">{metric.failed}</span> failed
                              </div>
                              <div className="text-yellow-600">
                                <span className="font-medium">{metric.warnings}</span> warnings
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Overall Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Current Compliance Rate</span>
                          <span className="font-semibold">{policy.compliance_score || 0}%</span>
                        </div>
                        <Progress value={policy.compliance_score || 0} className="h-3" />
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Total Executions</p>
                            <p className="text-lg font-bold">{policy.execution_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                            <p className="text-lg font-bold">{policy.success_rate?.toFixed(1) || 0}%</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No compliance data available</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Affected Entities Tab */}
            <TabsContent value="affected" className="space-y-4">
              {affectedEntities && affectedEntities.length > 0 ? (
                <div className="space-y-3">
                  {affectedEntities.map((entity) => (
                    <Card
                      key={entity.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewEntity(entity.type, entity.id, entity.name)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {entity.type === 'vehicle' && <Car className="h-5 w-5 text-muted-foreground" />}
                            {entity.type === 'driver' && <Users className="h-5 w-5 text-muted-foreground" />}
                            <div>
                              <p className="font-medium">{entity.name}</p>
                              <p className="text-sm text-muted-foreground capitalize">{entity.type}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={getComplianceStatusColor(entity.compliance_status)}>
                              {entity.compliance_status}
                            </Badge>
                            {entity.last_check_date && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last check: {new Date(entity.last_check_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">No affected entities</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DrilldownContent>
  )
}
