#!/usr/bin/env tsx

/**
 * Production Health Check Orchestrator
 * Uses multiple agents to validate all production components
 */

import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { promisify } from 'util';

import { chromium, Browser } from '@playwright/test';

const execAsync = promisify(exec);

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  details: string;
  timestamp: string;
  metrics?: Record<string, any>;
}

interface VisualCheck {
  hub: string;
  screenshotPath: string;
  loadTime: number;
  errors: string[];
}

class ProductionHealthOrchestrator {
  private results: HealthCheckResult[] = [];
  private visualChecks: VisualCheck[] = [];
  private browser: Browser | null = null;

  private readonly PRODUCTION_URL = 'https://fleet.capitaltechalliance.com';
  private readonly API_URL = 'https://fleet.capitaltechalliance.com/api';

  async runFullHealthCheck(): Promise<void> {
    console.log('🚀 Starting Production Health Check Orchestration\n');
    console.log('═'.repeat(80));

    try {
      // Run all health checks in parallel where possible
      await Promise.all([
        this.checkKubernetesHealth(),
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
      ]);

      // Sequential checks that depend on above
      await this.checkAPIHealth();
      await this.checkEmulatorHealth();

      // Visual checks (requires browser)
      await this.initBrowser();
      await this.visualHealthCheck();
      await this.closeBrowser();

      // Generate report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  private async checkKubernetesHealth(): Promise<void> {
    console.log('\n📦 Checking Kubernetes Health...');

    try {
      // Check pods
      const { stdout: pods } = await execAsync('kubectl get pods -n fleet-management -o json');
      const podsData = JSON.parse(pods);

      const runningPods = podsData.items.filter((p: any) => p.status.phase === 'Running').length;
      const totalPods = podsData.items.length;

      // Check services
      const { stdout: services } = await execAsync('kubectl get svc -n fleet-management -o json');
      const servicesData = JSON.parse(services);

      // Check ingress
      const { stdout: ingress } = await execAsync('kubectl get ingress fleet-main -n fleet-management -o json');
      const ingressData = JSON.parse(ingress);

      const status = runningPods === totalPods ? 'healthy' : 'degraded';

      this.results.push({
        component: 'Kubernetes',
        status,
        details: `${runningPods}/${totalPods} pods running, ${servicesData.items.length} services, Ingress: ${ingressData.spec.rules[0].host}`,
        timestamp: new Date().toISOString(),
        metrics: {
          podsRunning: runningPods,
          podsTotal: totalPods,
          services: servicesData.items.length,
          ingressHost: ingressData.spec.rules[0].host,
          loadBalancerIP: ingressData.status?.loadBalancer?.ingress?.[0]?.ip
        }
      });

      console.log(`  ✓ Kubernetes: ${runningPods}/${totalPods} pods healthy`);

    } catch (error) {
      this.results.push({
        component: 'Kubernetes',
        status: 'unhealthy',
        details: `Error: ${error}`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ✗ Kubernetes check failed`);
    }
  }

  private async checkDatabaseHealth(): Promise<void> {
    console.log('\n🗄️  Checking PostgreSQL Health...');

    try {
      // Get postgres pod name
      const { stdout } = await execAsync('kubectl get pods -n fleet-management -l app=fleet-postgres -o name | head -1');
      const podName = stdout.trim().replace('pod/', '');

      if (!podName) {
        throw new Error('PostgreSQL pod not found');
      }

      // Check database connection and schema
      const dbCheck = await execAsync(
        `kubectl exec -n fleet-management ${podName} -- psql -U postgres -d fleet_db -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';"`
      );

      // Check for required tables
      const tablesCheck = await execAsync(
        `kubectl exec -n fleet-management ${podName} -- psql -U postgres -d fleet_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"`
      );

      const tablesList = tablesCheck.stdout;
      const hasVehicles = tablesList.includes('vehicles');
      const hasDrivers = tablesList.includes('drivers');
      const hasRoutes = tablesList.includes('routes');

      const status = (hasVehicles && hasDrivers && hasRoutes) ? 'healthy' : 'degraded';

      this.results.push({
        component: 'PostgreSQL',
        status,
        details: `Database connected, tables verified`,
        timestamp: new Date().toISOString(),
        metrics: {
          hasVehiclesTable: hasVehicles,
          hasDriversTable: hasDrivers,
          hasRoutesTable: hasRoutes,
          podName
        }
      });

      console.log(`  ✓ PostgreSQL: Connected and schema validated`);

    } catch (error) {
      this.results.push({
        component: 'PostgreSQL',
        status: 'unhealthy',
        details: `Error: ${error}`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ✗ PostgreSQL check failed`);
    }
  }

  private async checkRedisHealth(): Promise<void> {
    console.log('\n📮 Checking Redis Health...');

    try {
      const { stdout } = await execAsync('kubectl get pods -n fleet-management -l app=fleet-redis -o name | head -1');
      const podName = stdout.trim().replace('pod/', '');

      if (!podName) {
        throw new Error('Redis pod not found');
      }

      // Ping Redis
      const pingResult = await execAsync(
        `kubectl exec -n fleet-management ${podName} -- redis-cli ping`
      );

      const isHealthy = pingResult.stdout.trim() === 'PONG';

      this.results.push({
        component: 'Redis',
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: `Redis responding to PING`,
        timestamp: new Date().toISOString(),
        metrics: {
          podName,
          pingResponse: pingResult.stdout.trim()
        }
      });

      console.log(`  ✓ Redis: ${pingResult.stdout.trim()}`);

    } catch (error) {
      this.results.push({
        component: 'Redis',
        status: 'unhealthy',
        details: `Error: ${error}`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ✗ Redis check failed`);
    }
  }

  private async checkAPIHealth(): Promise<void> {
    console.log('\n🔌 Checking API Health...');

    try {
      // Check API pod logs for errors
      const { stdout: apiPod } = await execAsync('kubectl get pods -n fleet-management -l app=fleet-api -o name | head -1');
      const podName = apiPod.trim().replace('pod/', '');

      const { stdout: logs } = await execAsync(
        `kubectl logs -n fleet-management ${podName} --tail=50`
      );

      const hasErrors = logs.includes('ERROR') || logs.includes('error:');
      const isConnected = logs.includes('PostgreSQL connected');

      this.results.push({
        component: 'API',
        status: !hasErrors && isConnected ? 'healthy' : 'degraded',
        details: `API pod running, ${hasErrors ? 'errors detected' : 'no errors'}, DB: ${isConnected ? 'connected' : 'disconnected'}`,
        timestamp: new Date().toISOString(),
        metrics: {
          podName,
          hasErrors,
          databaseConnected: isConnected
        }
      });

      console.log(`  ✓ API: ${isConnected ? 'Connected' : 'Degraded'}`);

    } catch (error) {
      this.results.push({
        component: 'API',
        status: 'unhealthy',
        details: `Error: ${error}`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ✗ API check failed`);
    }
  }

  private async checkEmulatorHealth(): Promise<void> {
    console.log('\n🚗 Checking OBD2 Emulator Health...');

    try {
      const { stdout } = await execAsync('kubectl get pods -n fleet-management -l app=fleet-obd2-emulator -o name | head -1');
      const podName = stdout.trim().replace('pod/', '');

      if (!podName) {
        this.results.push({
          component: 'OBD2 Emulator',
          status: 'degraded',
          details: 'Emulator pod not found (optional component)',
          timestamp: new Date().toISOString()
        });
        console.log(`  ⚠ OBD2 Emulator: Not running`);
        return;
      }

      const { stdout: logs } = await execAsync(
        `kubectl logs -n fleet-management ${podName} --tail=20`
      );

      const isEmitting = logs.includes('Emitting') || logs.includes('telemetry');

      this.results.push({
        component: 'OBD2 Emulator',
        status: isEmitting ? 'healthy' : 'degraded',
        details: `Emulator ${isEmitting ? 'active' : 'idle'}`,
        timestamp: new Date().toISOString(),
        metrics: {
          podName,
          isEmitting
        }
      });

      console.log(`  ✓ OBD2 Emulator: ${isEmitting ? 'Active' : 'Idle'}`);

    } catch (error) {
      this.results.push({
        component: 'OBD2 Emulator',
        status: 'degraded',
        details: `Optional component not available`,
        timestamp: new Date().toISOString()
      });
      console.log(`  ⚠ OBD2 Emulator: Not available`);
    }
  }

  private async initBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  private async visualHealthCheck(): Promise<void> {
    console.log('\n👁️  Running Visual Health Checks...');

    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const hubs = [
      { name: 'Main Dashboard', path: '/' },
      { name: 'Fleet Hub', path: '/fleet' },
      { name: 'Insights Hub', path: '/insights' },
      { name: 'People Hub', path: '/people' },
      { name: 'Work Hub', path: '/work' },
      { name: 'Operations Hub', path: '/operations' },
      { name: 'Maintenance Hub', path: '/maintenance' }
    ];

    for (const hub of hubs) {
      try {
        const context = await this.browser.newContext({
          viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });

        const startTime = Date.now();

        await page.goto(`${this.PRODUCTION_URL}${hub.path}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });

        // Wait for main content
        await page.waitForSelector('main, [role="main"], .app-container', {
          timeout: 10000
        }).catch(() => {
          errors.push('Main content selector not found');
        });

        const loadTime = Date.now() - startTime;

        // Take screenshot
        const screenshotPath = `/tmp/prod-${hub.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: false
        });

        this.visualChecks.push({
          hub: hub.name,
          screenshotPath,
          loadTime,
          errors
        });

        await context.close();

        console.log(`  ✓ ${hub.name}: ${loadTime}ms ${errors.length > 0 ? `(${errors.length} errors)` : ''}`);

      } catch (error) {
        console.log(`  ✗ ${hub.name}: Failed - ${error}`);
        this.visualChecks.push({
          hub: hub.name,
          screenshotPath: '',
          loadTime: 0,
          errors: [String(error)]
        });
      }
    }
  }

  private async generateReport(): Promise<void> {
    console.log('\n📊 Generating Health Report...');
    console.log('═'.repeat(80));

    const report = {
      timestamp: new Date().toISOString(),
      overallStatus: this.calculateOverallStatus(),
      components: this.results,
      visualChecks: this.visualChecks,
      summary: {
        totalComponents: this.results.length,
        healthy: this.results.filter(r => r.status === 'healthy').length,
        degraded: this.results.filter(r => r.status === 'degraded').length,
        unhealthy: this.results.filter(r => r.status === 'unhealthy').length,
        totalHubs: this.visualChecks.length,
        hubsWithErrors: this.visualChecks.filter(v => v.errors.length > 0).length,
        averageLoadTime: Math.round(
          this.visualChecks.reduce((sum, v) => sum + v.loadTime, 0) / this.visualChecks.length
        )
      }
    };

    // Save report
    await fs.writeFile(
      '/tmp/production-health-report.json',
      JSON.stringify(report, null, 2)
    );

    // Display summary
    console.log('\n🎯 PRODUCTION HEALTH SUMMARY');
    console.log('═'.repeat(80));
    console.log(`Overall Status: ${this.getStatusEmoji(report.overallStatus)} ${report.overallStatus.toUpperCase()}`);
    console.log(`\nComponent Health:`);
    console.log(`  ✅ Healthy:   ${report.summary.healthy}`);
    console.log(`  ⚠️  Degraded:  ${report.summary.degraded}`);
    console.log(`  ❌ Unhealthy: ${report.summary.unhealthy}`);
    console.log(`\nVisual Checks:`);
    console.log(`  📱 Hubs Tested: ${report.summary.totalHubs}`);
    console.log(`  ⏱️  Avg Load Time: ${report.summary.averageLoadTime}ms`);
    console.log(`  ⚠️  Hubs with Errors: ${report.summary.hubsWithErrors}`);

    console.log('\n📸 Screenshots saved to /tmp/prod-*.png');
    console.log('📄 Full report: /tmp/production-health-report.json');
    console.log('═'.repeat(80));
  }

  private calculateOverallStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = this.results.filter(r => r.status === 'unhealthy').length;
    const degradedCount = this.results.filter(r => r.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 1) return 'degraded';
    return 'healthy';
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
  }
}

// Main execution
async function main() {
  const orchestrator = new ProductionHealthOrchestrator();

  try {
    await orchestrator.runFullHealthCheck();
    console.log('\n✅ Production health check completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Production health check failed:', error);
    process.exit(1);
  }
}

main();
