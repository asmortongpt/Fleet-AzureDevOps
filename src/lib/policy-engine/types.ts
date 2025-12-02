/**
 * AI-Driven Policy and Rules Engine - Type Definitions
 */

export type PolicyType = "safety" | "dispatch" | "privacy" | "ev-charging" | "payments" | "maintenance" | "osha" | "environmental" | "data-retention" | "security" | "vehicle-use" | "driver-behavior"
export type PolicyMode = "monitor" | "human-in-loop" | "autonomous"
export type PolicyStatus = "draft" | "testing" | "approved" | "active" | "deprecated" | "archived"

export interface Policy {
  id: string
  tenantId: string
  name: string
  description: string
  type: PolicyType
  version: string
  status: PolicyStatus
  mode: PolicyMode
  conditions: any[]
  actions: any[]
  scope: any
  confidenceScore: number
  requiresDualControl: boolean
  requiresMFAForExecution: boolean
  createdBy: string
  createdAt: string
  tags: string[]
  executionCount: number
  violationCount: number
  category?: string
  relatedPolicies?: string[]
  lastModifiedBy?: string
  lastModifiedAt?: string
}
