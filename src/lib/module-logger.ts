/**
 * ModuleLogger - Comprehensive logging, monitoring, and AI validation for Fleet modules
 *
 * Features:
 * - Structured logging with levels (debug, info, warn, error)
 * - Performance tracking
 * - Error aggregation
 * - AI-powered data validation
 * - Real-time module health monitoring
 *
 * Created: 2025-11-24
 */

// ============================================================================
// PRESERVE NATIVE MAP CONSTRUCTOR
// CRITICAL: Must capture native Map before Leaflet pollutes global namespace
// ============================================================================
const NativeMap = globalThis.Map;

// ============================================================================
// LOG LEVELS
// ============================================================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// ============================================================================
// TYPES
// ============================================================================

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: any
  stack?: string
  duration?: number
}

interface ModuleMetrics {
  loadCount: number
  errorCount: number
  avgLoadTime: number
  lastError?: string
  lastErrorTime?: string
  healthScore: number
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// ============================================================================
// MODULE LOGGER CLASS
// ============================================================================

class ModuleLoggerClass {
  private logs: LogEntry[] = []
  private metrics: NativeMap<string, ModuleMetrics> = new NativeMap()
  private maxLogs = 1000
  private isEnabled = true
  private logToConsole = process.env.NODE_ENV === 'development'

  constructor() {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      this.isEnabled = localStorage.getItem('moduleLogging') !== 'false'
    }
  }

  // -------------------------------------------------------------------------
  // CORE LOGGING
  // -------------------------------------------------------------------------

  private log(level: LogLevel, module: string, message: string, data?: any, stack?: string) {
    if (!this.isEnabled) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      data,
      stack
    }

    // Add to in-memory logs
    this.logs.push(entry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output in development
    if (this.logToConsole) {
      const logMethod = level === 'error' ? console.error :
                       level === 'warn' ? console.warn :
                       level === 'debug' ? console.debug : console.log
      logMethod(`[${module}] ${message}`, data || '')
    }

    // Update metrics
    if (level === 'error') {
      this.recordError(module, message)
    }

    // Emit event for real-time monitoring
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('module-log', { detail: entry }))
    }
  }

  debug(module: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  info(module: string, message: string, data?: any) {
    this.log(LogLevel.INFO, module, message, data)
  }

  warn(module: string, message: string, data?: any) {
    this.log(LogLevel.WARN, module, message, data)
  }

  error(module: string, message: string, error?: Error) {
    this.log(LogLevel.ERROR, module, message, error?.message, error?.stack)
  }

  // -------------------------------------------------------------------------
  // PERFORMANCE TRACKING
  // -------------------------------------------------------------------------

  startTimer(module: string, operation: string): () => void {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordLoadTime(module, duration)
      this.debug(module, `${operation} completed`, { durationMs: duration.toFixed(2) })
    }
  }

  private recordLoadTime(module: string, duration: number) {
    const metrics = this.getOrCreateMetrics(module)
    metrics.loadCount++
    metrics.avgLoadTime = (metrics.avgLoadTime * (metrics.loadCount - 1) + duration) / metrics.loadCount
    this.updateHealthScore(module)
  }

  private recordError(module: string, message: string) {
    const metrics = this.getOrCreateMetrics(module)
    metrics.errorCount++
    metrics.lastError = message
    metrics.lastErrorTime = new Date().toISOString()
    this.updateHealthScore(module)
  }

  private getOrCreateMetrics(module: string): ModuleMetrics {
    if (!this.metrics.has(module)) {
      this.metrics.set(module, {
        loadCount: 0,
        errorCount: 0,
        avgLoadTime: 0,
        healthScore: 100
      })
    }
    return this.metrics.get(module)!
  }

  private updateHealthScore(module: string) {
    const metrics = this.getOrCreateMetrics(module)

    // Calculate health score (0-100)
    let score = 100

    // Penalize for errors (up to 50 points)
    const errorPenalty = Math.min(metrics.errorCount * 10, 50)
    score -= errorPenalty

    // Penalize for slow load times (up to 30 points)
    if (metrics.avgLoadTime > 3000) {
      score -= 30
    } else if (metrics.avgLoadTime > 1000) {
      score -= Math.floor((metrics.avgLoadTime - 1000) / 100)
    }

    metrics.healthScore = Math.max(0, score)
  }

  // -------------------------------------------------------------------------
  // AI-POWERED VALIDATION
  // -------------------------------------------------------------------------

  validateModuleData(module: string, data: any, schema: DataSchema): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []

    // Null/undefined check
    if (data === null || data === undefined) {
      errors.push('Data is null or undefined')
      return { valid: false, errors, warnings, suggestions }
    }

    // Schema validation
    for (const field of schema.required) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // Type validation
    for (const [field, expectedType] of Object.entries(schema.types)) {
      if (field in data && data[field] !== null) {
        const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field]
        if (actualType !== expectedType) {
          errors.push(`Field "${field}" expected ${expectedType}, got ${actualType}`)
        }
      }
    }

    // Array length checks
    for (const [field, minLength] of Object.entries(schema.minArrayLengths || {})) {
      if (Array.isArray(data[field]) && data[field].length < minLength) {
        warnings.push(`Array "${field}" has ${data[field].length} items, expected at least ${minLength}`)
      }
    }

    // Value range checks
    for (const [field, range] of Object.entries(schema.ranges || {})) {
      if (typeof data[field] === 'number') {
        if (data[field] < range.min) {
          warnings.push(`Field "${field}" value ${data[field]} is below minimum ${range.min}`)
        }
        if (data[field] > range.max) {
          warnings.push(`Field "${field}" value ${data[field]} is above maximum ${range.max}`)
        }
      }
    }

    // AI suggestions based on common patterns
    if (errors.length > 0) {
      suggestions.push('Consider adding fallback values for required fields')
      suggestions.push('Verify API response matches expected schema')
    }
    if (warnings.length > 0) {
      suggestions.push('Review data quality and consider adding validation at source')
    }

    const valid = errors.length === 0

    // Log validation result
    this.log(
      valid ? LogLevel.DEBUG : LogLevel.WARN,
      module,
      `Data validation ${valid ? 'passed' : 'failed'}`,
      { errors, warnings, suggestions }
    )

    return { valid, errors, warnings, suggestions }
  }

  // -------------------------------------------------------------------------
  // REPORTING
  // -------------------------------------------------------------------------

  getModuleMetrics(module?: string): NativeMap<string, ModuleMetrics> | ModuleMetrics | undefined {
    if (module) {
      return this.metrics.get(module)
    }
    return this.metrics
  }

  getLogs(filters?: { module?: string; level?: LogLevel; since?: Date }): LogEntry[] {
    let filtered = [...this.logs]

    if (filters?.module) {
      filtered = filtered.filter(l => l.module === filters.module)
    }
    if (filters?.level) {
      filtered = filtered.filter(l => l.level === filters.level)
    }
    if (filters?.since) {
      filtered = filtered.filter(l => new Date(l.timestamp) >= filters.since!)
    }

    return filtered
  }

  getHealthReport(): Record<string, { score: number; status: string; issues: string[] }> {
    const report: Record<string, { score: number; status: string; issues: string[] }> = {}

    this.metrics.forEach((metrics, module) => {
      const issues: string[] = []

      if (metrics.errorCount > 0) {
        issues.push(`${metrics.errorCount} errors recorded`)
      }
      if (metrics.avgLoadTime > 2000) {
        issues.push(`Slow load time: ${metrics.avgLoadTime.toFixed(0)}ms`)
      }
      if (metrics.lastError) {
        issues.push(`Last error: ${metrics.lastError}`)
      }

      report[module] = {
        score: metrics.healthScore,
        status: metrics.healthScore >= 80 ? 'healthy' :
                metrics.healthScore >= 50 ? 'degraded' : 'critical',
        issues
      }
    })

    return report
  }

  exportLogs(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metrics: Object.fromEntries(this.metrics),
      logs: this.logs
    }, null, 2)
  }

  clearLogs() {
    this.logs = []
    this.info('ModuleLogger', 'Logs cleared')
  }

  // -------------------------------------------------------------------------
  // CONFIGURATION
  // -------------------------------------------------------------------------

  enable() {
    this.isEnabled = true
    if (typeof window !== 'undefined') {
      localStorage.setItem('moduleLogging', 'true')
    }
  }

  disable() {
    this.isEnabled = false
    if (typeof window !== 'undefined') {
      localStorage.setItem('moduleLogging', 'false')
    }
  }

  setConsoleLogging(enabled: boolean) {
    this.logToConsole = enabled
  }
}

