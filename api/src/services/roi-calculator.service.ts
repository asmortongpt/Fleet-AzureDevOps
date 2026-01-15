import { Pool } from 'pg';
import { z } from 'zod';

const roiSchema = z.object({
  assetId: z.number(),
  purchasePrice: z.number(),
  maintenanceCost: z.number(),
  fuelCost: z.number(),
  insuranceCost: z.number(),
  totalMiles: z.number(),
  annualRevenue: z.number(),
  annualCosts: z.number(),
});

type ROIData = z.infer<typeof roiSchema>;

export class ROICalculatorService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  /**
   * Calculates the Total Cost of Ownership for an asset.
   * @param data - The data required for TCO calculation.
   * @returns The Total Cost of Ownership.
   */
  async calculateTCO(data: ROIData): Promise<number> {
    const { purchasePrice, maintenanceCost, fuelCost, insuranceCost } = roiSchema.parse(data);
    return purchasePrice + maintenanceCost + fuelCost + insuranceCost;
  }

  /**
   * Calculates the Cost per Mile for an asset.
   * @param data - The data required for cost per mile calculation.
   * @returns The Cost per Mile.
   */
  async calculateCostPerMile(data: ROIData): Promise<number> {
    const { purchasePrice, maintenanceCost, fuelCost, insuranceCost, totalMiles } = roiSchema.parse(data);
    const totalCosts = purchasePrice + maintenanceCost + fuelCost + insuranceCost;
    return totalMiles > 0 ? totalCosts / totalMiles : 0;
  }

  /**
   * Calculates the Payback Period for an asset.
   * @param data - The data required for payback period calculation.
   * @returns The Payback Period in years.
   */
  async calculatePaybackPeriod(data: ROIData): Promise<number> {
    const { purchasePrice, annualRevenue, annualCosts } = roiSchema.parse(data);
    const investment = purchasePrice;
    const netAnnualProfit = annualRevenue - annualCosts;
    return netAnnualProfit > 0 ? investment / netAnnualProfit : 0;
  }

  /**
   * Calculates the Depreciation of an asset over time.
   * @param purchasePrice - The purchase price of the asset.
   * @param years - The number of years over which to calculate depreciation.
   * @returns The annual depreciation amount.
   */
  async calculateDepreciation(purchasePrice: number, years: number): Promise<number> {
    return purchasePrice / years;
  }

  /**
   * Calculate ROI (Return on Investment)
   * @param data - The data required for ROI calculation
   * @returns The ROI percentage
   */
  async calculateROI(data: ROIData): Promise<number> {
    const { purchasePrice, annualRevenue, annualCosts } = roiSchema.parse(data);
    const totalCost = purchasePrice;
    const netProfit = annualRevenue - annualCosts;
    return totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  }

  /**
   * Get cost per mile (alias for calculateCostPerMile)
   * @param data - The data required for cost per mile calculation
   * @returns The cost per mile
   */
  async getCostPerMile(data: ROIData): Promise<number> {
    return this.calculateCostPerMile(data);
  }
}