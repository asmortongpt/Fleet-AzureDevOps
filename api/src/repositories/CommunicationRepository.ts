import { Pool } from 'pg'
import { isValidIdentifier } from '../utils/sql-safety'

export interface Communication {
  id: number
  tenant_id: number
  communication_type?: string
  subject?: string
  body?: string
  from_contact_name?: string
  from_user_id?: number
  communication_datetime?: Date
  status?: string
  ai_detected_category?: string
  manual_category?: string
  ai_detected_priority?: string
  manual_priority?: string
  requires_follow_up?: boolean
  follow_up_completed?: boolean
  follow_up_by_date?: Date
  created_at: Date
  updated_at: Date
  created_by?: number
  updated_by?: number
}

export interface CommunicationFilters {
  communication_type?: string
  category?: string
  priority?: string
  status?: string
  search?: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface LinkedEntity {
  entity_type: string
  entity_id: number
  link_type?: string
}

export interface CommunicationTemplate {
  id: number
  tenant_id: number
  name?: string
  type?: string
  subject?: string
  body?: string
  variables?: any
  is_active?: boolean
  created_at: Date
  updated_at: Date
}

export interface DashboardStats {
  summary: {
    total: number
    pending_followups: number
  }
  by_type: Array<{ communication_type: string; count: number }>
  by_priority: Array<{ priority: string; count: number }>
  overdue: {
    overdue_followups: number
  }
}

/**
 * CommunicationRepository - Handles all database operations for Communications
 * SECURITY: All queries use parameterized placeholders ($1, $2, $3) and tenant isolation
 */
export class CommunicationRepository {
  protected tableName = 'communications'

  constructor(private pool: Pool) {}

  /**
   * Find all communications with dynamic filters and pagination
   * Used by: GET /communications
   */
  async findAllWithFilters(
    filters: CommunicationFilters,
    pagination: PaginationOptions,
    tenantId: number
  ): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 50 } = pagination
    const offset = (Number(page) - 1) * Number(limit)

    // SECURITY: Start with tenant_id filter
    let query = `
      SELECT c.*,
             from_user.first_name || ' ' || from_user.last_name as from_user_name,
             COUNT(DISTINCT cel.id) as linked_entities_count
      FROM communications c
      LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
      LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
      WHERE c.tenant_id = $1
    `
    const params: any[] = [tenantId]
    let paramIndex = 2

    // SECURITY: Apply filters with parameterized queries
    if (filters.communication_type) {
      query += ` AND c.communication_type = $${paramIndex}`
      params.push(filters.communication_type)
      paramIndex++
    }

    if (filters.category) {
      query += ` AND (c.ai_detected_category = $${paramIndex} OR c.manual_category = $${paramIndex})`
      params.push(filters.category)
      paramIndex++
    }

    if (filters.priority) {
      query += ` AND (c.ai_detected_priority = $${paramIndex} OR c.manual_priority = $${paramIndex})`
      params.push(filters.priority)
      paramIndex++
    }

    if (filters.status) {
      query += ` AND c.status = $${paramIndex}`
      params.push(filters.status)
      paramIndex++
    }

    if (filters.search) {
      query += ` AND (
        c.subject ILIKE $${paramIndex} OR
        c.body ILIKE $${paramIndex} OR
        c.from_contact_name ILIKE $${paramIndex}
      )`
      params.push(`%${filters.search}%`)
      paramIndex++
    }

