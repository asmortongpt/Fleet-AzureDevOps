export interface Driver {
  id: number;
  tenant_id: number;
  first_name: string;
  last_name: string;
  firstName?: string;  // Alias for camelCase compatibility
  lastName?: string;   // Alias for camelCase compatibility
  email: string;
  phone?: string;
  license_number?: string;
  licenseNumber?: string;  // Alias for camelCase compatibility
  license_expiry?: Date;
  status?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}
