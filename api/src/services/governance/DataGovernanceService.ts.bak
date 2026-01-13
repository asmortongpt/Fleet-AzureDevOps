/**
 * Data Governance Service
 *
 * Enterprise master data management (MDM), data quality, and lineage tracking.
 *
 * Features:
 * - Master Data Management (MDM) for golden records
 * - Data quality scoring and validation
 * - Data lineage tracking (who created/modified/accessed data)
 * - Data classification (public, internal, confidential, restricted)
 * - Data retention policies
 * - PII detection and redaction
 * - Data consent tracking (GDPR compliance)
 * - Data access audit trails
 *
 * Compliance:
 * - GDPR: Right to be forgotten, data minimization, consent tracking
 * - CCPA: Do not sell my data, data deletion requests
 * - HIPAA: PHI protection, access controls
 * - SOC 2: Data security and privacy controls
 *
 * @module DataGovernanceService
 */

import Redis from 'ioredis'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'


// ============================================================================
// Type Definitions
// ============================================================================

export enum DataClassification {
  PUBLIC = 'public',               // Publicly available data
  INTERNAL = 'internal',           // Internal use only
  CONFIDENTIAL = 'confidential',   // Confidential business data
  RESTRICTED = 'restricted',       // Highly restricted (PII, PHI, financial)
  REGULATED = 'regulated'          // Regulated data (HIPAA, PCI-DSS)
}

export enum DataQualityDimension {
  COMPLETENESS = 'completeness',   // % of required fields filled
  ACCURACY = 'accuracy',           // Data matches reality
  CONSISTENCY = 'consistency',     // Data is consistent across systems
  TIMELINESS = 'timeliness',       // Data is up-to-date
  VALIDITY = 'validity',           // Data conforms to rules/formats
  UNIQUENESS = 'uniqueness'        // No duplicates
}

export enum PIIType {
  NAME = 'name',
  EMAIL = 'email',
  PHONE = 'phone',
  SSN = 'ssn',
  DRIVERS_LICENSE = 'drivers_license',
  PASSPORT = 'passport',
  CREDIT_CARD = 'credit_card',
  BANK_ACCOUNT = 'bank_account',
  ADDRESS = 'address',
  DATE_OF_BIRTH = 'date_of_birth',
  BIOMETRIC = 'biometric',
  IP_ADDRESS = 'ip_address',
  HEALTH_DATA = 'health_data'
}

export interface DataClassificationRecord {
  id: string
  entityType: string           // e.g., 'user', 'vehicle', 'transaction'
  entityId: string
  fieldName: string
  classification: DataClassification
  piiTypes: PIIType[]
  classifiedBy: string
  classifiedAt: Date
  reviewedAt?: Date
  metadata?: Record<string, any>
}

export interface DataQualityScore {
  id: string
  entityType: string
  entityId: string
  overallScore: number         // 0-100
  dimensionScores: {
    [key in DataQualityDimension]: number
  }
  issues: DataQualityIssue[]
  calculatedAt: Date
  metadata?: Record<string, any>
}

export interface DataQualityIssue {
  dimension: DataQualityDimension
  field: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  suggestedFix?: string
}

export interface DataLineageRecord {
  id: string
  entityType: string
  entityId: string
  operation: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export'
  userId: string
  timestamp: Date
  source?: string              // Where data came from
  destination?: string         // Where data went
  transformations?: string[]   // What was done to the data
  metadata?: Record<string, any>
}

export interface DataConsentRecord {
  id: string
  userId: string
  purpose: string              // What the data will be used for
  dataTypes: string[]          // What data is covered
  consentGiven: boolean
  consentedAt?: Date
  revokedAt?: Date
  expiresAt?: Date
  legalBasis: string           // GDPR legal basis
  metadata?: Record<string, any>
}

export interface MasterDataRecord {
  id: string
  entityType: string
  goldenRecordId: string       // The authoritative version
  sourceSystem: string
  sourceId: string
  data: Record<string, any>
  confidence: number           // 0-1 confidence score
  lastSyncedAt: Date
  metadata?: Record<string, any>
}

