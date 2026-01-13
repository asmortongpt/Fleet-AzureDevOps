export interface ReplacementPlanning {
  id: number;
  vehicleId: number;
  plannedDate: Date;
  estimatedCost: number;
  tenantId: string;
  employeeId: string;
  replacementEmployeeId: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
