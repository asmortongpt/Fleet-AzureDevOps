/**
 * AI-Directed Dispatch Type Definitions
 *
 * Comprehensive TypeScript types for AI-powered dispatch system
 *
 * @module types/ai-dispatch
 */

// ============================================================================
// Incident Types
// ============================================================================

export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical'

export type IncidentType =
  | 'accident'
  | 'medical'
  | 'fire'
  | 'hazard'
  | 'maintenance'
  | 'breakdown'
  | 'theft'
  | 'vandalism'
  | 'weather'
  | 'traffic'
  | 'other'

export type IncidentStatus =
  | 'pending'
  | 'assigned'
  | 'en_route'
  | 'on_scene'
  | 'completed'
  | 'cancelled'

export interface LocationCoordinates {
  lat: number
  lng: number
}

export interface IncidentLocation {
  address?: string
  coordinates?: LocationCoordinates
  landmark?: string
  region?: string
}

export interface ExtractedEntities {
  people?: string[]
  vehicles?: string[]
  hazards?: string[]
  equipment?: string[]
}

export interface IncidentParseResult {
  incidentType: IncidentType
  priority: IncidentPriority
  location?: IncidentLocation
  description: string
  requiredCapabilities: string[]
  estimatedDuration?: number
  specialInstructions?: string[]
  extractedEntities: ExtractedEntities
}

export interface ParsedIncident extends IncidentParseResult {
  parsedAt: Date
  confidence: number
  aiModel: string
}

// ============================================================================
// Vehicle Types
// ============================================================================

export type VehicleStatus =
  | 'available'
  | 'dispatched'
  | 'in_use'
  | 'out_of_service'
  | 'maintenance'

export interface VehicleCapability {
  name: string
  level: 'basic' | 'advanced' | 'expert'
  certified: boolean
}

export interface Vehicle {
  id: number
  unitNumber: string
  vehicleType: string
  status: VehicleStatus
  currentLocation?: LocationCoordinates
  capabilities: string[]
  assignedDriverId?: number
  lastMaintenanceDate?: string
  mileage?: number
  fuelLevel?: number
}

export interface VehicleWithDetails extends Vehicle {
  driverName?: string
  driverPhone?: string
  equipmentList?: string[]
  recentIncidents?: number
  avgResponseTime?: number
}

// ============================================================================
// Dispatch Recommendation Types
// ============================================================================

export interface AlternativeVehicle {
  vehicleId: number
  score: number
  reason: string
  distance?: number
  eta?: number
}

export interface DispatchRecommendation {
  vehicleId: number
  vehicle: Vehicle
  score: number
  distance: number
  estimatedArrivalMinutes: number
  reasoning: string[]
  alternativeVehicles: AlternativeVehicle[]
  confidence: number
  aiGeneratedAt: Date
}

export interface RecommendationExplanation {
  summary: string
  keyFactors: string[]
  warnings?: string[]
  alternatives?: string
}

// ============================================================================
// Dispatch Assignment Types
// ============================================================================

export type AssignmentStatus =
  | 'assigned'
  | 'accepted'
  | 'declined'
  | 'en_route'
  | 'arrived'
  | 'completed'
  | 'cancelled'

export interface DispatchAssignment {
  id: number
  dispatchId: number
  vehicleId: number
  assignedBy: number
  assignmentStatus: AssignmentStatus
  aiScore?: number
  aiReasoning?: string[]
  acceptedAt?: Date
  arrivedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt?: Date
}

// ============================================================================
// Predictive Dispatch Types
// ============================================================================

export interface PrepositioningRecommendation {
  vehicleId: number
  location: LocationCoordinates
  reason: string
  priority: number
}

export interface DispatchPrediction {
  predictedIncidentType: IncidentType
  probability: number
  recommendedPrePositioning: PrepositioningRecommendation[]
  basedOnFactors: string[]
  timeWindow: {
    start: Date
    end: Date
  }
  confidence: number
}

export interface PatternAnalysis {
  timeOfDay: number
  dayOfWeek: number
  seasonalFactors: string[]
  weatherImpact?: string
  historicalFrequency: number
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface IncidentTypeStats {
  type: IncidentType
  count: number
  avgResponseTime: number
  avgResolutionTime: number
}

export interface DispatchAnalytics {
  avgResponseTimeMinutes: number
  totalDispatches: number
  successRate: number
  utilizationRate: number
  topIncidentTypes: Array<{
    type: string
    count: number
  }>
}

export interface DetailedAnalytics extends DispatchAnalytics {
  period: {
    startDate: Date
    endDate: Date
  }
  byPriority: Record<IncidentPriority, {
    count: number
    avgResponseTime: number
  }>
  byVehicleType: Record<string, {
    dispatches: number
    utilization: number
  }>
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable'
    percentageChange: number
  }
}

