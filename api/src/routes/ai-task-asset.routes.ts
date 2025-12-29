/**
 * AI-Enhanced Task and Asset Management Routes
 * Provides AI-powered endpoints for intelligent task and asset management
 */

import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 23: Add Winston logger
import { Router } from 'express'

import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import {
  analyzeTaskAndSuggest,
  suggestTaskAssignee,
  predictAssetMaintenance,
  suggestWorkflow,
  parseNaturalLanguageTask,
  answerQuestionAboutAssetOrTask
} from '../services/ai/task-asset-ai.service'
import TaskAssetConfigManager from '../services/config/task-asset-config.service'
import {
  optimizeTaskSchedule,
  analyzeAssetLifecycle,
  mcpManager
} from '../services/mcp/task-asset-mcp.service'


const router = Router()
router.use(authenticateJWT)

/**
 * @openapi
 * /api/ai/task-suggestions:
 *   post:
 *     summary: Get AI suggestions for a task
 *     tags: [AI]
 */
router.post('/task-suggestions',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { title, description, type } = req.body
    const tenantId = req.user?.tenant_id

    const suggestions = await analyzeTaskAndSuggest({
      title,
      description,
      type,
      tenant_id: tenantId!
    })

    res.json({ suggestions })
  } catch (error) {
    logger.error('Error getting task suggestions:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get AI suggestions' })
  }
})

/**
 * @openapi
 * /api/ai/suggest-assignee:
 *   post:
 *     summary: Suggest best assignee for a task
 *     tags: [AI]
 */
router.post('/suggest-assignee',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, priority } = req.body
    const tenantId = req.user?.tenant_id

    const suggestions = await suggestTaskAssignee({
      title,
      description,
      type,
      priority,
      tenant_id: tenantId!
    })

    res.json({ suggestions })
  } catch (error) {
    logger.error('Error suggesting assignee:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to suggest assignee' })
  }
})

/**
 * @openapi
 * /api/ai/parse-task:
 *   post:
 *     summary: Parse natural language into a structured task
 *     tags: [AI]
 */
router.post('/parse-task',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { input } = req.body
    const tenantId = req.user?.tenant_id

    const task = await parseNaturalLanguageTask(input, tenantId!)

    res.json({ task })
  } catch (error) {
    logger.error('Error parsing task:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to parse task' })
  }
})

/**
 * @openapi
 * /api/ai/predict-maintenance:
 *   post:
 *     summary: Predict asset maintenance needs
 *     tags: [AI]
 */
router.post('/predict-maintenance',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.body
    const tenantId = req.user?.tenant_id

    const prediction = await predictAssetMaintenance(assetId, tenantId!)

    res.json({ prediction })
  } catch (error) {
    logger.error('Error predicting maintenance:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to predict maintenance' })
  }
})

/**
 * @openapi
 * /api/ai/workflow-suggestion:
 *   post:
 *     summary: Get workflow suggestions for task completion
 *     tags: [AI]
 */
router.post('/workflow-suggestion',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.body
    const tenantId = req.user?.tenant_id

    const workflow = await suggestWorkflow(taskId, tenantId!)

    res.json({ workflow })
  } catch (error) {
    logger.error('Error suggesting workflow:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to suggest workflow' })
  }
})

/**
 * @openapi
 * /api/ai/ask-question:
 *   post:
 *     summary: Ask a question about a task or asset using RAG
 *     tags: [AI]
 */
router.post('/ask-question',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { question, contextId, contextType } = req.body
    const tenantId = req.user?.tenant_id

    const answer = await answerQuestionAboutAssetOrTask(
      question,
      contextId,
      contextType,
      tenantId!
    )

    res.json({ answer })
  } catch (error) {
    logger.error('Error answering question:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to answer question' })
  }
})

/**
 * MCP Server Integration Endpoints
 */

/**
 * @openapi
 * /api/mcp/optimize-schedule:
 *   post:
 *     summary: Optimize task schedule using MCP server
 *     tags: [MCP]
 */
router.post('/mcp/optimize-schedule',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { tasks, constraints } = req.body

    const result = await optimizeTaskSchedule(tasks, constraints)

    res.json(result)
  } catch (error) {
    logger.error('Error optimizing schedule:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to optimize schedule' })
  }
})

/**
 * @openapi
 * /api/mcp/analyze-asset-lifecycle:
 *   post:
 *     summary: Analyze asset lifecycle using MCP server
 *     tags: [MCP]
 */
router.post('/mcp/analyze-asset-lifecycle',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const { asset } = req.body

    const analysis = await analyzeAssetLifecycle(asset)

    res.json({ analysis })
  } catch (error) {
    logger.error('Error analyzing asset lifecycle:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to analyze asset lifecycle' })
  }
})

/**
 * @openapi
 * /api/mcp/servers:
 *   get:
 *     summary: List connected MCP servers
 *     tags: [MCP]
 */
router.get('/mcp/servers', async (req: AuthRequest, res) => {
  try {
    const servers = mcpManager.getConnectedServers()
    res.json({ servers })
  } catch (error) {
    logger.error('Error getting MCP servers:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get MCP servers' })
  }
})

/**
 * Configuration Management Endpoints
 */

/**
 * @openapi
 * /api/config/workflows:
 *   get:
 *     summary: Get workflow templates
 *     tags: [Config]
 */
router.get('/config/workflows', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const configManager = new TaskAssetConfigManager(tenantId!)

    const workflows = await configManager.getWorkflowTemplates()

    res.json({ workflows })
  } catch (error) {
    logger.error('Error getting workflows:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get workflows' })
  }
})

/**
 * @openapi
 * /api/config/workflows:
 *   post:
 *     summary: Create or update workflow template
 *     tags: [Config]
 */
router.post('/config/workflows',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const configManager = new TaskAssetConfigManager(tenantId!)

    const workflow = await configManager.saveWorkflowTemplate(req.body)

    res.json({ workflow })
  } catch (error) {
    logger.error('Error saving workflow:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to save workflow' })
  }
})

/**
 * @openapi
 * /api/config/business-rules:
 *   get:
 *     summary: Get business rules
 *     tags: [Config]
 */
router.get('/config/business-rules', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { entity } = req.query
    const configManager = new TaskAssetConfigManager(tenantId!)

    const rules = await configManager.getBusinessRules(entity as any)

    res.json({ rules })
  } catch (error) {
    logger.error('Error getting business rules:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get business rules' })
  }
})

/**
 * @openapi
 * /api/config/business-rules:
 *   post:
 *     summary: Create or update business rule
 *     tags: [Config]
 */
router.post('/config/business-rules',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const configManager = new TaskAssetConfigManager(tenantId!)

    const rule = await configManager.saveBusinessRule(req.body)

    res.json({ rule })
  } catch (error) {
    logger.error('Error saving business rule:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to save business rule' })
  }
})

/**
 * @openapi
 * /api/config/evaluate-rules:
 *   post:
 *     summary: Evaluate business rules for an entity
 *     tags: [Config]
 */
router.post('/config/evaluate-rules',csrfProtection, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { entity, triggerEvent, data } = req.body
    const configManager = new TaskAssetConfigManager(tenantId!)

    const actions = await configManager.evaluateRules(entity, triggerEvent, data)

    res.json({ actions })
  } catch (error) {
    logger.error('Error evaluating rules:', error) // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to evaluate rules' })
  }
})

export default router
