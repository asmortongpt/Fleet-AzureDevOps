/**
 * Custom Fields Service
 * Allows dynamic field creation for tasks and assets
 *
 * Features:
 * - Create custom fields with various data types
 * - Field validation rules
 * - Conditional field visibility
 * - Field groups and sections
 * - Import/export field definitions
 * - Field templates
 */

import pool from '../../config/database'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'radio'
  | 'url'
  | 'email'
  | 'phone'
  | 'currency'
  | 'percentage'
  | 'file'
  | 'user'
  | 'location'

export interface CustomFieldDefinition {
  id?: string
  tenantId: string
  entityType: 'task' | 'asset'
  fieldName: string
  fieldLabel: string
  fieldType: FieldType
  description?: string
  required: boolean
  defaultValue?: any
  options?: string[] // For select/multi_select/radio
  validation?: {
    min?: number
    max?: number
    pattern?: string
    minLength?: number
    maxLength?: number
    fileTypes?: string[]
    maxFileSize?: number
  }
  conditional?: {
    field: string
    operator: '=' | '!=' | '>' | '<' | 'contains'
    value: any
  }
  groupName?: string
  sortOrder?: number
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface FieldGroup {
  id?: string
  tenantId: string
  entityType: 'task' | 'asset'
  groupName: string
  groupLabel: string
  description?: string
  sortOrder: number
  isCollapsible: boolean
  isCollapsedByDefault: boolean
}

export interface CustomFieldValue {
  fieldId: string
  entityId: string
  value: any
}

export class CustomFieldsService {
  /**
   * Create custom field definition
   */
  async createFieldDefinition(definition: CustomFieldDefinition): Promise<CustomFieldDefinition> {
    const result = await pool.query(
      `INSERT INTO custom_field_definitions
       (tenant_id, entity_type, field_name, field_label, field_type, description, required, default_value, options, validation, conditional, group_name, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        definition.tenantId,
        definition.entityType,
        definition.fieldName,
        definition.fieldLabel,
        definition.fieldType,
        definition.description,
        definition.required,
        definition.defaultValue,
        JSON.stringify(definition.options || []),
        JSON.stringify(definition.validation || {}),
        JSON.stringify(definition.conditional || null),
        definition.groupName,
        definition.sortOrder || 0,
        definition.isActive ?? true
      ]
    )

    return result.rows[0]
  }

  /**
   * Update field definition
   */
  async updateFieldDefinition(fieldId: string, updates: Partial<CustomFieldDefinition>): Promise<CustomFieldDefinition> {
    const setClauses: string[] = []
    const values: any[] = []
    let paramCount = 1

    const allowedUpdates = ['field_label', 'description', 'required', 'default_value', 'options', 'validation', 'conditional', 'group_name', 'sort_order', 'is_active']

    for (const key of allowedUpdates) {
      const snakeKey = key
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())

      if (camelKey in updates) {
        setClauses.push(`${snakeKey} = $${paramCount}`)

        let value = (updates as any)[camelKey]
        if (['options', 'validation', 'conditional'].includes(snakeKey)) {
          value = JSON.stringify(value)
        }
        values.push(value)
        paramCount++
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid updates provided')
    }

    setClauses.push('updated_at = NOW()')
    values.push(fieldId)

    const result = await pool.query(
      `UPDATE custom_field_definitions
       SET ${setClauses.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    )

    return result.rows[0]
  }

  /**
   * Get field definitions for entity type
   */
  async getFieldDefinitions(tenantId: string, entityType: 'task' | 'asset', includeInactive: boolean = false): Promise<CustomFieldDefinition[]> {
    let query = `
      SELECT id, tenant_id, field_name, field_type, required, created_at, updated_at FROM custom_field_definitions
      WHERE tenant_id = $1 AND entity_type = $2
    `

    if (!includeInactive) {
      query += ' AND is_active = true'
    }

    query += ' ORDER BY sort_order ASC, created_at ASC'

    const result = await pool.query(query, [tenantId, entityType])
    return result.rows
  }

  /**
   * Get single field definition
   */
  async getFieldDefinition(fieldId: string): Promise<CustomFieldDefinition | null> {
    const result = await pool.query(
      'SELECT 
      id,
      tenant_id,
      entity_type,
      field_name,
      field_label,
      field_type,
      description,
      required,
      default_value,
      options,
      validation,
      conditional,
      group_name,
      sort_order,
      is_active,
      created_at,
      updated_at FROM custom_field_definitions WHERE id = $1',
      [fieldId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Delete field definition
   */
  async deleteFieldDefinition(fieldId: string): Promise<void> {
    // Soft delete - mark as inactive
    await pool.query(
      'UPDATE custom_field_definitions SET is_active = false, updated_at = NOW() WHERE id = $1',
      [fieldId]
    )
  }

  /**
   * Create field group
   */
  async createFieldGroup(group: FieldGroup): Promise<FieldGroup> {
    const result = await pool.query(
      `INSERT INTO custom_field_groups
       (tenant_id, entity_type, group_name, group_label, description, sort_order, is_collapsible, is_collapsed_by_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        group.tenantId,
        group.entityType,
        group.groupName,
        group.groupLabel,
        group.description,
        group.sortOrder,
        group.isCollapsible ?? true,
        group.isCollapsedByDefault ?? false
      ]
    )

    return result.rows[0]
  }

  /**
   * Get field groups
   */
  async getFieldGroups(tenantId: string, entityType: 'task' | 'asset'): Promise<FieldGroup[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, group_name, created_at, updated_at FROM custom_field_groups
       WHERE tenant_id = $1 AND entity_type = $2
       ORDER BY sort_order ASC`,
      [tenantId, entityType]
    )

    return result.rows
  }

  /**
   * Set custom field value
   */
  async setFieldValue(tenantId: string, fieldId: string, entityType: 'task' | 'asset', entityId: string, value: any): Promise<void> {
    // Get field definition for validation
    const field = await this.getFieldDefinition(fieldId)
    if (!field) {
      throw new Error('Field definition not found')
    }

    // Validate value
    this.validateFieldValue(field, value)

    // Upsert value
    await pool.query(
      `INSERT INTO custom_field_values (tenant_id, field_id, entity_type, entity_id, value)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (field_id, entity_id)
       DO UPDATE SET value = $5, updated_at = NOW()`,
      [tenantId, fieldId, entityType, entityId, JSON.stringify(value)]
    )
  }

  /**
   * Get custom field values for entity
   */
  async getFieldValues(entityType: 'task' | 'asset', entityId: string): Promise<Record<string, any>> {
    const result = await pool.query(
      `SELECT cfd.field_name, cfv.value
       FROM custom_field_values cfv
       JOIN custom_field_definitions cfd ON cfv.field_id = cfd.id
       WHERE cfv.entity_type = $1 AND cfv.entity_id = $2 AND cfd.is_active = true`,
      [entityType, entityId]
    )

    const values: Record<string, any> = {}
    for (const row of result.rows) {
      try {
        values[row.field_name] = JSON.parse(row.value)
      } catch {
        values[row.field_name] = row.value
      }
    }

    return values
  }

  /**
   * Get all custom field values with definitions for entity
   */
  async getFieldValuesWithDefinitions(tenantId: string, entityType: 'task' | 'asset', entityId: string): Promise<Array<CustomFieldDefinition & { value?: any }>> {
    const definitions = await this.getFieldDefinitions(tenantId, entityType)
    const values = await this.getFieldValues(entityType, entityId)

    return definitions.map(def => ({
      ...def,
      value: values[def.fieldName]
    }))
  }

  /**
   * Validate field value against definition
   */
  private validateFieldValue(field: CustomFieldDefinition, value: any): void {
    // Required check
    if (field.required && (value === null || value === undefined || value === '')) {
      throw new Error(`Field "${field.fieldLabel}" is required`)
    }

    // Skip validation if value is empty and not required
    if (!field.required && (value === null || value === undefined || value === '')) {
      return
    }

    const validation = field.validation || {}

    // Type-specific validation
    switch (field.fieldType) {
      case 'number':
      case 'currency':
      case 'percentage':
        if (typeof value !== 'number') {
          throw new Error(`Field "${field.fieldLabel}" must be a number`)
        }
        if (validation.min !== undefined && value < validation.min) {
          throw new Error(`Field "${field.fieldLabel}" must be at least ${validation.min}`)
        }
        if (validation.max !== undefined && value > validation.max) {
          throw new Error(`Field "${field.fieldLabel}" must be at most ${validation.max}`)
        }
        break

      case 'text':
      case 'textarea':
      case 'url':
      case 'email':
      case 'phone':
        if (typeof value !== 'string') {
          throw new Error(`Field "${field.fieldLabel}" must be a string`)
        }
        if (validation.minLength && value.length < validation.minLength) {
          throw new Error(`Field "${field.fieldLabel}" must be at least ${validation.minLength} characters`)
        }
        if (validation.maxLength && value.length > validation.maxLength) {
          throw new Error(`Field "${field.fieldLabel}" must be at most ${validation.maxLength} characters`)
        }
        if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
          throw new Error(`Field "${field.fieldLabel}" has invalid format`)
        }

        // URL validation
        if (field.fieldType === 'url') {
          try {
            new URL(value)
          } catch {
            throw new Error(`Field "${field.fieldLabel}" must be a valid URL`)
          }
        }

        // Email validation
        if (field.fieldType === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            throw new Error(`Field "${field.fieldLabel}" must be a valid email`)
          }
        }
        break

      case 'select':
      case 'radio':
        if (!field.options || !field.options.includes(value)) {
          throw new Error(`Field "${field.fieldLabel}" has invalid option`)
        }
        break

      case 'multi_select':
        if (!Array.isArray(value)) {
          throw new Error(`Field "${field.fieldLabel}" must be an array`)
        }
        if (field.options) {
          for (const v of value) {
            if (!field.options.includes(v)) {
              throw new Error(`Field "${field.fieldLabel}" has invalid option: ${v}`)
            }
          }
        }
        break

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && !Date.parse(value)) {
          throw new Error(`Field "${field.fieldLabel}" must be a valid date`)
        }
        break

      case 'checkbox':
        if (typeof value !== 'boolean') {
          throw new Error(`Field "${field.fieldLabel}" must be a boolean`)
        }
        break
    }
  }

  /**
   * Export field definitions as JSON
   */
  async exportFieldDefinitions(tenantId: string, entityType: 'task' | 'asset'): Promise<string> {
    const definitions = await this.getFieldDefinitions(tenantId, entityType, true)
    const groups = await this.getFieldGroups(tenantId, entityType)

    return JSON.stringify({
      version: '1.0',
      entityType,
      groups,
      fields: definitions
    }, null, 2)
  }

  /**
   * Import field definitions from JSON
   */
  async importFieldDefinitions(tenantId: string, jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)

    // Import groups first
    if (data.groups) {
      for (const group of data.groups) {
        await this.createFieldGroup({
          ...group,
          tenantId,
          id: undefined // Generate new IDs
        })
      }
    }

    // Import fields
    if (data.fields) {
      for (const field of data.fields) {
        await this.createFieldDefinition({
          ...field,
          tenantId,
          id: undefined // Generate new IDs
        })
      }
    }
  }

