// Advanced Workflow Engine for Document Management
// Intelligent routing, approval chains, and automated workflows

import { getAIService } from '../api-bus/ai-service'

import { Document, DocumentApproval } from './types'

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  triggerConditions: WorkflowTrigger[]
  steps: WorkflowStep[]
  enabled: boolean
  priority: number
}

export interface WorkflowTrigger {
  type: 'document-upload' | 'status-change' | 'category-match' | 'content-match' | 'metadata-match' | 'schedule'
  condition: any
}

export interface WorkflowStep {
  id: string
  type: 'approval' | 'notification' | 'routing' | 'transformation' | 'ai-analysis' | 'integration'
  config: any
  requiredApprovals?: number
  approvers?: string[]
  timeoutMinutes?: number
  onApprove?: WorkflowAction[]
  onReject?: WorkflowAction[]
  onTimeout?: WorkflowAction[]
}

export interface WorkflowAction {
  type: 'update-status' | 'send-notification' | 'route-to-user' | 'generate-report' | 'trigger-webhook'
  params: any
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  documentId: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed' | 'cancelled'
  currentStep: number
  startedAt: string
  completedAt?: string
  executionLog: WorkflowLogEntry[]
}

export interface WorkflowLogEntry {
  timestamp: string
  stepId: string
  action: string
  result: 'success' | 'failure' | 'pending'
  message: string
  data?: any
}

/**
 * Advanced Workflow Engine
 * Handles intelligent document routing, approval chains, and automation
 */
export class WorkflowEngine {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()

  constructor() {
    this.initializeDefaultWorkflows()
  }

