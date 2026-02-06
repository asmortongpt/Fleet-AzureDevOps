import { useQuery } from "@tanstack/react-query";

import { secureFetch } from "@/hooks/use-api";
import logger from "@/utils/logger";

export interface InventoryRecommendation {
  partId: string;
  partNumber: string;
  name: string;
  recommendedQuantity: number;
  estimatedCost: number;
  recommendedAction: "reorder_now" | "reorder_soon" | "monitor" | "reduce_stock";
  urgencyLevel: "critical" | "high" | "medium" | "low";
  confidence: number;
  stockoutRisk: number;
  suggestedOrderDate: string;
  predictionFactors: {
    upcomingMaintenance: number;
    historicalTrend: number;
    seasonalAdjustment: number;
    supplierLeadTime: number;
  };
  recommendedSuppliers: Array<{
    name: string;
    price: number;
    leadTime: number;
    totalScore: number;
  }>;
  metadata?: Record<string, any>;
}

async function fetchRecommendations(): Promise<InventoryRecommendation[]> {
  const response = await secureFetch("/api/inventory/predictive/recommendations");
  if (!response.ok) {
    throw new Error(`Failed to load inventory recommendations (${response.status})`);
  }
  const payload = await response.json();
  const rows = payload?.data || payload?.recommendations || [];
  return Array.isArray(rows) ? rows : [];
}

export function useInventoryRecommendations() {
  return useQuery<InventoryRecommendation[]>({
    queryKey: ["inventory", "predictive", "recommendations"],
    queryFn: async () => {
      try {
        return await fetchRecommendations();
      } catch (error) {
        logger.error("Inventory recommendations unavailable", error);
        return [];
      }
    },
    staleTime: 60 * 1000,
  });
}
