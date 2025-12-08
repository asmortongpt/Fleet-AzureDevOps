/**
 * System Status Panel
 * Displays real-time status of all emulators and AI services
 */

import {
  Circle,
  Broadcast,
  PlayCircle,
  StopCircle,
  CheckCircle,
  XCircle,
  Clock,
  ChartLine,
  Cpu,
  Database
} from "@phosphor-icons/react"
import React, { useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmulatorStatus, AIServiceStatus, SystemHealthMetrics } from '@/hooks/useSystemStatus'

interface SystemStatusPanelProps {
  emulators: EmulatorStatus[]
  aiServices: AIServiceStatus[]
  healthMetrics: SystemHealthMetrics
  onStartEmulator: (emulatorId: string) => void
  onStopEmulator: (emulatorId: string) => void
}

export function SystemStatusPanel({
  emulators,
  aiServices,
  healthMetrics,
  onStartEmulator,
  onStopEmulator
}: SystemStatusPanelProps) {
  const [expandedSection, setExpandedSection] = useState<'emulators' | 'ai' | null>('emulators')

  const getStatusColor = (status: 'connected' | 'disconnected' | 'error' | 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-green-600 dark:text-green-400'
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'disconnected':
      case 'down':
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getHealthBadgeColor = (health: 'healthy' | 'degraded' | 'critical') => {
    switch (health) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    }
  }

  const getEmulatorIcon = (type: EmulatorStatus['type']) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'vehicle':
        return <Broadcast className={iconClass} />
      case 'obd2':
        return <Cpu className={iconClass} />
      case 'gps':
        return <ChartLine className={iconClass} />
      default:
        return <Database className={iconClass} />
    }
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="px-4 py-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ChartLine className="w-4 h-4 text-primary" />
            System Status
          </CardTitle>
          <Badge className={getHealthBadgeColor(healthMetrics.overall)}>
            {healthMetrics.overall.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-3">
        {/* Overall Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {healthMetrics.emulatorsActive}/{healthMetrics.emulatorsTotal}
            </div>
            <div className="text-[10px] text-muted-foreground">Emulators</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {healthMetrics.aiServicesHealthy}/{healthMetrics.aiServicesTotal}
            </div>
            <div className="text-[10px] text-muted-foreground">AI Services</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {healthMetrics.totalDataFlow.toFixed(1)}
            </div>
            <div className="text-[10px] text-muted-foreground">Events/sec</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">
              {Math.floor(healthMetrics.uptime / 60)}m
            </div>
            <div className="text-[10px] text-muted-foreground">Uptime</div>
          </div>
        </div>

        {/* Emulators Section */}
        <div className="mb-3">
          <button
            onClick={() => setExpandedSection(expandedSection === 'emulators' ? null : 'emulators')}
            className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Broadcast className="w-3.5 h-3.5" />
              Emulators ({emulators.filter(e => e.status === 'connected').length}/{emulators.length})
            </span>
            <Circle
              className={`w-2 h-2 transition-transform ${
                expandedSection === 'emulators' ? 'rotate-90' : ''
              }`}
            />
          </button>

          {expandedSection === 'emulators' && (
            <div className="space-y-1 mt-2">
              {emulators.map((emulator) => (
                <div
                  key={emulator.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getEmulatorIcon(emulator.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{emulator.name}</span>
                        <Circle
                          className={`w-1.5 h-1.5 flex-shrink-0 ${
                            emulator.status === 'connected'
                              ? 'fill-green-500 text-green-500 animate-pulse'
                              : 'fill-gray-400 text-gray-400'
                          }`}
                          weight="fill"
                        />
                      </div>
                      {emulator.lastUpdate && (
                        <div className="text-[9px] text-muted-foreground">
                          {emulator.eventsPerSecond
                            ? `${emulator.eventsPerSecond.toFixed(1)} eps`
                            : `Updated ${emulator.lastUpdate.toLocaleTimeString()}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {emulator.recordCount !== undefined && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[9px]">
                        {emulator.recordCount}
                      </Badge>
                    )}
                    {emulator.status === 'connected' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onStopEmulator(emulator.id)}
                      >
                        <StopCircle className="w-3.5 h-3.5 text-red-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onStartEmulator(emulator.id)}
                      >
                        <PlayCircle className="w-3.5 h-3.5 text-green-600" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Services Section */}
        <div>
          <button
            onClick={() => setExpandedSection(expandedSection === 'ai' ? null : 'ai')}
            className="w-full flex items-center justify-between py-2 px-2 rounded hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              AI Services ({aiServices.filter(s => s.status === 'healthy').length}/{aiServices.length})
            </span>
            <Circle
              className={`w-2 h-2 transition-transform ${
                expandedSection === 'ai' ? 'rotate-90' : ''
              }`}
            />
          </button>

          {expandedSection === 'ai' && (
            <div className="space-y-1 mt-2">
              {aiServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {service.status === 'healthy' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : service.status === 'degraded' ? (
                      <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">{service.name}</div>
                      <div className="text-[9px] text-muted-foreground">
                        {service.responseTime !== undefined
                          ? `${service.responseTime}ms`
                          : service.status}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`h-5 px-1.5 text-[9px] ${getStatusColor(service.status)}`}
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SystemStatusPanel
