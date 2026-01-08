/**
 * TypeScript interfaces for Asset Utilization Analytics
 * Generated for Phase 1 deployment
 */

export interface AssetUtilizationInput {
  assetId: string;
  startDate: string;
  endDate: string;
}

export interface AssetUtilizationResult {
  asset_id: string;
  utilization_percentage: number;
}

export interface HeatmapData {
  hour: number;
  usageCount: number;
}

export interface IdleAlert {
  assetId: string;
  lastActiveDate: Date;
}

export interface UtilizationMetrics {
  assetId: string;
  period: string;
  utilizationPercentage: number;
  activeHours: number;
  idleHours: number;
  totalHours: number;
}

export interface ROIMetrics {
  assetId: string;
  totalCostOfOwnership: number;
  purchasePrice: number;
  maintenanceCosts: number;
  fuelCosts: number;
  insuranceCosts: number;
  totalMiles: number;
  costPerMile: number;
  paybackPeriod: number;
  annualRevenue: number;
  annualCosts: number;
}