  /**
   * Initialize default workflow templates
   */
  private initializeDefaultWorkflows(): void {
    // Compliance Document Approval Workflow
    const complianceWorkflow: WorkflowDefinition = {
      id: 'compliance-approval',
      name: 'Compliance Document Approval',
      description: 'Multi-level approval for compliance documents',
      triggerConditions: [
        {
          type: 'category-match',
          condition: { categories: ['compliance-documents', 'policies', 'permits-licenses'] }
        }
      ],
      steps: [
        {
          id: 'legal-review',
          type: 'approval',
          config: { title: 'Legal Review', description: 'Legal department review required' },
          requiredApprovals: 1,
          approvers: ['legal-team'],
          timeoutMinutes: 2880, // 48 hours
          onApprove: [{ type: 'update-status', params: { status: 'legal-approved' } }],
          onReject: [{ type: 'update-status', params: { status: 'rejected' } }]
        },
        {
          id: 'compliance-review',
          type: 'approval',
          config: { title: 'Compliance Review', description: 'Compliance officer review' },
          requiredApprovals: 1,
          approvers: ['compliance-officer'],
          timeoutMinutes: 1440, // 24 hours
          onApprove: [{ type: 'update-status', params: { status: 'approved' } }],
          onReject: [{ type: 'update-status', params: { status: 'rejected' } }]
        },
        {
          id: 'publish',
          type: 'notification',
          config: {
            recipients: ['all-users'],
            template: 'new-compliance-document',
            subject: 'New Compliance Document Published'
          }
        }
      ],
      enabled: true,
      priority: 10
    }

    // Financial Document Workflow
    const financialWorkflow: WorkflowDefinition = {
      id: 'financial-approval',
      name: 'Financial Document Approval',
      description: 'Automated approval based on document amount',
      triggerConditions: [
        {
          type: 'category-match',
          condition: { categories: ['financial-documents', 'invoices'] }
        }
      ],
      steps: [
        {
          id: 'ai-extraction',
          type: 'ai-analysis',
          config: {
            extractFields: ['total-amount', 'vendor', 'invoice-number', 'due-date'],
            validateFields: true
          }
        },
        {
          id: 'amount-routing',
          type: 'routing',
          config: {
            rules: [
              { condition: 'amount < 1000', route: 'manager-approval' },
              { condition: 'amount >= 1000 && amount < 10000', route: 'director-approval' },
              { condition: 'amount >= 10000', route: 'cfo-approval' }
            ]
          }
        },
        {
          id: 'approval',
          type: 'approval',
          config: { title: 'Financial Approval', description: 'Approve invoice payment' },
          requiredApprovals: 1,
          timeoutMinutes: 720 // 12 hours
        },
        {
          id: 'integration',
          type: 'integration',
          config: {
            system: 'accounting',
            action: 'create-payable',
            mapping: { invoice: 'document', amount: 'extracted.total-amount' }
          }
        }
      ],
      enabled: true,
      priority: 8
    }

    // Incident Report Workflow
    const incidentWorkflow: WorkflowDefinition = {
      id: 'incident-report',
      name: 'Incident Report Processing',
      description: 'Automated incident report handling with AI triage',
      triggerConditions: [
        {
          type: 'category-match',
          condition: { categories: ['incident-reports'] }
        }
      ],
      steps: [
        {
          id: 'ai-severity-analysis',
          type: 'ai-analysis',
          config: {
            analyze: ['severity', 'injury-type', 'required-actions', 'involved-parties'],
            generateReport: true
          }
        },
        {
          id: 'severity-routing',
          type: 'routing',
          config: {
            rules: [
              { condition: 'severity == "critical"', route: 'immediate-escalation' },
              { condition: 'severity == "high"', route: 'urgent-review' },
              { condition: 'severity == "medium" || severity == "low"', route: 'standard-review' }
            ]
          }
        },
        {
          id: 'safety-review',
          type: 'approval',
          config: { title: 'Safety Officer Review', description: 'Review incident details' },
          approvers: ['safety-officer'],
          timeoutMinutes: 240 // 4 hours for critical incidents
        },
        {
          id: 'corrective-actions',
          type: 'notification',
          config: {
            recipients: ['maintenance-team', 'safety-team'],
            template: 'corrective-actions-required',
            includeAIRecommendations: true
          }
        }
      ],
      enabled: true,
      priority: 10
    }

    // Maintenance Record Workflow
    const maintenanceWorkflow: WorkflowDefinition = {
      id: 'maintenance-record',
      name: 'Maintenance Record Processing',
      description: 'Automated maintenance documentation and scheduling',
      triggerConditions: [
        {
          type: 'category-match',
          condition: { categories: ['maintenance-records'] }
        }
      ],
      steps: [
        {
          id: 'ocr-extraction',
          type: 'ai-analysis',
          config: {
            extractFields: ['vehicle-id', 'service-date', 'mileage', 'work-performed', 'parts-used', 'cost'],
            updateVehicleRecords: true
          }
        },
        {
          id: 'compliance-check',
          type: 'ai-analysis',
          config: {
            checkCompliance: ['DOT-regulations', 'manufacturer-schedule', 'company-policy'],
            flagViolations: true
          }
        },
        {
          id: 'predictive-maintenance',
          type: 'ai-analysis',
          config: {
            predictNextService: true,
            recommendPreventive: true,
            analyzePatterns: true
          }
        },
        {
          id: 'auto-schedule',
          type: 'integration',
          config: {
            system: 'maintenance-scheduler',
            action: 'create-next-service',
            useAIPredictions: true
          }
        }
      ],
      enabled: true,
      priority: 7
    }

    // Contract Workflow
    const contractWorkflow: WorkflowDefinition = {
      id: 'contract-review',
      name: 'Contract Review and Approval',
      description: 'Multi-stage contract review with AI risk analysis',
      triggerConditions: [
        {
          type: 'category-match',
          condition: { categories: ['contracts'] }
        }
      ],
      steps: [
        {
          id: 'ai-contract-analysis',
          type: 'ai-analysis',
          config: {
            extractTerms: true,
            identifyRisks: true,
            compareToStandard: true,
            flagUnusualClauses: true,
            extractKeyDates: true
          }
        },
        {
          id: 'legal-review',
          type: 'approval',
          config: { title: 'Legal Review', description: 'Contract terms review' },
          approvers: ['legal-team'],
          requiredApprovals: 1,
          timeoutMinutes: 2880
        },
        {
          id: 'financial-review',
          type: 'approval',
          config: { title: 'Financial Review', description: 'Budget and terms review' },
          approvers: ['finance-team'],
          requiredApprovals: 1,
          timeoutMinutes: 1440
        },
        {
          id: 'executive-approval',
          type: 'approval',
          config: { title: 'Executive Approval', description: 'Final contract approval' },
          approvers: ['executives'],
          requiredApprovals: 1,
          timeoutMinutes: 2880
        },
        {
          id: 'contract-management',
          type: 'integration',
          config: {
            system: 'contract-management',
            action: 'register-contract',
            setReminders: true,
            trackRenewals: true
          }
        }
      ],
      enabled: true,
      priority: 9
    }

    // Store workflows
    this.workflows.set(complianceWorkflow.id, complianceWorkflow)
    this.workflows.set(financialWorkflow.id, financialWorkflow)
    this.workflows.set(incidentWorkflow.id, incidentWorkflow)
    this.workflows.set(maintenanceWorkflow.id, maintenanceWorkflow)
    this.workflows.set(contractWorkflow.id, contractWorkflow)
  }

