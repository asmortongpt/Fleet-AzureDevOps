export interface WorkOrder {
  id: number;
  tenant_id: number;
  work_order_number: string;
  vehicle_id: string;
  facility_id?: string;
  assigned_technician_id?: string;
  type: 'preventive' | 'corrective' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'approved';
  description: string;
  odometer_reading?: number;
  engine_hours_reading?: number;
  scheduled_start?: Date | string;
  scheduled_end?: Date | string;
  actual_start?: Date | string;
  actual_end?: Date | string;
  labor_hours?: number;
  labor_cost?: number;
  parts_cost?: number;
  notes?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
