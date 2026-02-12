#!/usr/bin/env ts-node
/**
 * COMPLETE SYSTEM CONNECTION ORCHESTRATOR
 *
 * Connects 100% of all endpoints, APIs, AI services, databases, servers, and emulators
 *
 * Usage: ts-node connect-all-systems.ts
 */

import { spawn, execFile, ChildProcess } from 'child_process'
import { promises as fs, createWriteStream } from 'fs'
import path from 'path'

interface ServiceConnection {
  name: string
  type: 'database' | 'api' | 'ai' | 'external' | 'emulator' | 'server'
  command?: string
  port?: number
  healthCheck?: string
  process?: ChildProcess
  status: 'pending' | 'starting' | 'running' | 'failed'
  logFile?: string
}

const SERVICES: ServiceConnection[] = [
  // ============================================================================
  // DATABASES
  // ============================================================================
  {
    name: 'PostgreSQL Primary',
    type: 'database',
    port: 5432,
    healthCheck: 'psql -U postgres -c "SELECT 1"',
    status: 'pending'
  },
  {
    name: 'Redis Cache',
    type: 'database',
    port: 6379,
    healthCheck: 'redis-cli ping',
    status: 'pending'
  },

  // ============================================================================
  // BACKEND API SERVERS
  // ============================================================================
  {
    name: 'Fleet API Server (Node)',
    type: 'server',
    command: 'cd api && npm run dev:full',
    port: 3000,
    healthCheck: 'http://localhost:3000/api/health',
    logFile: '/tmp/fleet-api-server.log',
    status: 'pending'
  },
  {
    name: 'WebSocket Server',
    type: 'server',
    command: 'cd services/websocket && npm run dev',
    port: 8080,
    healthCheck: 'http://localhost:8080/health',
    logFile: '/tmp/websocket-server.log',
    status: 'pending'
  },
  {
    name: 'Worker Queue System',
    type: 'server',
    command: 'cd services/workers && npm run dev',
    port: 3001,
    healthCheck: 'http://localhost:3001/health',
    logFile: '/tmp/worker-queue.log',
    status: 'pending'
  },

  // ============================================================================
  // FRONTEND SERVERS
  // ============================================================================
  {
    name: 'Vite Frontend Server',
    type: 'server',
    command: 'npm run dev',
    port: 5173,
    healthCheck: 'http://localhost:5173',
    logFile: '/tmp/vite-frontend.log',
    status: 'pending'
  },

  // ============================================================================
  // AI SERVICES
  // ============================================================================
  {
    name: 'OpenAI GPT-4',
    type: 'ai',
    healthCheck: 'API_KEY_CHECK:OPENAI_API_KEY',
    status: 'pending'
  },
  {
    name: 'Anthropic Claude',
    type: 'ai',
    healthCheck: 'API_KEY_CHECK:CLAUDE_API_KEY',
    status: 'pending'
  },
  {
    name: 'Google Gemini',
    type: 'ai',
    healthCheck: 'API_KEY_CHECK:GEMINI_API_KEY',
    status: 'pending'
  },
  {
    name: 'Grok (X.AI)',
    type: 'ai',
    healthCheck: 'API_KEY_CHECK:GROK_API_KEY',
    status: 'pending'
  },

  // ============================================================================
  // EXTERNAL APIS
  // ============================================================================
  {
    name: 'Google Maps API',
    type: 'external',
    healthCheck: 'API_KEY_CHECK:GOOGLE_MAPS_API_KEY',
    status: 'pending'
  },
  {
    name: 'Azure Active Directory',
    type: 'external',
    healthCheck: 'API_KEY_CHECK:AZURE_AD_CLIENT_ID',
    status: 'pending'
  },
  {
    name: 'Microsoft Graph API',
    type: 'external',
    healthCheck: 'API_KEY_CHECK:MICROSOFT_GRAPH_CLIENT_ID',
    status: 'pending'
  },

  // ============================================================================
  // EMULATORS & TESTING
  // ============================================================================
  {
    name: 'OBD2 Emulator',
    type: 'emulator',
    command: 'ts-node start-fleet-emulator.ts',
    port: 3002,
    healthCheck: 'http://localhost:3002/health',
    logFile: '/tmp/obd2-emulator.log',
    status: 'pending'
  }
]

class SystemOrchestrator {
  private services: ServiceConnection[]
  private startTime: number

  constructor(services: ServiceConnection[]) {
    this.services = services
    this.startTime = Date.now()
  }

  async connectAll() {
    console.log('🚀 FLEET MANAGEMENT SYSTEM - COMPLETE CONNECTION ORCHESTRATOR')
    console.log('═'.repeat(80))
    console.log(`Starting at: ${new Date().toLocaleString()}`)
    console.log(`Total services to connect: ${this.services.length}`)
    console.log('═'.repeat(80))
    console.log('')

    // Phase 1: Check environment variables and API keys
    await this.checkEnvironment()

    // Phase 2: Start database connections
    await this.connectDatabases()

    // Phase 3: Start backend servers
    await this.startBackendServers()

    // Phase 4: Start frontend server
    await this.startFrontendServer()

    // Phase 5: Verify AI service connections
    await this.verifyAIServices()

    // Phase 6: Verify external API connections
    await this.verifyExternalAPIs()

    // Phase 7: Start emulators
    await this.startEmulators()

    // Final report
    await this.generateReport()
  }

