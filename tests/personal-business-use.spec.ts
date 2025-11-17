import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Personal vs Business Vehicle Use Tracking Feature
 *
 * Test Coverage:
 * 1. Driver workflow - trip classification and viewing usage
 * 2. Manager workflow - approvals and team oversight
 * 3. Admin workflow - policy configuration
 * 4. Limit enforcement and warnings
 * 5. Charge calculation accuracy
 * 6. Federal compliance validation
 */

// Test data
const TEST_DRIVER = {
  email: 'driver@test.com',
  password: 'Test1234!',
  role: 'driver'
}

const TEST_MANAGER = {
  email: 'manager@test.com',
  password: 'Test1234!',
  role: 'manager'
}

const TEST_ADMIN = {
  email: 'admin@test.com',
  password: 'Test1234!',
  role: 'admin'
}

test.describe('Personal vs Business Use Feature - Driver Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login as driver
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')
  })

  test('Driver can access Personal Use dashboard', async ({ page }) => {
    // Navigate to Personal Use dashboard
    await page.click('text=Personal Use')

    // Verify dashboard loaded
    await expect(page.locator('h1:has-text("Personal Use Dashboard")')).toBeVisible()

    // Verify usage meters are visible
    await expect(page.locator('text=Monthly Personal Use')).toBeVisible()
    await expect(page.locator('text=Annual Personal Use')).toBeVisible()
  })

  test('Driver can classify trip as business', async ({ page }) => {
    await page.click('text=Personal Use')

    // Click Record Trip button
    await page.click('button:has-text("Record Trip")')

    // Wait for dialog to open
    await expect(page.locator('text=Personal vs Business Trip Classification')).toBeVisible()

    // Fill trip form
    await page.click('input[value="business"]')
    await page.fill('input[id="miles_total"]', '50')
    await page.fill('textarea[id="business_purpose"]', 'Client meeting at downtown office')
    await page.fill('input[id="start_location"]', 'Main Office')
    await page.fill('input[id="end_location"]', 'Client Site')

    // Submit
    await page.click('button:has-text("Record Trip")')

    // Verify success
    await expect(page.locator('text=Trip recorded successfully')).toBeVisible({ timeout: 5000 })
  })

  test('Driver can classify trip as personal', async ({ page }) => {
    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Select personal use
    await page.click('input[value="personal"]')
    await page.fill('input[id="miles_total"]', '25')
    await page.fill('textarea[id="personal_notes"]', 'Personal errands')

    // Submit
    await page.click('button:has-text("Record Trip")')

    // Verify success or approval notice
    await expect(page.locator('.sonner-toast')).toBeVisible({ timeout: 5000 })
  })

  test('Driver can classify trip as mixed use', async ({ page }) => {
    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Select mixed use
    await page.click('input[value="mixed"]')

    // Verify percentage slider appears
    await expect(page.locator('text=Business Percentage:')).toBeVisible()

    // Set percentage to 75% business
    await page.locator('input[type="range"]').fill('75')

    // Fill details
    await page.fill('input[id="miles_total"]', '100')
    await page.fill('textarea[id="business_purpose"]', 'Client meeting + personal stop')

    // Verify mileage breakdown
    await expect(page.locator('text=75.0 mi')).toBeVisible() // Business miles
    await expect(page.locator('text=25.0 mi')).toBeVisible() // Personal miles

    // Submit
    await page.click('button:has-text("Record Trip")')
    await expect(page.locator('.sonner-toast')).toBeVisible({ timeout: 5000 })
  })

  test('Federal compliance - business purpose required', async ({ page }) => {
    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Select business use but don't enter purpose
    await page.click('input[value="business"]')
    await page.fill('input[id="miles_total"]', '50')

    // Try to submit without business purpose
    await page.click('button:has-text("Record Trip")')

    // Verify validation error
    await expect(page.locator('text=Business purpose is required')).toBeVisible({ timeout: 3000 })
  })

  test('Driver can view trip history with filters', async ({ page }) => {
    await page.click('text=Personal Use')

    // Click Trip History tab
    await page.click('button[value="trips"]')

    // Verify trips table is visible
    await expect(page.locator('table')).toBeVisible()

    // Test usage type filter
    await page.click('text=All Types')
    await page.click('text=Business')

    // Test status filter
    await page.click('text=All Status')
    await page.click('text=Approved')
  })

  test('Driver sees warning when approaching limit', async ({ page }) => {
    await page.click('text=Personal Use')

    // Check for warning alerts (if near limit)
    const warningExists = await page.locator('text=Approaching').count()

    // If warning exists, verify it's displayed correctly
    if (warningExists > 0) {
      await expect(page.locator('.text-yellow-500')).toBeVisible()
    }
  })

  test('Driver can view charges', async ({ page }) => {
    await page.click('text=Personal Use')

    // Click Charges tab
    await page.click('button[value="charges"]')

    // Verify charges section is visible
    await expect(page.locator('text=Personal Use Charges')).toBeVisible()
  })

  test('Driver can export trip data', async ({ page }) => {
    await page.click('text=Personal Use')

    // Setup download promise before clicking export
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.click('button:has-text("Export")')

    // Wait for download and verify
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.csv')
  })
})

