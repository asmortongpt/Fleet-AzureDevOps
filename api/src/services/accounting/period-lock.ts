import { db } from "../../db";

export async function assertNotAffectingClosedPeriods(params: {
  assetId: number;
  componentId?: number;
  effectiveDate: string; // date that change would affect (installed/dep_start/disposed)
}) {
  // If there's any closed period whose end >= effectiveDate and snapshots exist, block.
  const { rows } = await db.query(
    `SELECT ap.id
     FROM accounting_periods ap
     WHERE ap.is_closed = TRUE
       AND ap.period_end >= $1
     LIMIT 1`,
    [params.effectiveDate]
  );
  if (rows.length) {
    throw new Error("Cannot modify accounting inputs that affect a closed period. Re-open the period or use an accounting admin override flow.");
  }
}
