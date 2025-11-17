/**
 * MCP Server Registry Service
 * Enhanced MCP integration with multiple server support, health monitoring,
 * failover, and load balancing for fleet operations
 */

import pool from '../config/database'
import { logger } from '../config/logger'
import mcpServerService, { MCPToolRequest, MCPToolResponse } from './mcp-server.service'

export interface MCPServerHealth {
  serverId: string
  serverName: string
  status: 'healthy' | 'degraded' | 'down'
  responseTime: number
  lastCheck: Date
  successRate: number
  totalRequests: number
  failedRequests: number
}

export interface MCPServerPool {
  serverType: string
  servers: string[]
  loadBalancingStrategy: 'round-robin' | 'least-connections' | 'fastest-response'
  currentIndex: number
}

export interface FleetToolDefinition {
  name: string
  description: string
  inputSchema: Record<string, any>
  serverType: string
}

class MCPServerRegistryService {
  private healthStatus: Map<string, MCPServerHealth> = new Map()
  private serverPools: Map<string, MCPServerPool> = new Map()
  private healthCheckInterval: NodeJS.Timeout | null = null
  private requestCounts: Map<string, number> = new Map()

  constructor() {
    this.initializeServerPools()
    this.startHealthMonitoring()
  }

  /**
   * Initialize server pools for different operation types
   */
  private async initializeServerPools(): Promise<void> {
    // Define server pools for different fleet operations
    this.serverPools.set('vehicle-operations', {
      serverType: 'vehicle-operations',
      servers: [],
      loadBalancingStrategy: 'round-robin',
      currentIndex: 0
    })

    this.serverPools.set('maintenance', {
      serverType: 'maintenance',
      servers: [],
      loadBalancingStrategy: 'least-connections',
      currentIndex: 0
    })

    this.serverPools.set('cost-analysis', {
      serverType: 'cost-analysis',
      servers: [],
      loadBalancingStrategy: 'fastest-response',
      currentIndex: 0
    })

    this.serverPools.set('documents', {
      serverType: 'documents',
      servers: [],
      loadBalancingStrategy: 'round-robin',
      currentIndex: 0
    })

    logger.info('MCP server pools initialized')
  }

  /**
   * Register multiple MCP servers for fleet operations
   */
  async registerFleetMCPServers(tenantId: string, userId: string): Promise<void> {
    try {
      // Vehicle Operations Server
      await mcpServerService.registerServer(tenantId, userId, {
        server_name: 'Fleet Vehicle Operations',
        server_type: 'vehicle-operations',
        connection_url: process.env.MCP_VEHICLE_SERVER_URL || 'http://localhost:3100',
        configuration: {
          health_check_endpoint: '/health',
          timeout: 30000,
          tools: ['get_vehicle', 'update_vehicle', 'list_vehicles', 'vehicle_status']
        }
      })

      // Maintenance Server
      await mcpServerService.registerServer(tenantId, userId, {
        server_name: 'Fleet Maintenance Operations',
        server_type: 'maintenance',
        connection_url: process.env.MCP_MAINTENANCE_SERVER_URL || 'http://localhost:3101',
        configuration: {
          health_check_endpoint: '/health',
          timeout: 30000,
          tools: ['schedule_maintenance', 'get_maintenance_history', 'assign_technician']
        }
      })

      // Cost Analysis Server
      await mcpServerService.registerServer(tenantId, userId, {
        server_name: 'Fleet Cost Analysis',
        server_type: 'cost-analysis',
        connection_url: process.env.MCP_COST_SERVER_URL || 'http://localhost:3102',
        configuration: {
          health_check_endpoint: '/health',
          timeout: 30000,
          tools: ['calculate_costs', 'analyze_spending', 'forecast_expenses']
        }
      })

      // Document Management Server
      await mcpServerService.registerServer(tenantId, userId, {
        server_name: 'Fleet Document Management',
        server_type: 'documents',
        connection_url: process.env.MCP_DOCUMENT_SERVER_URL || 'http://localhost:3103',
        configuration: {
          health_check_endpoint: '/health',
          timeout: 30000,
          tools: ['retrieve_document', 'search_documents', 'upload_document']
        }
      })

      // Update server pools
      await this.refreshServerPools(tenantId)

      logger.info('Fleet MCP servers registered successfully', { tenantId })
    } catch (error: any) {
      logger.error('Failed to register fleet MCP servers', { error: error.message, tenantId })
      throw error
    }
  }

  /**
   * Refresh server pools from database
   */
  async refreshServerPools(tenantId: string): Promise<void> {
    const servers = await mcpServerService.getActiveServers(tenantId)

    // Group servers by type
    for (const server of servers) {
      const pool = this.serverPools.get(server.server_type)
      if (pool && !pool.servers.includes(server.id)) {
        pool.servers.push(server.id)
      }
    }
  }

