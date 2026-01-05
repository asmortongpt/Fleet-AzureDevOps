/**
 * Multi-Agent Orchestrator - 30 Agent Distributed QA System
 *
 * Architecture:
 * - 30 autonomous agents running in parallel
 * - Load-balanced across Grok and OpenAI
 * - Real-time progress tracking and visualization
 * - Intelligent task distribution
 * - Fault tolerance and automatic recovery
 *
 * @version 2.0.0
 */

import { EventEmitter } from 'events'

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { Pool } from 'pg'
import Redis from 'redis'

import { AgentMonitoringServer } from './websocket-server'

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AgentConfig {
  id: string
  name: string
  type: 'code-reviewer' | 'test-generator' | 'security-scanner' | 'performance-analyzer' | 'ux-optimizer'
  provider: 'grok' | 'openai' | 'claude'
  model: string
  specialization: string[]
  maxConcurrentTasks: number
  priority: number
}

interface AgentTask {
  id: string
  type: 'review-file' | 'generate-tests' | 'scan-security' | 'analyze-performance' | 'optimize-ux'
  priority: 'critical' | 'high' | 'medium' | 'low'
  targetFile?: string
  targetComponent?: string
  context: Record<string, any>
  assignedAgent?: string
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed'
  progress: number
  result?: any
  startTime?: Date
  endTime?: Date
  retryCount: number
}

interface AgentStatus {
  agentId: string
  status: 'idle' | 'busy' | 'error' | 'offline'
  currentTask?: string
  tasksCompleted: number
  tasksFailed: number
  averageTaskTime: number
  lastHeartbeat: Date
  health: 'healthy' | 'degraded' | 'critical'
  cpuUsage: number
  memoryUsage: number
}

interface OrchestratorMetrics {
  totalAgents: number
  activeAgents: number
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageTaskTime: number
  throughput: number  // tasks per minute
  errorRate: number
  uptime: number
}

// ============================================================================
// Multi-Agent Orchestrator Class
// ============================================================================

export class MultiAgentOrchestrator extends EventEmitter {
  private agents: Map<string, AgentConfig> = new Map()
  private agentStatus: Map<string, AgentStatus> = new Map()
  private taskQueue: AgentTask[] = []
  private activeTasks: Map<string, AgentTask> = new Map()
  private completedTasks: AgentTask[] = []

  private db: Pool
  private redis: Redis.RedisClientType
  private openai: OpenAI
  private grokClient: OpenAI  // Grok uses OpenAI-compatible API
  private claude: Anthropic
  private wsServer: AgentMonitoringServer

  private isRunning = false
  private startTime?: Date
  private metrics: OrchestratorMetrics

  constructor(
    dbUrl: string,
    redisUrl: string,
    apiKeys: {
      openai: string
      grok: string
      anthropic: string
    },
    wsPort: number = 8080
  ) {
    super()

    // Initialize database
    this.db = new Pool({ connectionString: dbUrl })

    // Initialize Redis
    this.redis = Redis.createClient({ url: redisUrl })
    this.redis.connect()

    // Initialize AI providers
    this.openai = new OpenAI({ apiKey: apiKeys.openai })

    this.grokClient = new OpenAI({
      apiKey: apiKeys.grok,
      baseURL: 'https://api.x.ai/v1'
    })

    this.claude = new Anthropic({ apiKey: apiKeys.anthropic })

    // Initialize WebSocket server for real-time monitoring
    this.wsServer = new AgentMonitoringServer(wsPort)

    // Initialize metrics
    this.metrics = {
      totalAgents: 0,
      activeAgents: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskTime: 0,
      throughput: 0,
      errorRate: 0,
      uptime: 0
    }

    this.setupAgents()
  }

  // ==========================================================================
  // Agent Configuration
  // ==========================================================================

