/**
 * AI Service for Task and Asset Management
 * Provides intelligent recommendations, predictions, and automation
 *
 * Features:
 * - Task prioritization and assignment suggestions
 * - Predictive asset maintenance
 * - RAG-powered document Q&A
 * - Workflow optimization
 * - Natural language processing for task creation
 */

import Anthropic from '@anthropic-ai/sdk'
import pool from '../../config/database'
import { embed } from '../embeddings.service'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
})

export interface TaskSuggestion {
  suggestedPriority?: string
  suggestedAssignee?: string
  estimatedHours?: number
  similarTasks?: any[]
  recommendations?: string[]
}

export interface AssetMaintenancePrediction {
  assetId: string
  predictedMaintenanceDate: Date
  confidence: number
  reasoning: string
  estimatedCost: number
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface WorkflowSuggestion {
  nextActions: string[]
  dependencies: string[]
  estimatedCompletion: Date
  riskFactors: string[]
}

/**
 * Analyze task and provide intelligent suggestions
 */
export async function analyzeTaskAndSuggest(taskData: {
  title: string
  description?: string
  type?: string
  tenant_id: string
}): Promise<TaskSuggestion> {
  try {
    // Find similar tasks using embeddings
    const taskText = `${taskData.title} ${taskData.description || ''}`
    const embedding = await embed(taskText)

    const similarTasks = await pool.query(
      `SELECT
        id, task_title, description, priority, assigned_to,
        actual_hours, status, created_at,
        (embedding <-> $1::vector) as similarity
      FROM tasks
      WHERE tenant_id = $2
        AND embedding IS NOT NULL
        AND status = 'completed'
      ORDER BY similarity ASC
      LIMIT 5`,
      [JSON.stringify(embedding), taskData.tenant_id]
    )

    // Use Claude to analyze and provide suggestions
    const prompt = `Analyze this task and provide intelligent suggestions:

Task Title: ${taskData.title}
Task Description: ${taskData.description || 'N/A'}
Task Type: ${taskData.type || 'general'}

Similar Completed Tasks:
${similarTasks.rows.map((t, idx) => `
${idx + 1}. ${t.task_title}
   - Priority: ${t.priority}
   - Time taken: ${t.actual_hours || 'N/A'} hours
   - Status: ${t.status}
`).join('\n')}

Based on this information, provide:
1. Suggested priority level (low, medium, high, critical)
2. Estimated hours to complete
3. Key recommendations for successful completion
4. Potential challenges or dependencies

Format your response as JSON with keys: suggestedPriority, estimatedHours, recommendations (array), challenges (array)`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const suggestions = JSON.parse(responseText)

    return {
      suggestedPriority: suggestions.suggestedPriority,
      estimatedHours: suggestions.estimatedHours,
      similarTasks: similarTasks.rows,
      recommendations: suggestions.recommendations || []
    }
  } catch (error) {
    console.error('Error analyzing task:', error)
    return {
      recommendations: ['Unable to generate AI suggestions']
    }
  }
}

/**
 * Suggest best assignee for a task based on:
 * - Current workload
 * - Past performance on similar tasks
 * - Skill matching
 * - Availability
 */
export async function suggestTaskAssignee(taskData: {
  title: string
  description?: string
  type?: string
  priority?: string
  tenant_id: string
}): Promise<{ userId: string; userName: string; confidence: number; reason: string }[]> {
  try {
    // Get users and their current workload
    const users = await pool.query(
      `SELECT
        u.id,
        u.first_name || ' ' || u.last_name as name,
        u.role,
        COUNT(t.id) FILTER (WHERE t.status IN ('pending', 'in_progress')) as active_tasks,
        AVG(t.actual_hours) FILTER (WHERE t.status = 'completed') as avg_completion_time,
        COUNT(t.id) FILTER (WHERE t.status = 'completed' AND t.task_type = $2) as similar_task_count
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assigned_to AND t.tenant_id = $1
      WHERE u.tenant_id = $1 AND u.is_active = true
      GROUP BY u.id, u.first_name, u.last_name, u.role`,
      [taskData.tenant_id, taskData.type]
    )

    const prompt = `Analyze and recommend the best assignee for this task:

Task: ${taskData.title}
Description: ${taskData.description || 'N/A'}
Type: ${taskData.type || 'general'}
Priority: ${taskData.priority || 'medium'}

Available Users:
${users.rows.map(u => `
- ${u.name} (${u.role})
  Active tasks: ${u.active_tasks}
  Average completion time: ${u.avg_completion_time || 'N/A'} hours
  Similar tasks completed: ${u.similar_task_count}
`).join('\n')}

Recommend the top 3 assignees with:
1. User ID
2. Confidence score (0-100)
3. Reasoning

Return as JSON array: [{ userId, confidence, reason }]`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '[]'
    const recommendations = JSON.parse(responseText)

    // Enrich with user names
    return recommendations.map((rec: any) => {
      const user = users.rows.find(u => u.id === rec.userId)
      return {
        ...rec,
        userName: user?.name || 'Unknown'
      }
    })
  } catch (error) {
    console.error('Error suggesting assignee:', error)
    return []
  }
}

/**
 * Predict asset maintenance needs using ML and historical data
 */
export async function predictAssetMaintenance(
  assetId: string,
  tenant_id: string
): Promise<AssetMaintenancePrediction | null> {
  try {
    // Get asset details and maintenance history
    const assetQuery = await pool.query(
      `SELECT
        a.*,
        COUNT(am.id) as maintenance_count,
        MAX(am.maintenance_date) as last_maintenance,
        AVG(am.cost) as avg_maintenance_cost
      FROM assets a
      LEFT JOIN asset_maintenance am ON a.id = am.asset_id
      WHERE a.id = $1 AND a.tenant_id = $2
      GROUP BY a.id`,
      [assetId, tenant_id]
    )

    if (assetQuery.rows.length === 0) {
      return null
    }

    const asset = assetQuery.rows[0]

    // Get maintenance history
    const maintenanceHistory = await pool.query(
      `SELECT * FROM asset_maintenance
       WHERE asset_id = $1
       ORDER BY maintenance_date DESC
       LIMIT 10`,
      [assetId]
    )

    const prompt = `Analyze this asset and predict maintenance needs:

Asset: ${asset.asset_name}
Type: ${asset.asset_type}
Condition: ${asset.condition}
Purchase Date: ${asset.purchase_date}
Last Maintenance: ${asset.last_maintenance || 'Never'}
Maintenance History Count: ${asset.maintenance_count}
Average Maintenance Cost: $${asset.avg_maintenance_cost || 0}

Recent Maintenance Records:
${maintenanceHistory.rows.map(m => `
- Date: ${m.maintenance_date}
  Type: ${m.maintenance_type}
  Cost: $${m.cost}
`).join('\n')}

Predict:
1. Next maintenance date
2. Confidence level (0-100)
3. Reasoning
4. Estimated cost
5. Urgency (low, medium, high, critical)

Return as JSON: { predictedDate, confidence, reasoning, estimatedCost, urgency }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const prediction = JSON.parse(responseText)

    return {
      assetId,
      predictedMaintenanceDate: new Date(prediction.predictedDate),
      confidence: prediction.confidence,
      reasoning: prediction.reasoning,
      estimatedCost: prediction.estimatedCost,
      urgency: prediction.urgency
    }
  } catch (error) {
    console.error('Error predicting asset maintenance:', error)
    return null
  }
}

/**
 * Generate workflow suggestions for task completion
 */
export async function suggestWorkflow(
  taskId: string,
  tenant_id: string
): Promise<WorkflowSuggestion | null> {
  try {
    // Get task details and related information
    const task = await pool.query(
      `SELECT
        t.*,
        v.vehicle_number,
        u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1 AND t.tenant_id = $2`,
      [taskId, tenant_id]
    )

    if (task.rows.length === 0) {
      return null
    }

    const taskData = task.rows[0]

    // Get subtasks and dependencies
    const subtasks = await pool.query(
      `SELECT * FROM tasks WHERE parent_task_id = $1`,
      [taskId]
    )

    const prompt = `Create an optimal workflow for completing this task:

Task: ${taskData.task_title}
Description: ${taskData.description || 'N/A'}
Type: ${taskData.task_type}
Priority: ${taskData.priority}
Estimated Hours: ${taskData.estimated_hours || 'Unknown'}

Current Subtasks:
${subtasks.rows.map(st => `- ${st.task_title} (${st.status})`).join('\n') || 'None'}

Suggest:
1. Next actionable steps (in order)
2. Dependencies or prerequisites
3. Estimated completion timeline
4. Potential risk factors

Return as JSON: { nextActions (array), dependencies (array), estimatedCompletion (ISO date), riskFactors (array) }`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1536,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const workflow = JSON.parse(responseText)

    return {
      nextActions: workflow.nextActions || [],
      dependencies: workflow.dependencies || [],
      estimatedCompletion: new Date(workflow.estimatedCompletion),
      riskFactors: workflow.riskFactors || []
    }
  } catch (error) {
    console.error('Error suggesting workflow:', error)
    return null
  }
}

/**
 * Natural language task creation using AI
 */
export async function parseNaturalLanguageTask(
  input: string,
  tenant_id: string
): Promise<{
  title: string
  description: string
  type: string
  priority: string
  dueDate?: string
  estimatedHours?: number
}> {
  try {
    const prompt = `Parse this natural language input into a structured task:

Input: "${input}"

Extract and return as JSON:
{
  "title": "Clear, concise task title",
  "description": "Detailed description",
  "type": "task type (maintenance, inspection, repair, administrative, safety, training, other)",
  "priority": "priority level (low, medium, high, critical)",
  "dueDate": "YYYY-MM-DD if mentioned, null otherwise",
  "estimatedHours": number or null
}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    return JSON.parse(responseText)
  } catch (error) {
    console.error('Error parsing natural language task:', error)
    throw new Error('Failed to parse task')
  }
}

/**
 * RAG-powered document Q&A for assets and tasks
 */
export async function answerQuestionAboutAssetOrTask(
  question: string,
  contextId: string,
  contextType: 'asset' | 'task',
  tenant_id: string
): Promise<string> {
  try {
    // Get relevant context
    let context = ''

    if (contextType === 'asset') {
      const asset = await pool.query(
        `SELECT a.*,
          (SELECT json_agg(am.* ORDER BY am.maintenance_date DESC)
           FROM asset_maintenance am WHERE am.asset_id = a.id) as maintenance_history
        FROM assets a
        WHERE a.id = $1 AND a.tenant_id = $2`,
        [contextId, tenant_id]
      )

      if (asset.rows.length > 0) {
        context = JSON.stringify(asset.rows[0], null, 2)
      }
    } else {
      const task = await pool.query(
        `SELECT t.*,
          (SELECT json_agg(tc.*) FROM task_comments tc WHERE tc.task_id = t.id) as comments,
          (SELECT json_agg(tci.*) FROM task_checklist_items tci WHERE tci.task_id = t.id) as checklist
        FROM tasks t
        WHERE t.id = $1 AND t.tenant_id = $2`,
        [contextId, tenant_id]
      )

      if (task.rows.length > 0) {
        context = JSON.stringify(task.rows[0], null, 2)
      }
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Answer this question based on the provided context:

Question: ${question}

Context (${contextType}):
${context}

Provide a clear, concise answer based only on the information in the context. If the answer cannot be found in the context, say so.`
      }]
    })

    return message.content[0].type === 'text' ? message.content[0].text : 'Unable to answer'
  } catch (error) {
    console.error('Error answering question:', error)
    throw new Error('Failed to answer question')
  }
}

export default {
  analyzeTaskAndSuggest,
  suggestTaskAssignee,
  predictAssetMaintenance,
  suggestWorkflow,
  parseNaturalLanguageTask,
  answerQuestionAboutAssetOrTask
}
