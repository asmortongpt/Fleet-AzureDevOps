/**
 * Unified System Status Hook
 * Connects all emulators and AI services to provide comprehensive real-time status
 */

import { useState, useEffect, useCallback } from 'react'

import { useOBD2Emulator } from './useOBD2Emulator'
import { useVehicleTelemetry } from './useVehicleTelemetry'

import apiClient from '@/lib/api-client'
import logger from '@/utils/logger';
export interface EmulatorStatus {
  id: string
  name: string
  type: 'vehicle' | 'obd2' | 'gps' | 'fuel' | 'maintenance' | 'driver' | 'route' | 'cost' | 'iot' | 'radio' | 'dispatch'
  status: 'connected' | 'disconnected' | 'error'
  lastUpdate: Date | null
  recordCount?: number
  eventsPerSecond?: number
}

export interface AIServiceStatus {
  id: string
  name: string
  endpoint: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime?: number
  lastCheck: Date | null
}

export interface AIInsight {
  id: string
  type: 'prediction' | 'recommendation' | 'alert' | 'optimization'
  title: string
  message: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  actionable?: boolean
  vehicleId?: string
}

export interface SystemHealthMetrics {
  overall: 'healthy' | 'degraded' | 'critical'
  emulatorsActive: number
  emulatorsTotal: number
  aiServicesHealthy: number
  aiServicesTotal: number
  totalDataFlow: number // events per second
  uptime: number // in seconds
}

interface UseSystemStatusOptions {
  enabled?: boolean
  pollInterval?: number // in ms
}

