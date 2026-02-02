/**
 * Fleet CTA - Inventory Discovery System
 *
 * Automatically discovers all testable surfaces in the application:
 * - UI routes, pages, components, modals, tabs, actions
 * - API endpoints (REST, GraphQL, WebSockets)
 * - Background services, jobs, queues
 * - Integrations (internal and external APIs)
 * - AI features and models
 * - Database operations
 *
 * Outputs a comprehensive inventory.json for certification testing
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface UIRoute {
  type: 'ui-route';
  path: string;
  component: string;
  filePath: string;
  testable: boolean;
}

interface UITab {
  type: 'ui-tab';
  hubName: string;
  tabName: string;
  testId: string;
  filePath: string;
  testable: boolean;
}

interface UIButton {
  type: 'ui-button';
  location: string;
  buttonText: string;
  testId?: string;
  filePath: string;
  testable: boolean;
}

interface APIEndpoint {
  type: 'api-endpoint';
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  routeFile: string;
  authenticated: boolean;
  permissions?: string[];
  testable: boolean;
}

interface AIFeature {
  type: 'ai-feature';
  featureName: string;
  apiPath?: string;
  serviceFile?: string;
  modelType?: string;
  testable: boolean;
}

interface Integration {
  type: 'integration';
  name: string;
  integrationType: 'internal' | 'external';
  serviceFile: string;
  apiEndpoints?: string[];
  testable: boolean;
}

interface BackgroundService {
  type: 'background-service';
  serviceName: string;
  serviceType: 'job' | 'queue' | 'websocket' | 'cron';
  filePath: string;
  testable: boolean;
}

type InventoryItem = UIRoute | UITab | UIButton | APIEndpoint | AIFeature | Integration | BackgroundService;

interface Inventory {
  generated: string;
  summary: {
    totalItems: number;
    byType: Record<string, number>;
    testableItems: number;
    coverage: string;
  };
  items: InventoryItem[];
}

export class InventoryDiscoveryService {
  private projectRoot: string;
  private inventory: InventoryItem[] = [];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run full inventory discovery
   */
  async discover(): Promise<Inventory> {
    console.log('🔍 Starting comprehensive inventory discovery...\n');

    // Phase 1: Discover UI surfaces
    await this.discoverUIRoutes();
    await this.discoverUITabs();
    await this.discoverUIButtons();

    // Phase 2: Discover API surfaces
    await this.discoverAPIEndpoints();

    // Phase 3: Discover AI features
    await this.discoverAIFeatures();

    // Phase 4: Discover integrations
    await this.discoverIntegrations();

    // Phase 5: Discover background services
    await this.discoverBackgroundServices();

    // Generate summary
    const summary = this.generateSummary();

    const result: Inventory = {
      generated: new Date().toISOString(),
      summary,
      items: this.inventory
    };

    return result;
  }

  /**
   * Discover all UI routes from routes.tsx and navigation
   */
  private async discoverUIRoutes(): Promise<void> {
    console.log('📍 Discovering UI routes...');

    try {
      // Read routes.tsx to extract route definitions
      const routesFile = path.join(this.projectRoot, 'src/routes.tsx');
      const routesContent = await fs.readFile(routesFile, 'utf-8');

      // Parse route definitions using regex
      const routePattern = /<Route\s+path=["']([^"']+)["']\s+element={<([^/]+)\s*\/?>}/g;
      let match;

      while ((match = routePattern.exec(routesContent)) !== null) {
        const [, routePath, componentName] = match;

        this.inventory.push({
          type: 'ui-route',
          path: routePath,
          component: componentName,
          filePath: routesFile,
          testable: true
        });
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'ui-route').length} UI routes\n`);
    } catch (error) {
      console.error('   ❌ Error discovering UI routes:', error);
    }
  }

  /**
   * Discover all UI tabs by scanning hub components
   */
  private async discoverUITabs(): Promise<void> {
    console.log('📑 Discovering UI tabs...');

    try {
      // Find all hub component files
      const hubFiles = await glob('src/pages/*Hub.tsx', { cwd: this.projectRoot, absolute: true });
      const hubComponentFiles = await glob('src/components/hubs/**/*Hub.tsx', { cwd: this.projectRoot, absolute: true });
      const allHubFiles = [...hubFiles, ...hubComponentFiles];

      for (const hubFile of allHubFiles) {
        const content = await fs.readFile(hubFile, 'utf-8');
        const hubName = path.basename(hubFile, '.tsx');

        // Look for TabsTrigger components with data-testid
        const tabPattern = /<TabsTrigger[^>]*data-testid=["']hub-tab-([^"']+)["'][^>]*>([^<]+)</g;
        let match;

        while ((match = tabPattern.exec(content)) !== null) {
          const [, tabId, tabLabel] = match;

          this.inventory.push({
            type: 'ui-tab',
            hubName,
            tabName: tabLabel.trim(),
            testId: `hub-tab-${tabId}`,
            filePath: hubFile,
            testable: true
          });
        }
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'ui-tab').length} UI tabs\n`);
    } catch (error) {
      console.error('   ❌ Error discovering UI tabs:', error);
    }
  }

  /**
   * Discover all UI buttons and interactive elements
   */
  private async discoverUIButtons(): Promise<void> {
    console.log('🔘 Discovering UI buttons and actions...');

    try {
      // Scan all component files for buttons with data-testid
      const componentFiles = await glob('src/components/**/*.tsx', { cwd: this.projectRoot, absolute: true });

      for (const componentFile of componentFiles) {
        const content = await fs.readFile(componentFile, 'utf-8');
        const relativePath = path.relative(this.projectRoot, componentFile);

        // Look for Button components with data-testid
        const buttonPattern = /<Button[^>]*data-testid=["']([^"']+)["'][^>]*>([^<]*)/g;
        let match;

        while ((match = buttonPattern.exec(content)) !== null) {
          const [, testId, buttonText] = match;

          this.inventory.push({
            type: 'ui-button',
            location: relativePath,
            buttonText: buttonText.trim() || testId,
            testId,
            filePath: componentFile,
            testable: true
          });
        }
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'ui-button').length} UI buttons\n`);
    } catch (error) {
      console.error('   ❌ Error discovering UI buttons:', error);
    }
  }

  /**
   * Discover all API endpoints from route files
   */
  private async discoverAPIEndpoints(): Promise<void> {
    console.log('🌐 Discovering API endpoints...');

    try {
      // Find all API route files
      const routeFiles = await glob('api/src/routes/*.routes.ts', { cwd: this.projectRoot, absolute: true });

      for (const routeFile of routeFiles) {
        const content = await fs.readFile(routeFile, 'utf-8');
        const routeName = path.basename(routeFile, '.routes.ts');

        // Extract HTTP method calls (router.get, router.post, etc.)
        const endpointPattern = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
        let match;

        while ((match = endpointPattern.exec(content)) !== null) {
          const [, method, endpointPath] = match;

          // Check if endpoint requires authentication
          const hasAuth = content.includes('authenticateJWT');

          // Try to extract permission requirements
          const permissionMatch = content.match(/requirePermission\(['"]([^'"]+)['"]\)/);
          const permissions = permissionMatch ? [permissionMatch[1]] : undefined;

          this.inventory.push({
            type: 'api-endpoint',
            method: method.toUpperCase() as any,
            path: `/api/${routeName}${endpointPath}`,
            routeFile: path.relative(this.projectRoot, routeFile),
            authenticated: hasAuth,
            permissions,
            testable: true
          });
        }
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'api-endpoint').length} API endpoints\n`);
    } catch (error) {
      console.error('   ❌ Error discovering API endpoints:', error);
    }
  }

  /**
   * Discover AI/ML features
   */
  private async discoverAIFeatures(): Promise<void> {
    console.log('🤖 Discovering AI features...');

    try {
      // Find AI-related route files
      const aiRouteFiles = await glob('api/src/routes/ai-*.routes.ts', { cwd: this.projectRoot, absolute: true });
      const langchainFiles = await glob('api/src/routes/*langchain*.routes.ts', { cwd: this.projectRoot, absolute: true });
      const allAIFiles = [...aiRouteFiles, ...langchainFiles];

      for (const aiFile of allAIFiles) {
        const featureName = path.basename(aiFile, '.routes.ts');
        const content = await fs.readFile(aiFile, 'utf-8');

        // Check for model types or LLM integrations
        let modelType = 'unknown';
        if (content.includes('openai') || content.includes('gpt')) modelType = 'OpenAI GPT';
        if (content.includes('claude') || content.includes('anthropic')) modelType = 'Anthropic Claude';
        if (content.includes('gemini')) modelType = 'Google Gemini';
        if (content.includes('langchain')) modelType = 'LangChain';

        this.inventory.push({
          type: 'ai-feature',
          featureName,
          apiPath: `/api/${featureName}`,
          serviceFile: path.relative(this.projectRoot, aiFile),
          modelType,
          testable: true
        });
      }

      // Find AI service files
      const aiServiceFiles = await glob('api/src/services/*ai*.service.ts', { cwd: this.projectRoot, absolute: true });
      const mlServiceFiles = await glob('api/src/services/*ml*.service.ts', { cwd: this.projectRoot, absolute: true });
      const ragServiceFiles = await glob('api/src/services/*rag*.service.ts', { cwd: this.projectRoot, absolute: true });
      const allAIServices = [...aiServiceFiles, ...mlServiceFiles, ...ragServiceFiles];

      for (const serviceFile of allAIServices) {
        const serviceName = path.basename(serviceFile, '.service.ts');

        this.inventory.push({
          type: 'ai-feature',
          featureName: serviceName,
          serviceFile: path.relative(this.projectRoot, serviceFile),
          testable: true
        });
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'ai-feature').length} AI features\n`);
    } catch (error) {
      console.error('   ❌ Error discovering AI features:', error);
    }
  }

  /**
   * Discover internal and external integrations
   */
  private async discoverIntegrations(): Promise<void> {
    console.log('🔌 Discovering integrations...');

    try {
      // Known integration patterns
      const integrationPatterns = {
        'teams-integration': { type: 'external', name: 'Microsoft Teams' },
        'email-center': { type: 'external', name: 'Email (Microsoft 365)' },
        'gis-command': { type: 'external', name: 'GIS Services' },
        'arcgis-integration': { type: 'external', name: 'ArcGIS' },
        'smartcar': { type: 'external', name: 'Smartcar API' },
        'twilio': { type: 'external', name: 'Twilio SMS' },
        'plaid': { type: 'external', name: 'Plaid Financial' },
        'adaptive-cards': { type: 'external', name: 'Microsoft Adaptive Cards' },
        'outlook': { type: 'external', name: 'Microsoft Outlook' },
        'calendar': { type: 'external', name: 'Microsoft Calendar' }
      };

      // Find integration route files
      const integrationFiles = await glob('api/src/routes/{teams,email,outlook,calendar,adaptive-cards,smartcar}*.routes.ts', {
        cwd: this.projectRoot,
        absolute: true
      });

      // Find integration component files
      const integrationComponents = await glob('src/components/modules/integrations/*.tsx', {
        cwd: this.projectRoot,
        absolute: true
      });

      for (const integrationFile of integrationFiles) {
        const fileName = path.basename(integrationFile, '.routes.ts');
        const integrationInfo = Object.entries(integrationPatterns).find(([key]) => fileName.includes(key));

        if (integrationInfo) {
          const [, info] = integrationInfo;

          this.inventory.push({
            type: 'integration',
            name: info.name,
            integrationType: info.type as 'external',
            serviceFile: path.relative(this.projectRoot, integrationFile),
            testable: true
          });
        }
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'integration').length} integrations\n`);
    } catch (error) {
      console.error('   ❌ Error discovering integrations:', error);
    }
  }

  /**
   * Discover background services, jobs, and queues
   */
  private async discoverBackgroundServices(): Promise<void> {
    console.log('⚙️  Discovering background services...');

    try {
      // Find queue/job files
      const queueFiles = await glob('api/src/{services,jobs,queues}/*queue*.ts', { cwd: this.projectRoot, absolute: true });
      const jobFiles = await glob('api/src/{services,jobs}/*job*.ts', { cwd: this.projectRoot, absolute: true });
      const cronFiles = await glob('api/src/{services,jobs}/*cron*.ts', { cwd: this.projectRoot, absolute: true });

      for (const queueFile of queueFiles) {
        this.inventory.push({
          type: 'background-service',
          serviceName: path.basename(queueFile, '.ts'),
          serviceType: 'queue',
          filePath: path.relative(this.projectRoot, queueFile),
          testable: true
        });
      }

      for (const jobFile of jobFiles) {
        this.inventory.push({
          type: 'background-service',
          serviceName: path.basename(jobFile, '.ts'),
          serviceType: 'job',
          filePath: path.relative(this.projectRoot, jobFile),
          testable: true
        });
      }

      for (const cronFile of cronFiles) {
        this.inventory.push({
          type: 'background-service',
          serviceName: path.basename(cronFile, '.ts'),
          serviceType: 'cron',
          filePath: path.relative(this.projectRoot, cronFile),
          testable: true
        });
      }

      // Find websocket services
      const wsFiles = await glob('api/src/websocket/*.ts', { cwd: this.projectRoot, absolute: true });
      for (const wsFile of wsFiles) {
        this.inventory.push({
          type: 'background-service',
          serviceName: path.basename(wsFile, '.ts'),
          serviceType: 'websocket',
          filePath: path.relative(this.projectRoot, wsFile),
          testable: true
        });
      }

      console.log(`   ✅ Found ${this.inventory.filter(i => i.type === 'background-service').length} background services\n`);
    } catch (error) {
      console.error('   ❌ Error discovering background services:', error);
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const totalItems = this.inventory.length;
    const testableItems = this.inventory.filter(i => i.testable).length;

    const byType: Record<string, number> = {};
    for (const item of this.inventory) {
      byType[item.type] = (byType[item.type] || 0) + 1;
    }

    const coverage = totalItems > 0 ? `${((testableItems / totalItems) * 100).toFixed(1)}%` : '0%';

    return {
      totalItems,
      byType,
      testableItems,
      coverage
    };
  }

  /**
   * Save inventory to JSON file
   */
  async saveInventory(inventory: Inventory, outputPath: string): Promise<void> {
    await fs.writeFile(outputPath, JSON.stringify(inventory, null, 2), 'utf-8');
    console.log(`\n📝 Inventory saved to: ${outputPath}`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total items discovered: ${inventory.summary.totalItems}`);
    console.log(`   Testable items: ${inventory.summary.testableItems}`);
    console.log(`   Coverage: ${inventory.summary.coverage}\n`);
    console.log(`   By type:`);
    for (const [type, count] of Object.entries(inventory.summary.byType)) {
      console.log(`     ${type}: ${count}`);
    }
    console.log('');
  }
}

export default InventoryDiscoveryService;

// CLI execution (ESM format)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const projectRoot = path.resolve(process.cwd());
  const outputPath = path.join(process.cwd(), 'tests/certification/inventory.json');

  const discovery = new InventoryDiscoveryService(projectRoot);

  discovery.discover()
    .then(inventory => discovery.saveInventory(inventory, outputPath))
    .then(() => {
      console.log('✅ Inventory discovery complete!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Inventory discovery failed:', error);
      process.exit(1);
    });
}
