#!/usr/bin/env tsx

/**
 * SPIDER TEST GENERATOR
 *
 * This script generates Playwright test code from inventory.json.
 * It can be used to:
 * - Generate test templates for new surfaces
 * - Create specialized test suites (e.g., only routes, only APIs)
 * - Export test cases for external tools
 * - Generate test documentation
 *
 * Usage:
 *   tsx tests/certification/spider-generator.ts
 *   tsx tests/certification/spider-generator.ts --type ui-route
 *   tsx tests/certification/spider-generator.ts --output custom-tests.spec.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface InventoryItem {
  type: string;
  testable: boolean;
  [key: string]: any;
}

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

interface GeneratorOptions {
  inventoryPath: string;
  outputPath?: string;
  itemType?: string;
  limit?: number;
  includeEvidence?: boolean;
}

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

class TestTemplateGenerator {
  /**
   * Generate test template for UI Route
   */
  static generateRouteTest(item: any, testId: string): string {
    return `
  test('Route: ${item.path} (${item.component})', async ({ page }) => {
    const evidenceDir = collector.createEvidenceDir('ui-route', '${testId}');
    const consoleLogs: string[] = [];

    try {
      // Setup console log capture
      page.on('console', (msg) => consoleLogs.push(\`[\${msg.type()}] \${msg.text()}\`));

      // Navigate
      await page.goto('${item.path}', { waitUntil: 'networkidle' });

      // Capture evidence
      await collector.captureScreenshot(page, evidenceDir, 'loaded');

      // Verify page loaded
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();

      // Save metadata
      collector.saveMetadata(evidenceDir, {
        testId: '${testId}',
        itemType: 'ui-route',
        runDate: new Date().toISOString(),
        status: 'PASS',
        evidencePaths: { screenshots: [], videos: [], traces: [], logs: [], har: [] }
      });

    } catch (error) {
      await collector.captureScreenshot(page, evidenceDir, 'error');
      throw error;
    }
  });
`;
  }

  /**
   * Generate test template for UI Tab
   */
  static generateTabTest(item: any, testId: string): string {
    return `
  test('Tab: ${item.hubName} - ${item.testId || item.tabName}', async ({ page }) => {
    const evidenceDir = collector.createEvidenceDir('ui-tab', '${testId}');

    try {
      await page.goto('/', { waitUntil: 'networkidle' });

      const tabSelector = '${item.testId ? `[data-testid="${item.testId}"]` : '[role="tab"]'}';
      const tabElement = page.locator(tabSelector).first();

      await collector.captureScreenshot(page, evidenceDir, 'before');
      await tabElement.click();
      await page.waitForTimeout(1000);
      await collector.captureScreenshot(page, evidenceDir, 'after');

      const isSelected = await tabElement.getAttribute('aria-selected');
      expect(isSelected).toBe('true');

    } catch (error) {
      await collector.captureScreenshot(page, evidenceDir, 'error');
      throw error;
    }
  });
`;
  }

  /**
   * Generate test template for UI Button
   */
  static generateButtonTest(item: any, testId: string): string {
    return `
  test('Button: ${item.buttonText || item.testId}', async ({ page }) => {
    const evidenceDir = collector.createEvidenceDir('ui-button', '${testId}');

    try {
      await page.goto('/', { waitUntil: 'networkidle' });

      const buttonSelector = '${item.testId ? `[data-testid="${item.testId}"]` : `button:has-text("${item.buttonText}")`}';
      const buttonElement = page.locator(buttonSelector).first();

      await collector.captureScreenshot(page, evidenceDir, 'before');
      await buttonElement.click();
      await page.waitForTimeout(1000);
      await collector.captureScreenshot(page, evidenceDir, 'after');

    } catch (error) {
      await collector.captureScreenshot(page, evidenceDir, 'error');
      throw error;
    }
  });
`;
  }

  /**
   * Generate test template for API Endpoint
   */
  static generateApiTest(item: any, testId: string): string {
    return `
  test('API: ${item.method} ${item.path}', async ({ request }) => {
    const evidenceDir = collector.createEvidenceDir('api-endpoint', '${testId}');

    try {
      const response = await request.fetch('${item.path}', { method: '${item.method}' });
      const body = await response.text();

      writeFileSync(join(evidenceDir, 'response.json'), body);

      expect(response.ok()).toBeTruthy();

    } catch (error) {
      writeFileSync(join(evidenceDir, 'error.txt'), String(error));
      throw error;
    }
  });
`;
  }

  /**
   * Generate test based on item type
   */
  static generateTest(item: InventoryItem, testId: string): string {
    switch (item.type) {
      case 'ui-route':
        return this.generateRouteTest(item, testId);
      case 'ui-tab':
        return this.generateTabTest(item, testId);
      case 'ui-button':
        return this.generateButtonTest(item, testId);
      case 'api-endpoint':
        return this.generateApiTest(item, testId);
      default:
        return `  // TODO: Generate test for ${item.type}\n`;
    }
  }
}

// ============================================================================
// GENERATOR
// ============================================================================

class SpiderGenerator {
  private inventory: Inventory;
  private options: GeneratorOptions;

  constructor(options: GeneratorOptions) {
    this.options = options;
    this.inventory = this.loadInventory();
  }

