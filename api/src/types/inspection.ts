export interface Inspection {
  id: number;
  tenant_id: number;
  inspection_number?: string;
  vehicle_id: string;
  driver_id?: string;
  inspector_id?: string;
  inspection_type: 'pre_trip' | 'post_trip' | 'periodic' | 'annual' | 'dot' | 'safety';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  passed?: boolean;
  failed_items?: string[];
  checklist_data?: Record<string, any>;
  odometer_reading?: number;
  inspector_notes?: string;
  signature_url?: string;
  scheduled_date?: Date | string;
  completed_at?: Date | string;
  created_at: Date;
  updated_at: Date;
}