  /**
   * Trigger workflows for a document
   */
  async triggerWorkflows(document: Document): Promise<WorkflowExecution[]> {
    const matchingWorkflows = this.findMatchingWorkflows(document)
    const executions: WorkflowExecution[] = []

    for (const workflow of matchingWorkflows) {
      const execution = await this.startWorkflow(workflow, document)
      executions.push(execution)
    }

    return executions
  }

  /**
   * Find workflows that match document triggers
   */
  private findMatchingWorkflows(document: Document): WorkflowDefinition[] {
    const matching: WorkflowDefinition[] = []

    for (const workflow of this.workflows.values()) {
      if (!workflow.enabled) continue

      for (const trigger of workflow.triggerConditions) {
        if (this.evaluateTrigger(trigger, document)) {
          matching.push(workflow)
          break
        }
      }
    }

    // Sort by priority (higher first)
    return matching.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Evaluate if trigger matches document
   */
  private evaluateTrigger(trigger: WorkflowTrigger, document: Document): boolean {
    switch (trigger.type) {
      case 'category-match':
        return trigger.condition.categories.includes(document.category)

      case 'status-change':
        return document.status === trigger.condition.status

      case 'content-match':
        const content = document.extractedText || ''
        return new RegExp(trigger.condition.pattern, 'i').test(content)

      case 'metadata-match':
        // Check if document metadata matches trigger conditions
        return this.matchesMetadata(document.metadata, trigger.condition)

      default:
        return false
    }
  }

  /**
   * Start workflow execution
   */
  private async startWorkflow(
    workflow: WorkflowDefinition,
    document: Document
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      documentId: document.id,
      status: 'in-progress',
      currentStep: 0,
      startedAt: new Date().toISOString(),
      executionLog: [
        {
          timestamp: new Date().toISOString(),
          stepId: 'start',
          action: 'Workflow started',
          result: 'success',
          message: `Started workflow: ${workflow.name}`
        }
      ]
    }

    this.executions.set(execution.id, execution)

    // Execute first step
    await this.executeNextStep(execution, workflow, document)

    return execution
  }

  /**
   * Execute next workflow step
   */
  private async executeNextStep(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    document: Document
  ): Promise<void> {
    if (execution.currentStep >= workflow.steps.length) {
      // Workflow complete
      execution.status = 'completed'
      execution.completedAt = new Date().toISOString()
      execution.executionLog.push({
        timestamp: new Date().toISOString(),
        stepId: 'complete',
        action: 'Workflow completed',
        result: 'success',
        message: 'All steps completed successfully'
      })
      return
    }

    const step = workflow.steps[execution.currentStep]

    try {
      await this.executeStep(step, execution, document)

      execution.currentStep++

      // Continue to next step if not waiting for approval
      if (step.type !== 'approval') {
        await this.executeNextStep(execution, workflow, document)
      }

    } catch (error) {
      execution.status = 'failed'
      execution.executionLog.push({
        timestamp: new Date().toISOString(),
        stepId: step.id,
        action: 'Step execution failed',
        result: 'failure',
        message: (error as Error).message
      })
    }
  }

  /**
   * Execute a workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
    document: Document
  ): Promise<void> {
    execution.executionLog.push({
      timestamp: new Date().toISOString(),
      stepId: step.id,
      action: `Executing step: ${step.type}`,
      result: 'pending',
      message: JSON.stringify(step.config)
    })

    switch (step.type) {
      case 'ai-analysis':
        await this.executeAIAnalysis(step, document)
        break

      case 'approval':
        await this.executeApproval(step, document)
        break

      case 'routing':
        await this.executeRouting(step, document)
        break

      case 'notification':
        await this.executeNotification(step, document)
        break

      case 'integration':
        await this.executeIntegration(step, document)
        break

      case 'transformation':
        await this.executeTransformation(step, document)
        break
    }

    execution.executionLog.push({
      timestamp: new Date().toISOString(),
      stepId: step.id,
      action: `Completed step: ${step.type}`,
      result: 'success',
      message: 'Step executed successfully'
    })
  }

  /**
   * Execute AI analysis step
   */
  private async executeAIAnalysis(step: WorkflowStep, document: Document): Promise<void> {
    const aiService = getAIService()
    const config = step.config

    if (config.extractFields) {
      // Extract structured data using AI
      const prompt = `Extract the following fields from this document: ${config.extractFields.join(', ')}

Document content:
${document.extractedText?.substring(0, 4000) || 'No text extracted'}

Return as JSON object with field names as keys.`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: prompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.1
      })

