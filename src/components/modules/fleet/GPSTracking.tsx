import {
  MapPin,
  Circle,
  CheckCircle,
  Warning,
  Info
} from "@phosphor-icons/react"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"

import { UniversalMap } from "@/components/UniversalMap"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Vehicle, GISFacility } from "@/lib/types"
import { useInspect } from "@/services/inspect/InspectContext"
import logger from '@/utils/logger';

/**
 * Props for the GPSTracking component
 */
interface GPSTrackingProps {
  /** Array of vehicles to display on the map and in the list */
  vehicles: Vehicle[]
  /** Array of facilities to potentially display (currently not shown) */
  _facilities?: GISFacility[]
  /** Optional callback when a vehicle is selected */
  onVehicleSelect?: (vehicleId: string) => void
  /** Whether the component is in a loading state */
  isLoading?: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * Vehicle status for filtering
 */
type VehicleStatus = Vehicle["status"] | "all"

/**
 * GPSTracking Component
 *
 * A comprehensive GPS tracking interface for monitoring fleet vehicles in real-time.
 * Features include:
 * - Interactive map visualization with vehicle markers
 * - Real-time status filtering
 * - Vehicle list with detailed information
 * - Activity feed showing recent vehicle movements
 * - Status-based color coding and icons
 * - Error handling and loading states
 * - Performance optimization for large vehicle fleets
 *
 * @component
 * @example
 *