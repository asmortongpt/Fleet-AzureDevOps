export type DepreciationMethod = "STRAIGHT_LINE" | "MACRS_5YR" | "MACRS_7YR";

export type Convention = "FULL_MONTH" | "HALF_MONTH" | "ACTUAL_DAYS";

export interface PolicyMap {
  capitalization_threshold: { amount: number; currency: string };
  depreciation_convention: { type: Convention };
}