  /**
   * Execute tool with automatic failover and load balancing
   */
  async executeToolWithFailover(
    toolName: string,
    parameters: Record<string, any>,
    tenantId: string,
    userId: string,
    serverType?: string
  ): Promise<MCPToolResponse> {
    // Determine server type from tool name if not provided
    const targetServerType = serverType || this.inferServerType(toolName)
    const pool = this.serverPools.get(targetServerType)

    if (!pool || pool.servers.length === 0) {
      return {
        success: false,
        result: null,
        execution_time_ms: 0,
        error: 'No servers available for this operation'
      }
    }

    // Try servers in order based on load balancing strategy
    const serverOrder = this.getServerOrder(pool)

    for (const serverId of serverOrder) {
      // Check if server is healthy
      const health = this.healthStatus.get(serverId)
      if (health && health.status === 'down') {
        continue
      }

      try {
        // Track request count
        this.requestCounts.set(serverId, (this.requestCounts.get(serverId) || 0) + 1)

        // Execute tool
        const result = await mcpServerService.executeTool(
          serverId,
          tenantId,
          userId,
          { tool_name: toolName, parameters }
        )

        if (result.success) {
          // Update success metrics
          this.updateHealthMetrics(serverId, true, result.execution_time_ms)
          return result
        }
      } catch (error: any) {
        logger.warn('Server execution failed, trying failover', {
          serverId,
          toolName,
          error: error.message
        })
        this.updateHealthMetrics(serverId, false, 0)
      }
    }

    // All servers failed
    return {
      success: false,
      result: null,
      execution_time_ms: 0,
      error: 'All servers failed to execute the tool'
    }
  }

  /**
   * Get server execution order based on load balancing strategy
   */
  private getServerOrder(pool: MCPServerPool): string[] {
    switch (pool.loadBalancingStrategy) {
      case 'round-robin':
        return this.getRoundRobinOrder(pool)
      case 'least-connections':
        return this.getLeastConnectionsOrder(pool)
      case 'fastest-response':
        return this.getFastestResponseOrder(pool)
      default:
        return pool.servers
    }
  }

  private getRoundRobinOrder(pool: MCPServerPool): string[] {
    const order = [...pool.servers]
    const startIndex = pool.currentIndex % pool.servers.length
    pool.currentIndex++
    return [...order.slice(startIndex), ...order.slice(0, startIndex)]
  }

  private getLeastConnectionsOrder(pool: MCPServerPool): string[] {
    return [...pool.servers].sort((a, b) => {
      const aCount = this.requestCounts.get(a) || 0
      const bCount = this.requestCounts.get(b) || 0
      return aCount - bCount
    })
  }

  private getFastestResponseOrder(pool: MCPServerPool): string[] {
    return [...pool.servers].sort((a, b) => {
      const aHealth = this.healthStatus.get(a)
      const bHealth = this.healthStatus.get(b)
      const aTime = aHealth?.responseTime || Infinity
      const bTime = bHealth?.responseTime || Infinity
      return aTime - bTime
    })
  }

  /**
   * Infer server type from tool name
   */
  private inferServerType(toolName: string): string {
    if (toolName.includes('vehicle') || toolName.includes('asset')) {
      return 'vehicle-operations'
    }
    if (toolName.includes('maintenance') || toolName.includes('repair')) {
      return 'maintenance'
    }
    if (toolName.includes('cost') || toolName.includes('expense')) {
      return 'cost-analysis'
    }
    if (toolName.includes('document') || toolName.includes('file')) {
      return 'documents'
    }
    return 'vehicle-operations' // Default
  }

