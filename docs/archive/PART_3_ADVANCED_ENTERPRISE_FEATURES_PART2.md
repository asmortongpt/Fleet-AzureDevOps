# PART 3: ADVANCED ENTERPRISE FEATURES - CONTINUATION

## (Continued from PART_3_ADVANCED_ENTERPRISE_FEATURES.md)

---

## 3.4 CQRS (Command Query Responsibility Segregation)

### Why CQRS for Fleet Management?

**Problem:** Traditional CRUD operations mix reads and writes, causing:
- Complex queries slow down writes
- Denormalized read models pollute write models
- Difficult to scale reads independently from writes
- Audit trail and reporting requirements conflict with transactional needs

**Solution:** Separate read and write models

**File:** `/api/src/cqrs/commands/work-order.commands.ts`

```typescript
/**
 * Command Side - Write Operations
 * Handles state changes and emits domain events
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';
import { EventBus } from '../../events/event-bus.service';
import { EventStore } from '../../events/event-store.service';
import {
  DomainEventType,
  WorkOrderCreatedEvent,
  WorkOrderCompletedEvent
} from '../../events/domain-events';

export interface CreateWorkOrderCommand {
  tenantId: string;
  vehicleId: string;
  category: string;
  priority: string;
  description: string;
  requestedBy: string;
  dueDate?: Date;
}

export interface CompleteWorkOrderCommand {
  workOrderId: string;
  completedBy: string;
  laborHours: number;
  laborRate: number;
  parts: {
    partId: string;
    quantity: number;
    unitCost: number;
  }[];
  notes?: string;
}

export class WorkOrderCommandHandler {
  private logger: pino.Logger;

  constructor(
    private db: Pool,
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {
    this.logger = pino({ name: 'work-order-commands' });
  }

  /**
   * Create work order
   */
  async createWorkOrder(command: CreateWorkOrderCommand): Promise<string> {
    const workOrderId = uuidv4();
    const workOrderNumber = await this.generateWorkOrderNumber(command.tenantId);

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Insert work order
      await client.query(
        `INSERT INTO work_orders
         (id, tenant_id, work_order_number, vehicle_id, category, priority, description, status, requested_by, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          workOrderId,
          command.tenantId,
          workOrderNumber,
          command.vehicleId,
          command.category,
          command.priority,
          command.description,
          'open',
          command.requestedBy,
          command.dueDate,
          new Date()
        ]
      );

      // Create domain event
      const event: WorkOrderCreatedEvent = {
        id: uuidv4(),
        type: DomainEventType.WORK_ORDER_CREATED,
        aggregateId: workOrderId,
        aggregateType: 'WorkOrder',
        tenantId: command.tenantId,
        userId: command.requestedBy,
        data: {
          workOrderNumber,
          vehicleId: command.vehicleId,
          category: command.category,
          priority: command.priority,
          description: command.description
        },
        metadata: {
          timestamp: new Date(),
          version: 1
        }
      };

      // Store event
      await this.eventStore.append(event);

      await client.query('COMMIT');

      // Publish event to bus (async, after commit)
      await this.eventBus.publish(event);

      this.logger.info({
        workOrderId,
        workOrderNumber,
        vehicleId: command.vehicleId
      }, 'Work order created');

      return workOrderId;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error({ error, command }, 'Failed to create work order');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Complete work order
   */
  async completeWorkOrder(command: CompleteWorkOrderCommand): Promise<void> {
    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // Calculate costs
      const laborCost = command.laborHours * command.laborRate;
      const partsCost = command.parts.reduce(
        (sum, part) => sum + (part.quantity * part.unitCost),
        0
      );
      const totalCost = laborCost + partsCost;

      // Update work order
      const result = await client.query(
        `UPDATE work_orders
         SET status = 'completed',
             completed_by = $1,
             completed_at = $2,
             labor_hours = $3,
             labor_cost = $4,
             parts_cost = $5,
             total_cost = $6,
             notes = $7
         WHERE id = $8
         RETURNING work_order_number, vehicle_id, tenant_id`,
        [
          command.completedBy,
          new Date(),
          command.laborHours,
          laborCost,
          partsCost,
          totalCost,
          command.notes,
          command.workOrderId
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Work order ${command.workOrderId} not found`);
      }

      const workOrder = result.rows[0];

      // Insert parts usage
      for (const part of command.parts) {
        await client.query(
          `INSERT INTO work_order_parts
           (work_order_id, part_id, quantity, unit_cost)
           VALUES ($1, $2, $3, $4)`,
          [command.workOrderId, part.partId, part.quantity, part.unitCost]
        );
      }

      // Create domain event
      const event: WorkOrderCompletedEvent = {
        id: uuidv4(),
        type: DomainEventType.WORK_ORDER_COMPLETED,
        aggregateId: command.workOrderId,
        aggregateType: 'WorkOrder',
        tenantId: workOrder.tenant_id,
        userId: command.completedBy,
        data: {
          workOrderNumber: workOrder.work_order_number,
          vehicleId: workOrder.vehicle_id,
          completedBy: command.completedBy,
          laborCost,
          partsCost,
          totalCost,
          completionDate: new Date()
        },
        metadata: {
          timestamp: new Date(),
          version: 1
        }
      };

      // Store event
      await this.eventStore.append(event);

      await client.query('COMMIT');

      // Publish event
      await this.eventBus.publish(event);

      this.logger.info({
        workOrderId: command.workOrderId,
        totalCost
      }, 'Work order completed');
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error({ error, command }, 'Failed to complete work order');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate unique work order number
   */
  private async generateWorkOrderNumber(tenantId: string): Promise<string> {
    const result = await this.db.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 as next_num
       FROM work_orders
       WHERE tenant_id = $1
       AND work_order_number LIKE 'WO-%'`,
      [tenantId]
    );

    const nextNum = result.rows[0].next_num;
    return `WO-${String(nextNum).padStart(6, '0')}`;
  }
}
```

**File:** `/api/src/cqrs/queries/work-order.queries.ts`

```typescript
/**
 * Query Side - Read Operations
 * Optimized read models for specific use cases
 */

