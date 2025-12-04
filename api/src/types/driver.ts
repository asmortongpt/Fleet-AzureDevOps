export interface Driver {
  id: number;
  tenant_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  license_number?: string;
  license_expiry?: Date;
  status?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
