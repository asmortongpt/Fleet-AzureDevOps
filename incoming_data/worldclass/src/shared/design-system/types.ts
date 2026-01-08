export type Status = 'good'|'warn'|'bad'|'info';

export type EntityType = 'vehicle'|'driver'|'part'|'record';

export interface EntityRef {
  entityType: EntityType;
  id: string;
  displayName: string;
  status: Status;
  badge?: string;
  imageUrl?: string;
}

export interface VehicleRow extends EntityRef {
  entityType: 'vehicle';
  kind: string;
  odometer: number;
  fuelPct: number;
  healthScore: number;
  alerts: number;
  updatedAgo: string;
}

export interface RecordRow extends EntityRef {
  entityType: 'record';
  recordType: string;
  severity: Status;
  timestamp: string;
  source: string;
  summary: string;
  payload: any;
  related: EntityRef[];
}
