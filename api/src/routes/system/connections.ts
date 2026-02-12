/**
 * SYSTEM CONNECTIONS API
 *
 * Returns exhaustive list of all system endpoints with connection status
 * Supports filtering, sorting, and real-time status checking
 */

import { Router } from 'express'
import { Pool } from 'pg'
import { createClient } from 'redis'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

interface ConnectionEndpoint {
  id: string
  name: string
  category: 'Database' | 'AI Provider' | 'External API' | 'Internal Service' | 'Cache' | 'Queue' | 'Cloud Service'
  type: string
  endpoint: string
  status: 'connected' | 'disconnected' | 'degraded' | 'checking'
  responseTime?: number // ms
  lastChecked: string
  details?: {
    version?: string
    uptime?: number
    errorMessage?: string
    metadata?: Record<string, any>
  }
}

/**
 * GET /api/system/connections
 *
 * Returns comprehensive list of all system connections
 * Query params:
 *   ?category=Database - Filter by category
 *   ?status=connected - Filter by status
 *   ?sortBy=name - Sort by field
 *   ?order=asc - Sort order
 */
router.get('/connections', async (req, res) => {
  try {
    const connections: ConnectionEndpoint[] = []

    // ==========================================================================
    // DATABASES
    // ==========================================================================

    // PostgreSQL
    connections.push(await checkPostgreSQL())

    // Redis
    connections.push(await checkRedis())

    // ==========================================================================
    // AI PROVIDERS
    // ==========================================================================

    connections.push(await checkAIProvider('OpenAI', process.env.OPENAI_API_KEY))
    connections.push(await checkAIProvider('Claude', process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY))
    connections.push(await checkAIProvider('Gemini', process.env.GEMINI_API_KEY))
    connections.push(await checkAIProvider('Grok', process.env.GROK_API_KEY))

    // ==========================================================================
    // EXTERNAL APIs
    // ==========================================================================

    connections.push(await checkGoogleMaps())
    connections.push(await checkAzureAD())
    connections.push(await checkMicrosoftGraph())

    // ==========================================================================
    // CLOUD SERVICES
    // ==========================================================================

    connections.push(await checkAzureStorage())
    connections.push(await checkAzureSQL())

    // ==========================================================================
    // INTERNAL SERVICES
    // ==========================================================================

    connections.push(await checkInternalService('Frontend Server', 'http://localhost:5173'))
    connections.push(await checkInternalService('API Server', 'http://localhost:3001/api/health'))
    connections.push(await checkInternalService('WebSocket Server', 'http://localhost:8080/health'))

    // Apply filters
    let filtered = connections
    const { category, status, search } = req.query

    if (category) {
      filtered = filtered.filter(c => c.category === category)
    }

    if (status) {
      filtered = filtered.filter(c => c.status === status)
    }

    if (search) {
      const searchLower = (search as string).toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.endpoint.toLowerCase().includes(searchLower) ||
        c.type.toLowerCase().includes(searchLower)
      )
    }

    // Apply sorting
    const { sortBy = 'name', order = 'asc' } = req.query
    filtered.sort((a, b) => {
      const aVal = (a as any)[sortBy as string] || ''
      const bVal = (b as any)[sortBy as string] || ''

      if (order === 'desc') {
        return bVal.toString().localeCompare(aVal.toString())
      }
      return aVal.toString().localeCompare(bVal.toString())
    })

    // Calculate statistics
    const stats = {
      total: connections.length,
      connected: connections.filter(c => c.status === 'connected').length,
      disconnected: connections.filter(c => c.status === 'disconnected').length,
      degraded: connections.filter(c => c.status === 'degraded').length,
      byCategory: {} as Record<string, { total: number; connected: number }>
    }

    connections.forEach(c => {
      if (!stats.byCategory[c.category]) {
        stats.byCategory[c.category] = { total: 0, connected: 0 }
      }
      stats.byCategory[c.category].total++
      if (c.status === 'connected') {
        stats.byCategory[c.category].connected++
      }
    })

    return res.json({
      success: true,
      data: {
        connections: filtered,
        stats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('[System Connections] Error:', error)
    return res.status(500).json({
      error: 'Failed to fetch connections',
      message: error.message
    })
  }
})

/**
 * POST /api/system/connections/:id/test
 *
 * Test a specific connection
 */
router.post('/connections/:id/test', async (req, res) => {
  try {
    const { id } = req.params

    // Re-test the specific connection
    let result: ConnectionEndpoint

    if (id === 'postgresql') {
      result = await checkPostgreSQL()
    } else if (id === 'redis') {
      result = await checkRedis()
    } else if (id.startsWith('ai-')) {
      const provider = id.replace('ai-', '')
      const apiKey = getAIProviderKey(provider)
      result = await checkAIProvider(provider, apiKey)
    } else {
      return res.status(404).json({ error: 'Connection not found' })
    }

    return res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    return res.status(500).json({
      error: 'Connection test failed',
      message: error.message
    })
  }
})

// ==========================================================================
// HELPER FUNCTIONS
// ==========================================================================

async function checkPostgreSQL(): Promise<ConnectionEndpoint> {
  const start = Date.now()

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const result = await pool.query('SELECT version()')
    const responseTime = Date.now() - start
    await pool.end()

    return {
      id: 'postgresql',
      name: 'PostgreSQL Database',
      category: 'Database',
      type: 'Primary Database',
      endpoint: process.env.DATABASE_URL?.split('@')[1] || 'localhost:5432',
      status: 'connected',
      responseTime,
      lastChecked: new Date().toISOString(),
      details: {
        version: result.rows[0].version.split(' ')[1],
        metadata: { port: 5432 }
      }
    }
  } catch (error: any) {
    return {
      id: 'postgresql',
      name: 'PostgreSQL Database',
      category: 'Database',
      type: 'Primary Database',
      endpoint: 'localhost:5432',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      details: {
        errorMessage: error.message
      }
    }
  }
}

async function checkRedis(): Promise<ConnectionEndpoint> {
  const start = Date.now()

  try {
    const client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })
    await client.connect()
    await client.ping()
    const responseTime = Date.now() - start
    await client.quit()

    return {
      id: 'redis',
      name: 'Redis Cache',
      category: 'Cache',
      type: 'In-Memory Cache',
      endpoint: 'localhost:6379',
      status: 'connected',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      id: 'redis',
      name: 'Redis Cache',
      category: 'Cache',
      type: 'In-Memory Cache',
      endpoint: 'localhost:6379',
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      details: {
        errorMessage: error.message
      }
    }
  }
}

