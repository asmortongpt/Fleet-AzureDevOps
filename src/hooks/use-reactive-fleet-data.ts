/**
 * Reactive Fleet Data Hook
 * Real-time data fetching with automatic refresh
 */

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const API_BASE = '/api'

export interface Vehicle {
  id: number
  license_plate: string
  vin: string
  make: string
  model: string
  year: number
  status: 'active' | 'maintenance' | 'inactive' | 'retired'
  mileage: number
  fuel_type: string
  fuel_level?: number
  current_latitude?: number
  current_longitude?: number
  driver?: string
  location?: string
}

export interface FleetMetrics {
  totalVehicles: number
  activeVehicles: number
  maintenanceVehicles: number
  idleVehicles: number
  averageFuelLevel: number
  totalMileage: number
}

export function useReactiveFleetData() {
  const [realTimeUpdate, setRealTimeUpdate] = useState(0)

  // Fetch vehicles with automatic refresh
  const {
    data: vehicles = [],
    isLoading: vehiclesLoading,
    error: vehiclesError,
  } = useQuery<Vehicle[]>({
    queryKey: ['vehicles', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/vehicles`)
      if (!response.ok) throw new Error('Failed to fetch vehicles')
      return response.json()
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  })

  // Fetch fleet metrics
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery<FleetMetrics>({
    queryKey: ['fleet-metrics', realTimeUpdate],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/fleet/metrics`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      return response.json()
    },
    refetchInterval: 10000,
    staleTime: 5000,
  })

  // Simulate real-time updates (for demo purposes)
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeUpdate((prev) => prev + 1)
    }, 15000) // Update every 15 seconds

    return () => clearInterval(interval)
  }, [])

  // Calculate derived metrics
  const statusDistribution = vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.status] = (acc[vehicle.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const makeDistribution = vehicles.reduce(
    (acc, vehicle) => {
      acc[vehicle.make] = (acc[vehicle.make] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate average mileage by status
  const avgMileageByStatus = Object.keys(statusDistribution).map((status) => {
    const vehiclesWithStatus = vehicles.filter((v) => v.status === status)
    const avgMileage =
      vehiclesWithStatus.reduce((sum, v) => sum + v.mileage, 0) /
      vehiclesWithStatus.length || 0

    return {
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: Math.round(avgMileage),
    }
  })

  // Low fuel alerts
  const lowFuelVehicles = vehicles.filter(
    (v) => v.fuel_level !== undefined && v.fuel_level < 25
  )

  // High mileage vehicles (over 100k)
  const highMileageVehicles = vehicles.filter((v) => v.mileage > 100000)

  return {
    vehicles,
    metrics,
    statusDistribution,
    makeDistribution,
    avgMileageByStatus,
    lowFuelVehicles,
    highMileageVehicles,
    isLoading: vehiclesLoading || metricsLoading,
    error: vehiclesError || metricsError,
    lastUpdate: new Date(),
  }
}
