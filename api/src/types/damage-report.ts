/**
 * Damage Report Type Definitions
 * Matches the damage_reports database table schema
 */

export interface DamageReport {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  reported_by: string;
  damage_description: string;
  damage_severity: 'minor' | 'moderate' | 'severe';
  damage_location: string | null;
  photos: string[];
  triposr_task_id: string | null;
  triposr_status: 'pending' | 'processing' | 'completed' | 'failed';
  triposr_model_url: string | null;
  linked_work_order_id: string | null;
  inspection_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDamageReportDto {
  vehicle_id: string;
  reported_by: string;
  damage_description: string;
  damage_severity: 'minor' | 'moderate' | 'severe';
  damage_location?: string;
  photos?: string[];
  linked_work_order_id?: string;
  inspection_id?: string;
}

export interface UpdateDamageReportDto {
  damage_description?: string;
  damage_severity?: 'minor' | 'moderate' | 'severe';
  damage_location?: string;
  photos?: string[];
  triposr_status?: 'pending' | 'processing' | 'completed' | 'failed';
  triposr_model_url?: string;
  linked_work_order_id?: string;
  inspection_id?: string;
}

export interface DamageReportDetailed extends DamageReport {
  // From vehicles table
  vin: string;
  make: string;
  model: string;
  year: number;

  // From drivers/users table
  reported_by_license: string;
  reported_by_name: string;

  // From work_orders table
  work_order_id: string | null;
  work_order_status: string | null;

  // From inspections table
  inspection_date: Date | null;
  inspection_status: string | null;
}

export interface Generate3DModelDto {
  damage_report_id: string;
  photos: string[];
}

export interface TripoSRTask {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model_url: string | null;
  created_at: Date;
  updated_at: Date;
  error?: string;
}
