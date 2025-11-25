/**
 * AI Agent Supervisor Service
 * Orchestrates multiple specialized AI agents for complex fleet management tasks
 * Uses supervisor pattern to delegate tasks and aggregate results
 */

import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import pool from '../config/database'
import { logger } from '../utils/logger'
import langchainOrchestratorService from './langchain-orchestrator.service'
import mcpServerRegistryService from './mcp-server-registry.service'

export interface AgentDefinition {
  id: string
  name: string
  role: string
  capabilities: string[]
  systemPrompt: string
  model: ChatOpenAI
}

export interface AgentTask {
  taskId: string
  query: string
  assignedAgent: string
  context: Record<string, any>
  priority: number
}

export interface AgentResult {
  agentId: string
  agentName: string
  success: boolean
  result: any
  confidence: number
  executionTimeMs: number
  tokensUsed: number
  error?: string
}

export interface SupervisorDecision {
  primaryAgent: string
  supportingAgents: string[]
  reasoning: string
  taskBreakdown: string[]
}

class AIAgentSupervisorService {
  private agents: Map<string, AgentDefinition> = new Map()
  private supervisorModel: ChatOpenAI

  constructor() {
    // Initialize supervisor model
    this.supervisorModel = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.3,
      maxTokens: 1500,
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    this.initializeAgents()
  }

  /**
   * Initialize specialized agents
   */
  private initializeAgents(): void {
    // Maintenance Agent
    this.agents.set('maintenance', {
      id: 'maintenance',
      name: 'Maintenance Agent',
      role: 'Vehicle Maintenance Specialist',
      capabilities: [
        'Analyze vehicle condition',
        'Schedule maintenance',
        'Recommend preventive maintenance',
        'Estimate repair costs',
        'Assign technicians'
      ],
      systemPrompt: `You are a vehicle maintenance specialist with deep expertise in fleet maintenance operations.
Your responsibilities include analyzing vehicle conditions, scheduling maintenance, and ensuring fleet reliability.
You have access to maintenance history, vehicle diagnostics, and technician availability.
Always prioritize safety and cost-effectiveness in your recommendations.`,
      model: new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 1500,
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    })

    // Safety Agent
    this.agents.set('safety', {
      id: 'safety',
      name: 'Safety Agent',
      role: 'Fleet Safety Officer',
      capabilities: [
        'Investigate incidents',
        'Analyze safety trends',
        'Recommend safety improvements',
        'Ensure compliance',
        'Driver safety training'
      ],
      systemPrompt: `You are a fleet safety officer responsible for maintaining the highest safety standards.
Your focus is on incident investigation, risk mitigation, and compliance with safety regulations.
You analyze incidents, identify root causes, and recommend preventive measures.
Safety is your top priority, followed by compliance and operational efficiency.`,
      model: new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.4,
        maxTokens: 1500,
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    })

    // Cost Agent
    this.agents.set('cost', {
      id: 'cost',
      name: 'Cost Analysis Agent',
      role: 'Financial Analyst',
      capabilities: [
        'Analyze spending patterns',
        'Identify cost savings',
        'Forecast expenses',
        'ROI analysis',
        'Budget optimization'
      ],
      systemPrompt: `You are a financial analyst specializing in fleet cost optimization.
Your expertise includes analyzing spending patterns, identifying savings opportunities, and forecasting expenses.
You provide data-driven recommendations to reduce costs while maintaining operational efficiency.
Focus on actionable insights with clear ROI projections.`,
      model: new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.4,
        maxTokens: 1500,
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    })

    // Route Agent
    this.agents.set('route', {
      id: 'route',
      name: 'Route Optimization Agent',
      role: 'Logistics Coordinator',
      capabilities: [
        'Optimize routes',
        'Analyze traffic patterns',
        'Reduce fuel consumption',
        'Improve delivery times',
        'Dispatch planning'
      ],
      systemPrompt: `You are a logistics coordinator focused on route optimization and efficient dispatch.
Your goal is to minimize travel time, reduce fuel consumption, and improve delivery performance.
You consider traffic, weather, vehicle capacity, and delivery windows in your recommendations.
Provide practical, implementable route optimizations.`,
      model: new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.5,
        maxTokens: 1500,
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    })

    // Document Agent
    this.agents.set('document', {
      id: 'document',
      name: 'Document Agent',
      role: 'Document Management Specialist',
      capabilities: [
        'Search documents',
        'Extract information',
        'Summarize documents',
        'Ensure compliance documentation',
        'Document retrieval'
      ],
      systemPrompt: `You are a document management specialist with expertise in fleet documentation.
Your role includes finding relevant documents, extracting key information, and ensuring compliance.
You can search through manuals, policies, regulations, and historical records.
Provide accurate, relevant information with proper citations.`,
      model: new ChatOpenAI({
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 1500,
        openAIApiKey: process.env.OPENAI_API_KEY
      })
    })

    logger.info('AI agents initialized', { agentCount: this.agents.size })
  }

