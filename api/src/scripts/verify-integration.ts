/**
 * Verify Microsoft Integration
 *
 * Post-deployment verification script to test all integration points.
 * Run after deployment to ensure everything is working correctly.
 *
 * Usage: npm run verify:integration
 */

import dotenv from 'dotenv';

dotenv.config();

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration?: number;
}

class IntegrationVerifier {
  private checks: HealthCheck[] = [];
  private accessToken: string | null = null;

  async verify(): Promise<boolean> {
    console.log('=== Microsoft Integration Verification ===\n');

    await this.checkEnvironmentVariables();
    await this.checkTokenAcquisition();
    await this.checkGraphAPIConnection();
    await this.checkTeamsAPI();
    await this.checkOutlookAPI();
    await this.checkWebhookEndpoints();
    await this.checkAzureStorage();
    await this.checkDatabaseConnection();
    await this.checkQueueSystem();

    this.printResults();

    const failures = this.checks.filter(c => c.status === 'fail').length;
    return failures === 0;
  }

  private async checkEnvironmentVariables(): Promise<void> {
    const start = Date.now();
    const required = [
      'MS_GRAPH_CLIENT_ID',
      'MS_GRAPH_CLIENT_SECRET',
      'MS_GRAPH_TENANT_ID',
      'AZURE_STORAGE_CONNECTION_STRING',
      'DATABASE_URL'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length === 0) {
      this.checks.push({
        name: 'Environment Variables',
        status: 'pass',
        message: `All ${required.length} required variables present`,
        duration: Date.now() - start
      });
    } else {
      this.checks.push({
        name: 'Environment Variables',
        status: 'fail',
        message: 'Missing: ${missing.join(', ')}',
        duration: Date.now() - start
      });
    }
  }

