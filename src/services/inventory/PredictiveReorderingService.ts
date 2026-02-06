/**
 * Predictive Reordering Service
 * Real-data wrapper (no mock placeholders)
 */

import { secureFetch } from "@/hooks/use-api";
import logger from "@/utils/logger";
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
  // Deprecated: kept for API compatibility only (no in-memory mocks).
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

export const predictiveReorderingService = new PredictiveReorderingService();
