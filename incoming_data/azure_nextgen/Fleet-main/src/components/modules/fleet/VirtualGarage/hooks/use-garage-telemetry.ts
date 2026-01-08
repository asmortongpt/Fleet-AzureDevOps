/**
 * useGarageTelemetry - Custom hook for fetching vehicle telemetry
 *
 * Fetches and manages real-time OBD2 telemetry data.
 */

import { useState, useEffect } from "react"

import { fetchVehicleTelemetry, type OBD2Telemetry } from "../utils/api"

import logger from '@/utils/logger';
export function useGarageTelemetry(vehicleId: string | undefined) {
  const [telemetry, setTelemetry] = useState<OBD2Telemetry | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!vehicleId) {
      setTelemetry(null)
      return
    }

    let isMounted = true

    const loadTelemetry = async () => {
      setIsLoading(true)
      try {
        const data = await fetchVehicleTelemetry(vehicleId)
        if (isMounted) {
          setTelemetry(data)
        }
      } catch (error) {
        logger.error("Failed to load telemetry:", error)
        if (isMounted) {
          setTelemetry(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTelemetry()

    // Poll for updates every 5 seconds
    const interval = setInterval(loadTelemetry, 5000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [vehicleId])

  return {
    telemetry,
    isLoading
  }
}
