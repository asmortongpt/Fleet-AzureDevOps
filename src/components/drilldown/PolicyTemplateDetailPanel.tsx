/**
 * PolicyTemplateDetailPanel - Policy template details for onboarding
 *
 * Shows template information including:
 * - Template description and purpose
 * - Pre-configured conditions and actions
 * - Sample violations this policy catches
 * - Implementation requirements
 * - "Use Template" action to create policy
 */

import {
  Shield,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Settings,
  Zap,
  TrendingUp,
  Copy,
  Info,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'
import logger from '@/utils/logger';
import { secureFetch } from '@/hooks/use-api';

interface PolicyTemplateDetailPanelProps {
  templateId: string
  template?: PolicyTemplate
}

interface PolicyTemplate {
  id: string
  name: string
  category: string
  type: 'safety' | 'maintenance' | 'compliance' | 'operational' | 'environmental'
  description: string
  purpose: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  enforcement_level: 'advisory' | 'warning' | 'mandatory' | 'critical'
  applies_to: 'all' | 'vehicles' | 'drivers' | 'specific'
  industry_vertical?: string[]
  fleet_size_min?: number
  fleet_size_max?: number
  conditions: PolicyCondition[]
  actions: PolicyAction[]
  sample_violations?: SampleViolation[]
  implementation_requirements?: ImplementationRequirement[]
  estimated_impact: {
    cost_savings?: number
    safety_improvement?: number
    efficiency_gain?: number
  }
  compliance_standards?: string[]
  best_practices_source?: string
}

interface PolicyCondition {
  id: string
  condition_type: string
  description: string
  parameters: Record<string, any>
  is_required: boolean
}

interface PolicyAction {
  id: string
  action_type: string
  description: string
  parameters: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
  automated: boolean
}

interface SampleViolation {
  id: string
  scenario: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency?: 'rare' | 'occasional' | 'common' | 'frequent'
}

interface ImplementationRequirement {
  id: string
  requirement_type: 'data' | 'integration' | 'configuration' | 'training'
  title: string
  description: string
  priority: 'required' | 'recommended' | 'optional'
  estimated_time?: string
}

export function PolicyTemplateDetailPanel({
  templateId,
  template,
}: PolicyTemplateDetailPanelProps) {
  const { pop } = useDrilldown()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)

  const fetcher = (url: string) =>
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => data?.data ?? data)

  const { data: apiTemplate } = useSWR<any>(
    template ? null : `/api/policy-templates/${templateId}`,
    fetcher,
    { shouldRetryOnError: false }
  )

  const { data: apiViolations } = useSWR<any>(
    `/api/policy-templates/${templateId}/violations?limit=10`,
    fetcher,
    { shouldRetryOnError: false }
  )

  const templateData: PolicyTemplate | undefined = useMemo(() => {
    const source = template ?? apiTemplate
    if (!source) return undefined
    return {
      id: String(source.id ?? templateId),
      name: String(source.name ?? source.policy_name ?? templateId),
      category: String(source.category ?? source.type ?? 'policy'),
      type: (source.type ?? source.policy_type ?? 'operational') as PolicyTemplate['type'],
      description: String(source.description ?? source.summary ?? ''),
      purpose: String(source.purpose ?? source.objective ?? ''),
      priority: (source.priority ?? 'medium') as PolicyTemplate['priority'],
      enforcement_level: (source.enforcement_level ?? source.enforcementLevel ?? 'advisory') as PolicyTemplate['enforcement_level'],
      applies_to: (source.applies_to ?? source.appliesTo ?? 'all') as PolicyTemplate['applies_to'],
      industry_vertical: Array.isArray(source.industry_vertical) ? source.industry_vertical : [],
      fleet_size_min: source.fleet_size_min ?? source.fleetSizeMin,
      fleet_size_max: source.fleet_size_max ?? source.fleetSizeMax,
      conditions: Array.isArray(source.conditions) ? source.conditions : [],
      actions: Array.isArray(source.actions) ? source.actions : [],
      sample_violations: Array.isArray(apiViolations?.data)
        ? apiViolations.data.map((violation: any) => ({
            id: String(violation.id),
            scenario: String(violation.policy_name ?? violation.violation_type ?? 'Violation'),
            description: String(violation.description ?? ''),
            severity: (violation.severity ?? 'medium') as SampleViolation['severity'],
            frequency: (violation.frequency ?? violation.violation_frequency) as SampleViolation['frequency'],
          }))
        : [],
      implementation_requirements: Array.isArray(source.implementation_requirements)
        ? source.implementation_requirements
        : [],
      estimated_impact: source.estimated_impact ?? {
        cost_savings: source.cost_savings,
        safety_improvement: source.safety_improvement,
        efficiency_gain: source.efficiency_gain,
      },
      compliance_standards: Array.isArray(source.compliance_standards)
        ? source.compliance_standards
        : [],
      best_practices_source: source.best_practices_source,
    }
  }, [template, apiTemplate, apiViolations, templateId])

  const implementationRequirements = templateData?.implementation_requirements ?? []
  const sampleViolations = templateData?.sample_violations ?? []

  const handleUseTemplate = async () => {
    setIsLoading(true)
    try {
      const response = await secureFetch(`/api/policy-templates/${templateId}/execute`, {
        method: 'POST',
        body: JSON.stringify({ context: {} })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || 'Failed to execute template')
      }

      toast.success(`Policy "${templateData?.name ?? templateId}" created successfully!`)
      pop() // Go back to template list
    } catch (error) {
      toast.error('Failed to create policy from template')
      logger.error(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (
    severity: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
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

  const getPriorityColor = (
    priority: string
  ): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (priority?.toLowerCase()) {
      case 'required':
        return 'destructive'
      case 'recommended':
        return 'default'
      case 'optional':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getFrequencyColor = (frequency?: string) => {
    switch (frequency?.toLowerCase()) {
      case 'frequent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'common':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'occasional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'rare':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-600'
    }
  }

  if (!templateData) {
    return (
      <DrilldownContent loading={false} error={null}>
        <div className="p-6 text-center text-sm text-muted-foreground">
          Policy template data is not available.
        </div>
      </DrilldownContent>
    )
  }

  return (
    <DrilldownContent loading={false} error={null}>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold">{templateData.name}</h3>
            <p className="text-sm text-muted-foreground">{templateData.category}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="capitalize">
                {templateData.type}
              </Badge>
              <Badge variant={getSeverityColor(templateData.priority)}>
                {templateData.priority} Priority
              </Badge>
              <Badge variant="outline" className="capitalize">
                {templateData.enforcement_level}
              </Badge>
              <Badge variant="secondary">Applies to: {templateData.applies_to}</Badge>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Shield className="h-9 w-12 text-primary" />
            <Button onClick={handleUseTemplate} disabled={isLoading} size="lg">
              <Copy className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Use Template'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-green-600">
                ${templateData.estimated_impact.cost_savings?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Estimated annually</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Safety Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-blue-800">
                +{templateData.estimated_impact.safety_improvement || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Reduction in incidents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Efficiency Gain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-purple-600">
                +{templateData.estimated_impact.efficiency_gain || 0}%
              </div>
              <p className="text-xs text-muted-foreground">Operational improvement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {implementationRequirements.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  implementationRequirements.filter((r) => r.priority === 'required')
                    .length
                }{' '}
                required
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="samples">Samples</TabsTrigger>
            <TabsTrigger value="implementation">Implementation</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{templateData.description}</p>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Purpose</p>
                  <p className="text-sm">{templateData.purpose}</p>
                </div>

                {templateData.industry_vertical && templateData.industry_vertical.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Industry Verticals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {templateData.industry_vertical.map((industry) => (
                          <Badge key={industry} variant="outline">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {templateData.compliance_standards &&
                  templateData.compliance_standards.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Compliance Standards
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {templateData.compliance_standards.map((standard) => (
                            <Badge key={standard} variant="secondary">
                              {standard}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                {templateData.best_practices_source && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Best Practices Source</p>
                        <p className="text-sm text-muted-foreground">
                          {templateData.best_practices_source}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {(templateData.fleet_size_min || templateData.fleet_size_max) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Recommended Fleet Size
                      </p>
                      <p className="text-sm">
                        {templateData.fleet_size_min && `Minimum: ${templateData.fleet_size_min}`}
                        {templateData.fleet_size_min && templateData.fleet_size_max && ' • '}
                        {templateData.fleet_size_max && `Maximum: ${templateData.fleet_size_max}`}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conditions Tab */}
          <TabsContent value="conditions" className="space-y-2">
            {templateData.conditions.map((condition) => (
              <Card key={condition.id}>
                <CardContent className="p-2 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {condition.condition_type.replace('_', ' ')}
                        </Badge>
                        {condition.is_required && (
                          <Badge variant="destructive">Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {condition.description}
                      </p>
                    </div>
                    <CheckCircle2
                      className={`h-5 w-5 ${condition.is_required ? 'text-destructive' : 'text-muted-foreground'}`}
                    />
                  </div>

                  {Object.keys(condition.parameters).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Parameters
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(condition.parameters).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-muted-foreground capitalize">
                                {key.replace('_', ' ')}
                              </p>
                              <p className="text-sm font-medium">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-2">
            {templateData.actions.map((action) => (
              <Card key={action.id}>
                <CardContent className="p-2 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {action.action_type.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getSeverityColor(action.severity)}>
                          {action.severity}
                        </Badge>
                        {action.automated && (
                          <Badge variant="secondary" className="gap-1">
                            <Zap className="h-3 w-3" />
                            Automated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </div>

                  {Object.keys(action.parameters).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Configuration
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(action.parameters).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-xs text-muted-foreground capitalize">
                                {key.replace('_', ' ')}
                              </p>
                              <p className="text-sm font-medium">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Sample Violations Tab */}
          <TabsContent value="samples" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Sample Violation Scenarios</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Examples of violations this policy will detect and enforce
                </p>
              </CardHeader>
            </Card>

            {sampleViolations.map((violation) => (
              <Card key={violation.id}>
                <CardContent className="p-2 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                    {violation.frequency ? (
                      <span className={`text-xs px-2 py-1 rounded-full ${getFrequencyColor(violation.frequency)}`}>
                        {violation.frequency}
                      </span>
                    ) : null}
                  </div>
                      <p className="font-medium">{violation.scenario}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {violation.description}
                      </p>
                    </div>
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        violation.severity === 'critical'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Implementation Tab */}
          <TabsContent value="implementation" className="space-y-2">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Requirements</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Steps needed to deploy this policy in your fleet
                </p>
              </CardHeader>
            </Card>

            {implementationRequirements.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-2 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="capitalize">
                          {req.requirement_type}
                        </Badge>
                        <Badge variant={getPriorityColor(req.priority)}>
                          {req.priority}
                        </Badge>
                        {req.estimated_time && (
                          <span className="text-xs text-muted-foreground">
                            Est. {req.estimated_time}
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{req.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{req.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="p-2">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium">Ready to implement?</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Use Template" to create a policy from this template. You'll be able
                      to customize conditions and actions before activation.
                    </p>
                    <Button onClick={handleUseTemplate} disabled={isLoading} className="mt-2">
                      <Copy className="h-4 w-4 mr-2" />
                      {isLoading ? 'Creating Policy...' : 'Use This Template'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DrilldownContent>
  )
}