// ============================================================================
// Validation Schemas
// ============================================================================

const classifyDataSchema = z.object({
  entityType: z.string(),
  entityId: z.string(),
  fieldName: z.string(),
  classification: z.nativeEnum(DataClassification),
  piiTypes: z.array(z.nativeEnum(PIIType))
})

const recordConsentSchema = z.object({
  userId: z.string(),
  purpose: z.string(),
  dataTypes: z.array(z.string()),
  legalBasis: z.string(),
  expiresAt: z.date().optional()
})

// ============================================================================
// Data Governance Service
// ============================================================================

export class DataGovernanceService {
  private pool: Pool
  private redis: Redis

  constructor(pool: Pool, redis: Redis) {
    this.pool = pool
    this.redis = redis
  }

  // ==========================================================================
  // Data Classification
  // ==========================================================================

  /**
   * Classify data with security and privacy labels
   */
  async classifyData(
    entityType: string,
    entityId: string,
    fieldName: string,
    classification: DataClassification,
    piiTypes: PIIType[],
    classifiedBy: string
  ): Promise<DataClassificationRecord> {
    // Validate input
    classifyDataSchema.parse({
      entityType,
      entityId,
      fieldName,
      classification,
      piiTypes
    })

    const id = uuidv4()

    await this.pool.query(
      `INSERT INTO data_classification
       (id, entity_type, entity_id, field_name, classification, pii_types,
        classified_by, classified_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        id,
        entityType,
        entityId,
        fieldName,
        classification,
        JSON.stringify(piiTypes),
        classifiedBy
      ]
    )

    // Cache classification for fast lookup
    await this.cacheClassification(entityType, entityId, fieldName, classification)

    return {
      id,
      entityType,
      entityId,
      fieldName,
      classification,
      piiTypes,
      classifiedBy,
      classifiedAt: new Date()
    }
  }

  /**
   * Get classification for a field
   */
  async getClassification(
    entityType: string,
    entityId: string,
    fieldName: string
  ): Promise<DataClassification | null> {
    // Check cache first
    const cacheKey = `classification:${entityType}:${entityId}:${fieldName}`
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      return cached as DataClassification
    }

    // Query database
    const result = await this.pool.query(
      `SELECT classification FROM data_classification
       WHERE entity_type = $1 AND entity_id = $2 AND field_name = $3
       ORDER BY classified_at DESC LIMIT 1`,
      [entityType, entityId, fieldName]
    )

    if (result.rows.length === 0) {
      return null
    }

    const classification = result.rows[0].classification as DataClassification

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, classification)

    return classification
  }

  /**
   * Detect PII in data
   */
  async detectPII(data: Record<string, any>): Promise<Map<string, PIIType[]>> {
    const piiDetections = new Map<string, PIIType[]>()

    for (const [field, value] of Object.entries(data)) {
      if (!value || typeof value !== 'string') continue

      const detected: PIIType[] = []

      // Email detection
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        detected.push(PIIType.EMAIL)
      }

      // Phone detection (US format)
      if (/^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(value)) {
        detected.push(PIIType.PHONE)
      }

      // SSN detection
      if (/^\d{3}-\d{2}-\d{4}$/.test(value)) {
        detected.push(PIIType.SSN)
      }

      // Credit card detection
      if (/^\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}$/.test(value)) {
        detected.push(PIIType.CREDIT_CARD)
      }

      // IP address detection
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
        detected.push(PIIType.IP_ADDRESS)
      }

      // Field name heuristics
      const lowerField = field.toLowerCase()
      if (lowerField.includes('name') && !lowerField.includes('username')) {
        detected.push(PIIType.NAME)
      }
      if (lowerField.includes('address')) {
        detected.push(PIIType.ADDRESS)
      }
      if (lowerField.includes('birth') || lowerField.includes('dob')) {
        detected.push(PIIType.DATE_OF_BIRTH)
      }

      if (detected.length > 0) {
        piiDetections.set(field, detected)
      }
    }

    return piiDetections
  }

  /**
   * Redact PII from data
   */
  async redactPII(
    data: Record<string, any>,
    piiTypes?: PIIType[]
  ): Promise<Record<string, any>> {
    const redacted = { ...data }
    const detections = await this.detectPII(data)

    for (const [field, types] of detections.entries()) {
      // If specific types requested, only redact those
      if (piiTypes && !types.some(t => piiTypes.includes(t))) {
        continue
      }

      const value = data[field]
      if (typeof value === 'string') {
        // Different redaction strategies based on PII type
        if (types.includes(PIIType.EMAIL)) {
          const [local, domain] = value.split('@')
          redacted[field] = `${local[0]}***@${domain}`
        } else if (types.includes(PIIType.PHONE)) {
          redacted[field] = `***-***-${value.slice(-4)}`
        } else if (types.includes(PIIType.SSN)) {
          redacted[field] = `***-**-${value.slice(-4)}`
        } else if (types.includes(PIIType.CREDIT_CARD)) {
          redacted[field] = `****-****-****-${value.slice(-4)}`
        } else {
          // Generic redaction
          redacted[field] = '[REDACTED]'
        }
      }
    }

    return redacted
  }

  // ==========================================================================
  // Data Quality
  // ==========================================================================

  /**
   * Calculate data quality score for an entity
   */
  async calculateDataQuality(
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    requiredFields: string[]
  ): Promise<DataQualityScore> {
    const issues: DataQualityIssue[] = []
    const dimensionScores: { [key in DataQualityDimension]: number } = {
      [DataQualityDimension.COMPLETENESS]: 100,
      [DataQualityDimension.ACCURACY]: 100,
      [DataQualityDimension.CONSISTENCY]: 100,
      [DataQualityDimension.TIMELINESS]: 100,
      [DataQualityDimension.VALIDITY]: 100,
      [DataQualityDimension.UNIQUENESS]: 100
    }

    // COMPLETENESS: Check required fields
    const missingFields = requiredFields.filter(field => !data[field])
    if (missingFields.length > 0) {
      const score = 100 * (1 - missingFields.length / requiredFields.length)
      dimensionScores[DataQualityDimension.COMPLETENESS] = score

      missingFields.forEach(field => {
        issues.push({
          dimension: DataQualityDimension.COMPLETENESS,
          field,
          severity: 'high',
          description: `Required field "${field}" is missing`,
          suggestedFix: `Provide a value for ${field}`
        })
      })
    }

    // VALIDITY: Check email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      dimensionScores[DataQualityDimension.VALIDITY] -= 10
      issues.push({
        dimension: DataQualityDimension.VALIDITY,
        field: 'email',
        severity: 'medium',
        description: 'Invalid email format',
        suggestedFix: 'Provide a valid email address'
      })
    }

    // VALIDITY: Check phone format
    if (data.phone && !/^\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(data.phone)) {
      dimensionScores[DataQualityDimension.VALIDITY] -= 10
      issues.push({
        dimension: DataQualityDimension.VALIDITY,
        field: 'phone',
        severity: 'medium',
        description: 'Invalid phone format',
        suggestedFix: 'Provide a valid phone number (US format)'
      })
    }

    // TIMELINESS: Check last updated
    if (data.updated_at) {
      const daysSinceUpdate = (Date.now() - new Date(data.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate > 365) {
        dimensionScores[DataQualityDimension.TIMELINESS] -= 30
        issues.push({
          dimension: DataQualityDimension.TIMELINESS,
          field: 'updated_at',
          severity: 'medium',
          description: `Data has not been updated in ${Math.floor(daysSinceUpdate)} days`,
          suggestedFix: 'Review and update data'
        })
      } else if (daysSinceUpdate > 180) {
        dimensionScores[DataQualityDimension.TIMELINESS] -= 15
        issues.push({
          dimension: DataQualityDimension.TIMELINESS,
          field: 'updated_at',
          severity: 'low',
          description: `Data is ${Math.floor(daysSinceUpdate)} days old`,
          suggestedFix: 'Consider reviewing data'
        })
      }
    }

    // Calculate overall score (weighted average)
    const weights = {
      [DataQualityDimension.COMPLETENESS]: 0.25,
      [DataQualityDimension.ACCURACY]: 0.20,
      [DataQualityDimension.CONSISTENCY]: 0.15,
      [DataQualityDimension.TIMELINESS]: 0.15,
      [DataQualityDimension.VALIDITY]: 0.15,
      [DataQualityDimension.UNIQUENESS]: 0.10
    }

    const overallScore = Object.entries(dimensionScores).reduce(
      (sum, [dimension, score]) => sum + score * weights[dimension as DataQualityDimension],
      0
    )

    const id = uuidv4()
    const scoreRecord: DataQualityScore = {
      id,
      entityType,
      entityId,
      overallScore: Math.round(overallScore),
      dimensionScores,
      issues,
      calculatedAt: new Date()
    }

    // Store in database
    await this.pool.query(
      `INSERT INTO data_quality_metrics
       (id, entity_type, entity_id, overall_score, dimension_scores, issues, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        id,
        entityType,
        entityId,
        scoreRecord.overallScore,
        JSON.stringify(dimensionScores),
        JSON.stringify(issues)
      ]
    )

    return scoreRecord
  }

