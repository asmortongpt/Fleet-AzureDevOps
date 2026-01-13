import { Router } from "express";
import { AssetComponentsRepository } from "../repositories/asset-components.repository";
import { validateComponent } from "../services/accounting/validation";
import { assertNotAffectingClosedPeriods } from "../services/accounting/period-lock";

export const componentsRouter = Router();

componentsRouter.get("/assets/:assetId/components", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const rows = await AssetComponentsRepository.listByAsset(assetId);
  res.json({ assetId, components: rows });
});

componentsRouter.post("/assets/:assetId/components", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const body = req.body ?? {};
  const validation = await validateComponent(body);
  if (!validation.ok) return res.status(400).json(validation);

  await assertNotAffectingClosedPeriods({ assetId, effectiveDate: body.depreciation_start_date ?? body.installed_date });

  const created = await AssetComponentsRepository.create({
    asset_id: assetId,
    name: body.name,
    category: body.category ?? null,
    installed_date: body.installed_date,
    depreciation_start_date: body.depreciation_start_date,
    cost_basis: body.cost_basis,
    salvage_value: body.salvage_value,
    useful_life_months: body.useful_life_months,
    depreciation_method: body.depreciation_method,
    notes: body.notes ?? null,
  }, req.user?.email ?? null);

  res.status(201).json({ created, warnings: validation.warnings });
});

componentsRouter.patch("/assets/:assetId/components/:componentId", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const componentId = Number(req.params.componentId);
  const body = req.body ?? {};

  const validation = await validateComponent(body);
  if (!validation.ok) return res.status(400).json(validation);

  if (body.depreciation_start_date || body.installed_date) {
    await assertNotAffectingClosedPeriods({ assetId, componentId, effectiveDate: body.depreciation_start_date ?? body.installed_date });
  }

  const updated = await AssetComponentsRepository.update(componentId, body, req.user?.email ?? null);
  res.json({ updated, warnings: validation.warnings });
});

componentsRouter.post("/assets/:assetId/components/:componentId/dispose", async (req, res) => {
  const assetId = Number(req.params.assetId);
  const componentId = Number(req.params.componentId);
  const body = req.body ?? {};

  await assertNotAffectingClosedPeriods({ assetId, componentId, effectiveDate: body.disposed_date });

  const disposed = await AssetComponentsRepository.dispose(componentId, body.disposed_date, body.disposed_amount, req.user?.email ?? null);
  res.json({ disposed });
});
