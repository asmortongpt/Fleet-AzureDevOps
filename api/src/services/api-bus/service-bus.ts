/**
 * SERVICE BUS - Centralized Service Registry & Orchestration
 *
 * The Service Bus provides:
 * - Service discovery and registration
 * - Health monitoring
 * - Automatic failover
 * - Load balancing
 * - Circuit breaker pattern
 * - Request/response logging
 */

import type { ServiceAdapter, ServiceHealth, ServiceType } from './types'
import logger from '../../config/logger'

export class ServiceBus {
  private services: Map<string, ServiceAdapter> = new Map()
  private healthStatus: Map<string, ServiceHealth> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  /**
   * Register a service adapter
   */
  register(service: ServiceAdapter): void {
    this.services.set(service.name, service)
    logger.info('[Service Bus] Registered service', { name: service.name, type: service.type })
  }

  /**
   * Unregister a service
   */
  unregister(serviceName: string): void {
    const service = this.services.get(serviceName)
    if (service) {
      this.services.delete(serviceName)
      this.healthStatus.delete(serviceName)
      logger.info('[Service Bus] Unregistered service', { serviceName })
    }
  }

  /**
   * Get a registered service by name
   */
  getService<T extends ServiceAdapter = ServiceAdapter>(serviceName: string): T | undefined {
    return this.services.get(serviceName) as T | undefined
  }

  /**
   * Get all services of a specific type
   */
  getServicesByType(type: ServiceType): ServiceAdapter[] {
    return Array.from(this.services.values()).filter(s => s.type === type)
  }

  /**
   * Initialize all registered services
   */
  async initializeAll(): Promise<void> {
    logger.info('[Service Bus] Initializing all services...')

    const initPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        await service.initialize()
        logger.info('[Service Bus] Service initialized', { name })
      } catch (error: unknown) {
        logger.error('[Service Bus] Service initialization failed', { name, error: error instanceof Error ? error.message : 'An unexpected error occurred' })
      }
    })

    await Promise.all(initPromises)
    logger.info('[Service Bus] All services initialized')
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdownAll(): Promise<void> {
    logger.info('[Service Bus] Shutting down all services...')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    const shutdownPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        await service.shutdown()
        logger.info('[Service Bus] Service shut down', { name })
      } catch (error: unknown) {
        logger.error('[Service Bus] Service shutdown failed', { name, error: error instanceof Error ? error.message : 'An unexpected error occurred' })
      }
    })

    await Promise.all(shutdownPromises)
    logger.info('[Service Bus] All services shut down')
  }

  /**
   * Start periodic health checks for all services
   */
  startHealthChecks(intervalMs: number = 30000): void {
    logger.info('[Service Bus] Starting health checks', { intervalMs })

    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllHealth()
    }, intervalMs)

    // Run initial health check immediately
    this.checkAllHealth()
  }

  /**
   * Check health of all registered services
   */
  async checkAllHealth(): Promise<Map<string, ServiceHealth>> {
    const healthPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        const health = await service.healthCheck()
        this.healthStatus.set(name, health)
        return { name, health }
      } catch (error: unknown) {
        const failedHealth: ServiceHealth = {
          name: service.name,
          type: service.type,
          status: 'unhealthy',
          lastCheck: new Date(),
          message: `Health check failed: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        }
        this.healthStatus.set(name, failedHealth)
        return { name, health: failedHealth }
      }
    })

    await Promise.all(healthPromises)
    return this.healthStatus
  }

  /**
   * Get current health status for all services
   */
  getHealthStatus(): Map<string, ServiceHealth> {
    return new Map(this.healthStatus)
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthStatus.get(serviceName)
  }

  /**
   * Check if all critical services are healthy
   */
  areAllServicesHealthy(): boolean {
    return Array.from(this.healthStatus.values()).every(h => h.status === 'healthy')
  }

  /**
   * Get unhealthy services
   */
  getUnhealthyServices(): ServiceHealth[] {
    return Array.from(this.healthStatus.values()).filter(h => h.status !== 'healthy')
  }

  /**
   * Get service statistics
   */
  getStats(): {
    total: number
    byType: Record<ServiceType, number>
    healthy: number
    unhealthy: number
    degraded: number
  } {
    const services = Array.from(this.services.values())
    const healthStatuses = Array.from(this.healthStatus.values())

    const byType: Record<ServiceType, number> = {
      ai: 0,
      database: 0,
      'external-api': 0,
      cache: 0,
      queue: 0,
    }

    services.forEach(s => {
      byType[s.type] = (byType[s.type] || 0) + 1
    })

    return {
      total: services.length,
      byType,
      healthy: healthStatuses.filter(h => h.status === 'healthy').length,
      unhealthy: healthStatuses.filter(h => h.status === 'unhealthy').length,
      degraded: healthStatuses.filter(h => h.status === 'degraded').length,
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const serviceBus = new ServiceBus()
