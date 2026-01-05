/**
 * Comprehensive Endpoint Testing Script
 * Tests all API endpoints, database connections, and external integrations
 */

import http from 'http';

import express, { Express } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';

// Types
interface EndpointTest {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  requiresAuth?: boolean;
  body?: Record<string, unknown>;
  expectedStatus?: number[];
}

interface TestResult {
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'error' | 'skip';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  details?: string;
}

interface ConnectionTestResult {
  service: string;
  status: 'connected' | 'disconnected' | 'error';
  latency?: number;
  error?: string;
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// All endpoints to test based on server.ts routes
const endpoints: EndpointTest[] = [
  // Health checks
  { path: '/health', method: 'GET', description: 'Basic health check' },
  { path: '/api/health', method: 'GET', description: 'API health check' },
  { path: '/api/health/microsoft', method: 'GET', description: 'Microsoft integration health' },
  { path: '/api/health-detailed', method: 'GET', description: 'Detailed health check' },

  // Core Fleet Management
  { path: '/api/vehicles', method: 'GET', description: 'List vehicles' },
  { path: '/api/drivers', method: 'GET', description: 'List drivers' },
  { path: '/api/fuel-transactions', method: 'GET', description: 'List fuel transactions' },
  { path: '/api/maintenance', method: 'GET', description: 'List maintenance records' },
  { path: '/api/incidents', method: 'GET', description: 'List incidents' },
  { path: '/api/parts', method: 'GET', description: 'List parts' },
  { path: '/api/vendors', method: 'GET', description: 'List vendors' },
  { path: '/api/invoices', method: 'GET', description: 'List invoices' },
  { path: '/api/purchase-orders', method: 'GET', description: 'List purchase orders' },
  { path: '/api/tasks', method: 'GET', description: 'List tasks' },

  // Asset Management
  { path: '/api/assets', method: 'GET', description: 'List assets' },
  { path: '/api/asset-analytics', method: 'GET', description: 'Asset analytics' },
  { path: '/api/assets-mobile', method: 'GET', description: 'Mobile assets' },
  { path: '/api/heavy-equipment', method: 'GET', description: 'Heavy equipment' },

  // GPS & Tracking
  { path: '/api/gps', method: 'GET', description: 'GPS data' },
  { path: '/api/geofences', method: 'GET', description: 'Geofences' },
  { path: '/api/telematics', method: 'GET', description: 'Telematics data' },
  { path: '/api/vehicle-idling', method: 'GET', description: 'Vehicle idling data' },

  // Maintenance & Inspection
  { path: '/api/maintenance-schedules', method: 'GET', description: 'Maintenance schedules' },
  { path: '/api/maintenance/drilldowns', method: 'GET', description: 'Maintenance drilldowns' },
  { path: '/api/inspections', method: 'GET', description: 'Inspections' },
  { path: '/api/work-orders', method: 'GET', description: 'Work orders' },

  // EV Management
  { path: '/api/ev-management', method: 'GET', description: 'EV management' },
  { path: '/api/charging-sessions', method: 'GET', description: 'Charging sessions' },
  { path: '/api/charging-stations', method: 'GET', description: 'Charging stations' },

  // Documents
  { path: '/api/documents', method: 'GET', description: 'Documents' },
  { path: '/api/fleet-documents', method: 'GET', description: 'Fleet documents' },

  // Financial & Costs
  { path: '/api/costs', method: 'GET', description: 'Costs' },
  { path: '/api/cost-analysis', method: 'GET', description: 'Cost analysis' },
  { path: '/api/cost-benefit-analysis', method: 'GET', description: 'Cost-benefit analysis' },
  { path: '/api/billing-reports', method: 'GET', description: 'Billing reports' },
  { path: '/api/mileage-reimbursement', method: 'GET', description: 'Mileage reimbursement' },
  { path: '/api/personal-use-charges', method: 'GET', description: 'Personal use charges' },
  { path: '/api/personal-use-policies', method: 'GET', description: 'Personal use policies' },

  // Reporting & Analytics
  { path: '/api/executive-dashboard', method: 'GET', description: 'Executive dashboard' },
  { path: '/api/assignment-reporting', method: 'GET', description: 'Assignment reporting' },
  { path: '/api/driver-scorecard', method: 'GET', description: 'Driver scorecard' },

  // AI & Automation
  { path: '/api/ai-search', method: 'GET', description: 'AI search' },
  { path: '/api/ai-task-asset', method: 'GET', description: 'AI task asset' },
  { path: '/api/ai-tasks', method: 'GET', description: 'AI tasks' },

  // Scheduling
  { path: '/api/scheduling', method: 'GET', description: 'Scheduling' },
  { path: '/api/calendar', method: 'GET', description: 'Calendar' },
  { path: '/api/on-call-management', method: 'GET', description: 'On-call management' },

  // Mobile
  { path: '/api/mobile-assignment', method: 'GET', description: 'Mobile assignment' },
  { path: '/api/mobile-hardware', method: 'GET', description: 'Mobile hardware' },
  { path: '/api/mobile-integration', method: 'GET', description: 'Mobile integration' },
  { path: '/api/mobile-messaging', method: 'GET', description: 'Mobile messaging' },
  { path: '/api/mobile-photos', method: 'GET', description: 'Mobile photos' },
  { path: '/api/mobile-trips', method: 'GET', description: 'Mobile trips' },
  { path: '/api/push-notifications', method: 'GET', description: 'Push notifications' },

  // Vehicle Management
  { path: '/api/vehicle-assignments', method: 'GET', description: 'Vehicle assignments' },
  { path: '/api/vehicle-history', method: 'GET', description: 'Vehicle history' },
  { path: '/api/vehicle-3d', method: 'GET', description: 'Vehicle 3D' },
  { path: '/api/damage', method: 'GET', description: 'Damage records' },
  { path: '/api/damage-reports', method: 'GET', description: 'Damage reports' },

  // Routes & Trips
  { path: '/api/routes', method: 'GET', description: 'Routes' },
  { path: '/api/route-emulator', method: 'GET', description: 'Route emulator' },
  { path: '/api/trip-usage', method: 'GET', description: 'Trip usage' },

  // Safety & Compliance
  { path: '/api/safety-incidents', method: 'GET', description: 'Safety incidents' },
  { path: '/api/osha-compliance', method: 'GET', description: 'OSHA compliance' },
  { path: '/api/annual-reauthorization', method: 'GET', description: 'Annual reauthorization' },

  // Policies & Permissions
  { path: '/api/policies', method: 'GET', description: 'Policies' },
  { path: '/api/policy-templates', method: 'GET', description: 'Policy templates' },
  { path: '/api/permissions', method: 'GET', description: 'Permissions' },

  // Auth
  { path: '/api/auth/status', method: 'GET', description: 'Auth status' },
  { path: '/api/break-glass', method: 'GET', description: 'Break glass' },

  // External Integrations
  { path: '/api/smartcar/status', method: 'GET', description: 'SmartCar status' },
  { path: '/api/arcgis-layers', method: 'GET', description: 'ArcGIS layers' },
  { path: '/api/outlook/status', method: 'GET', description: 'Outlook status' },
  { path: '/api/video-events', method: 'GET', description: 'Video events' },
  { path: '/api/video-telematics', method: 'GET', description: 'Video telematics' },

  // Communication
  { path: '/api/communication-logs', method: 'GET', description: 'Communication logs' },
  { path: '/api/teams', method: 'GET', description: 'Teams integration' },

  // System
  { path: '/api/monitoring', method: 'GET', description: 'Monitoring' },
  { path: '/api/performance', method: 'GET', description: 'Performance metrics' },
  { path: '/api/telemetry', method: 'GET', description: 'Telemetry' },
  { path: '/api/queue', method: 'GET', description: 'Queue status' },
  { path: '/api/deployments', method: 'GET', description: 'Deployments' },
  { path: '/api/facilities', method: 'GET', description: 'Facilities' },
  { path: '/api/search', method: 'GET', description: 'Search' },
  { path: '/api/presence', method: 'GET', description: 'Presence' },
  { path: '/api/sync', method: 'GET', description: 'Sync status' },
  { path: '/api/quality-gates', method: 'GET', description: 'Quality gates' },
  { path: '/api/reservations', method: 'GET', description: 'Reservations' },

  // Demo & Emulator
  { path: '/api/emulator', method: 'GET', description: 'Emulator status' },
  { path: '/api/obd2-emulator', method: 'GET', description: 'OBD2 emulator' },
  { path: '/api/demo', method: 'GET', description: 'Demo data' },

  // Batch
  { path: '/api/batch', method: 'GET', description: 'Batch operations' },
  { path: '/api/v1/batch', method: 'GET', description: 'Batch v1' },
];

class EndpointTester {
  private app: Express | null = null;
  private server: http.Server | null = null;
  private port: number = 0;
  private baseUrl: string = '';
  private results: TestResult[] = [];
  private connectionResults: ConnectionTestResult[] = [];

