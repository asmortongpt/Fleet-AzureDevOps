export interface Incident {
  id: number;
  tenant_id: number;
  incident_number: string;
  vehicle_id?: string;
  driver_id?: string;
  facility_id?: string;
  incident_type: 'accident' | 'damage' | 'theft' | 'breakdown' | 'safety' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  incident_date: Date | string;
  location?: string;
  description: string;
  injuries_reported?: boolean;
  police_report_filed?: boolean;
  police_report_number?: string;
  estimated_cost?: number;
  actual_cost?: number;
  insurance_claim_number?: string;
  photos?: string[];
  witness_statements?: string;
  notes?: string;
  reported_by: string;
  created_at: Date;
  updated_at: Date;
}