  /**
   * Clone field definitions from one entity type to another
   */
  async cloneFieldDefinitions(tenantId: string, fromType: 'task' | 'asset', toType: 'task' | 'asset'): Promise<void> {
    const fields = await this.getFieldDefinitions(tenantId, fromType)

    for (const field of fields) {
      await this.createFieldDefinition({
        ...field,
        entityType: toType,
        id: undefined
      })
    }
  }

  /**
   * Search entities by custom field value
   */
  async searchByCustomField(tenantId: string, entityType: 'task' | 'asset', fieldName: string, value: any): Promise<string[]> {
    const result = await pool.query(
      `SELECT cfv.entity_id
       FROM custom_field_values cfv
       JOIN custom_field_definitions cfd ON cfv.field_id = cfd.id
       WHERE cfv.tenant_id = $1
         AND cfv.entity_type = $2
         AND cfd.field_name = $3
         AND cfv.value::text LIKE $4`,
      [tenantId, entityType, fieldName, `%${value}%`]
    )

    return result.rows.map(r => r.entity_id)
  }

  /**
   * Get field statistics
   */
  async getFieldStatistics(fieldId: string): Promise<any> {
    const field = await this.getFieldDefinition(fieldId)
    if (!field) return null

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_values,
         COUNT(DISTINCT entity_id) as unique_entities,
         COUNT(CASE WHEN value IS NULL OR value = 'null' THEN 1 END) as null_count
       FROM custom_field_values
       WHERE field_id = $1',
      [fieldId]
    )

    const stats = result.rows[0]

    // For select/multi_select, get value distribution
    if (['select', 'multi_select', 'radio'].includes(field.fieldType)) {
      const distResult = await pool.query(
        `SELECT value, COUNT(*) as count
         FROM custom_field_values
         WHERE field_id = $1
         GROUP BY value
         ORDER BY count DESC`,
        [fieldId]
      )

      stats.value_distribution = distResult.rows
    }

    // For number fields, get min/max/avg
    if (['number', 'currency', 'percentage'].includes(field.fieldType)) {
      const numResult = await pool.query(
        `SELECT
           MIN(CAST(value AS NUMERIC)) as min_value,
           MAX(CAST(value AS NUMERIC)) as max_value,
           AVG(CAST(value AS NUMERIC)) as avg_value
         FROM custom_field_values
         WHERE field_id = $1 AND value IS NOT NULL`,
        [fieldId]
      )

      Object.assign(stats, numResult.rows[0])
    }

    return stats
  }
}

// Global instance
export const customFieldsService = new CustomFieldsService()

export default customFieldsService
