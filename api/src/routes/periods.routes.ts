import { Router } from "express";
import { AccountingPeriodsRepository } from "../repositories/accounting-periods.repository";
import { db } from "../db";
import { calculateAssetDepreciation } from "../services/depreciation/depreciation.service";

export const periodsRouter = Router();

periodsRouter.get("/accounting/periods", async (_req, res) => {
  const periods = await AccountingPeriodsRepository.list();
  res.json({ periods });
});

periodsRouter.post("/accounting/periods", async (req, res) => {
  const p = await AccountingPeriodsRepository.create(req.body.period_start, req.body.period_end);
  res.status(201).json(p);
});

periodsRouter.post("/accounting/periods/:periodId/close", async (req, res) => {
  const periodId = Number(req.params.periodId);
  const period = await AccountingPeriodsRepository.getById(periodId);
  if (!period) return res.status(404).json({ error: "Period not found" });
  if (period.is_closed) return res.status(400).json({ error: "Period already closed" });

  // fetch assets - replace with your own
  const { rows: assets } = await db.query(`SELECT * FROM assets`);

  // create snapshots for each asset + components
  for (const asset of assets) {
    const asOf = period.period_end;
    const dep = await calculateAssetDepreciation({ asset, asOfDate: asOf });

    for (const item of dep.items) {
      await db.query(
        `INSERT INTO asset_depreciation_snapshots(
          accounting_period_id, asset_id, component_id,
          cost_basis, accumulated_depreciation, depreciation_for_period,
          net_book_value, method, start_date, end_date
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          periodId,
          asset.id,
          item.type === "COMPONENT" ? item.componentId : null,
          item.costBasis,
          item.accumulatedDepreciation,
          item.monthly, // simplistic: period amount; in production calculate period delta
          item.netBookValue,
          item.method,
          asset.depreciation_start_date,
          period.period_end,
        ]
      );
    }
  }

  const closed = await AccountingPeriodsRepository.close(periodId, req.user?.email ?? null);
  res.json({ closed });
});