    query += ` GROUP BY c.id, from_user.first_name, from_user.last_name`
    query += ` ORDER BY c.communication_datetime DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    const result = await this.pool.query(query, params)

    // SECURITY: Count with tenant filter
    const countQuery = `
      SELECT COUNT(DISTINCT c.id)
      FROM communications c
      WHERE c.tenant_id = $1
    `
    const countResult = await this.pool.query(countQuery, [tenantId])

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Find communication by ID with details (user, links, attachments)
   * Used by: GET /communications/:id
   */
  async findByIdWithDetails(id: number, tenantId: number): Promise<any | null> {
    // SECURITY: Filter by tenant_id
    const commResult = await this.pool.query(
      `SELECT c.*,
              from_user.first_name || ' ' || from_user.last_name as from_user_name
       FROM communications c
       LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
       WHERE c.id = $1 AND c.tenant_id = $2`,
      [id, tenantId]
    )

    if (commResult.rows.length === 0) {
      return null
    }

    // SECURITY: Get linked entities - verify tenant ownership
    const linksResult = await this.pool.query(
      `SELECT cel.entity_type, cel.entity_id, cel.link_type, cel.relevance_score, cel.auto_detected
       FROM communication_entity_links cel
       JOIN communications c ON cel.communication_id = c.id
       WHERE cel.communication_id = $1 AND c.tenant_id = $2
       ORDER BY cel.relevance_score DESC`,
      [id, tenantId]
    )

    // SECURITY: Get attachments - verify tenant ownership
    const attachmentsResult = await this.pool.query(
      `SELECT
        ca.id,
        ca.communication_id,
        ca.file_name,
        ca.file_path,
        ca.file_type,
        ca.file_size,
        ca.created_at
       FROM communication_attachments ca
       JOIN communications c ON ca.communication_id = c.id
       WHERE ca.communication_id = $1 AND c.tenant_id = $2`,
      [id, tenantId]
    )

    return {
      ...commResult.rows[0],
      linked_entities: linksResult.rows,
      attachments: attachmentsResult.rows
    }
  }

  /**
   * Create communication with linked entities
   * Used by: POST /communications
   */
  async createWithLinks(
    data: Partial<Communication>,
    linkedEntities: LinkedEntity[] | undefined,
    tenantId: number,
    userId: number
  ): Promise<Communication> {
    // SECURITY: Add tenant_id and created_by
    const columns = Object.keys(data)

    // Validate column names
    for (const col of columns) {
      if (!isValidIdentifier(col)) {
        throw new Error(`Invalid column name: ${col}`)
      }
    }

    const values = Object.values(data)
    const columnNames = ['tenant_id', 'created_by', ...columns].join(', ')
    const placeholders = [1, 2, ...columns.map((_, i) => i + 3)].map(n => `$${n}`).join(', ')

    const result = await this.pool.query(
      `INSERT INTO communications (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [tenantId, userId, ...values]
    )

    const communicationId = result.rows[0].id

    // Link entities if provided (SECURITY: Batch insert)
    if (linkedEntities && Array.isArray(linkedEntities) && linkedEntities.length > 0) {
      const linkValues: any[] = []
      const linkPlaceholders: string[] = []

      linkedEntities.forEach((link, index) => {
        const baseIndex = index * 4 + 1
        linkPlaceholders.push(`($${baseIndex}, $${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3})`)
        linkValues.push(
          communicationId,
          link.entity_type,
          link.entity_id,
          link.link_type || 'Related'
        )
      })

      await this.pool.query(
        `INSERT INTO communication_entity_links (communication_id, entity_type, entity_id, link_type, manually_added)
         VALUES ${linkPlaceholders.join(', ')}
         ON CONFLICT (communication_id, entity_type, entity_id) DO NOTHING`,
        linkValues
      )
    }

