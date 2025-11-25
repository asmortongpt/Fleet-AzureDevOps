/**
 * LangChain Orchestration Service
 * Manages complex multi-step AI workflows for fleet operations
 * Integrates with OpenAI GPT-4 and MCP servers
 */

import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { BufferMemory, ChatMessageHistory } from 'langchain/memory'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import pool from '../config/database'
import { logger } from '../utils/logger'
import mcpServerService from './mcp-server.service'

export interface WorkflowContext {
  tenantId: string
  userId: string
  sessionId: string
  workflowType: string
  parameters: Record<string, any>
}

export interface WorkflowResult {
  success: boolean
  steps: WorkflowStep[]
  finalResult: any
  totalTokens: number
  executionTimeMs: number
  error?: string
}

export interface WorkflowStep {
  stepName: string
  stepNumber: number
  input: any
  output: any
  tokensUsed: number
  executionTimeMs: number
  status: 'success' | 'error'
  error?: string
}

export interface ChainConfig {
  temperature?: number
  maxTokens?: number
  modelName?: string
  enableMemory?: boolean
}

class LangChainOrchestratorService {
  private model: ChatOpenAI
  private sessions: Map<string, BufferMemory> = new Map()

  constructor() {
    // Initialize GPT-4 model
    this.model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      maxTokens: 2000,
      openAIApiKey: process.env.OPENAI_API_KEY
    })
  }

  /**
   * Execute maintenance planning workflow chain
   * Steps: Analyze vehicle → Check history → Schedule maintenance → Assign technician
   */
  async executeMaintenancePlanningChain(
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []
    let totalTokens = 0

    try {
      const { vehicleId } = context.parameters

      // Step 1: Analyze vehicle condition
      const step1Start = Date.now()
      const vehicleAnalysis = await this.analyzeVehicleCondition(vehicleId, context.tenantId)
      steps.push({
        stepName: 'Analyze Vehicle Condition`,
        stepNumber: 1,
        input: { vehicleId },
        output: vehicleAnalysis,
        tokensUsed: vehicleAnalysis.tokensUsed || 0,
        executionTimeMs: Date.now() - step1Start,
        status: 'success'
      })
      totalTokens += vehicleAnalysis.tokensUsed || 0

      // Step 2: Check maintenance history
      const step2Start = Date.now()
      const maintenanceHistory = await this.getMaintenanceHistory(vehicleId, context.tenantId)
      steps.push({
        stepName: 'Check Maintenance History`,
        stepNumber: 2,
        input: { vehicleId },
        output: maintenanceHistory,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step2Start,
        status: 'success'
      })

      // Step 3: Generate maintenance plan using AI
      const step3Start = Date.now()
      const maintenancePlan = await this.generateMaintenancePlan(
        vehicleAnalysis,
        maintenanceHistory,
        context
      )
      steps.push({
        stepName: 'Generate Maintenance Plan`,
        stepNumber: 3,
        input: { vehicleAnalysis, maintenanceHistory },
        output: maintenancePlan,
        tokensUsed: maintenancePlan.tokensUsed || 0,
        executionTimeMs: Date.now() - step3Start,
        status: 'success'
      })
      totalTokens += maintenancePlan.tokensUsed || 0

      // Step 4: Assign technician
      const step4Start = Date.now()
      const assignment = await this.assignTechnician(
        maintenancePlan,
        context.tenantId
      )
      steps.push({
        stepName: 'Assign Technician`,
        stepNumber: 4,
        input: { maintenancePlan },
        output: assignment,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step4Start,
        status: 'success'
      })

      // Log workflow execution
      await this.logWorkflowExecution(context, steps, totalTokens, 'success')

      return {
        success: true,
        steps,
        finalResult: {
          vehicleAnalysis,
          maintenancePlan,
          assignment
        },
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error: any) {
      logger.error('Maintenance planning chain failed', { error: error.message, context })
      await this.logWorkflowExecution(context, steps, totalTokens, 'error', error.message)

      return {
        success: false,
        steps,
        finalResult: null,
        totalTokens,
        executionTimeMs: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Execute incident investigation workflow chain
   * Steps: Report → Analyze → Recommend actions → Update safety records
   */
  async executeIncidentInvestigationChain(
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []
    let totalTokens = 0

    try {
      const { incidentId } = context.parameters

      // Step 1: Get incident report
      const step1Start = Date.now()
      const incidentReport = await this.getIncidentReport(incidentId, context.tenantId)
      steps.push({
        stepName: 'Retrieve Incident Report`,
        stepNumber: 1,
        input: { incidentId },
        output: incidentReport,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step1Start,
        status: 'success'
      })

      // Step 2: AI analysis of incident
      const step2Start = Date.now()
      const analysis = await this.analyzeIncident(incidentReport, context)
      steps.push({
        stepName: 'AI Incident Analysis`,
        stepNumber: 2,
        input: { incidentReport },
        output: analysis,
        tokensUsed: analysis.tokensUsed || 0,
        executionTimeMs: Date.now() - step2Start,
        status: 'success'
      })
      totalTokens += analysis.tokensUsed || 0

      // Step 3: Generate recommendations
      const step3Start = Date.now()
      const recommendations = await this.generateIncidentRecommendations(
        incidentReport,
        analysis,
        context
      )
      steps.push({
        stepName: 'Generate Recommendations`,
        stepNumber: 3,
        input: { incidentReport, analysis },
        output: recommendations,
        tokensUsed: recommendations.tokensUsed || 0,
        executionTimeMs: Date.now() - step3Start,
        status: 'success'
      })
      totalTokens += recommendations.tokensUsed || 0

      // Step 4: Update safety records
      const step4Start = Date.now()
      const safetyUpdate = await this.updateSafetyRecords(
        incidentId,
        analysis,
        recommendations,
        context.tenantId
      )
      steps.push({
        stepName: 'Update Safety Records`,
        stepNumber: 4,
        input: { incidentId, analysis, recommendations },
        output: safetyUpdate,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step4Start,
        status: 'success'
      })

      await this.logWorkflowExecution(context, steps, totalTokens, 'success')

      return {
        success: true,
        steps,
        finalResult: {
          incidentReport,
          analysis,
          recommendations,
          safetyUpdate
        },
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error: any) {
      logger.error('Incident investigation chain failed', { error: error.message, context })
      await this.logWorkflowExecution(context, steps, totalTokens, 'error', error.message)

      return {
        success: false,
        steps,
        finalResult: null,
        totalTokens,
        executionTimeMs: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Execute route optimization workflow chain
   * Steps: Current routes → Traffic → Weather → Optimize → Dispatch
   */
  async executeRouteOptimizationChain(
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []
    let totalTokens = 0

    try {
      const { routeIds } = context.parameters

      // Step 1: Get current routes
      const step1Start = Date.now()
      const currentRoutes = await this.getCurrentRoutes(routeIds, context.tenantId)
      steps.push({
        stepName: 'Retrieve Current Routes`,
        stepNumber: 1,
        input: { routeIds },
        output: currentRoutes,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step1Start,
        status: 'success'
      })

      // Step 2: Get traffic data
      const step2Start = Date.now()
      const trafficData = await this.getTrafficData(currentRoutes)
      steps.push({
        stepName: 'Fetch Traffic Data`,
        stepNumber: 2,
        input: { currentRoutes },
        output: trafficData,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step2Start,
        status: 'success'
      })

      // Step 3: Get weather data
      const step3Start = Date.now()
      const weatherData = await this.getWeatherData(currentRoutes)
      steps.push({
        stepName: 'Fetch Weather Data`,
        stepNumber: 3,
        input: { currentRoutes },
        output: weatherData,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step3Start,
        status: 'success'
      })

      // Step 4: AI-powered route optimization
      const step4Start = Date.now()
      const optimizedRoutes = await this.optimizeRoutes(
        currentRoutes,
        trafficData,
        weatherData,
        context
      )
      steps.push({
        stepName: 'AI Route Optimization`,
        stepNumber: 4,
        input: { currentRoutes, trafficData, weatherData },
        output: optimizedRoutes,
        tokensUsed: optimizedRoutes.tokensUsed || 0,
        executionTimeMs: Date.now() - step4Start,
        status: 'success'
      })
      totalTokens += optimizedRoutes.tokensUsed || 0

      // Step 5: Update dispatch
      const step5Start = Date.now()
      const dispatchUpdate = await this.updateDispatch(
        optimizedRoutes,
        context.tenantId
      )
      steps.push({
        stepName: 'Update Dispatch`,
        stepNumber: 5,
        input: { optimizedRoutes },
        output: dispatchUpdate,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step5Start,
        status: 'success'
      })

      await this.logWorkflowExecution(context, steps, totalTokens, 'success')

      return {
        success: true,
        steps,
        finalResult: {
          currentRoutes,
          optimizedRoutes,
          dispatchUpdate
        },
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error: any) {
      logger.error('Route optimization chain failed', { error: error.message, context })
      await this.logWorkflowExecution(context, steps, totalTokens, 'error', error.message)

      return {
        success: false,
        steps,
        finalResult: null,
        totalTokens,
        executionTimeMs: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Execute cost optimization workflow chain
   * Steps: Analyze spending → Identify savings → Recommend actions
   */
  async executeCostOptimizationChain(
    context: WorkflowContext
  ): Promise<WorkflowResult> {
    const startTime = Date.now()
    const steps: WorkflowStep[] = []
    let totalTokens = 0

    try {
      const { timeRange } = context.parameters

      // Step 1: Analyze spending patterns
      const step1Start = Date.now()
      const spendingAnalysis = await this.analyzeSpending(timeRange, context.tenantId)
      steps.push({
        stepName: 'Analyze Spending Patterns`,
        stepNumber: 1,
        input: { timeRange },
        output: spendingAnalysis,
        tokensUsed: 0,
        executionTimeMs: Date.now() - step1Start,
        status: 'success'
      })

      // Step 2: AI-powered savings identification
      const step2Start = Date.now()
      const savingsOpportunities = await this.identifySavings(
        spendingAnalysis,
        context
      )
      steps.push({
        stepName: 'Identify Savings Opportunities`,
        stepNumber: 2,
        input: { spendingAnalysis },
        output: savingsOpportunities,
        tokensUsed: savingsOpportunities.tokensUsed || 0,
        executionTimeMs: Date.now() - step2Start,
        status: 'success'
      })
      totalTokens += savingsOpportunities.tokensUsed || 0

      // Step 3: Generate actionable recommendations
      const step3Start = Date.now()
      const recommendations = await this.generateCostRecommendations(
        spendingAnalysis,
        savingsOpportunities,
        context
      )
      steps.push({
        stepName: 'Generate Recommendations`,
        stepNumber: 3,
        input: { spendingAnalysis, savingsOpportunities },
        output: recommendations,
        tokensUsed: recommendations.tokensUsed || 0,
        executionTimeMs: Date.now() - step3Start,
        status: 'success'
      })
      totalTokens += recommendations.tokensUsed || 0

      await this.logWorkflowExecution(context, steps, totalTokens, 'success')

      return {
        success: true,
        steps,
        finalResult: {
          spendingAnalysis,
          savingsOpportunities,
          recommendations
        },
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error: any) {
      logger.error('Cost optimization chain failed', { error: error.message, context })
      await this.logWorkflowExecution(context, steps, totalTokens, 'error', error.message)

      return {
        success: false,
        steps,
        finalResult: null,
        totalTokens,
        executionTimeMs: Date.now() - startTime,
        error: error.message
      }
    }
  }

  /**
   * Chat with conversational memory
   */
  async chat(
    sessionId: string,
    message: string,
    context: WorkflowContext,
    config?: ChainConfig
  ): Promise<{ response: string; tokensUsed: number }> {
    try {
      // Get or create memory for session
      let memory = this.sessions.get(sessionId)
      if (!memory) {
        memory = new BufferMemory({
          returnMessages: true,
          memoryKey: 'chat_history'
        })
        this.sessions.set(sessionId, memory)
      }

      // Create chat model with custom config
      const chatModel = new ChatOpenAI({
        modelName: config?.modelName || 'gpt-4-turbo-preview',
        temperature: config?.temperature || 0.7,
        maxTokens: config?.maxTokens || 1000,
        openAIApiKey: process.env.OPENAI_API_KEY
      })

      // Define fleet management tools
      const tools = this.createFleetTools(context)

      // Create prompt template with memory
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an AI assistant for a fleet management system. You help fleet managers with:
          - Vehicle maintenance planning and scheduling
          - Incident investigation and safety recommendations
          - Route optimization and dispatch planning
          - Cost analysis and savings opportunities
          - General fleet operations questions

          You have access to real fleet data and can execute actions.
          Always be helpful, accurate, and prioritize safety.`
        ],
        new MessagesPlaceholder('chat_history'),
        ['human', '{input}']
      ])

      // Get chat history
      const chatHistory = await memory.chatHistory.getMessages()

      // Create chain
      const chain = RunnableSequence.from([
        {
          input: (input: any) => input.input,
          chat_history: () => chatHistory
        },
        prompt,
        chatModel,
        new StringOutputParser()
      ])

      // Execute chain
      const response = await chain.invoke({ input: message })

      // Save to memory
      await memory.chatHistory.addMessage(new HumanMessage(message))
      await memory.chatHistory.addMessage(new AIMessage(response))

      // Save to database
      await this.saveChatMessage(sessionId, context.tenantId, context.userId, message, response)

      return {
        response,
        tokensUsed: this.estimateTokens(message + response)
      }
    } catch (error: any) {
      logger.error('Chat failed', { error: error.message, sessionId })
      throw error
    }
  }

  /**
   * Create fleet management tools for LangChain
   */
  private createFleetTools(context: WorkflowContext): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: 'get_vehicle_info',
        description: 'Get detailed information about a vehicle including status, location, and maintenance history`,
        schema: z.object({
          vehicleId: z.string().describe('The vehicle ID to look up')
        }),
        func: async ({ vehicleId }) => {
          const result = await pool.query(
            `SELECT
      id,
      tenant_id,
      vin,
      make,
      model,
      year,
      license_plate,
      vehicle_type,
      fuel_type,
      status,
      odometer,
      engine_hours,
      purchase_date,
      purchase_price,
      current_value,
      gps_device_id,
      last_gps_update,
      latitude,
      longitude,
      location,
      speed,
      heading,
      assigned_driver_id,
      assigned_facility_id,
      telematics_data,
      photos,
      notes,
      created_at,
      updated_at FROM vehicles WHERE id = $1 AND tenant_id = $2',
            [vehicleId, context.tenantId]
          )
          return JSON.stringify(result.rows[0] || {})
        }
      }),
      new DynamicStructuredTool({
        name: 'schedule_maintenance',
        description: 'Schedule maintenance for a vehicle`,
        schema: z.object({
          vehicleId: z.string().describe('The vehicle ID'),
          maintenanceType: z.string().describe('Type of maintenance'),
          scheduledDate: z.string().describe('Scheduled date in ISO format')
        }),
        func: async ({ vehicleId, maintenanceType, scheduledDate }) => {
          const result = await pool.query(
            `INSERT INTO tasks (tenant_id, title, description, task_type, related_asset_id, priority, due_date, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [
              context.tenantId,
              `${maintenanceType} - Vehicle ${vehicleId}`,
              `Scheduled maintenance: ${maintenanceType}`,
              'maintenance',
              vehicleId,
              'medium',
              scheduledDate,
              'pending',
              context.userId
            ]
          )
          return JSON.stringify({ success: true, task: result.rows[0] })
        }
      }),
      new DynamicStructuredTool({
        name: 'get_cost_summary',
        description: 'Get cost summary for a specific time period`,
        schema: z.object({
          startDate: z.string().describe('Start date in ISO format'),
          endDate: z.string().describe('End date in ISO format')
        }),
        func: async ({ startDate, endDate }) => {
          const result = await pool.query(
            `SELECT
               SUM(fuel_cost) as total_fuel,
               SUM(maintenance_cost) as total_maintenance,
               COUNT(*) as transaction_count
             FROM cost_transactions
             WHERE tenant_id = $1 AND date BETWEEN $2 AND $3',
            [context.tenantId, startDate, endDate]
          )
          return JSON.stringify(result.rows[0] || {})
        }
      })
    ]
  }

  // Helper methods for workflow steps

  private async analyzeVehicleCondition(vehicleId: string, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT v.*,
              COUNT(t.id) as pending_tasks,
              MAX(t.updated_at) as last_maintenance
       FROM vehicles v
       LEFT JOIN tasks t ON t.related_asset_id = v.id AND t.task_type = 'maintenance'
       WHERE v.id = $1 AND v.tenant_id = $2
       GROUP BY v.id',
      [vehicleId, tenantId]
    )

    const vehicle = result.rows[0]

    // Use AI to analyze condition
    const prompt = `Analyze the condition of this vehicle and identify any maintenance needs:

Vehicle: ${vehicle.make} ${vehicle.model} ${vehicle.year}
Mileage: ${vehicle.mileage || 0}
Status: ${vehicle.status}
Pending Tasks: ${vehicle.pending_tasks}
Last Maintenance: ${vehicle.last_maintenance || 'Never'}

Provide a brief analysis of the vehicle condition and any immediate concerns.`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      vehicle,
      aiAnalysis: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async getMaintenanceHistory(vehicleId: string, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT id, tenant_id, title, description, status, priority, due_date, assigned_to, created_by, created_at, updated_at FROM tasks
       WHERE related_asset_id = $1 AND tenant_id = $2 AND task_type = 'maintenance'
       ORDER BY created_at DESC LIMIT 10`,
      [vehicleId, tenantId]
    )

    return result.rows
  }

  private async generateMaintenancePlan(
    vehicleAnalysis: any,
    history: any[],
    context: WorkflowContext
  ): Promise<any> {
    const prompt = `Based on the vehicle analysis and maintenance history, create a comprehensive maintenance plan:

Vehicle Analysis:
${JSON.stringify(vehicleAnalysis.aiAnalysis, null, 2)}

Recent Maintenance History:
${JSON.stringify(history.slice(0, 3), null, 2)}

Generate a structured maintenance plan with:
1. Immediate actions needed
2. Scheduled maintenance tasks
3. Estimated costs
4. Recommended timeline`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      plan: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async assignTechnician(plan: any, tenantId: string): Promise<any> {
    // In a real system, this would query available technicians
    // For now, return a placeholder
    return {
      technician: 'Auto-assigned',
      status: 'pending_assignment',
      estimatedStartDate: new Date(Date.now() + 86400000).toISOString()
    }
  }

  private async getIncidentReport(incidentId: string, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
      id,
      tenant_id,
      incident_title,
      incident_type,
      severity,
      status,
      incident_date,
      incident_time,
      location,
      description,
      vehicle_id,
      driver_id,
      reported_by,
      assigned_investigator,
      injuries_reported,
      injury_details,
      property_damage,
      damage_estimate,
      weather_conditions,
      road_conditions,
      police_report_number,
      insurance_claim_number,
      resolution_notes,
      root_cause,
      preventive_measures,
      closed_by,
      closed_date,
      metadata,
      created_at,
      updated_at FROM incidents WHERE id = $1 AND tenant_id = $2',
      [incidentId, tenantId]
    )

    return result.rows[0]
  }

  private async analyzeIncident(report: any, context: WorkflowContext): Promise<any> {
    const prompt = `Analyze this incident and provide detailed insights:

Incident Type: ${report.incident_type}
Severity: ${report.severity}
Description: ${report.description}
Location: ${report.location}
Date: ${report.incident_date}

Provide:
1. Root cause analysis
2. Contributing factors
3. Safety implications
4. Compliance concerns`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      analysis: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async generateIncidentRecommendations(
    report: any,
    analysis: any,
    context: WorkflowContext
  ): Promise<any> {
    const prompt = `Based on this incident analysis, provide specific recommendations:

${analysis.analysis}

Generate:
1. Immediate corrective actions
2. Long-term preventive measures
3. Training recommendations
4. Policy updates needed`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      recommendations: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async updateSafetyRecords(
    incidentId: string,
    analysis: any,
    recommendations: any,
    tenantId: string
  ): Promise<any> {
    await pool.query(
      `UPDATE incidents
       SET ai_analysis = $1, ai_recommendations = $2, updated_at = NOW()
       WHERE id = $3 AND tenant_id = $4`,
      [analysis.analysis, recommendations.recommendations, incidentId, tenantId]
    )

    return { updated: true, incidentId }
  }

  private async getCurrentRoutes(routeIds: string[], tenantId: string): Promise<any> {
    // Placeholder - would query actual routes
    return {
      routes: routeIds.map(id => ({
        id,
        origin: 'Location A`,
        destination: 'Location B`,
        estimatedTime: 60
      }))
    }
  }

  private async getTrafficData(routes: any): Promise<any> {
    // Placeholder - would call traffic API
    return { trafficLevel: 'moderate', delays: [] }
  }

  private async getWeatherData(routes: any): Promise<any> {
    // Placeholder - would call weather API
    return { conditions: 'clear', temperature: 72 }
  }

  private async optimizeRoutes(
    routes: any,
    traffic: any,
    weather: any,
    context: WorkflowContext
  ): Promise<any> {
    const prompt = `Optimize these routes considering traffic and weather:

Routes: ${JSON.stringify(routes)}
Traffic: ${JSON.stringify(traffic)}
Weather: ${JSON.stringify(weather)}

Provide optimized routes with:
1. Best route alternatives
2. Time savings
3. Fuel efficiency improvements
4. Risk assessment`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      optimizedRoutes: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async updateDispatch(routes: any, tenantId: string): Promise<any> {
    return { status: 'updated', timestamp: new Date().toISOString() }
  }

  private async analyzeSpending(timeRange: any, tenantId: string): Promise<any> {
    const result = await pool.query(
      `SELECT
         category,
         SUM(amount) as total,
         COUNT(*) as count
       FROM cost_transactions
       WHERE tenant_id = $1
       GROUP BY category`,
      [tenantId]
    )

    return { spending: result.rows, timeRange }
  }

  private async identifySavings(spending: any, context: WorkflowContext): Promise<any> {
    const prompt = `Analyze this spending data and identify savings opportunities:

${JSON.stringify(spending, null, 2)}

Identify:
1. High-cost areas
2. Potential inefficiencies
3. Benchmark comparisons
4. Quick wins for cost reduction`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      savings: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async generateCostRecommendations(
    spending: any,
    savings: any,
    context: WorkflowContext
  ): Promise<any> {
    const prompt = `Based on spending analysis and savings opportunities, provide actionable recommendations:

Spending: ${JSON.stringify(spending.spending, null, 2)}
Opportunities: ${savings.savings}

Generate prioritized recommendations with:
1. Action items
2. Expected savings
3. Implementation difficulty
4. Timeline`

    const response = await this.model.invoke([new HumanMessage(prompt)])

    return {
      recommendations: response.content,
      tokensUsed: this.estimateTokens(prompt + response.content)
    }
  }

  private async saveChatMessage(
    sessionId: string,
    tenantId: string,
    userId: string,
    message: string,
    response: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO ai_chat_history (session_id, tenant_id, user_id, user_message, ai_response)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, tenantId, userId, message, response]
    )
  }

  private async logWorkflowExecution(
    context: WorkflowContext,
    steps: WorkflowStep[],
    totalTokens: number,
    status: string,
    error?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO langchain_workflow_executions (
        tenant_id, user_id, workflow_type, session_id,
        steps, total_tokens, status, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        context.tenantId,
        context.userId,
        context.workflowType,
        context.sessionId,
        JSON.stringify(steps),
        totalTokens,
        status,
        error || null
      ]
    )
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4)
  }

  /**
   * Clear session memory
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys())
  }
}

export const langchainOrchestratorService = new LangChainOrchestratorService()
export default langchainOrchestratorService
