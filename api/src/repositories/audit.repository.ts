import { db } from "../db";

export class AuditRepository {
  static async record(params: {
    entityType: string;
    entityId: number;
    action: string;
    before?: any;
    after?: any;
    performedBy?: string | null;
  }) {
    await db.query(
      `INSERT INTO audit_log(entity_type, entity_id, action, before, after, performed_by)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        params.entityType,
        params.entityId,
        params.action,
        params.before ? JSON.stringify(params.before) : null,
        params.after ? JSON.stringify(params.after) : null,
        params.performedBy ?? null,
      ]
    );
  }
}
