/**
 * MCP (Model Context Protocol) Server Integration
 * Provides external AI capabilities through MCP servers
 *
 * Features:
 * - Connect to external MCP servers for specialized AI tasks
 * - Task optimization and scheduling
 * - Asset lifecycle analysis
 * - Predictive analytics
 * - Custom AI workflows
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

interface MCPServerConfig {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

interface MCPToolCall {
  name: string
  arguments: Record<string, any>
}

/**
 * MCP Server Manager
 */
export class MCPServerManager {
  private clients: Map<string, Client> = new Map()
  private transports: Map<string, StdioClientTransport> = new Map()

  /**
   * Initialize and connect to MCP servers
   */
  async connect(config: MCPServerConfig): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env
      })

      const client = new Client({
        name: 'fleet-management-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      })

      await client.connect(transport)

      this.clients.set(config.name, client)
      this.transports.set(config.name, transport)

      console.log(`Connected to MCP server: ${config.name}`)
    } catch (error) {
      console.error(`Failed to connect to MCP server ${config.name}:`, error)
      throw error
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName)
    const transport = this.transports.get(serverName)

    if (client && transport) {
      await client.close()
      await transport.close()
      this.clients.delete(serverName)
      this.transports.delete(serverName)
      console.log(`Disconnected from MCP server: ${serverName}`)
    }
  }

  /**
   * List available tools from an MCP server
   */
  async listTools(serverName: string): Promise<any[]> {
    const client = this.clients.get(serverName)
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected`)
    }

    const response = await client.listTools()
    return response.tools || []
  }

  /**
   * Call a tool on an MCP server
   */
  async callTool(serverName: string, toolCall: MCPToolCall): Promise<any> {
    const client = this.clients.get(serverName)
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected`)
    }

    const response = await client.callTool({
      name: toolCall.name,
      arguments: toolCall.arguments
    })

    return response
  }

  /**
   * Get all connected servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys())
  }
}

// Global MCP server manager instance
export const mcpManager = new MCPServerManager()

/**
 * Task Optimization using MCP Server
 */
export async function optimizeTaskSchedule(
  tasks: any[],
  constraints: {
    availableWorkers: number
    deadline?: Date
    priorityWeights?: Record<string, number>
  }
): Promise<{
  optimizedSchedule: any[]
  efficiency: number
  warnings: string[]
}> {
  try {
    const servers = mcpManager.getConnectedServers()

    // Look for an optimization MCP server
    const optimizationServer = servers.find(s => s.includes('optimize') || s.includes('schedule'))

    if (!optimizationServer) {
      throw new Error('No optimization MCP server connected')
    }

    const result = await mcpManager.callTool(optimizationServer, {
      name: 'optimize_task_schedule',
      arguments: {
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.task_title,
          priority: t.priority,
          estimatedHours: t.estimated_hours,
          dueDate: t.due_date,
          dependencies: t.parent_task_id ? [t.parent_task_id] : []
        })),
        constraints
      }
    })

    return result.content[0].type === 'text'
      ? JSON.parse(result.content[0].text)
      : { optimizedSchedule: [], efficiency: 0, warnings: [] }
  } catch (error) {
    console.error('Error optimizing task schedule:', error)
    return {
      optimizedSchedule: tasks,
      efficiency: 0,
      warnings: ['Optimization service unavailable']
    }
  }
}

/**
 * Asset Lifecycle Analysis using MCP Server
 */
export async function analyzeAssetLifecycle(asset: any): Promise<{
  currentPhase: string
  remainingLifeYears: number
  recommendations: string[]
  costProjections: any[]
}> {
  try {
    const servers = mcpManager.getConnectedServers()
    const analysisServer = servers.find(s => s.includes('analysis') || s.includes('asset'))

    if (!analysisServer) {
      throw new Error('No asset analysis MCP server connected')
    }

    const result = await mcpManager.callTool(analysisServer, {
      name: 'analyze_asset_lifecycle',
      arguments: {
        asset: {
          id: asset.id,
          type: asset.asset_type,
          purchaseDate: asset.purchase_date,
          purchasePrice: asset.purchase_price,
          currentValue: asset.current_value,
          condition: asset.condition,
          maintenanceHistory: asset.maintenance_history || []
        }
      }
    })

    return result.content[0].type === 'text'
      ? JSON.parse(result.content[0].text)
      : {
          currentPhase: 'unknown',
          remainingLifeYears: 0,
          recommendations: [],
          costProjections: []
        }
  } catch (error) {
    console.error('Error analyzing asset lifecycle:', error)
    return {
      currentPhase: 'unknown',
      remainingLifeYears: 0,
      recommendations: ['Analysis service unavailable'],
      costProjections: []
    }
  }
}

/**
 * Predictive Maintenance using MCP Server
 */
export async function predictMaintenanceWithMCP(
  assetId: string,
  historicalData: any[]
): Promise<{
  nextMaintenanceDate: Date
  confidence: number
  predictedIssues: string[]
  preventiveMeasures: string[]
}> {
  try {
    const servers = mcpManager.getConnectedServers()
    const predictionServer = servers.find(s => s.includes('predict') || s.includes('maintenance'))

    if (!predictionServer) {
      throw new Error('No prediction MCP server connected')
    }

    const result = await mcpManager.callTool(predictionServer, {
      name: 'predict_maintenance',
      arguments: {
        assetId,
        historicalData
      }
    })

    const prediction = result.content[0].type === 'text'
      ? JSON.parse(result.content[0].text)
      : null

    return {
      nextMaintenanceDate: prediction ? new Date(prediction.nextMaintenanceDate) : new Date(),
      confidence: prediction?.confidence || 0,
      predictedIssues: prediction?.predictedIssues || [],
      preventiveMeasures: prediction?.preventiveMeasures || []
    }
  } catch (error) {
    console.error('Error predicting maintenance:', error)
    return {
      nextMaintenanceDate: new Date(),
      confidence: 0,
      predictedIssues: [],
      preventiveMeasures: ['Prediction service unavailable']
    }
  }
}

/**
 * Natural Language Query using MCP Server
 */
export async function queryWithNaturalLanguage(
  query: string,
  context: {
    tasks?: any[]
    assets?: any[]
  }
): Promise<string> {
  try {
    const servers = mcpManager.getConnectedServers()
    const nlpServer = servers.find(s => s.includes('nlp') || s.includes('query'))

    if (!nlpServer) {
      throw new Error('No NLP MCP server connected')
    }

    const result = await mcpManager.callTool(nlpServer, {
      name: 'natural_language_query',
      arguments: {
        query,
        context
      }
    })

    return result.content[0].type === 'text'
      ? result.content[0].text
      : 'Unable to process query'
  } catch (error) {
    console.error('Error processing natural language query:', error)
    return 'Query service unavailable'
  }
}

/**
 * Initialize default MCP servers
 */
export async function initializeDefaultMCPServers(): Promise<void> {
  const defaultServers: MCPServerConfig[] = [
    {
      name: 'task-optimizer',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-optimizer'],
      env: { ...process.env }
    },
    {
      name: 'asset-analyzer',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-analyzer'],
      env: { ...process.env }
    }
  ]

  for (const server of defaultServers) {
    try {
      await mcpManager.connect(server)
    } catch (error) {
      console.warn(`Could not connect to MCP server ${server.name}:`, error)
      // Continue with other servers
    }
  }
}

export default {
  mcpManager,
  optimizeTaskSchedule,
  analyzeAssetLifecycle,
  predictMaintenanceWithMCP,
  queryWithNaturalLanguage,
  initializeDefaultMCPServers
}