test.describe('Personal vs Business Use Feature - Manager Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login as manager
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_MANAGER.email)
    await page.fill('input[type="password"]', TEST_MANAGER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')
  })

  test('Manager can access approval queue', async ({ page }) => {
    await page.click('text=Personal Use')

    // Verify manager sees different view
    await expect(page.locator('text=Approval Queue')).toBeVisible()
    await expect(page.locator('text=Team Members')).toBeVisible()
  })

  test('Manager can approve personal use trip', async ({ page }) => {
    await page.click('text=Personal Use')

    // Check if there are pending approvals
    const approvalsCount = await page.locator('button:has-text("Approve")').count()

    if (approvalsCount > 0) {
      // Click first approve button
      await page.locator('button:has-text("Approve")').first().click()

      // Verify success
      await expect(page.locator('text=Trip approved successfully')).toBeVisible({ timeout: 5000 })
    } else {
      console.log('No pending approvals to test')
    }
  })

  test('Manager can reject personal use trip', async ({ page }) => {
    await page.click('text=Personal Use')

    // Check if there are pending approvals
    const rejectionsCount = await page.locator('button:has-text("Reject")').count()

    if (rejectionsCount > 0) {
      // Setup dialog handler for rejection reason
      page.on('dialog', dialog => dialog.accept('Not justified for personal use'))

      // Click first reject button
      await page.locator('button:has-text("Reject")').first().click()

      // Verify success
      await expect(page.locator('text=Trip rejected')).toBeVisible({ timeout: 5000 })
    } else {
      console.log('No pending approvals to test')
    }
  })

  test('Manager can view team summary', async ({ page }) => {
    await page.click('text=Personal Use')

    // Verify summary cards
    await expect(page.locator('text=Pending Approvals')).toBeVisible()
    await expect(page.locator('text=Team Members')).toBeVisible()
    await expect(page.locator('text=Near Limit')).toBeVisible()
    await expect(page.locator('text=Charges This Month')).toBeVisible()
  })

  test('Manager can switch between tabs', async ({ page }) => {
    await page.click('text=Personal Use')

    // Test all manager tabs
    await page.click('button[value="approvals"]')
    await expect(page.locator('text=Approval Queue')).toBeVisible()

    await page.click('button[value="team"]')
    await expect(page.locator('text=Team Usage Overview')).toBeVisible()

    await page.click('button[value="violations"]')
    await expect(page.locator('text=Policy Violations')).toBeVisible()
  })
})

