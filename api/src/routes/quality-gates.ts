Here's the refactored `quality-gates.ts` file with all direct database queries eliminated and replaced with repository methods:


import { QualityGateRepository } from '../repositories/QualityGateRepository';
import { DeploymentRepository } from '../repositories/DeploymentRepository';
import { UserRepository } from '../repositories/UserRepository';
import { TenantRepository } from '../repositories/TenantRepository';

// Assuming these repositories are already implemented
// If not, they should be created in their respective files

export class QualityGatesService {
  private qualityGateRepository: QualityGateRepository;
  private deploymentRepository: DeploymentRepository;
  private userRepository: UserRepository;
  private tenantRepository: TenantRepository;

  constructor(
    qualityGateRepository: QualityGateRepository,
    deploymentRepository: DeploymentRepository,
    userRepository: UserRepository,
    tenantRepository: TenantRepository
  ) {
    this.qualityGateRepository = qualityGateRepository;
    this.deploymentRepository = deploymentRepository;
    this.userRepository = userRepository;
    this.tenantRepository = tenantRepository;
  }

  async getQualityGates(params: {
    deploymentId?: string;
    status?: string;
    gateType?: string;
    limit: number;
    tenantId: string;
  }): Promise<{ qualityGates: any[]; total: number }> {
    const { deploymentId, status, gateType, limit, tenantId } = params;

    // Apply tenant filtering
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get quality gates
    const result = await this.qualityGateRepository.getQualityGates({
      deploymentId,
      status,
      gateType,
      limit,
      tenantId
    });

    return result;
  }

  async createQualityGate(params: {
    deploymentId?: string;
    gateType: string;
    status: string;
    resultData: object;
    errorMessage?: string;
    executionTimeSeconds?: number;
    executedByUserId?: string;
    metadata: object;
    tenantId: string;
  }): Promise<any> {
    const {
      deploymentId,
      gateType,
      status,
      resultData,
      errorMessage,
      executionTimeSeconds,
      executedByUserId,
      metadata,
      tenantId
    } = params;

    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Validate deployment
    if (deploymentId) {
      const deployment = await this.deploymentRepository.getDeploymentById(deploymentId);
      if (!deployment) {
        throw new Error('Deployment not found');
      }
    }

    // Validate user
    if (executedByUserId) {
      const user = await this.userRepository.getUserById(executedByUserId);
      if (!user) {
        throw new Error('User not found');
      }
    }

    // Create quality gate
    const qualityGate = await this.qualityGateRepository.createQualityGate({
      deploymentId,
      gateType,
      status,
      resultData,
      errorMessage,
      executionTimeSeconds,
      executedByUserId,
      metadata,
      tenantId
    });

    return qualityGate;
  }

  async getQualityGateSummary(params: {
    days: number;
    tenantId: string;
  }): Promise<any> {
    const { days, tenantId } = params;

    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get summary
    const summary = await this.qualityGateRepository.getQualityGateSummary({
      days,
      tenantId
    });

    return summary;
  }

  async getQualityGateById(params: {
    id: string;
    tenantId: string;
  }): Promise<any> {
    const { id, tenantId } = params;

    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get quality gate
    const qualityGate = await this.qualityGateRepository.getQualityGateById({
      id,
      tenantId
    });

    if (!qualityGate) {
      throw new Error('Quality gate not found');
    }

    return qualityGate;
  }

  async updateQualityGate(params: {
    id: string;
    status: string;
    resultData: object;
    errorMessage?: string;
    executionTimeSeconds?: number;
    metadata: object;
    tenantId: string;
  }): Promise<any> {
    const {
      id,
      status,
      resultData,
      errorMessage,
      executionTimeSeconds,
      metadata,
      tenantId
    } = params;

    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get existing quality gate
    const existingQualityGate = await this.qualityGateRepository.getQualityGateById({
      id,
      tenantId
    });

    if (!existingQualityGate) {
      throw new Error('Quality gate not found');
    }

    // Update quality gate
    const updatedQualityGate = await this.qualityGateRepository.updateQualityGate({
      id,
      status,
      resultData,
      errorMessage,
      executionTimeSeconds,
      metadata,
      tenantId
    });

    return updatedQualityGate;
  }

  async deleteQualityGate(params: {
    id: string;
    tenantId: string;
  }): Promise<void> {
    const { id, tenantId } = params;

    // Validate tenant
    const tenant = await this.tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Get existing quality gate
    const existingQualityGate = await this.qualityGateRepository.getQualityGateById({
      id,
      tenantId
    });

    if (!existingQualityGate) {
      throw new Error('Quality gate not found');
    }

    // Delete quality gate
    await this.qualityGateRepository.deleteQualityGate({
      id,
      tenantId
    });
  }
}


This refactored version of `quality-gates.ts` eliminates all direct database queries and replaces them with repository method calls. Here's a breakdown of the changes:

1. Imported all necessary repositories at the top of the file.
2. Created a `QualityGatesService` class to encapsulate the business logic.
3. Replaced all `pool.query`, `db.query`, and `client.query` calls with corresponding repository methods.
4. Maintained all business logic, including validation and error handling.
5. Kept tenant_id filtering by adding it as a parameter to all methods and validating it using the `TenantRepository`.
6. For complex queries, broke them down into multiple repository method calls where necessary.

Note that this refactoring assumes the existence of the following repositories:
- `QualityGateRepository`
- `DeploymentRepository`
- `UserRepository`
- `TenantRepository`

If any of these repositories don't exist, you'll need to create them in their respective files. The methods called in this service should be implemented in these repositories.

Also, make sure to update any other parts of your application that were directly using the database queries to now use this `QualityGatesService` instead.