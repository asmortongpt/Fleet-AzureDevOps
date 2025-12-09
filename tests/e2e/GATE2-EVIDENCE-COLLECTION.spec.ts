import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GATE 2: EVIDENCE COLLECTION (FLEET-SPECIFIC OVERRIDE)
 *
 * This test collects ALL required artifacts BEFORE any user interaction:
 * A) BEFORE screenshots at required viewports
 * B) Browser console log capture
 * C) DOM + computed CSS dumps for broken nodes
 * D) Visual comparison data
 *
 * Routes tested: / (home with module navigation)
 * Viewports: 1440x900 (desktop), 390x844 (mobile)
 */

interface Evidence {
  timestamp: string;
  route: string;
  viewport: string;
  screenshots: {
    fullPage?: string;
    viewport?: string;
  };
  console: {
    errors: string[];
    warnings: string[];
    logs: string[];
    info: string[];
  };
  network: {
    failures: Array<{
      url: string;
      method: string;
      error: string;
    }>;
    success: Array<{
      url: string;
      method: string;
      status: number;
    }>;
  };
  dom: {
    rootExists: boolean;
    rootDisplay: string;
    rootVisibility: string;
    rootOpacity: string;
    rootBoundingBox: any;
    bodyBackground: string;
    layoutStructure: {
      hasSidebar: boolean;
      hasTopNav: boolean;
      hasMainContent: boolean;
      hasFooter: boolean;
      containerClass: string;
      gridColumns: string;
    };
    componentPresence: {
      hasLogo: boolean;
      hasNavigation: boolean;
      hasTable: boolean;
      hasMap: boolean;
      hasKPIs: number;
      hasModuleContent: boolean;
    };
    computedStyles: {
      root: any;
      body: any;
      mainContainer: any;
      sidebar: any;
    };
    visibleText: string;
    htmlSnapshot: string;
  };
  pageErrors: string[];
}

