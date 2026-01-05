import { chromium, Browser, Page } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface HubConfig {
  name: string;
  path: string;
  waitForSelector: string;
  additionalWait?: number;
}

const HUBS: HubConfig[] = [
  {
    name: 'insights-hub',
    path: '/insights',
    waitForSelector: '[data-testid="insights-hub"], .insights-container, main',
    additionalWait: 3000
  },
  {
    name: 'people-hub',
    path: '/people',
    waitForSelector: '[data-testid="people-hub"], .people-container, main',
    additionalWait: 3000
  },
  {
    name: 'work-hub',
    path: '/work',
    waitForSelector: '[data-testid="work-hub"], .work-container, main',
    additionalWait: 3000
  },
  {
    name: 'fleet-hub',
    path: '/fleet',
    waitForSelector: '[data-testid="fleet-hub"], .fleet-container, main',
    additionalWait: 3000
  }
];

class AzureVisualOrchestrator {
  private browser: Browser | null = null;
  private devServerUrl = 'http://localhost:5175';

  async initialize() {
    console.log('🚀 Initializing Azure Visual Inspection Orchestrator\n');

    // Wait for dev server to be ready
    await this.waitForDevServer();

    // Launch browser
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('✓ Browser initialized\n');
  }

  async waitForDevServer(maxAttempts = 30, intervalMs = 2000): Promise<void> {
    console.log('⏳ Waiting for dev server to be ready...');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(this.devServerUrl);
        if (response.ok) {
          console.log(`✓ Dev server ready after ${attempt * intervalMs / 1000}s\n`);
          // Additional wait to ensure full compilation
          await this.sleep(5000);
          return;
        }
      } catch (error) {
        // Server not ready yet
      }

      if (attempt < maxAttempts) {
        await this.sleep(intervalMs);
      }
    }

    throw new Error('Dev server failed to start within timeout period');
  }

  async captureHub(hub: HubConfig): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    console.log(`📸 Capturing ${hub.name}...`);

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    try {
      // Navigate to hub
      console.log(`   → Navigating to ${hub.path}`);
      await page.goto(`${this.devServerUrl}${hub.path}`, {
        waitUntil: 'networkidle',
        timeout: 60000
      });

      // Wait for specific hub content
      console.log(`   → Waiting for hub content...`);
      await page.waitForSelector(hub.waitForSelector, {
        timeout: 30000,
        state: 'visible'
      }).catch(() => {
        console.log(`   ⚠ Primary selector not found, checking for fallbacks...`);
      });

      // Additional wait for dynamic content
      if (hub.additionalWait) {
        await this.sleep(hub.additionalWait);
      }

      // Wait for any loading spinners to disappear
      await page.waitForSelector('.loading, .spinner', {
        state: 'hidden',
        timeout: 5000
      }).catch(() => {
        // No spinners found, which is fine
      });

      // Capture screenshot
      const outputPath = `/tmp/${hub.name}-visual.png`;
      console.log(`   → Capturing screenshot to ${outputPath}`);

      await page.screenshot({
        path: outputPath,
        fullPage: true
      });

      console.log(`✓ ${hub.name} captured successfully\n`);

    } catch (error) {
      console.error(`✗ Error capturing ${hub.name}:`, error);
      throw error;
    } finally {
      await context.close();
    }
  }

  async captureAll(): Promise<void> {
    console.log('📸 Starting coordinated capture of all hubs...\n');

    for (const hub of HUBS) {
      try {
        await this.captureHub(hub);
      } catch (error) {
        console.error(`Failed to capture ${hub.name}, continuing...`);
      }
    }

    console.log('✅ All hub captures completed\n');
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      console.log('✓ Browser closed');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const orchestrator = new AzureVisualOrchestrator();

  try {
    await orchestrator.initialize();
    await orchestrator.captureAll();

    console.log('\n📋 Visual Inspection Summary:');
    console.log('════════════════════════════════════════════════════════');

    // List captured files
    const { stdout } = await execAsync('ls -lh /tmp/*-visual.png');
    console.log(stdout);

    console.log('════════════════════════════════════════════════════════');
    console.log('\n✅ Visual inspection orchestration complete!');

  } catch (error) {
    console.error('\n✗ Visual inspection failed:', error);
    process.exit(1);
  } finally {
    await orchestrator.cleanup();
  }
}

main();
