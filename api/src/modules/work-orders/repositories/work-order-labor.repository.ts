import { injectable, inject } from "inversify";
import { Pool } from 'pg';
import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";

export interface WorkOrderLabor {
    id: string;
    tenant_id: string;
    work_order_id: string;
    technician_id?: string;
    technician_name: string;
    task: string;
    hours: number;
    rate: number;
    total: number;
    date: Date;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}

@injectable()
export class WorkOrderLaborRepository extends BaseRepository<WorkOrderLabor> {
    constructor(@inject(TYPES.DatabasePool) pool: Pool) {
        super(pool, "work_order_labor");
    }

    async findByWorkOrderId(workOrderId: string, tenantId: string): Promise<WorkOrderLabor[]> {
        const result = await this.pool.query(
            `SELECT * FROM ${this.tableName} WHERE work_order_id = $1 AND tenant_id = $2`,
            [workOrderId, tenantId]
        );
        return result.rows;
    }
}
