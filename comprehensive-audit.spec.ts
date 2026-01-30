import { test, expect, Page } from '@playwright/test';

/**
 * COMPREHENSIVE FLEET CTA AUDIT
 *
 * Scoring Rubric (1-100 scale):
 * - Usability: Can users complete tasks efficiently?
 * - Correctness: Does it work without errors?
 * - Industry Applicability: Does it meet fleet management industry standards?
 * - Accessibility: WCAG 2.1 AA/AAA compliance
 * - Design: Professional, modern, consistent
 * - Quality: Performance, error handling, UX polish
 *
 * Target: ALL features must score 98% or above
 */

const BASE_URL = 'http://localhost:5174';

// Scoring thresholds
const EXCELLENT = 98;
const GOOD = 90;
const NEEDS_IMPROVEMENT = 80;

interface AuditScore {
  component: string;
  usability: number;
  correctness: number;
  industryApplicability: number;
  accessibility: number;
  design: number;
  quality: number;
  overall: number;
  issues: string[];
  recommendations: string[];
}

const auditResults: AuditScore[] = [];

function calculateOverallScore(scores: Omit<AuditScore, 'overall' | 'component' | 'issues' | 'recommendations'>): number {
  const { usability, correctness, industryApplicability, accessibility, design, quality } = scores;
  return Math.round((usability + correctness + industryApplicability + accessibility + design + quality) / 6);
}

