export interface PerformanceMetric {
  id: number;
  vehicleId: number;
  metricType: string;
  value: number;
  tenantId: string;
  timestamp: Date;
}
