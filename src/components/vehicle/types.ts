/**
 * Type definitions for Vehicle Hardware Configuration
 */

export type ProviderType = 'smartcar' | 'samsara' | 'teltonika' | 'obd2'

export type ConnectionStatus = 'online' | 'offline' | 'connected' | 'error' | 'pending'

export interface HardwareProvider {
  id: string
  type: ProviderType
  status: ConnectionStatus
  capabilities: string[]
  configuration: Record<string, any>
  lastSyncTime?: string
  deviceModel?: string
  externalId?: string
  createdAt?: string
  updatedAt?: string
}

export interface SmartcarConfig {
  accessToken?: string
  refreshToken?: string
  vehicleId?: string
  connectedAt?: string
  scopes?: string[]
}

export interface SamsaraConfig {
  apiToken: string
  externalVehicleId: string
  organizationId?: string
}

export interface TeltonikaConfig {
  imei: string
  deviceModel: 'FM1120' | 'FM3200' | 'FM4200' | 'FM5300'
  enableRfid?: boolean
  enableStarterDisable?: boolean
  serverHost?: string
  serverPort?: number
}

export interface OBD2Config {
  deviceId?: string
  pairingCode?: string
  lastPairedAt?: string
  appVersion?: string
}

export type ProviderConfiguration =
  | SmartcarConfig
  | SamsaraConfig
  | TeltonikaConfig
  | OBD2Config

export interface ProviderTestResult {
  success: boolean
  message: string
  latency?: number
  details?: Record<string, any>
}

export interface ProviderCapability {
  id: string
  name: string
  description: string
  supported: boolean
}

export interface HardwareConfigResponse {
  providers: HardwareProvider[]
  vehicleId: number
  lastUpdated: string
}

export interface AddProviderRequest {
  type: ProviderType
  configuration: ProviderConfiguration
}

export interface AddProviderResponse {
  provider: HardwareProvider
  message?: string
}

export interface RemoveProviderResponse {
  success: boolean
  message: string
}

export interface TestConnectionResponse {
  success: boolean
  message: string
  latency?: number
  timestamp: string
}