function recordAudit(audit: Omit<AuditScore, 'overall'>): void {
  const overall = calculateOverallScore(audit);
  auditResults.push({ ...audit, overall });
  console.log(`\n${'='.repeat(80)}`);
  console.log(`AUDIT: ${audit.component}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Usability:              ${audit.usability}/100`);
  console.log(`Correctness:            ${audit.correctness}/100`);
  console.log(`Industry Applicability: ${audit.industryApplicability}/100`);
  console.log(`Accessibility:          ${audit.accessibility}/100`);
  console.log(`Design:                 ${audit.design}/100`);
  console.log(`Quality:                ${audit.quality}/100`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`OVERALL SCORE:          ${overall}/100 ${overall >= EXCELLENT ? '✅ EXCELLENT' : overall >= GOOD ? '⚠️  GOOD' : '❌ NEEDS IMPROVEMENT'}`);

  if (audit.issues.length > 0) {
    console.log(`\nISSUES (${audit.issues.length}):`);
    audit.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  if (audit.recommendations.length > 0) {
    console.log(`\nRECOMMENDATIONS (${audit.recommendations.length}):`);
    audit.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`));
  }
  console.log(`${'='.repeat(80)}\n`);
}

// ============================================================================
// CONSOLIDATED HUB AUDITS
// ============================================================================

test.describe('1. FleetOperationsHub - Comprehensive Audit', () => {

  test('1.1 Fleet Tab - Functionality & Usability', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Test: Fleet tab loads and displays
    try {
      await expect(page.locator('[data-testid="hub-tab-fleet"]')).toBeVisible({ timeout: 10000 });
    } catch (e) {
      issues.push('Fleet tab not visible within 10 seconds');
      correctness -= 15;
      usability -= 10;
    }

    // Test: Fleet heading visible
    const hasFleetHeading = await page.getByRole('heading', { name: /Fleet Operations/i }).isVisible().catch(() => false);
    if (!hasFleetHeading) {
      issues.push('Fleet Operations heading not found');
      design -= 5;
    }

    // Test: Map functionality
    const hasMap = await page.locator('.leaflet-container, [class*="google-map"]').isVisible().catch(() => false);
    if (!hasMap) {
      issues.push('Map component not visible - critical feature missing');
      correctness -= 30;
      industryApplicability -= 25;
      quality -= 20;
      recommendations.push('Implement working map with vehicle tracking');
    } else {
      // Map exists - check if it's interactive
      const mapContainer = page.locator('.leaflet-container, [class*="google-map"]').first();
      const isInteractive = await mapContainer.evaluate((el) => {
        const hasMouseEvents = el.getAttribute('style')?.includes('cursor') ||
                              window.getComputedStyle(el).cursor !== 'auto';
        return hasMouseEvents;
      }).catch(() => false);

      if (!isInteractive) {
        issues.push('Map exists but may not be fully interactive');
        usability -= 10;
        quality -= 10;
      }
    }

    // Test: Vehicle stats/cards visible
    const hasStats = await page.locator('[data-testid*="stat"], .stat-card').count();
    if (hasStats === 0) {
      issues.push('No vehicle statistics displayed');
      industryApplicability -= 15;
      usability -= 10;
    } else if (hasStats < 3) {
      recommendations.push(`Only ${hasStats} stats visible - fleet management typically shows 4-6 key metrics`);
      industryApplicability -= 5;
    }

    // Test: Accessibility - ARIA labels
    const hasProperARIA = await page.locator('[aria-label]').count() > 0;
    if (!hasProperARIA) {
      issues.push('Missing ARIA labels for screen readers');
      accessibility -= 20;
      recommendations.push('Add aria-label attributes to all interactive elements');
    }

    // Test: Keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    if (!focusedElement || focusedElement === 'BODY') {
      issues.push('Keyboard navigation not working properly');
      accessibility -= 15;
      usability -= 10;
    }

    // Test: Console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      const relevantErrors = errors.filter(e =>
        !e.includes('ERR_CONNECTION_REFUSED') &&
        !e.includes('500')
      );
      if (relevantErrors.length > 0) {
        issues.push(`${relevantErrors.length} console errors detected`);
        correctness -= Math.min(20, relevantErrors.length * 5);
        quality -= Math.min(15, relevantErrors.length * 3);
      }
    }

    // Test: Design consistency - CTA branding
    const hasCTABranding = await page.locator('[class*="#0066CC"], [class*="from-[#003D5B]"]').count() > 0;
    if (!hasCTABranding) {
      issues.push('CTA brand colors not applied');
      design -= 15;
    }

    // Test: Responsive design
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile
    await page.waitForTimeout(500);
    const mobileNav = await page.locator('[data-testid="hub-tab-fleet"]').isVisible();
    if (!mobileNav) {
      issues.push('Not mobile responsive - tabs disappear on mobile');
      usability -= 20;
      design -= 15;
      recommendations.push('Implement responsive design for mobile devices');
    }
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop

    recordAudit({
      component: 'FleetOperationsHub - Fleet Tab',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  test('1.2 Drivers Tab - Full Audit', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Click Drivers tab
    try {
      await page.getByRole('tab', { name: /Drivers/i }).click();
      await page.waitForTimeout(500);
    } catch (e) {
      issues.push('Unable to click Drivers tab');
      correctness -= 20;
      usability -= 15;
    }

    // Test: Driver table/list visible
    const hasDriverList = await page.locator('table, [role="grid"], [data-testid*="driver"]').isVisible().catch(() => false);
    if (!hasDriverList) {
      issues.push('No driver list or table displayed');
      correctness -= 25;
      industryApplicability -= 20;
      recommendations.push('Implement driver management table with sorting, filtering, and search');
    }

    // Test: Driver stats
    const driverStats = await page.locator('[data-testid*="stat"]').count();
    if (driverStats < 3) {
      issues.push('Insufficient driver performance metrics');
      industryApplicability -= 15;
      recommendations.push('Display key driver KPIs: total drivers, active, compliance rate, safety score');
    }

    // Test: Search functionality
    const hasSearch = await page.locator('input[type="search"], input[placeholder*="search" i]').isVisible().catch(() => false);
    if (!hasSearch) {
      issues.push('No search functionality for drivers');
      usability -= 15;
      industryApplicability -= 10;
      recommendations.push('Add search to quickly find drivers by name, ID, or license');
    }

    // Test: Filter options
    const hasFilters = await page.locator('[role="combobox"], select, [aria-label*="filter" i]').count();
    if (hasFilters === 0) {
      issues.push('No filtering options available');
      usability -= 10;
      recommendations.push('Add filters for driver status, certification, location');
    }

    // Test: Data accuracy indicators
    const hasRefreshButton = await page.locator('button:has-text("Refresh"), button[aria-label*="refresh" i]').isVisible().catch(() => false);
    if (!hasRefreshButton) {
      recommendations.push('Add refresh button with last updated timestamp');
      quality -= 5;
    }

    recordAudit({
      component: 'FleetOperationsHub - Drivers Tab',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  // Continue with other tabs...
  test('1.3 Operations Tab - Full Audit', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('tab', { name: /Operations/i }).click();
    await page.waitForTimeout(500);

    // Operations-specific tests
    const hasRouteManagement = await page.locator('text=/route/i').first().isVisible().catch(() => false);
    if (!hasRouteManagement) {
      issues.push('Route management not visible');
      industryApplicability -= 20;
    }

    const hasTaskManagement = await page.locator('text=/task/i').first().isVisible().catch(() => false);
    if (!hasTaskManagement) {
      issues.push('Task management not visible');
      industryApplicability -= 15;
    }

    recordAudit({
      component: 'FleetOperationsHub - Operations Tab',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });
});

// ============================================================================
// MAP FUNCTIONALITY CRITICAL TEST
// ============================================================================

test.describe('2. Map Functionality - Critical Feature Audit', () => {

  test('2.1 Google Maps Integration', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for map to load

    // Test: Map container exists
    const mapVisible = await page.locator('.leaflet-container, [class*="google-map"], #map-container').isVisible({ timeout: 10000 }).catch(() => false);

    if (!mapVisible) {
      issues.push('CRITICAL: Map container not found - core feature missing');
      correctness -= 50;
      industryApplicability -= 40;
      quality -= 30;
      recommendations.push('Implement working map component using Google Maps API or Leaflet fallback');
    } else {
      // Map exists - test functionality

      // Test: Map tiles loaded
      const hasTiles = await page.locator('.leaflet-tile, [src*="maps.googleapis.com"], [src*="tile.openstreetmap.org"]').count();
      if (hasTiles === 0) {
        issues.push('Map tiles not loading');
        correctness -= 30;
        quality -= 20;
      }

      // Test: Vehicle markers
      const markerCount = await page.locator('.leaflet-marker, [class*="marker"], [title*="vehicle" i]').count();
      console.log(`Found ${markerCount} vehicle markers on map`);

      if (markerCount === 0) {
        issues.push('No vehicle markers displayed on map');
        industryApplicability -= 30;
        correctness -= 25;
        recommendations.push('Display vehicle markers with real-time positions');
      } else if (markerCount < 5) {
        recommendations.push(`Only ${markerCount} markers visible - verify all vehicles are displayed`);
        quality -= 10;
      }

      // Test: Map controls (zoom, pan, etc.)
      const hasZoomControls = await page.locator('.leaflet-control-zoom, [aria-label*="zoom"]').isVisible().catch(() => false);
      if (!hasZoomControls) {
        issues.push('Map zoom controls missing');
        usability -= 15;
      }

      // Test: Map interactivity
      const mapContainer = page.locator('.leaflet-container, [class*="google-map"]').first();
      try {
        await mapContainer.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(500);
        // If click works without error, map is interactive
      } catch (e) {
        issues.push('Map not responding to user interaction');
        usability -= 20;
        quality -= 15;
      }

      // Test: Clustering for performance
      if (markerCount > 50) {
        const hasClusters = await page.locator('.marker-cluster, [class*="cluster"]').count();
        if (hasClusters === 0) {
          issues.push(`${markerCount} markers without clustering - performance issue`);
          quality -= 15;
          recommendations.push('Implement marker clustering for better performance with many vehicles');
        }
      }
    }

    // Test: Map legend
    const hasLegend = await page.locator('[aria-label*="legend"], .map-legend, [class*="legend"]').isVisible().catch(() => false);
    if (!hasLegend) {
      recommendations.push('Add map legend to explain marker colors and icons');
      usability -= 5;
    }

    // Test: Full screen option
    const hasFullscreen = await page.locator('button[aria-label*="fullscreen"], .leaflet-control-fullscreen').isVisible().catch(() => false);
    if (!hasFullscreen) {
      recommendations.push('Add fullscreen toggle for better map viewing');
      usability -= 5;
    }

    recordAudit({
      component: 'Map Functionality (Critical)',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });
});

// ============================================================================
// UI COMPONENT QUALITY AUDITS
// ============================================================================

test.describe('3. Core UI Components Audit', () => {

  test('3.1 HubPage Component', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Test: Hub header
    const hasHeader = await page.locator('[data-testid="hub-header"]').isVisible();
    if (!hasHeader) {
      issues.push('Hub header not found');
      design -= 10;
    }

    // Test: CTA branding in header
    const headerStyle = await page.locator('[data-testid="hub-header"]').evaluate(el =>
      window.getComputedStyle(el).background
    ).catch(() => '');

    if (!headerStyle.includes('#0066CC') && !headerStyle.includes('linear-gradient')) {
      issues.push('CTA brand gradient not applied to header');
      design -= 15;
    }

    // Test: Tab navigation
    const tabCount = await page.locator('[role="tab"]').count();
    if (tabCount === 0) {
      issues.push('No tabs found');
      correctness -= 30;
    }

    // Test: Tab keyboard navigation
    await page.keyboard.press('Tab');
    const firstTab = page.getByRole('tab').first();
    await firstTab.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const focusedAfterArrow = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    if (focusedAfterArrow !== 'tab') {
      issues.push('Arrow key navigation not working for tabs');
      accessibility -= 15;
      usability -= 10;
    }

    // Test: Animation smoothness
    const hasFramerMotion = await page.locator('[data-framer-motion]').count();
    if (hasFramerMotion === 0) {
      recommendations.push('Animations not detected - verify Framer Motion is working');
      quality -= 5;
    }

    recordAudit({
      component: 'HubPage Component',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  test('3.2 StatCard Component', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    const statCards = await page.locator('[data-testid*="stat"], .stat-card, [class*="StatCard"]').count();

    if (statCards === 0) {
      issues.push('No stat cards found');
      correctness -= 30;
      industryApplicability -= 25;
    } else {
      // Check each stat card for required elements
      const firstCard = page.locator('[data-testid*="stat"], .stat-card').first();

      // Test: Has value
      const hasValue = await firstCard.locator('[class*="value"], [class*="stat-value"]').isVisible().catch(() => false);
      if (!hasValue) {
        issues.push('Stat cards missing value display');
        correctness -= 15;
      }

      // Test: Has label/title
      const hasLabel = await firstCard.locator('[class*="label"], [class*="title"]').isVisible().catch(() => false);
      if (!hasLabel) {
        issues.push('Stat cards missing labels');
        usability -= 10;
      }

      // Test: Has trend indicator
      const hasTrend = await firstCard.locator('[class*="trend"], [class*="change"], svg[class*="arrow"]').isVisible().catch(() => false);
      if (!hasTrend) {
        recommendations.push('Add trend indicators (up/down arrows) to stat cards');
        industryApplicability -= 10;
      }

      // Test: Accessible color contrast
      const cardBg = await firstCard.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textColor = await firstCard.evaluate(el => window.getComputedStyle(el).color);
      // Simplified contrast check
      if (cardBg === textColor || cardBg === 'rgba(0, 0, 0, 0)') {
        issues.push('Potential color contrast issue in stat cards');
        accessibility -= 10;
      }
    }

    recordAudit({
      component: 'StatCard Component',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });
});

// ============================================================================
// ACCESSIBILITY WCAG 2.1 AA/AAA AUDIT
// ============================================================================

test.describe('4. WCAG 2.1 Accessibility Audit', () => {

  test('4.1 Color Contrast Compliance', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // This is a simplified check - in production use axe-core or similar
    const textElements = await page.locator('p, span, h1, h2, h3, h4, h5, h6, button, a').all();

    let contrastIssues = 0;
    for (let i = 0; i < Math.min(textElements.length, 20); i++) {
      const element = textElements[i];
      const isVisible = await element.isVisible().catch(() => false);
      if (!isVisible) continue;

      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          bg: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      }).catch(() => null);

      if (!styles) continue;

      // Basic check for transparent backgrounds
      if (styles.bg === 'rgba(0, 0, 0, 0)' && styles.color.includes('rgb')) {
        // Should have a non-transparent background or parent background
        const hasOpaqueParent = await element.evaluate(el => {
          let parent = el.parentElement;
          while (parent) {
            const bg = window.getComputedStyle(parent).backgroundColor;
            if (bg !== 'rgba(0, 0, 0, 0)') return true;
            parent = parent.parentElement;
          }
          return false;
        });

        if (!hasOpaqueParent) {
          contrastIssues++;
        }
      }
    }

    if (contrastIssues > 0) {
      issues.push(`${contrastIssues} potential color contrast issues found`);
      accessibility -= Math.min(30, contrastIssues * 5);
      recommendations.push('Run full axe-core accessibility audit to identify all contrast issues');
    }

    recordAudit({
      component: 'WCAG 2.1 Color Contrast',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  test('4.2 Keyboard Navigation & Focus Management', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Test: Tab order logical
    const interactiveElements: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName + (el?.getAttribute('aria-label') ? ` [${el.getAttribute('aria-label')}]` : '');
      });
      if (focused) interactiveElements.push(focused);
    }

    if (interactiveElements.length < 5) {
      issues.push('Insufficient keyboard-accessible elements');
      accessibility -= 20;
      usability -= 15;
    }

    // Test: Focus indicators visible
    await page.keyboard.press('Tab');
    const focusOutline = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return '';
      const computed = window.getComputedStyle(el);
      return computed.outline + computed.outlineColor + computed.boxShadow;
    });

    if (!focusOutline || focusOutline.includes('none') || focusOutline.length < 10) {
      issues.push('Focus indicators not clearly visible');
      accessibility -= 25;
      usability -= 15;
      recommendations.push('Add visible focus ring to all interactive elements');
    }

    // Test: Skip to content link
    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.keyboard.press('Tab');
    const firstFocusedText = await page.evaluate(() => document.activeElement?.textContent);

    if (!firstFocusedText?.toLowerCase().includes('skip')) {
      recommendations.push('Add "Skip to main content" link as first focusable element');
      accessibility -= 10;
    }

    recordAudit({
      component: 'Keyboard Navigation & Focus',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  test('4.3 ARIA Labels & Semantic HTML', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Test: Buttons have labels
    const buttons = await page.locator('button').all();
    let unlabeledButtons = 0;

    for (const button of buttons.slice(0, 20)) {
      const hasLabel = await button.evaluate(el => {
        const ariaLabel = el.getAttribute('aria-label');
        const text = el.textContent?.trim();
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        return !!(ariaLabel || text || ariaLabelledBy);
      });

      if (!hasLabel) unlabeledButtons++;
    }

    if (unlabeledButtons > 0) {
      issues.push(`${unlabeledButtons} buttons without accessible labels`);
      accessibility -= Math.min(30, unlabeledButtons * 3);
      recommendations.push('Add aria-label to all icon-only buttons');
    }

    // Test: Images have alt text
    const images = await page.locator('img').all();
    let missingAlt = 0;

    for (const img of images) {
      const hasAlt = await img.getAttribute('alt');
      if (hasAlt === null) missingAlt++;
    }

    if (missingAlt > 0) {
      issues.push(`${missingAlt} images without alt text`);
      accessibility -= Math.min(20, missingAlt * 2);
    }

    // Test: Semantic HTML (nav, main, header, etc.)
    const hasNav = await page.locator('nav').count() > 0;
    const hasMain = await page.locator('main').count() > 0;
    const hasHeader = await page.locator('header').count() > 0;

    if (!hasNav || !hasMain || !hasHeader) {
      issues.push('Missing semantic HTML elements (nav, main, header)');
      accessibility -= 15;
      recommendations.push('Use semantic HTML5 elements for better screen reader support');
    }

    recordAudit({
      component: 'ARIA Labels & Semantic HTML',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });
});

// ============================================================================
// INDUSTRY STANDARDS COMPLIANCE
// ============================================================================

test.describe('5. Fleet Management Industry Standards', () => {

  test('5.1 Fleet Tracking & Telematics', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/fleet-hub-consolidated`);
    await page.waitForLoadState('networkidle');

    // Fleet management must have:
    // 1. Real-time vehicle tracking
    const hasRealTimeTracking = await page.locator('text=/real.?time/i, text=/live/i').count() > 0;
    if (!hasRealTimeTracking) {
      issues.push('Real-time tracking not prominently featured');
      industryApplicability -= 20;
    }

    // 2. Vehicle status indicators
    const hasStatusIndicators = await page.locator('[class*="status"], [class*="badge"]').count();
    if (hasStatusIndicators < 3) {
      issues.push('Insufficient vehicle status indicators');
      industryApplicability -= 15;
    }

    // 3. Fuel/mileage tracking
    const hasFuelTracking = await page.locator('text=/fuel/i, text=/mpg/i, text=/mileage/i').count() > 0;
    if (!hasFuelTracking) {
      issues.push('Fuel economy tracking not visible');
      industryApplicability -= 20;
      recommendations.push('Add fuel efficiency metrics and cost tracking');
    }

    // 4. Maintenance alerts
    const hasMaintenanceAlerts = await page.locator('text=/maintenance/i, text=/service/i').count() > 0;
    if (!hasMaintenanceAlerts) {
      issues.push('Maintenance management not visible');
      industryApplicability -= 15;
    }

    // 5. Driver performance
    const hasDriverMetrics = await page.locator('text=/driver/i').count() > 0;
    if (!hasDriverMetrics) {
      issues.push('Driver performance tracking not visible');
      industryApplicability -= 10;
    }

    recordAudit({
      component: 'Fleet Tracking Industry Standards',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });

  test('5.2 Compliance & Safety Features', async ({ page }) => {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let usability = 100, correctness = 100, industryApplicability = 100;
    let accessibility = 100, design = 100, quality = 100;

    await page.goto(`${BASE_URL}/safety-compliance-hub`);
    await page.waitForLoadState('networkidle');

    // Safety hub must have:
    // 1. DOT compliance tracking
    const hasDOT = await page.locator('text=/dot/i, text=/compliance/i').count() > 0;
    if (!hasDOT) {
      issues.push('DOT compliance not visible');
      industryApplicability -= 25;
    }

    // 2. Incident reporting
    const hasIncidents = await page.locator('text=/incident/i, text=/accident/i').count() > 0;
    if (!hasIncidents) {
      issues.push('Incident management not visible');
      industryApplicability -= 20;
    }

    // 3. Driver certifications
    const hasCertifications = await page.locator('text=/certification/i, text=/license/i').count() > 0;
    if (!hasCertifications) {
      issues.push('Driver certification tracking not visible');
      industryApplicability -= 15;
    }

    // 4. Vehicle inspections
    const hasInspections = await page.locator('text=/inspection/i, text=/dvir/i').count() > 0;
    if (!hasInspections) {
      issues.push('Vehicle inspection system not visible');
      industryApplicability -= 20;
      recommendations.push('Add DVIR (Driver Vehicle Inspection Report) functionality');
    }

    recordAudit({
      component: 'Compliance & Safety Industry Standards',
      usability,
      correctness,
      industryApplicability,
      accessibility,
      design,
      quality,
      issues,
      recommendations
    });
  });
});