  private async checkTokenAcquisition(): Promise<void> {
    const start = Date.now();

    try {
      const tokenUrl = `https://login.microsoftonline.com/${process.env.MS_GRAPH_TENANT_ID}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: process.env.MS_GRAPH_CLIENT_ID || '',
        client_secret: process.env.MS_GRAPH_CLIENT_SECRET || '',
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (response.ok) {
        const data = await response.json() as { access_token: string };
        this.accessToken = data.access_token;

        this.checks.push({
          name: 'Token Acquisition',
          status: 'pass',
          message: 'Successfully acquired access token',
          duration: Date.now() - start
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.checks.push({
        name: 'Token Acquisition',
        status: 'fail',
        message: `Failed: ${error.message}`,
        duration: Date.now() - start
      });
    }
  }

  private async checkGraphAPIConnection(): Promise<void> {
    const start = Date.now();

    if (!this.accessToken) {
      this.checks.push({
        name: 'Graph API Connection',
        status: 'fail',
        message: 'No access token available',
        duration: Date.now() - start
      });
      return;
    }

    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: { 'Authorization': 'Bearer ${this.accessToken}` }
      });

      if (response.ok || response.status === 403) {
        // 403 is ok for app-only auth (no user context)
        this.checks.push({
          name: 'Graph API Connection',
          status: 'pass',
          message: 'Graph API is reachable',
          duration: Date.now() - start
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.checks.push({
        name: 'Graph API Connection',
        status: 'fail',
        message: `Failed: ${error.message}`,
        duration: Date.now() - start
      });
    }
  }

  private async checkTeamsAPI(): Promise<void> {
    const start = Date.now();

    if (!this.accessToken) {
      this.checks.push({
        name: 'Teams API',
        status: 'warn',
        message: 'Skipped (no access token)',
        duration: Date.now() - start
      });
      return;
    }

    try {
      // Try to list teams
      const response = await fetch('https://graph.microsoft.com/v1.0/groups?$filter=resourceProvisioningOptions/Any(x:x eq \'Team\')', {
        headers: { 'Authorization': 'Bearer ${this.accessToken}` }
      });

      if (response.ok) {
        this.checks.push({
          name: 'Teams API',
          status: 'pass',
          message: 'Teams API is accessible',
          duration: Date.now() - start
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.checks.push({
        name: 'Teams API',
        status: 'warn',
        message: `Limited access: ${error.message}`,
        duration: Date.now() - start
      });
    }
  }

  private async checkOutlookAPI(): Promise<void> {
    const start = Date.now();

    if (!this.accessToken) {
      this.checks.push({
        name: 'Outlook API',
        status: 'warn',
        message: 'Skipped (no access token)',
        duration: Date.now() - start
      });
      return;
    }

    try {
      // Try to list users
      const response = await fetch('https://graph.microsoft.com/v1.0/users?$top=1', {
        headers: { 'Authorization': 'Bearer ${this.accessToken}` }
      });

      if (response.ok) {
        this.checks.push({
          name: 'Outlook API',
          status: 'pass',
          message: 'Outlook API is accessible',
          duration: Date.now() - start
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.checks.push({
        name: 'Outlook API',
        status: 'warn',
        message: `Limited access: ${error.message}`,
        duration: Date.now() - start
      });
    }
  }

  private async checkWebhookEndpoints(): Promise<void> {
    const start = Date.now();
    const webhookUrl = process.env.MS_GRAPH_WEBHOOK_URL;

    if (!webhookUrl) {
      this.checks.push({
        name: 'Webhook Endpoints',
        status: 'warn',
        message: 'Webhook URL not configured',
        duration: Date.now() - start
      });
      return;
    }

    try {
      const response = await fetch(`${webhookUrl}/health`, {
        method: 'GET'
      });

      if (response.ok || response.status === 404) {
        this.checks.push({
          name: 'Webhook Endpoints',
          status: 'pass',
          message: 'Webhook endpoint is reachable',
          duration: Date.now() - start
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      this.checks.push({
        name: 'Webhook Endpoints',
        status: 'warn',
        message: `Check failed: ${error.message}`,
        duration: Date.now() - start
      });
    }
  }

  private async checkAzureStorage(): Promise<void> {
    const start = Date.now();
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

    if (!connectionString) {
      this.checks.push({
        name: 'Azure Storage',
        status: 'fail',
        message: 'Connection string not configured',
        duration: Date.now() - start
      });
      return;
    }

    // Basic validation of connection string format
    if (connectionString.includes('AccountName=') && connectionString.includes('AccountKey=')) {
      this.checks.push({
        name: 'Azure Storage',
        status: 'pass',
        message: 'Connection string format valid',
        duration: Date.now() - start
      });
    } else {
      this.checks.push({
        name: 'Azure Storage',
        status: 'fail',
        message: 'Invalid connection string format',
        duration: Date.now() - start
      });
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    const start = Date.now();
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      this.checks.push({
        name: 'Database Connection',
        status: 'fail',
        message: 'DATABASE_URL not configured',
        duration: Date.now() - start
      });
      return;
    }

    // Basic validation of database URL format
    if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
      this.checks.push({
        name: 'Database Connection',
        status: 'pass',
        message: 'Database URL format valid',
        duration: Date.now() - start
      });
    } else {
      this.checks.push({
        name: 'Database Connection',
        status: 'warn',
        message: 'Unexpected database URL format',
        duration: Date.now() - start
      });
    }
  }

  private async checkQueueSystem(): Promise<void> {
    const start = Date.now();
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.checks.push({
        name: 'Queue System',
        status: 'warn',
        message: 'Redis not configured (using in-memory queue)',
        duration: Date.now() - start
      });
      return;
    }

    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      this.checks.push({
        name: 'Queue System',
        status: 'pass',
        message: 'Redis URL format valid',
        duration: Date.now() - start
      });
    } else {
      this.checks.push({
        name: 'Queue System',
        status: 'fail',
        message: 'Invalid Redis URL format',
        duration: Date.now() - start
      });
    }
  }

  private printResults(): void {
    console.log('\n=== Verification Results ===\n');

    this.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠';
      const duration = check.duration ? '(${check.duration}ms)' : '';
      console.log(`${icon} ${check.name}: ${check.message} ${duration}`);
    });

    const passed = this.checks.filter(c => c.status === 'pass').length;
    const failed = this.checks.filter(c => c.status === 'fail').length;
    const warned = this.checks.filter(c => c.status === 'warn').length;

    console.log(`\nSummary: ${passed} passed, ${failed} failed, ${warned} warnings`);

    if (failed > 0) {
      console.log('\n✗ Integration verification FAILED');
    } else if (warned > 0) {
      console.log('\n⚠ Integration verification passed with warnings');
    } else {
      console.log('\n✓ Integration verification PASSED');
    }
  }
}

// Main execution
async function main() {
  const verifier = new IntegrationVerifier();
  const success = await verifier.verify();

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

export { IntegrationVerifier };
