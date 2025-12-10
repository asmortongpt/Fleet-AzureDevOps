/**
 * Icon creation utilities for Leaflet markers
 * Extracted from LeafletMap.tsx for better maintainability
 */

import type { Vehicle, GISFacility, TrafficCamera } from "@/lib/types"

/**
 * Color scheme for vehicle status indicators
 */
export const VEHICLE_STATUS_COLORS: Record<Vehicle["status"], string> = {
  active: "#10b981", // emerald-500
  idle: "#6b7280", // gray-500
  charging: "#3b82f6", // blue-500
  service: "#f59e0b", // amber-500
  emergency: "#ef4444", // red-500
  offline: "#374151", // gray-700
} as const

/**
 * Emoji icons for different vehicle types
 */
export const VEHICLE_TYPE_EMOJI: Record<Vehicle["type"], string> = {