// ============================================================================
// FINAL SUMMARY & REMEDIATION REPORT
// ============================================================================

test.afterAll(async () => {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(20) + 'COMPREHENSIVE AUDIT SUMMARY' + ' '.repeat(31) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log('\n');

  const totalComponents = auditResults.length;
  const excellentComponents = auditResults.filter(r => r.overall >= EXCELLENT).length;
  const goodComponents = auditResults.filter(r => r.overall >= GOOD && r.overall < EXCELLENT).length;
  const needsImprovementComponents = auditResults.filter(r => r.overall < GOOD).length;

  const avgScore = Math.round(auditResults.reduce((sum, r) => sum + r.overall, 0) / totalComponents);

  console.log(`Total Components Audited: ${totalComponents}`);
  console.log(`\n${'─'.repeat(80)}\n`);
  console.log(`✅ Excellent (98-100):      ${excellentComponents} (${Math.round(excellentComponents / totalComponents * 100)}%)`);
  console.log(`⚠️  Good (90-97):            ${goodComponents} (${Math.round(goodComponents / totalComponents * 100)}%)`);
  console.log(`❌ Needs Improvement (<90): ${needsImprovementComponents} (${Math.round(needsImprovementComponents / totalComponents * 100)}%)`);
  console.log(`\n${'─'.repeat(80)}\n`);
  console.log(`AVERAGE SCORE: ${avgScore}/100 ${avgScore >= EXCELLENT ? '✅' : avgScore >= GOOD ? '⚠️' : '❌'}`);
  console.log(`\n${'─'.repeat(80)}\n`);

  // Components below 98%
  const componentsToRemediate = auditResults.filter(r => r.overall < EXCELLENT);

  if (componentsToRemediate.length > 0) {
    console.log('\n🔧 COMPONENTS REQUIRING REMEDIATION (Below 98%):\n');
    componentsToRemediate.forEach((comp, i) => {
      console.log(`${i + 1}. ${comp.component}: ${comp.overall}/100`);
      console.log(`   Issues: ${comp.issues.length}, Recommendations: ${comp.recommendations.length}`);
    });
    console.log('\n');
  }

  // Top issues across all components
  const allIssues = auditResults.flatMap(r => r.issues);
  const issueFrequency: Record<string, number> = {};
  allIssues.forEach(issue => {
    const key = issue.substring(0, 50); // Group similar issues
    issueFrequency[key] = (issueFrequency[key] || 0) + 1;
  });

  const topIssues = Object.entries(issueFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (topIssues.length > 0) {
    console.log('\n🚨 TOP 10 ISSUES (by frequency):\n');
    topIssues.forEach(([issue, count], i) => {
      console.log(`${i + 1}. [${count}x] ${issue}...`);
    });
    console.log('\n');
  }

  // Save detailed report
  const report = {
    summary: {
      totalComponents,
      excellentComponents,
      goodComponents,
      needsImprovementComponents,
      averageScore: avgScore,
      timestamp: new Date().toISOString()
    },
    results: auditResults,
    topIssues: topIssues.map(([issue, count]) => ({ issue, count }))
  };

  // Write to file
  const fs = require('fs');
  fs.writeFileSync(
    'COMPREHENSIVE_AUDIT_REPORT.json',
    JSON.stringify(report, null, 2)
  );

  console.log('📊 Detailed report saved to: COMPREHENSIVE_AUDIT_REPORT.json\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(32) + 'AUDIT COMPLETE' + ' '.repeat(32) + '║');
  console.log('╚' + '═'.repeat(78) + '╝\n');
});
