/**
 * AI Agent Orchestration Manager
 * Coordinates 10 specialized Azure OpenAI agents for autonomous fleet management
 */

import { OpenAIClient, AzureKeyCredential } from '@azure/openai';
import { ServiceBusClient } from '@azure/service-bus';
import { CosmosClient } from '@azure/cosmos';
import { EventEmitter } from 'events';

// Agent Specializations
export enum AgentType {
  PREDICTIVE_MAINTENANCE = 'predictive-maintenance-agent',
  ROUTE_OPTIMIZATION = 'route-optimization-agent',
  COMPLIANCE_REPORTING = 'compliance-reporting-agent',
  VIDEO_ANALYSIS = 'video-analysis-agent',
  COST_OPTIMIZATION = 'cost-optimization-agent',
  SAFETY_MONITORING = 'safety-monitoring-agent',
  INVENTORY_MANAGEMENT = 'inventory-management-agent',
  DRIVER_COACHING = 'driver-coaching-agent',
  FUEL_EFFICIENCY = 'fuel-efficiency-agent',
  INTEGRATION_AGENT = 'integration-agent'
}

interface AgentTask {
  id: string;
  agentType: AgentType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

interface AgentConfig {
  type: AgentType;
  systemPrompt: string;
  maxConcurrency: number;
  retryAttempts: number;
}

export class AgentOrchestrator extends EventEmitter {
  private openaiClient: OpenAIClient;
  private serviceBusClient: ServiceBusClient;
  private cosmosClient: CosmosClient;
  private agents: Map<AgentType, AgentConfig>;
  private activeAgents: Map<AgentType, number> = new Map();

  constructor() {
    super();

    // Initialize Azure clients
    this.openaiClient = new OpenAIClient(
      process.env.AZURE_OPENAI_ENDPOINT!,
      new AzureKeyCredential(process.env.AZURE_OPENAI_KEY!)
    );

    this.serviceBusClient = new ServiceBusClient(
      process.env.SERVICEBUS_CONNECTION_STRING!
    );

    this.cosmosClient = new CosmosClient(
      process.env.COSMOS_CONNECTION_STRING!
    );

    // Configure specialized agents
    this.agents = this.initializeAgents();

    // Start all agent processors
    this.startAllAgents();
  }

