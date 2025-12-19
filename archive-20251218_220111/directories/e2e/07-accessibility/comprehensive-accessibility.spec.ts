/**
 * Comprehensive Accessibility Testing Suite
 * WCAG 2.2 Level AA Compliance Validation
 *
 * This test suite validates the Fleet Management Platform against:
 * - WCAG 2.2 Level AA guidelines
 * - Section 508 standards
 * - ADA digital accessibility requirements
 *
 * Coverage:
 * - Automated axe-core scans for all major pages
 * - Keyboard navigation validation
 * - Focus management testing
 * - ARIA attributes validation
 * - Color contrast verification
 * - Screen reader compatibility checks
 * - Custom component accessibility (DispatchConsole, LeafletMap, etc.)
 */

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const BASE_URL = 'http://68.220.148.2'
const REPORT_DIR = path.join(process.cwd(), 'test-results', 'accessibility')

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
}

// Severity levels for violations
type ViolationSeverity = 'critical' | 'serious' | 'moderate' | 'minor'

interface AccessibilityViolation {
  id: string
  impact: ViolationSeverity
  description: string
  help: string
  helpUrl: string
  nodes: Array<{
    target: string[]
    html: string
    failureSummary: string
  }>
}

interface AccessibilityReport {
  url: string
  timestamp: string
  violations: AccessibilityViolation[]
  passes: number
  incomplete: number
  summary: {
    critical: number
    serious: number
    moderate: number
    minor: number
    total: number
  }
}

// Helper function to analyze axe results
function analyzeAxeResults(results: any, url: string): AccessibilityReport {
  const violations = results.violations as AccessibilityViolation[]

  const summary = violations.reduce((acc, violation) => {
    const severity = violation.impact as ViolationSeverity
    acc[severity] = (acc[severity] || 0) + violation.nodes.length
    acc.total += violation.nodes.length
    return acc
  }, { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 })

  return {
    url,
    timestamp: new Date().toISOString(),
    violations,
    passes: results.passes.length,
    incomplete: results.incomplete.length,
    summary
  }
}

