/**
 * LangChain API Routes
 * Endpoints for AI-powered workflows, chat, and agent interactions
 */

import { Router, Request, Response } from 'express'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import langchainOrchestratorService from '../services/langchain-orchestrator.service'
import aiAgentSupervisorService from '../services/ai-agent-supervisor.service'
import mcpServerRegistryService from '../services/mcp-server-registry.service'
import { logger } from '../config/logger'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

// All routes require authentication
router.use(authenticateJWT)

/**
 * POST /api/langchain/execute
 * Execute a LangChain workflow
 */
router.post('/execute', requirePermission('report:generate:global'), async (req: Request, res: Response) => {
  try {
    const { workflowType, parameters } = req.body
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.userId
    const sessionId = req.body.sessionId || uuidv4()

    if (!workflowType) {
      return res.status(400).json({ error: 'Workflow type is required' })
    }

    logger.info('Executing LangChain workflow', {
      workflowType,
      userId,
      tenantId,
      sessionId
    })

    const context = {
      tenantId,
      userId,
      sessionId,
      workflowType,
      parameters: parameters || {}
    }

    let result

    switch (workflowType) {
      case 'maintenance-planning':
        result = await langchainOrchestratorService.executeMaintenancePlanningChain(context)
        break

      case 'incident-investigation':
        result = await langchainOrchestratorService.executeIncidentInvestigationChain(context)
        break

      case 'route-optimization':
        result = await langchainOrchestratorService.executeRouteOptimizationChain(context)
        break

      case 'cost-optimization':
        result = await langchainOrchestratorService.executeCostOptimizationChain(context)
        break

      default:
        return res.status(400).json({ error: `Unknown workflow type: ${workflowType}` })
    }

    res.json({
      success: true,
      workflow: workflowType,
      sessionId,
      result
    })
  } catch (error: any) {
    logger.error('Workflow execution failed', { error: error.message })
    res.status(500).json({
      error: 'Failed to execute workflow',
      details: error.message
    })
  }
})

/**
 * POST /api/langchain/chat
 * Chat with AI supervisor
 */
router.post('/chat', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const { message, sessionId, config } = req.body
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.userId

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const chatSessionId = sessionId || uuidv4()

    logger.info('Processing chat message', {
      userId,
      tenantId,
      sessionId: chatSessionId,
      messageLength: message.length
    })

    // Check if this is a complex query requiring supervisor
    const isComplexQuery = message.length > 100 ||
                          message.includes('analyze') ||
                          message.includes('compare') ||
                          message.includes('recommend')

    let response
    let responseType = 'chat'

    if (isComplexQuery) {
      // Use supervisor for complex queries
      const supervisorResult = await aiAgentSupervisorService.processQuery(
        message,
        tenantId,
        userId,
        chatSessionId
      )

      response = {
        message: supervisorResult.synthesis,
        agentsUsed: [
          supervisorResult.decision.primaryAgent,
          ...supervisorResult.decision.supportingAgents
        ],
        decision: supervisorResult.decision,
        agentResults: supervisorResult.results,
        tokensUsed: supervisorResult.totalTokens,
        executionTimeMs: supervisorResult.executionTimeMs
      }
      responseType = 'supervisor'
    } else {
      // Use simple chat for basic queries
      const chatResult = await langchainOrchestratorService.chat(
        chatSessionId,
        message,
        { tenantId, userId, sessionId: chatSessionId, workflowType: 'chat', parameters: {} },
        config
      )

      response = {
        message: chatResult.response,
        tokensUsed: chatResult.tokensUsed
      }
    }

    res.json({
      success: true,
      sessionId: chatSessionId,
      responseType,
      ...response
    })
  } catch (error: any) {
    logger.error('Chat processing failed', { error: error.message })
    res.status(500).json({
      error: 'Failed to process chat message',
      details: error.message
    })
  }
})

/**
 * POST /api/langchain/supervisor/query
 * Query the AI supervisor directly
 */
