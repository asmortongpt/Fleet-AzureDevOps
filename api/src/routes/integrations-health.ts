/**
 * Integrations Health Check API Routes
 * Provides real-time connectivity status for all external integrations
 *
 * SECURITY:
 * - All routes require JWT authentication
 * - Admin-only access
 * - No secrets exposed in responses
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRBAC, Role } from '../middleware/rbac';
import { asyncHandler } from '../middleware/async-handler';
import logger from '../config/logger';
import { pool } from '../db/connection';
import { cache } from '../utils/cache';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireRBAC({ roles: [Role.ADMIN], permissions: [], enforceTenantIsolation: false }));

/**
 * Integration Health Status Interface
 */
interface IntegrationHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  configured: boolean;
  lastCheck: string;
  lastSuccess?: string;
  responseTime?: number;
  errorMessage?: string;
  technicalDetails?: string;
  requiredConfig: string[];
  optionalConfig: string[];
  capabilities?: string[];
}

/**
 * GET /api/integrations/health
 * Returns health status for all integrations
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Checking health of all integrations');

    const checks = await Promise.allSettled([
      checkGoogleMaps(),
      checkOpenAI(),
      checkAzureAD(),
      checkSmartCar(),
      checkRedis(),
      checkDatabase()
    ]);

    const results: IntegrationHealth[] = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        const names = ['Google Maps', 'OpenAI', 'Azure AD', 'SmartCar', 'Redis', 'Database'];
        return {
          name: names[index],
          status: 'unknown' as const,
          configured: false,
          lastCheck: new Date().toISOString(),
          errorMessage: 'Health check failed',
          technicalDetails: result.reason?.message,
          requiredConfig: [],
          optionalConfig: []
        };
      }
    });

    res.json({
      timestamp: new Date().toISOString(),
      integrations: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        down: results.filter(r => r.status === 'down').length,
        unknown: results.filter(r => r.status === 'unknown').length
      }
    });
  })
);

/**
 * GET /api/integrations/health/:integration
 * Returns detailed health status for a specific integration
 */
router.get('/health/:integration',
  asyncHandler(async (req: Request, res: Response) => {
    const { integration } = req.params;
    logger.info(`Checking health of ${integration}`);

    let result: IntegrationHealth;

    switch (integration.toLowerCase()) {
      case 'google-maps':
        result = await checkGoogleMaps();
        break;
      case 'openai':
        result = await checkOpenAI();
        break;
      case 'azure-ad':
        result = await checkAzureAD();
        break;
      case 'smartcar':
        result = await checkSmartCar();
        break;
      case 'redis':
        result = await checkRedis();
        break;
      case 'database':
        result = await checkDatabase();
        break;
      default:
        return res.status(404).json({ error: 'Integration not found' });
    }

    res.json(result);
  })
);

/**
 * GET /api/integrations/google-maps/status
 * Returns Google Maps integration status
 */
