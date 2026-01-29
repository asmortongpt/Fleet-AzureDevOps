/**
 * Predictive Reordering Service
 * AI-powered inventory management for CTAFleet
 */

export interface PartUsagePattern {
  partId: string;
  partNumber: string;
  name: string;
  category: string;
  averageMonthlyUsage: number;
  usageVariability: number;
  seasonalityFactor: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQuantity: number;
  averageLeadTime: number;
  leadTimeVariability: number;
  supplierReliability: number;
  associatedVehicles: string[];
  criticalityScore: number;
  unitCost: number;
  carryingCostRate: number;
  stockoutCostEstimate: number;
}

export interface MaintenanceScheduleInput {
  vehicleId: string;
  scheduledMaintenanceDate: Date;
  maintenanceType: string;
  requiredParts: {
    partNumber: string;
    quantity: number;
    criticality: 'critical' | 'routine';
  }[];
}

export interface SupplierRecommendation {
  name: string;
  price: number;
  leadTime: number;
  totalScore: number;
}

export interface ReorderRecommendation {
  partId: string;
  partNumber: string;
  name: string;
  recommendedAction: 'reorder_now' | 'reorder_soon' | 'monitor' | 'reduce_stock';
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendedQuantity: number;
  estimatedCost: number;
  stockoutRisk: number;
  confidence: number;
  suggestedOrderDate: Date;
  predictionFactors: {
    upcomingMaintenance: number;
    historicalTrend: number;
    seasonalAdjustment: number;
    supplierLeadTime: number;
  };
  recommendedSuppliers: SupplierRecommendation[];
}

class PredictiveReorderingService {
  private usagePatterns: PartUsagePattern[] = [];
  private maintenanceSchedule: MaintenanceScheduleInput[] = [];

  updateUsagePatterns(patterns: PartUsagePattern[]): void {
    this.usagePatterns = patterns;
  }

  loadMaintenanceSchedule(schedule: MaintenanceScheduleInput[]): void {
    this.maintenanceSchedule = schedule;
  }

  async generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
    // Generate recommendations based on usage patterns and maintenance schedule
    const recommendations: ReorderRecommendation[] = [];

    for (const pattern of this.usagePatterns) {
      const stockoutRisk = this.calculateStockoutRisk(pattern);
      const urgency = this.determineUrgency(stockoutRisk, pattern.criticalityScore);
      const action = this.determineAction(stockoutRisk, pattern.currentStock, pattern.reorderPoint);

      if (action !== 'monitor' || stockoutRisk > 0.1) {
        recommendations.push({
          partId: pattern.partId,
          partNumber: pattern.partNumber,
          name: pattern.name,
          recommendedAction: action,
          urgencyLevel: urgency,
          recommendedQuantity: pattern.economicOrderQuantity,
          estimatedCost: pattern.economicOrderQuantity * pattern.unitCost,
          stockoutRisk,
          confidence: this.calculateConfidence(pattern),
          suggestedOrderDate: this.calculateOrderDate(pattern),
          predictionFactors: {
            upcomingMaintenance: this.countUpcomingMaintenanceNeed(pattern.partNumber),
            historicalTrend: pattern.seasonalityFactor,
            seasonalAdjustment: pattern.seasonalityFactor,
            supplierLeadTime: pattern.averageLeadTime,
          },
          recommendedSuppliers: this.getRecommendedSuppliers(pattern),
        });
      }
    }

    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
    });
  }

  private calculateStockoutRisk(pattern: PartUsagePattern): number {
    const daysOfStock = pattern.currentStock / (pattern.averageMonthlyUsage / 30);
    const riskThreshold = pattern.averageLeadTime + pattern.leadTimeVariability;

    if (daysOfStock <= riskThreshold) {
      return Math.min(1, (riskThreshold - daysOfStock) / riskThreshold + 0.5);
    }
    return Math.max(0, 0.5 - (daysOfStock - riskThreshold) / (riskThreshold * 2));
  }

  private determineUrgency(stockoutRisk: number, criticality: number): 'critical' | 'high' | 'medium' | 'low' {
    const score = stockoutRisk * criticality;
    if (score > 7) return 'critical';
    if (score > 4) return 'high';
    if (score > 2) return 'medium';
    return 'low';
  }

  private determineAction(
    stockoutRisk: number,
    currentStock: number,
    reorderPoint: number
  ): 'reorder_now' | 'reorder_soon' | 'monitor' | 'reduce_stock' {
    if (currentStock <= reorderPoint * 0.5 || stockoutRisk > 0.7) return 'reorder_now';
    if (currentStock <= reorderPoint || stockoutRisk > 0.4) return 'reorder_soon';
    if (currentStock > reorderPoint * 2) return 'reduce_stock';
    return 'monitor';
  }

  private calculateConfidence(pattern: PartUsagePattern): number {
    const reliabilityFactor = pattern.supplierReliability;
    const variabilityFactor = 1 - (pattern.usageVariability / pattern.averageMonthlyUsage);
    return Math.max(0.5, Math.min(0.95, (reliabilityFactor + variabilityFactor) / 2));
  }

  private calculateOrderDate(pattern: PartUsagePattern): Date {
    const daysOfStock = pattern.currentStock / (pattern.averageMonthlyUsage / 30);
    const orderLeadTime = pattern.averageLeadTime + pattern.leadTimeVariability;
    const daysUntilOrder = Math.max(0, daysOfStock - orderLeadTime - pattern.safetyStock / (pattern.averageMonthlyUsage / 30));

    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() + Math.floor(daysUntilOrder));
    return orderDate;
  }

  private countUpcomingMaintenanceNeed(partNumber: string): number {
    return this.maintenanceSchedule.reduce((count, schedule) => {
      const part = schedule.requiredParts.find(p => p.partNumber === partNumber);
      return count + (part ? part.quantity : 0);
    }, 0);
  }

  private getRecommendedSuppliers(pattern: PartUsagePattern): SupplierRecommendation[] {
    // Mock supplier recommendations
    return [
      {
        name: 'AutoParts Direct',
        price: pattern.unitCost * 0.95,
        leadTime: pattern.averageLeadTime - 1,
        totalScore: 0.92,
      },
      {
        name: 'Fleet Supply Co',
        price: pattern.unitCost,
        leadTime: pattern.averageLeadTime,
        totalScore: 0.88,
      },
      {
        name: 'National Auto Parts',
        price: pattern.unitCost * 1.05,
        leadTime: pattern.averageLeadTime + 2,
        totalScore: 0.75,
      },
    ];
  }
}

export const predictiveReorderingService = new PredictiveReorderingService();
