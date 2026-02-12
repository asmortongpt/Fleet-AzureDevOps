import { Router } from "express";

import { calculateAssetDepreciation } from "../services/depreciation/depreciation.service";
import { validateDepreciation } from "../services/depreciation/validate.service";

export const depreciationRouter = Router();

// You must supply your asset fetch logic in production.
// Here we assume middleware attaches req.asset or you implement an AssetRepository.
depreciationRouter.get("/assets/:assetId/depreciation", async (req, res) => {
  const asset = (req as any).asset;
  const asOf = String(req.query.asOf ?? new Date().toISOString().slice(0,10));
  const out = await calculateAssetDepreciation({ asset, asOfDate: asOf });
  res.json(out);
});

depreciationRouter.get("/assets/:assetId/depreciation/validate", async (req, res) => {
  const asset = (req as any).asset;
  const asOf = String(req.query.asOf ?? new Date().toISOString().slice(0,10));
  const out = await validateDepreciation({ asset, asOfDate: asOf });
  res.json(out);
});
