import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GATE C — FULL SURFACE DISCOVERY
 *
 * Autonomous surface enumeration test that discovers:
 * - All navigation routes (from sidebar)
 * - All interactive elements (buttons, links, forms, inputs)
 * - All workflows (form submissions, modal triggers, data operations)
 *
 * Generates comprehensive Route & Feature Map for QA validation.
 */

interface RouteData {
  id: string;
  label: string;
  section: string;
  url: string;
  discovered: boolean;
  interactiveElements: {
    buttons: number;
    links: number;
    forms: number;
    inputs: number;
    modals: number;
    dropdowns: number;
    tabs: number;
  };
  workflows: string[];
  consoleErrors: string[];
  consoleWarnings: string[];
  screenshotPath: string;
}

test('GATE C — Autonomous Surface Discovery', async ({ page }) => {
  const baseURL = 'http://localhost:5174';
  const reportPath = '/tmp/GATE-C-SURFACE-MAP.json';
  const routes: RouteData[] = [];

  // Step 1: Navigate to homepage
  await page.goto(baseURL);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // Wait for React hydration

  console.log('\n' + '='.repeat(80));
  console.log('GATE C — FULL SURFACE DISCOVERY');
  console.log('='.repeat(80));
  console.log(`Base URL: ${baseURL}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(80) + '\n');

  // Step 2: Extract all navigation items from sidebar
  const navItems = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('aside button'));
    return buttons
      .filter(btn => {
        const text = btn.textContent?.trim();
        return text && text !== 'Collapse' && text.length > 0;
      })
      .map((btn, idx) => {
        const text = btn.textContent?.trim() || '';
        const section = btn.closest('div[class*="space-y"]')?.previousElementSibling?.textContent?.trim() || 'unknown';

        return {
          index: idx,
          label: text,
          section: section,
          isVisible: btn.checkVisibility(),
          classList: btn.className
        };
      });
  });

  console.log(`✓ Discovered ${navItems.length} navigation items from sidebar\n`);

  // Step 3: Click each navigation item and collect surface data
  for (const navItem of navItems) {
    if (!navItem.isVisible) {
      console.log(`⏭️  Skipping hidden item: ${navItem.label}`);
      continue;
    }

    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🔍 Exploring: ${navItem.label} (${navItem.section})`);
    console.log(`${'─'.repeat(80)}`);

    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    try {
      // Click the navigation item
      await page.click(`aside button:has-text("${navItem.label}")`);
      await page.waitForTimeout(1500); // Wait for module to load
      await page.waitForLoadState('networkidle');

      // Capture current URL (even though it's a SPA)
      const currentURL = page.url();

      // Count interactive elements
      const interactiveElements = await page.evaluate(() => {
        const count = {
          buttons: document.querySelectorAll('main button, main [role="button"]').length,
          links: document.querySelectorAll('main a[href]').length,
          forms: document.querySelectorAll('main form').length,
          inputs: document.querySelectorAll('main input, main textarea, main select').length,
          modals: document.querySelectorAll('[role="dialog"], [role="alertdialog"]').length,
          dropdowns: document.querySelectorAll('main [role="menu"], main [role="listbox"]').length,
          tabs: document.querySelectorAll('main [role="tablist"]').length
        };

        return count;
      });

      console.log(`   Buttons: ${interactiveElements.buttons}`);
      console.log(`   Links: ${interactiveElements.links}`);
      console.log(`   Forms: ${interactiveElements.forms}`);
      console.log(`   Inputs: ${interactiveElements.inputs}`);
      console.log(`   Modals: ${interactiveElements.modals}`);
      console.log(`   Dropdowns: ${interactiveElements.dropdowns}`);
      console.log(`   Tabs: ${interactiveElements.tabs}`);

      // Detect workflows (buttons with specific action text)
      const workflows = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('main button'));
        const workflows: string[] = [];

        buttons.forEach(btn => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('add') || text.includes('create') || text.includes('new')) {
            workflows.push(`Create: ${btn.textContent?.trim()}`);
          } else if (text.includes('edit') || text.includes('update') || text.includes('modify')) {
            workflows.push(`Edit: ${btn.textContent?.trim()}`);
          } else if (text.includes('delete') || text.includes('remove')) {
            workflows.push(`Delete: ${btn.textContent?.trim()}`);
          } else if (text.includes('export') || text.includes('download')) {
            workflows.push(`Export: ${btn.textContent?.trim()}`);
          } else if (text.includes('filter') || text.includes('search')) {
            workflows.push(`Filter: ${btn.textContent?.trim()}`);
          }
        });

        return [...new Set(workflows)]; // Remove duplicates
      });

      console.log(`   Workflows detected: ${workflows.length}`);
      workflows.forEach(wf => console.log(`      - ${wf}`));

      // Take screenshot
      const screenshotFilename = `GATE-C-${navItem.label.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      const screenshotPath = `/tmp/${screenshotFilename}`;
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`   📸 Screenshot: ${screenshotPath}`);

      // Console errors/warnings
      console.log(`   Console Errors: ${consoleErrors.length}`);
      console.log(`   Console Warnings: ${consoleWarnings.length}`);

      // Add to routes collection
      routes.push({
        id: navItem.label.toLowerCase().replace(/\s+/g, '-'),
        label: navItem.label,
        section: navItem.section,
        url: currentURL,
        discovered: true,
        interactiveElements,
        workflows,
        consoleErrors: [...new Set(consoleErrors)],
        consoleWarnings: [...new Set(consoleWarnings)],
        screenshotPath
      });

    } catch (error) {
      console.log(`   ❌ ERROR: ${error}`);
      routes.push({
        id: navItem.label.toLowerCase().replace(/\s+/g, '-'),
        label: navItem.label,
        section: navItem.section,
        url: baseURL,
        discovered: false,
        interactiveElements: { buttons: 0, links: 0, forms: 0, inputs: 0, modals: 0, dropdowns: 0, tabs: 0 },
        workflows: [],
        consoleErrors: [`Failed to load: ${error}`],
        consoleWarnings: [],
        screenshotPath: ''
      });
    }
  }

  // Step 4: Write comprehensive report
  fs.writeFileSync(reportPath, JSON.stringify(routes, null, 2));

  console.log('\n' + '='.repeat(80));
  console.log('GATE C COMPLETE — SURFACE DISCOVERY SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Routes Discovered: ${routes.length}`);
  console.log(`Successfully Loaded: ${routes.filter(r => r.discovered).length}`);
  console.log(`Failed to Load: ${routes.filter(r => !r.discovered).length}`);
  console.log(`\nReport saved: ${reportPath}`);
  console.log('='.repeat(80) + '\n');

  // Generate Markdown table for human readability
  const markdownReport = generateMarkdownTable(routes);
  fs.writeFileSync('/tmp/GATE-C-SURFACE-MAP.md', markdownReport);
  console.log('📝 Markdown report: /tmp/GATE-C-SURFACE-MAP.md\n');
});

