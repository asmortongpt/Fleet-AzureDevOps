/**
 * Predictive Reordering Service
 * AI-powered inventory forecasting and reorder recommendation system
 */

// Usage patterns and demand history
export interface PartUsagePattern {
  partId: string;
  partNumber: string;
  name: string;
  category: string;
  averageMonthlyUsage: number;
  usageVariability: number;
  seasonalityFactor: number;
  trendDirection: 'stable' | 'increasing' | 'decreasing';
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

// Maintenance schedule input
export interface MaintenanceScheduleInput {
  vehicleId: string;
  scheduledMaintenanceDate: Date;
  maintenanceType: string;
  requiredParts: Array<{
    partNumber: string;
    quantity: number;
    criticality: 'critical' | 'routine' | 'optional';
  }>;
}

// Prediction factors used in the recommendation
export interface PredictionFactors {
  upcomingMaintenance: number;
  historicalTrend: number;
  seasonalAdjustment: number;
  supplierLeadTime: number;
}

// Recommended supplier option
export interface RecommendedSupplier {
  name: string;
  price: number;
  leadTime: number;
  totalScore: number;
}

// Main reorder recommendation output
export interface ReorderRecommendation {
  partId: string;
  partNumber: string;
  name: string;
  recommendedQuantity: number;
  estimatedCost: number;
  recommendedAction: 'reorder_now' | 'reorder_soon' | 'monitor' | 'reduce_stock';
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  stockoutRisk: number;
  suggestedOrderDate: Date;
  predictionFactors: PredictionFactors;
  recommendedSuppliers: RecommendedSupplier[];
}

// Service class for predictive reordering
class PredictiveReorderingService {
  private usagePatterns: Map<string, PartUsagePattern> = new Map();
  private maintenanceSchedule: MaintenanceScheduleInput[] = [];

  /**
   * Update usage patterns for parts
   */
  updateUsagePatterns(patterns: PartUsagePattern[]): void {
    patterns.forEach((pattern) => {
      this.usagePatterns.set(pattern.partId, pattern);
    });
  }

  /**
   * Load maintenance schedule
   */
  loadMaintenanceSchedule(schedule: MaintenanceScheduleInput[]): void {
    this.maintenanceSchedule = schedule;
  }

  /**
   * Generate reorder recommendations based on AI analysis
   */
  async generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
    const recommendations: ReorderRecommendation[] = [];

    for (const [, pattern] of this.usagePatterns) {
      // Calculate upcoming maintenance demand
      const upcomingMaintenanceDemand = this.calculateUpcomingMaintenanceDemand(pattern);

      // Calculate trend adjustment
      const historicalTrendFactor = this.calculateTrendAdjustment(pattern);

      // Calculate seasonal adjustment
      const seasonalAdjustment = pattern.seasonalityFactor;

      // Calculate days until stockout
      const daysUntilStockout = this.calculateDaysUntilStockout(pattern);

      // Determine action and urgency
      const stockoutRisk = Math.max(0, Math.min(1, (pattern.reorderPoint - pattern.currentStock) / pattern.reorderPoint));
      const { recommendedAction, urgencyLevel } = this.determineAction(daysUntilStockout, stockoutRisk);

      // Calculate recommended quantity
      const recommendedQuantity = this.calculateOptimalOrderQuantity(pattern, upcomingMaintenanceDemand);

      // Calculate estimated cost
      const estimatedCost = recommendedQuantity * pattern.unitCost;

      // Calculate confidence score
      const confidence = this.calculateConfidence(pattern, historicalTrendFactor);

      // Generate suggested order date
      const suggestedOrderDate = this.calculateSuggestedOrderDate(pattern, daysUntilStockout);

      // Get recommended suppliers (stub for now)
      const recommendedSuppliers = this.getRecommendedSuppliers(pattern);

      recommendations.push({
        partId: pattern.partId,
        partNumber: pattern.partNumber,
        name: pattern.name,
        recommendedQuantity,
        estimatedCost,
        recommendedAction,
        urgencyLevel,
        confidence,
        stockoutRisk,
        suggestedOrderDate,
        predictionFactors: {
          upcomingMaintenance: upcomingMaintenanceDemand,
          historicalTrend: historicalTrendFactor,
          seasonalAdjustment,
          supplierLeadTime: pattern.averageLeadTime
        },
        recommendedSuppliers
      });
    }

    // Sort by urgency and stockout risk
    return recommendations.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aUrgency = urgencyOrder[a.urgencyLevel as keyof typeof urgencyOrder];
      const bUrgency = urgencyOrder[b.urgencyLevel as keyof typeof urgencyOrder];

