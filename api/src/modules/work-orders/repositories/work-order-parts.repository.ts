import { injectable, inject } from "inversify";
import { Pool } from 'pg';
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";

export interface WorkOrderPart {
    id: string;
    tenant_id: string;
    work_order_id: string;
    part_id?: string;
    part_number?: string;
    name: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    supplier?: string;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

@injectable()
export class WorkOrderPartsRepository extends BaseRepository<WorkOrderPart> {
    constructor(@inject(TYPES.DatabasePool) pool: Pool) {
        super(pool, "work_order_parts");
    }

    async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<WorkOrderPart[]> {
        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE work_order_id = $1 AND tenant_id = $2`,
            [workOrderId, tenantId]
        );
        return result.rows;
    }
}