      const content = response.choices[0]?.message?.content || '{}'
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0])
        // Store extracted data in document metadata
        document.metadata = { ...document.metadata, extracted }
      }
    }

    if (config.analyze) {
      // Perform analysis
      const analysisPrompt = `Analyze this document for: ${config.analyze.join(', ')}

${document.extractedText?.substring(0, 6000) || ''}`

      const response = await aiService.chat({
        messages: [{ role: 'user', content: analysisPrompt }],
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.3
      })

      document.metadata = {
        ...document.metadata,
        analysis: response.choices[0]?.message?.content || ''
      }
    }
  }

  /**
   * Execute approval step
   */
  private async executeApproval(step: WorkflowStep, document: Document): Promise<void> {
    // Create approval request
    const approval: DocumentApproval = {
      id: `approval-${Date.now()}`,
      approverId: step.approvers?.[0] || 'unknown',
      approverName: 'Pending',
      approverRole: step.config.title,
      status: 'pending',
      requiredBy: step.timeoutMinutes
        ? new Date(Date.now() + step.timeoutMinutes * 60000).toISOString()
        : undefined
    }

    if (!document.approvals) document.approvals = []
    document.approvals.push(approval)

    // In production, this would send notifications to approvers
    console.log(`[Workflow] Approval request created for ${step.config.title}`)
  }

  /**
   * Execute routing step
   */
  private async executeRouting(step: WorkflowStep, document: Document): Promise<void> {
    const rules = step.config.rules || []

    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition, document)) {
        // Route to specified destination
        console.log(`[Workflow] Routing document to: ${rule.route}`)
        document.metadata = {
          ...document.metadata,
          routedTo: rule.route
        }
        break
      }
    }
  }

  /**
   * Execute notification step
   */
  private async executeNotification(step: WorkflowStep, document: Document): Promise<void> {
    // In production, send actual notifications (email, SMS, push)
    console.log(`[Workflow] Sending notification: ${step.config.subject}`)
    console.log(`[Workflow] Recipients: ${step.config.recipients.join(', ')}`)
  }

  /**
   * Execute integration step
   */
  private async executeIntegration(step: WorkflowStep, document: Document): Promise<void> {
    // In production, integrate with external systems
    console.log(`[Workflow] Integration with ${step.config.system}: ${step.config.action}`)
  }

  /**
   * Execute transformation step
   */
  private async executeTransformation(step: WorkflowStep, document: Document): Promise<void> {
    // Transform document (convert format, merge, split, etc.)
    console.log(`[Workflow] Transforming document: ${step.config.transformation}`)
  }

  /**
   * Helper methods
   */
  private matchesMetadata(metadata: any, condition: any): boolean {
    for (const [key, value] of Object.entries(condition)) {
      if (metadata[key] !== value) return false
    }
    return true
  }

  private evaluateCondition(condition: string, document: Document): boolean {
    // Simple condition evaluation (in production, use a proper expression evaluator)
    try {
      const amount = document.metadata?.extracted?.['total-amount'] || 0
      const severity = document.metadata?.analysis?.severity || 'low'

      return eval(condition.replace(/amount/g, amount.toString()).replace(/severity/g, `"${severity}"`))
    } catch {
      return false
    }
  }

  /**
   * Get workflow execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  /**
   * Get all workflows
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  /**
   * Get workflow by ID
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId)
  }
}

// Singleton instance
let workflowEngineInstance: WorkflowEngine | null = null

export function getWorkflowEngine(): WorkflowEngine {
  if (!workflowEngineInstance) {
    workflowEngineInstance = new WorkflowEngine()
  }
  return workflowEngineInstance
}