  /**
   * Process query through supervisor and delegate to appropriate agents
   */
  async processQuery(
    query: string,
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<{
    decision: SupervisorDecision
    results: AgentResult[]
    synthesis: string
    totalTokens: number
    executionTimeMs: number
  }> {
    const startTime = Date.now()
    let totalTokens = 0

    try {
      // Step 1: Supervisor analyzes query and decides which agents to use
      const decision = await this.makeSupervisionDecision(query)
      totalTokens += this.estimateTokens(JSON.stringify(decision))

      logger.info('Supervisor decision made', {
        query,
        primaryAgent: decision.primaryAgent,
        supportingAgents: decision.supportingAgents
      })

      // Step 2: Execute tasks with assigned agents
      const results: AgentResult[] = []

      // Execute primary agent
      const primaryResult = await this.executeAgent(
        decision.primaryAgent,
        query,
        { tenantId, userId, sessionId },
        'primary'
      )
      results.push(primaryResult)
      totalTokens += primaryResult.tokensUsed

      // Execute supporting agents in parallel
      const supportingPromises = decision.supportingAgents.map(agentId =>
        this.executeAgent(agentId, query, { tenantId, userId, sessionId }, 'supporting')
      )

      const supportingResults = await Promise.all(supportingPromises)
      results.push(...supportingResults)
      totalTokens += supportingResults.reduce((sum, r) => sum + r.tokensUsed, 0)

      // Step 3: Synthesize results from all agents
      const synthesis = await this.synthesizeResults(query, decision, results)
      totalTokens += this.estimateTokens(synthesis)

      // Log execution
      await this.logSupervisorExecution(
        tenantId,
        userId,
        sessionId,
        query,
        decision,
        results,
        synthesis,
        totalTokens
      )

      return {
        decision,
        results,
        synthesis,
        totalTokens,
        executionTimeMs: Date.now() - startTime
      }
    } catch (error: any) {
      logger.error('Supervisor processing failed', { error: error.message, query })
      throw error
    }
  }

  /**
   * Supervisor decides which agents to use
   */
  private async makeSupervisionDecision(query: string): Promise<SupervisorDecision> {
    const agentDescriptions = Array.from(this.agents.values())
      .map(agent => '${agent.id}: ${agent.name} - ${agent.capabilities.join(', ')}')
      .join('\n')

    const prompt = `You are a supervisor AI managing a team of specialized fleet management agents.
Analyze the user query and decide which agents should handle it.

Available Agents:
${agentDescriptions}

User Query: "${query}"

Choose:
1. Primary Agent: The main agent to handle this query
2. Supporting Agents: Additional agents that can provide valuable input (0-2 agents)
3. Reasoning: Why these agents were chosen
4. Task Breakdown: Specific tasks for each agent

Respond in JSON format:
{
  "primaryAgent": "agent_id",
  "supportingAgents": ["agent_id1", "agent_id2"],
  "reasoning": "explanation",
  "taskBreakdown": ["task1", "task2", "task3"]
}`

    const response = await this.supervisorModel.invoke([
      new SystemMessage('You are an expert AI supervisor for fleet management operations.'),
      new HumanMessage(prompt)
    ])

    try {
      // Parse JSON response
      const content = response.content.toString()
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      logger.warn('Failed to parse supervisor decision JSON, using defaults')
    }

    // Fallback decision
    return {
      primaryAgent: this.inferPrimaryAgent(query),
      supportingAgents: [],
      reasoning: 'Default assignment based on query analysis',
      taskBreakdown: [query]
    }
  }

  /**
   * Infer primary agent from query keywords
   */
  private inferPrimaryAgent(query: string): string {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('maintenance') || lowerQuery.includes('repair')) {
      return 'maintenance'
    }
    if (lowerQuery.includes('incident') || lowerQuery.includes('safety') || lowerQuery.includes('accident')) {
      return 'safety'
    }
    if (lowerQuery.includes('cost') || lowerQuery.includes('expense') || lowerQuery.includes('budget')) {
      return 'cost'
    }
    if (lowerQuery.includes('route') || lowerQuery.includes('dispatch') || lowerQuery.includes('delivery')) {
      return 'route'
    }
    if (lowerQuery.includes('document') || lowerQuery.includes('manual') || lowerQuery.includes('policy')) {
      return 'document'
    }

    return 'maintenance' // Default
  }