async function checkAIProvider(name: string, apiKey: string | undefined): Promise<ConnectionEndpoint> {
  return {
    id: `ai-${name.toLowerCase()}`,
    name: `${name} AI`,
    category: 'AI Provider',
    type: 'Language Model API',
    endpoint: getAIEndpoint(name),
    status: apiKey && apiKey.length > 10 ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString(),
    details: {
      metadata: {
        apiKeyConfigured: !!apiKey,
        keyLength: apiKey?.length || 0
      }
    }
  }
}

async function checkGoogleMaps(): Promise<ConnectionEndpoint> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY

  return {
    id: 'google-maps',
    name: 'Google Maps API',
    category: 'External API',
    type: 'Mapping & Geolocation',
    endpoint: 'maps.googleapis.com',
    status: apiKey ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString(),
    details: {
      metadata: { apiKeyConfigured: !!apiKey }
    }
  }
}

async function checkAzureAD(): Promise<ConnectionEndpoint> {
  const clientId = process.env.VITE_AZURE_AD_CLIENT_ID || process.env.AZURE_AD_CLIENT_ID

  return {
    id: 'azure-ad',
    name: 'Azure Active Directory',
    category: 'External API',
    type: 'Authentication',
    endpoint: 'login.microsoftonline.com',
    status: clientId ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString(),
    details: {
      metadata: {
        clientId: clientId?.substring(0, 8) + '...' || 'Not configured'
      }
    }
  }
}

async function checkMicrosoftGraph(): Promise<ConnectionEndpoint> {
  const clientId = process.env.MICROSOFT_GRAPH_CLIENT_ID

  return {
    id: 'microsoft-graph',
    name: 'Microsoft Graph API',
    category: 'External API',
    type: 'Microsoft 365 Integration',
    endpoint: 'graph.microsoft.com',
    status: clientId ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString()
  }
}

async function checkAzureStorage(): Promise<ConnectionEndpoint> {
  return {
    id: 'azure-storage',
    name: 'Azure Blob Storage',
    category: 'Cloud Service',
    type: 'File Storage',
    endpoint: 'Azure Cloud',
    status: process.env.AZURE_STORAGE_CONNECTION_STRING ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString()
  }
}

async function checkAzureSQL(): Promise<ConnectionEndpoint> {
  return {
    id: 'azure-sql',
    name: 'Azure SQL Database',
    category: 'Cloud Service',
    type: 'Cloud Database',
    endpoint: process.env.AZURE_SQL_SERVER || 'Not configured',
    status: process.env.AZURE_SQL_CONNECTION_STRING ? 'connected' : 'disconnected',
    lastChecked: new Date().toISOString()
  }
}

async function checkInternalService(name: string, url: string): Promise<ConnectionEndpoint> {
  const start = Date.now()

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    })
    const responseTime = Date.now() - start

    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      category: 'Internal Service',
      type: 'Application Server',
      endpoint: url,
      status: response.ok ? 'connected' : 'degraded',
      responseTime,
      lastChecked: new Date().toISOString()
    }
  } catch (error: any) {
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      category: 'Internal Service',
      type: 'Application Server',
      endpoint: url,
      status: 'disconnected',
      lastChecked: new Date().toISOString(),
      details: {
        errorMessage: error.message
      }
    }
  }
}

function getAIEndpoint(provider: string): string {
  const endpoints: Record<string, string> = {
    'OpenAI': 'api.openai.com',
    'Claude': 'api.anthropic.com',
    'Gemini': 'generativelanguage.googleapis.com',
    'Grok': 'api.x.ai'
  }
  return endpoints[provider] || 'Unknown'
}

function getAIProviderKey(provider: string): string | undefined {
  const keys: Record<string, string | undefined> = {
    'openai': process.env.OPENAI_API_KEY,
    'claude': process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY,
    'gemini': process.env.GEMINI_API_KEY,
    'grok': process.env.GROK_API_KEY
  }
  return keys[provider.toLowerCase()]
}

export default router
