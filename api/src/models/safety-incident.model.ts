export interface SafetyIncident {
  id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  date: Date;
  tenantId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