  /**
   * Execute a specific agent
   */
  private async executeAgent(
    agentId: string,
    query: string,
    context: Record<string, any>,
    taskType: 'primary' | 'supporting'
  ): Promise<AgentResult> {
    const startTime = Date.now()

    try {
      const agent = this.agents.get(agentId)
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`)
      }

      // Construct agent-specific prompt
      const prompt = taskType === 'primary'
        ? `Primary Task: ${query}\n\nProvide a comprehensive response based on your expertise.`
        : `Supporting Analysis: ${query}\n\nProvide additional insights from your area of expertise.`

      // Execute agent
      const response = await agent.model.invoke([
        new SystemMessage(agent.systemPrompt),
        new HumanMessage(prompt)
      ])

      const result = response.content.toString()
      const tokensUsed = this.estimateTokens(prompt + result)

      return {
        agentId: agent.id,
        agentName: agent.name,
        success: true,
        result,
        confidence: 0.85, // Could be calculated based on response certainty
        executionTimeMs: Date.now() - startTime,
        tokensUsed
      }
    } catch (error: any) {
      logger.error('Agent execution failed', { agentId, error: error.message })

      return {
        agentId,
        agentName: this.agents.get(agentId)?.name || 'Unknown',
        success: false,
        result: null,
        confidence: 0,
        executionTimeMs: Date.now() - startTime,
        tokensUsed: 0,
        error: error.message
      }
    }
  }

  /**
   * Synthesize results from multiple agents
   */
  private async synthesizeResults(
    query: string,
    decision: SupervisorDecision,
    results: AgentResult[]
  ): Promise<string> {
    const successfulResults = results.filter(r => r.success)

    if (successfulResults.length === 0) {
      return 'Unable to process query - all agents failed to provide results.'
    }

    if (successfulResults.length === 1) {
      return successfulResults[0].result
    }

    // Synthesize multiple agent responses
    const resultsText = successfulResults
      .map(r => `${r.agentName}:\n${r.result}`)
      .join('\n\n---\n\n')

    const synthesisPrompt = `You are synthesizing insights from multiple specialized agents.

Original Query: "${query}"

Agent Responses:
${resultsText}

Provide a comprehensive, coherent response that:
1. Addresses the original query directly
2. Integrates insights from all agents
3. Highlights any conflicts or agreements
4. Provides actionable recommendations
5. Maintains professional tone

Keep the response concise but thorough.`

    const response = await this.supervisorModel.invoke([
      new SystemMessage('You are an expert at synthesizing information from multiple sources.'),
      new HumanMessage(synthesisPrompt)
    ])

    return response.content.toString()
  }

  /**
   * Get list of available agents
   */
  getAvailableAgents(): AgentDefinition[] {
    return Array.from(this.agents.values()).map(agent => ({
      ...agent,
      model: undefined as any // Don't expose model instance
    }))
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    const agent = this.agents.get(agentId)
    if (agent) {
      return {
        ...agent,
        model: undefined as any
      }
    }
    return undefined
  }

  /**
   * Execute workflow through appropriate agent
   */
  async executeWorkflow(
    workflowType: string,
    parameters: Record<string, any>,
    tenantId: string,
    userId: string,
    sessionId: string
  ): Promise<any> {
    const context = {
      tenantId,
      userId,
      sessionId,
      workflowType,
      parameters
    }

    switch (workflowType) {
      case 'maintenance-planning':
        return langchainOrchestratorService.executeMaintenancePlanningChain(context)
      case 'incident-investigation':
        return langchainOrchestratorService.executeIncidentInvestigationChain(context)
      case 'route-optimization':
        return langchainOrchestratorService.executeRouteOptimizationChain(context)
      case 'cost-optimization':
        return langchainOrchestratorService.executeCostOptimizationChain(context)
      default:
        throw new Error(`Unknown workflow type: ${workflowType}`)
    }
  }

  /**
   * Log supervisor execution
   */
  private async logSupervisorExecution(
    tenantId: string,
    userId: string,
    sessionId: string,
    query: string,
    decision: SupervisorDecision,
    results: AgentResult[],
    synthesis: string,
    totalTokens: number
  ): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO ai_supervisor_executions (
          tenant_id, user_id, session_id, query,
          primary_agent, supporting_agents, decision_reasoning,
          agent_results, synthesis, total_tokens
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId,
          userId,
          sessionId,
          query,
          decision.primaryAgent,
          JSON.stringify(decision.supportingAgents),
          decision.reasoning,
          JSON.stringify(results),
          synthesis,
          totalTokens
        ]
      )
    } catch (error: any) {
      logger.error('Failed to log supervisor execution', { error: error.message })
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }
}

export const aiAgentSupervisorService = new AIAgentSupervisorService()
export default aiAgentSupervisorService
