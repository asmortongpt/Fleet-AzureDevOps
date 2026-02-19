export interface Inspection {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  driver_id?: string;
  inspector_id?: string;
  type: 'pre_trip' | 'post_trip' | 'annual' | 'dot' | 'safety' | 'emissions' | 'special';
  status: 'scheduled' | 'in_progress' | 'completed' | 'failed';
  inspector_name?: string;
  location?: string;
  started_at: Date | string;
  completed_at?: Date | string;
  defects_found?: number;
  passed_inspection?: boolean;
  notes?: string;
  checklist_data?: Record<string, any>;
  signature_url?: string;
  created_at: Date;
  updated_at: Date;
}