  /**
   * Load inventory from JSON file
   */
  private loadInventory(): Inventory {
    const data = readFileSync(this.options.inventoryPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * Filter items based on options
   */
  private filterItems(): InventoryItem[] {
    let items = this.inventory.items.filter(item => item.testable);

    if (this.options.itemType) {
      items = items.filter(item => item.type === this.options.itemType);
    }

    if (this.options.limit) {
      items = items.slice(0, this.options.limit);
    }

    return items;
  }

  /**
   * Generate test ID for item
   */
  private generateTestId(item: InventoryItem, index: number): string {
    switch (item.type) {
      case 'ui-route':
        return `route-${item.path?.replace(/\//g, '-') || index}`;
      case 'ui-tab':
        return `tab-${item.hubName}-${item.testId || index}`;
      case 'ui-button':
        return `button-${item.testId || item.buttonText || index}`;
      case 'api-endpoint':
        return `api-${item.method}-${item.path?.replace(/\//g, '-') || index}`;
      case 'ai-feature':
        return `ai-${item.featureName || index}`;
      default:
        return `item-${index}`;
    }
  }

  /**
   * Generate complete test file
   */
  generateTestFile(): string {
    const items = this.filterItems();

    const header = `/**
 * GENERATED SPIDER TESTS
 * Generated at: ${new Date().toISOString()}
 * Total items: ${items.length}
 * Filter: ${this.options.itemType || 'all'}
 */

import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Import evidence collector (assuming it's exported)
// import { EvidenceCollector } from './evidence-spider.spec';

const collector = {
  createEvidenceDir(type: string, id: string): string {
    const dir = join('./tests/certification/evidence', type, id);
    mkdirSync(dir, { recursive: true });
    return dir;
  },
  async captureScreenshot(page: any, dir: string, label: string): Promise<void> {
    await page.screenshot({ path: join(dir, \`\${label}.png\`), fullPage: true });
  },
  saveMetadata(dir: string, metadata: any): void {
    writeFileSync(join(dir, 'metadata.json'), JSON.stringify(metadata, null, 2));
  }
};

test.describe('Generated Spider Tests', () => {
`;

    const tests = items.map((item, index) => {
      const testId = this.generateTestId(item, index);
      return TestTemplateGenerator.generateTest(item, testId);
    }).join('\n');

    const footer = `
});
`;

    return header + tests + footer;
  }

  /**
   * Generate test statistics
   */
  generateStats(): string {
    const items = this.filterItems();
    const byType = items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `
# Test Generation Statistics

**Generated:** ${new Date().toISOString()}
**Filter:** ${this.options.itemType || 'all'}
**Limit:** ${this.options.limit || 'none'}

## Summary

- **Total Items:** ${items.length}
- **Total Inventory:** ${this.inventory.summary.totalItems}
- **Coverage:** ${((items.length / this.inventory.summary.totalItems) * 100).toFixed(2)}%

## By Type

${Object.entries(byType).map(([type, count]) => `- **${type}:** ${count}`).join('\n')}

## Sample Items

\`\`\`json
${JSON.stringify(items.slice(0, 3), null, 2)}
\`\`\`
`;
  }

  /**
   * Execute generation
   */
  generate(): void {
    const testCode = this.generateTestFile();
    const stats = this.generateStats();

    if (this.options.outputPath) {
      writeFileSync(this.options.outputPath, testCode);
      console.log(`✅ Generated tests: ${this.options.outputPath}`);

      const statsPath = this.options.outputPath.replace('.ts', '.md');
      writeFileSync(statsPath, stats);
      console.log(`📊 Generated stats: ${statsPath}`);
    } else {
      console.log(testCode);
      console.log('\n---\n');
      console.log(stats);
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): GeneratorOptions {
  const args = process.argv.slice(2);
  const options: GeneratorOptions = {
    inventoryPath: './tests/certification/inventory.json',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--type':
        options.itemType = args[++i];
        break;
      case '--output':
      case '-o':
        options.outputPath = args[++i];
        break;
      case '--limit':
      case '-l':
        options.limit = parseInt(args[++i], 10);
        break;
      case '--inventory':
      case '-i':
        options.inventoryPath = args[++i];
        break;
      case '--help':
      case '-h':
        console.log(`
Spider Test Generator

Usage:
  tsx spider-generator.ts [options]

Options:
  --type <type>         Filter by item type (ui-route, ui-tab, ui-button, api-endpoint)
  --output, -o <file>   Output file path
  --limit, -l <number>  Limit number of tests to generate
  --inventory, -i <file> Path to inventory.json (default: ./tests/certification/inventory.json)
  --help, -h            Show this help

Examples:
  tsx spider-generator.ts --type ui-route --output routes.spec.ts
  tsx spider-generator.ts --type api-endpoint --limit 10
  tsx spider-generator.ts --output all-tests.spec.ts
        `);
        process.exit(0);
    }
  }

  return options;
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  try {
    const options = parseArgs();
    const generator = new SpiderGenerator(options);
    generator.generate();
  } catch (error) {
    console.error('❌ Error generating tests:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for use as module
export { SpiderGenerator, TestTemplateGenerator, GeneratorOptions };