router.get('/google-maps/status',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Checking Google Maps status');

    const result = await checkGoogleMaps();

    res.json({
      integration: 'Google Maps',
      status: result.status,
      configured: result.configured,
      lastCheck: result.lastCheck,
      lastSuccess: result.lastSuccess,
      responseTime: result.responseTime,
      errorMessage: result.errorMessage,
      capabilities: result.capabilities,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * POST /api/integrations/health/:integration/test
 * Performs a live test of the integration with detailed results
 */
router.post('/health/:integration/test',
  asyncHandler(async (req: Request, res: Response) => {
    const { integration } = req.params;
    logger.info(`Testing integration: ${integration}`);

    let testResult: any;

    switch (integration.toLowerCase()) {
      case 'google-maps':
        testResult = await testGoogleMaps(req.body);
        break;
      case 'openai':
        testResult = await testOpenAI(req.body);
        break;
      case 'azure-ad':
        testResult = await testAzureAD(req.body);
        break;
      default:
        return res.status(404).json({ error: 'Integration test not available' });
    }

    res.json(testResult);
  })
);

/**
 * Google Maps Health Check
 */
async function checkGoogleMaps(): Promise<IntegrationHealth> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'Google Maps',
    status: 'unknown',
    configured: !!apiKey,
    lastCheck: new Date().toISOString(),
    requiredConfig: ['GOOGLE_MAPS_API_KEY'],
    optionalConfig: [],
    capabilities: ['Geocoding', 'Directions', 'Places', 'Maps JavaScript API']
  };

  if (!apiKey) {
    health.status = 'down';
    health.errorMessage = 'API key not configured';
    health.technicalDetails = 'Missing GOOGLE_MAPS_API_KEY environment variable';
    return health;
  }

  try {
    // Test geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: '1600 Amphitheatre Parkway, Mountain View, CA',
        key: apiKey
      },
      timeout: 5000
    });

    health.responseTime = Date.now() - startTime;

    if (response.data.status === 'OK') {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();
    } else if (response.data.status === 'REQUEST_DENIED') {
      health.status = 'down';
      health.errorMessage = 'API key invalid or restricted';
      health.technicalDetails = response.data.error_message || 'API request denied';
    } else {
      health.status = 'degraded';
      health.errorMessage = `API returned status: ${response.data.status}`;
      health.technicalDetails = response.data.error_message;
    }
  } catch (error: any) {
    health.status = 'down';
    health.errorMessage = 'Unable to connect to Google Maps API';
    health.technicalDetails = error.message;
  }

  return health;
}

/**
 * OpenAI Health Check
 */
async function checkOpenAI(): Promise<IntegrationHealth> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'OpenAI',
    status: 'unknown',
    configured: !!apiKey,
    lastCheck: new Date().toISOString(),
    requiredConfig: ['OPENAI_API_KEY'],
    optionalConfig: ['OPENAI_SERVICE_ACCOUNT'],
    capabilities: ['Text Generation', 'Embeddings', 'Image Generation']
  };

  if (!apiKey) {
    health.status = 'down';
    health.errorMessage = 'API key not configured';
    health.technicalDetails = 'Missing OPENAI_API_KEY environment variable';
    return health;
  }

  try {
    // Test models endpoint (lightweight check)
    const response = await axios.get('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 5000
    });

    health.responseTime = Date.now() - startTime;

    if (response.status === 200) {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();
    } else {
      health.status = 'degraded';
      health.errorMessage = `Unexpected status code: ${response.status}`;
    }
  } catch (error: any) {
    health.status = 'down';

    if (error.response?.status === 401) {
      health.errorMessage = 'API key invalid or expired';
      health.technicalDetails = 'Authentication failed - check API key';
    } else if (error.response?.status === 429) {
      health.status = 'degraded';
      health.errorMessage = 'Rate limit exceeded';
      health.technicalDetails = 'Too many requests - consider implementing rate limiting';
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      health.errorMessage = 'Unable to connect to OpenAI API';
      health.technicalDetails = 'Network connectivity issue or API endpoint unavailable';
    } else {
      health.errorMessage = 'OpenAI API check failed';
      health.technicalDetails = error.message;
    }
  }

  return health;
}

/**
 * Azure AD Health Check
 */