  /**
   * Start health monitoring for all servers
   */
  private startHealthMonitoring(): void {
    // Check health every 2 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks()
    }, 2 * 60 * 1000)

    logger.info('MCP server health monitoring started')
  }

  /**
   * Perform health checks on all servers
   */
  async performHealthChecks(): Promise<void> {
    for (const pool of this.serverPools.values()) {
      for (const serverId of pool.servers) {
        await this.checkServerHealth(serverId)
      }
    }
  }

  /**
   * Check health of a specific server
   */
  async checkServerHealth(serverId: string): Promise<MCPServerHealth> {
    const startTime = Date.now()

    try {
      // Get server info from database
      const result = await pool.query(
        'SELECT * FROM mcp_servers WHERE id = $1',
        [serverId]
      )

      if (result.rows.length === 0) {
        throw new Error('Server not found')
      }

      const server = result.rows[0]

      // Get health metrics
      const metricsResult = await pool.query(
        `SELECT
           COUNT(*) as total_requests,
           SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_requests,
           AVG(execution_time_ms) as avg_response_time
         FROM mcp_tool_executions
         WHERE server_id = $1 AND created_at > NOW() - INTERVAL '15 minutes'`,
        [serverId]
      )

      const metrics = metricsResult.rows[0]
      const totalRequests = parseInt(metrics.total_requests) || 0
      const failedRequests = parseInt(metrics.failed_requests) || 0
      const successRate = totalRequests > 0
        ? ((totalRequests - failedRequests) / totalRequests) * 100
        : 100

      const responseTime = Date.now() - startTime

      let status: 'healthy' | 'degraded' | 'down' = 'healthy'
      if (server.connection_status === 'error' || successRate < 50) {
        status = 'down'
      } else if (successRate < 90 || responseTime > 5000) {
        status = 'degraded'
      }

      const health: MCPServerHealth = {
        serverId,
        serverName: server.server_name,
        status,
        responseTime,
        lastCheck: new Date(),
        successRate,
        totalRequests,
        failedRequests
      }

      this.healthStatus.set(serverId, health)
      return health
    } catch (error: any) {
      logger.error('Health check failed', { serverId, error: error.message })

      const health: MCPServerHealth = {
        serverId,
        serverName: 'Unknown',
        status: 'down',
        responseTime: 0,
        lastCheck: new Date(),
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0
      }

      this.healthStatus.set(serverId, health)
      return health
    }
  }

  /**
   * Update health metrics for a server
   */
  private updateHealthMetrics(serverId: string, success: boolean, responseTime: number): void {
    const health = this.healthStatus.get(serverId)
    if (health) {
      health.totalRequests++
      if (!success) {
        health.failedRequests++
      }
      health.successRate = ((health.totalRequests - health.failedRequests) / health.totalRequests) * 100
      health.responseTime = responseTime
      health.lastCheck = new Date()

      // Update status
      if (health.successRate < 50) {
        health.status = 'down'
      } else if (health.successRate < 90) {
        health.status = 'degraded'
      } else {
        health.status = 'healthy'
      }
    }
  }

  /**
   * Get health status for all servers
   */
  getHealthStatus(): MCPServerHealth[] {
    return Array.from(this.healthStatus.values())
  }

  /**
   * Get health status for a specific server
   */
  getServerHealth(serverId: string): MCPServerHealth | undefined {
    return this.healthStatus.get(serverId)
  }

  /**
   * Get available fleet tools from all servers
   */
  async getAvailableFleetTools(tenantId: string): Promise<FleetToolDefinition[]> {
    const tools: FleetToolDefinition[] = []

    // Vehicle Operations Tools
    tools.push(
      {
        name: 'get_vehicle',
        description: 'Retrieve detailed information about a specific vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string', description: 'The vehicle ID' }
          },
          required: ['vehicleId']
        },
        serverType: 'vehicle-operations'
      },
      {
        name: 'update_vehicle_status',
        description: 'Update the status of a vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'maintenance', 'out_of_service'] }
          },
          required: ['vehicleId', 'status']
        },
        serverType: 'vehicle-operations'
      }
    )

    // Maintenance Tools
    tools.push(
      {
        name: 'schedule_maintenance',
        description: 'Schedule maintenance for a vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string' },
            maintenanceType: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date-time' }
          },
          required: ['vehicleId', 'maintenanceType', 'scheduledDate']
        },
        serverType: 'maintenance'
      },
      {
        name: 'get_maintenance_history',
        description: 'Get maintenance history for a vehicle',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string' },
            limit: { type: 'number', default: 10 }
          },
          required: ['vehicleId']
        },
        serverType: 'maintenance'
      }
    )

    // Cost Analysis Tools
    tools.push(
      {
        name: 'calculate_vehicle_costs',
        description: 'Calculate total costs for a vehicle over a time period',
        inputSchema: {
          type: 'object',
          properties: {
            vehicleId: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' }
          },
          required: ['vehicleId', 'startDate', 'endDate']
        },
        serverType: 'cost-analysis'
      },
      {
        name: 'analyze_fleet_spending',
        description: 'Analyze spending patterns across the entire fleet',
        inputSchema: {
          type: 'object',
          properties: {
            timeRange: { type: 'string', enum: ['7d', '30d', '90d', '1y'] }
          },
          required: ['timeRange']
        },
        serverType: 'cost-analysis'
      }
    )

    // Document Tools
    tools.push(
      {
        name: 'retrieve_document',
        description: 'Retrieve a specific document',
        inputSchema: {
          type: 'object',
          properties: {
            documentId: { type: 'string' }
          },
          required: ['documentId']
        },
        serverType: 'documents'
      },
      {
        name: 'search_documents',
        description: 'Search documents using natural language',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            documentType: { type: 'string', optional: true }
          },
          required: ['query']
        },
        serverType: 'documents'
      }
    )

    return tools
  }

  /**
   * Shutdown registry
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    logger.info('MCP server registry shut down')
  }
}

export const mcpServerRegistryService = new MCPServerRegistryService()
export default mcpServerRegistryService