  private initializeAgents(): Map<AgentType, AgentConfig> {
    return new Map([
      [AgentType.PREDICTIVE_MAINTENANCE, {
        type: AgentType.PREDICTIVE_MAINTENANCE,
        systemPrompt: `You are an expert predictive maintenance AI agent for fleet management.
Your role: Analyze vehicle telemetry data, maintenance history, and component wear patterns to predict failures before they occur.

Capabilities:
- Pattern recognition in sensor data (RPM, temperature, vibration, pressure)
- Component lifecycle analysis
- Maintenance schedule optimization
- Cost-benefit analysis of preventive vs reactive maintenance
- Real-time anomaly detection

Output format: JSON with predictions, confidence scores, recommended actions, and estimated costs.

Current task context will be provided. Analyze and respond with actionable maintenance recommendations.`,
        maxConcurrency: 5,
        retryAttempts: 3
      }],

      [AgentType.ROUTE_OPTIMIZATION, {
        type: AgentType.ROUTE_OPTIMIZATION,
        systemPrompt: `You are a route optimization AI agent for fleet logistics.
Your role: Optimize vehicle routes for efficiency, cost, and driver satisfaction.

Capabilities:
- Multi-vehicle route planning with time windows
- Traffic pattern analysis and prediction
- Fuel consumption optimization
- Driver break scheduling
- Dynamic rerouting based on real-time conditions
- EV charging station integration

Output format: JSON with optimized routes, estimated savings, fuel consumption, and driver assignments.`,
        maxConcurrency: 3,
        retryAttempts: 2
      }],

      [AgentType.COMPLIANCE_REPORTING, {
        type: AgentType.COMPLIANCE_REPORTING,
        systemPrompt: `You are a government compliance AI agent specializing in fleet regulations.
Your role: Generate FedRAMP, FMVRS, FAST, DOT reports and ensure regulatory compliance.

Capabilities:
- FMVRS (Federal Motor Vehicle Registration System) report generation
- FAST (Federal Automotive Statistical Tool) annual reporting
- DOT compliance tracking and documentation
- FedRAMP security controls verification
- Audit trail analysis
- State-specific regulation compliance

Output format: Structured compliance reports ready for submission, with flagged issues and remediation steps.`,
        maxConcurrency: 2,
        retryAttempts: 3
      }],

      [AgentType.VIDEO_ANALYSIS, {
        type: AgentType.VIDEO_ANALYSIS,
        systemPrompt: `You are a video telematics AI agent for safety analysis.
Your role: Analyze dashcam footage for safety events, driver behavior, and risk assessment.

Capabilities:
- Event detection (harsh braking, collisions, near-misses, distracted driving)
- Driver behavior scoring
- Road condition assessment
- Accident reconstruction analysis
- Safety coaching recommendations
- Pattern recognition across fleet

Output format: JSON with detected events, severity classification, timestamps, coaching recommendations, and risk scores.`,
        maxConcurrency: 4,
        retryAttempts: 2
      }],

      [AgentType.COST_OPTIMIZATION, {
        type: AgentType.COST_OPTIMIZATION,
        systemPrompt: `You are a fleet cost optimization AI agent.
Your role: Identify cost-saving opportunities across fuel, maintenance, insurance, and operations.

Capabilities:
- Total Cost of Ownership (TCO) analysis
- Fuel cost optimization strategies
- Maintenance cost trend analysis
- Insurance premium optimization recommendations
- Vehicle utilization analysis
- Right-sizing fleet recommendations
- EV vs ICE cost comparison

Output format: JSON with cost breakdown, savings opportunities, ROI calculations, and implementation plans.`,
        maxConcurrency: 2,
        retryAttempts: 2
      }],

      [AgentType.SAFETY_MONITORING, {
        type: AgentType.SAFETY_MONITORING,
        systemPrompt: `You are a fleet safety monitoring AI agent.
Your role: Monitor driver behavior, vehicle safety systems, and environmental risks 24/7.

Capabilities:
- Real-time risk assessment
- Driver safety score calculation
- Incident trend analysis
- Proactive alert generation
- Safety training recommendations
- Fleet-wide safety benchmark comparisons

Output format: JSON with safety alerts, risk scores, trend analysis, and recommended interventions.`,
        maxConcurrency: 6,
        retryAttempts: 3
      }],

      [AgentType.INVENTORY_MANAGEMENT, {
        type: AgentType.INVENTORY_MANAGEMENT,
        systemPrompt: `You are a fleet inventory and parts management AI agent.
Your role: Optimize spare parts inventory, predict demand, and manage vehicle lifecycle.

Capabilities:
- Parts demand forecasting
- Inventory optimization (min/max levels)
- Just-in-time ordering recommendations
- Vehicle depreciation tracking
- Replacement timing analysis
- Vendor performance evaluation

Output format: JSON with inventory recommendations, order suggestions, cost projections, and lifecycle insights.`,
        maxConcurrency: 2,
        retryAttempts: 2
      }],

      [AgentType.DRIVER_COACHING, {
        type: AgentType.DRIVER_COACHING,
        systemPrompt: `You are a driver coaching and development AI agent.
Your role: Provide personalized coaching to improve driver safety, efficiency, and satisfaction.

Capabilities:
- Driving behavior analysis (acceleration, braking, cornering, speeding)
- Personalized coaching recommendations
- Gamification and incentive suggestions
- Training module recommendations
- Progress tracking and benchmarking
- Eco-driving coaching

Output format: JSON with driver profiles, coaching plans, performance metrics, and engagement strategies.`,
        maxConcurrency: 3,
        retryAttempts: 2
      }],

      [AgentType.FUEL_EFFICIENCY, {
        type: AgentType.FUEL_EFFICIENCY,
        systemPrompt: `You are a fuel efficiency optimization AI agent.
Your role: Maximize fuel economy across the fleet through data-driven insights.

Capabilities:
- Fuel consumption pattern analysis
- Route efficiency optimization
- Idle time reduction strategies
- Vehicle-specific fuel efficiency recommendations
- Fuel card fraud detection
- Alternative fuel (EV, hybrid) ROI analysis

Output format: JSON with efficiency metrics, savings opportunities, driver-specific recommendations, and fleet-wide strategies.`,
        maxConcurrency: 3,
        retryAttempts: 2
      }],

      [AgentType.INTEGRATION_AGENT, {
        type: AgentType.INTEGRATION_AGENT,
        systemPrompt: `You are a third-party integration and data orchestration AI agent.
Your role: Manage integrations with fuel cards, telematics providers, insurance, and other systems.

Capabilities:
- API integration monitoring
- Data synchronization verification
- Webhook management
- Error resolution and retry logic
- Data transformation and mapping
- Integration health reporting

Output format: JSON with integration status, data sync reports, error resolutions, and optimization recommendations.`,
        maxConcurrency: 4,
        retryAttempts: 3
      }]
    ]);
  }

  private async startAllAgents() {
    console.log('🤖 Starting AI Agent Orchestrator with 10 specialized agents...');

    for (const [agentType, config] of this.agents.entries()) {
      this.activeAgents.set(agentType, 0);

      // Start message processor for each agent
      this.startAgentProcessor(agentType, config);

      console.log(`✅ ${agentType} started (max concurrency: ${config.maxConcurrency})`);
    }

    console.log('🚀 All 10 agents are now operational and processing tasks autonomously');
  }

