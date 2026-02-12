/**
 * Advanced Analytics Service
 * Provides fleet metrics, predictive insights, KPI trends, benchmarks, and executive reports
 */

import { secureFetch } from '@/hooks/use-api';
import logger from '@/utils/logger';

export interface FleetMetrics {
  totalVehicles: number;
  activeVehicles: number;
  utilizationRate: number;
  fuelEfficiency: number;
  totalMilesDriven: number;
  profitMargin: number | null;
  revenuePerVehicle: number | null;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  trend: 'IMPROVING' | 'DECLINING' | 'STABLE';
  recommendedAction?: string;
  potentialSavings?: number;
  timeframe: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  affectedVehicles: string[];
}

export interface KPIForecast {
  date: string;
  value: number;
}

export interface KPITrend {
  metric: string;
  current: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  target?: number;
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  forecast: KPIForecast[];
}

export interface BenchmarkData {
  metric: string;
  fleetValue: number;
  industryAverage: number;
  topQuartile: number;
  ranking: 'TOP_10' | 'TOP_25' | 'AVERAGE' | 'BELOW_AVERAGE';
  improvement: number;
}

export interface CostOptimization {
  id: string;
  opportunity: string;
  area: string;
  implementation: 'IMMEDIATE' | 'SHORT_TERM' | 'LONG_TERM';
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  details: string;
  savings: number;
  currentCost: number;
  optimizedCost: number;
  roi: number;
}

export interface ExecutiveReportSummary {
  totalFleetValue: number;
  operationalCost: number;
  revenue: number;
  profitability: number;
  keyAchievements: string[];
  majorConcerns: string[];
}

export interface FinancialProjection {
  revenue: number;
  profit: number;
}

export interface ExecutiveReport {
  id: string;
  reportDate: string;
  summary: ExecutiveReportSummary;
  recommendations: string[];
  insights: PredictiveInsight[];
  financialProjections: {
    nextQuarter: FinancialProjection;
    nextYear: FinancialProjection;
  };
}

export interface RealtimeKPIs {
  activeVehicles: number;
  vehiclesInTransit: number;
  utilizationRateNow: number;
  revenueToday: number;
  fuelConsumptionToday: number;
  safetyIncidentsToday: number;
}

export interface CostBreakdownItem {
  name: string;
  value: number;
}

export interface DateRange {
  start: string;
  end: string;
}

class AdvancedAnalyticsService {
  private apiBase = import.meta.env.VITE_API_URL || '/api';