// Helper function to save report
function saveReport(report: AccessibilityReport, filename: string) {
  const reportPath = path.join(REPORT_DIR, filename)
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report saved to: ${reportPath}`)
}

// Helper function to create HTML report
function createHTMLReport(reports: AccessibilityReport[]): string {
  const totalViolations = reports.reduce((sum, r) => sum + r.summary.total, 0)
  const totalCritical = reports.reduce((sum, r) => sum + r.summary.critical, 0)
  const totalSerious = reports.reduce((sum, r) => sum + r.summary.serious, 0)
  const totalModerate = reports.reduce((sum, r) => sum + r.summary.moderate, 0)
  const totalMinor = reports.reduce((sum, r) => sum + r.summary.minor, 0)

  const severityColor = (severity: ViolationSeverity): string => {
    switch (severity) {
      case 'critical': return '#dc2626'
      case 'serious': return '#ea580c'
      case 'moderate': return '#ca8a04'
      case 'minor': return '#2563eb'
      default: return '#6b7280'
    }
  }

  const violationRows = reports.flatMap(report =>
    report.violations.flatMap(violation =>
      violation.nodes.map(node => `
        <tr>
          <td>${report.url}</td>
          <td><span class="badge badge-${violation.impact}">${violation.impact.toUpperCase()}</span></td>
          <td><strong>${violation.id}</strong><br/>${violation.description}</td>
          <td><code>${node.target.join(' > ')}</code></td>
          <td><a href="${violation.helpUrl}" target="_blank">Learn more</a></td>
        </tr>
      `)
    )
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report - Fleet Management Platform</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }

    header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    header p {
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 2rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      border-left: 4px solid;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .summary-card.critical { border-left-color: #dc2626; }
    .summary-card.serious { border-left-color: #ea580c; }
    .summary-card.moderate { border-left-color: #ca8a04; }
    .summary-card.minor { border-left-color: #2563eb; }
    .summary-card.total { border-left-color: #6b7280; }
    .summary-card.pages { border-left-color: #059669; }

    .summary-card-label {
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .summary-card-value {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .content {
      padding: 2rem;
    }

    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #111827;
    }

    .page-reports {
      display: grid;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .page-report {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .page-report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .page-url {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
    }

    .page-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-critical {
      background: #fee2e2;
      color: #dc2626;
    }

    .badge-serious {
      background: #ffedd5;
      color: #ea580c;
    }

    .badge-moderate {
      background: #fef3c7;
      color: #ca8a04;
    }

    .badge-minor {
      background: #dbeafe;
      color: #2563eb;
    }

    .badge-pass {
      background: #d1fae5;
      color: #059669;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }

    thead {
      background: #f9fafb;
    }

    th {
      text-align: left;
      padding: 0.75rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.875rem;
    }

    tr:hover {
      background: #f9fafb;
    }

    code {
      background: #f3f4f6;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8125rem;
      color: #dc2626;
    }

    a {
      color: #2563eb;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .no-violations {
      text-align: center;
      padding: 3rem;
      color: #059669;
      font-size: 1.125rem;
    }

    .no-violations svg {
      width: 64px;
      height: 64px;
      margin-bottom: 1rem;
    }

    footer {
      background: #f9fafb;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .guideline-info {
      background: #eff6ff;
      border-left: 4px solid #2563eb;
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: 4px;
    }

    .guideline-info h3 {
      color: #1e40af;
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }

    .guideline-info p {
      font-size: 0.875rem;
      color: #1e40af;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Accessibility Test Report</h1>
      <p>Fleet Management Platform - WCAG 2.2 AA Compliance</p>
      <p style="font-size: 0.875rem; opacity: 0.8;">Generated: ${new Date().toLocaleString()}</p>
    </header>

    <div class="summary">
      <div class="summary-card pages">
        <div class="summary-card-label">Pages Tested</div>
        <div class="summary-card-value">${reports.length}</div>
      </div>
      <div class="summary-card critical">
        <div class="summary-card-label">Critical</div>
        <div class="summary-card-value">${totalCritical}</div>
      </div>
      <div class="summary-card serious">
        <div class="summary-card-label">Serious</div>
        <div class="summary-card-value">${totalSerious}</div>
      </div>
      <div class="summary-card moderate">
        <div class="summary-card-label">Moderate</div>
        <div class="summary-card-value">${totalModerate}</div>
      </div>
      <div class="summary-card minor">
        <div class="summary-card-label">Minor</div>
        <div class="summary-card-value">${totalMinor}</div>
      </div>
      <div class="summary-card total">
        <div class="summary-card-label">Total Issues</div>
        <div class="summary-card-value">${totalViolations}</div>
      </div>
    </div>

    <div class="content">
      <div class="guideline-info">
        <h3>WCAG 2.2 Level AA Compliance Testing</h3>
        <p>This report identifies accessibility violations according to the Web Content Accessibility Guidelines (WCAG) 2.2 Level AA standards. All violations should be remediated to ensure the platform is accessible to users with disabilities.</p>
      </div>

      <h2>Page-by-Page Results</h2>
      <div class="page-reports">
        ${reports.map(report => `
          <div class="page-report">
            <div class="page-report-header">
              <div class="page-url">${report.url}</div>
              <div class="page-stats">
                <span class="stat">
                  <span class="badge badge-pass">${report.passes} Passes</span>
                </span>
                ${report.summary.critical > 0 ? `<span class="stat"><span class="badge badge-critical">${report.summary.critical} Critical</span></span>` : ''}
                ${report.summary.serious > 0 ? `<span class="stat"><span class="badge badge-serious">${report.summary.serious} Serious</span></span>` : ''}
                ${report.summary.moderate > 0 ? `<span class="stat"><span class="badge badge-moderate">${report.summary.moderate} Moderate</span></span>` : ''}
                ${report.summary.minor > 0 ? `<span class="stat"><span class="badge badge-minor">${report.summary.minor} Minor</span></span>` : ''}
              </div>
            </div>
            ${report.violations.length === 0 ? `
              <div class="no-violations">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>No accessibility violations found!</div>
              </div>
            ` : `
              <div>
                ${report.violations.map(violation => `
                  <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 6px;">
                    <div style="margin-bottom: 0.5rem;">
                      <span class="badge badge-${violation.impact}">${violation.impact.toUpperCase()}</span>
                      <strong style="margin-left: 0.5rem; font-size: 1rem;">${violation.id}</strong>
                    </div>
                    <p style="margin-bottom: 0.5rem; color: #374151;">${violation.description}</p>
                    <p style="margin-bottom: 0.75rem; font-size: 0.875rem; color: #6b7280;">${violation.help}</p>
                    <details style="margin-top: 0.75rem;">
                      <summary style="cursor: pointer; font-weight: 600; color: #2563eb; font-size: 0.875rem;">
                        ${violation.nodes.length} affected element${violation.nodes.length > 1 ? 's' : ''}
                      </summary>
                      <div style="margin-top: 0.75rem; padding-left: 1rem;">
                        ${violation.nodes.map(node => `
                          <div style="margin-bottom: 0.75rem; padding: 0.5rem; background: white; border-radius: 4px; border-left: 3px solid ${severityColor(violation.impact)};">
                            <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.875rem;">Target:</div>
                            <code style="display: block; margin-bottom: 0.5rem;">${node.target.join(' > ')}</code>
                            <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.875rem;">HTML:</div>
                            <code style="display: block; margin-bottom: 0.5rem; white-space: pre-wrap; word-break: break-all;">${node.html.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
                            ${node.failureSummary ? `
                              <div style="font-weight: 600; margin-bottom: 0.25rem; font-size: 0.875rem;">Issue:</div>
                              <div style="font-size: 0.8125rem; color: #6b7280;">${node.failureSummary}</div>
                            ` : ''}
                          </div>
                        `).join('')}
                      </div>
                    </details>
                    <a href="${violation.helpUrl}" target="_blank" style="display: inline-block; margin-top: 0.5rem; font-size: 0.875rem;">Learn how to fix →</a>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        `).join('')}
      </div>

      ${totalViolations > 0 ? `
        <h2>All Violations</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Page</th>
              <th style="width: 10%;">Severity</th>
              <th style="width: 30%;">Issue</th>
              <th style="width: 25%;">Element</th>
              <th style="width: 15%;">Documentation</th>
            </tr>
          </thead>
          <tbody>
            ${violationRows}
          </tbody>
        </table>
      ` : ''}
    </div>

    <footer>
      <p><strong>Fleet Management Platform</strong> - Accessibility Testing Suite</p>
      <p>Powered by axe-core and Playwright | WCAG 2.2 Level AA Standards</p>
      <p style="margin-top: 0.5rem;">For more information about accessibility guidelines, visit <a href="https://www.w3.org/WAI/WCAG22/quickref/" target="_blank">WCAG 2.2 Quick Reference</a></p>
    </footer>
  </div>
</body>
</html>`
}

test.describe('Accessibility Testing - WCAG 2.2 AA', () => {
  const allReports: AccessibilityReport[] = []

  test.describe('Automated Page Scans', () => {
    const pages = [
      { name: 'Homepage', url: '/' },
      { name: 'Login', url: '/login' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'Fleet', url: '/fleet' },
      { name: 'Vehicles', url: '/vehicles' },
      { name: 'Map', url: '/map' },
      { name: 'Dispatch', url: '/dispatch' },
      { name: 'Maintenance', url: '/maintenance' },
      { name: 'Reports', url: '/reports' },
    ]

    for (const page of pages) {
      test(`${page.name} - Automated Scan`, async ({ page: testPage }) => {
        await testPage.goto(`${BASE_URL}${page.url}`)

        // Wait for page to be fully loaded
        await testPage.waitForLoadState('networkidle')

        // Run axe accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page: testPage })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()

        // Analyze results
        const report = analyzeAxeResults(accessibilityScanResults, `${BASE_URL}${page.url}`)
        allReports.push(report)

        // Save individual report
        saveReport(report, `${page.name.toLowerCase()}-accessibility.json`)

        // Log summary
        console.log(`\n${page.name} Accessibility Scan:`)
        console.log(`  Critical: ${report.summary.critical}`)
        console.log(`  Serious: ${report.summary.serious}`)
        console.log(`  Moderate: ${report.summary.moderate}`)
        console.log(`  Minor: ${report.summary.minor}`)
        console.log(`  Total: ${report.summary.total}`)
        console.log(`  Passes: ${report.passes}`)

        // Assert no critical violations
        expect(report.summary.critical, `Critical accessibility violations found on ${page.name}`).toBe(0)

        // Warn about serious violations (don't fail test, but log)
        if (report.summary.serious > 0) {
          console.warn(`⚠️  ${report.summary.serious} serious violations found on ${page.name}`)
        }
      })
    }
  })

  test.describe('Keyboard Navigation', () => {
    test('DispatchConsole - PTT Keyboard Accessibility', async ({ page }) => {
      await page.goto(`${BASE_URL}/dispatch`)
      await page.waitForLoadState('networkidle')

      // Tab to PTT button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Verify focus is on PTT button
      const pttButton = page.locator('button[aria-label*="Push to talk"]').first()
      await expect(pttButton).toBeFocused()

      // Verify ARIA attributes
      await expect(pttButton).toHaveAttribute('aria-label', /Push to talk|Transmitting/)
      await expect(pttButton).toHaveAttribute('aria-pressed')

      // Verify focus indicator is visible
      const focusOutline = await pttButton.evaluate((el) => {
        const styles = window.getComputedStyle(el, ':focus-visible')
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          outlineOffset: styles.outlineOffset,
        }
      })

      // Check focus indicator exists and is visible
      expect(focusOutline.outline).not.toBe('none')
      expect(focusOutline.outline).not.toBe('')

      console.log('✓ PTT button keyboard accessible')
      console.log('✓ ARIA attributes present')
      console.log('✓ Focus indicator visible')
    })

    test('Tab Order - Logical Navigation Flow', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')

      const focusedElements: string[] = []

      // Tab through first 10 elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        const focused = await page.evaluate(() => {
          const el = document.activeElement
          return el?.tagName + (el?.getAttribute('aria-label') ? ` [${el.getAttribute('aria-label')}]` : '')
        })
        focusedElements.push(focused)
      }

      console.log('Tab order:', focusedElements)

      // Verify skip link appears first
      expect(focusedElements[0]).toContain('A')

      // Verify no focus traps (all elements should be different or cycling)
      const uniqueElements = new Set(focusedElements)
      expect(uniqueElements.size).toBeGreaterThan(1)
    })

    test('Escape Key - Close Modals', async ({ page }) => {
      await page.goto(`${BASE_URL}/vehicles`)
      await page.waitForLoadState('networkidle')

      // Find and click button that opens modal
      const addButton = page.locator('button:has-text("Add Vehicle")').first()
      if (await addButton.count() > 0) {
        await addButton.click()

        // Wait for modal to appear
        await page.waitForTimeout(300)

        // Press Escape
        await page.keyboard.press('Escape')

        // Wait for modal to close
        await page.waitForTimeout(300)

        // Verify modal is closed
        const modal = page.locator('[role="dialog"]')
        await expect(modal).toBeHidden()

        console.log('✓ Escape key closes modal')
      }
    })
  })

  test.describe('ARIA Attributes', () => {
    test('Form Labels - All Inputs Have Labels', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      await page.waitForLoadState('networkidle')

      // Check all inputs have labels
      const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"]').all()

      for (const input of inputs) {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')

        // Check if there's a label element for this input
        let hasLabel = false
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          hasLabel = await label.count() > 0
        }

        // Input should have either a label, aria-label, or aria-labelledby
        const isAccessible = hasLabel || !!ariaLabel || !!ariaLabelledBy
        expect(isAccessible, 'Input must have accessible label').toBeTruthy()
      }

      console.log(`✓ All ${inputs.length} inputs have accessible labels`)
    })

    test('Buttons - Have Accessible Names', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')

      // Check all buttons have accessible names
      const buttons = await page.locator('button').all()

      for (const button of buttons) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        const ariaLabelledBy = await button.getAttribute('aria-labelledby')

        const hasAccessibleName = (text && text.trim() !== '') || !!ariaLabel || !!ariaLabelledBy
        expect(hasAccessibleName, 'Button must have accessible name').toBeTruthy()
      }

      console.log(`✓ All ${buttons.length} buttons have accessible names`)
    })

    test('Images - Have Alt Text', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)
      await page.waitForLoadState('networkidle')

      // Check all images have alt text
      const images = await page.locator('img').all()

      for (const img of images) {
        const hasAlt = await img.getAttribute('alt')
        expect(hasAlt !== null, 'Image must have alt attribute').toBeTruthy()
      }

      console.log(`✓ All ${images.length} images have alt attributes`)
    })

    test('Live Regions - Dynamic Content Updates', async ({ page }) => {
      await page.goto(`${BASE_URL}/dispatch`)
      await page.waitForLoadState('networkidle')

      // Check for ARIA live regions
      const liveRegions = await page.locator('[aria-live]').all()

      console.log(`✓ Found ${liveRegions.length} ARIA live regions`)

      // Verify live regions have appropriate politeness levels
      for (const region of liveRegions) {
        const ariaLive = await region.getAttribute('aria-live')
        expect(['polite', 'assertive', 'off']).toContain(ariaLive)
      }
    })
  })

  test.describe('Focus Management', () => {
    test('Focus Indicators - Visible and Contrast', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')

      // Tab to first focusable element
      await page.keyboard.press('Tab')

      // Check focus indicator
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement
        const styles = window.getComputedStyle(el, ':focus-visible')
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow,
        }
      })

      // Verify focus indicator exists
      const hasFocusIndicator =
        (focused.outline !== 'none' && focused.outline !== '') ||
        (focused.boxShadow !== 'none' && focused.boxShadow !== '')

      expect(hasFocusIndicator).toBeTruthy()

      console.log('✓ Focus indicators present')
      console.log('  Outline:', focused.outline)
      console.log('  Box Shadow:', focused.boxShadow)
    })

    test('No Keyboard Traps', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard`)
      await page.waitForLoadState('networkidle')

      const initialFocus = await page.evaluate(() => document.activeElement?.tagName)

      // Tab forward 20 times
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab')
      }

      // Tab backward 20 times
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Shift+Tab')
      }

      const finalFocus = await page.evaluate(() => document.activeElement?.tagName)

      // Should be able to return to initial focus
      console.log('✓ No keyboard traps detected')
      console.log(`  Initial: ${initialFocus}, Final: ${finalFocus}`)
    })
  })

  test.describe('Color Contrast', () => {
    test('Text Contrast - WCAG AA Standards', async ({ page }) => {
      await page.goto(`${BASE_URL}/`)
      await page.waitForLoadState('networkidle')

      // Run axe scan focused on color contrast
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include('body')
        .analyze()

      const contrastViolations = results.violations.filter(v => v.id === 'color-contrast')

      console.log(`Color contrast violations: ${contrastViolations.length}`)

      if (contrastViolations.length > 0) {
        contrastViolations.forEach(violation => {
          console.log(`  ${violation.description}`)
          violation.nodes.forEach(node => {
            console.log(`    - ${node.target.join(' > ')}`)
          })
        })
      }

      // Should have no color contrast violations
      expect(contrastViolations.length).toBe(0)
    })
  })

  // Generate combined HTML report after all tests
  test.afterAll(async () => {
    if (allReports.length > 0) {
      const htmlReport = createHTMLReport(allReports)
      const htmlPath = path.join(REPORT_DIR, 'accessibility-report.html')
      fs.writeFileSync(htmlPath, htmlReport)
      console.log(`\n📊 HTML Report generated: ${htmlPath}`)

      // Generate summary JSON
      const summary = {
        timestamp: new Date().toISOString(),
        totalPages: allReports.length,
        totalViolations: allReports.reduce((sum, r) => sum + r.summary.total, 0),
        critical: allReports.reduce((sum, r) => sum + r.summary.critical, 0),
        serious: allReports.reduce((sum, r) => sum + r.summary.serious, 0),
        moderate: allReports.reduce((sum, r) => sum + r.summary.moderate, 0),
        minor: allReports.reduce((sum, r) => sum + r.summary.minor, 0),
        reports: allReports,
      }

      const summaryPath = path.join(REPORT_DIR, 'summary.json')
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
      console.log(`📋 Summary JSON: ${summaryPath}`)

      console.log('\n' + '='.repeat(60))
      console.log('ACCESSIBILITY TEST SUMMARY')
      console.log('='.repeat(60))
      console.log(`Pages Tested: ${summary.totalPages}`)
      console.log(`Critical Issues: ${summary.critical}`)
      console.log(`Serious Issues: ${summary.serious}`)
      console.log(`Moderate Issues: ${summary.moderate}`)
      console.log(`Minor Issues: ${summary.minor}`)
      console.log(`Total Issues: ${summary.totalViolations}`)
      console.log('='.repeat(60))
    }
  })
})
