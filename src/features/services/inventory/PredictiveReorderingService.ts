/**
 * Predictive Reordering Service
 * Real-data wrapper (no mock placeholders)
 */

import { secureFetch } from "@/hooks/use-api";
import logger from "@/utils/logger";

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
  updateUsagePatterns(): void {
    logger.warn("[PredictiveReorderingService] updateUsagePatterns is deprecated; data comes from API");
  }

  loadMaintenanceSchedule(): void {
    logger.warn("[PredictiveReorderingService] loadMaintenanceSchedule is deprecated; data comes from API");
  }

  async generateReorderRecommendations(): Promise<ReorderRecommendation[]> {
    const response = await secureFetch("/api/inventory/predictive/recommendations");
    if (!response.ok) {
      throw new Error(`Failed to load predictive recommendations (${response.status})`);
    }
    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  }
}

// Export singleton instance
export const predictiveReorderingService = new PredictiveReorderingService();

export default PredictiveReorderingService;