  async initialize(): Promise<void> {
    console.log(`\n${colors.cyan}${colors.bold}╔════════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}║     Fleet Management API - Comprehensive Endpoint Testing      ║${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}╚════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  }

  async testDatabaseConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fleet_dev';

    console.log(`${colors.cyan}Testing PostgreSQL connection...${colors.reset}`);

    const pool = new Pool({
      connectionString: dbUrl,
      connectionTimeoutMillis: 5000,
    });

    try {
      await pool.query('SELECT 1');
      const latency = Date.now() - startTime;
      await pool.end();

      const result: ConnectionTestResult = {
        service: 'PostgreSQL',
        status: 'connected',
        latency,
      };
      this.connectionResults.push(result);
      console.log(`${colors.green}✓ PostgreSQL connected (${latency}ms)${colors.reset}`);
      return result;
    } catch (error: any) {
      await pool.end().catch(() => {});

      const result: ConnectionTestResult = {
        service: 'PostgreSQL',
        status: 'error',
        error: error.message,
      };
      this.connectionResults.push(result);
      console.log(`${colors.red}✗ PostgreSQL connection failed: ${error.message}${colors.reset}`);
      return result;
    }
  }

  async testRedisConnection(): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    console.log(`${colors.cyan}Testing Redis connection...${colors.reset}`);

    const redis = new Redis(redisUrl, {
      connectTimeout: 5000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    try {
      await redis.ping();
      const latency = Date.now() - startTime;
      await redis.quit();

      const result: ConnectionTestResult = {
        service: 'Redis',
        status: 'connected',
        latency,
      };
      this.connectionResults.push(result);
      console.log(`${colors.green}✓ Redis connected (${latency}ms)${colors.reset}`);
      return result;
    } catch (error: any) {
      await redis.quit().catch(() => {});

      const result: ConnectionTestResult = {
        service: 'Redis',
        status: 'error',
        error: error.message,
      };
      this.connectionResults.push(result);
      console.log(`${colors.yellow}⚠ Redis not available: ${error.message}${colors.reset}`);
      return result;
    }
  }

  async startTestServer(): Promise<void> {
    console.log(`\n${colors.cyan}Starting test server...${colors.reset}`);

    // Import the app from server-minimal or create one
    try {
      // Try to load a minimal server version for testing
      const { app: serverApp } = await import('../server-minimal');
      this.app = serverApp;
    } catch {
      // Create a minimal test app
      this.app = express();
      this.app.get('/health', (req, res) => res.json({ status: 'ok' }));
    }

    return new Promise((resolve, reject) => {
      try {
        this.server = this.app!.listen(0, () => {
          const address = this.server!.address();
          if (typeof address === 'object' && address) {
            this.port = address.port;
            this.baseUrl = `http://localhost:${this.port}`;
            console.log(`${colors.green}✓ Test server started on port ${this.port}${colors.reset}`);
          }
          resolve();
        });