test.describe('GATE 2: Fleet Evidence Collection', () => {
  const viewports = [
    { width: 1440, height: 900, name: 'desktop' },
    { width: 390, height: 844, name: 'mobile' },
  ];

  for (const viewport of viewports) {
    test(`Collect evidence for / at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      const evidence: Evidence = {
        timestamp: new Date().toISOString(),
        route: '/',
        viewport: `${viewport.width}x${viewport.height}`,
        screenshots: {},
        console: {
          errors: [],
          warnings: [],
          logs: [],
          info: [],
        },
        network: {
          failures: [],
          success: [],
        },
        dom: {
          rootExists: false,
          rootDisplay: '',
          rootVisibility: '',
          rootOpacity: '',
          rootBoundingBox: null,
          bodyBackground: '',
          layoutStructure: {
            hasSidebar: false,
            hasTopNav: false,
            hasMainContent: false,
            hasFooter: false,
            containerClass: '',
            gridColumns: '',
          },
          componentPresence: {
            hasLogo: false,
            hasNavigation: false,
            hasTable: false,
            hasMap: false,
            hasKPIs: 0,
            hasModuleContent: false,
          },
          computedStyles: {
            root: null,
            body: null,
            mainContainer: null,
            sidebar: null,
          },
          visibleText: '',
          htmlSnapshot: '',
        },
        pageErrors: [],
      };

      console.log(`\n${'='.repeat(100)}`);
      console.log(`GATE 2 EVIDENCE COLLECTION - ${viewport.name.toUpperCase()}`);
      console.log(`${'='.repeat(100)}\n`);

      // Set viewport
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      console.log(`✅ Viewport set: ${viewport.width}x${viewport.height}`);

      // Capture console messages
      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        const fullMsg = `[${type}] ${text}`;

        if (type === 'error') {
          evidence.console.errors.push(fullMsg);
          console.log(`❌ CONSOLE ERROR: ${text}`);
        } else if (type === 'warning' || type === 'warn') {
          evidence.console.warnings.push(fullMsg);
          console.log(`⚠️  CONSOLE WARN: ${text}`);
        } else if (type === 'info') {
          evidence.console.info.push(fullMsg);
        } else if (type === 'log') {
          evidence.console.logs.push(fullMsg);
        }
      });

      // Capture page errors
      page.on('pageerror', error => {
        const msg = `PAGE ERROR: ${error.message}\nStack: ${error.stack}`;
        evidence.pageErrors.push(msg);
        console.log(`❌ ${msg}`);
      });

      // Capture network
      page.on('requestfailed', request => {
        evidence.network.failures.push({
          url: request.url(),
          method: request.method(),
          error: request.failure()?.errorText || 'Unknown error',
        });
      });

      page.on('response', response => {
        if (response.status() >= 200 && response.status() < 400) {
          evidence.network.success.push({
            url: response.url(),
            method: response.request().method(),
            status: response.status(),
          });
        }
      });

      // Navigate to home route
      console.log(`\n📍 Navigating to http://localhost:5173/`);
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`✅ Page loaded`);

      // Wait for initialization
      console.log(`\n⏳ Waiting 5 seconds for initialization...`);
      await page.waitForTimeout(5000);

      // Capture screenshots BEFORE
      console.log(`\n📸 Capturing BEFORE screenshots...`);
      const evidenceDir = path.join(process.cwd(), 'test-results', 'gate2-evidence', viewport.name);
      fs.mkdirSync(evidenceDir, { recursive: true });

      const fullPagePath = path.join(evidenceDir, 'BEFORE-fullpage.png');
      await page.screenshot({ path: fullPagePath, fullPage: true });
      evidence.screenshots.fullPage = fullPagePath;
      console.log(`  ✅ Full page: ${fullPagePath}`);

      const viewportPath = path.join(evidenceDir, 'BEFORE-viewport.png');
      await page.screenshot({ path: viewportPath, fullPage: false });
      evidence.screenshots.viewport = viewportPath;
      console.log(`  ✅ Viewport: ${viewportPath}`);

      // Capture DOM analysis
      console.log(`\n🔍 Analyzing DOM and layout structure...`);
      const domData = await page.evaluate(() => {
        const root = document.getElementById('root');
        const body = document.body;

        // Root analysis
        const rootExists = !!root;
        const rootStyles = root ? window.getComputedStyle(root) : null;
        const rootBoundingBox = root?.getBoundingClientRect();

        // Layout structure analysis (Fleet-specific)
        const sidebar = document.querySelector('nav, aside, [class*="sidebar"], [role="navigation"]');
        const topNav = document.querySelector('[class*="header"], [class*="topnav"], header');
        const mainContent = document.querySelector('main, [role="main"], [class*="content"]');
        const footer = document.querySelector('footer');

        const mainContainer = document.querySelector('[class*="container"], [class*="wrapper"], main');
        const mainContainerStyles = mainContainer ? window.getComputedStyle(mainContainer) : null;

        // Component presence
        const hasLogo = !!document.querySelector('[alt*="Fleet"], img[src*="logo"]');
        const hasNavigation = !!sidebar || !!topNav;
        const hasTable = !!document.querySelector('table');
        const hasMap = !!document.querySelector('[class*="map"], #map, [id*="map"], [class*="Map"]');
        const hasKPIs = document.querySelectorAll('[class*="stat"], [class*="metric"], [class*="kpi"], [class*="card"]').length;
        const hasModuleContent = !!document.querySelector('[class*="module"], [class*="dashboard"], [class*="content"]');

        // Computed styles
        const sidebarStyles = sidebar ? window.getComputedStyle(sidebar) : null;
        const bodyStyles = window.getComputedStyle(body);

        return {
          rootExists,
          rootDisplay: rootStyles?.display || '',
          rootVisibility: rootStyles?.visibility || '',
          rootOpacity: rootStyles?.opacity || '',
          rootBoundingBox,
          bodyBackground: bodyStyles?.background || '',
          layoutStructure: {
            hasSidebar: !!sidebar,
            hasTopNav: !!topNav,
            hasMainContent: !!mainContent,
            hasFooter: !!footer,
            containerClass: mainContainer?.className || '',
            gridColumns: mainContainerStyles?.gridTemplateColumns || '',
          },
          componentPresence: {
            hasLogo,
            hasNavigation,
            hasTable,
            hasMap,
            hasKPIs,
            hasModuleContent,
          },
          computedStyles: {
            root: rootStyles ? {
              display: rootStyles.display,
              position: rootStyles.position,
              overflow: rootStyles.overflow,
              zIndex: rootStyles.zIndex,
              width: rootStyles.width,
              height: rootStyles.height,
            } : null,
            body: {
              display: bodyStyles.display,
              background: bodyStyles.background,
              margin: bodyStyles.margin,
              padding: bodyStyles.padding,
            },
            mainContainer: mainContainerStyles ? {
              display: mainContainerStyles.display,
              gridTemplateColumns: mainContainerStyles.gridTemplateColumns,
              gridTemplateRows: mainContainerStyles.gridTemplateRows,
              flexDirection: mainContainerStyles.flexDirection,
              gap: mainContainerStyles.gap,
            } : null,
            sidebar: sidebarStyles ? {
              display: sidebarStyles.display,
              width: sidebarStyles.width,
              position: sidebarStyles.position,
              zIndex: sidebarStyles.zIndex,
            } : null,
          },
          visibleText: body.innerText?.substring(0, 1000) || '',
          htmlSnapshot: document.documentElement.outerHTML.substring(0, 5000),
        };
      });

      Object.assign(evidence.dom, domData);

      // Print DOM analysis
      console.log(`\n📊 DOM ANALYSIS:`);
      console.log(`  Root exists: ${evidence.dom.rootExists ? '✅' : '❌'}`);
      console.log(`  Root display: ${evidence.dom.rootDisplay}`);
      console.log(`  Root visibility: ${evidence.dom.rootVisibility}`);
      console.log(`  Root opacity: ${evidence.dom.rootOpacity}`);
      console.log(`  Body background: ${evidence.dom.bodyBackground}`);
      console.log(`\n📐 LAYOUT STRUCTURE:`);
      console.log(`  Has sidebar: ${evidence.dom.layoutStructure.hasSidebar ? '✅' : '❌'}`);
      console.log(`  Has top nav: ${evidence.dom.layoutStructure.hasTopNav ? '✅' : '❌'}`);
      console.log(`  Has main content: ${evidence.dom.layoutStructure.hasMainContent ? '✅' : '❌'}`);
      console.log(`  Container class: ${evidence.dom.layoutStructure.containerClass}`);
      console.log(`  Grid columns: ${evidence.dom.layoutStructure.gridColumns || 'none'}`);
      console.log(`\n🧩 COMPONENT PRESENCE:`);
      console.log(`  Has logo: ${evidence.dom.componentPresence.hasLogo ? '✅' : '❌'}`);
      console.log(`  Has navigation: ${evidence.dom.componentPresence.hasNavigation ? '✅' : '❌'}`);
      console.log(`  Has table: ${evidence.dom.componentPresence.hasTable ? '✅' : '❌'}`);
      console.log(`  Has map: ${evidence.dom.componentPresence.hasMap ? '✅' : '❌'}`);
      console.log(`  KPI cards: ${evidence.dom.componentPresence.hasKPIs}`);
      console.log(`  Has module content: ${evidence.dom.componentPresence.hasModuleContent ? '✅' : '❌'}`);

      // Print console summary
      console.log(`\n📋 CONSOLE SUMMARY:`);
      console.log(`  Errors: ${evidence.console.errors.length} ${evidence.console.errors.length === 0 ? '✅' : '❌'}`);
      console.log(`  Warnings: ${evidence.console.warnings.length} ${evidence.console.warnings.length === 0 ? '✅' : '❌'}`);
      console.log(`  Info: ${evidence.console.info.length}`);
      console.log(`  Logs: ${evidence.console.logs.length}`);
      console.log(`  Page Errors: ${evidence.pageErrors.length} ${evidence.pageErrors.length === 0 ? '✅' : '❌'}`);
      console.log(`  Network Failures: ${evidence.network.failures.length}`);

      // Print errors if any
      if (evidence.console.errors.length > 0) {
        console.log(`\n❌ CONSOLE ERRORS:`);
        evidence.console.errors.forEach((err, idx) => {
          console.log(`  ${idx + 1}. ${err}`);
        });
      }

      if (evidence.console.warnings.length > 0) {
        console.log(`\n⚠️  CONSOLE WARNINGS:`);
        evidence.console.warnings.forEach((warn, idx) => {
          console.log(`  ${idx + 1}. ${warn}`);
        });
      }

      // Save evidence JSON
      const evidencePath = path.join(evidenceDir, 'EVIDENCE.json');
      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
      console.log(`\n💾 Evidence saved: ${evidencePath}`);

      console.log(`\n${'='.repeat(100)}`);
      console.log(`END EVIDENCE COLLECTION - ${viewport.name.toUpperCase()}`);
      console.log(`${'='.repeat(100)}\n`);

      // DO NOT fail the test - this is evidence collection only
      // The analysis will be done after collecting all artifacts
    });
  }
});