  private async checkEnvironment() {
    console.log('\n📋 Phase 1: Environment Check')
    console.log('─'.repeat(80))

    const envFile = path.join(process.cwd(), '.env')
    try {
      const envContent = await fs.readFile(envFile, 'utf-8')
      const apiKeys = envContent.match(/.*API_KEY=.*/g) || []
      console.log(`✅ Found .env file with ${apiKeys.length} API keys configured`)
    } catch {
      console.log('⚠️  No .env file found - using environment variables')
    }
  }

  private async connectDatabases() {
    console.log('\n🗄️  Phase 2: Database Connections')
    console.log('─'.repeat(80))

    const dbServices = this.services.filter(s => s.type === 'database')
    for (const service of dbServices) {
      try {
        service.status = 'starting'
        console.log(`Connecting to ${service.name}...`)

        if (service.healthCheck) {
          const healthy = await this.runHealthCheck(service.healthCheck)
          if (healthy) {
            service.status = 'running'
            console.log(`✅ ${service.name} connected on port ${service.port}`)
          } else {
            service.status = 'failed'
            console.log(`❌ ${service.name} connection failed`)
          }
        }
      } catch (error) {
        service.status = 'failed'
        console.log(`❌ ${service.name} error: ${error}`)
      }
    }
  }

  private async startBackendServers() {
    console.log('\n🔧 Phase 3: Backend API Servers')
    console.log('─'.repeat(80))

    const serverServices = this.services.filter(s => s.type === 'server' && s.name.includes('API'))
    for (const service of serverServices) {
      if (service.command) {
        try {
          service.status = 'starting'
          console.log(`Starting ${service.name}...`)
          service.process = await this.startProcess(service.command, service.logFile!)

          // Wait 5 seconds for server to start
          await new Promise(resolve => setTimeout(resolve, 5000))

          if (service.healthCheck && service.healthCheck.startsWith('http')) {
            const healthy = await this.runHttpHealthCheck(service.healthCheck)
            if (healthy) {
              service.status = 'running'
              console.log(`✅ ${service.name} running on port ${service.port}`)
              console.log(`   Logs: ${service.logFile}`)
            } else {
              service.status = 'failed'
              console.log(`❌ ${service.name} health check failed`)
            }
          } else {
            service.status = 'running'
            console.log(`✅ ${service.name} started (no health check)`)
          }
        } catch (error) {
          service.status = 'failed'
          console.log(`❌ ${service.name} error: ${error}`)
        }
      }
    }
  }

  private async startFrontendServer() {
    console.log('\n🎨 Phase 4: Frontend Server')
    console.log('─'.repeat(80))

    const frontendService = this.services.find(s => s.name.includes('Frontend'))
    if (frontendService && frontendService.command) {
      try {
        frontendService.status = 'starting'
        console.log(`Starting ${frontendService.name}...`)
        frontendService.process = await this.startProcess(frontendService.command, frontendService.logFile!)

        // Wait 10 seconds for Vite to start
        await new Promise(resolve => setTimeout(resolve, 10000))

        if (frontendService.healthCheck) {
          const healthy = await this.runHttpHealthCheck(frontendService.healthCheck)
          if (healthy) {
            frontendService.status = 'running'
            console.log(`✅ ${frontendService.name} running on port ${frontendService.port}`)
            console.log(`   URL: ${frontendService.healthCheck}`)
            console.log(`   Logs: ${frontendService.logFile}`)
          } else {
            frontendService.status = 'failed'
            console.log(`❌ ${frontendService.name} health check failed`)
          }
        }
      } catch (error) {
        frontendService.status = 'failed'
        console.log(`❌ ${frontendService.name} error: ${error}`)
      }
    }
  }

  private async verifyAIServices() {
    console.log('\n🤖 Phase 5: AI Service Connections')
    console.log('─'.repeat(80))

    const aiServices = this.services.filter(s => s.type === 'ai')
    for (const service of aiServices) {
      if (service.healthCheck?.startsWith('API_KEY_CHECK:')) {
        const envVar = service.healthCheck.split(':')[1]
        const apiKey = process.env[envVar]

        if (apiKey && apiKey.length > 10) {
          service.status = 'running'
          console.log(`✅ ${service.name} - API key configured (${envVar})`)
          console.log(`   Key: ${apiKey.substring(0, 20)}...`)
        } else {
          service.status = 'failed'
          console.log(`❌ ${service.name} - Missing API key (${envVar})`)
        }
      }
    }
  }