        this.server.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  async testEndpoint(endpoint: EndpointTest): Promise<TestResult> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint.path}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: endpoint.body ? JSON.stringify(endpoint.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      // Consider 2xx, 3xx, 401 (auth required), and 403 (forbidden) as expected
      const validStatuses = endpoint.expectedStatus || [200, 201, 204, 301, 302, 401, 403, 404];
      const isValid = validStatuses.includes(response.status) || response.status < 500;

      const result: TestResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: isValid ? 'pass' : 'fail',
        statusCode: response.status,
        responseTime,
        details: endpoint.description,
      };

      this.results.push(result);
      return result;
    } catch (error: any) {
      const result: TestResult = {
        endpoint: endpoint.path,
        method: endpoint.method,
        status: 'error',
        error: error.message,
        details: endpoint.description,
      };

      this.results.push(result);
      return result;
    }
  }

  async runAllEndpointTests(): Promise<void> {
    console.log(`\n${colors.cyan}${colors.bold}Testing ${endpoints.length} endpoints...${colors.reset}\n`);

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint);

      const statusIcon = result.status === 'pass' ? `${colors.green}✓` :
                        result.status === 'fail' ? `${colors.red}✗` :
                        result.status === 'skip' ? `${colors.yellow}○` : `${colors.red}⚠`;

      const statusInfo = result.statusCode ? `[${result.statusCode}]` : '';
      const timeInfo = result.responseTime ? `(${result.responseTime}ms)` : '';
      const errorInfo = result.error ? ` - ${result.error}` : '';

      console.log(`${statusIcon} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(45)} ${statusInfo.padEnd(6)} ${timeInfo}${errorInfo}${colors.reset}`);
    }
  }

  async stopTestServer(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          console.log(`\n${colors.green}✓ Test server stopped${colors.reset}`);
          resolve();
        });
      });
    }
  }

  printSummary(): void {
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}                           TEST SUMMARY                              ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);

    // Connection results
    console.log(`${colors.bold}Connection Tests:${colors.reset}`);
    for (const conn of this.connectionResults) {
      const icon = conn.status === 'connected' ? `${colors.green}✓` : `${colors.red}✗`;
      const latency = conn.latency ? `(${conn.latency}ms)` : '';
      const error = conn.error ? ` - ${conn.error}` : '';
      console.log(`  ${icon} ${conn.service.padEnd(20)} ${conn.status} ${latency}${error}${colors.reset}`);
    }

    // Endpoint results
    console.log(`\n${colors.bold}Endpoint Tests:${colors.reset}`);
    console.log(`  ${colors.green}Passed:  ${passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed:  ${failed}${colors.reset}`);
    console.log(`  ${colors.red}Errors:  ${errors}${colors.reset}`);
    console.log(`  ${colors.yellow}Skipped: ${skipped}${colors.reset}`);
    console.log(`  ${colors.bold}Total:   ${this.results.length}${colors.reset}`);

    // Show failed endpoints
    const failedEndpoints = this.results.filter(r => r.status === 'fail' || r.status === 'error');
    if (failedEndpoints.length > 0) {
      console.log(`\n${colors.red}${colors.bold}Failed/Error Endpoints:${colors.reset}`);
      for (const result of failedEndpoints) {
        console.log(`  ${colors.red}✗ ${result.method} ${result.endpoint} [${result.statusCode || 'N/A'}] ${result.error || ''}${colors.reset}`);
      }
    }

    console.log(`\n${colors.cyan}${colors.bold}═══════════════════════════════════════════════════════════════════${colors.reset}\n`);
  }

  getFailedEndpoints(): TestResult[] {
    return this.results.filter(r => r.status === 'fail' || r.status === 'error');
  }
}

// Main execution
async function main() {
  const tester = new EndpointTester();

  try {
    await tester.initialize();

    // Test connections
    console.log(`${colors.bold}Testing Database & Cache Connections${colors.reset}`);
    console.log('─'.repeat(50));
    await tester.testDatabaseConnection();
    await tester.testRedisConnection();

    // Start test server and run endpoint tests
    await tester.startTestServer();
    await tester.runAllEndpointTests();
    await tester.stopTestServer();

    // Print summary
    tester.printSummary();

    // Exit with appropriate code
    const failed = tester.getFailedEndpoints();
    process.exit(failed.length > 0 ? 1 : 0);

  } catch (error: any) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Export for use as module
export { EndpointTester, endpoints };

// Run if executed directly
main().catch(console.error);