    return result.rows[0]
  }

  /**
   * Update communication
   * Used by: PUT /communications/:id
   */
  async updateCommunication(
    id: number,
    data: Partial<Communication>,
    tenantId: number,
    userId: number
  ): Promise<Communication | null> {
    // Validate column names
    const columns = Object.keys(data)
    for (const col of columns) {
      if (!isValidIdentifier(col)) {
        throw new Error(`Invalid column name: ${col}`)
      }
    }

    const fields = columns
      .map((key, i) => `${key} = $${i + 4}`)
      .join(', ')
    const values = Object.values(data)

    // SECURITY: Filter by tenant_id
    const result = await this.pool.query(
      `UPDATE communications
       SET ${fields}, updated_at = NOW(), updated_by = $2
       WHERE id = $1 AND tenant_id = $3
       RETURNING *`,
      [id, userId, tenantId, ...values]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  /**
   * Link entity to communication
   * Used by: POST /communications/:id/link
   */
  async linkEntity(
    communicationId: number,
    entityType: string,
    entityId: number,
    linkType: string,
    tenantId: number
  ): Promise<any> {
    // SECURITY: Validate communication belongs to tenant
    const commCheck = await this.pool.query(
      `SELECT id FROM communications WHERE id = $1 AND tenant_id = $2`,
      [communicationId, tenantId]
    )

    if (commCheck.rows.length === 0) {
      return null // Communication not found or doesn't belong to tenant
    }

    const result = await this.pool.query(
      `INSERT INTO communication_entity_links (communication_id, entity_type, entity_id, link_type, manually_added)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (communication_id, entity_type, entity_id) DO UPDATE
       SET link_type = $4
       RETURNING *`,
      [communicationId, entityType, entityId, linkType]
    )

    return result.rows[0]
  }

  /**
   * Unlink entity from communication
   * Used by: DELETE /communications/:id/link/:link_id
   */
  async unlinkEntity(
    linkId: number,
    communicationId: number,
    tenantId: number
  ): Promise<boolean> {
    // SECURITY: Verify communication belongs to tenant before deleting link
    const result = await this.pool.query(
      `DELETE FROM communication_entity_links cel
       USING communications c
       WHERE cel.id = $1
         AND cel.communication_id = $2
         AND cel.communication_id = c.id
         AND c.tenant_id = $3
       RETURNING cel.id`,
      [linkId, communicationId, tenantId]
    )

    return result.rows.length > 0
  }

  /**
   * Find communications by entity type and ID
   * Used by: GET /communications/entity/:entity_type/:entity_id
   */
  async findByEntityType(
    entityType: string,
    entityId: number,
    pagination: PaginationOptions,
    tenantId: number
  ): Promise<{ data: any[]; total: number }> {
    const { page = 1, limit = 50 } = pagination
    const offset = (Number(page) - 1) * Number(limit)

    // SECURITY: Filter by tenant_id
    const result = await this.pool.query(
      `SELECT c.*,
              cel.link_type,
              cel.relevance_score,
              from_user.first_name || ' ' || from_user.last_name as from_user_name
       FROM communications c
       JOIN communication_entity_links cel ON c.id = cel.communication_id
       LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
       WHERE cel.entity_type = $1 AND cel.entity_id = $2 AND c.tenant_id = $3
       ORDER BY c.communication_datetime DESC
       LIMIT $4 OFFSET $5`,
      [entityType, entityId, tenantId, limit, offset]
    )

    // SECURITY: Count with tenant filter
    const countResult = await this.pool.query(
      `SELECT COUNT(*)
       FROM communication_entity_links cel
       JOIN communications c ON cel.communication_id = c.id
       WHERE cel.entity_type = $1 AND cel.entity_id = $2 AND c.tenant_id = $3`,
      [entityType, entityId, tenantId]
    )

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count)
    }
  }

  /**
   * Find pending follow-ups
   * Used by: GET /communications/follow-ups/pending
   */
  async findPendingFollowUps(tenantId: number): Promise<any[]> {
    // SECURITY: Filter by tenant_id
    const result = await this.pool.query(
      `SELECT c.*,
              from_user.first_name || ' ' || from_user.last_name as from_user_name,
              CASE
                WHEN c.follow_up_by_date < CURRENT_DATE THEN 'Overdue'
                WHEN c.follow_up_by_date = CURRENT_DATE THEN 'Due Today'
                ELSE 'Upcoming'
              END AS follow_up_status,
              COUNT(DISTINCT cel.id) as linked_entities_count
       FROM communications c
       LEFT JOIN drivers from_user ON c.from_user_id = from_user.id
       LEFT JOIN communication_entity_links cel ON c.id = cel.communication_id
       WHERE c.tenant_id = $1
         AND c.requires_follow_up = TRUE
         AND c.follow_up_completed = FALSE
         AND c.status != 'Closed'
       GROUP BY c.id, from_user.first_name, from_user.last_name
       ORDER BY c.follow_up_by_date ASC NULLS LAST`,
      [tenantId]
    )

    return result.rows
  }

  /**
   * Find communication templates
   * Used by: GET /communications/templates
   */
  async findTemplates(category: string | undefined, tenantId: number): Promise<CommunicationTemplate[]> {
    // SECURITY: Filter by tenant_id
    let query = `SELECT
      id,
      tenant_id,
      name,
      type,
      subject,
      body,
      variables,
      is_active,
      created_at,
      updated_at
    FROM communication_templates
    WHERE tenant_id = $1 AND is_active = TRUE`
    const params: any[] = [tenantId]

    if (category) {
      query += ` AND template_category = $2`
      params.push(category)
    }

    query += ` ORDER BY template_name`

    const result = await this.pool.query(query, params)
    return result.rows
  }

  /**
   * Create communication template
   * Used by: POST /communications/templates
   */
  async createTemplate(
    data: Partial<CommunicationTemplate>,
    tenantId: number,
    userId: number
  ): Promise<CommunicationTemplate> {
    // Validate column names
    const columns = Object.keys(data)
    for (const col of columns) {
      if (!isValidIdentifier(col)) {
        throw new Error(`Invalid column name: ${col}`)
      }
    }

    const values = Object.values(data)
    const columnNames = ['tenant_id', 'created_by', ...columns].join(', ')
    const placeholders = [1, 2, ...columns.map((_, i) => i + 3)].map(n => `$${n}`).join(', ')

    const result = await this.pool.query(
      `INSERT INTO communication_templates (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [tenantId, userId, ...values]
    )

    return result.rows[0]
  }

  /**
   * Get dashboard statistics
   * Used by: GET /communications/dashboard
   */
  async getDashboardStats(tenantId: number): Promise<DashboardStats> {
    // SECURITY: Total communications this month
    const totalResult = await this.pool.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN requires_follow_up = TRUE AND follow_up_completed = FALSE THEN 1 END) as pending_followups
       FROM communications c
       WHERE c.tenant_id = $1
       AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)`,
      [tenantId]
    )

    // SECURITY: By type
    const byTypeResult = await this.pool.query(
      `SELECT communication_type, COUNT(*) as count
       FROM communications c
       WHERE c.tenant_id = $1
       AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY communication_type
       ORDER BY count DESC`,
      [tenantId]
    )

    // SECURITY: By priority
    const byPriorityResult = await this.pool.query(
      `SELECT COALESCE(ai_detected_priority, manual_priority, 'Unassigned') as priority,
              COUNT(*) as count
       FROM communications c
       WHERE c.tenant_id = $1
       AND c.communication_datetime >= DATE_TRUNC('month', CURRENT_DATE)
       GROUP BY priority
       ORDER BY count DESC`,
      [tenantId]
    )

    // SECURITY: Overdue follow-ups
    const overdueResult = await this.pool.query(
      `SELECT COUNT(*) as overdue_followups
       FROM communications c
       WHERE c.tenant_id = $1
       AND c.requires_follow_up = TRUE
       AND c.follow_up_completed = FALSE
       AND c.follow_up_by_date < CURRENT_DATE`,
      [tenantId]
    )

    return {
      summary: totalResult.rows[0],
      by_type: byTypeResult.rows,
      by_priority: byPriorityResult.rows,
      overdue: overdueResult.rows[0]
    }
  }
}
