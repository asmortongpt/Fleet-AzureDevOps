/**
 * Radio Dispatch TypeScript Types
 * Comprehensive type definitions for radio monitoring and dispatch
 */

export type TransmissionPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export type TransmissionStatus = 'LIVE' | 'TRANSCRIBING' | 'COMPLETED' | 'PROCESSING';

export type EntityType = 'UNIT' | 'LOCATION' | 'INCIDENT_CODE' | 'PERSON' | 'TIME' | 'OTHER';

export type PolicyConditionOperator = 'contains' | 'equals' | 'matches_pattern' | 'has_entity';

export type PolicyActionType = 'CREATE_INCIDENT' | 'CREATE_TASK' | 'SEND_NOTIFICATION' | 'ASSIGN_UNIT' | 'LOG_EVENT';

export type PolicyExecutionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';

export interface RadioChannel {
  id: string;
  name: string;
  frequency?: string;
  source_type: 'SIP' | 'HTTP_STREAM' | 'FILE';
  source_url?: string;
  sip_server?: string;
  sip_extension?: string;
  sip_password?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  last_transmission?: string;
  created_at: string;
  updated_at: string;
}

export interface ExtractedEntity {
  id: string;
  type: EntityType;
  value: string;
  confidence: number;
  start_char?: number;
  end_char?: number;
}

export interface Transmission {
  id: string;
  channel_id: string;
  channel_name: string;
  audio_url?: string;
  transcript: string;
  confidence: number;
  priority: TransmissionPriority;
  status: TransmissionStatus;
  duration_seconds?: number;
  entities: ExtractedEntity[];
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyCondition {
  id?: string;
  field: string;
  operator: PolicyConditionOperator;
  value: string;
}

export interface PolicyAction {
  id?: string;
  type: PolicyActionType;
  config: Record<string, any>;
}

export interface DispatchPolicy {
  id: string;
  name: string;
  description?: string;
  priority: number;
  enabled: boolean;
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  requires_approval: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PolicyExecution {
  id: string;
  policy_id: string;
  policy_name: string;
  transmission_id: string;
  transmission: Transmission;
  status: PolicyExecutionStatus;
  matched_conditions: string[];
  actions_preview: PolicyAction[];
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  executed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface RadioSocketEvents {
  transmission_started: (data: { transmission_id: string; channel_id: string }) => void;
  transcription: (data: Transmission) => void;
  policy_triggered: (data: PolicyExecution) => void;
  channel_status_changed: (data: { channel_id: string; status: string }) => void;
  error: (data: { message: string; code?: string }) => void;
}

export interface ChannelStatistics {
  channel_id: string;
  total_transmissions: number;
  total_duration_seconds: number;
  average_confidence: number;
  priority_counts: Record<TransmissionPriority, number>;
  last_24h_count: number;
}

export interface PolicyStatistics {
  policy_id: string;
  executions_count: number;
  approvals_count: number;
  rejections_count: number;
  success_rate: number;
  average_approval_time_seconds: number;
}

// Enhanced PTT Types
export interface PTTState {
  isTransmitting: boolean;
  isPTTActive: boolean;
  audioLevel: number;
  error: string | null;
}

export interface AudioVisualizationData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  averageLevel: number;
  peakLevel: number;
}

export interface DispatchUnit {
  id: string;
  callSign: string;
  vehicleId?: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'EMERGENCY';
  location?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
  };
  lastUpdate: string;
}

export interface EmergencyAlert {
  id: string;
  type: 'PANIC' | 'MAYDAY' | 'OFFICER_DOWN' | 'MEDICAL' | 'FIRE' | 'PURSUIT';
  unitId?: string;
  vehicleId?: string;
  location?: {
    lat: number;
    lng: number;
  };
  description: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  priority: TransmissionPriority;
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface DispatchSocketMessage {
  type: 'channel_joined' | 'user_joined' | 'user_left' | 'transmission_started' |
        'audio_chunk' | 'transmission_ended' | 'emergency_alert' | 'unit_status_update' |
        'transcript_update' | 'error';
  data?: any;
  channelId?: string;
  userId?: string;
  username?: string;
  timestamp?: string;
}