export function useSystemStatus(options: UseSystemStatusOptions = {}) {
  const { enabled = true, pollInterval = 5000 } = options

  const [emulators, setEmulators] = useState<EmulatorStatus[]>([])
  const [aiServices, setAIServices] = useState<AIServiceStatus[]>([])
  const [aiInsights, setAIInsights] = useState<AIInsight[]>([])
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics>({
    overall: 'healthy',
    emulatorsActive: 0,
    emulatorsTotal: 0,
    aiServicesHealthy: 0,
    aiServicesTotal: 0,
    totalDataFlow: 0,
    uptime: 0
  })

  // Connect to vehicle telemetry emulator
  const vehicleTelemetry = useVehicleTelemetry({ enabled })

  // Connect to OBD2 emulator (don't auto-connect, just track status)
  const obd2Emulator = useOBD2Emulator(false)

  // Update emulator status based on connected services
  useEffect(() => {
    const emulatorsStatus: EmulatorStatus[] = [
      {
        id: 'vehicle-telemetry',
        name: 'Vehicle Telemetry',
        type: 'vehicle',
        status: vehicleTelemetry.isConnected ? 'connected' : 'disconnected',
        lastUpdate: vehicleTelemetry.lastUpdate,
        recordCount: vehicleTelemetry.vehicles.length,
        eventsPerSecond: vehicleTelemetry.emulatorStats?.eventsPerSecond || 0
      },
      {
        id: 'obd2',
        name: 'OBD2 Diagnostics',
        type: 'obd2',
        status: obd2Emulator.isConnected ? 'connected' : 'disconnected',
        lastUpdate: obd2Emulator.data ? new Date(obd2Emulator.data.timestamp) : null,
        recordCount: obd2Emulator.dataHistory.length
      }
    ]

    setEmulators(emulatorsStatus)
  }, [
    vehicleTelemetry.isConnected,
    vehicleTelemetry.lastUpdate,
    vehicleTelemetry.vehicles,
    vehicleTelemetry.emulatorStats,
    obd2Emulator.isConnected,
    obd2Emulator.data,
    obd2Emulator.dataHistory
  ])

  // Poll AI services health
  useEffect(() => {
    if (!enabled) return

    const checkAIServices = async () => {
      const services: AIServiceStatus[] = []

      // Check AI Chat/LangChain service
      try {
        const start = Date.now()
        await apiClient.get('/api/langchain/health')
        services.push({
          id: 'langchain',
          name: 'AI Chat & Workflows',
          endpoint: '/api/langchain',
          status: 'healthy',
          responseTime: Date.now() - start,
          lastCheck: new Date()
        })
      } catch (error) {
        services.push({
          id: 'langchain',
          name: 'AI Chat & Workflows',
          endpoint: '/api/langchain',
          status: 'down',
          lastCheck: new Date()
        })
      }

      // Check AI Dispatch service
      try {
        const start = Date.now()
        await apiClient.get('/api/ai-dispatch/health')
        services.push({
          id: 'ai-dispatch',
          name: 'AI Dispatch Optimization',
          endpoint: '/api/ai-dispatch',
          status: 'healthy',
          responseTime: Date.now() - start,
          lastCheck: new Date()
        })
      } catch (error) {
        services.push({
          id: 'ai-dispatch',
          name: 'AI Dispatch Optimization',
          endpoint: '/api/ai-dispatch',
          status: 'down',
          lastCheck: new Date()
        })
      }

      // Check AI Task Prioritization
      try {
        const start = Date.now()
        await apiClient.get('/api/ai-task-prioritization/health')
        services.push({
          id: 'ai-task',
          name: 'AI Task Prioritization',
          endpoint: '/api/ai-task-prioritization',
          status: 'healthy',
          responseTime: Date.now() - start,
          lastCheck: new Date()
        })
      } catch (error) {
        services.push({
          id: 'ai-task',
          name: 'AI Task Prioritization',
          endpoint: '/api/ai-task-prioritization',
          status: 'down',
          lastCheck: new Date()
        })
      }

      // Check Document RAG service
      try {
        const start = Date.now()
        await apiClient.get('/api/document-rag/health')
        services.push({
          id: 'document-rag',
          name: 'Document Q&A',
          endpoint: '/api/document-rag',
          status: 'healthy',
          responseTime: Date.now() - start,
          lastCheck: new Date()
        })
      } catch (error) {
        services.push({
          id: 'document-rag',
          name: 'Document Q&A',
          endpoint: '/api/document-rag',
          status: 'down',
          lastCheck: new Date()
        })
      }

      // Check Predictive Maintenance AI
      try {
        const start = Date.now()
        await apiClient.get('/api/ai-insights/maintenance/health')
        services.push({
          id: 'predictive-maintenance',
          name: 'Predictive Maintenance AI',
          endpoint: '/api/ai-insights/maintenance',
          status: 'healthy',
          responseTime: Date.now() - start,
          lastCheck: new Date()
        })
      } catch (error) {
        services.push({
          id: 'predictive-maintenance',
          name: 'Predictive Maintenance AI',
          endpoint: '/api/ai-insights/maintenance',
          status: 'down',
          lastCheck: new Date()
        })
      }

      setAIServices(services)
    }

    checkAIServices()
    const interval = setInterval(checkAIServices, pollInterval)

    return () => clearInterval(interval)
  }, [enabled, pollInterval])

  // Fetch AI insights
  useEffect(() => {
    if (!enabled) return

    const fetchInsights = async () => {
      try {
        // Fetch from AI insights endpoint
        const response = await apiClient.get('/api/ai-insights/latest')
        if (response.data?.insights) {
          setAIInsights(response.data.insights.map((insight: any) => ({
            ...insight,
            timestamp: new Date(insight.timestamp)
          })))
        }
      } catch (error) {
        logger.error('Failed to fetch AI insights:', error)
      }
    }

    fetchInsights()
    const interval = setInterval(fetchInsights, pollInterval * 2) // Poll less frequently

    return () => clearInterval(interval)
  }, [enabled, pollInterval])

  // Generate mock insights from telemetry data
  useEffect(() => {
    if (!vehicleTelemetry.vehicles.length) return

    const mockInsights: AIInsight[] = []

    // Check for low fuel vehicles
    const lowFuelVehicles = vehicleTelemetry.vehicles.filter(v => v.fuelLevel < 20)
    if (lowFuelVehicles.length > 0) {
      mockInsights.push({
        id: `low-fuel-${Date.now()}`,
        type: 'alert',
        title: 'Low Fuel Alert',
        message: `${lowFuelVehicles.length} vehicle(s) have fuel below 20%`,
        confidence: 0.95,
        priority: 'high',
        timestamp: new Date(),
        actionable: true
      })
    }

    // Check for vehicles needing service
    const serviceVehicles = vehicleTelemetry.vehicles.filter(v => v.status === 'service')
    if (serviceVehicles.length > 0) {
      mockInsights.push({
        id: `service-needed-${Date.now()}`,
        type: 'recommendation',
        title: 'Service Recommended',
        message: `${serviceVehicles.length} vehicle(s) require maintenance attention`,
        confidence: 0.88,
        priority: 'medium',
        timestamp: new Date(),
        actionable: true
      })
    }

    // Add optimization insights
    if (vehicleTelemetry.vehicles.length > 5) {
      mockInsights.push({
        id: `route-optimization-${Date.now()}`,
        type: 'optimization',
        title: 'Route Optimization Opportunity',
        message: 'AI detected potential for 12% fuel savings through route optimization',
        confidence: 0.76,
        priority: 'low',
        timestamp: new Date(),
        actionable: true
      })
    }

    setAIInsights(prev => {
      // Merge with existing, keep only last 20
      const merged = [...mockInsights, ...prev]
      return merged.slice(0, 20)
    })
  }, [vehicleTelemetry.vehicles])

  // Calculate health metrics
  useEffect(() => {
    const emulatorsActive = emulators.filter(e => e.status === 'connected').length
    const aiServicesHealthy = aiServices.filter(s => s.status === 'healthy').length
    const totalDataFlow = emulators.reduce((sum, e) => sum + (e.eventsPerSecond || 0), 0)

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'

    if (aiServicesHealthy < aiServices.length * 0.5 || emulatorsActive === 0) {
      overall = 'critical'
    } else if (aiServicesHealthy < aiServices.length * 0.8 || emulatorsActive < emulators.length * 0.5) {
      overall = 'degraded'
    }

    setHealthMetrics({
      overall,
      emulatorsActive,
      emulatorsTotal: emulators.length,
      aiServicesHealthy,
      aiServicesTotal: aiServices.length,
      totalDataFlow,
      uptime: vehicleTelemetry.emulatorStats?.uptime || 0
    })
  }, [emulators, aiServices, vehicleTelemetry.emulatorStats])

  // Control functions
  const startEmulator = useCallback(async (emulatorId: string) => {
    if (emulatorId === 'obd2') {
      await obd2Emulator.startEmulator()
    } else if (emulatorId === 'vehicle-telemetry') {
      vehicleTelemetry.startEmulator()
    }
    // Add more emulator start controls as needed
  }, [obd2Emulator, vehicleTelemetry])

  const stopEmulator = useCallback(async (emulatorId: string) => {
    if (emulatorId === 'obd2') {
      await obd2Emulator.stopEmulator()
    } else if (emulatorId === 'vehicle-telemetry') {
      vehicleTelemetry.stopEmulator()
    }
    // Add more emulator stop controls as needed
  }, [obd2Emulator, vehicleTelemetry])

  const dismissInsight = useCallback((insightId: string) => {
    setAIInsights(prev => prev.filter(i => i.id !== insightId))
  }, [])

  return {
    // Status
    emulators,
    aiServices,
    healthMetrics,

    // AI Insights
    aiInsights,
    dismissInsight,

    // Controls
    startEmulator,
    stopEmulator,

    // Raw data access
    vehicleTelemetry,
    obd2Emulator
  }
}

export default useSystemStatus
