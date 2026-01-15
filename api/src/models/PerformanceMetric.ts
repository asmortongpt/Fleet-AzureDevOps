export interface PerformanceMetric {
  id: number;
  vehicleId: number;
  metricType: string;
  name: string;
  value: number;
  unit: string;
  tenantId: string;
  timestamp: Date;
}