function generateMarkdownTable(routes: RouteData[]): string {
  let md = `# GATE C — ROUTE & FEATURE MAP\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n\n`;
  md += `**Total Routes:** ${routes.length}\n\n`;
  md += `---\n\n`;

  // Group by section
  const sections = ['main', 'management', 'procurement', 'communication', 'tools', 'unknown'];

  sections.forEach(section => {
    const sectionRoutes = routes.filter(r => r.section.toLowerCase() === section);
    if (sectionRoutes.length === 0) return;

    md += `## ${section.toUpperCase()} Section (${sectionRoutes.length} routes)\n\n`;
    md += `| Route | Buttons | Forms | Inputs | Workflows | Errors | Warnings | Status |\n`;
    md += `|-------|---------|-------|--------|-----------|--------|----------|--------|\n`;

    sectionRoutes.forEach(route => {
      const status = route.discovered ? '✅' : '❌';
      md += `| ${route.label} | ${route.interactiveElements.buttons} | ${route.interactiveElements.forms} | ${route.interactiveElements.inputs} | ${route.workflows.length} | ${route.consoleErrors.length} | ${route.consoleWarnings.length} | ${status} |\n`;
    });

    md += `\n`;
  });

  // Detailed workflows section
  md += `---\n\n## Detected Workflows\n\n`;
  routes.forEach(route => {
    if (route.workflows.length > 0) {
      md += `### ${route.label}\n\n`;
      route.workflows.forEach(wf => {
        md += `- ${wf}\n`;
      });
      md += `\n`;
    }
  });

  // Console errors section
  md += `---\n\n## Console Errors\n\n`;
  const routesWithErrors = routes.filter(r => r.consoleErrors.length > 0);
  if (routesWithErrors.length === 0) {
    md += `✅ No console errors detected!\n\n`;
  } else {
    routesWithErrors.forEach(route => {
      md += `### ${route.label}\n\n`;
      route.consoleErrors.forEach(err => {
        md += `- ${err}\n`;
      });
      md += `\n`;
    });
  }

  return md;
}
