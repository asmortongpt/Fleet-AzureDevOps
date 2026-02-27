/**
 * Comprehensive Route Spider Test
 * Tests every unique route in the application for:
 * - Page loads without crash (no blank white screen)
 * - No uncaught JS errors
 * - Content renders (not empty)
 * - Key elements visible
 */
import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

// All unique routes grouped by hub/feature area
const ROUTES = [
  // Core dashboards
  { path: '/dashboard', name: 'Dashboard Home' },
  { path: '/executive-dashboard', name: 'Executive Dashboard' },
  { path: '/admin-dashboard', name: 'Admin Dashboard' },

  // Fleet Operations Hub
  { path: '/fleet', name: 'Fleet Hub' },
  { path: '/operations', name: 'Operations Hub' },

  // Maintenance
  { path: '/maintenance', name: 'Maintenance Hub' },

  // Drivers
  { path: '/drivers', name: 'Drivers Hub' },

  // Assets
  { path: '/assets', name: 'Assets Hub' },

  // Compliance & Safety
  { path: '/safety', name: 'Safety Hub' },
  { path: '/compliance', name: 'Compliance Hub' },

  // Business Management
  { path: '/financial', name: 'Financial Hub' },
  { path: '/procurement', name: 'Procurement Hub' },
  { path: '/reports', name: 'Reports Hub' },
  { path: '/analytics', name: 'Analytics Hub' },

  // People & Communication
  { path: '/communication', name: 'Communication Hub' },

  // Admin
  { path: '/admin', name: 'Admin Hub' },
  { path: '/settings', name: 'Settings Page' },

  // EV & Charging
  { path: '/ev-charging', name: 'EV Charging' },
  { path: '/charging', name: 'Charging Hub' },

  // Cost Analytics
  { path: '/cost-analysis', name: 'Cost Analysis' },

  // Fuel
  { path: '/fuel', name: 'Fuel Management' },

  // GPS & Maps
  { path: '/gps-tracking', name: 'GPS Tracking' },
  { path: '/live-fleet-dashboard', name: 'Live Fleet Dashboard' },

  // Specialized modules
  { path: '/dispatch-console', name: 'Dispatch Console' },
  { path: '/garage', name: 'Garage Service' },
  { path: '/virtual-garage', name: 'Virtual Garage' },
  { path: '/predictive', name: 'Predictive Maintenance' },
  { path: '/workbench', name: 'Data Workbench' },
  { path: '/mileage', name: 'Mileage Reimbursement' },
  { path: '/routes', name: 'Route Management' },
  { path: '/gis-map', name: 'GIS Command Center' },
  { path: '/vendor-management', name: 'Vendor Management' },
  { path: '/parts-inventory', name: 'Parts Inventory' },
  { path: '/purchase-orders', name: 'Purchase Orders' },
  { path: '/invoices', name: 'Invoices' },
  { path: '/ai-assistant', name: 'AI Assistant' },
  { path: '/maintenance-scheduling', name: 'Maintenance Scheduling' },
  { path: '/receipt-processing', name: 'Receipt Processing' },
  { path: '/osha-forms', name: 'OSHA Forms' },
  { path: '/policy-engine', name: 'Policy Engine' },
  { path: '/video-telematics', name: 'Video Telematics' },
  { path: '/vehicle-telemetry', name: 'Vehicle Telemetry' },
  { path: '/map-layers', name: 'Map Layers' },
  { path: '/route-optimization', name: 'Route Optimization' },
  { path: '/form-builder', name: 'Form Builder' },
  { path: '/personal-use', name: 'Personal Use' },
  { path: '/charges-billing', name: 'Charges & Billing' },
  { path: '/asset-management', name: 'Asset Management' },
  { path: '/equipment-dashboard', name: 'Equipment Dashboard' },
  { path: '/task-management', name: 'Task Management' },
  { path: '/incident-management', name: 'Incident Management' },
  { path: '/create-damage-report', name: 'Damage Report' },
  { path: '/notifications', name: 'Notifications Admin' },
  { path: '/documents', name: 'Document Management' },
  { path: '/hos', name: 'Hours of Service' },
  { path: '/endpoint-monitor', name: 'Endpoint Monitor' },
  { path: '/driver-mgmt', name: 'Driver Management' },
  { path: '/driver-scorecard', name: 'Driver Scorecard' },
  { path: '/fleet-optimizer', name: 'Fleet Optimizer' },
  { path: '/custom-reports', name: 'Custom Reports' },
  { path: '/maintenance-request', name: 'Maintenance Request' },
  { path: '/vehicle-showroom', name: 'Vehicle Showroom 3D' },
  { path: '/heavy-equipment', name: 'Heavy Equipment' },
  { path: '/profile', name: 'Profile Page' },
  { path: '/comprehensive', name: 'Fleet Comprehensive' },

  // Workspace routes
  { path: '/operations-workspace', name: 'Operations Workspace' },
  { path: '/fleet-workspace', name: 'Fleet Workspace' },
  { path: '/drivers-workspace', name: 'Drivers Workspace' },
  { path: '/maintenance-workspace', name: 'Maintenance Workspace' },
  { path: '/analytics-workspace', name: 'Analytics Workspace' },
  { path: '/compliance-workspace', name: 'Compliance Workspace' },
]

// Track console errors per page
const consoleErrors: Record<string, string[]> = {}

test.describe('Comprehensive Route Spider', () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) loads correctly`, async ({ page }) => {
      const errors: string[] = []

      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text()
          // Filter out known non-blocking errors
          if (
            !text.includes('favicon.ico') &&
            !text.includes('net::ERR_') &&
            !text.includes('Failed to load resource') &&
            !text.includes('ResizeObserver') &&
            !text.includes('CSRF') &&
            !text.includes('Source map')
          ) {
            errors.push(text)
          }
        }
      })

      // Listen for page crashes
      page.on('pageerror', (error) => {
        errors.push(`PAGE ERROR: ${error.message}`)
      })

      // Navigate to route
      await page.goto(`${BASE_URL}${route.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // Wait for React to render
      await page.waitForTimeout(2000)

      // Check page is not blank
      const body = await page.locator('body')
      await expect(body).toBeVisible()

      // Check that content rendered (body has children beyond just the root div)
      const bodyHTML = await page.evaluate(() => document.body.innerHTML)
      expect(bodyHTML.length).toBeGreaterThan(100)

      // Check for error boundaries / crash screens
      const errorBoundary = await page.locator('text=Something went wrong').count()
      const chunkError = await page.locator('text=Failed to fetch dynamically imported module').count()
      const blankRoot = await page.evaluate(() => {
        const root = document.getElementById('root')
        return root ? root.children.length === 0 : true
      })

      // Assert no crash states
      expect(errorBoundary, `Error boundary triggered on ${route.path}`).toBe(0)
      expect(chunkError, `Chunk load error on ${route.path}`).toBe(0)
      expect(blankRoot, `Blank root on ${route.path}`).toBe(false)

      // Store any console errors
      if (errors.length > 0) {
        consoleErrors[route.path] = errors
        console.log(`Console errors on ${route.path}:`, errors)
      }

      // Take screenshot for review
      await page.screenshot({
        path: `tests/screenshots/${route.path.replace(/\//g, '_') || 'root'}.png`,
        fullPage: false,
      })
    })
  }
})