router.post('/supervisor/query', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const { query, sessionId } = req.body
    const tenantId = (req as any).user.tenant_id
    const userId = (req as any).user.userId

    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const querySessionId = sessionId || uuidv4()

    const result = await aiAgentSupervisorService.processQuery(
      query,
      tenantId,
      userId,
      querySessionId
    )

    res.json({
      success: true,
      sessionId: querySessionId,
      decision: result.decision,
      agentResults: result.results,
      synthesis: result.synthesis,
      totalTokens: result.totalTokens,
      executionTimeMs: result.executionTimeMs
    })
  } catch (error: any) {
    logger.error('Supervisor query failed', { error: error.message })
    res.status(500).json({
      error: 'Failed to process supervisor query',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/agents
 * List available AI agents
 */
router.get('/agents', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const agents = aiAgentSupervisorService.getAvailableAgents()

    res.json({
      success: true,
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities
      }))
    })
  } catch (error: any) {
    logger.error('Failed to list agents', { error: error.message })
    res.status(500).json({
      error: 'Failed to list agents',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/agents/:agentId
 * Get details of a specific agent
 */
router.get('/agents/:agentId', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params
    const agent = aiAgentSupervisorService.getAgent(agentId)

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' })
    }

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        capabilities: agent.capabilities,
        systemPrompt: agent.systemPrompt
      }
    })
  } catch (error: any) {
    logger.error('Failed to get agent', { error: error.message })
    res.status(500).json({
      error: 'Failed to get agent',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/workflows
 * List available workflows
 */
router.get('/workflows', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const workflows = [
      {
        id: 'maintenance-planning',
        name: 'Maintenance Planning',
        description: 'Analyze vehicle condition, check history, schedule maintenance, and assign technician',
        requiredParameters: ['vehicleId'],
        steps: [
          'Analyze vehicle condition',
          'Check maintenance history',
          'Generate maintenance plan',
          'Assign technician'
        ],
        estimatedDuration: '30-60 seconds'
      },
      {
        id: 'incident-investigation',
        name: 'Incident Investigation',
        description: 'Investigate incidents, analyze root causes, and recommend corrective actions',
        requiredParameters: ['incidentId'],
        steps: [
          'Retrieve incident report',
          'AI incident analysis',
          'Generate recommendations',
          'Update safety records'
        ],
        estimatedDuration: '20-45 seconds'
      },
      {
        id: 'route-optimization',
        name: 'Route Optimization',
        description: 'Optimize routes considering traffic, weather, and delivery windows',
        requiredParameters: ['routeIds'],
        steps: [
          'Retrieve current routes',
          'Fetch traffic data',
          'Fetch weather data',
          'AI route optimization',
          'Update dispatch'
        ],
        estimatedDuration: '40-70 seconds'
      },
      {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        description: 'Analyze spending patterns and identify cost-saving opportunities',
        requiredParameters: ['timeRange'],
        steps: [
          'Analyze spending patterns',
          'Identify savings opportunities',
          'Generate recommendations'
        ],
        estimatedDuration: '25-50 seconds'
      }
    ]

    res.json({
      success: true,
      workflows
    })
  } catch (error: any) {
    logger.error('Failed to list workflows', { error: error.message })
    res.status(500).json({
      error: 'Failed to list workflows',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/workflows/:workflowId
 * Get details of a specific workflow
 */
router.get('/workflows/:workflowId', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params

    const workflowDetails = {
      'maintenance-planning': {
        id: 'maintenance-planning',
        name: 'Maintenance Planning',
        description: 'Comprehensive vehicle maintenance planning workflow',
        requiredParameters: ['vehicleId'],
        optionalParameters: ['priority', 'scheduledDate'],
        steps: [
          {
            stepNumber: 1,
            name: 'Analyze Vehicle Condition',
            description: 'AI-powered analysis of vehicle condition and immediate needs'
          },
          {
            stepNumber: 2,
            name: 'Check Maintenance History',
            description: 'Review past maintenance records and identify patterns'
          },
          {
            stepNumber: 3,
            name: 'Generate Maintenance Plan',
            description: 'Create comprehensive maintenance plan with timeline and costs'
          },
          {
            stepNumber: 4,
            name: 'Assign Technician',
            description: 'Automatically assign qualified technician based on availability'
          }
        ],
        estimatedDuration: '30-60 seconds',
        aiModelsUsed: ['GPT-4 Turbo'],
        outputFormat: {
          vehicleAnalysis: 'object',
          maintenancePlan: 'object',
          assignment: 'object'
        }
      },
      'incident-investigation': {
        id: 'incident-investigation',
        name: 'Incident Investigation',
        description: 'AI-powered incident investigation and safety analysis',
        requiredParameters: ['incidentId'],
        steps: [
          {
            stepNumber: 1,
            name: 'Retrieve Incident Report',
            description: 'Fetch complete incident details and related data'
          },
          {
            stepNumber: 2,
            name: 'AI Incident Analysis',
            description: 'Deep analysis of root causes and contributing factors'
          },
          {
            stepNumber: 3,
            name: 'Generate Recommendations',
            description: 'Create actionable safety recommendations'
          },
          {
            stepNumber: 4,
            name: 'Update Safety Records',
            description: 'Update safety database with findings'
          }
        ],
        estimatedDuration: '20-45 seconds',
        aiModelsUsed: ['GPT-4 Turbo'],
        outputFormat: {
          incidentReport: 'object',
          analysis: 'object',
          recommendations: 'object',
          safetyUpdate: 'object'
        }
      },
      'route-optimization': {
        id: 'route-optimization',
        name: 'Route Optimization',
        description: 'Intelligent route optimization with real-time data',
        requiredParameters: ['routeIds'],
        steps: [
          {
            stepNumber: 1,
            name: 'Retrieve Current Routes',
            description: 'Get current route plans and constraints'
          },
          {
            stepNumber: 2,
            name: 'Fetch Traffic Data',
            description: 'Retrieve real-time traffic conditions'
          },
          {
            stepNumber: 3,
            name: 'Fetch Weather Data',
            description: 'Get weather forecasts for route areas'
          },
          {
            stepNumber: 4,
            name: 'AI Route Optimization',
            description: 'Generate optimized routes using AI'
          },
          {
            stepNumber: 5,
            name: 'Update Dispatch',
            description: 'Apply optimized routes to dispatch system'
          }
        ],
        estimatedDuration: '40-70 seconds',
        aiModelsUsed: ['GPT-4 Turbo'],
        outputFormat: {
          currentRoutes: 'object',
          optimizedRoutes: 'object',
          dispatchUpdate: 'object'
        }
      },
      'cost-optimization': {
        id: 'cost-optimization',
        name: 'Cost Optimization',
        description: 'Financial analysis and cost reduction recommendations',
        requiredParameters: ['timeRange'],
        steps: [
          {
            stepNumber: 1,
            name: 'Analyze Spending Patterns',
            description: 'Comprehensive analysis of fleet spending'
          },
          {
            stepNumber: 2,
            name: 'Identify Savings Opportunities',
            description: 'AI-powered identification of cost savings'
          },
          {
            stepNumber: 3,
            name: 'Generate Recommendations',
            description: 'Actionable cost reduction strategies'
          }
        ],
        estimatedDuration: '25-50 seconds',
        aiModelsUsed: ['GPT-4 Turbo'],
        outputFormat: {
          spendingAnalysis: 'object',
          savingsOpportunities: 'object',
          recommendations: 'object'
        }
      }
    }

    const workflow = workflowDetails[workflowId as keyof typeof workflowDetails]

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }

    res.json({
      success: true,
      workflow
    })
  } catch (error: any) {
    logger.error('Failed to get workflow', { error: error.message })
    res.status(500).json({
      error: 'Failed to get workflow',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/mcp/servers
 * List MCP servers and their health status
 */
router.get('/mcp/servers', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const healthStatus = mcpServerRegistryService.getHealthStatus()

    res.json({
      success: true,
      servers: healthStatus
    })
  } catch (error: any) {
    logger.error('Failed to list MCP servers', { error: error.message })
    res.status(500).json({
      error: 'Failed to list MCP servers',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/mcp/tools
 * List available MCP tools
 */
router.get('/mcp/tools', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenant_id
    const tools = await mcpServerRegistryService.getAvailableFleetTools(tenantId)

    res.json({
      success: true,
      tools
    })
  } catch (error: any) {
    logger.error('Failed to list MCP tools', { error: error.message })
    res.status(500).json({
      error: 'Failed to list MCP tools',
      details: error.message
    })
  }
})

/**
 * DELETE /api/langchain/sessions/:sessionId
 * Clear a chat session
 */
router.delete('/sessions/:sessionId', requirePermission('report:generate:global'), async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params

    langchainOrchestratorService.clearSession(sessionId)

    res.json({
      success: true,
      message: 'Session cleared successfully'
    })
  } catch (error: any) {
    logger.error('Failed to clear session', { error: error.message })
    res.status(500).json({
      error: 'Failed to clear session',
      details: error.message
    })
  }
})

/**
 * GET /api/langchain/sessions
 * List active sessions
 */
router.get('/sessions', requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const sessions = langchainOrchestratorService.getActiveSessions()

    res.json({
      success: true,
      sessions
    })
  } catch (error: any) {
    logger.error('Failed to list sessions', { error: error.message })
    res.status(500).json({
      error: 'Failed to list sessions',
      details: error.message
    })
  }
})

export default router
