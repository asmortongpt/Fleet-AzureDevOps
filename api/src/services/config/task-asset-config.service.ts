/**
 * Task and Asset Management Configuration Service
 * Provides flexible, customizable configuration for workflows, rules, and automation
 *
 * Features:
 * - Workflow templates and customization
 * - Business rules engine
 * - Automation triggers
 * - SLA configuration
 * - Custom fields and metadata
 * - Integration settings
 */

import pool from '../../config/database'
import { buildUpdateClause } from '../../utils/sql-safety'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  triggerType: 'manual' | 'automatic' | 'scheduled'
  triggerConditions?: any
  steps: WorkflowStep[]
  isActive: boolean
}

export interface WorkflowStep {
  id: string
  stepNumber: number
  name: string
  action: string
  parameters: Record<string, any>
  assignTo?: 'creator' | 'manager' | 'specific_user' | 'ai_suggest'
  specificUserId?: string
  approvalRequired?: boolean
  slaHours?: number
}

export interface BusinessRule {
  id: string
  name: string
  description: string
  entity: 'task' | 'asset'
  triggerEvent: string
  conditions: RuleCondition[]
  actions: RuleAction[]
  priority: number
  isActive: boolean
}

export interface RuleCondition {
  field: string
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'in' | 'not_in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface RuleAction {
  type: 'set_field' | 'send_notification' | 'create_task' | 'escalate' | 'webhook' | 'ai_action'
  parameters: Record<string, any>
}

export interface SLAConfig {
  id: string
  name: string
  entity: 'task' | 'asset'
  criteria: Record<string, any>
  responseTimeHours: number
  resolutionTimeHours: number
  escalationPath: string[]
  isActive: boolean
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  triggerType: 'field_change' | 'time_based' | 'condition_met' | 'external_event'
  triggerConfig: any
  conditions: RuleCondition[]
  actions: RuleAction[]
  isActive: boolean
  runOnce: boolean
}

/**
 * Configuration Manager Class
 */
export class TaskAssetConfigManager {
  private tenantId: string

  constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  /**
   * Get all workflow templates for tenant
   */
  async getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
    const result = await pool.query(
      `SELECT * FROM workflow_templates WHERE tenant_id = $1 OR tenant_id IS NULL ORDER BY name`,
      [this.tenantId]
    )
    return result.rows
  }

  /**
   * Create or update workflow template
   */
  async saveWorkflowTemplate(template: Partial<WorkflowTemplate>): Promise<WorkflowTemplate> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      if (template.id) {
        // Update existing
        const result = await client.query(
          `UPDATE workflow_templates
           SET name = $1, description = $2, trigger_type = $3,
               trigger_conditions = $4, steps = $5, is_active = $6, updated_at = NOW()
           WHERE id = $7 AND tenant_id = $8
           RETURNING *`,
          [
            template.name,
            template.description,
            template.triggerType,
            JSON.stringify(template.triggerConditions),
            JSON.stringify(template.steps),
            template.isActive,
            template.id,
            this.tenantId
          ]
        )
        await client.query('COMMIT')
        return result.rows[0]
      } else {
        // Create new
        const result = await client.query(
          `INSERT INTO workflow_templates
           (tenant_id, name, description, trigger_type, trigger_conditions, steps, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            this.tenantId,
            template.name,
            template.description,
            template.triggerType,
            JSON.stringify(template.triggerConditions),
            JSON.stringify(template.steps),
            template.isActive ?? true
          ]
        )
        await client.query('COMMIT')
        return result.rows[0]
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get all business rules
   */
  async getBusinessRules(entity?: 'task' | 'asset'): Promise<BusinessRule[]> {
    let query = `SELECT * FROM business_rules WHERE tenant_id = $1`
    const params: any[] = [this.tenantId]

    if (entity) {
      query += ` AND entity = $2`
      params.push(entity)
    }

    query += ` ORDER BY priority DESC, name`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Create or update business rule
   */
  async saveBusinessRule(rule: Partial<BusinessRule>): Promise<BusinessRule> {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      if (rule.id) {
        // Update existing
        const result = await client.query(
          `UPDATE business_rules
           SET name = $1, description = $2, entity = $3, trigger_event = $4,
               conditions = $5, actions = $6, priority = $7, is_active = $8, updated_at = NOW()
           WHERE id = $9 AND tenant_id = $10
           RETURNING *`,
          [
            rule.name,
            rule.description,
            rule.entity,
            rule.triggerEvent,
            JSON.stringify(rule.conditions),
            JSON.stringify(rule.actions),
            rule.priority,
            rule.isActive,
            rule.id,
            this.tenantId
          ]
        )
        await client.query('COMMIT')
        return result.rows[0]
      } else {
        // Create new
        const result = await client.query(
          `INSERT INTO business_rules
           (tenant_id, name, description, entity, trigger_event, conditions, actions, priority, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [
            this.tenantId,
            rule.name,
            rule.description,
            rule.entity,
            rule.triggerEvent,
            JSON.stringify(rule.conditions),
            JSON.stringify(rule.actions),
            rule.priority || 100,
            rule.isActive ?? true
          ]
        )
        await client.query('COMMIT')
        return result.rows[0]
      }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Evaluate business rules for an entity
   */
  async evaluateRules(
    entity: 'task' | 'asset',
    triggerEvent: string,
    data: Record<string, any>
  ): Promise<RuleAction[]> {
    const rules = await this.getBusinessRules(entity)
    const applicableRules = rules.filter(
      r => r.is_active && r.trigger_event === triggerEvent
    )

    const actionsToExecute: RuleAction[] = []

    for (const rule of applicableRules) {
      if (this.evaluateConditions(rule.conditions, data)) {
        actionsToExecute.push(...rule.actions)
      }
    }

    return actionsToExecute
  }

  /**
   * Evaluate conditions for a rule
   */
  private evaluateConditions(conditions: RuleCondition[], data: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true

    let result = true
    let currentOperator: 'AND' | 'OR' = 'AND'

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field)
      const conditionMet = this.evaluateCondition(condition, fieldValue)

      if (currentOperator === 'AND') {
        result = result && conditionMet
      } else {
        result = result || conditionMet
      }

      currentOperator = condition.logicalOperator || 'AND'
    }

    return result
  }

  /**
   * Evaluate single condition
   */
  private evaluateCondition(condition: RuleCondition, fieldValue: any): boolean {
    switch (condition.operator) {
      case '=':
        return fieldValue === condition.value
      case '!=':
        return fieldValue !== condition.value
      case '>':
        return fieldValue > condition.value
      case '<':
        return fieldValue < condition.value
      case '>=':
        return fieldValue >= condition.value
      case '<=':
        return fieldValue <= condition.value
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return false
    }
  }

  /**
   * Get nested object value by path
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Execute rule actions
   */
  async executeActions(
    actions: RuleAction[],
    context: { entityType: 'task' | 'asset'; entityId: string; data: any }
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, context)
      } catch (error) {
        console.error('Error executing rule action:', error)
      }
    }
  }

  /**
   * Execute single action
   */
  private async executeAction(
    action: RuleAction,
    context: { entityType: 'task' | 'asset'; entityId: string; data: any }
  ): Promise<void> {
    switch (action.type) {
      case 'set_field':
        await this.setFieldAction(context.entityType, context.entityId, action.parameters)
        break
      case 'send_notification':
        await this.sendNotificationAction(action.parameters, context)
        break
      case 'create_task':
        await this.createTaskAction(action.parameters, context)
        break
      case 'escalate':
        await this.escalateAction(context.entityType, context.entityId, action.parameters)
        break
      case 'webhook':
        await this.webhookAction(action.parameters, context)
        break
      case 'ai_action':
        await this.aiAction(action.parameters, context)
        break
    }
  }

  private async setFieldAction(
    entityType: 'task' | 'asset',
    entityId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const table = entityType === 'task' ? 'tasks' : 'assets'

    // Build safe UPDATE clause with validated column names
    const { fields, values } = buildUpdateClause(parameters, 1)

    await pool.query(
      `UPDATE ${table} SET ${fields}, updated_at = NOW()
       WHERE id = $${values.length + 1}`,
      [...values, entityId]
    )
  }

  private async sendNotificationAction(
    parameters: Record<string, any>,
    context: any
  ): Promise<void> {
    // Implementation for sending notifications
    console.log('Sending notification:', parameters)
  }

  private async createTaskAction(
    parameters: Record<string, any>,
    context: any
  ): Promise<void> {
    await pool.query(
      `INSERT INTO tasks (tenant_id, task_title, description, task_type, priority, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        this.tenantId,
        parameters.title,
        parameters.description,
        parameters.type || 'administrative',
        parameters.priority || 'medium',
        'pending',
        context.data.created_by || context.data.updated_by
      ]
    )
  }

  private async escalateAction(
    entityType: 'task' | 'asset',
    entityId: string,
    parameters: Record<string, any>
  ): Promise<void> {
    // Implementation for escalation logic
    console.log('Escalating:', entityType, entityId, parameters)
  }

  private async webhookAction(
    parameters: Record<string, any>,
    context: any
  ): Promise<void> {
    // Implementation for webhook calls
    console.log('Calling webhook:', parameters.url)
  }

  private async aiAction(
    parameters: Record<string, any>,
    context: any
  ): Promise<void> {
    // Implementation for AI-powered actions
    console.log('Executing AI action:', parameters)
  }

  /**
   * Get SLA configurations
   */
  async getSLAConfigs(entity?: 'task' | 'asset'): Promise<SLAConfig[]> {
    let query = `SELECT * FROM sla_configs WHERE tenant_id = $1`
    const params: any[] = [this.tenantId]

    if (entity) {
      query += ` AND entity = $2`
      params.push(entity)
    }

    query += ` ORDER BY name`

    const result = await pool.query(query, params)
    return result.rows
  }

  /**
   * Get automation rules
   */
  async getAutomationRules(): Promise<AutomationRule[]> {
    const result = await pool.query(
      `SELECT * FROM automation_rules WHERE tenant_id = $1 AND is_active = true ORDER BY name`,
      [this.tenantId]
    )
    return result.rows
  }
}

/**
 * Create configuration tables if they don't exist
 */
export async function createConfigTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS workflow_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      trigger_type VARCHAR(50) NOT NULL,
      trigger_conditions JSONB,
      steps JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS business_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      entity VARCHAR(50) NOT NULL,
      trigger_event VARCHAR(100) NOT NULL,
      conditions JSONB NOT NULL,
      actions JSONB NOT NULL,
      priority INTEGER DEFAULT 100,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sla_configs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      entity VARCHAR(50) NOT NULL,
      criteria JSONB NOT NULL,
      response_time_hours INTEGER NOT NULL,
      resolution_time_hours INTEGER NOT NULL,
      escalation_path JSONB,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      trigger_type VARCHAR(50) NOT NULL,
      trigger_config JSONB,
      conditions JSONB,
      actions JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      run_once BOOLEAN DEFAULT false,
      last_run TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_workflow_templates_tenant ON workflow_templates(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_business_rules_tenant ON business_rules(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sla_configs_tenant ON sla_configs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_automation_rules_tenant ON automation_rules(tenant_id);
  `)
}

export default TaskAssetConfigManager