async function checkAzureAD(): Promise<IntegrationHealth> {
  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.VITE_AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID || process.env.VITE_AZURE_AD_TENANT_ID;
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'Azure AD',
    status: 'unknown',
    configured: !!(clientId && tenantId),
    lastCheck: new Date().toISOString(),
    requiredConfig: ['AZURE_AD_CLIENT_ID', 'AZURE_AD_TENANT_ID'],
    optionalConfig: ['AZURE_AD_REDIRECT_URI'],
    capabilities: ['Authentication', 'User Management', 'SSO']
  };

  if (!clientId || !tenantId) {
    health.status = 'down';
    health.errorMessage = 'Azure AD not fully configured';
    health.technicalDetails = 'Missing AZURE_AD_CLIENT_ID or AZURE_AD_TENANT_ID';
    return health;
  }

  try {
    // Check OpenID configuration endpoint
    const response = await axios.get(
      `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
      { timeout: 5000 }
    );

    health.responseTime = Date.now() - startTime;

    if (response.status === 200 && response.data.authorization_endpoint) {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();
    } else {
      health.status = 'degraded';
      health.errorMessage = 'OpenID configuration incomplete';
    }
  } catch (error: any) {
    health.status = 'down';

    if (error.response?.status === 400) {
      health.errorMessage = 'Invalid tenant ID';
      health.technicalDetails = 'The configured tenant ID does not exist';
    } else {
      health.errorMessage = 'Unable to connect to Azure AD';
      health.technicalDetails = error.message;
    }
  }

  return health;
}

/**
 * SmartCar Health Check
 */
async function checkSmartCar(): Promise<IntegrationHealth> {
  const clientId = process.env.SMARTCAR_CLIENT_ID;
  const clientSecret = process.env.SMARTCAR_CLIENT_SECRET;
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'SmartCar',
    status: 'unknown',
    configured: !!(clientId && clientSecret),
    lastCheck: new Date().toISOString(),
    requiredConfig: ['SMARTCAR_CLIENT_ID', 'SMARTCAR_CLIENT_SECRET'],
    optionalConfig: ['SMARTCAR_APPLICATION_MANAGEMENT_TOKEN'],
    capabilities: ['Vehicle Data', 'Telemetry', 'Remote Control']
  };

  if (!clientId || !clientSecret) {
    health.status = 'down';
    health.errorMessage = 'SmartCar credentials not configured';
    health.technicalDetails = 'Missing SMARTCAR_CLIENT_ID or SMARTCAR_CLIENT_SECRET';
    return health;
  }

  try {
    // Test compatibility endpoint (public endpoint)
    const response = await axios.get('https://api.smartcar.com/v2.0/compatibility', {
      params: {
        vin: '1HGBH41JXMN109186', // Test VIN
        scope: 'read_vehicle_info'
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      timeout: 5000
    });

    health.responseTime = Date.now() - startTime;

    if (response.status === 200) {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();
    } else {
      health.status = 'degraded';
      health.errorMessage = `Unexpected response: ${response.status}`;
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      health.status = 'down';
      health.errorMessage = 'Invalid SmartCar credentials';
      health.technicalDetails = 'Authentication failed - check client ID and secret';
    } else if (error.response?.status === 404) {
      // This might be expected if endpoint structure changed
      health.status = 'degraded';
      health.errorMessage = 'API endpoint structure may have changed';
      health.technicalDetails = 'Consider updating integration code';
    } else {
      health.status = 'down';
      health.errorMessage = 'Unable to connect to SmartCar API';
      health.technicalDetails = error.message;
    }
  }

  return health;
}

/**
 * Redis Health Check
 */
async function checkRedis(): Promise<IntegrationHealth> {
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'Redis',
    status: 'unknown',
    configured: true,
    lastCheck: new Date().toISOString(),
    requiredConfig: [],
    optionalConfig: ['REDIS_URL', 'REDIS_HOST', 'REDIS_PORT'],
    capabilities: ['Caching', 'Session Storage', 'Rate Limiting']
  };

  try {
    if (!cache.isConnected()) {
      health.status = 'down';
      health.errorMessage = 'Redis not connected';
      health.technicalDetails = 'Cache service is not available';
      return health;
    }

    // Test basic operations
    const testKey = '__health_check__';
    const testValue = Date.now().toString();

    await cache.set(testKey, testValue, 10);
    const retrieved = await cache.get(testKey);
    await cache.delete(testKey);

    health.responseTime = Date.now() - startTime;

    if (retrieved === testValue) {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();

      // Get additional stats if available
      try {
        const stats = await cache.getStats();
        health.technicalDetails = `Memory: ${stats.memoryUsage || 'N/A'}, Hit Rate: ${stats.hitRate || 'N/A'}`;
      } catch (e) {
        // Stats not available, that's ok
      }
    } else {
      health.status = 'degraded';
      health.errorMessage = 'Redis operations not working correctly';
      health.technicalDetails = 'Set/get test failed';
    }
  } catch (error: any) {
    health.status = 'down';
    health.errorMessage = 'Redis health check failed';
    health.technicalDetails = error.message;
  }

  return health;
}

/**
 * Database Health Check
 */
async function checkDatabase(): Promise<IntegrationHealth> {
  const startTime = Date.now();

  const health: IntegrationHealth = {
    name: 'PostgreSQL Database',
    status: 'unknown',
    configured: true,
    lastCheck: new Date().toISOString(),
    requiredConfig: ['DATABASE_URL or DB_* variables'],
    optionalConfig: [],
    capabilities: ['Data Storage', 'Transactions', 'Full-text Search']
  };

  try {
    // Test connection with a simple query
    const result = await pool.query('SELECT NOW() as time, version() as version');

    health.responseTime = Date.now() - startTime;

    if (result.rows.length > 0) {
      health.status = 'healthy';
      health.lastSuccess = new Date().toISOString();

      // Extract PostgreSQL version
      const versionMatch = result.rows[0].version.match(/PostgreSQL ([\d.]+)/);
      const pgVersion = versionMatch ? versionMatch[1] : 'unknown';

      health.technicalDetails = `PostgreSQL ${pgVersion}, Response time: ${health.responseTime}ms`;

      // Check connection pool status
      try {
        const poolStats = {
          total: (pool as any).totalCount,
          idle: (pool as any).idleCount,
          waiting: (pool as any).waitingCount
        };
        health.technicalDetails += ` | Pool: ${poolStats.idle}/${poolStats.total} idle`;
      } catch (e) {
        // Pool stats not available
      }
    } else {
      health.status = 'degraded';
      health.errorMessage = 'Database query returned no results';
    }
  } catch (error: any) {
    health.status = 'down';
    health.errorMessage = 'Unable to connect to database';

    if (error.code === 'ECONNREFUSED') {
      health.technicalDetails = 'Connection refused - database server not reachable';
    } else if (error.code === '28P01') {
      health.technicalDetails = 'Authentication failed - invalid credentials';
    } else if (error.code === '3D000') {
      health.technicalDetails = 'Database does not exist';
    } else {
      health.technicalDetails = error.message;
    }
  }

  return health;
}

/**
 * Test Functions (for POST /test endpoints)
 */

async function testGoogleMaps(testData: any) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  const address = testData.address || '1600 Amphitheatre Parkway, Mountain View, CA';

  if (!apiKey) {
    return {
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const startTime = Date.now();
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address, key: apiKey },
      timeout: 10000
    });

    return {
      success: response.data.status === 'OK',
      responseTime: Date.now() - startTime,
      status: response.data.status,
      results: response.data.results?.[0] || null,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function testOpenAI(testData: any) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  const prompt = testData.prompt || 'Say hello';

  if (!apiKey) {
    return {
      success: false,
      error: 'API key not configured',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const startTime = Date.now();
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return {
      success: true,
      responseTime: Date.now() - startTime,
      response: response.data.choices[0]?.message?.content,
      usage: response.data.usage,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function testAzureAD(testData: any) {
  const clientId = process.env.AZURE_AD_CLIENT_ID || process.env.VITE_AZURE_AD_CLIENT_ID;
  const tenantId = process.env.AZURE_AD_TENANT_ID || process.env.VITE_AZURE_AD_TENANT_ID;

  if (!clientId || !tenantId) {
    return {
      success: false,
      error: 'Azure AD not fully configured',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(
      `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
      { timeout: 10000 }
    );

    return {
      success: true,
      responseTime: Date.now() - startTime,
      endpoints: {
        authorization: response.data.authorization_endpoint,
        token: response.data.token_endpoint,
        userinfo: response.data.userinfo_endpoint
      },
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

export default router;