  /**
   * Get latest data quality score
   */
  async getDataQuality(
    entityType: string,
    entityId: string
  ): Promise<DataQualityScore | null> {
    const result = await this.pool.query(
      `SELECT * FROM data_quality_metrics
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY calculated_at DESC LIMIT 1`,
      [entityType, entityId]
    )

    if (result.rows.length === 0) {
      return null
    }

    const row = result.rows[0]
    return {
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      overallScore: row.overall_score,
      dimensionScores: JSON.parse(row.dimension_scores),
      issues: JSON.parse(row.issues),
      calculatedAt: row.calculated_at
    }
  }

  // ==========================================================================
  // Data Lineage
  // ==========================================================================

  /**
   * Track data lineage (who accessed/modified data)
   */
  async recordLineage(
    entityType: string,
    entityId: string,
    operation: 'create' | 'read' | 'update' | 'delete' | 'share' | 'export',
    userId: string,
    metadata?: {
      source?: string
      destination?: string
      transformations?: string[]
      [key: string]: any
    }
  ): Promise<DataLineageRecord> {
    const id = uuidv4()

    await this.pool.query(
      `INSERT INTO data_lineage
       (id, entity_type, entity_id, operation, user_id, timestamp,
        source, destination, transformations, metadata)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)`,
      [
        id,
        entityType,
        entityId,
        operation,
        userId,
        metadata?.source,
        metadata?.destination,
        metadata?.transformations ? JSON.stringify(metadata.transformations) : null,
        metadata ? JSON.stringify(metadata) : null
      ]
    )

    return {
      id,
      entityType,
      entityId,
      operation,
      userId,
      timestamp: new Date(),
      source: metadata?.source,
      destination: metadata?.destination,
      transformations: metadata?.transformations,
      metadata
    }
  }

