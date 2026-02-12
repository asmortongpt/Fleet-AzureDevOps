export interface OSHARecord {
  tenant_id: string;
  case_number: string;
  incident_date: string;
  incident_description: string;
  employee_name?: string;
  job_title?: string;
  body_part_affected?: string;
  injury_type?: string;
  is_recordable: boolean;
  is_lost_time: boolean;
  days_away_from_work: number;
  days_restricted_duty: number;
  location?: string;
  status: 'open' | 'investigating' | 'closed';
  metadata?: Record<string, any>;
  reported_date?: string;
}
