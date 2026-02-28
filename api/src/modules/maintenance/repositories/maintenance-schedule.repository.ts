import { injectable, inject } from "inversify";
import { Pool } from 'pg';

import { BaseRepository } from "../../../repositories/base/BaseRepository";
import { TYPES } from "../../../types";

export interface MaintenanceSchedule {
    id: string;
    tenant_id: string;
    vehicle_id: string;
    name: string;
    description?: string;
    type: string;
    interval_miles?: number;
    interval_days?: number;
    last_service_date?: Date;
    last_service_mileage?: number;
    next_service_date?: Date;
    next_service_mileage?: number;
    estimated_cost?: number;
    estimated_duration?: number;
    is_active: boolean;
    metadata?: any;
    created_at: Date;
    updated_at: Date;
}

@injectable()
export class MaintenanceScheduleRepository extends BaseRepository<MaintenanceSchedule> {
    constructor(@inject(TYPES.DatabasePool) pool: Pool) {
        super(pool, "maintenance_schedules");
    }

    async findUpcoming(tenantId: string | number, vehicleId?: string): Promise<MaintenanceSchedule[]> {
        let sql = `
      SELECT ms.*, v.license_plate as vehicle_number
      FROM ${this.tableName} ms
      LEFT JOIN vehicles v ON ms.vehicle_id = v.id
      WHERE ms.tenant_id = $1
      AND ms.is_active = true
    `;
        const params: any[] = [tenantId];

        if (vehicleId) {
            sql += ` AND ms.vehicle_id = $2`;
            params.push(vehicleId);
        }

        sql += ` ORDER BY ms.created_at DESC`;

        const result = await this.pool.query(sql, params);
        return result.rows;
    }

    async findOverdue(tenantId: string | number): Promise<MaintenanceSchedule[]> {
        const sql = `
      SELECT ms.*, v.license_plate as vehicle_number
      FROM ${this.tableName} ms
      LEFT JOIN vehicles v ON ms.vehicle_id = v.id
      WHERE ms.tenant_id = $1
      AND ms.is_active = true
      ORDER BY ms.created_at DESC
    `;
        const result = await this.pool.query(sql, [tenantId]);
        return result.rows;
    }

    async getStatistics(tenantId: string | number) {
        const sql = `
      SELECT
        COUNT(*) as total_work_orders,
        COUNT(*) FILTER (WHERE status = 'open' OR status = 'in_progress') as open_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE status = 'open' AND created_at < NOW() - interval '7 days') as overdue_count,
        COALESCE(SUM(total_cost), 0) as total_cost,
        COALESCE(SUM(total_cost) FILTER (WHERE created_at >= NOW() - interval '30 days'), 0) as cost_last_30d,
        COALESCE(SUM(labor_cost), 0) as total_labor_cost,
        COALESCE(SUM(parts_cost), 0) as total_parts_cost
      FROM work_orders
      WHERE tenant_id = $1
    `;
        const result = await this.pool.query(sql, [tenantId]);
        return result.rows[0];
    }
}
