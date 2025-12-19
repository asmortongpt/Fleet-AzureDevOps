#!/usr/bin/env tsx
/**
 * Fleet Autonomous Worker Agent
 *
 * This worker agent:
 * - Connects to orchestrator API
 * - Polls for available tasks
 * - Claims tasks and executes them using Claude Code
 * - Reports progress and evidence
 * - Manages Git branches and commits
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import axios, { AxiosInstance } from 'axios';
import simpleGit, { SimpleGit } from 'simple-git';
import WebSocket from 'ws';

// ============================================================================
// Configuration
// ============================================================================

const AGENT_NAME = process.env.AGENT_NAME || `agent-${Date.now()}`;
const AGENT_ROLE = process.env.AGENT_ROLE || 'general';
const ORCHESTRATOR_URL = process.env.ORCHESTRATOR_URL || 'http://172.191.51.49:3000';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const REPO_PATH = process.env.REPO_PATH || '/workspace/Fleet';
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '30000'); // 30 seconds
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '60000'); // 1 minute
const LLM_MODEL = process.env.LLM_MODEL || 'claude-sonnet-4';

// ============================================================================
// Types
// ============================================================================

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: number;
  dependencies?: string[];
  definition_of_done?: string;
  verification_plan?: string;
}

interface Agent {
  id: string;
  name: string;
  llm_model: string;
  role: string;
  active: boolean;
}

interface Assignment {
  id: string;
  task_id: string;
  agent_id: string;
  status: string;
  percent_complete: number;
  notes?: string;
}

interface Evidence {
  type: string;
  ref: string;
  summary: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Agent Worker Class
// ============================================================================

class AgentWorker {
  private api: AxiosInstance;
  private ws: WebSocket | null = null;
  private git: SimpleGit;
  private agentId: string | null = null;
  private currentAssignment: Assignment | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private shutdown = false;

  constructor() {
    this.api = axios.create({
      baseURL: ORCHESTRATOR_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.git = simpleGit(REPO_PATH);

    // Configure axios retry
    this.api.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status >= 500) {
          await this.sleep(5000);
          return this.api.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async start() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         Fleet Autonomous Worker Agent                        ║
║                                                              ║
║         Agent Name: ${AGENT_NAME.padEnd(42)}║
║         Role: ${AGENT_ROLE.padEnd(48)}║
║         LLM Model: ${LLM_MODEL.padEnd(45)}║
║         Orchestrator: ${ORCHESTRATOR_URL.padEnd(38)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    try {
      // Register agent
      await this.registerAgent();

      // Connect WebSocket
      await this.connectWebSocket();

      // Start heartbeat
      this.startHeartbeat();

      // Start polling for tasks
      this.startPolling();

      console.log('✅ Agent started successfully\n');
    } catch (error) {
      console.error('❌ Failed to start agent:', error);
      process.exit(1);
    }
  }

  private async registerAgent(): Promise<void> {
    try {
      console.log('🔄 Registering agent...');

      const response = await this.api.post('/api/agents', {
        name: AGENT_NAME,
        llm_model: LLM_MODEL,
        role: AGENT_ROLE,
        active: true,
        config: {
          hostname: os.hostname(),
          platform: os.platform(),
          arch: os.arch(),
          node_version: process.version,
          repo_path: REPO_PATH,
        },
      });

      this.agentId = response.data.agent.id;
      console.log(`✅ Agent registered: ${this.agentId}`);
    } catch (error: any) {
      if (error.response?.status === 409) {
        // Agent already exists, fetch it
        const response = await this.api.get('/api/agents');
        const agent = response.data.agents.find((a: Agent) => a.name === AGENT_NAME);
        if (agent) {
          this.agentId = agent.id;
          console.log(`✅ Agent already registered: ${this.agentId}`);
        } else {
          throw new Error('Agent exists but could not be found');
        }
      } else {
        throw error;
      }
    }
  }

  private async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = ORCHESTRATOR_URL.replace('http', 'ws') + '/ws';
      console.log(`🔄 Connecting to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      this.ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('⚠️  WebSocket disconnected, reconnecting in 5s...');
        if (!this.shutdown) {
          setTimeout(() => this.connectWebSocket(), 5000);
        }
      });
    });
  }

  private handleWebSocketMessage(message: any) {
    console.log('📨 WebSocket message:', message.type);

    switch (message.type) {
      case 'task_available':
        console.log('🆕 New task available');
        this.pollForTasks(); // Check immediately
        break;
      case 'assignment_cancelled':
        if (this.currentAssignment?.id === message.data.assignment_id) {
          console.log('🚫 Current assignment cancelled');
          this.currentAssignment = null;
        }
        break;
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  // ============================================================================
  // Heartbeat
  // ============================================================================

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.api.put(`/api/agents/${this.agentId}/heartbeat`, {
          status: this.currentAssignment ? 'busy' : 'idle',
          current_task: this.currentAssignment?.task_id,
        });
      } catch (error) {
        console.error('Failed to send heartbeat:', error);
      }
    }, HEARTBEAT_INTERVAL);
  }

  // ============================================================================
  // Task Polling & Assignment
  // ============================================================================

  private startPolling() {
    console.log(`🔄 Starting task polling (interval: ${POLL_INTERVAL}ms)\n`);
    this.pollForTasks(); // Poll immediately
    this.pollTimer = setInterval(() => this.pollForTasks(), POLL_INTERVAL);
  }

  private async pollForTasks() {
    if (this.currentAssignment) {
      return; // Already working on a task
    }

    try {
      // Get available tasks
      const response = await this.api.get('/api/tasks/ready/list');
      const tasks: Task[] = response.data.tasks;

      if (tasks.length === 0) {
        console.log('⏳ No tasks available');
        return;
      }

      // Find a task matching our role
      const task = tasks.find(t =>
        t.title.toLowerCase().includes(AGENT_ROLE.toLowerCase()) ||
        AGENT_ROLE === 'general'
      ) || tasks[0];

      console.log(`\n🎯 Found task: ${task.title}`);
      await this.claimTask(task);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to poll for tasks:', error.message);
      }
    }
  }

  private async claimTask(task: Task): Promise<void> {
    try {
      console.log('🔒 Claiming task...');

      const response = await this.api.post('/api/assignments', {
        task_id: task.id,
        agent_id: this.agentId,
        notes: `Started by ${AGENT_NAME}`,
      });

      this.currentAssignment = response.data.assignment;
      console.log(`✅ Task claimed: ${this.currentAssignment.id}\n`);

      // Execute the task
      await this.executeTask(task);
    } catch (error: any) {
      if (error.response?.status === 409) {
        console.log('⚠️  Task already claimed by another agent');
      } else {
        console.error('Failed to claim task:', error);
      }
    }
  }

  // ============================================================================
  // Task Execution
  // ============================================================================

  private async executeTask(task: Task): Promise<void> {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    EXECUTING TASK                            ║
╚══════════════════════════════════════════════════════════════╝

📋 ${task.title}
📝 ${task.description}

${task.definition_of_done ? '✅ Definition of Done:\n' + task.definition_of_done : ''}

${task.verification_plan ? '🧪 Verification Plan:\n' + task.verification_plan : ''}
    `);

    try {
      // Create branch
      const branchName = this.generateBranchName(task);
      await this.createBranch(branchName);

      // Update task with branch info
      await this.api.patch(`/api/tasks/${task.id}/git`, {
        branch_name: branchName,
      });

      // Report progress: started
      await this.updateProgress(10, 'Setting up workspace');

      // Execute using Claude Code autonomous-coder agent
      await this.executeWithClaudeCode(task, branchName);

      // Report progress: complete
      await this.updateProgress(100, 'Task completed');

      // Mark assignment as done
      await this.api.patch(`/api/assignments/${this.currentAssignment!.id}/progress`, {
        status: 'done',
        percent_complete: 100,
        notes: `Completed successfully by ${AGENT_NAME}`,
      });

      console.log('\n✅ Task completed successfully\n');
      this.currentAssignment = null;
    } catch (error) {
      console.error('\n❌ Task execution failed:', error);

      await this.api.patch(`/api/assignments/${this.currentAssignment!.id}/progress`, {
        status: 'failed',
        notes: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      this.currentAssignment = null;
    }
  }

  private async executeWithClaudeCode(task: Task, branchName: string): Promise<void> {
    console.log('\n🤖 Executing with Claude Code autonomous-coder agent...\n');

    // Create prompt for Claude Code
    const prompt = this.buildClaudePrompt(task);

    // Save prompt to file
    const promptFile = path.join(REPO_PATH, `.orchestrator/prompts/${task.id}.md`);
    await fs.promises.mkdir(path.dirname(promptFile), { recursive: true });
    await fs.promises.writeFile(promptFile, prompt);

    await this.updateProgress(20, 'Analyzing codebase');

    // Execute Claude Code in autonomous mode
    return new Promise((resolve, reject) => {
      const claude = spawn('claude', [
        'code',
        '--mode', 'autonomous-coder',
        '--prompt', promptFile,
        '--max-iterations', '10',
        '--auto-commit',
      ], {
        cwd: REPO_PATH,
        env: {
          ...process.env,
          ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        },
        stdio: 'pipe',
      });

      let output = '';
      let errorOutput = '';

      claude.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);

        // Update progress based on output
        this.parseProgressFromOutput(text);
      });

      claude.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text);
      });

      claude.on('close', async (code) => {
        if (code === 0) {
          // Submit evidence
          await this.submitEvidence(task, {
            type: 'execution_log',
            ref: promptFile,
            summary: 'Claude Code execution completed',
            metadata: { branch: branchName, output: output.slice(-1000) },
          });

          // Commit changes
          await this.commitChanges(task, branchName);

          // Push branch
          await this.pushBranch(branchName);

          resolve();
        } else {
          reject(new Error(`Claude Code exited with code ${code}\n${errorOutput}`));
        }
      });

      claude.on('error', (error) => {
        reject(error);
      });
    });
  }

  private buildClaudePrompt(task: Task): string {
    return `# Task Assignment

**Task ID:** ${task.id}
**Title:** ${task.title}
**Agent:** ${AGENT_NAME}
**Role:** ${AGENT_ROLE}

## Description

${task.description}

## Definition of Done

${task.definition_of_done || 'Complete the task as described'}

## Verification Plan

${task.verification_plan || 'Verify the implementation works as expected'}

## Instructions

1. Analyze the current codebase structure
2. Implement the required changes following best practices
3. Ensure all code follows TypeScript strict mode
4. Use parameterized queries for all database operations ($1, $2, $3)
5. Add appropriate error handling
6. Write or update tests as needed
7. Commit changes with descriptive messages
8. Verify the implementation meets the definition of done

## Security Requirements

- Parameterized queries only - never string concatenation in SQL
- No hardcoded secrets - use environment variables
- Validate ALL inputs
- Use security headers (Helmet)
- Follow least privilege principle

## Output

Please implement the task completely and report any issues encountered.
`;
  }

  private parseProgressFromOutput(output: string) {
    // Simple heuristic progress tracking
    if (output.includes('Analyzing')) {
      this.updateProgress(30, 'Analyzing code');
    } else if (output.includes('Implementing') || output.includes('Creating')) {
      this.updateProgress(50, 'Implementing changes');
    } else if (output.includes('Testing')) {
      this.updateProgress(70, 'Running tests');
    } else if (output.includes('Committing')) {
      this.updateProgress(90, 'Committing changes');
    }
  }

  // ============================================================================
  // Git Operations
  // ============================================================================

  private generateBranchName(task: Task): string {
    const sanitized = task.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    return `${AGENT_NAME}/${sanitized}`;
  }

  private async createBranch(branchName: string): Promise<void> {
    console.log(`🌿 Creating branch: ${branchName}`);

    await this.git.fetch('origin', 'main');
    await this.git.checkout('main');
    await this.git.pull('origin', 'main');
    await this.git.checkoutLocalBranch(branchName);

    console.log('✅ Branch created');
  }

  private async commitChanges(task: Task, branchName: string): Promise<void> {
    console.log('💾 Committing changes...');

    const status = await this.git.status();

    if (status.files.length === 0) {
      console.log('⚠️  No changes to commit');
      return;
    }

    await this.git.add('.');
    await this.git.commit(`${task.title}\n\n${task.description}\n\nTask ID: ${task.id}\nAgent: ${AGENT_NAME}`);

    console.log('✅ Changes committed');
  }

  private async pushBranch(branchName: string): Promise<void> {
    console.log(`⬆️  Pushing branch: ${branchName}`);

    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    await this.git.push('origin', branchName, ['--set-upstream']);

    console.log('✅ Branch pushed');
  }

  // ============================================================================
  // Progress & Evidence Reporting
  // ============================================================================

  private async updateProgress(percent: number, notes: string): Promise<void> {
    if (!this.currentAssignment) return;

    try {
      await this.api.patch(`/api/assignments/${this.currentAssignment.id}/progress`, {
        percent_complete: percent,
        notes,
      });

      console.log(`📊 Progress: ${percent}% - ${notes}`);
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  }

  private async submitEvidence(task: Task, evidence: Evidence): Promise<void> {
    try {
      await this.api.post('/api/evidence', {
        task_id: task.id,
        agent_id: this.agentId,
        ...evidence,
      });

      console.log(`📝 Evidence submitted: ${evidence.type}`);
    } catch (error) {
      console.error('Failed to submit evidence:', error);
    }
  }

  // ============================================================================
  // Utilities
  // ============================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('\n🛑 Shutting down agent...');
    this.shutdown = true;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.ws) {
      this.ws.close();
    }

    if (this.agentId) {
      try {
        await this.api.put(`/api/agents/${this.agentId}`, {
          active: false,
        });
      } catch (error) {
        console.error('Failed to deactivate agent:', error);
      }
    }

    console.log('✅ Agent stopped\n');
    process.exit(0);
  }
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const worker = new AgentWorker();

  // Graceful shutdown
  process.on('SIGTERM', () => worker.stop());
  process.on('SIGINT', () => worker.stop());

  await worker.start();
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
