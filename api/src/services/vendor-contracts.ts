/**
 * VENDOR CONTRACT MANAGEMENT SERVICE
 * Phase 3 - Agent 8: Manage vendor contracts, SLA tracking, and expiration alerts
 * Security: Parameterized queries only, tenant isolation enforced
 */

import { Pool } from 'pg';
import {
  VendorContract,
  CreateVendorContractInput,
  UpdateVendorContractInput,
  ExpiringContract,
  SLAComplianceMetrics,
  VendorContact,
  CreateVendorContactInput,
  UpdateVendorContactInput,
} from '../types/vendor-management';

export class VendorContractService {
  constructor(private pool: Pool) {}

  /**
   * Create a new vendor contract
   */
  async createContract(
    input: CreateVendorContractInput,
    tenantId: string,
    createdBy: string
  ): Promise<VendorContract> {
    const query = `
      INSERT INTO vendor_contracts (
        tenant_id,
        vendor_id,
        contract_number,
        contract_type,
        start_date,
        end_date,
        contract_value,
        payment_terms,
        service_level_agreement,
        sla_response_time_hours,
        sla_resolution_time_hours,
        pricing_terms,
        auto_renew,
        renewal_notice_days,
        termination_clause,
        early_termination_penalty,
        contract_document_url,
        signed_contract_url,
        status,
        notes,
        metadata,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22
      )
      RETURNING *
    `;

    const values = [
      tenantId,
      input.vendor_id,
      input.contract_number,
      input.contract_type,
      input.start_date,
      input.end_date,
      input.contract_value || null,
      input.payment_terms || null,
      input.service_level_agreement || null,
      input.sla_response_time_hours || null,
      input.sla_resolution_time_hours || null,
      JSON.stringify(input.pricing_terms || {}),
      input.auto_renew !== undefined ? input.auto_renew : false,
      input.renewal_notice_days || 60,
      input.termination_clause || null,
      input.early_termination_penalty || null,
      input.contract_document_url || null,
      input.signed_contract_url || null,
      input.status || 'draft',
      input.notes || null,
      JSON.stringify(input.metadata || {}),
      createdBy,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update an existing vendor contract
   */
  async updateContract(
    contractId: string,
    input: UpdateVendorContractInput,
    tenantId: string
  ): Promise<VendorContract> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    // Build dynamic update query
    if (input.contract_number !== undefined) {
      updates.push(`contract_number = $${paramCount++}`);
      values.push(input.contract_number);
    }
    if (input.contract_type !== undefined) {
      updates.push(`contract_type = $${paramCount++}`);
      values.push(input.contract_type);
    }
    if (input.start_date !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(input.start_date);
    }
    if (input.end_date !== undefined) {
      updates.push(`end_date = $${paramCount++}`);
      values.push(input.end_date);
    }
    if (input.contract_value !== undefined) {
      updates.push(`contract_value = $${paramCount++}`);
      values.push(input.contract_value);
    }
    if (input.payment_terms !== undefined) {
      updates.push(`payment_terms = $${paramCount++}`);
      values.push(input.payment_terms);
    }
    if (input.service_level_agreement !== undefined) {
      updates.push(`service_level_agreement = $${paramCount++}`);
      values.push(input.service_level_agreement);
    }
    if (input.sla_response_time_hours !== undefined) {
      updates.push(`sla_response_time_hours = $${paramCount++}`);
      values.push(input.sla_response_time_hours);
    }
    if (input.sla_resolution_time_hours !== undefined) {
      updates.push(`sla_resolution_time_hours = $${paramCount++}`);
      values.push(input.sla_resolution_time_hours);
    }
    if (input.pricing_terms !== undefined) {
      updates.push(`pricing_terms = $${paramCount++}`);
      values.push(JSON.stringify(input.pricing_terms));
    }
    if (input.auto_renew !== undefined) {
      updates.push(`auto_renew = $${paramCount++}`);
      values.push(input.auto_renew);
    }
    if (input.renewal_notice_days !== undefined) {
      updates.push(`renewal_notice_days = $${paramCount++}`);
      values.push(input.renewal_notice_days);
    }
    if (input.termination_clause !== undefined) {
      updates.push(`termination_clause = $${paramCount++}`);
      values.push(input.termination_clause);
    }
    if (input.early_termination_penalty !== undefined) {
      updates.push(`early_termination_penalty = $${paramCount++}`);
      values.push(input.early_termination_penalty);
    }
    if (input.contract_document_url !== undefined) {
      updates.push(`contract_document_url = $${paramCount++}`);
      values.push(input.contract_document_url);
    }
    if (input.signed_contract_url !== undefined) {
      updates.push(`signed_contract_url = $${paramCount++}`);
      values.push(input.signed_contract_url);
    }
    if (input.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(input.status);
    }
    if (input.terminated_date !== undefined) {
      updates.push(`terminated_date = $${paramCount++}`);
      values.push(input.terminated_date);
    }
    if (input.termination_reason !== undefined) {
      updates.push(`termination_reason = $${paramCount++}`);
      values.push(input.termination_reason);
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(input.notes);
    }
    if (input.metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      values.push(JSON.stringify(input.metadata));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(contractId, tenantId);

    const query = `
      UPDATE vendor_contracts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
        AND tenant_id = $${paramCount++}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }

    return result.rows[0];
  }

  /**
   * Get expiring contracts within specified days
   */
  async getExpiringContracts(
    daysAhead: number,
    tenantId: string
  ): Promise<ExpiringContract[]> {
    const query = `
      SELECT * FROM v_expiring_vendor_contracts
      WHERE tenant_id = $1
        AND days_until_expiry <= $2
      ORDER BY days_until_expiry ASC
    `;

    const result = await this.pool.query(query, [tenantId, daysAhead]);
    return result.rows;
  }

  /**
   * Get contracts requiring renewal notification
   */
  async getContractsNeedingRenewalNotice(
    tenantId: string
  ): Promise<ExpiringContract[]> {
    const query = `
      SELECT * FROM v_expiring_vendor_contracts
      WHERE tenant_id = $1
        AND days_until_expiry <= renewal_notice_days
        AND days_until_expiry > 0
        AND status = 'active'
      ORDER BY days_until_expiry ASC
    `;

    const result = await this.pool.query(query, [tenantId]);
    return result.rows;
  }

  /**
   * Calculate SLA compliance for a contract
   */
  async calculateSLACompliance(
    contractId: string,
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SLAComplianceMetrics | null> {
    // This would integrate with work orders or incidents to track SLA compliance
    // For now, return placeholder metrics
    const query = `
      SELECT
        vc.id as contract_id,
        vc.vendor_id,
        v.name as vendor_name,
        vc.sla_response_time_hours,
        vc.sla_resolution_time_hours,
        0 as total_incidents,
        0 as response_time_violations,
        0 as resolution_time_violations,
        100.0 as compliance_percentage
      FROM vendor_contracts vc
      INNER JOIN vendors v ON vc.vendor_id = v.id
      WHERE vc.id = $1
        AND vc.tenant_id = $2
    `;

    const result = await this.pool.query(query, [contractId, tenantId]);
    return result.rows[0] || null;
  }

  /**
   * Get total spend by vendor for a period
   */
  async getVendorSpendByContract(
    vendorId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string
  ): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(total_amount), 0) as total_spend
      FROM purchase_orders
      WHERE vendor_id = $1
        AND tenant_id = $2
        AND order_date BETWEEN $3 AND $4
        AND status NOT IN ('cancelled', 'draft')
    `;

    const result = await this.pool.query(query, [
      vendorId,
      tenantId,
      startDate,
      endDate,
    ]);

    return Number(result.rows[0]?.total_spend || 0);
  }

  /**
   * Terminate a contract
   */
  async terminateContract(
    contractId: string,
    reason: string,
    terminatedBy: string,
    tenantId: string
  ): Promise<VendorContract> {
    const query = `
      UPDATE vendor_contracts
      SET status = 'terminated',
          terminated_date = CURRENT_DATE,
          termination_reason = $1,
          terminated_by = $2,
          updated_at = NOW()
      WHERE id = $3
        AND tenant_id = $4
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      reason,
      terminatedBy,
      contractId,
      tenantId,
    ]);

    if (result.rows.length === 0) {
      throw new Error('Contract not found');
    }

    return result.rows[0];
  }

  /**
   * Renew a contract (create new contract based on existing)
   */
  async renewContract(
    contractId: string,
    newEndDate: Date,
    createdBy: string,
    tenantId: string
  ): Promise<VendorContract> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Get existing contract
      const getQuery = `
        SELECT * FROM vendor_contracts
        WHERE id = $1 AND tenant_id = $2
      `;
      const existing = await client.query(getQuery, [contractId, tenantId]);

      if (existing.rows.length === 0) {
        throw new Error('Contract not found');
      }

      const oldContract = existing.rows[0];

      // Mark old contract as renewed
      const updateQuery = `
        UPDATE vendor_contracts
        SET status = 'renewed', updated_at = NOW()
        WHERE id = $1
      `;
      await client.query(updateQuery, [contractId]);

      // Create new contract
      const createQuery = `
        INSERT INTO vendor_contracts (
          tenant_id,
          vendor_id,
          contract_number,
          contract_type,
          start_date,
          end_date,
          contract_value,
          payment_terms,
          service_level_agreement,
          sla_response_time_hours,
          sla_resolution_time_hours,
          pricing_terms,
          auto_renew,
          renewal_notice_days,
          termination_clause,
          early_termination_penalty,
          status,
          notes,
          metadata,
          created_by
        ) VALUES (
          $1, $2, $3 || '-R' || extract(year from now())::text, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        RETURNING *
      `;

      const newContract = await client.query(createQuery, [
        tenantId,
        oldContract.vendor_id,
        oldContract.contract_number,
        oldContract.contract_type,
        oldContract.end_date, // New start is old end
        newEndDate,
        oldContract.contract_value,
        oldContract.payment_terms,
        oldContract.service_level_agreement,
        oldContract.sla_response_time_hours,
        oldContract.sla_resolution_time_hours,
        oldContract.pricing_terms,
        oldContract.auto_renew,
        oldContract.renewal_notice_days,
        oldContract.termination_clause,
        oldContract.early_termination_penalty,
        'active',
        `Renewed from contract ${oldContract.contract_number}`,
        oldContract.metadata,
        createdBy,
      ]);

      await client.query('COMMIT');
      return newContract.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // ============================================================================
  // VENDOR CONTACTS
  // ============================================================================

  /**
   * Create a new vendor contact
   */
  async createContact(
    input: CreateVendorContactInput,
    tenantId: string
  ): Promise<VendorContact> {
    const query = `
      INSERT INTO vendor_contacts (
        tenant_id,
        vendor_id,
        contact_name,
        job_title,
        department,
        email,
        phone,
        mobile,
        fax,
        contact_type,
        is_primary,
        preferred_contact_method,
        availability_hours,
        timezone,
        is_active,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16
      )
      RETURNING *
    `;

    const values = [
      tenantId,
      input.vendor_id,
      input.contact_name,
      input.job_title || null,
      input.department || null,
      input.email,
      input.phone || null,
      input.mobile || null,
      input.fax || null,
      input.contact_type,
      input.is_primary !== undefined ? input.is_primary : false,
      input.preferred_contact_method || 'email',
      input.availability_hours || null,
      input.timezone || null,
      input.is_active !== undefined ? input.is_active : true,
      input.notes || null,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a vendor contact
   */
  async updateContact(
    contactId: string,
    input: UpdateVendorContactInput,
    tenantId: string
  ): Promise<VendorContact> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramCount = 1;

    if (input.contact_name !== undefined) {
      updates.push(`contact_name = $${paramCount++}`);
      values.push(input.contact_name);
    }
    if (input.job_title !== undefined) {
      updates.push(`job_title = $${paramCount++}`);
      values.push(input.job_title);
    }
    if (input.department !== undefined) {
      updates.push(`department = $${paramCount++}`);
      values.push(input.department);
    }
    if (input.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(input.email);
    }
    if (input.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(input.phone);
    }
    if (input.mobile !== undefined) {
      updates.push(`mobile = $${paramCount++}`);
      values.push(input.mobile);
    }
    if (input.fax !== undefined) {
      updates.push(`fax = $${paramCount++}`);
      values.push(input.fax);
    }
    if (input.contact_type !== undefined) {
      updates.push(`contact_type = $${paramCount++}`);
      values.push(input.contact_type);
    }
    if (input.is_primary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(input.is_primary);
    }
    if (input.preferred_contact_method !== undefined) {
      updates.push(`preferred_contact_method = $${paramCount++}`);
      values.push(input.preferred_contact_method);
    }
    if (input.availability_hours !== undefined) {
      updates.push(`availability_hours = $${paramCount++}`);
      values.push(input.availability_hours);
    }
    if (input.timezone !== undefined) {
      updates.push(`timezone = $${paramCount++}`);
      values.push(input.timezone);
    }
    if (input.is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(input.is_active);
    }
    if (input.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      values.push(input.notes);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    values.push(contactId, tenantId);

    const query = `
      UPDATE vendor_contacts
      SET ${updates.join(', ')}
      WHERE id = $${paramCount++}
        AND tenant_id = $${paramCount++}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Contact not found');
    }

    return result.rows[0];
  }

  /**
   * Get contacts for a vendor
   */
  async getVendorContacts(
    vendorId: string,
    tenantId: string
  ): Promise<VendorContact[]> {
    const query = `
      SELECT *
      FROM vendor_contacts
      WHERE vendor_id = $1
        AND tenant_id = $2
        AND is_active = true
      ORDER BY is_primary DESC, contact_type, contact_name
    `;

    const result = await this.pool.query(query, [vendorId, tenantId]);
    return result.rows;
  }

  /**
   * Get primary contact for a vendor
   */
  async getPrimaryContact(
    vendorId: string,
    tenantId: string
  ): Promise<VendorContact | null> {
    const query = `
      SELECT *
      FROM vendor_contacts
      WHERE vendor_id = $1
        AND tenant_id = $2
        AND is_primary = true
        AND is_active = true
      LIMIT 1
    `;

    const result = await this.pool.query(query, [vendorId, tenantId]);
    return result.rows[0] || null;
  }
}