  private async requestJson<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await secureFetch(`${this.apiBase}${path}`, options);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  async getFleetMetrics(): Promise<FleetMetrics> {
    try {
      const kpis = await this.requestJson<any>('/executive-dashboard/kpis');

      return {
        totalVehicles: Number(kpis.totalVehicles ?? 0),
        activeVehicles: Number(kpis.activeVehicles ?? 0),
        utilizationRate: Number(kpis.fleetUtilizationRate ?? 0),
        fuelEfficiency: Number(kpis.avgFuelEfficiency ?? 0),
        totalMilesDriven: Number(kpis.totalMileageThisMonth ?? 0),
        profitMargin: null,
        revenuePerVehicle: null,
      };
    } catch (error) {
      logger.error('Failed to load fleet metrics', error);
      return {
        totalVehicles: 0,
        activeVehicles: 0,
        utilizationRate: 0,
        fuelEfficiency: 0,
        totalMilesDriven: 0,
        profitMargin: null,
        revenuePerVehicle: null,
      };
    }
  }

  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    try {
      const insights = await this.requestJson<any[]>('/executive-dashboard/insights');

      return (insights || []).map((insight) => {
        const impact = insight.type === 'critical'
          ? 'HIGH'
          : insight.type === 'warning'
            ? 'MEDIUM'
            : 'LOW';

        const riskLevel = insight.type === 'critical'
          ? 'CRITICAL'
          : insight.type === 'warning'
            ? 'HIGH'
            : insight.type === 'recommendation'
              ? 'MEDIUM'
              : 'LOW';

        return {
          id: insight.id,
          title: insight.title,
          description: insight.message,
          category: insight.type,
          impact,
          confidence: Math.round((insight.confidence ?? 0) * 100),
          trend: 'STABLE',
          recommendedAction: insight.actionable ? insight.message : undefined,
          timeframe: insight.timestamp ? new Date(insight.timestamp).toLocaleDateString() : 'Recent',
          riskLevel,
          affectedVehicles: insight.relatedVehicle ? [insight.relatedVehicle] : [],
        };
      });
    } catch (error) {
      logger.error('Failed to load predictive insights', error);
      return [];
    }
  }

  async getKPITrends(): Promise<KPITrend[]> {
    try {
      const trendData = await this.requestJson<{
        utilization: { date: string; value: number; label: string }[];
        costs: { date: string; value: number; label: string }[];
        incidents: { date: string; value: number; label: string }[];
        maintenance: { date: string; value: number; label: string }[];
      }>('/executive-dashboard/trends?days=30');

      const buildTrend = (metric: string, points: { date: string; value: number }[]): KPITrend => {
        const sorted = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const current = sorted.length ? sorted[sorted.length - 1].value : 0;
        const previous = sorted.length > 1 ? sorted[sorted.length - 2].value : current;
        const change = current - previous;
        const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

        return {
          metric,
          current,
          change,
          changePercent,
          trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
          status: current === 0 ? 'WARNING' : 'GOOD',
          forecast: sorted.map((point) => ({ date: point.date, value: point.value })),
        };
      };

      return [
        buildTrend('Utilization', trendData.utilization || []),
        buildTrend('Maintenance Costs', trendData.costs || []),
        buildTrend('Incidents', trendData.incidents || []),
        buildTrend('Work Orders', trendData.maintenance || []),
      ];
    } catch (error) {
      logger.error('Failed to load KPI trends', error);
      return [];
    }
  }

  async getBenchmarkData(): Promise<BenchmarkData[]> {
    return [];
  }

  async getCostOptimizations(): Promise<CostOptimization[]> {
    return [];
  }

  async generateExecutiveReport(dateRange: DateRange): Promise<ExecutiveReport> {
    try {
      const [kpis, costAnalysis, insights] = await Promise.all([
        this.requestJson<any>('/executive-dashboard/kpis'),
        this.requestJson<any>('/executive-dashboard/cost-analysis'),
        this.getPredictiveInsights(),
      ]);

      const keyAchievements = insights.filter((insight) => insight.riskLevel === 'LOW').map((insight) => insight.title);
      const majorConcerns = insights.filter((insight) => insight.riskLevel === 'HIGH' || insight.riskLevel === 'CRITICAL')
        .map((insight) => insight.title);
      const recommendations = insights.filter((insight) => insight.recommendedAction).map((insight) => insight.recommendedAction as string);

      return {
        id: `report-${Date.now()}`,
        reportDate: new Date().toISOString(),
        summary: {
          totalFleetValue: 0,
          operationalCost: Number(costAnalysis?.totalCosts ?? 0),
          revenue: 0,
          profitability: 0,
          keyAchievements,
          majorConcerns,
        },
        recommendations,
        insights,
        financialProjections: {
          nextQuarter: { revenue: 0, profit: 0 },
          nextYear: { revenue: 0, profit: 0 },
        },
      };
    } catch (error) {
      logger.error('Failed to generate executive report', error);
      return {
        id: `report-${Date.now()}`,
        reportDate: new Date().toISOString(),
        summary: {
          totalFleetValue: 0,
          operationalCost: 0,
          revenue: 0,
          profitability: 0,
          keyAchievements: [],
          majorConcerns: [],
        },
        recommendations: [],
        insights: [],
        financialProjections: {
          nextQuarter: { revenue: 0, profit: 0 },
          nextYear: { revenue: 0, profit: 0 },
        },
      };
    }
  }

  async getRealtimeKPIs(): Promise<RealtimeKPIs> {
    try {
      const kpis = await this.requestJson<any>('/executive-dashboard/kpis');
      return {
        activeVehicles: Number(kpis.activeVehicles ?? 0),
        vehiclesInTransit: Number(kpis.activeVehicles ?? 0),
        utilizationRateNow: Number(kpis.fleetUtilizationRate ?? 0),
        revenueToday: 0,
        fuelConsumptionToday: 0,
        safetyIncidentsToday: Number(kpis.incidentRatePer100kMiles ? Math.round(kpis.incidentRatePer100kMiles) : 0),
      };
    } catch (error) {
      logger.error('Failed to load realtime KPIs', error);
      return {
        activeVehicles: 0,
        vehiclesInTransit: 0,
        utilizationRateNow: 0,
        revenueToday: 0,
        fuelConsumptionToday: 0,
        safetyIncidentsToday: 0,
      };
    }
  }

  async getCostBreakdown(): Promise<CostBreakdownItem[]> {
    try {
      const costAnalysis = await this.requestJson<any>('/executive-dashboard/cost-analysis');
      const breakdown = Array.isArray(costAnalysis?.breakdown) ? costAnalysis.breakdown : [];

      return breakdown.map((item: any) => ({
        name: String(item.category ?? 'Other').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
        value: Number(item.amount ?? 0),
      }));
    } catch (error) {
      logger.error('Failed to load cost breakdown', error);
      return [];
    }
  }
}

export default new AdvancedAnalyticsService();
