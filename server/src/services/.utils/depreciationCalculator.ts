export enum DepreciationMethod {
  STRAIGHT_LINE,
  DOUBLE_DECLINING,
  MACRS
}

export function calculateDepreciation(asset: any, method: DepreciationMethod): any {
  // Placeholder depreciation calculation
  return {
    method,
    schedule: [],
    totalDepreciation: 0
  };
}