  private async startAgentProcessor(agentType: AgentType, config: AgentConfig) {
    const receiver = this.serviceBusClient.createReceiver(agentType, {
      receiveMode: 'peekLock',
      maxAutoLockRenewalDurationInMs: 300000 // 5 minutes
    });

    const processMessage = async (message: any) => {
      const currentConcurrency = this.activeAgents.get(agentType) || 0;

      if (currentConcurrency >= config.maxConcurrency) {
        // Defer message if at max concurrency
        await receiver.defer Message(message);
        return;
      }

      this.activeAgents.set(agentType, currentConcurrency + 1);

      try {
        const task: AgentTask = message.body;
        console.log(`[${agentType}] Processing task: ${task.id}`);

        // Update task status
        await this.updateTaskStatus(task.id, 'processing');

        // Execute agent with GPT-4
        const result = await this.executeAgent(config, task);

        // Store result
        await this.storeResult(task.id, result);

        // Update task status
        await this.updateTaskStatus(task.id, 'completed', result);

        // Complete message
        await receiver.completeMessage(message);

        this.emit('task-completed', { agentType, task, result });

        console.log(`[${agentType}] ✅ Task completed: ${task.id}`);

      } catch (error) {
        console.error(`[${agentType}] ❌ Task failed:`, error);

        await this.updateTaskStatus(task.id, 'failed', undefined, error.message);

        // Dead letter if max retries exceeded
        if (message.deliveryCount >= config.retryAttempts) {
          await receiver.deadLetterMessage(message, {
            deadLetterReason: 'Max retries exceeded',
            deadLetterErrorDescription: error.message
          });
        } else {
          await receiver.abandonMessage(message);
        }

        this.emit('task-failed', { agentType, task: message.body, error });
      } finally {
        this.activeAgents.set(agentType, currentConcurrency - 1);
      }
    };

    // Subscribe to messages
    receiver.subscribe({
      processMessage,
      processError: async (error) => {
        console.error(`[${agentType}] Receiver error:`, error);
      }
    });
  }

  private async executeAgent(config: AgentConfig, task: AgentTask): Promise<any> {
    const messages = [
      { role: 'system', content: config.systemPrompt },
      { role: 'user', content: JSON.stringify(task.payload) }
    ];

    const response = await this.openaiClient.getChatCompletions(
      'gpt-4-agents',  // Deployment name
      messages,
      {
        temperature: 0.3,  // Lower temperature for more consistent results
        maxTokens: 2000,
        topP: 0.95,
        frequencyPenalty: 0,
        presencePenalty: 0
      }
    );

    const content = response.choices[0].message?.content;

    try {
      return JSON.parse(content || '{}');
    } catch {
      return { raw: content };
    }
  }

  private async updateTaskStatus(
    taskId: string,
    status: AgentTask['status'],
    result?: any,
    error?: string
  ) {
    const container = this.cosmosClient
      .database('agent-orchestration')
      .container('tasks');

    const update: Partial<AgentTask> = {
      status,
      ...(result && { result }),
      ...(error && { error }),
      ...(status === 'completed' && { completedAt: new Date() })
    };

    await container.item(taskId).patch([
      { op: 'set', path: '/status', value: status },
      ...(result ? [{ op: 'set', path: '/result', value: result }] : []),
      ...(error ? [{ op: 'set', path: '/error', value: error }] : [])
    ]);
  }

  private async storeResult(taskId: string, result: any) {
    const container = this.cosmosClient
      .database('agent-orchestration')
      .container('results');

    await container.items.create({
      taskId,
      result,
      timestamp: new Date(),
      ttl: 2592000  // 30 days retention
    });
  }

  // Public API for submitting tasks
  public async submitTask(
    agentType: AgentType,
    payload: any,
    priority: AgentTask['priority'] = 'medium'
  ): Promise<string> {
    const task: AgentTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agentType,
      priority,
      payload,
      status: 'pending',
      createdAt: new Date()
    };

    // Store task in Cosmos DB
    const container = this.cosmosClient
      .database('agent-orchestration')
      .container('tasks');

    await container.items.create(task);

    // Send to Service Bus queue
    const sender = this.serviceBusClient.createSender(agentType);
    await sender.sendMessages({
      body: task,
      sessionId: task.id,
      messageId: task.id
    });

    console.log(`📤 Task submitted to ${agentType}: ${task.id}`);

    return task.id;
  }

  public async getTaskResult(taskId: string): Promise<any> {
    const container = this.cosmosClient
      .database('agent-orchestration')
      .container('results');

    const { resource } = await container.item(taskId, taskId).read();
    return resource?.result;
  }

  public getAgentStatus(): Map<AgentType, number> {
    return new Map(this.activeAgents);
  }

  public async shutdown() {
    console.log('🛑 Shutting down agent orchestrator...');
    await this.serviceBusClient.close();
    console.log('✅ All agents stopped gracefully');
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
