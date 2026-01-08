import { AssetComponentsRepository } from "../../repositories/asset-components.repository";
import { PoliciesRepository } from "../../repositories/policies.repository";
import { straightLine } from "./methods/straight-line";
import { Convention } from "../../types";

export interface DepreciationItem {
  type: "BASE_ASSET" | "COMPONENT";
  name: string;
  componentId?: number;
  costBasis: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  monthly: number;
  method: string;
}

export async function calculateAssetDepreciation(params: {
  asset: { id:number; name:string; cost_basis:number; salvage_value:number; useful_life_months:number; depreciation_start_date:string; depreciation_method:string; disposed_date?:string|null };
  asOfDate: string;
}) {
  const conventionPolicy = await PoliciesRepository.getPolicy<{type:Convention}>("depreciation_convention");
  const convention: Convention = (conventionPolicy?.type ?? "FULL_MONTH") as Convention;

  const asOf = new Date(params.asOfDate);

  // Base asset (assumes these fields exist; adapt to your schema)
  const baseStart = new Date(params.asset.depreciation_start_date);
  const baseDisposed = params.asset.disposed_date ? new Date(params.asset.disposed_date) : null;

  const base = straightLine({
    costBasis: Number(params.asset.cost_basis),
    salvageValue: Number(params.asset.salvage_value),
    usefulLifeMonths: Number(params.asset.useful_life_months),
    startDate: baseStart,
    asOfDate: asOf,
    disposedDate: baseDisposed,
    convention,
  });

  const items: DepreciationItem[] = [{
    type: "BASE_ASSET",
    name: params.asset.name ?? "Asset",
    costBasis: Number(params.asset.cost_basis),
    accumulatedDepreciation: base.accumulated,
    netBookValue: base.nbv,
    monthly: base.monthly,
    method: params.asset.depreciation_method ?? "STRAIGHT_LINE",
  }];

  const components = await AssetComponentsRepository.listByAsset(params.asset.id);

  for (const c of components) {
    const start = new Date(c.depreciation_start_date);
    const disposed = c.disposed_date ? new Date(c.disposed_date) : null;

    // currently supports SL; extend per method
    const r = straightLine({
      costBasis: Number(c.cost_basis),
      salvageValue: Number(c.salvage_value),
      usefulLifeMonths: Number(c.useful_life_months),
      startDate: start,
      asOfDate: asOf,
      disposedDate: disposed,
      convention,
    });

    items.push({
      type: "COMPONENT",
      componentId: c.id,
      name: c.name,
      costBasis: Number(c.cost_basis),
      accumulatedDepreciation: r.accumulated,
      netBookValue: r.nbv,
      monthly: r.monthly,
      method: c.depreciation_method,
    });
  }

  const total = items.reduce((acc, it) => {
    acc.costBasis += it.costBasis;
    acc.accumulatedDepreciation += it.accumulatedDepreciation;
    acc.netBookValue += it.netBookValue;
    return acc;
  }, { costBasis:0, accumulatedDepreciation:0, netBookValue:0 });

  return { asOfDate: params.asOfDate, assetId: params.asset.id, total, items, convention };
}