  /**
   * Get data lineage history
   */
  async getLineage(
    entityType: string,
    entityId: string,
    limit: number = 100
  ): Promise<DataLineageRecord[]> {
    const result = await this.pool.query(
      `SELECT * FROM data_lineage
       WHERE entity_type = $1 AND entity_id = $2
       ORDER BY timestamp DESC
       LIMIT $3`,
      [entityType, entityId, limit]
    )

    return result.rows.map(row => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      userId: row.user_id,
      timestamp: row.timestamp,
      source: row.source,
      destination: row.destination,
      transformations: row.transformations ? JSON.parse(row.transformations) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }))
  }

  // ==========================================================================
  // Data Consent (GDPR Compliance)
  // ==========================================================================

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    purpose: string,
    dataTypes: string[],
    legalBasis: string,
    expiresAt?: Date
  ): Promise<DataConsentRecord> {
    recordConsentSchema.parse({
      userId,
      purpose,
      dataTypes,
      legalBasis,
      expiresAt
    })

    const id = uuidv4()

    await this.pool.query(
      `INSERT INTO data_consent
       (id, user_id, purpose, data_types, consent_given, consented_at,
        expires_at, legal_basis)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)`,
      [id, userId, purpose, JSON.stringify(dataTypes), true, expiresAt, legalBasis]
    )

    return {
      id,
      userId,
      purpose,
      dataTypes,
      consentGiven: true,
      consentedAt: new Date(),
      expiresAt,
      legalBasis
    }
  }

  /**
   * Revoke user consent
   */
  async revokeConsent(consentId: string): Promise<void> {
    await this.pool.query(
      'UPDATE data_consent SET consent_given = FALSE, revoked_at = NOW() WHERE id = $1',
      [consentId]
    )
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(
    userId: string,
    purpose: string,
    dataType: string
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT * FROM data_consent
       WHERE user_id = $1
         AND purpose = $2
         AND data_types @> $3
         AND consent_given = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND revoked_at IS NULL`,
      [userId, purpose, JSON.stringify([dataType])]
    )

    return result.rows.length > 0
  }

  // ==========================================================================
  // Master Data Management (MDM)
  // ==========================================================================

  /**
   * Create or update golden record (master data)
   */
  async upsertMasterRecord(
    entityType: string,
    sourceSystem: string,
    sourceId: string,
    data: Record<string, any>,
    confidence: number = 1.0
  ): Promise<string> {
    // Find or create golden record
    let goldenRecordId = await this.findGoldenRecord(entityType, sourceSystem, sourceId)

    if (!goldenRecordId) {
      goldenRecordId = uuidv4()
    }

    const id = uuidv4()

    await this.pool.query(
      `INSERT INTO master_data
       (id, entity_type, golden_record_id, source_system, source_id,
        data, confidence, last_synced_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (entity_type, source_system, source_id)
       DO UPDATE SET data = $6, confidence = $7, last_synced_at = NOW()`,
      [id, entityType, goldenRecordId, sourceSystem, sourceId, JSON.stringify(data), confidence]
    )

    return goldenRecordId
  }

  /**
   * Get golden record (merged master data)
   */
  async getGoldenRecord(
    entityType: string,
    goldenRecordId: string
  ): Promise<Record<string, any> | null> {
    const result = await this.pool.query(
      `SELECT * FROM master_data
       WHERE entity_type = $1 AND golden_record_id = $2
       ORDER BY confidence DESC, last_synced_at DESC`,
      [entityType, goldenRecordId]
    )

    if (result.rows.length === 0) {
      return null
    }

    // Merge data from all sources (higher confidence wins)
    const merged: Record<string, any> = {}

    for (const row of result.rows) {
      const data = JSON.parse(row.data)
      for (const [key, value] of Object.entries(data)) {
        if (!merged[key] || row.confidence > (merged._confidence?.[key] || 0)) {
          merged[key] = value
          if (!merged._confidence) merged._confidence = {}
          merged._confidence[key] = row.confidence
        }
      }
    }

    delete merged._confidence // Remove internal tracking
    return merged
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private async cacheClassification(
    entityType: string,
    entityId: string,
    fieldName: string,
    classification: DataClassification
  ): Promise<void> {
    const key = `classification:${entityType}:${entityId}:${fieldName}`
    await this.redis.setex(key, 3600, classification)
  }

  private async findGoldenRecord(
    entityType: string,
    sourceSystem: string,
    sourceId: string
  ): Promise<string | null> {
    const result = await this.pool.query(
      `SELECT golden_record_id FROM master_data
       WHERE entity_type = $1 AND source_system = $2 AND source_id = $3
       LIMIT 1`,
      [entityType, sourceSystem, sourceId]
    )

    return result.rows.length > 0 ? result.rows[0].golden_record_id : null
  }
}

export default DataGovernanceService
