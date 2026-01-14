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
import { useState } from 'react'
import { toast } from 'sonner'

import { DrilldownContent } from '@/components/DrilldownPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrilldown } from '@/contexts/DrilldownContext'

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
  sample_violations: SampleViolation[]
  implementation_requirements: ImplementationRequirement[]
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
  frequency: 'rare' | 'occasional' | 'common' | 'frequent'
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

  // Mock data if not provided
  const templateData: PolicyTemplate = template || {
    id: templateId,
    name: 'Speed Limit Enforcement',
    category: 'Fleet Safety',
    type: 'safety',
    description:
      'Automated speed limit monitoring and enforcement policy that tracks vehicle speeds against posted limits and geofenced zones.',
    purpose:
      'Reduce speeding incidents, improve driver safety, lower insurance premiums, and ensure compliance with DOT regulations.',
    priority: 'high',
    enforcement_level: 'mandatory',
    applies_to: 'all',
    industry_vertical: ['Logistics & Transportation', 'Government', 'Healthcare'],
    fleet_size_min: 10,
    conditions: [
      {
        id: '1',
        condition_type: 'speed_threshold',
        description: 'Vehicle speed exceeds posted limit by configurable threshold',
        parameters: { threshold_mph: 10, duration_seconds: 5 },
        is_required: true,
      },
      {
        id: '2',
        condition_type: 'geofence_zone',
        description: 'Applies different thresholds in school zones and residential areas',
        parameters: { zone_types: ['school', 'residential'], threshold_mph: 5 },
        is_required: false,
      },
    ],
    actions: [
      {
        id: '1',
        action_type: 'notification',
        description: 'Send real-time alert to driver via mobile app',
        parameters: { delivery_method: 'push', priority: 'high' },
        severity: 'medium',
        automated: true,
      },
      {
        id: '2',
        action_type: 'escalation',
        description: 'Notify fleet manager if speed exceeds critical threshold',
        parameters: { threshold_mph: 20, notify_roles: ['manager', 'supervisor'] },
        severity: 'high',
        automated: true,
      },
      {
        id: '3',
        action_type: 'documentation',
        description: 'Log violation for driver record and review',
        parameters: { retention_days: 365, include_video: true },
        severity: 'low',
        automated: true,
      },
    ],
    sample_violations: [
      {
        id: '1',
        scenario: 'Highway Speeding',
        description: 'Driver exceeds 70 mph speed limit by 15 mph on interstate',
        severity: 'medium',
        frequency: 'occasional',
      },
      {
        id: '2',
        scenario: 'School Zone Violation',
        description: 'Vehicle travels 35 mph in 15 mph school zone during school hours',
        severity: 'critical',
        frequency: 'rare',
      },
      {
        id: '3',
        scenario: 'Residential Speeding',
        description: 'Consistent speeding in residential neighborhoods',
        severity: 'high',
        frequency: 'common',
      },
    ],
    implementation_requirements: [
      {
        id: '1',
        requirement_type: 'data',
        title: 'Real-time GPS Data',
        description: 'Requires vehicle telematics with GPS and speed data',
        priority: 'required',
        estimated_time: '1 day',
      },
      {
        id: '2',
        requirement_type: 'integration',
        title: 'Speed Limit Database',
        description: 'Integration with HERE or Google Maps for posted speed limits',
        priority: 'required',
        estimated_time: '3 days',
      },
      {
        id: '3',
        requirement_type: 'configuration',
        title: 'Geofence Setup',
        description: 'Define custom geofences for school zones and sensitive areas',
        priority: 'recommended',
        estimated_time: '2 days',
      },
      {
        id: '4',
        requirement_type: 'training',
        title: 'Driver Training',
        description: 'Educate drivers on new policy and mobile alerts',
        priority: 'recommended',
        estimated_time: '1 week',
      },
    ],
    estimated_impact: {
      cost_savings: 25000,
      safety_improvement: 35,
      efficiency_gain: 10,
    },
    compliance_standards: ['DOT', 'FMCSA', 'OSHA'],
    best_practices_source: 'NHTSA Fleet Safety Best Practices 2024',
  }

  const handleUseTemplate = async () => {
    setIsLoading(true)
    try {
      // Simulate API call to create policy from template
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.success(`Policy "${templateData.name}" created successfully!`)
      pop() // Go back to template list
    } catch (error) {
      toast.error('Failed to create policy from template')
      console.error(error)
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

  const getFrequencyColor = (frequency: string) => {
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
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <DrilldownContent loading={false} error={null}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="text-2xl font-bold">{templateData.name}</h3>
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
            <Shield className="h-12 w-12 text-primary" />
            <Button onClick={handleUseTemplate} disabled={isLoading} size="lg">
              <Copy className="h-4 w-4 mr-2" />
              {isLoading ? 'Creating...' : 'Use Template'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Cost Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
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
              <div className="text-2xl font-bold text-blue-800">
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
              <div className="text-2xl font-bold text-purple-600">
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
              <div className="text-2xl font-bold">
                {templateData.implementation_requirements.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {
                  templateData.implementation_requirements.filter((r) => r.priority === 'required')
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
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
          <TabsContent value="conditions" className="space-y-4">
            {templateData.conditions.map((condition) => (
              <Card key={condition.id}>
                <CardContent className="p-4 space-y-3">
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
          <TabsContent value="actions" className="space-y-4">
            {templateData.actions.map((action) => (
              <Card key={action.id}>
                <CardContent className="p-4 space-y-3">
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
          <TabsContent value="samples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sample Violation Scenarios</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Examples of violations this policy will detect and enforce
                </p>
              </CardHeader>
            </Card>

            {templateData.sample_violations.map((violation) => (
              <Card key={violation.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                        <span className={`text-xs px-2 py-1 rounded-full ${getFrequencyColor(violation.frequency)}`}>
                          {violation.frequency}
                        </span>
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
          <TabsContent value="implementation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Requirements</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Steps needed to deploy this policy in your fleet
                </p>
              </CardHeader>
            </Card>

            {templateData.implementation_requirements.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-4 space-y-3">
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
              <CardContent className="p-4">
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