  private async verifyExternalAPIs() {
    console.log('\n🌐 Phase 6: External API Connections')
    console.log('─'.repeat(80))

    const externalServices = this.services.filter(s => s.type === 'external')
    for (const service of externalServices) {
      if (service.healthCheck?.startsWith('API_KEY_CHECK:')) {
        const envVar = service.healthCheck.split(':')[1]
        const apiKey = process.env[envVar]

        if (apiKey && apiKey.length > 10) {
          service.status = 'running'
          console.log(`✅ ${service.name} - API configured (${envVar})`)
        } else {
          service.status = 'failed'
          console.log(`❌ ${service.name} - Missing configuration (${envVar})`)
        }
      }
    }
  }

  private async startEmulators() {
    console.log('\n🎮 Phase 7: Emulators & Testing Services')
    console.log('─'.repeat(80))

    const emulatorServices = this.services.filter(s => s.type === 'emulator')
    for (const service of emulatorServices) {
      if (service.command) {
        try {
          service.status = 'starting'
          console.log(`Starting ${service.name}...`)
          service.process = await this.startProcess(service.command, service.logFile!)

          // Wait 3 seconds for emulator to start
          await new Promise(resolve => setTimeout(resolve, 3000))

          service.status = 'running'
          console.log(`✅ ${service.name} running on port ${service.port}`)
          console.log(`   Logs: ${service.logFile}`)
        } catch (error) {
          service.status = 'failed'
          console.log(`❌ ${service.name} error: ${error}`)
        }
      }
    }
  }

  private async generateReport() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2)

    console.log('\n')
    console.log('═'.repeat(80))
    console.log('📊 CONNECTION STATUS REPORT')
    console.log('═'.repeat(80))
    console.log('')

    const byType: Record<string, ServiceConnection[]> = {}
    this.services.forEach(s => {
      if (!byType[s.type]) byType[s.type] = []
      byType[s.type].push(s)
    })

    Object.entries(byType).forEach(([type, services]) => {
      const running = services.filter(s => s.status === 'running').length
      const total = services.length
      const percentage = ((running / total) * 100).toFixed(0)

      console.log(`${type.toUpperCase()}: ${running}/${total} connected (${percentage}%)`)
      services.forEach(s => {
        const icon = s.status === 'running' ? '✅' : s.status === 'failed' ? '❌' : '⏳'
        console.log(`  ${icon} ${s.name}`)
        if (s.port) console.log(`     Port: ${s.port}`)
        if (s.logFile) console.log(`     Logs: ${s.logFile}`)
      })
      console.log('')
    })

    const totalRunning = this.services.filter(s => s.status === 'running').length
    const totalServices = this.services.length
    const overallPercentage = ((totalRunning / totalServices) * 100).toFixed(1)

    console.log('─'.repeat(80))
    console.log(`OVERALL STATUS: ${totalRunning}/${totalServices} services connected (${overallPercentage}%)`)
    console.log(`Time elapsed: ${elapsed}s`)
    console.log('═'.repeat(80))
    console.log('')

    if (overallPercentage === '100.0') {
      console.log('🎉 SUCCESS! All systems connected and operational!')
    } else {
      console.log('⚠️  Some services failed to connect. Review logs above.')
    }

    // Write report to file
    const report = {
      timestamp: new Date().toISOString(),
      elapsed: parseFloat(elapsed),
      totalServices,
      connected: totalRunning,
      percentage: parseFloat(overallPercentage),
      services: this.services.map(s => ({
        name: s.name,
        type: s.type,
        status: s.status,
        port: s.port,
        logFile: s.logFile
      }))
    }

    await fs.writeFile(
      '/tmp/fleet-connection-report.json',
      JSON.stringify(report, null, 2)
    )
    console.log('📄 Full report saved to: /tmp/fleet-connection-report.json')
    console.log('')
  }

  private async startProcess(command: string, logFile: string): Promise<ChildProcess> {
    return new Promise((resolve, reject) => {
      // Use /bin/sh -c to handle commands with shell syntax (cd, &&, pipes)
      const proc = spawn('/bin/sh', ['-c', command], {
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      })

      const logStream = createWriteStream(logFile, { flags: 'a' })
      proc.stdout?.pipe(logStream)
      proc.stderr?.pipe(logStream)

      proc.on('error', reject)
      setTimeout(() => resolve(proc), 1000)
    })
  }

  private async runHealthCheck(command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const proc = execFile('/bin/sh', ['-c', command])
      proc.on('close', (code) => resolve(code === 0))
      setTimeout(() => {
        proc.kill()
        resolve(false)
      }, 5000)
    })
  }

  private async runHttpHealthCheck(url: string): Promise<boolean> {
    try {
      const response = await fetch(url)
      return response.ok
    } catch {
      return false
    }
  }
}

// Run the orchestrator
const orchestrator = new SystemOrchestrator(SERVICES)
orchestrator.connectAll().catch(console.error)
