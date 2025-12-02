/**
 * AI-Enhanced Task and Asset Management Routes
 * Provides AI-powered endpoints for intelligent task and asset management
 */

import { Router } from 'express'
import type { AuthRequest } from '../middleware/auth'
import { authenticateJWT } from '../middleware/auth'
import {
  analyzeTaskAndSuggest,
  suggestTaskAssignee,
  predictAssetMaintenance,
  suggestWorkflow,
  parseNaturalLanguageTask,
  answerQuestionAboutAssetOrTask
} from '../services/ai/task-asset-ai.service'
import {
  optimizeTaskSchedule,
  analyzeAssetLifecycle,
  predictMaintenanceWithMCP,
  queryWithNaturalLanguage,
  mcpManager
} from '../services/mcp/task-asset-mcp.service'
import TaskAssetConfigManager from '../services/config/task-asset-config.service'

const router = Router()
router.use(authenticateJWT)

/**
 * @openapi
 * /api/ai/task-suggestions:
 *   post:
 *     summary: Get AI suggestions for a task
 *     tags: [AI]
 */
router.post('/task-suggestions', async (req: AuthRequest, res) => {
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
    console.error('Error getting task suggestions:', error)
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
router.post('/suggest-assignee', async (req: AuthRequest, res) => {
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
    console.error('Error suggesting assignee:', error)
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
router.post('/parse-task', async (req: AuthRequest, res) => {
  try {
    const { input } = req.body
    const tenantId = req.user?.tenant_id

    const task = await parseNaturalLanguageTask(input, tenantId!)

    res.json({ task })
  } catch (error) {
    console.error('Error parsing task:', error)
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
router.post('/predict-maintenance', async (req: AuthRequest, res) => {
  try {
    const { assetId } = req.body
    const tenantId = req.user?.tenant_id

    const prediction = await predictAssetMaintenance(assetId, tenantId!)

    res.json({ prediction })
  } catch (error) {
    console.error('Error predicting maintenance:', error)
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
router.post('/workflow-suggestion', async (req: AuthRequest, res) => {
  try {
    const { taskId } = req.body
    const tenantId = req.user?.tenant_id

    const workflow = await suggestWorkflow(taskId, tenantId!)

    res.json({ workflow })
  } catch (error) {
    console.error('Error suggesting workflow:', error)
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
router.post('/ask-question', async (req: AuthRequest, res) => {
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
    console.error('Error answering question:', error)
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
router.post('/mcp/optimize-schedule', async (req: AuthRequest, res) => {
  try {
    const { tasks, constraints } = req.body

    const result = await optimizeTaskSchedule(tasks, constraints)

    res.json(result)
  } catch (error) {
    console.error('Error optimizing schedule:', error)
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
router.post('/mcp/analyze-asset-lifecycle', async (req: AuthRequest, res) => {
  try {
    const { asset } = req.body

    const analysis = await analyzeAssetLifecycle(asset)

    res.json({ analysis })
  } catch (error) {
    console.error('Error analyzing asset lifecycle:', error)
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
    console.error('Error getting MCP servers:', error)
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
    console.error('Error getting workflows:', error)
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
router.post('/config/workflows', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const configManager = new TaskAssetConfigManager(tenantId!)

    const workflow = await configManager.saveWorkflowTemplate(req.body)

    res.json({ workflow })
  } catch (error) {
    console.error('Error saving workflow:', error)
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
    console.error('Error getting business rules:', error)
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
router.post('/config/business-rules', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const configManager = new TaskAssetConfigManager(tenantId!)

    const rule = await configManager.saveBusinessRule(req.body)

    res.json({ rule })
  } catch (error) {
    console.error('Error saving business rule:', error)
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
router.post('/config/evaluate-rules', async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.tenant_id
    const { entity, triggerEvent, data } = req.body
    const configManager = new TaskAssetConfigManager(tenantId!)

    const actions = await configManager.evaluateRules(entity, triggerEvent, data)

    res.json({ actions })
  } catch (error) {
    console.error('Error evaluating rules:', error)
    res.status(500).json({ error: 'Failed to evaluate rules' })
  }
})

export default router