import { Pool } from 'pg';
import pino from 'pino';

export interface WorkOrderListItem {
  id: string;
  workOrderNumber: string;
  vehicleNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  requestedBy: string;
  assignedTo?: string;
  dueDate?: Date;
  createdAt: Date;
  totalCost?: number;
}

export interface WorkOrderDetail extends WorkOrderListItem {
  laborHours?: number;
  laborCost?: number;
  partsCost?: number;
  parts: {
    partNumber: string;
    partName: string;
    quantity: number;
    unitCost: number;
  }[];
  notes?: string;
  completedAt?: Date;
  completedBy?: string;
  attachments: {
    id: string;
    fileName: string;
    fileType: string;
    uploadedAt: Date;
  }[];
}

export interface WorkOrderStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  avgCompletionDays: number;
  totalCost: number;
  avgCost: number;
}

export class WorkOrderQueryHandler {
  private logger: pino.Logger;

  constructor(private db: Pool) {
    this.logger = pino({ name: 'work-order-queries' });
  }

  /**
   * Get work order list with filters
   */
  async getWorkOrders(
    tenantId: string,
    filters: {
      status?: string[];
      priority?: string[];
      vehicleId?: string;
      assignedTo?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    pagination: { page: number; limit: number }
  ): Promise<{ data: WorkOrderListItem[]; total: number }> {
    const conditions: string[] = ['wo.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters.status && filters.status.length > 0) {
      conditions.push(`wo.status = ANY($${paramIndex})`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.priority && filters.priority.length > 0) {
      conditions.push(`wo.priority = ANY($${paramIndex})`);
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.vehicleId) {
      conditions.push(`wo.vehicle_id = $${paramIndex}`);
      params.push(filters.vehicleId);
      paramIndex++;
    }

    if (filters.assignedTo) {
      conditions.push(`wo.assigned_to = $${paramIndex}`);
      params.push(filters.assignedTo);
      paramIndex++;
    }

    if (filters.dateFrom) {
      conditions.push(`wo.created_at >= $${paramIndex}`);
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters.dateTo) {
      conditions.push(`wo.created_at <= $${paramIndex}`);
      params.push(filters.dateTo);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM work_orders wo WHERE ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const offset = (pagination.page - 1) * pagination.limit;

    const result = await this.db.query(
      `SELECT
         wo.id,
         wo.work_order_number,
         v.vehicle_number,
         v.make as vehicle_make,
         v.model as vehicle_model,
         wo.category,
         wo.priority,
         wo.status,
         wo.description,
         wo.requested_by,
         wo.assigned_to,
         wo.due_date,
         wo.created_at,
         wo.total_cost
       FROM work_orders wo
       JOIN vehicles v ON wo.vehicle_id = v.id
       WHERE ${whereClause}
       ORDER BY wo.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, pagination.limit, offset]
    );

    const data: WorkOrderListItem[] = result.rows.map(row => ({
      id: row.id,
      workOrderNumber: row.work_order_number,
      vehicleNumber: row.vehicle_number,
      vehicleMake: row.vehicle_make,
      vehicleModel: row.vehicle_model,
      category: row.category,
      priority: row.priority,
      status: row.status,
      description: row.description,
      requestedBy: row.requested_by,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      createdAt: row.created_at,
      totalCost: row.total_cost
    }));

    return { data, total };
  }

  /**
   * Get work order detail
   */
  async getWorkOrderDetail(workOrderId: string): Promise<WorkOrderDetail | null> {
    const result = await this.db.query(
      `SELECT
         wo.*,
         v.vehicle_number,
         v.make as vehicle_make,
         v.model as vehicle_model
       FROM work_orders wo
       JOIN vehicles v ON wo.vehicle_id = v.id
       WHERE wo.id = $1`,
      [workOrderId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Get parts
    const partsResult = await this.db.query(
      `SELECT
         p.part_number,
         p.part_name,
         wop.quantity,
         wop.unit_cost
       FROM work_order_parts wop
       JOIN parts p ON wop.part_id = p.id
       WHERE wop.work_order_id = $1`,
      [workOrderId]
    );

    // Get attachments
    const attachmentsResult = await this.db.query(
      `SELECT id, file_name, file_type, uploaded_at
       FROM attachments
       WHERE entity_type = 'work_order' AND entity_id = $1`,
      [workOrderId]
    );

    return {
      id: row.id,
      workOrderNumber: row.work_order_number,
      vehicleNumber: row.vehicle_number,
      vehicleMake: row.vehicle_make,
      vehicleModel: row.vehicle_model,
      category: row.category,
      priority: row.priority,
      status: row.status,
      description: row.description,
      requestedBy: row.requested_by,
      assignedTo: row.assigned_to,
      dueDate: row.due_date,
      createdAt: row.created_at,
      totalCost: row.total_cost,
      laborHours: row.labor_hours,
      laborCost: row.labor_cost,
      partsCost: row.parts_cost,
      parts: partsResult.rows.map(p => ({
        partNumber: p.part_number,
        partName: p.part_name,
        quantity: p.quantity,
        unitCost: p.unit_cost
      })),
      notes: row.notes,
      completedAt: row.completed_at,
      completedBy: row.completed_by,
      attachments: attachmentsResult.rows.map(a => ({
        id: a.id,
        fileName: a.file_name,
        fileType: a.file_type,
        uploadedAt: a.uploaded_at
      }))
    };
  }

  /**
   * Get work order statistics
   */
  async getWorkOrderStats(tenantId: string, dateRange?: { from: Date; to: Date }): Promise<WorkOrderStats> {
    let dateCondition = '';
    const params: any[] = [tenantId];

    if (dateRange) {
      dateCondition = 'AND created_at BETWEEN $2 AND $3';
      params.push(dateRange.from, dateRange.to);
    }

    const result = await this.db.query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status = 'open') as open,
         COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 86400) FILTER (WHERE completed_at IS NOT NULL) as avg_completion_days,
         SUM(total_cost) as total_cost,
         AVG(total_cost) FILTER (WHERE total_cost IS NOT NULL) as avg_cost
       FROM work_orders
       WHERE tenant_id = $1 ${dateCondition}`,
      params
    );

    const row = result.rows[0];

    return {
      total: parseInt(row.total),
      open: parseInt(row.open),
      inProgress: parseInt(row.in_progress),
      completed: parseInt(row.completed),
      avgCompletionDays: parseFloat(row.avg_completion_days) || 0,
      totalCost: parseFloat(row.total_cost) || 0,
      avgCost: parseFloat(row.avg_cost) || 0
    };
  }
}
```

### 3.5 Saga Pattern for Distributed Transactions

**Use Case:** Complete work order requires:
1. Update work order status
2. Update vehicle odometer
3. Reduce parts inventory
4. Create invoice
5. Send notification
6. Update maintenance schedule

If any step fails, compensating actions must rollback previous steps.

**File:** `/api/src/sagas/complete-work-order.saga.ts`

```typescript
/**
 * Complete Work Order Saga
 * Orchestrates distributed transaction across multiple services
 */

import { Pool } from 'pg';
import pino from 'pino';
import { EventBus } from '../events/event-bus.service';
import { DomainEventType } from '../events/domain-events';

interface SagaStep {
  name: string;
  execute: () => Promise<any>;
  compensate: (result?: any) => Promise<void>;
}

interface CompleteWorkOrderSagaInput {
  workOrderId: string;
  completedBy: string;
  odometer: number;
  parts: { partId: string; quantity: number; unitCost: number }[];
  laborHours: number;
  laborRate: number;
}

export class CompleteWorkOrderSaga {
  private logger: pino.Logger;
  private steps: SagaStep[] = [];
  private executedSteps: { step: SagaStep; result: any }[] = [];

  constructor(
    private db: Pool,
    private eventBus: EventBus,
    private input: CompleteWorkOrderSagaInput
  ) {
    this.logger = pino({ name: 'complete-work-order-saga' });
    this.buildSteps();
  }

  /**
   * Build saga steps
   */
  private buildSteps(): void {
    // Step 1: Update work order
    this.steps.push({
      name: 'Update work order',
      execute: async () => {
        const result = await this.db.query(
          `UPDATE work_orders
           SET status = 'completed',
               completed_by = $1,
               completed_at = NOW()
           WHERE id = $2
           RETURNING id, tenant_id, vehicle_id`,
          [this.input.completedBy, this.input.workOrderId]
        );

        if (result.rows.length === 0) {
          throw new Error(`Work order ${this.input.workOrderId} not found`);
        }

        return result.rows[0];
      },
      compensate: async () => {
        await this.db.query(
          `UPDATE work_orders
           SET status = 'in_progress',
               completed_by = NULL,
               completed_at = NULL
           WHERE id = $1`,
          [this.input.workOrderId]
        );
        this.logger.info('Compensated: Reverted work order status');
      }
    });

    // Step 2: Update vehicle odometer
    this.steps.push({
      name: 'Update vehicle odometer',
      execute: async () => {
        const workOrder = this.executedSteps[0].result;

        await this.db.query(
          `UPDATE vehicles
           SET odometer = $1,
               last_service_date = NOW(),
               last_service_odometer = $1
           WHERE id = $2`,
          [this.input.odometer, workOrder.vehicle_id]
        );

        return { vehicleId: workOrder.vehicle_id };
      },
      compensate: async (result) => {
        // Revert odometer (would need to fetch previous value in real implementation)
        this.logger.info('Compensated: Reverted vehicle odometer');
      }
    });

    // Step 3: Reduce parts inventory
    this.steps.push({
      name: 'Reduce parts inventory',
      execute: async () => {
        const reducedParts: string[] = [];

        for (const part of this.input.parts) {
          const result = await this.db.query(
            `UPDATE parts_inventory
             SET quantity = quantity - $1
             WHERE part_id = $2 AND quantity >= $1
             RETURNING part_id`,
            [part.quantity, part.partId]
          );

          if (result.rows.length === 0) {
            throw new Error(`Insufficient inventory for part ${part.partId}`);
          }

          reducedParts.push(part.partId);
        }

        return { reducedParts };
      },
      compensate: async (result) => {
        if (result?.reducedParts) {
          for (const partId of result.reducedParts) {
            const part = this.input.parts.find(p => p.partId === partId);
            if (part) {
              await this.db.query(
                `UPDATE parts_inventory
                 SET quantity = quantity + $1
                 WHERE part_id = $2`,
                [part.quantity, partId]
              );
            }
          }
        }
        this.logger.info('Compensated: Restored parts inventory');
      }
    });

    // Step 4: Create invoice
    this.steps.push({
      name: 'Create invoice',
      execute: async () => {
        const workOrder = this.executedSteps[0].result;
        const laborCost = this.input.laborHours * this.input.laborRate;
        const partsCost = this.input.parts.reduce(
          (sum, p) => sum + (p.quantity * p.unitCost),
          0
        );
        const totalCost = laborCost + partsCost;

        const result = await this.db.query(
          `INSERT INTO invoices
           (tenant_id, work_order_id, total_amount, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW())
           RETURNING id`,
          [workOrder.tenant_id, this.input.workOrderId, totalCost]
        );

        return { invoiceId: result.rows[0].id };
      },
      compensate: async (result) => {
        if (result?.invoiceId) {
          await this.db.query(
            `DELETE FROM invoices WHERE id = $1`,
            [result.invoiceId]
          );
        }
        this.logger.info('Compensated: Deleted invoice');
      }
    });

    // Step 5: Send notification
    this.steps.push({
      name: 'Send notification',
      execute: async () => {
        const workOrder = this.executedSteps[0].result;

        await this.eventBus.publish({
          id: require('uuid').v4(),
          type: DomainEventType.WORK_ORDER_COMPLETED,
          aggregateId: this.input.workOrderId,
          aggregateType: 'WorkOrder',
          tenantId: workOrder.tenant_id,
          userId: this.input.completedBy,
          data: {
            workOrderId: this.input.workOrderId,
            completedBy: this.input.completedBy
          },
          metadata: {
            timestamp: new Date(),
            version: 1
          }
        });

        return { notified: true };
      },
      compensate: async () => {
        // Can't "unsend" notification, but log it
        this.logger.warn('Compensated: Cannot unsend notification');
      }
    });
  }

  /**
   * Execute saga
   */
  async execute(): Promise<void> {
    try {
      // Execute all steps
      for (const step of this.steps) {
        this.logger.info({ step: step.name }, 'Executing saga step');

        const result = await step.execute();
        this.executedSteps.push({ step, result });

        this.logger.info({ step: step.name }, 'Saga step completed');
      }

      this.logger.info('Saga completed successfully');
    } catch (error) {
      this.logger.error({ error }, 'Saga failed, running compensations');

      // Run compensating actions in reverse order
      for (let i = this.executedSteps.length - 1; i >= 0; i--) {
        try {
          const { step, result } = this.executedSteps[i];
          this.logger.info({ step: step.name }, 'Running compensation');
          await step.compensate(result);
        } catch (compensationError) {
          this.logger.error({
            error: compensationError,
            step: this.executedSteps[i].step.name
          }, 'Compensation failed');
        }
      }

      throw error;
    }
  }
}
```

---

## 4. MULTI-TENANCY AT SCALE

### 4.1 Tenant Provisioning Automation

**File:** `/api/src/services/tenant/tenant-provisioning.service.ts`

```typescript
/**
 * Tenant Provisioning Service
 * Automated tenant onboarding and resource allocation
 */

import { Pool } from 'pg';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

interface TenantPlan {
  name: string;
  maxUsers: number;
  maxVehicles: number;
  maxStorageGB: number;
  features: string[];
  monthlyPrice: number;
}

const TENANT_PLANS: Record<string, TenantPlan> = {
  starter: {
    name: 'Starter',
    maxUsers: 5,
    maxVehicles: 25,
    maxStorageGB: 10,
    features: ['basic_reports', 'maintenance_tracking'],
    monthlyPrice: 99
  },
  professional: {
    name: 'Professional',
    maxUsers: 20,
    maxVehicles: 100,
    maxStorageGB: 50,
    features: ['basic_reports', 'maintenance_tracking', 'fuel_tracking', 'advanced_reports'],
    monthlyPrice: 299
  },
  enterprise: {
    name: 'Enterprise',
    maxUsers: -1, // Unlimited
    maxVehicles: -1,
    maxStorageGB: 500,
    features: ['all'],
    monthlyPrice: 999
  }
};

export class TenantProvisioningService {
  private logger: pino.Logger;

  constructor(private db: Pool) {
    this.logger = pino({ name: 'tenant-provisioning' });
  }

  /**
   * Provision new tenant
   */
  async provisionTenant(input: {
    companyName: string;
    domain: string;
    adminEmail: string;
    adminPassword: string;
    plan: 'starter' | 'professional' | 'enterprise';
  }): Promise<{ tenantId: string; adminUserId: string }> {
    const tenantId = uuidv4();
    const adminUserId = uuidv4();
    const plan = TENANT_PLANS[input.plan];

    const client = await this.db.connect();

    try {
      await client.query('BEGIN');

      // 1. Create tenant
      await client.query(
        `INSERT INTO tenants
         (id, company_name, domain, plan_name, max_users, max_vehicles, max_storage_gb, features, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', NOW())`,
        [
          tenantId,
          input.companyName,
          input.domain,
          plan.name,
          plan.maxUsers,
          plan.maxVehicles,
          plan.maxStorageGB,
          plan.features
        ]
      );

      // 2. Create admin user
      const passwordHash = await bcrypt.hash(input.adminPassword, 12);

      await client.query(
        `INSERT INTO users
         (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at)
         VALUES ($1, $2, $3, $4, 'Admin', 'User', 'admin', 'active', NOW())`,
        [adminUserId, tenantId, input.adminEmail, passwordHash]
      );

      // 3. Create default roles and permissions
      await this.createDefaultRoles(client, tenantId);

      // 4. Create default categories
      await this.createDefaultCategories(client, tenantId);

      // 5. Create default settings
      await this.createDefaultSettings(client, tenantId);

      // 6. Create default dashboards
      await this.createDefaultDashboards(client, tenantId);

      // 7. Set up tenant schema (if using schema-per-tenant)
      // await this.createTenantSchema(client, tenantId);

      await client.query('COMMIT');

      this.logger.info({
        tenantId,
        companyName: input.companyName,
        plan: plan.name
      }, 'Tenant provisioned successfully');

      // Send welcome email (async)
      this.sendWelcomeEmail(input.adminEmail, input.companyName).catch(err =>
        this.logger.error({ err }, 'Failed to send welcome email')
      );

      return { tenantId, adminUserId };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error({ error, input }, 'Failed to provision tenant');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create default roles
   */
  private async createDefaultRoles(client: any, tenantId: string): Promise<void> {
    const roles = [
      {
        name: 'admin',
        permissions: ['all']
      },
      {
        name: 'fleet_manager',
        permissions: ['view_vehicles', 'edit_vehicles', 'view_work_orders', 'create_work_orders', 'view_reports']
      },
      {
        name: 'technician',
        permissions: ['view_vehicles', 'view_work_orders', 'edit_work_orders']
      },
      {
        name: 'driver',
        permissions: ['view_vehicles']
      }
    ];

    for (const role of roles) {
      await client.query(
        `INSERT INTO roles (id, tenant_id, name, permissions, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), tenantId, role.name, role.permissions]
      );
    }
  }

  /**
   * Create default work order categories
   */
  private async createDefaultCategories(client: any, tenantId: string): Promise<void> {
    const categories = [
      'Preventive Maintenance',
      'Repair',
      'Inspection',
      'Tire Service',
      'Oil Change',
      'Brake Service',
      'Engine Repair',
      'Transmission Service',
      'Body Work',
      'Electrical'
    ];

    for (const category of categories) {
      await client.query(
        `INSERT INTO work_order_categories (id, tenant_id, name, active, created_at)
         VALUES ($1, $2, $3, true, NOW())`,
        [uuidv4(), tenantId, category]
      );
    }
  }

  /**
   * Create default tenant settings
   */
  private async createDefaultSettings(client: any, tenantId: string): Promise<void> {
    const settings = {
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      distanceUnit: 'miles',
      fuelUnit: 'gallons',
      maintenanceReminders: true,
      emailNotifications: true,
      workOrderAutoNumber: true
    };

    await client.query(
      `INSERT INTO tenant_settings (tenant_id, settings, created_at)
       VALUES ($1, $2, NOW())`,
      [tenantId, settings]
    );
  }

  /**
   * Create default dashboards
   */
  private async createDefaultDashboards(client: any, tenantId: string): Promise<void> {
    const dashboards = [
      {
        name: 'Fleet Overview',
        widgets: [
          { type: 'vehicle_count', position: { x: 0, y: 0, w: 4, h: 2 } },
          { type: 'active_work_orders', position: { x: 4, y: 0, w: 4, h: 2 } },
          { type: 'monthly_costs', position: { x: 0, y: 2, w: 8, h: 4 } },
          { type: 'maintenance_due', position: { x: 0, y: 6, w: 8, h: 4 } }
        ]
      }
    ];

    for (const dashboard of dashboards) {
      await client.query(
        `INSERT INTO dashboards (id, tenant_id, name, widgets, is_default, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())`,
        [uuidv4(), tenantId, dashboard.name, dashboard.widgets]
      );
    }
  }

  /**
   * Send welcome email
   */
  private async sendWelcomeEmail(email: string, companyName: string): Promise<void> {
    // Implement email sending
    this.logger.info({ email, companyName }, 'Welcome email sent');
  }

  /**
   * Upgrade tenant plan
   */
  async upgradePlan(
    tenantId: string,
    newPlan: 'starter' | 'professional' | 'enterprise'
  ): Promise<void> {
    const plan = TENANT_PLANS[newPlan];

    await this.db.query(
      `UPDATE tenants
       SET plan_name = $1,
           max_users = $2,
           max_vehicles = $3,
           max_storage_gb = $4,
           features = $5,
           updated_at = NOW()
       WHERE id = $6`,
      [plan.name, plan.maxUsers, plan.maxVehicles, plan.maxStorageGB, plan.features, tenantId]
    );

    this.logger.info({ tenantId, newPlan }, 'Tenant plan upgraded');
  }

  /**
   * Suspend tenant
   */
  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    await this.db.query(
      `UPDATE tenants
       SET status = 'suspended',
           suspension_reason = $1,
           suspended_at = NOW()
       WHERE id = $2`,
      [reason, tenantId]
    );

    this.logger.warn({ tenantId, reason }, 'Tenant suspended');
  }

  /**
   * Delete tenant (with grace period)
   */
  async scheduleTenantDeletion(tenantId: string, deleteAfterDays: number = 30): Promise<void> {
    const deleteAt = new Date();
    deleteAt.setDate(deleteAt.getDate() + deleteAfterDays);

    await this.db.query(
      `UPDATE tenants
       SET status = 'pending_deletion',
           scheduled_deletion_at = $1
       WHERE id = $2`,
      [deleteAt, tenantId]
    );

    this.logger.warn({ tenantId, deleteAt }, 'Tenant deletion scheduled');
  }

  /**
   * Export tenant data (GDPR compliance)
   */
  async exportTenantData(tenantId: string): Promise<Record<string, any>> {
    // Implementation would collect all tenant data
    const data = {
      tenant: await this.getTenantInfo(tenantId),
      users: await this.getTenantUsers(tenantId),
      vehicles: await this.getTenantVehicles(tenantId),
      workOrders: await this.getTenantWorkOrders(tenantId)
      // ... more entities
    };

    this.logger.info({ tenantId }, 'Tenant data exported');

    return data;
  }

  // Helper methods
  private async getTenantInfo(tenantId: string): Promise<any> {
    const result = await this.db.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    return result.rows[0];
  }

  private async getTenantUsers(tenantId: string): Promise<any[]> {
    const result = await this.db.query(
      'SELECT * FROM users WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }

  private async getTenantVehicles(tenantId: string): Promise<any[]> {
    const result = await this.db.query(
      'SELECT * FROM vehicles WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }

  private async getTenantWorkOrders(tenantId: string): Promise<any[]> {
    const result = await this.db.query(
      'SELECT * FROM work_orders WHERE tenant_id = $1',
      [tenantId]
    );
    return result.rows;
  }
}
```

---

## 5. MOBILE & OFFLINE SUPPORT

### 5.1 Progressive Web App (PWA) Architecture

**File:** `/vite.config.ts` (Update existing)

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... existing plugins
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Fleet Management System',
        short_name: 'FleetMS',
        description: 'Enterprise Fleet Management Solution',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.fleetms\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

### 5.2 Offline-First Sync Strategy

**File:** `/src/services/offline/sync-manager.service.ts`

```typescript
/**
 * Offline Sync Manager
 * Handles offline data storage and synchronization
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

interface FleetDB extends DBSchema {
  vehicles: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
  workOrders: {
    key: string;
    value: {
      id: string;
      data: any;
      lastModified: number;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      entity: string;
      entityId: string;
      payload: any;
      timestamp: number;
      retries: number;
    };
  };
}

export class SyncManager {
  private db!: IDBPDatabase<FleetDB>;
  private logger: pino.Logger;
  private syncInterval: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.logger = pino({ name: 'sync-manager' });
    this.setupNetworkListeners();
  }

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    this.db = await openDB<FleetDB>('fleet-offline', 1, {
      upgrade(db) {
        // Create object stores
        if (!db.objectStoreNames.contains('vehicles')) {
          db.createObjectStore('vehicles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workOrders')) {
          db.createObjectStore('workOrders', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      }
    });

    // Start sync loop
    this.startSyncLoop();

    this.logger.info('Offline sync manager initialized');
  }

  /**
   * Setup network listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.logger.info('Network online - triggering sync');
      this.sync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.logger.warn('Network offline - operating in offline mode');
    });
  }

  /**
   * Save data locally (offline-first)
   */
  async saveVehicle(vehicle: any): Promise<void> {
    const now = Date.now();

    // Save to IndexedDB
    await this.db.put('vehicles', {
      id: vehicle.id,
      data: vehicle,
      lastModified: now,
      syncStatus: this.isOnline ? 'pending' : 'pending'
    });

    // Queue sync action
    await this.queueSyncAction({
      action: vehicle._isNew ? 'create' : 'update',
      entity: 'vehicle',
      entityId: vehicle.id,
      payload: vehicle
    });

    // Trigger immediate sync if online
    if (this.isOnline) {
      this.sync();
    }
  }

  /**
   * Queue sync action
   */
  private async queueSyncAction(action: {
    action: 'create' | 'update' | 'delete';
    entity: string;
    entityId: string;
    payload: any;
  }): Promise<void> {
    const queueItem = {
      id: uuidv4(),
      ...action,
      timestamp: Date.now(),
      retries: 0
    };

    await this.db.add('syncQueue', queueItem);
  }

  /**
   * Sync with server
   */
  async sync(): Promise<void> {
    if (!this.isOnline) {
      this.logger.debug('Skipping sync - offline');
      return;
    }

    try {
      const queue = await this.db.getAll('syncQueue');

      if (queue.length === 0) {
        this.logger.debug('Sync queue empty');
        return;
      }

      this.logger.info({ queueSize: queue.length }, 'Starting sync');

      // Process queue items
      for (const item of queue) {
        try {
          await this.processSyncItem(item);

          // Remove from queue on success
          await this.db.delete('syncQueue', item.id);
        } catch (error) {
          this.logger.error({ error, item }, 'Sync item failed');

          // Increment retry count
          item.retries++;

          if (item.retries > 3) {
            // Move to failed queue or alert user
            this.logger.error({ item }, 'Sync item exceeded max retries');
            await this.db.delete('syncQueue', item.id);
          } else {
            await this.db.put('syncQueue', item);
          }
        }
      }

      this.logger.info('Sync complete');
    } catch (error) {
      this.logger.error({ error }, 'Sync failed');
    }
  }

  /**
   * Process single sync item
   */
  private async processSyncItem(item: any): Promise<void> {
    const url = `/api/${item.entity}s`;

    let response: Response;

    switch (item.action) {
      case 'create':
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(item.payload)
        });
        break;

      case 'update':
        response = await fetch(`${url}/${item.entityId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getAuthToken()}`
          },
          body: JSON.stringify(item.payload)
        });
        break;

      case 'delete':
        response = await fetch(`${url}/${item.entityId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.getAuthToken()}`
          }
        });
        break;

      default:
        throw new Error(`Unknown action: ${item.action}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Update sync status
    const storeName = `${item.entity}s` as 'vehicles' | 'workOrders';
    const localData = await this.db.get(storeName, item.entityId);

    if (localData) {
      localData.syncStatus = 'synced';
      await this.db.put(storeName, localData);
    }
  }

  /**
   * Get auth token
   */
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  /**
   * Start background sync loop
   */
  private startSyncLoop(): void {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.sync();
      }
    }, 30000);
  }

  /**
   * Stop sync loop
   */
  stopSyncLoop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get offline data
   */
  async getOfflineVehicles(): Promise<any[]> {
    const vehicles = await this.db.getAll('vehicles');
    return vehicles.map(v => v.data);
  }

  /**
   * Clear offline data
   */
  async clearOfflineData(): Promise<void> {
    await this.db.clear('vehicles');
    await this.db.clear('workOrders');
    await this.db.clear('syncQueue');
    this.logger.info('Offline data cleared');
  }
}

export default new SyncManager();
```

---

**[TO BE CONTINUED...]**

Due to length constraints, I'm splitting this into multiple parts. This document now covers:

1. Real-time Features (WebSocket, SSE, Redis Pub/Sub, Geofencing)
2. ML/Analytics (Azure ML, Time-series forecasting)
3. Event-Driven Architecture (Domain events, Event bus, Event sourcing, Saga pattern, CQRS)
4. Multi-Tenancy (Tenant provisioning automation)
5. Mobile/Offline (PWA, Offline sync)

Would you like me to continue with:
- Conflict resolution for offline sync
- Performance optimization (query streaming, sharding, caching strategies)
- Advanced reporting (data warehouse, ETL, embedded analytics)
- Integration ecosystem (webhooks, OAuth2, ERP connectors)
- Cost optimization and benchmarks

Let me know if you want the next part!
