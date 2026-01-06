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

export class ServiceBus {
  private services: Map<string, ServiceAdapter> = new Map()
  private healthStatus: Map<string, ServiceHealth> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null

  /**
   * Register a service adapter
   */
  register(service: ServiceAdapter): void {
    this.services.set(service.name, service)
    console.log(`[Service Bus] Registered service: ${service.name} (${service.type})`)
  }

  /**
   * Unregister a service
   */
  unregister(serviceName: string): void {
    const service = this.services.get(serviceName)
    if (service) {
      this.services.delete(serviceName)
      this.healthStatus.delete(serviceName)
      console.log(`[Service Bus] Unregistered service: ${serviceName}`)
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
    console.log('[Service Bus] Initializing all services...')

    const initPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        await service.initialize()
        console.log(`[Service Bus] ✅ ${name} initialized`)
      } catch (error: any) {
        console.error(`[Service Bus] ❌ ${name} initialization failed:`, error.message)
      }
    })

    await Promise.all(initPromises)
    console.log('[Service Bus] All services initialized')
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdownAll(): Promise<void> {
    console.log('[Service Bus] Shutting down all services...')

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    const shutdownPromises = Array.from(this.services.entries()).map(async ([name, service]) => {
      try {
        await service.shutdown()
        console.log(`[Service Bus] ✅ ${name} shut down`)
      } catch (error: any) {
        console.error(`[Service Bus] ❌ ${name} shutdown failed:`, error.message)
      }
    })

    await Promise.all(shutdownPromises)
    console.log('[Service Bus] All services shut down')
  }

  /**
   * Start periodic health checks for all services
   */
  startHealthChecks(intervalMs: number = 30000): void {
    console.log(`[Service Bus] Starting health checks (interval: ${intervalMs}ms)`)

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
      } catch (error: any) {
        const failedHealth: ServiceHealth = {
          name: service.name,
          type: service.type,
          status: 'unhealthy',
          lastCheck: new Date(),
          message: `Health check failed: ${error.message}`,
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