  private setupAgents() {
    console.log('🤖 Initializing 30-agent distributed system...')

    // 10 Code Review Agents (5 Grok + 5 OpenAI)
    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `code-reviewer-grok-${i}`,
        name: `Code Reviewer (Grok) #${i}`,
        type: 'code-reviewer',
        provider: 'grok',
        model: 'grok-beta',
        specialization: ['typescript', 'react', 'security', 'best-practices'],
        maxConcurrentTasks: 3,
        priority: 1
      })
    }

    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `code-reviewer-openai-${i}`,
        name: `Code Reviewer (GPT-4) #${i}`,
        type: 'code-reviewer',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        specialization: ['architecture', 'patterns', 'refactoring', 'testing'],
        maxConcurrentTasks: 3,
        priority: 1
      })
    }

    // 5 Test Generation Agents (OpenAI)
    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `test-generator-${i}`,
        name: `Test Generator #${i}`,
        type: 'test-generator',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        specialization: ['unit-tests', 'integration-tests', 'e2e-tests', 'test-coverage'],
        maxConcurrentTasks: 2,
        priority: 2
      })
    }

    // 5 Security Scanner Agents (Grok)
    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `security-scanner-${i}`,
        name: `Security Scanner #${i}`,
        type: 'security-scanner',
        provider: 'grok',
        model: 'grok-beta',
        specialization: ['owasp', 'sql-injection', 'xss', 'csrf', 'auth'],
        maxConcurrentTasks: 4,
        priority: 1
      })
    }

    // 5 Performance Analyzer Agents (OpenAI)
    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `performance-analyzer-${i}`,
        name: `Performance Analyzer #${i}`,
        type: 'performance-analyzer',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        specialization: ['optimization', 'caching', 'database', 'bundle-size'],
        maxConcurrentTasks: 2,
        priority: 3
      })
    }

    // 10 UX Optimizer Agents (5 Grok + 5 OpenAI)
    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `ux-optimizer-grok-${i}`,
        name: `UX Optimizer (Grok) #${i}`,
        type: 'ux-optimizer',
        provider: 'grok',
        model: 'grok-beta',
        specialization: ['accessibility', 'usability', 'responsive', 'wcag'],
        maxConcurrentTasks: 2,
        priority: 2
      })
    }

    for (let i = 1; i <= 5; i++) {
      this.registerAgent({
        id: `ux-optimizer-openai-${i}`,
        name: `UX Optimizer (GPT-4) #${i}`,
        type: 'ux-optimizer',
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        specialization: ['ui-design', 'user-flow', 'consistency', 'branding'],
        maxConcurrentTasks: 2,
        priority: 2
      })
    }

    this.metrics.totalAgents = this.agents.size
    console.log(`✅ Initialized ${this.agents.size} agents`)
    this.logAgentDistribution()
  }

  private registerAgent(config: AgentConfig) {
    this.agents.set(config.id, config)

    this.agentStatus.set(config.id, {
      agentId: config.id,
      status: 'idle',
      tasksCompleted: 0,
      tasksFailed: 0,
      averageTaskTime: 0,
      lastHeartbeat: new Date(),
      health: 'healthy',
      cpuUsage: 0,
      memoryUsage: 0
    })

    this.emit('agent:registered', config)
  }

  private logAgentDistribution() {
    const distribution = {
      total: this.agents.size,
      byProvider: {
        grok: Array.from(this.agents.values()).filter(a => a.provider === 'grok').length,
        openai: Array.from(this.agents.values()).filter(a => a.provider === 'openai').length,
        claude: Array.from(this.agents.values()).filter(a => a.provider === 'claude').length
      },
      byType: {
        'code-reviewer': Array.from(this.agents.values()).filter(a => a.type === 'code-reviewer').length,
        'test-generator': Array.from(this.agents.values()).filter(a => a.type === 'test-generator').length,
        'security-scanner': Array.from(this.agents.values()).filter(a => a.type === 'security-scanner').length,
        'performance-analyzer': Array.from(this.agents.values()).filter(a => a.type === 'performance-analyzer').length,
        'ux-optimizer': Array.from(this.agents.values()).filter(a => a.type === 'ux-optimizer').length
      }
    }

    console.log('\n📊 Agent Distribution:')
    console.log(`   Total: ${distribution.total}`)
    console.log(`   Providers: Grok (${distribution.byProvider.grok}), OpenAI (${distribution.byProvider.openai}), Claude (${distribution.byProvider.claude})`)
    console.log(`   Types:`)
    Object.entries(distribution.byType).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`)
    })
    console.log()
  }

  // ==========================================================================
  // Task Management
  // ==========================================================================

  async analyzeCodebase(repoPath: string) {
    console.log(`\n🔍 Starting codebase analysis: ${repoPath}`)

    this.isRunning = true
    this.startTime = new Date()

    // Start WebSocket server
    await this.wsServer.start()
    this.wsServer.broadcastAlert({
      level: 'info',
      message: `Starting codebase analysis: ${repoPath}`
    })

    // Step 1: Discover all files
    const files = await this.discoverFiles(repoPath)
    console.log(`📁 Found ${files.length} files to analyze`)
    this.wsServer.broadcastAlert({
      level: 'info',
      message: `Discovered ${files.length} files for analysis`
    })

    // Step 2: Create tasks for each file
    await this.createTasks(files)
    console.log(`📋 Created ${this.taskQueue.length} tasks`)
    this.wsServer.broadcastAlert({
      level: 'info',
      message: `Created ${this.taskQueue.length} tasks across ${this.agents.size} agents`
    })

    // Step 3: Start agent workers
    await this.startAgentWorkers()

    // Step 4: Monitor progress
    this.startProgressMonitoring()

    // Step 5: Wait for completion
    await this.waitForCompletion()

    // Step 6: Generate report
    const report = await this.generateReport()

    this.wsServer.broadcastAlert({
      level: 'success',
      message: 'Codebase analysis complete!'
    })

    this.wsServer.broadcastAnalysisComplete(report)

    this.isRunning = false

    return report
  }

  private async discoverFiles(repoPath: string): Promise<string[]> {
    const { default: fs } = await import('fs/promises')
    const { default: path } = await import('path')

    const files: string[] = []

    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        // Skip node_modules, .git, dist, build
        if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
          continue
        }

        if (entry.isDirectory()) {
          await walk(fullPath)
        } else if (entry.isFile()) {
          // Include TS, TSX, JS, JSX files
          if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(fullPath)
          }
        }
      }
    }

    await walk(repoPath)
    return files
  }

  private async createTasks(files: string[]) {
    for (const file of files) {
      // Create code review task
      this.taskQueue.push({
        id: `review-${file}-${Date.now()}`,
        type: 'review-file',
        priority: 'high',
        targetFile: file,
        context: { fullAnalysis: true },
        status: 'pending',
        progress: 0,
        retryCount: 0
      })

      // Create test generation task
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        this.taskQueue.push({
          id: `test-${file}-${Date.now()}`,
          type: 'generate-tests',
          priority: 'medium',
          targetFile: file,
          context: {},
          status: 'pending',
          progress: 0,
          retryCount: 0
        })
      }

      // Create security scan task
      this.taskQueue.push({
        id: `security-${file}-${Date.now()}`,
        type: 'scan-security',
        priority: 'critical',
        targetFile: file,
        context: {},
        status: 'pending',
        progress: 0,
        retryCount: 0
      })

      // Create performance analysis task
      this.taskQueue.push({
        id: `perf-${file}-${Date.now()}`,
        type: 'analyze-performance',
        priority: 'medium',
        targetFile: file,
        context: {},
        status: 'pending',
        progress: 0,
        retryCount: 0
      })

      // Create UX optimization task for UI files
      if (file.includes('component') || file.includes('page') || file.endsWith('.tsx')) {
        this.taskQueue.push({
          id: `ux-${file}-${Date.now()}`,
          type: 'optimize-ux',
          priority: 'high',
          targetFile: file,
          context: {},
          status: 'pending',
          progress: 0,
          retryCount: 0
        })
      }
    }

    this.metrics.totalTasks = this.taskQueue.length

    // Save tasks to database
    await this.saveTasksToDatabase()
  }

  private async startAgentWorkers() {
    console.log('\n🚀 Starting agent workers...')

    const workers: Promise<void>[] = []

    for (const [agentId, agent] of this.agents) {
      // Start worker for each agent
      workers.push(this.agentWorker(agentId, agent))
    }

    // Don't await - let workers run in background
    console.log(`✅ Started ${workers.length} agent workers`)
  }

  private async agentWorker(agentId: string, agent: AgentConfig) {
    const status = this.agentStatus.get(agentId)!

    while (this.isRunning || this.taskQueue.length > 0 || this.activeTasks.size > 0) {
      try {
        // Update heartbeat
        status.lastHeartbeat = new Date()

        // Check if agent can take more tasks
        const currentTaskCount = Array.from(this.activeTasks.values())
          .filter(t => t.assignedAgent === agentId).length

        if (currentTaskCount >= agent.maxConcurrentTasks) {
          // Agent at capacity, wait
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        // Get next task for this agent type
        const task = this.getNextTask(agent)

        if (!task) {
          // No tasks available, wait
          status.status = 'idle'
          this.wsServer.broadcastAgentStatus({
            agentId,
            status: 'idle',
            lastHeartbeat: status.lastHeartbeat
          })
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }

        // Assign task to agent
        task.assignedAgent = agentId
        task.status = 'assigned'
        task.startTime = new Date()
        this.activeTasks.set(task.id, task)

        status.status = 'busy'
        status.currentTask = task.id

        this.emit('task:assigned', { agentId, taskId: task.id })

        // Broadcast task assignment
        this.wsServer.broadcastTaskUpdate({
          taskId: task.id,
          type: task.type,
          priority: task.priority,
          status: 'active',
          assignedAgent: agentId,
          file: task.targetFile,
          startTime: task.startTime
        })

        this.wsServer.broadcastAgentStatus({
          agentId,
          status: 'busy',
          currentTask: task.id,
          taskType: task.type,
          lastHeartbeat: status.lastHeartbeat
        })

        // Execute task
        try {
          task.status = 'running'
          const result = await this.executeTask(agent, task)

          task.result = result
          task.status = 'completed'
          task.endTime = new Date()
          task.progress = 100

          status.tasksCompleted++
          this.metrics.completedTasks++

          // Calculate average task time
          const taskTime = task.endTime.getTime() - task.startTime!.getTime()
          status.averageTaskTime =
            (status.averageTaskTime * (status.tasksCompleted - 1) + taskTime) / status.tasksCompleted

          this.activeTasks.delete(task.id)
          this.completedTasks.push(task)

          this.emit('task:completed', { agentId, taskId: task.id, result })

          // Broadcast task completion
          this.wsServer.broadcastTaskUpdate({
            taskId: task.id,
            type: task.type,
            priority: task.priority,
            status: 'completed',
            assignedAgent: agentId,
            file: task.targetFile,
            startTime: task.startTime,
            completedTime: task.endTime
          })

          // Save result to database
          await this.saveTaskResult(task)

        } catch (error: any) {
          console.error(`❌ Task ${task.id} failed:`, error.message)

          task.status = 'failed'
          task.retryCount++

          if (task.retryCount < 3) {
            // Retry task
            task.status = 'pending'
            task.assignedAgent = undefined
            this.taskQueue.unshift(task)  // Add back to front
          } else {
            // Max retries reached
            task.endTime = new Date()
            status.tasksFailed++
            this.metrics.failedTasks++
            this.completedTasks.push(task)
          }

          this.activeTasks.delete(task.id)
          this.emit('task:failed', { agentId, taskId: task.id, error: error.message })
        }

        status.currentTask = undefined

      } catch (error: any) {
        console.error(`❌ Agent ${agentId} error:`, error.message)
        status.health = 'degraded'
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    status.status = 'offline'
    console.log(`👋 Agent ${agentId} shutting down`)
  }

  private getNextTask(agent: AgentConfig): AgentTask | undefined {
    // Find pending task matching agent type, sorted by priority
    const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 }

    const suitableTasks = this.taskQueue.filter(task => {
      if (task.status !== 'pending') return false

      // Match task type to agent type
      switch (agent.type) {
        case 'code-reviewer':
          return task.type === 'review-file'
        case 'test-generator':
          return task.type === 'generate-tests'
        case 'security-scanner':
          return task.type === 'scan-security'
        case 'performance-analyzer':
          return task.type === 'analyze-performance'
        case 'ux-optimizer':
          return task.type === 'optimize-ux'
        default:
          return false
      }
    })

    // Sort by priority
    suitableTasks.sort((a, b) => {
      return priorityMap[a.priority] - priorityMap[b.priority]
    })

    // Get and remove first task
    const task = suitableTasks[0]
    if (task) {
      const index = this.taskQueue.indexOf(task)
      this.taskQueue.splice(index, 1)
    }

    return task
  }

  private async executeTask(agent: AgentConfig, task: AgentTask): Promise<any> {
    const { default: fs } = await import('fs/promises')

    // Read file content
    const fileContent = await fs.readFile(task.targetFile!, 'utf-8')

    // Build prompt based on task type
    const prompt = this.buildPrompt(task, fileContent)

    // Call appropriate AI provider
    let response: string

    if (agent.provider === 'grok') {
      const completion = await this.grokClient.chat.completions.create({
        model: agent.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
      response = completion.choices[0].message.content || ''

    } else if (agent.provider === 'openai') {
      const completion = await this.openai.chat.completions.create({
        model: agent.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
      response = completion.choices[0].message.content || ''

    } else if (agent.provider === 'claude') {
      const message = await this.claude.messages.create({
        model: agent.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
      response = message.content[0].type === 'text' ? message.content[0].text : ''

    } else {
      throw new Error(`Unknown provider: ${agent.provider}`)
    }

    // Parse response
    return this.parseResponse(task.type, response)
  }

  private buildPrompt(task: AgentTask, fileContent: string): string {
    const fileName = task.targetFile?.split('/').pop() || 'file'

    switch (task.type) {
      case 'review-file':
        return `You are an expert code reviewer. Review this TypeScript/React code for:
- Code quality and best practices
- Potential bugs and issues
- Security vulnerabilities
- Performance optimizations
- Maintainability improvements

File: ${fileName}

\`\`\`typescript
${fileContent}
\`\`\`

Provide a detailed review in JSON format:
{
  "score": 0-100,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "type": "bug|security|performance|style|maintainability",
      "line": number,
      "message": "description",
      "suggestion": "how to fix"
    }
  ],
  "strengths": ["..."],
  "recommendations": ["..."]
}`

      case 'generate-tests':
        return `You are an expert test engineer. Generate comprehensive unit tests for this code using Jest and React Testing Library.

File: ${fileName}

\`\`\`typescript
${fileContent}
\`\`\`

Generate tests in JSON format:
{
  "testFile": "filename.test.tsx",
  "imports": ["..."],
  "tests": [
    {
      "describe": "Component/Function name",
      "tests": [
        {
          "it": "test description",
          "code": "test code"
        }
      ]
    }
  ],
  "coverage": {
    "lines": 0-100,
    "branches": 0-100,
    "functions": 0-100
  }
}`

      case 'scan-security':
        return `You are a security expert. Scan this code for security vulnerabilities:
- SQL injection
- XSS (Cross-Site Scripting)
- CSRF
- Authentication/Authorization issues
- Data exposure
- Insecure dependencies

File: ${fileName}

\`\`\`typescript
${fileContent}
\`\`\`

Report findings in JSON format:
{
  "riskScore": 0-100,
  "vulnerabilities": [
    {
      "severity": "critical|high|medium|low",
      "type": "sql-injection|xss|csrf|auth|exposure",
      "line": number,
      "description": "...",
      "remediation": "...",
      "cwe": "CWE-XXX"
    }
  ],
  "recommendations": ["..."]
}`

      case 'analyze-performance':
        return `You are a performance optimization expert. Analyze this code for:
- Rendering performance
- Memory usage
- Bundle size impact
- Unnecessary re-renders
- Expensive operations
- Caching opportunities

File: ${fileName}

\`\`\`typescript
${fileContent}
\`\`\`

Provide analysis in JSON format:
{
  "performanceScore": 0-100,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "type": "render|memory|bundle|computation",
      "line": number,
      "impact": "description",
      "optimization": "how to optimize"
    }
  ],
  "metrics": {
    "estimatedBundleSize": "XKB",
    "complexity": "O(n)",
    "reRenderRisk": "high|medium|low"
  }
}`

      case 'optimize-ux':
        return `You are a UX/UI expert. Review this component for:
- Accessibility (WCAG 2.1 AA)
- Usability
- Visual design
- Responsive design
- User experience
- Consistency

File: ${fileName}

\`\`\`typescript
${fileContent}
\`\`\`

Provide UX analysis in JSON format:
{
  "uxScore": 0-100,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "accessibility|usability|design|responsive",
      "line": number,
      "issue": "description",
      "improvement": "how to improve",
      "wcag": "criterion (if applicable)"
    }
  ],
  "strengths": ["..."],
  "recommendations": ["..."]
}`

      default:
        return `Analyze this code:\n\n${fileContent}`
    }
  }

  private parseResponse(taskType: string, response: string): any {
    try {
      // Extract JSON from response (may be wrapped in markdown code blocks)
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) ||
                       response.match(/\{[\s\S]*\}/)

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0]
        return JSON.parse(jsonStr)
      }

      // If no JSON found, return raw response
      return { rawResponse: response }

    } catch (error) {
      console.error('Failed to parse response:', error)
      return { rawResponse: response, parseError: true }
    }
  }

  // ==========================================================================
  // Progress Monitoring
  // ==========================================================================

  private startProgressMonitoring() {
    const interval = setInterval(() => {
      if (!this.isRunning && this.activeTasks.size === 0) {
        clearInterval(interval)
        return
      }

      this.updateMetrics()
      this.emitProgress()
      this.logProgress()

    }, 5000)  // Update every 5 seconds
  }

  private updateMetrics() {
    this.metrics.activeAgents = Array.from(this.agentStatus.values())
      .filter(s => s.status !== 'offline').length

    this.metrics.errorRate = this.metrics.totalTasks > 0
      ? (this.metrics.failedTasks / this.metrics.totalTasks) * 100
      : 0

    if (this.startTime) {
      const uptimeMs = Date.now() - this.startTime.getTime()
      this.metrics.uptime = Math.floor(uptimeMs / 1000)

      const uptimeMinutes = uptimeMs / 60000
      this.metrics.throughput = uptimeMinutes > 0
        ? this.metrics.completedTasks / uptimeMinutes
        : 0
    }

    // Calculate average task time from all agents
    const times = Array.from(this.agentStatus.values())
      .map(s => s.averageTaskTime)
      .filter(t => t > 0)

    this.metrics.averageTaskTime = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0
  }

  private emitProgress() {
    const progressData = {
      metrics: this.metrics,
      agents: Array.from(this.agentStatus.values()),
      activeTasks: Array.from(this.activeTasks.values()),
      queueLength: this.taskQueue.length
    }

    this.emit('progress', progressData)

    // Broadcast metrics via WebSocket
    this.wsServer.broadcastMetrics({
      totalAgents: this.metrics.totalAgents,
      activeAgents: this.metrics.activeAgents,
      totalTasks: this.metrics.totalTasks,
      completedTasks: this.metrics.completedTasks,
      failedTasks: this.metrics.failedTasks,
      queuedTasks: this.taskQueue.length,
      throughput: this.metrics.throughput,
      errorRate: this.metrics.errorRate,
      avgTaskTime: this.metrics.averageTaskTime
    })
  }

  private logProgress() {
    const pending = this.taskQueue.length
    const active = this.activeTasks.size
    const completed = this.metrics.completedTasks
    const failed = this.metrics.failedTasks
    const total = this.metrics.totalTasks

    const percentage = total > 0 ? ((completed + failed) / total * 100).toFixed(1) : '0.0'

    console.log(`\n📊 Progress: ${percentage}% | Pending: ${pending} | Active: ${active} | Completed: ${completed} | Failed: ${failed}`)
    console.log(`   Throughput: ${this.metrics.throughput.toFixed(2)} tasks/min | Avg Time: ${(this.metrics.averageTaskTime / 1000).toFixed(2)}s`)
    console.log(`   Active Agents: ${this.metrics.activeAgents}/${this.metrics.totalAgents}`)
  }

  private async waitForCompletion(): Promise<void> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.taskQueue.length === 0 && this.activeTasks.size === 0) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 1000)
    })
  }

  // ==========================================================================
  // Reporting
  // ==========================================================================

  private async generateReport() {
    console.log('\n📝 Generating comprehensive report...')

    const report = {
      summary: {
        totalFiles: new Set(this.completedTasks.map(t => t.targetFile)).size,
        totalTasks: this.metrics.totalTasks,
        completedTasks: this.metrics.completedTasks,
        failedTasks: this.metrics.failedTasks,
        duration: this.metrics.uptime,
        throughput: this.metrics.throughput,
        errorRate: this.metrics.errorRate
      },
      scores: {
        overall: 0,
        codeQuality: 0,
        security: 0,
        performance: 0,
        ux: 0,
        testCoverage: 0
      },
      issues: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      recommendations: [] as string[],
      agentPerformance: [] as any[]
    }

    // Aggregate results
    for (const task of this.completedTasks) {
      if (!task.result || task.result.parseError) continue

      // Code quality scores
      if (task.type === 'review-file' && task.result.score) {
        report.scores.codeQuality += task.result.score
      }

      // Security scores
      if (task.type === 'scan-security' && task.result.riskScore) {
        report.scores.security += (100 - task.result.riskScore)
      }

      // Performance scores
      if (task.type === 'analyze-performance' && task.result.performanceScore) {
        report.scores.performance += task.result.performanceScore
      }

      // UX scores
      if (task.type === 'optimize-ux' && task.result.uxScore) {
        report.scores.ux += task.result.uxScore
      }

      // Count issues
      const issues = task.result.issues || task.result.vulnerabilities || []
      for (const issue of issues) {
        if (issue.severity === 'critical') report.issues.critical++
        else if (issue.severity === 'high') report.issues.high++
        else if (issue.severity === 'medium') report.issues.medium++
        else if (issue.severity === 'low') report.issues.low++
      }

      // Collect recommendations
      if (task.result.recommendations) {
        report.recommendations.push(...task.result.recommendations)
      }
    }

    // Calculate average scores
    const taskCounts = {
      review: this.completedTasks.filter(t => t.type === 'review-file').length,
      security: this.completedTasks.filter(t => t.type === 'scan-security').length,
      performance: this.completedTasks.filter(t => t.type === 'analyze-performance').length,
      ux: this.completedTasks.filter(t => t.type === 'optimize-ux').length
    }

    report.scores.codeQuality = taskCounts.review > 0 ? report.scores.codeQuality / taskCounts.review : 0
    report.scores.security = taskCounts.security > 0 ? report.scores.security / taskCounts.security : 0
    report.scores.performance = taskCounts.performance > 0 ? report.scores.performance / taskCounts.performance : 0
    report.scores.ux = taskCounts.ux > 0 ? report.scores.ux / taskCounts.ux : 0

    // Overall score (weighted average)
    report.scores.overall = (
      report.scores.codeQuality * 0.3 +
      report.scores.security * 0.3 +
      report.scores.performance * 0.2 +
      report.scores.ux * 0.2
    )

    // Agent performance
    for (const [agentId, status] of this.agentStatus) {
      report.agentPerformance.push({
        agentId,
        tasksCompleted: status.tasksCompleted,
        tasksFailed: status.tasksFailed,
        averageTime: (status.averageTaskTime / 1000).toFixed(2) + 's',
        successRate: status.tasksCompleted > 0
          ? ((status.tasksCompleted / (status.tasksCompleted + status.tasksFailed)) * 100).toFixed(1) + '%'
          : '0%'
      })
    }

    // Save report to database
    await this.saveReport(report)

    return report
  }

  // ==========================================================================
  // Database Operations
  // ==========================================================================

  private async saveTasksToDatabase() {
    // Implementation would save to PostgreSQL
  }

  private async saveTaskResult(task: AgentTask) {
    // Implementation would save to PostgreSQL
  }

  private async saveReport(report: any) {
    // Implementation would save to PostgreSQL and generate HTML/PDF
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  async shutdown() {
    console.log('\n🛑 Shutting down orchestrator...')
    this.isRunning = false

    // Wait for active tasks to complete (with timeout)
    const timeout = 30000  // 30 seconds
    const start = Date.now()

    while (this.activeTasks.size > 0 && (Date.now() - start) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    await this.db.end()
    await this.redis.quit()

    console.log('✅ Orchestrator shut down gracefully')
  }
}
