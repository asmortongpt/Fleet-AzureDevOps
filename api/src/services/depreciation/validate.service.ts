import { calculateAssetDepreciation } from "./depreciation.service";

export async function validateDepreciation(params: {
  asset: any;
  asOfDate: string;
}) {
  const result = await calculateAssetDepreciation(params);
  const messages: { ok:boolean; code:string; message:string; item?:string }[] = [];

  for (const it of result.items) {
    const depreciable = Math.max(0, it.costBasis - 0); // salvage checked elsewhere; for invariant we just ensure not exceeding cost
    if (it.accumulatedDepreciation < -0.01) {
      messages.push({ ok:false, code:"NEG_ACCUM", message:"Accumulated depreciation cannot be negative", item: it.name });
    }
    if (it.accumulatedDepreciation - it.costBasis > 0.01) {
      messages.push({ ok:false, code:"ACCUM_GT_COST", message:"Accumulated depreciation cannot exceed cost basis", item: it.name });
    }
    if (it.netBookValue < -0.01) {
      messages.push({ ok:false, code:"NEG_NBV", message:"Net book value cannot be negative", item: it.name });
    }
  }

  // Totals tie-out
  const sum = result.items.reduce((acc, it) => {
    acc.costBasis += it.costBasis;
    acc.accumulated += it.accumulatedDepreciation;
    acc.nbv += it.netBookValue;
    return acc;
  }, { costBasis:0, accumulated:0, nbv:0 });

  if (Math.abs(sum.costBasis - result.total.costBasis) > 0.01) {
    messages.push({ ok:false, code:"TOTAL_COST_MISMATCH", message:"Total cost basis mismatch" });
  }
  if (Math.abs(sum.accumulated - result.total.accumulatedDepreciation) > 0.01) {
    messages.push({ ok:false, code:"TOTAL_ACCUM_MISMATCH", message:"Total accumulated depreciation mismatch" });
  }
  if (Math.abs(sum.nbv - result.total.netBookValue) > 0.01) {
    messages.push({ ok:false, code:"TOTAL_NBV_MISMATCH", message:"Total NBV mismatch" });
  }

  const ok = messages.every(m => m.ok !== false);
  return { ok, messages, result };
}