export interface PerformanceMetrics {
  vehicleId: number
  totalDispatches: number
  avgResponseTime: number
  successfulCompletions: number
  cancellations: number
  rating: number
  lastUpdated: Date
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ParseIncidentRequest {
  description: string
  requestId?: string
}

export interface ParseIncidentResponse {
  success: boolean
  incident: IncidentParseResult
  requestId?: string
}

export interface RecommendVehicleRequest {
  incident: IncidentParseResult
  location: LocationCoordinates
  excludeVehicles?: number[]
  preferredCapabilities?: string[]
}

export interface RecommendVehicleResponse {
  success: boolean
  recommendation: DispatchRecommendation
  explanation: string
}

export interface CreateDispatchRequest {
  description: string
  location: LocationCoordinates & { address?: string }
  vehicleId?: number
  autoAssign?: boolean
  priority?: IncidentPriority
}

export interface CreateDispatchResponse {
  success: boolean
  dispatch: {
    id: number
    incidentType: IncidentType
    priority: IncidentPriority
    status: IncidentStatus
    createdAt: Date
  }
  incident: IncidentParseResult
  recommendation?: DispatchRecommendation
  assignment?: DispatchAssignment
  autoAssigned: boolean
}

export interface PredictIncidentsRequest {
  timeOfDay?: number
  dayOfWeek?: number
  location?: LocationCoordinates
}

export interface PredictIncidentsResponse {
  success: boolean
  prediction: DispatchPrediction
}

export interface GetAnalyticsRequest {
  startDate?: Date
  endDate?: Date
  vehicleId?: number
  incidentType?: IncidentType
}

export interface GetAnalyticsResponse {
  success: boolean
  analytics: DispatchAnalytics | DetailedAnalytics
  period: {
    startDate: string
    endDate: string
  }
}

// ============================================================================
// Database Models
// ============================================================================

export interface DispatchIncidentRecord {
  id: number
  incident_type: string
  priority: string
  description: string
  location_lat: number
  location_lng: number
  location_address?: string
  required_capabilities: string // JSON array
  estimated_duration_minutes?: number
  special_instructions?: string // JSON array
  status: string
  created_by: number
  created_at: Date
  updated_at?: Date
  completed_at?: Date
  response_time_minutes?: number
}

export interface DispatchAssignmentRecord {
  id: number
  dispatch_id: number
  vehicle_id: number
  assigned_by: number
  assignment_status: string
  ai_score?: number
  ai_reasoning?: string // JSON array
  accepted_at?: Date
  arrived_at?: Date
  completed_at?: Date
  created_at: Date
  updated_at?: Date
}

// ============================================================================
// AI Service Configuration
// ============================================================================

export interface AIServiceConfig {
  endpoint: string
  apiKey: string
  deploymentName: string
  maxTokens: number
  temperature: number
  timeout: number
}

export interface AIRequestMetadata {
  requestId: string
  userId: number
  timestamp: Date
  model: string
  tokensUsed?: number
  latencyMs?: number
}

// ============================================================================
// Error Types
// ============================================================================

export class DispatchError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DispatchError'
  }
}

export class AIServiceError extends DispatchError {
  constructor(message: string, details?: any) {
    super(message, 'AI_SERVICE_ERROR', details)
    this.name = 'AIServiceError'
  }
}

export class NoVehiclesAvailableError extends DispatchError {
  constructor(requiredCapabilities: string[]) {
    super(
      'No vehicles available matching required capabilities',
      'NO_VEHICLES_AVAILABLE',
      { requiredCapabilities }
    )
    this.name = 'NoVehiclesAvailableError'
  }
}

export class InvalidLocationError extends DispatchError {
  constructor(location: any) {
    super(
      'Invalid location coordinates provided',
      'INVALID_LOCATION',
      { location }
    )
    this.name = 'InvalidLocationError'
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Awaited<T> = T extends Promise<infer U> ? U : T

// ============================================================================
// Export all types
// ============================================================================

// End of types
