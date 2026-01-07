# Fleet Management Application - Enterprise Security Architecture Analysis

**Document Version:** 2.0
**Date:** January 5, 2026
**Classification:** Internal - Architecture Specification
**Target Audience:** Senior Engineering, Security Team, Compliance

---

## Executive Summary

This document provides a critical security and architecture analysis of the Fleet Management application, identifying significant gaps in the current implementation and providing production-grade, enterprise-ready solutions suitable for government and financial institutions.

### Critical Findings

**Current State: Security Risk Level - HIGH**

1. **Client-Side Only Implementation** - Configuration and policy enforcement occur entirely in the browser, allowing trivial bypasses
2. **No Server-Side Validation** - All business rules can be circumvented by API manipulation
3. **Missing Secrets Management** - API keys and credentials stored in localStorage or environment variables
4. **No Audit Trail at API Level** - Configuration changes not logged server-side
5. **Lack of Encryption** - Sensitive data stored unencrypted at rest
6. **Missing Authentication on Critical Endpoints** - No JWT validation on policy/config endpoints
7. **No Rate Limiting** - Vulnerable to brute force and DDoS attacks
8. **Missing MFA for Privileged Operations** - Super admin actions have no additional verification

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Security Gaps Detailed](#2-security-gaps-detailed)
3. [Proposed Enterprise Architecture](#3-proposed-enterprise-architecture)
4. [Backend Services Design](#4-backend-services-design)
5. [Database Schema](#5-database-schema)
6. [API Security Layer](#6-api-security-layer)
7. [Secrets Management](#7-secrets-management)
8. [Audit Logging System](#8-audit-logging-system)
9. [Multi-Factor Authentication](#9-multi-factor-authentication)
10. [Configuration Management Service](#10-configuration-management-service)
11. [Data Governance Service](#11-data-governance-service)
12. [Policy Enforcement Service](#12-policy-enforcement-service)
13. [Encryption Strategy](#13-encryption-strategy)
14. [Compliance Considerations](#14-compliance-considerations)
15. [Implementation Roadmap](#15-implementation-roadmap)

---

## 1. Current Architecture Analysis

### 1.1 Current Implementation Review

**File: `/src/lib/configuration/configuration-engine.ts`**

```typescript
// CRITICAL SECURITY FLAW: Runs entirely client-side
export class ConfigurationEngine {
  private config: Map<string, any> = new Map()

  async set(key: string, value: any, modifiedBy: string): Promise<void> {
    // FLAW: No server validation, client can bypass
    this.config.set(key, value)

    // FLAW: localStorage only - not persisted to database
    localStorage.setItem('fleet-configuration', JSON.stringify(all))

    // FLAW: Console log is not an audit trail
    console.log(`Configuration updated: ${key} = ${value} by ${modifiedBy}`)
  }
}
```

**Problems:**
- Any user with browser DevTools can modify configuration
- No server-side persistence means data loss on cache clear
- No audit trail for compliance
- No approval workflow for critical changes
- No rollback capability
- No environment-specific configs (dev/staging/prod)

**File: `/src/lib/policy-engine/engine.ts`**

```typescript
// CRITICAL: Policy enforcement happens client-side only
class PolicyEngine {
  async evaluatePolicy(policy: Policy, context: any): Promise<boolean> {
    // Client-side evaluation can be bypassed
    return this.evaluateConditions(policy.conditions, context)
  }
}
```

**Problems:**
- Users can disable JavaScript to bypass policies
- Browser extension can intercept and modify evaluation
- No server-side enforcement
- Policy violations not recorded server-side
- No tamper detection

### 1.2 API Layer Analysis

**File: `/api/src/index.ts`**

```typescript
// CRITICAL: No authentication middleware
app.get('/api/v1/vehicles', async (req, res) => {
  // Direct database query with no:
  // - JWT validation
  // - Role-based access control
  // - Rate limiting
  // - Input sanitization
  // - Audit logging
  const result = await pool.query('SELECT * FROM vehicles')
  res.json(result.rows)
})
```

**Missing Security Controls:**
- ❌ JWT token validation
- ❌ RBAC enforcement
- ❌ Rate limiting
- ❌ SQL injection prevention (currently uses raw queries)
- ❌ CSRF protection
- ❌ Content Security Policy headers
- ❌ Audit logging
- ❌ Request validation
- ❌ Error sanitization (exposes internal details)

### 1.3 Database Schema Analysis

**File: `/api/src/db/schema.ts`**

**Existing Tables:**
- `policies` - Has basic columns but missing encryption
- `policy_versions` - Good start but incomplete
- `policy_executions` - Client-side only currently

**Missing Critical Tables:**
- `configuration_settings` - Server-side config storage
- `configuration_versions` - Version history
- `configuration_approvals` - Approval workflow
- `audit_logs` - Comprehensive audit trail
- `api_keys` - Encrypted API credential storage
- `mfa_tokens` - Multi-factor authentication
- `rate_limit_tracking` - API rate limiting
- `session_tokens` - JWT session management
- `encryption_keys` - Key management

---

## 2. Security Gaps Detailed

### 2.1 Authentication & Authorization

| Component | Current State | Risk | Required Solution |
|-----------|--------------|------|-------------------|
| API Endpoints | No JWT validation | CRITICAL | Implement JWT middleware on all routes |
| Role Checking | Client-side only | CRITICAL | Server-side RBAC with database-backed permissions |
| Session Management | Basic sessions table | HIGH | JWT with refresh tokens, revocation list |
| Password Storage | Not implemented | CRITICAL | bcrypt with cost factor 12+ |
| MFA | Not implemented | HIGH | TOTP-based MFA for SuperAdmin/CTAOwner |

### 2.2 Data Security

| Component | Current State | Risk | Required Solution |
|-----------|--------------|------|-------------------|
| Encryption at Rest | None | CRITICAL | AES-256 for sensitive columns |
| Encryption in Transit | HTTPS only | MEDIUM | TLS 1.3, certificate pinning |
| API Keys Storage | localStorage/env | CRITICAL | Azure Key Vault integration |
| Configuration Data | localStorage | HIGH | Encrypted database storage |
| Audit Logs | Console only | CRITICAL | Immutable database logs |

### 2.3 Application Security

| Component | Current State | Risk | Required Solution |
|-----------|--------------|------|-------------------|
| SQL Injection | Some raw queries | HIGH | Parameterized queries ($1, $2) everywhere |
| XSS Prevention | Basic React escaping | MEDIUM | Content Security Policy headers |
| CSRF Protection | Not implemented | HIGH | CSRF tokens for state-changing operations |
| Rate Limiting | None | HIGH | Token bucket algorithm per IP/user |
| Input Validation | Client-side only | HIGH | Server-side validation with whitelist approach |

### 2.4 Compliance Gaps

**For Government/Financial Sector Compliance:**

- ❌ **FISMA Compliance** - Missing continuous monitoring
- ❌ **NIST 800-53** - Missing security controls
- ❌ **SOC 2 Type II** - No audit trail
- ❌ **GDPR** - Missing data subject rights implementation
- ❌ **HIPAA** (if health data) - No BAA, missing encryption
- ❌ **PCI DSS** (if payment data) - Multiple violations

---

## 3. Proposed Enterprise Architecture

### 3.1 Architecture Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  React SPA   │  │  Mobile App  │  │  Admin Panel │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                  │                  │
│         └─────────────────┴──────────────────┘                  │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTPS/TLS 1.3
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                  API GATEWAY & SECURITY LAYER                    │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           API Gateway (Express.js/Fastify)           │       │
│  │  • JWT Validation                                    │       │
│  │  • Rate Limiting (Redis-backed)                      │       │
│  │  • RBAC Enforcement                                  │       │
│  │  • Request Validation (Zod schemas)                  │       │
│  │  • CSRF Protection                                   │       │
│  │  • Security Headers (Helmet.js)                      │       │
│  │  • Audit Logging Middleware                          │       │
│  └──────────────────────────────────────────────────────┘       │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                    APPLICATION SERVICES LAYER                    │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Configuration   │  │ Data Governance  │  │ Policy        │ │
│  │ Management      │  │ Service          │  │ Enforcement   │ │
│  │ Service         │  │                  │  │ Service       │ │
│  │                 │  │ • MDM            │  │               │ │
│  │ • Versioning    │  │ • Lineage        │  │ • Server-side │ │
│  │ • Approval Flow │  │ • Quality        │  │ • Validation  │ │
│  │ • Rollback      │  │ • Classification │  │ • Execution   │ │
│  └─────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Audit Service   │  │ Secrets          │  │ Notification  │ │
│  │                 │  │ Management       │  │ Service       │ │
│  │ • Immutable Logs│  │ (Azure Key Vault)│  │               │ │
│  │ • Compliance    │  │                  │  │ • Email       │ │
│  │ • Alerting      │  │ • Encryption Keys│  │ • SMS         │ │
│  └─────────────────┘  └──────────────────┘  └───────────────┘ │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                       DATA PERSISTENCE LAYER                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          PostgreSQL (Primary Database)                   │   │
│  │  • Row-Level Security (RLS)                             │   │
│  │  • Encrypted columns (pgcrypto)                         │   │
│  │  • Audit triggers                                       │   │
│  │  • Point-in-time recovery                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Redis     │  │  Azure Blob  │  │  Azure Key   │         │
│  │  (Cache +    │  │   Storage    │  │    Vault     │         │
│  │ Rate Limit)  │  │  (Documents) │  │  (Secrets)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

### 3.2 Security Layers

**Layer 1: Network Security**
- TLS 1.3 for all communication
- Certificate pinning for mobile apps
- WAF (Web Application Firewall) - Azure Application Gateway
- DDoS protection - Azure DDoS Protection

**Layer 2: API Security**
- JWT-based authentication with RS256 signing
- Refresh token rotation
- API rate limiting (100 requests/minute per user)
- Request validation with Zod schemas
- CSRF tokens for POST/PUT/DELETE
- Security headers (CSP, HSTS, X-Frame-Options)

**Layer 3: Application Security**
- Server-side policy enforcement
- Role-based access control (RBAC)
- Input sanitization and validation
- Parameterized SQL queries only
- Secure session management

**Layer 4: Data Security**
- Encryption at rest (AES-256)
- Encrypted database connections
- Secrets in Azure Key Vault
- Data classification and labeling
- Audit logging for all data access

**Layer 5: Monitoring & Response**
- Real-time security monitoring
- Automated threat detection
- Incident response workflows
- Compliance reporting
- Security information and event management (SIEM)

---

## 4. Backend Services Design

### 4.1 Configuration Management Service

**File: `/api/src/services/configuration/configuration.service.ts`**

```typescript
import { Pool } from 'pg'
import { encrypt, decrypt } from '../crypto/encryption.service'
import { auditLog } from '../audit/audit.service'
import { validateRole } from '../auth/rbac.service'

export interface ConfigurationValue {
  id: number
  key: string
  value: any
  encryptedValue?: string
  valueType: 'string' | 'number' | 'boolean' | 'json'
  isEncrypted: boolean
  category: string
  requiresApproval: boolean
  lastModifiedBy: string
  lastModifiedAt: Date
  version: number
}

export interface ConfigurationApproval {
  id: number
  configurationId: number
  requestedValue: any
  requestedBy: string
  requestedAt: Date
  approvalStatus: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
}

export class ConfigurationService {
  constructor(private db: Pool) {}

  /**
   * Get configuration value with caching and decryption
   */
  async get(key: string, userId: string): Promise<any> {
    // Check cache first (Redis)
    const cached = await this.cache.get(`config:${key}`)
    if (cached) return JSON.parse(cached)

    // Query database with RLS
    const result = await this.db.query(
      `SELECT id, key, value, encrypted_value, value_type, is_encrypted
       FROM configuration_settings
       WHERE key = $1 AND is_active = true`,
      [key]
    )

    if (result.rows.length === 0) {
      throw new Error(`Configuration key not found: ${key}`)
    }

    const config = result.rows[0]

    // Decrypt if necessary
    let value = config.value
    if (config.is_encrypted && config.encrypted_value) {
      value = await decrypt(config.encrypted_value)
    }

    // Type conversion
    value = this.convertType(value, config.value_type)

    // Audit log access
    await auditLog({
      action: 'configuration.read',
      resourceType: 'configuration',
      resourceId: config.id,
      userId,
      metadata: { key }
    })

    // Cache for 5 minutes
    await this.cache.set(`config:${key}`, JSON.stringify(value), 'EX', 300)

    return value
  }

  /**
   * Set configuration value with validation, approval workflow, and versioning
   */
  async set(
    key: string,
    value: any,
    userId: string,
    userRole: string
  ): Promise<ConfigurationApproval | ConfigurationValue> {
    // Validate user has permission
    const canModify = await validateRole(userRole, 'configuration.write')
    if (!canModify) {
      throw new Error('Insufficient permissions to modify configuration')
    }

    // Get existing configuration
    const existing = await this.db.query(
      `SELECT id, key, requires_approval, is_encrypted, category, value
       FROM configuration_settings
       WHERE key = $1`,
      [key]
    )

    if (existing.rows.length === 0) {
      throw new Error(`Configuration key not found: ${key}`)
    }

    const config = existing.rows[0]

    // Validate new value
    await this.validateValue(key, value)

    // Check if approval required
    if (config.requires_approval && userRole !== 'SuperAdmin') {
      // Create approval request
      const approval = await this.createApprovalRequest(
        config.id,
        value,
        userId
      )

      // Send notification to approvers
      await this.notifyApprovers(config.category, approval.id)

      return approval
    }

    // Direct update (no approval needed)
    return await this.updateConfiguration(config.id, key, value, userId)
  }

  /**
   * Update configuration with versioning
   */
  private async updateConfiguration(
    configId: number,
    key: string,
    value: any,
    userId: string
  ): Promise<ConfigurationValue> {
    // Start transaction
    const client = await this.db.connect()

    try {
      await client.query('BEGIN')

      // Get current version
      const currentResult = await client.query(
        `SELECT version, value, is_encrypted FROM configuration_settings WHERE id = $1`,
        [configId]
      )
      const current = currentResult.rows[0]

      // Save to version history
      await client.query(
        `INSERT INTO configuration_versions
         (configuration_id, version, value, changed_by, changed_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [configId, current.version, current.value, userId]
      )

      // Encrypt if required
      let encryptedValue = null
      if (current.is_encrypted) {
        encryptedValue = await encrypt(JSON.stringify(value))
        value = null // Don't store plaintext
      }

      // Update current configuration
      const updateResult = await client.query(
        `UPDATE configuration_settings
         SET value = $1,
             encrypted_value = $2,
             version = version + 1,
             last_modified_by = $3,
             last_modified_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [value, encryptedValue, userId, configId]
      )

      // Invalidate cache
      await this.cache.del(`config:${key}`)

      // Audit log
      await auditLog({
        action: 'configuration.update',
        resourceType: 'configuration',
        resourceId: configId,
        userId,
        metadata: {
          key,
          previousValue: current.value,
          newValue: value
        }
      })

      await client.query('COMMIT')

      return updateResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Create approval request
   */
  private async createApprovalRequest(
    configId: number,
    value: any,
    requestedBy: string
  ): Promise<ConfigurationApproval> {
    const result = await this.db.query(
      `INSERT INTO configuration_approvals
       (configuration_id, requested_value, requested_by, requested_at, approval_status)
       VALUES ($1, $2, $3, NOW(), 'pending')
       RETURNING *`,
      [configId, JSON.stringify(value), requestedBy]
    )

    await auditLog({
      action: 'configuration.approval_requested',
      resourceType: 'configuration_approval',
      resourceId: result.rows[0].id,
      userId: requestedBy,
      metadata: { configId, value }
    })

    return result.rows[0]
  }

  /**
   * Approve configuration change
   */
  async approveChange(
    approvalId: number,
    approverId: string,
    approverRole: string
  ): Promise<ConfigurationValue> {
    // Validate approver role
    const canApprove = await validateRole(approverRole, 'configuration.approve')
    if (!canApprove) {
      throw new Error('Insufficient permissions to approve configuration changes')
    }

    // Get approval request
    const approvalResult = await this.db.query(
      `SELECT ca.*, cs.key
       FROM configuration_approvals ca
       JOIN configuration_settings cs ON ca.configuration_id = cs.id
       WHERE ca.id = $1 AND ca.approval_status = 'pending'`,
      [approvalId]
    )

    if (approvalResult.rows.length === 0) {
      throw new Error('Approval request not found or already processed')
    }

    const approval = approvalResult.rows[0]

    // Update approval status
    await this.db.query(
      `UPDATE configuration_approvals
       SET approval_status = 'approved',
           approved_by = $1,
           approved_at = NOW()
       WHERE id = $2`,
      [approverId, approvalId]
    )

    // Apply the configuration change
    const value = JSON.parse(approval.requested_value)
    const updated = await this.updateConfiguration(
      approval.configuration_id,
      approval.key,
      value,
      approverId
    )

    await auditLog({
      action: 'configuration.approved',
      resourceType: 'configuration_approval',
      resourceId: approvalId,
      userId: approverId,
      metadata: { configId: approval.configuration_id }
    })

    return updated
  }

  /**
   * Reject configuration change
   */
  async rejectChange(
    approvalId: number,
    approverId: string,
    reason: string
  ): Promise<void> {
    await this.db.query(
      `UPDATE configuration_approvals
       SET approval_status = 'rejected',
           approved_by = $1,
           approved_at = NOW(),
           rejection_reason = $2
       WHERE id = $3`,
      [approverId, reason, approvalId]
    )

    await auditLog({
      action: 'configuration.rejected',
      resourceType: 'configuration_approval',
      resourceId: approvalId,
      userId: approverId,
      metadata: { reason }
    })
  }

  /**
   * Rollback to previous version
   */
  async rollback(
    key: string,
    targetVersion: number,
    userId: string
  ): Promise<ConfigurationValue> {
    const config = await this.db.query(
      `SELECT id FROM configuration_settings WHERE key = $1`,
      [key]
    )

    if (config.rows.length === 0) {
      throw new Error(`Configuration not found: ${key}`)
    }

    const version = await this.db.query(
      `SELECT value FROM configuration_versions
       WHERE configuration_id = $1 AND version = $2`,
      [config.rows[0].id, targetVersion]
    )

    if (version.rows.length === 0) {
      throw new Error(`Version ${targetVersion} not found`)
    }

    return await this.updateConfiguration(
      config.rows[0].id,
      key,
      version.rows[0].value,
      userId
    )
  }

  /**
   * Get configuration history
   */
  async getHistory(key: string): Promise<ConfigurationValue[]> {
    const result = await this.db.query(
      `SELECT cv.*, cs.key
       FROM configuration_versions cv
       JOIN configuration_settings cs ON cv.configuration_id = cs.id
       WHERE cs.key = $1
       ORDER BY cv.version DESC
       LIMIT 100`,
      [key]
    )

    return result.rows
  }

  /**
   * Validate configuration value
   */
  private async validateValue(key: string, value: any): Promise<void> {
    // Get validation rules
    const rules = await this.db.query(
      `SELECT validation_rules FROM configuration_settings WHERE key = $1`,
      [key]
    )

    if (rules.rows.length === 0) return

    const validationRules = rules.rows[0].validation_rules

    // Type checking
    if (validationRules.type) {
      if (typeof value !== validationRules.type) {
        throw new Error(`Invalid type. Expected ${validationRules.type}`)
      }
    }

    // Range validation for numbers
    if (validationRules.min !== undefined && value < validationRules.min) {
      throw new Error(`Value must be >= ${validationRules.min}`)
    }
    if (validationRules.max !== undefined && value > validationRules.max) {
      throw new Error(`Value must be <= ${validationRules.max}`)
    }

    // Pattern validation for strings
    if (validationRules.pattern && typeof value === 'string') {
      const regex = new RegExp(validationRules.pattern)
      if (!regex.test(value)) {
        throw new Error('Value does not match required pattern')
      }
    }

    // Enum validation
    if (validationRules.enum && !validationRules.enum.includes(value)) {
      throw new Error(`Value must be one of: ${validationRules.enum.join(', ')}`)
    }

    // Custom validation function
    if (validationRules.custom) {
      const isValid = await eval(validationRules.custom)(value)
      if (!isValid) {
        throw new Error('Custom validation failed')
      }
    }
  }

  /**
   * Convert value to correct type
   */
  private convertType(value: any, type: string): any {
    switch (type) {
      case 'number':
        return Number(value)
      case 'boolean':
        return Boolean(value)
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value
      default:
        return value
    }
  }

  /**
   * Notify approvers
   */
  private async notifyApprovers(category: string, approvalId: number): Promise<void> {
    // Get approvers for category
    const approvers = await this.db.query(
      `SELECT user_id, email FROM users
       WHERE role IN ('SuperAdmin', 'CTAOwner') AND is_active = true`
    )

    // Send notification via email/Teams
    for (const approver of approvers.rows) {
      await this.notificationService.send({
        to: approver.email,
        subject: 'Configuration Change Approval Required',
        body: `A configuration change request requires your approval. ID: ${approvalId}`,
        priority: 'high'
      })
    }
  }
}
```

### 4.2 Policy Enforcement Service

**File: `/api/src/services/policy/policy-enforcement.service.ts`**

```typescript
import { Pool } from 'pg'
import { auditLog } from '../audit/audit.service'

export interface Policy {
  id: number
  name: string
  type: string
  conditions: PolicyCondition[]
  actions: PolicyAction[]
  mode: 'monitor' | 'human-in-loop' | 'autonomous'
  status: 'active' | 'inactive'
}

export interface PolicyCondition {
  field: string
  operator: string
  value: any
}

export interface PolicyAction {
  type: string
  target?: string
  params?: Record<string, any>
}

export interface PolicyEvaluationResult {
  policyId: number
  matched: boolean
  conditionResults: Record<string, boolean>
  actionsTaken: PolicyAction[]
  executionTimeMs: number
  evaluatedAt: Date
}

export class PolicyEnforcementService {
  constructor(private db: Pool) {}

  /**
   * Evaluate all active policies against context
   * SERVER-SIDE ENFORCEMENT - CANNOT BE BYPASSED
   */
  async evaluatePolicies(
    context: Record<string, any>,
    userId: string
  ): Promise<PolicyEvaluationResult[]> {
    const startTime = Date.now()

    // Get all active policies for context type
    const policies = await this.getActivePolicies(context)

    const results: PolicyEvaluationResult[] = []

    for (const policy of policies) {
      const result = await this.evaluatePolicy(policy, context, userId)
      results.push(result)

      // Execute actions if policy matched
      if (result.matched && policy.mode !== 'monitor') {
        await this.executeActions(policy, result.actionsTaken, context, userId)
      }
    }

    // Log overall evaluation
    await auditLog({
      action: 'policy.evaluation',
      resourceType: 'policy_evaluation',
      userId,
      metadata: {
        contextType: context.type,
        policiesEvaluated: policies.length,
        policiesMatched: results.filter(r => r.matched).length,
        executionTimeMs: Date.now() - startTime
      }
    })

    return results
  }

  /**
   * Evaluate single policy
   */
  private async evaluatePolicy(
    policy: Policy,
    context: Record<string, any>,
    userId: string
  ): Promise<PolicyEvaluationResult> {
    const startTime = Date.now()
    const conditionResults: Record<string, boolean> = {}

    // Evaluate each condition
    for (const condition of policy.conditions) {
      const result = await this.evaluateCondition(condition, context)
      conditionResults[`${condition.field}_${condition.operator}`] = result
    }

    // All conditions must be true for policy to match (AND logic)
    const matched = Object.values(conditionResults).every(r => r === true)

    // Determine actions to take
    const actionsTaken = matched ? policy.actions : []

    // Record execution
    const executionResult: PolicyEvaluationResult = {
      policyId: policy.id,
      matched,
      conditionResults,
      actionsTaken,
      executionTimeMs: Date.now() - startTime,
      evaluatedAt: new Date()
    }

    // Save execution record
    await this.db.query(
      `INSERT INTO policy_executions
       (policy_id, executed_at, execution_mode, evaluation_context,
        condition_results, actions_taken, execution_status, execution_duration_ms, executed_by)
       VALUES ($1, NOW(), $2, $3, $4, $5, $6, $7, $8)`,
      [
        policy.id,
        'automatic',
        JSON.stringify(context),
        JSON.stringify(conditionResults),
        JSON.stringify(actionsTaken),
        'success',
        executionResult.executionTimeMs,
        userId
      ]
    )

    return executionResult
  }

  /**
   * Evaluate single condition
   */
  private async evaluateCondition(
    condition: PolicyCondition,
    context: Record<string, any>
  ): Promise<boolean> {
    const fieldValue = this.getFieldValue(context, condition.field)

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'not_equals':
        return fieldValue !== condition.value

      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)

      case 'less_than':
        return Number(fieldValue) < Number(condition.value)

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)

      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)

      case 'contains':
        return String(fieldValue).includes(String(condition.value))

      case 'matches_regex':
        const regex = new RegExp(condition.value)
        return regex.test(String(fieldValue))

      case 'exists':
        return fieldValue !== null && fieldValue !== undefined

      case 'is_null':
        return fieldValue === null || fieldValue === undefined

      default:
        throw new Error(`Unknown operator: ${condition.operator}`)
    }
  }

  /**
   * Execute policy actions
   */
  private async executeActions(
    policy: Policy,
    actions: PolicyAction[],
    context: Record<string, any>,
    userId: string
  ): Promise<void> {
    for (const action of actions) {
      try {
        await this.executeAction(action, policy, context, userId)
      } catch (error) {
        // Log action failure but continue
        await auditLog({
          action: 'policy.action_failed',
          resourceType: 'policy_action',
          resourceId: policy.id,
          userId,
          metadata: {
            actionType: action.type,
            error: error.message
          }
        })
      }
    }
  }

  /**
   * Execute single action
   */
  private async executeAction(
    action: PolicyAction,
    policy: Policy,
    context: Record<string, any>,
    userId: string
  ): Promise<void> {
    switch (action.type) {
      case 'notify':
        await this.notificationService.send({
          to: action.target,
          subject: `Policy Violation: ${policy.name}`,
          body: `Policy ${policy.name} was triggered`,
          priority: action.params?.priority || 'medium'
        })
        break

      case 'block-dispatch':
        await this.db.query(
          `UPDATE vehicles SET dispatch_blocked = true, block_reason = $1 WHERE id = $2`,
          [action.params?.reason || 'Policy violation', context.vehicleId]
        )
        break

      case 'create-violation':
        await this.db.query(
          `INSERT INTO policy_violations
           (policy_id, violation_type, severity, description, context_data, detected_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            policy.id,
            action.params?.violationType,
            action.params?.severity || 'medium',
            policy.name,
            JSON.stringify(context)
          ]
        )
        break

      case 'suspend-card':
        await this.db.query(
          `UPDATE fuel_cards SET status = 'suspended', suspended_reason = $1 WHERE id = $2`,
          [action.params?.reason, context.fuelCardId]
        )
        break

      case 'require-approval':
        await this.db.query(
          `INSERT INTO approval_requests
           (request_type, resource_id, requested_by, reason, status)
           VALUES ($1, $2, $3, $4, 'pending')`,
          [
            action.params?.requestType,
            context.resourceId,
            userId,
            `Policy ${policy.name} requires approval`
          ]
        )
        break

      default:
        console.warn(`Unknown action type: ${action.type}`)
    }

    // Audit log action execution
    await auditLog({
      action: 'policy.action_executed',
      resourceType: 'policy_action',
      resourceId: policy.id,
      userId,
      metadata: {
        actionType: action.type,
        policyName: policy.name,
        context
      }
    })
  }

  /**
   * Get field value from context using dot notation
   */
  private getFieldValue(obj: any, path: string): any {
    const parts = path.split('.')
    let current = obj

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[part]
    }

    return current
  }

  /**
   * Get active policies for context
   */
  private async getActivePolicies(context: Record<string, any>): Promise<Policy[]> {
    const result = await this.db.query(
      `SELECT * FROM policies
       WHERE status = 'active'
       AND (scope->>'types' IS NULL OR scope->>'types' LIKE $1)
       ORDER BY id`,
      [`%${context.type}%`]
    )

    return result.rows.map(row => ({
      ...row,
      conditions: row.conditions || [],
      actions: row.actions || []
    }))
  }

  /**
   * Record policy violation
   */
  async recordViolation(
    policyId: number,
    violationType: string,
    severity: string,
    description: string,
    context: Record<string, any>,
    userId: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO policy_violations
       (policy_id, violation_type, severity, description, violated_by, context_data, detected_at, detection_method)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), 'automatic')`,
      [policyId, violationType, severity, description, userId, JSON.stringify(context)]
    )

    await auditLog({
      action: 'policy.violation_recorded',
      resourceType: 'policy_violation',
      resourceId: policyId,
      userId,
      metadata: { violationType, severity }
    })
  }
}
```

*[Document continues with sections 5-15 covering Database Schema, API Security Layer, Secrets Management, Audit Logging, MFA, Data Governance, Encryption, Compliance, and Implementation Roadmap...]*

---

## 5. Database Schema

### 5.1 Configuration Management Tables

```sql
-- Configuration settings (encrypted sensitive values)
CREATE TABLE configuration_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  encrypted_value TEXT, -- For sensitive values
  value_type VARCHAR(50) NOT NULL DEFAULT 'string',
  is_encrypted BOOLEAN DEFAULT false,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  requires_approval BOOLEAN DEFAULT false,
  validation_rules JSONB,
  last_modified_by VARCHAR(255) NOT NULL,
  last_modified_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_config_key (key),
  INDEX idx_config_category (category),
  INDEX idx_config_active (is_active)
);

-- Configuration version history
CREATE TABLE configuration_versions (
  id SERIAL PRIMARY KEY,
  configuration_id INTEGER NOT NULL REFERENCES configuration_settings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  value TEXT,
  encrypted_value TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,

  -- Indexes
  INDEX idx_config_version (configuration_id, version),
  UNIQUE (configuration_id, version)
);

-- Configuration approval workflow
CREATE TABLE configuration_approvals (
  id SERIAL PRIMARY KEY,
  configuration_id INTEGER NOT NULL REFERENCES configuration_settings(id) ON DELETE CASCADE,
  requested_value TEXT NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by VARCHAR(255),
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Indexes
  INDEX idx_approval_status (approval_status),
  INDEX idx_approval_requested_by (requested_by)
);

-- MFA tokens
CREATE TABLE mfa_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_key_encrypted TEXT NOT NULL, -- Encrypted TOTP secret
  backup_codes_encrypted TEXT, -- Encrypted backup codes
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,

  -- Indexes
  INDEX idx_mfa_user (user_id),
  UNIQUE (user_id)
);

-- API keys storage (encrypted)
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL,
  key_type VARCHAR(100) NOT NULL, -- google-maps, openai, anthropic, etc.
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Indexes
  INDEX idx_apikey_type (key_type),
  INDEX idx_apikey_active (is_active)
);

-- Encryption keys metadata (actual keys in Azure Key Vault)
CREATE TABLE encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  key_version INTEGER NOT NULL,
  azure_key_vault_id VARCHAR(500) NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
  purpose VARCHAR(100) NOT NULL, -- data-encryption, token-signing, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,

  -- Indexes
  INDEX idx_encryption_key_name (key_name),
  INDEX idx_encryption_active (is_active)
);
```

### 5.2 Audit Logging Tables

```sql
-- Comprehensive audit log (immutable)
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  response_status INTEGER,
  execution_time_ms INTEGER,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'info', -- debug, info, warning, error, critical

  -- Partitioning by month for performance
  -- CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  -- FOR VALUES FROM ('2026-01-01') TO ('2026-02-01')

  -- Indexes
  INDEX idx_audit_timestamp (event_timestamp DESC),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_resource (resource_type, resource_id),
  INDEX idx_audit_severity (severity)
) PARTITION BY RANGE (event_timestamp);

-- Audit log digest for compliance reporting
CREATE TABLE audit_log_digests (
  id SERIAL PRIMARY KEY,
  digest_date DATE NOT NULL UNIQUE,
  total_events BIGINT NOT NULL,
  critical_events INTEGER NOT NULL,
  error_events INTEGER NOT NULL,
  warning_events INTEGER NOT NULL,
  unique_users INTEGER NOT NULL,
  digest_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for tamper detection
  created_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  INDEX idx_digest_date (digest_date DESC)
);

-- Security events (subset of audit log for SOC monitoring)
CREATE TABLE security_events (
  id BIGSERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL, -- failed-login, unauthorized-access, suspicious-activity
  severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
  user_id VARCHAR(255),
  ip_address INET,
  details JSONB NOT NULL,
  investigated BOOLEAN DEFAULT false,
  investigated_by VARCHAR(255),
  investigated_at TIMESTAMP,
  resolution_notes TEXT,

  -- Indexes
  INDEX idx_security_timestamp (event_timestamp DESC),
  INDEX idx_security_type (event_type),
  INDEX idx_security_severity (severity),
  INDEX idx_security_investigated (investigated)
);
```

### 5.3 Rate Limiting Tables

```sql
-- Rate limit tracking
CREATE TABLE rate_limits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  ip_address INET,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,

  -- Indexes
  INDEX idx_ratelimit_user (user_id, window_start),
  INDEX idx_ratelimit_ip (ip_address, window_start),
  INDEX idx_ratelimit_endpoint (endpoint, window_start),
  UNIQUE (user_id, ip_address, endpoint, window_start)
);

-- Blocked IPs/users
CREATE TABLE blocked_entities (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL, -- ip, user, api-key
  entity_value VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  blocked_by VARCHAR(255) NOT NULL,
  blocked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false,

  -- Indexes
  INDEX idx_blocked_entity (entity_type, entity_value),
  INDEX idx_blocked_expires (expires_at)
);
```

### 5.4 Session Management Tables

```sql
-- JWT session tokens
CREATE TABLE session_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID for revocation
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE,
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,

  -- Indexes
  INDEX idx_session_user (user_id),
  INDEX idx_session_jti (token_jti),
  INDEX idx_session_expires (expires_at),
  INDEX idx_session_revoked (is_revoked)
);

-- Session revocation list (for immediate logout)
CREATE TABLE revoked_tokens (
  id SERIAL PRIMARY KEY,
  token_jti VARCHAR(255) NOT NULL UNIQUE,
  revoked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- When token would have expired anyway

  -- Indexes
  INDEX idx_revoked_jti (token_jti),
  INDEX idx_revoked_expires (expires_at)
);
```

---

## 6. API Security Layer

### 6.1 JWT Authentication Middleware

**File: `/api/src/middleware/auth.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { Pool } from 'pg'
import { auditLog } from '../services/audit/audit.service'

export interface JWTPayload {
  userId: number
  email: string
  role: string
  permissions: string[]
  jti: string // JWT ID for revocation
  iat: number
  exp: number
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

export class AuthMiddleware {
  constructor(private db: Pool, private secretKey: string) {}

  /**
   * Validate JWT token and attach user to request
   */
  authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided'
        })
        return
      }

      const token = authHeader.substring(7)

      // Verify JWT signature and expiration
      const payload = jwt.verify(token, this.secretKey, {
        algorithms: ['RS256'] // Use asymmetric encryption
      }) as JWTPayload

      // Check if token is revoked
      const revokedCheck = await this.db.query(
        `SELECT 1 FROM revoked_tokens WHERE token_jti = $1`,
        [payload.jti]
      )

      if (revokedCheck.rows.length > 0) {
        await this.logSecurityEvent('revoked-token-attempt', req, payload.userId)
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has been revoked'
        })
        return
      }

      // Check session validity
      const sessionCheck = await this.db.query(
        `SELECT is_revoked FROM session_tokens
         WHERE token_jti = $1 AND expires_at > NOW()`,
        [payload.jti]
      )

      if (sessionCheck.rows.length === 0 || sessionCheck.rows[0].is_revoked) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Session expired or invalid'
        })
        return
      }

      // Update last activity
      await this.db.query(
        `UPDATE session_tokens SET last_activity_at = NOW() WHERE token_jti = $1`,
        [payload.jti]
      )

      // Attach user to request
      req.user = payload

      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token expired'
        })
      } else if (error.name === 'JsonWebTokenError') {
        await this.logSecurityEvent('invalid-token', req)
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token'
        })
      } else {
        console.error('Auth middleware error:', error)
        res.status(500).json({
          error: 'Internal Server Error',
          message: 'Authentication failed'
        })
      }
    }
  }

  /**
   * Role-based access control
   */
  requireRole = (allowedRoles: string[]) => {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        })
        return
      }

      if (!allowedRoles.includes(req.user.role)) {
        await this.logSecurityEvent('unauthorized-access-attempt', req, req.user.userId)
        res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        })
        return
      }

      next()
    }
  }

  /**
   * Permission-based access control (more granular than roles)
   */
  requirePermission = (permission: string) => {
    return async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      if (!req.user) {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Not authenticated'
        })
        return
      }

      if (!req.user.permissions.includes(permission)) {
        await this.logSecurityEvent('permission-denied', req, req.user.userId)
        res.status(403).json({
          error: 'Forbidden',
          message: `Permission required: ${permission}`
        })
        return
      }

      next()
    }
  }

  /**
   * MFA required for sensitive operations
   */
  requireMFA = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated'
      })
      return
    }

    // Check if MFA token provided
    const mfaToken = req.headers['x-mfa-token']
    if (!mfaToken) {
      res.status(403).json({
        error: 'MFA Required',
        message: 'Multi-factor authentication required for this operation'
      })
      return
    }

    // Verify MFA token
    const isValid = await this.verifyMFAToken(req.user.userId, mfaToken as string)
    if (!isValid) {
      await this.logSecurityEvent('mfa-failed', req, req.user.userId)
      res.status(403).json({
        error: 'MFA Failed',
        message: 'Invalid MFA token'
      })
      return
    }

    next()
  }

  /**
   * Verify TOTP MFA token
   */
  private async verifyMFAToken(userId: number, token: string): Promise<boolean> {
    const result = await this.db.query(
      `SELECT secret_key_encrypted FROM mfa_tokens WHERE user_id = $1 AND is_enabled = true`,
      [userId]
    )

    if (result.rows.length === 0) {
      return false
    }

    // Decrypt secret and verify TOTP
    const secret = await decrypt(result.rows[0].secret_key_encrypted)
    const speakeasy = require('speakeasy')

    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps before/after for clock drift
    })
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(
    eventType: string,
    req: Request,
    userId?: number
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO security_events
       (event_type, severity, user_id, ip_address, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        eventType,
        'high',
        userId,
        req.ip,
        JSON.stringify({
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent']
        })
      ]
    )
  }
}
```

### 6.2 Rate Limiting Middleware

**File: `/api/src/middleware/rate-limit.middleware.ts`**

```typescript
import { Request, Response, NextFunction } from 'express'
import { Pool } from 'pg'
import Redis from 'ioredis'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (req: Request) => string // Custom key generator
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

export class RateLimitMiddleware {
  private redis: Redis

  constructor(private db: Pool, redisUrl: string) {
    this.redis = new Redis(redisUrl)
  }

  /**
   * Rate limit middleware using token bucket algorithm
   */
  limit = (config: RateLimitConfig) => {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        // Generate rate limit key
        const key = config.keyGenerator
          ? config.keyGenerator(req)
          : this.defaultKeyGenerator(req)

        const redisKey = `ratelimit:${key}`

        // Get current count
        const current = await this.redis.get(redisKey)
        const count = current ? parseInt(current, 10) : 0

        // Check if limit exceeded
        if (count >= config.maxRequests) {
          res.status(429).json({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(config.windowMs / 1000)
          })
          return
        }

        // Increment counter
        const pipeline = this.redis.pipeline()
        pipeline.incr(redisKey)
        if (count === 0) {
          // Set expiration only for first request in window
          pipeline.pexpire(redisKey, config.windowMs)
        }
        await pipeline.exec()

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', config.maxRequests)
        res.setHeader('X-RateLimit-Remaining', Math.max(0, config.maxRequests - count - 1))
        res.setHeader('X-RateLimit-Reset', Date.now() + config.windowMs)

        next()
      } catch (error) {
        console.error('Rate limit error:', error)
        // Fail open - allow request if rate limiting fails
        next()
      }
    }
  }

  /**
   * Default key generator (IP + User ID if authenticated)
   */
  private defaultKeyGenerator(req: Request): string {
    const user = (req as any).user
    if (user) {
      return `user:${user.userId}`
    }
    return `ip:${req.ip}`
  }

  /**
   * Strict rate limiting for authentication endpoints
   */
  authLimit = this.limit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
    keyGenerator: (req) => `auth:${req.ip}`
  })

  /**
   * General API rate limiting
   */
  apiLimit = this.limit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: false
  })

  /**
   * Strict rate limiting for configuration changes
   */
  configLimit = this.limit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50, // 50 config changes per hour
    keyGenerator: (req) => {
      const user = (req as any).user
      return `config:${user?.userId || req.ip}`
    }
  })
}
```

### 6.3 Security Headers Middleware

**File: `/api/src/middleware/security-headers.middleware.ts`**

```typescript
import helmet from 'helmet'
import { Request, Response, NextFunction } from 'express'

export const securityHeadersMiddleware = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For styled-components
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.openai.com', 'https://api.anthropic.com'],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },

    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },

    // Prevent clickjacking
    frameguard: {
      action: 'deny'
    },

    // Prevent MIME type sniffing
    noSniff: true,

    // XSS Protection
    xssFilter: true,

    // Hide X-Powered-By header
    hidePoweredBy: true,

    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin'
    }
  })
}

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = () => {
  const csrf = require('csurf')
  return csrf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    }
  })
}
```

---

## 7. Secrets Management (Azure Key Vault Integration)

**File: `/api/src/services/secrets/key-vault.service.ts`**

```typescript
import { SecretClient } from '@azure/keyvault-secrets'
import { DefaultAzureCredential } from '@azure/identity'

export class KeyVaultService {
  private client: SecretClient

  constructor(vaultUrl: string) {
    const credential = new DefaultAzureCredential()
    this.client = new SecretClient(vaultUrl, credential)
  }

  /**
   * Get secret from Azure Key Vault with caching
   */
  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName)
      return secret.value
    } catch (error) {
      console.error(`Failed to retrieve secret ${secretName}:`, error)
      throw new Error(`Secret retrieval failed: ${secretName}`)
    }
  }

  /**
   * Set secret in Azure Key Vault
   */
  async setSecret(secretName: string, value: string): Promise<void> {
    try {
      await this.client.setSecret(secretName, value)
    } catch (error) {
      console.error(`Failed to set secret ${secretName}:`, error)
      throw new Error(`Secret storage failed: ${secretName}`)
    }
  }

  /**
   * Rotate secret (create new version)
   */
  async rotateSecret(secretName: string, newValue: string): Promise<void> {
    await this.setSecret(secretName, newValue)
    // Old version automatically becomes non-current
  }

  /**
   * Delete secret
   */
  async deleteSecret(secretName: string): Promise<void> {
    try {
      await this.client.beginDeleteSecret(secretName)
    } catch (error) {
      console.error(`Failed to delete secret ${secretName}:`, error)
      throw new Error(`Secret deletion failed: ${secretName}`)
    }
  }

  /**
   * Get database connection string from Key Vault
   */
  async getDatabaseConnectionString(): Promise<string> {
    return await this.getSecret('database-connection-string')
  }

  /**
   * Get API key from Key Vault
   */
  async getAPIKey(keyName: string): Promise<string> {
    return await this.getSecret(`api-key-${keyName}`)
  }

  /**
   * Get encryption key from Key Vault
   */
  async getEncryptionKey(keyName: string): Promise<string> {
    return await this.getSecret(`encryption-key-${keyName}`)
  }
}

// Singleton instance
export const keyVaultService = new KeyVaultService(
  process.env.AZURE_KEY_VAULT_URL || 'https://fleet-keyvault.vault.azure.net/'
)
```

---

## 8. Audit Logging System

**File: `/api/src/services/audit/audit.service.ts`**

```typescript
import { Pool } from 'pg'

export interface AuditLogEntry {
  action: string
  resourceType: string
  resourceId?: string | number
  userId?: string | number
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  requestMethod?: string
  requestPath?: string
  responseStatus?: number
  executionTimeMs?: number
  metadata?: Record<string, any>
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical'
}

export class AuditService {
  constructor(private db: Pool) {}

  /**
   * Log audit event (immutable)
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO audit_logs
         (action, resource_type, resource_id, user_id, session_id,
          ip_address, user_agent, request_method, request_path,
          response_status, execution_time_ms, metadata, severity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          entry.action,
          entry.resourceType,
          entry.resourceId?.toString(),
          entry.userId?.toString(),
          entry.sessionId,
          entry.ipAddress,
          entry.userAgent,
          entry.requestMethod,
          entry.requestPath,
          entry.responseStatus,
          entry.executionTimeMs,
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.severity || 'info'
        ]
      )
    } catch (error) {
      // CRITICAL: Audit logging failures should be handled
      console.error('AUDIT LOG FAILURE:', error)
      // Could send to backup logging system (e.g., Azure Monitor)
    }
  }

  /**
   * Generate daily digest for compliance
   */
  async generateDailyDigest(date: Date): Promise<void> {
    const result = await this.db.query(
      `SELECT
         COUNT(*) as total_events,
         COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
         COUNT(*) FILTER (WHERE severity = 'error') as error_events,
         COUNT(*) FILTER (WHERE severity = 'warning') as warning_events,
         COUNT(DISTINCT user_id) as unique_users
       FROM audit_logs
       WHERE DATE(event_timestamp) = $1`,
      [date.toISOString().split('T')[0]]
    )

    const stats = result.rows[0]

    // Generate cryptographic hash of day's logs for tamper detection
    const hashResult = await this.db.query(
      `SELECT MD5(string_agg(id::text || action || event_timestamp::text, ''))
       FROM audit_logs
       WHERE DATE(event_timestamp) = $1
       ORDER BY id`,
      [date.toISOString().split('T')[0]]
    )

    await this.db.query(
      `INSERT INTO audit_log_digests
       (digest_date, total_events, critical_events, error_events, warning_events, unique_users, digest_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (digest_date) DO UPDATE SET
         total_events = EXCLUDED.total_events,
         critical_events = EXCLUDED.critical_events,
         error_events = EXCLUDED.error_events,
         warning_events = EXCLUDED.warning_events,
         unique_users = EXCLUDED.unique_users,
         digest_hash = EXCLUDED.digest_hash`,
      [
        date.toISOString().split('T')[0],
        stats.total_events,
        stats.critical_events,
        stats.error_events,
        stats.warning_events,
        stats.unique_users,
        hashResult.rows[0].md5
      ]
    )
  }

  /**
   * Query audit logs with filtering
   */
  async query(filters: {
    action?: string
    resourceType?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    severity?: string
    limit?: number
  }): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1'
    const params: any[] = []
    let paramIndex = 1

    if (filters.action) {
      query += ` AND action = $${paramIndex++}`
      params.push(filters.action)
    }

    if (filters.resourceType) {
      query += ` AND resource_type = $${paramIndex++}`
      params.push(filters.resourceType)
    }

    if (filters.userId) {
      query += ` AND user_id = $${paramIndex++}`
      params.push(filters.userId)
    }

    if (filters.startDate) {
      query += ` AND event_timestamp >= $${paramIndex++}`
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      query += ` AND event_timestamp <= $${paramIndex++}`
      params.push(filters.endDate)
    }

    if (filters.severity) {
      query += ` AND severity = $${paramIndex++}`
      params.push(filters.severity)
    }

    query += ` ORDER BY event_timestamp DESC LIMIT $${paramIndex}`
    params.push(filters.limit || 1000)

    const result = await this.db.query(query, params)
    return result.rows
  }
}

// Convenience function
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  const auditService = new AuditService(/* db pool */)
  await auditService.log(entry)
}
```

---

## 9. Data Encryption

**File: `/api/src/services/crypto/encryption.service.ts`**

```typescript
import crypto from 'crypto'
import { keyVaultService } from '../secrets/key-vault.service'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

export class EncryptionService {
  private encryptionKey: Buffer

  async initialize(): Promise<void> {
    // Get encryption key from Azure Key Vault
    const keyBase64 = await keyVaultService.getEncryptionKey('master')
    this.encryptionKey = Buffer.from(keyBase64, 'base64')
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(plaintext: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize()
    }

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, this.encryptionKey, iv)

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Combine IV + encrypted data + auth tag
    const result = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ])

    return result.toString('base64')
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize()
    }

    const buffer = Buffer.from(encryptedData, 'base64')

    // Extract IV, encrypted data, and auth tag
    const iv = buffer.slice(0, IV_LENGTH)
    const authTag = buffer.slice(buffer.length - TAG_LENGTH)
    const encrypted = buffer.slice(IV_LENGTH, buffer.length - TAG_LENGTH)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, this.encryptionKey, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt')
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt')
    return await bcrypt.compare(password, hash)
  }

  /**
   * Generate cryptographically secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Hash sensitive data for indexing (one-way)
   */
  hashForIndex(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }
}

// Singleton instance
export const encryptionService = new EncryptionService()

// Convenience functions
export async function encrypt(data: string): Promise<string> {
  return await encryptionService.encrypt(data)
}

export async function decrypt(data: string): Promise<string> {
  return await encryptionService.decrypt(data)
}
```

---

## 10-15. [Additional Sections]

*The document would continue with detailed implementations for:*

- **Section 10:** Multi-Factor Authentication implementation
- **Section 11:** Data Governance Service (MDM, lineage, quality)
- **Section 12:** Compliance frameworks mapping (FISMA, NIST, SOC 2, GDPR)
- **Section 13:** Disaster recovery and backup strategies
- **Section 14:** Performance optimization and monitoring
- **Section 15:** Implementation roadmap with phases and timelines

---

## Implementation Roadmap

### Phase 1: Critical Security (Weeks 1-4)
- [ ] Implement JWT authentication on all API endpoints
- [ ] Add RBAC middleware
- [ ] Integrate Azure Key Vault for secrets
- [ ] Implement audit logging service
- [ ] Add rate limiting
- [ ] Security headers and CSRF protection

### Phase 2: Data Security (Weeks 5-8)
- [ ] Database schema updates (encryption, audit tables)
- [ ] Implement encryption service
- [ ] Encrypt sensitive columns
- [ ] Row-level security (RLS)
- [ ] Backup and recovery procedures

### Phase 3: Backend Services (Weeks 9-16)
- [ ] Configuration Management Service
- [ ] Policy Enforcement Service (server-side)
- [ ] Data Governance Service
- [ ] Approval workflow system
- [ ] Versioning and rollback

### Phase 4: Advanced Security (Weeks 17-20)
- [ ] MFA implementation
- [ ] Continuous security monitoring
- [ ] Automated threat detection
- [ ] Penetration testing
- [ ] Security audit

### Phase 5: Compliance & Documentation (Weeks 21-24)
- [ ] SOC 2 compliance documentation
- [ ] NIST 800-53 controls mapping
- [ ] Compliance reporting dashboard
- [ ] Third-party security audit
- [ ] Production deployment

---

## Conclusion

The current Fleet Management application has significant security vulnerabilities that make it unsuitable for government or financial sector deployment. This document provides a comprehensive roadmap to transform it into an enterprise-grade, secure-by-default system that would pass rigorous security audits.

**Critical Next Steps:**
1. Immediate implementation of JWT authentication
2. Move all policy enforcement server-side
3. Integrate Azure Key Vault
4. Implement comprehensive audit logging
5. Add encryption for sensitive data

**Estimated Total Implementation Time:** 24 weeks (6 months) with a dedicated team.

**Security Certification Targets:**
- SOC 2 Type II
- FedRAMP Moderate (for government)
- ISO 27001
- NIST 800-53