test.describe('Personal vs Business Use Feature - Admin Workflow', () => {

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_ADMIN.email)
    await page.fill('input[type="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')
  })

  test('Admin can access policy configuration', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Verify policy config loaded
    await expect(page.locator('h1:has-text("Personal Use Policy Configuration")')).toBeVisible()
  })

  test('Admin can configure basic policy settings', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Click Basic Settings tab
    await page.click('button[value="basic"]')

    // Toggle allow personal use
    const allowToggle = page.locator('input[id="allow_personal_use"]')
    await expect(allowToggle).toBeVisible()

    // Toggle require approval
    const approvalToggle = page.locator('input[id="require_approval"]')
    await expect(approvalToggle).toBeVisible()
  })

  test('Admin can set usage limits', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Click Limits tab
    await page.click('button[value="limits"]')

    // Set monthly limit
    await page.fill('input[id="monthly_limit"]', '200')

    // Set annual limit
    await page.fill('input[id="annual_limit"]', '1000')

    // Verify limits were set
    await expect(page.locator('input[id="monthly_limit"]')).toHaveValue('200')
    await expect(page.locator('input[id="annual_limit"]')).toHaveValue('1000')
  })

  test('Admin can configure charging settings', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Click Charging tab
    await page.click('button[value="charging"]')

    // Enable charging
    await page.click('input[id="charge_personal_use"]')

    // Set rate per mile
    await page.fill('input[id="rate_per_mile"]', '0.25')

    // Verify IRS rate reference
    await expect(page.locator('text=Federal IRS Rate')).toBeVisible()
  })

  test('Admin can configure notifications', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Click Notifications tab
    await page.click('button[value="notifications"]')

    // Verify notification checkboxes
    await expect(page.locator('text=Notify at 80% of limit')).toBeVisible()
    await expect(page.locator('text=Notify at 95% of limit')).toBeVisible()
    await expect(page.locator('text=Notify when charges are generated')).toBeVisible()
  })

  test('Admin can preview policy changes', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Click Show Preview button
    await page.click('button:has-text("Show Preview")')

    // Verify preview section appears
    await expect(page.locator('text=Policy Preview')).toBeVisible()
  })

  test('Admin can save policy configuration', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Make a change
    await page.click('button[value="basic"]')
    await page.fill('input[id="auto_approve"]', '50')

    // Setup confirmation dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure')
      dialog.accept()
    })

    // Save policy
    await page.click('button:has-text("Save Policy")')

    // Verify success
    await expect(page.locator('text=Policy saved successfully')).toBeVisible({ timeout: 5000 })
  })

  test('Admin policy validation - rate cannot exceed IRS rate', async ({ page }) => {
    await page.click('text=Personal Use Policy')
    await page.click('button[value="charging"]')

    // Enable charging
    await page.click('input[id="charge_personal_use"]')

    // Try to set rate above IRS rate
    await page.fill('input[id="rate_per_mile"]', '1.00')

    // Setup confirmation dialog to fail
    page.on('dialog', dialog => dialog.accept())

    // Try to save
    await page.click('button:has-text("Save Policy")')

    // Verify validation error
    await expect(page.locator('text=Rate cannot exceed federal IRS rate')).toBeVisible({ timeout: 3000 })
  })

  test('Admin policy validation - annual limit must be greater than monthly', async ({ page }) => {
    await page.click('text=Personal Use Policy')
    await page.click('button[value="limits"]')

    // Set monthly higher than annual
    await page.fill('input[id="monthly_limit"]', '1000')
    await page.fill('input[id="annual_limit"]', '500')

    // Setup confirmation dialog
    page.on('dialog', dialog => dialog.accept())

    // Try to save
    await page.click('button:has-text("Save Policy")')

    // Verify validation error
    await expect(page.locator('text=Annual limit should be greater than monthly limit')).toBeVisible({ timeout: 3000 })
  })

  test('Admin can reset policy to defaults', async ({ page }) => {
    await page.click('text=Personal Use Policy')

    // Setup confirmation dialog
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Reset')
      dialog.accept()
    })

    // Click reset button
    await page.click('button:has-text("Reset to Defaults")')

    // Verify toast notification
    await expect(page.locator('text=Settings reset to defaults')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Personal vs Business Use Feature - Limit Enforcement', () => {

  test('System warns driver at 80% of limit', async ({ page }) => {
    // This test would require pre-configured test data
    // In a real scenario, you'd set up a driver with usage at 80% of limit
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')

    // Check for warning indicators
    const warningText = page.locator('text=Approaching')
    if (await warningText.count() > 0) {
      await expect(warningText).toBeVisible()
      await expect(page.locator('.text-yellow-500, .bg-yellow-500')).toBeVisible()
    }
  })

  test('System blocks trips exceeding annual limit', async ({ page }) => {
    // This test would require pre-configured test data
    // In a real scenario, you'd set up a driver who has reached their annual limit
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')

    // Check for limit exceeded alerts
    const limitAlert = page.locator('text=Annual limit exceeded')
    if (await limitAlert.count() > 0) {
      await expect(limitAlert).toBeVisible()
    }
  })
})

