/**
 * Permission Engine
 * Core RBAC engine with field-level redaction and condition evaluation
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  User,
  UserRole,
  PermissionCheckResult,
  PermissionConfig,
  ModuleConfig,
  ActionConfig,
  FieldConfig,
  FieldVisibilityRule,
  VisibleModulesResult,
  FieldFilterResult,
  PermissionContext,
  IPermissionEngine
} from './types';

export class PermissionEngine implements IPermissionEngine {
  private config: PermissionConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load permission configuration from JSON files
   */
  private loadConfig(): PermissionConfig {
    const configPath = join(__dirname, 'config');

    const modules = JSON.parse(
      readFileSync(join(configPath, 'modules.json'), 'utf-8')
    );

    const actions = JSON.parse(
      readFileSync(join(configPath, 'actions.json'), 'utf-8')
    );

    const fields = JSON.parse(
      readFileSync(join(configPath, 'fields.json'), 'utf-8')
    );

    return { modules, actions, fields };
  }

  /**
   * Check if user can perform an action
   * Supports multi-role users (union of permissions)
   */
  async can(
    user: User,
    action: string,
    resource?: any,
    context?: any
  ): Promise<PermissionCheckResult> {
    // Admin always has full access
    if (user.roles.includes('Admin')) {
      return { allowed: true, reason: 'Admin role has full access' };
    }

    const actionConfig = this.config.actions[action];

    if (!actionConfig) {
      return { allowed: false, reason: `Unknown action: ${action}` };
    }

    // Check if user has any role that allows this action
    const hasRole = user.roles.some(role => actionConfig.roles.includes(role));

    if (!hasRole) {
      return {
        allowed: false,
        reason: `User roles [${user.roles.join(', ')}] not authorized for action: ${action}`
      };
    }

    // Evaluate conditions
    if (actionConfig.conditions && actionConfig.conditions.length > 0) {
      const conditionResults = await this.evaluateConditions(
        actionConfig.conditions,
        { user, resource, resourceType: context?.resourceType, action }
      );

      if (!conditionResults.passed) {
        return {
          allowed: false,
          reason: `Condition failed: ${conditionResults.failedCondition}`,
          conditions: actionConfig.conditions
        };
      }
    }

    return { allowed: true, reason: 'Permission granted' };
  }

  /**
   * Get list of modules visible to user
   */
  async visibleModules(user: User): Promise<VisibleModulesResult> {
    const modules: string[] = [];
    const moduleConfigs: Record<string, ModuleConfig> = {};

    for (const [moduleName, moduleConfig] of Object.entries(this.config.modules)) {
      // Admin sees everything
      if (user.roles.includes('Admin')) {
        modules.push(moduleName);
        moduleConfigs[moduleName] = moduleConfig;
        continue;
      }

      // Check if user has any role that grants access to this module
      const hasAccess = user.roles.some(role => moduleConfig.roles.includes(role));

      if (hasAccess) {
        modules.push(moduleName);
        moduleConfigs[moduleName] = moduleConfig;
      }
    }

    return { modules, moduleConfigs };
  }

  /**
   * Apply record-level filters based on user role and org
   */
  async applyRecordFilter(
    query: any,
    user: User,
    resourceType: string
  ): Promise<any> {
    // Admin sees everything in their org (or all orgs if super admin)
    if (user.roles.includes('Admin')) {
      // Only filter by org if user has org_id
      if (user.org_id) {
        query.org_id = user.org_id;
      }
      return query;
    }

    // Base filter: user's organization
    const filters: any = {
      ...query,
      org_id: user.org_id
    };

    // Role-specific filters
    if (user.roles.includes('Driver')) {
      // Drivers see only assigned vehicles/records
      filters.assigned_user_id = user.id;
    }

    if (user.roles.includes('Inspector') && resourceType === 'inspection') {
      // Inspectors see inspections in their depot or created by them
      filters.$or = [
        { created_by: user.id },
        { depot_id: user.depot_id }
      ];
    }

    if (user.roles.includes('Vendor') && resourceType === 'inspection') {
      // Vendors see only assigned work
      filters.assigned_vendor_id = user.id;
    }

    if (user.roles.includes('MaintenanceManager') && resourceType === 'maintenance') {
      // Maintenance managers see records in their depot
      if (user.depot_id) {
        filters.depot_id = user.depot_id;
      }
    }

    return filters;
  }

  /**
   * Filter fields based on user role (field-level redaction)
   */
  async filterFields(
    user: User,
    resourceType: string,
    payload: any
  ): Promise<FieldFilterResult> {
    const fieldConfig = this.config.fields[resourceType];

    if (!fieldConfig) {
      // No field config = return as-is
      return {
        filteredData: payload,
        redactedFields: [],
        anonymizedFields: []
      };
    }

    // Admin sees everything
    if (user.roles.includes('Admin')) {
      return {
        filteredData: payload,
        redactedFields: [],
        anonymizedFields: []
      };
    }

    const filteredData: any = Array.isArray(payload) ? [] : {};
    const redactedFields: string[] = [];
    const anonymizedFields: string[] = [];

    const processItem = (item: any): any => {
      const result: any = {};

      // Always include always_visible fields
      if (fieldConfig.always_visible) {
        for (const field of fieldConfig.always_visible) {
          if (field in item) {
            result[field] = item[field];
          }
        }
      }

      // Process each field in the item
      for (const [fieldName, value] of Object.entries(item)) {
        // Skip if already added via always_visible
        if (fieldConfig.always_visible?.includes(fieldName)) {
          continue;
        }

        const rule = fieldConfig[fieldName] as FieldVisibilityRule | undefined;

        if (!rule) {
          // No rule = include field
          result[fieldName] = value;
          continue;
        }

        // Check if user's roles grant access
        const hasRole = rule.roles && user.roles.some(role => rule.roles!.includes(role));

        if (hasRole) {
          result[fieldName] = value;
          continue;
        }

        // Check if user should see summary
        const canSeeSummary = rule.summary_for && user.roles.some(role => rule.summary_for!.includes(role));

        if (canSeeSummary) {
          result[fieldName] = this.summarizeField(fieldName, value);
          continue;
        }

        // Check if field should be anonymized
        const shouldAnonymize = rule.anonymize_for && user.roles.some(role => rule.anonymize_for!.includes(role));

        if (shouldAnonymize) {
          result[fieldName] = this.anonymizeField(fieldName, value);
          anonymizedFields.push(fieldName);
          continue;
        }

        // Otherwise, redact the field
        if (rule.redact_for_others || (rule.redact_for && user.roles.some(role => rule.redact_for!.includes(role)))) {
          redactedFields.push(fieldName);
          // Don't include in result
        } else {
          // No specific redaction rule, include field
          result[fieldName] = value;
        }
      }

      return result;
    };

    if (Array.isArray(payload)) {
      filteredData.push(...payload.map(processItem));
    } else {
      Object.assign(filteredData, processItem(payload));
    }

    return {
      filteredData,
      redactedFields: Array.from(new Set(redactedFields)),
      anonymizedFields: Array.from(new Set(anonymizedFields))
    };
  }

  /**
   * Check if user can access a specific field
   */
  canAccessField(user: User, resourceType: string, fieldName: string): boolean {
    if (user.roles.includes('Admin')) {
      return true;
    }

    const fieldConfig = this.config.fields[resourceType];

    if (!fieldConfig) {
      return true;
    }

    // Always visible fields
    if (fieldConfig.always_visible?.includes(fieldName)) {
      return true;
    }

    const rule = fieldConfig[fieldName] as FieldVisibilityRule | undefined;

    if (!rule) {
      return true;
    }

    // Check if user has required role
    if (rule.roles && user.roles.some(role => rule.roles!.includes(role))) {
      return true;
    }

    // Check if user can see summary
    if (rule.summary_for && user.roles.some(role => rule.summary_for!.includes(role))) {
      return true;
    }

    return false;
  }

  /**
   * Evaluate permission conditions
   */
  private async evaluateConditions(
    conditions: string[],
    context: PermissionContext
  ): Promise<{ passed: boolean; failedCondition?: string }> {
    for (const condition of conditions) {
      const passed = await this.evaluateCondition(condition, context);

      if (!passed) {
        return { passed: false, failedCondition: condition };
      }
    }

    return { passed: true };
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: string,
    context: PermissionContext
  ): Promise<boolean> {
    const { user, resource } = context;

    // Parse condition: "vehicle.org_id == user.org_id"
    const parts = condition.split(/\s+(==|!=|IN)\s+/);

    if (parts.length !== 3) {
      console.warn(`Invalid condition format: ${condition}`);
      return true; // Fail open for malformed conditions (or change to false for security)
    }

    const [left, operator, right] = parts;

    const leftValue = this.resolveConditionValue(left, context);
    const rightValue = this.resolveConditionValue(right, context);

    switch (operator) {
      case '==':
        return leftValue === rightValue;
      case '!=':
        return leftValue !== rightValue;
      case 'IN':
        // Handle "user.role IN ['Admin', 'MaintenanceManager']"
        try {
          const arrayMatch = right.match(/\[(.*?)\]/);
          if (arrayMatch) {
            const values = arrayMatch[1].split(',').map(v => v.trim().replace(/['"]/g, ''));
            return values.includes(String(leftValue));
          }
        } catch (e) {
          console.error('Error evaluating IN condition:', e);
        }
        return false;
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }

  /**
   * Resolve condition value from context
   */
  private resolveConditionValue(path: string, context: PermissionContext): any {
    const cleanPath = path.trim();

    // Handle user properties
    if (cleanPath.startsWith('user.')) {
      const prop = cleanPath.substring(5);
      return (context.user as any)[prop];
    }

    // Handle resource properties
    if (context.resource && cleanPath.includes('.')) {
      const parts = cleanPath.split('.');
      let value: any = context.resource;

      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return undefined;
        }
      }

      return value;
    }

    // Handle inspection properties (legacy support)
    if (cleanPath.startsWith('inspection.') && context.resource) {
      const prop = cleanPath.substring(11);
      return context.resource[prop];
    }

    if (cleanPath.startsWith('maintenance.') && context.resource) {
      const prop = cleanPath.substring(12);
      return context.resource[prop];
    }

    if (cleanPath.startsWith('workorder.') && context.resource) {
      const prop = cleanPath.substring(10);
      return context.resource[prop];
    }

    return undefined;
  }

  /**
   * Summarize a field (e.g., show total but not breakdown)
   */
  private summarizeField(fieldName: string, value: any): any {
    if (fieldName.includes('cost') || fieldName.includes('price') || fieldName.includes('value')) {
      // For financial fields, return rounded total
      if (typeof value === 'number') {
        return Math.round(value / 100) * 100; // Round to nearest 100
      }
    }

    return '[Summary]';
  }

  /**
   * Anonymize a field (e.g., hide PII)
   */
  private anonymizeField(fieldName: string, value: any): any {
    if (fieldName.includes('name')) {
      return 'Anonymous';
    }

    if (fieldName.includes('email')) {
      return 'a***@***.com';
    }

    if (fieldName.includes('phone')) {
      return '***-***-****';
    }

    return '[Redacted]';
  }
}

// Singleton instance
export const permissionEngine = new PermissionEngine();
