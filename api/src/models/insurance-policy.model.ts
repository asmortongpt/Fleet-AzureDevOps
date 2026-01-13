export interface InsurancePolicy {
  id: number;
  policyNumber: string;
  coverage_amount?: number;
  start_date?: Date;
  end_date?: Date;
  status?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
