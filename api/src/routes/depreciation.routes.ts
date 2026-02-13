import { Request, Router } from "express";

import { calculateAssetDepreciation } from "../services/depreciation/depreciation.service";
import { validateDepreciation } from "../services/depreciation/validate.service";

interface DepreciationAsset {
  id: number;
  name: string;
  cost_basis: number;
  salvage_value: number;
  useful_life_months: number;
  depreciation_start_date: string;
  depreciation_method: string;
  disposed_date?: string | null;
}

interface AssetRequest extends Request {
  asset?: DepreciationAsset;
}

export const depreciationRouter = Router();

// You must supply your asset fetch logic in production.
// Here we assume middleware attaches req.asset or you implement an AssetRepository.
depreciationRouter.get("/assets/:assetId/depreciation", async (req: AssetRequest, res) => {
  const asset = req.asset;
  const asOf = String(req.query.asOf ?? new Date().toISOString().slice(0,10));
  const out = await calculateAssetDepreciation({ asset, asOfDate: asOf });
  res.json(out);
});

depreciationRouter.get("/assets/:assetId/depreciation/validate", async (req: AssetRequest, res) => {
  const asset = req.asset;
  const asOf = String(req.query.asOf ?? new Date().toISOString().slice(0,10));
  const out = await validateDepreciation({ asset, asOfDate: asOf });
  res.json(out);
});