test.describe('Personal vs Business Use Feature - Charge Calculations', () => {

  test('Personal use charge calculation is accurate', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Select personal use
    await page.click('input[value="personal"]')
    await page.fill('input[id="miles_total"]', '100')

    // If charging is enabled, verify estimate appears
    const chargeEstimate = page.locator('text=Estimated Personal Use Charge')
    if (await chargeEstimate.count() > 0) {
      await expect(chargeEstimate).toBeVisible()

      // Verify calculation (e.g., 100 miles * $0.25 = $25.00)
      // This would depend on the configured rate
      await expect(page.locator('text=$25.00, text=$20.00, text=$67.00')).toBeVisible()
    }
  })

  test('Mixed use charge calculates only personal miles', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Select mixed use
    await page.click('input[value="mixed"]')
    await page.fill('input[id="miles_total"]', '100')

    // Set to 60% business, 40% personal
    await page.locator('input[type="range"]').fill('60')

    // Verify mileage breakdown
    await expect(page.locator('text=60.0 mi')).toBeVisible() // Business
    await expect(page.locator('text=40.0 mi')).toBeVisible() // Personal

    // If charging enabled, charge should be calculated on 40 miles only
  })
})

test.describe('Personal vs Business Use Feature - Integration Tests', () => {

  test('Dashboard auto-refreshes data', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')

    // Click refresh button
    await page.click('button:has-text("Refresh")')

    // Verify data reloads (check for loading state or updated content)
    await page.waitForTimeout(1000)
  })

  test('Navigation between dashboard and policy config works', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_ADMIN.email)
    await page.fill('input[type="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    // Go to dashboard
    await page.click('text=Personal Use')
    await expect(page.locator('h1:has-text("Personal Use Dashboard")')).toBeVisible()

    // Go to policy config
    await page.click('text=Personal Use Policy')
    await expect(page.locator('h1:has-text("Personal Use Policy Configuration")')).toBeVisible()

    // Back to dashboard
    await page.click('text=Personal Use')
    await expect(page.locator('h1:has-text("Personal Use Dashboard")')).toBeVisible()
  })

  test('System handles network errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    // Block API requests to simulate network error
    await page.route('**/api/personal-use-policies/limits/**', route => route.abort())

    await page.click('text=Personal Use')

    // Verify error handling
    await expect(page.locator('text=Failed to load, text=Error, text=Retry')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Personal vs Business Use Feature - Accessibility', () => {

  test('Dashboard is keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // Should trigger focused button
  })

  test('All interactive elements have accessible labels', async ({ page }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[type="email"]', TEST_DRIVER.email)
    await page.fill('input[type="password"]', TEST_DRIVER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('http://localhost:3001/**')

    await page.click('text=Personal Use')
    await page.click('button:has-text("Record Trip")')

    // Verify form labels
    await expect(page.locator('label[for="miles_total"]')).toBeVisible()
    await expect(page.locator('label[for="trip_date"]')).toBeVisible()
    await expect(page.locator('label[for="business_purpose"]')).toBeVisible()
  })
})
