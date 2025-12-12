import { Pool, QueryResult } from 'pg';

class PersonalUsePoliciesRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async createPersonalUsePolicy(
    tenantId: string,
    userId: string,
    policyName: string,
    policyDescription: string,
    policyContent: string
  ): Promise<QueryResult> {
    const query = `
      INSERT INTO personal_use_policies (tenant_id, user_id, policy_name, policy_description, policy_content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, policy_name, policy_description, policy_content, created_at, updated_at
    `;
    const values = [tenantId, userId, policyName, policyDescription, policyContent];
    return this.pool.query(query, values);
  }

  async getPersonalUsePolicyById(tenantId: string, policyId: string): Promise<QueryResult> {
    const query = `
      SELECT id, policy_name, policy_description, policy_content, created_at, updated_at
      FROM personal_use_policies
      WHERE id = $1 AND tenant_id = $2
    `;
    const values = [policyId, tenantId];
    return this.pool.query(query, values);
  }

  async getAllPersonalUsePolicies(tenantId: string): Promise<QueryResult> {
    const query = `
      SELECT id, policy_name, policy_description, policy_content, created_at, updated_at
      FROM personal_use_policies
      WHERE tenant_id = $1
    `;
    const values = [tenantId];
    return this.pool.query(query, values);
  }

  async updatePersonalUsePolicy(
    tenantId: string,
    policyId: string,
    policyName: string,
    policyDescription: string,
    policyContent: string
  ): Promise<QueryResult> {
    const query = `
      UPDATE personal_use_policies
      SET policy_name = $3, policy_description = $4, policy_content = $5, updated_at = NOW()
      WHERE id = $1 AND tenant_id = $2
      RETURNING id, policy_name, policy_description, policy_content, created_at, updated_at
    `;
    const values = [policyId, tenantId, policyName, policyDescription, policyContent];
    return this.pool.query(query, values);
  }

  async deletePersonalUsePolicy(tenantId: string, policyId: string): Promise<QueryResult> {
    const query = `
      DELETE FROM personal_use_policies
      WHERE id = $1 AND tenant_id = $2
      RETURNING id
    `;
    const values = [policyId, tenantId];
    return this.pool.query(query, values);
  }
}

export default PersonalUsePoliciesRepository;