/**
 * MCP (Model Context Protocol) Server Integration Service
 * Manages connections to Claude MCP servers for tool use and context management
 */

import pool from '../config/database'
import { logger } from '../utils/logger'
import axios, { AxiosInstance } from 'axios'

export interface MCPServer {
  id: string
  tenant_id: string
  server_name: string
  server_type: string
  connection_url: string
  configuration: Record<string, any>
  capabilities: Record<string, any>
  is_active: boolean
  connection_status: 'connected' | 'disconnected' | 'error' | 'unauthorized'
}

export interface MCPToolRequest {
  tool_name: string
  parameters: Record<string, any>
  context?: Record<string, any>
}

export interface MCPToolResponse {
  success: boolean
  result: any
  execution_time_ms: number
  error?: string
}

interface MCPServerConnection {
  server: MCPServer
  client: AxiosInstance
  lastHeartbeat: Date
}

class MCPServerService {
  private connections: Map<string, MCPServerConnection> = new Map()
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startHeartbeatMonitor()
  }

  /**
   * Initialize MCP server connection
   */
  async connectServer(serverId: string, tenantId: string): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT id, tenant_id, server_name, server_url, status, last_health_check, created_at, updated_at FROM mcp_servers
         WHERE id = $1 AND tenant_id = $2 AND is_active = true`,
        [serverId, tenantId]
      )

      if (result.rows.length === 0) {
        logger.warn('MCP server not found or inactive', { serverId, tenantId })
        return false
      }

      const server: MCPServer = result.rows[0]

      // Create axios client for this server
      const client = axios.create({
        baseURL: server.connection_url,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Fleet-Management-MCP-Client/1.0'
        }
      })

      // Add API key if configured
      if (server.configuration.api_key) {
        client.defaults.headers.common['Authorization'] = `Bearer ${server.configuration.api_key}`
      }

      // Test connection
      const connectionStatus = await this.testConnection(client, server)

      if (connectionStatus) {
        this.connections.set(serverId, {
          server,
          client,
          lastHeartbeat: new Date()
        })

        await this.updateConnectionStatus(serverId, 'connected', null)
        logger.info('MCP server connected successfully', { serverId, serverName: server.server_name })
        return true
      } else {
        await this.updateConnectionStatus(serverId, 'error', 'Connection test failed')
        return false
      }
    } catch (error: any) {
      logger.error('Error connecting to MCP server', { serverId, error: error.message })
      await this.updateConnectionStatus(serverId, 'error', error.message)
      return false
    }
  }

  /**
   * Test connection to MCP server
   */
  private async testConnection(client: AxiosInstance, server: MCPServer): Promise<boolean> {
    try {
      const healthUrl = server.configuration.health_check_endpoint || '/health'
      const response = await client.get(healthUrl)
      return response.status === 200
    } catch (error) {
      logger.warn('MCP server health check failed', { serverName: server.server_name })
      return false
    }
  }

  /**
   * Execute tool on MCP server
   */
  async executeTool(
    serverId: string,
    tenantId: string,
    userId: string,
    toolRequest: MCPToolRequest
  ): Promise<MCPToolResponse> {
    const startTime = Date.now()

    try {
      // Get or establish connection
      let connection = this.connections.get(serverId)
      if (!connection) {
        const connected = await this.connectServer(serverId, tenantId)
        if (!connected) {
          throw new Error('Failed to connect to MCP server')
        }
        connection = this.connections.get(serverId)!
      }

      // Execute tool
      const response = await connection.client.post('/tools/execute', {
        tool: toolRequest.tool_name,
        parameters: toolRequest.parameters,
        context: toolRequest.context || {}
      })

      const executionTime = Date.now() - startTime

      // Log execution
      await this.logToolExecution(
        serverId,
        tenantId,
        userId,
        toolRequest.tool_name,
        toolRequest.parameters,
        response.data,
        executionTime,
        'success',
        null
      )

      return {
        success: true,
        result: response.data,
        execution_time_ms: executionTime
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime

      logger.error('MCP tool execution failed', {
        serverId,
        tool: toolRequest.tool_name,
        error: error.message
      })

      // Log failed execution
      await this.logToolExecution(
        serverId,
        tenantId,
        userId,
        toolRequest.tool_name,
        toolRequest.parameters,
        null,
        executionTime,
        'error',
        error.message
      )

      return {
        success: false,
        result: null,
        execution_time_ms: executionTime,
        error: error.message
      }
    }
  }

  /**
   * List available tools from MCP server
   */
  async listTools(serverId: string, tenantId: string): Promise<any[]> {
    try {
      let connection = this.connections.get(serverId)
      if (!connection) {
        const connected = await this.connectServer(serverId, tenantId)
        if (!connected) {
          throw new Error('Failed to connect to MCP server')
        }
        connection = this.connections.get(serverId)!
      }

      const response = await connection.client.get('/tools/list')
      return response.data.tools || []
    } catch (error: any) {
      logger.error('Failed to list MCP tools', { serverId, error: error.message })
      return []
    }
  }

  /**
   * Register new MCP server
   */
  async registerServer(
    tenantId: string,
    userId: string,
    serverConfig: {
      server_name: string
      server_type: string
      connection_url: string
      api_key?: string
      configuration?: Record<string, any>
    }
  ): Promise<MCPServer> {
    const result = await pool.query(
      `INSERT INTO mcp_servers (
        tenant_id, server_name, server_type, connection_url,
        configuration, is_active, connection_status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        tenantId,
        serverConfig.server_name,
        serverConfig.server_type,
        serverConfig.connection_url,
        JSON.stringify({
          ...serverConfig.configuration,
          api_key: serverConfig.api_key
        }),
        true,
        'disconnected',
        userId
      ]
    )

    const server = result.rows[0]
    logger.info('MCP server registered', { serverId: server.id, serverName: server.server_name })

    // Attempt to connect
    await this.connectServer(server.id, tenantId)

    return server
  }

  /**
   * Get all active servers for tenant
   */
  async getActiveServers(tenantId: string): Promise<MCPServer[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, server_name, server_url, status, last_health_check, created_at, updated_at FROM mcp_servers
       WHERE tenant_id = $1 AND is_active = true
       ORDER BY server_name`,
      [tenantId]
    )

    return result.rows
  }

  /**
   * Update connection status
   */
  private async updateConnectionStatus(
    serverId: string,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    await pool.query(
      `UPDATE mcp_servers
       SET connection_status = $1,
           error_message = $2,
           last_connected_at = CASE WHEN $1 = 'connected' THEN NOW() ELSE last_connected_at END,
           updated_at = NOW()
       WHERE id = $3',
      [status, errorMessage, serverId]
    )
  }

  /**
   * Log tool execution
   */
  private async logToolExecution(
    serverId: string,
    tenantId: string,
    userId: string,
    toolName: string,
    inputParams: any,
    outputResult: any,
    executionTime: number,
    status: string,
    errorMessage: string | null
  ): Promise<void> {
    await pool.query(
      `INSERT INTO mcp_tool_executions (
        tenant_id, server_id, tool_name, input_parameters,
        output_result, execution_time_ms, status, error_message, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        tenantId,
        serverId,
        toolName,
        JSON.stringify(inputParams),
        outputResult ? JSON.stringify(outputResult) : null,
        executionTime,
        status,
        errorMessage,
        userId
      ]
    )
  }

  /**
   * Start heartbeat monitor for all connections
   */
  private startHeartbeatMonitor(): void {
    // Check connection health every 5 minutes
    this.heartbeatInterval = setInterval(async () => {
      for (const [serverId, connection] of this.connections.entries()) {
        try {
          const isHealthy = await this.testConnection(connection.client, connection.server)

          if (isHealthy) {
            connection.lastHeartbeat = new Date()
            await this.updateConnectionStatus(serverId, 'connected', null)
          } else {
            await this.updateConnectionStatus(serverId, 'error', 'Heartbeat failed')
            this.connections.delete(serverId)
          }
        } catch (error) {
          logger.warn('Heartbeat check failed', { serverId })
          this.connections.delete(serverId)
        }
      }
    }, 5 * 60 * 1000)
  }

  /**
   * Disconnect server
   */
  async disconnectServer(serverId: string): Promise<void> {
    this.connections.delete(serverId)
    await this.updateConnectionStatus(serverId, 'disconnected', null)
    logger.info('MCP server disconnected', { serverId })
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    for (const serverId of this.connections.keys()) {
      await this.disconnectServer(serverId)
    }

    logger.info('MCP server service shut down')
  }
}

export const mcpServerService = new MCPServerService()
export default mcpServerService