// ============================================================================
// DATA SCHEMA TYPE
// ============================================================================

export interface DataSchema {
  required: string[]
  types: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
  minArrayLengths?: Record<string, number>
  ranges?: Record<string, { min: number; max: number }>
}

// ============================================================================
// COMMON SCHEMAS FOR FLEET MODULES
// ============================================================================

export const FleetSchemas = {
  vehicles: {
    required: ['id', 'name', 'status'],
    types: {
      id: 'string',
      name: 'string',
      status: 'string',
      mileage: 'number',
      location: 'object'
    },
    ranges: {
      mileage: { min: 0, max: 1000000 }
    }
  } as DataSchema,

  drivers: {
    required: ['id', 'name'],
    types: {
      id: 'string',
      name: 'string',
      email: 'string',
      status: 'string'
    }
  } as DataSchema,

  workOrders: {
    required: ['id', 'vehicleId', 'status'],
    types: {
      id: 'string',
      vehicleId: 'string',
      status: 'string',
      cost: 'number'
    },
    ranges: {
      cost: { min: 0, max: 100000 }
    }
  } as DataSchema,

  fuelTransactions: {
    required: ['id', 'vehicleId', 'gallons', 'totalCost'],
    types: {
      id: 'string',
      vehicleId: 'string',
      gallons: 'number',
      totalCost: 'number',
      mpg: 'number'
    },
    ranges: {
      gallons: { min: 0, max: 500 },
      totalCost: { min: 0, max: 2000 },
      mpg: { min: 0, max: 100 }
    }
  } as DataSchema
}

// ============================================================================
// HOOK FOR USE IN COMPONENTS
// ============================================================================

export function useModuleLogger(moduleName: string) {
  const stopTimer = ModuleLogger.startTimer(moduleName, 'render')

  return {
    debug: (message: string, data?: any) => ModuleLogger.debug(moduleName, message, data),
    info: (message: string, data?: any) => ModuleLogger.info(moduleName, message, data),
    warn: (message: string, data?: any) => ModuleLogger.warn(moduleName, message, data),
    error: (message: string, error?: Error) => ModuleLogger.error(moduleName, message, error),
    validate: (data: any, schema: DataSchema) => ModuleLogger.validateModuleData(moduleName, data, schema),
    stopTimer
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const ModuleLogger = new ModuleLoggerClass()

export default ModuleLogger