      if (aUrgency !== bUrgency) {
        return aUrgency - bUrgency;
      }
      return b.stockoutRisk - a.stockoutRisk;
    });
  }

  /**
   * Calculate upcoming maintenance demand
   */
  private calculateUpcomingMaintenanceDemand(pattern: PartUsagePattern): number {
    let demandQuantity = 0;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const schedule of this.maintenanceSchedule) {
      if (schedule.scheduledMaintenanceDate <= thirtyDaysFromNow) {
        const requiredPart = schedule.requiredParts.find(
          (p) => p.partNumber === pattern.partNumber
        );
        if (requiredPart) {
          demandQuantity += requiredPart.quantity;
        }
      }
    }

    return demandQuantity;
  }

  /**
   * Calculate trend adjustment factor
   */
  private calculateTrendAdjustment(pattern: PartUsagePattern): number {
    const trendMultipliers: Record<string, number> = {
      increasing: 1.15,
      stable: 1.0,
      decreasing: 0.85
    };
    return trendMultipliers[pattern.trendDirection] || 1.0;
  }

  /**
   * Calculate days until stockout
   */
  private calculateDaysUntilStockout(pattern: PartUsagePattern): number {
    const dailyUsage = pattern.averageMonthlyUsage / 30;
    const bufferStock = Math.max(pattern.safetyStock, pattern.reorderPoint);

    if (dailyUsage <= 0) return 365;

    const daysRemaining = (pattern.currentStock - bufferStock) / dailyUsage;
    return Math.max(0, daysRemaining);
  }

  /**
   * Determine recommended action and urgency level
   */
  private determineAction(
    daysUntilStockout: number,
    stockoutRisk: number
  ): {
    recommendedAction: 'reorder_now' | 'reorder_soon' | 'monitor' | 'reduce_stock';
    urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
  } {
    if (daysUntilStockout <= 7 || stockoutRisk > 0.5) {
      return {
        recommendedAction: 'reorder_now',
        urgencyLevel: 'critical'
      };
    }

    if (daysUntilStockout <= 14 || stockoutRisk > 0.3) {
      return {
        recommendedAction: 'reorder_soon',
        urgencyLevel: 'high'
      };
    }

    if (daysUntilStockout <= 30 || stockoutRisk > 0.1) {
      return {
        recommendedAction: 'monitor',
        urgencyLevel: 'medium'
      };
    }

    return {
      recommendedAction: 'monitor',
      urgencyLevel: 'low'
    };
  }

  /**
   * Calculate optimal order quantity
   */
  private calculateOptimalOrderQuantity(
    pattern: PartUsagePattern,
    upcomingMaintenanceDemand: number
  ): number {
    const nextMonthDemand = pattern.averageMonthlyUsage + upcomingMaintenanceDemand;
    const leadTimeDemand = (pattern.averageLeadTime / 30) * nextMonthDemand;
    const safetyStock = pattern.safetyStock;

    // EOQ-based calculation
    const orderQty = Math.max(
      pattern.economicOrderQuantity,
      Math.ceil(nextMonthDemand + leadTimeDemand + safetyStock - pattern.currentStock)
    );

    return Math.max(1, orderQty);
  }

  /**
   * Calculate prediction confidence score (0-1)
   */
  private calculateConfidence(pattern: PartUsagePattern, trendFactor: number): number {
    // Base confidence from supplier reliability
    let confidence = pattern.supplierReliability;

    // Adjust for usage variability (lower variability = higher confidence)
    const variabilityFactor = Math.max(0.5, 1 - pattern.usageVariability / 100);
    confidence *= variabilityFactor;

    // Adjust for trend strength
    const trendStrength = Math.abs(trendFactor - 1) < 0.05 ? 0.95 : 0.85;
    confidence *= trendStrength;

    return Math.max(0.1, Math.min(0.99, confidence));
  }

  /**
   * Calculate suggested order date
   */
  private calculateSuggestedOrderDate(pattern: PartUsagePattern, daysUntilStockout: number): Date {
    const orderDate = new Date();

    // Order should arrive before stockout considering lead time
    const orderPlacementWindow = Math.max(0, daysUntilStockout - pattern.averageLeadTime);

    // If we need to order immediately or within 7 days, order today
    if (orderPlacementWindow <= 7) {
      return orderDate;
    }

    // Otherwise, order in the future to align with optimal timing
    orderDate.setDate(orderDate.getDate() + Math.floor(orderPlacementWindow / 2));
    return orderDate;
  }

  /**
   * Get recommended suppliers (stub - can be extended with supplier service)
   */
  private getRecommendedSuppliers(pattern: PartUsagePattern): RecommendedSupplier[] {
    // This is a simplified stub - in production, this would query a supplier database
    return [
      {
        name: 'Primary Supplier',
        price: pattern.unitCost,
        leadTime: pattern.averageLeadTime,
        totalScore: pattern.supplierReliability
      },
      {
        name: 'Backup Supplier',
        price: pattern.unitCost * 1.05,
        leadTime: Math.ceil(pattern.averageLeadTime * 1.2),
        totalScore: 0.85
      }
    ];
  }
}

// Export singleton instance
export const predictiveReorderingService = new PredictiveReorderingService();

export default PredictiveReorderingService;
