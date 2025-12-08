import { test, expect , Page } from '@playwright/test'

// Test user credentials for different roles
const testUsers = {
  admin: {
    email: 'admin@fleettest.com',
    password: 'Admin123!',
    role: 'Admin'
  },
  fleetManager: {
    email: 'manager@fleettest.com',
    password: 'Manager123!',
    role: 'FleetManager'
  },
  finance: {
    email: 'finance@fleettest.com',
    password: 'Finance123!',
    role: 'Finance'
  },
  driver: {
    email: 'driver@fleettest.com',
    password: 'Driver123!',
    role: 'Driver',
    driverId: 'DRV001'
  },
  viewer: {
    email: 'viewer@fleettest.com',
    password: 'Viewer123!',
    role: 'Viewer'
  }
}

// Helper function to login
async function login(page: Page, user: typeof testUsers[keyof typeof testUsers]) {
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.locator('[data-testid="login-button"]').click()

  // Wait for successful login
  await page.waitForURL(/\/dashboard|\//, { timeout: 10000 })

  // Verify user role badge
  await expect(page.locator('[data-testid="user-role-badge"]')).toContainText(user.role)
}

test.describe('Role-Based Access Control', () => {
  test.describe('Admin Role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.admin)
    })

    test('Admin sees all features', async ({ page }) => {
      // Check main navigation items
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-vehicles"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-drivers"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-maintenance"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-fuel"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-users"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-billing"]')).toBeVisible()

      // Check admin-only features
      await page.goto('/settings')
      await expect(page.locator('[data-testid="system-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="user-management"]')).toBeVisible()
      await expect(page.locator('[data-testid="role-management"]')).toBeVisible()
      await expect(page.locator('[data-testid="audit-logs"]')).toBeVisible()
      await expect(page.locator('[data-testid="api-keys"]')).toBeVisible()
      await expect(page.locator('[data-testid="integrations"]')).toBeVisible()

      // Check full CRUD permissions on vehicles
      await page.goto('/vehicles')
      await expect(page.locator('[data-testid="add-vehicle-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="edit-vehicle-btn"]').first()).toBeVisible()
      await expect(page.locator('[data-testid="delete-vehicle-btn"]').first()).toBeVisible()

      // Check full CRUD permissions on drivers
      await page.goto('/drivers')
      await expect(page.locator('[data-testid="add-driver-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="edit-driver-btn"]').first()).toBeVisible()
      await expect(page.locator('[data-testid="delete-driver-btn"]').first()).toBeVisible()

      // Check access to financial data
      await page.goto('/reports/financial')
      await expect(page.locator('[data-testid="financial-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="cost-analysis"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-management"]')).toBeVisible()

      // Check bulk operations
      await page.goto('/vehicles')
      await page.locator('[data-testid="select-all-checkbox"]').check()
      await expect(page.locator('[data-testid="bulk-actions-bar"]')).toBeVisible()
      await expect(page.locator('[data-testid="bulk-delete"]')).toBeVisible()
      await expect(page.locator('[data-testid="bulk-export"]')).toBeVisible()
    })

    test('Admin can manage users and roles', async ({ page }) => {
      await page.goto('/users')

      // Check user list
      await expect(page.locator('[data-testid="users-table"]')).toBeVisible()

      // Add new user
      await page.locator('[data-testid="add-user-btn"]').click()
      await expect(page.locator('[data-testid="user-form"]')).toBeVisible()

      // Fill user form
      await page.fill('[data-testid="user-email"]', 'newuser@test.com')
      await page.fill('[data-testid="user-name"]', 'New User')
      await page.selectOption('[data-testid="user-role"]', 'FleetManager')
      await page.locator('[data-testid="user-permissions-vehicles-read"]').check()
      await page.locator('[data-testid="user-permissions-vehicles-write"]').check()

      // Check advanced permissions
      await page.locator('[data-testid="advanced-permissions"]').click()
      await expect(page.locator('[data-testid="permission-matrix"]')).toBeVisible()

      // Test role template application
      await page.selectOption('[data-testid="role-template"]', 'Finance')

      // Verify permissions auto-selected
      await expect(page.locator('[data-testid="user-permissions-financial-read"]')).toBeChecked()
      await expect(page.locator('[data-testid="user-permissions-financial-write"]')).toBeChecked()
      await expect(page.locator('[data-testid="user-permissions-vehicles-delete"]')).not.toBeChecked()
    })

    test('Admin can access audit logs', async ({ page }) => {
      await page.goto('/settings/audit-logs')

      // Check audit log table
      await expect(page.locator('[data-testid="audit-logs-table"]')).toBeVisible()

      // Check log entries
      const logEntries = page.locator('[data-testid="audit-log-entry"]')
      const logCount = await logEntries.count()

      if (logCount > 0) {
        const firstEntry = logEntries.first()
        await expect(firstEntry.locator('[data-testid="log-timestamp"]')).toBeVisible()
        await expect(firstEntry.locator('[data-testid="log-user"]')).toBeVisible()
        await expect(firstEntry.locator('[data-testid="log-action"]')).toBeVisible()
        await expect(firstEntry.locator('[data-testid="log-resource"]')).toBeVisible()
        await expect(firstEntry.locator('[data-testid="log-ip-address"]')).toBeVisible()
      }

      // Test log filtering
      await page.selectOption('[data-testid="log-filter-action"]', 'DELETE')
      await page.waitForTimeout(500)

      // Export logs
      await page.locator('[data-testid="export-logs"]').click()
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible()
    })
  })

  test.describe('Fleet Manager Role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.fleetManager)
    })

    test('FleetManager sees limited features', async ({ page }) => {
      // Check visible navigation items
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-vehicles"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-drivers"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-maintenance"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-fuel"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible()

      // Check hidden admin features
      await expect(page.locator('[data-testid="nav-users"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-billing"]')).not.toBeVisible()

      // Check limited settings access
      await page.goto('/settings')
      await expect(page.locator('[data-testid="personal-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible()
      await expect(page.locator('[data-testid="system-settings"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="user-management"]')).not.toBeVisible()

      // Check CRUD permissions on vehicles (can edit, not delete)
      await page.goto('/vehicles')
      await expect(page.locator('[data-testid="add-vehicle-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="edit-vehicle-btn"]').first()).toBeVisible()
      await expect(page.locator('[data-testid="delete-vehicle-btn"]').first()).not.toBeVisible()

      // Check CRUD permissions on drivers
      await page.goto('/drivers')
      await expect(page.locator('[data-testid="add-driver-btn"]')).toBeVisible()
      await expect(page.locator('[data-testid="edit-driver-btn"]').first()).toBeVisible()
      await expect(page.locator('[data-testid="delete-driver-btn"]').first()).not.toBeVisible()

      // Check limited financial data access
      await page.goto('/reports')
      await expect(page.locator('[data-testid="operational-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="financial-reports"]')).not.toBeVisible()
    })

    test('FleetManager can manage vehicle operations', async ({ page }) => {
      await page.goto('/vehicles')

      // Can add vehicles
      await page.locator('[data-testid="add-vehicle-btn"]').click()
      await expect(page.locator('[data-testid="vehicle-form"]')).toBeVisible()
      await page.locator('[data-testid="cancel-btn"]').click()

      // Can edit vehicles
      const firstVehicle = page.locator('[data-testid="vehicle-row"]').first()
      await firstVehicle.locator('[data-testid="edit-vehicle-btn"]').click()
      await expect(page.locator('[data-testid="vehicle-form"]')).toBeVisible()

      // Can update status
      await page.selectOption('[data-testid="vehicle-status"]', 'Maintenance')
      await page.locator('[data-testid="submit-vehicle"]').click()
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

      // Can schedule maintenance
      await page.goto('/maintenance')
      await page.locator('[data-testid="schedule-maintenance-btn"]').click()
      await expect(page.locator('[data-testid="maintenance-form"]')).toBeVisible()

      // Can assign drivers
      await page.goto('/drivers')
      const availableDriver = page.locator('[data-testid="driver-row"]:has([data-testid="driver-status-badge"]:has-text("Available"))').first()
      if (await availableDriver.isVisible()) {
        await availableDriver.locator('[data-testid="assign-vehicle-btn"]').click()
        await expect(page.locator('[data-testid="assign-vehicle-modal"]')).toBeVisible()
      }
    })
  })

  test.describe('Finance Role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.finance)
    })

    test('Finance sees cost-related features only', async ({ page }) => {
      // Check visible navigation items
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-fuel"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-maintenance"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-billing"]')).toBeVisible()

      // Check limited vehicle/driver access
      await expect(page.locator('[data-testid="nav-vehicles"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-drivers"]')).toBeVisible()

      // Navigate to vehicles - should be read-only
      await page.goto('/vehicles')
      await expect(page.locator('[data-testid="add-vehicle-btn"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="edit-vehicle-btn"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="delete-vehicle-btn"]')).not.toBeVisible()

      // Check financial reports access
      await page.goto('/reports/financial')
      await expect(page.locator('[data-testid="cost-analysis"]')).toBeVisible()
      await expect(page.locator('[data-testid="budget-reports"]')).toBeVisible()
      await expect(page.locator('[data-testid="expense-breakdown"]')).toBeVisible()
      await expect(page.locator('[data-testid="roi-analysis"]')).toBeVisible()

      // Check fuel cost access
      await page.goto('/fuel')
      await expect(page.locator('[data-testid="fuel-cost-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="cost-analysis-chart"]')).toBeVisible()
      await expect(page.locator('[data-testid="export-financial-report"]')).toBeVisible()

      // Cannot add fuel transactions
      await expect(page.locator('[data-testid="add-fuel-transaction"]')).not.toBeVisible()

      // Check maintenance cost access
      await page.goto('/maintenance')
      await expect(page.locator('[data-testid="maintenance-cost-summary"]')).toBeVisible()
      await expect(page.locator('[data-testid="cost-by-vehicle"]')).toBeVisible()
      await expect(page.locator('[data-testid="cost-trends"]')).toBeVisible()

      // Cannot schedule maintenance
      await expect(page.locator('[data-testid="schedule-maintenance-btn"]')).not.toBeVisible()
    })

    test('Finance can manage budgets and invoices', async ({ page }) => {
      await page.goto('/billing')

      // Check billing dashboard
      await expect(page.locator('[data-testid="billing-overview"]')).toBeVisible()
      await expect(page.locator('[data-testid="pending-invoices"]')).toBeVisible()
      await expect(page.locator('[data-testid="paid-invoices"]')).toBeVisible()
      await expect(page.locator('[data-testid="overdue-invoices"]')).toBeVisible()

      // Can view and process invoices
      const firstInvoice = page.locator('[data-testid="invoice-row"]').first()
      if (await firstInvoice.isVisible()) {
        await firstInvoice.locator('[data-testid="view-invoice"]').click()
        await expect(page.locator('[data-testid="invoice-details"]')).toBeVisible()
        await expect(page.locator('[data-testid="approve-invoice"]')).toBeVisible()
        await expect(page.locator('[data-testid="reject-invoice"]')).toBeVisible()
      }

      // Can manage budgets
      await page.goto('/billing/budgets')
      await expect(page.locator('[data-testid="budget-overview"]')).toBeVisible()
      await expect(page.locator('[data-testid="create-budget"]')).toBeVisible()

      // Create budget
      await page.locator('[data-testid="create-budget"]').click()
      await page.fill('[data-testid="budget-name"]', 'Q1 Fleet Operations')
      await page.fill('[data-testid="budget-amount"]', '50000')
      await page.selectOption('[data-testid="budget-category"]', 'Operations')
      await page.locator('[data-testid="submit-budget"]').click()
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

      // Can export financial data
      await page.locator('[data-testid="export-financial-data"]').click()
      await expect(page.locator('[data-testid="export-options"]')).toBeVisible()
      await page.locator('[data-testid="export-excel"]').click()
      await expect(page.locator('[data-testid="export-success"]')).toBeVisible()
    })
  })

  test.describe('Driver Role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.driver)
    })

    test('Driver sees own data only', async ({ page }) => {
      // Check limited navigation
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-my-vehicle"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-my-trips"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-fuel-entry"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-documents"]')).toBeVisible()

      // Should not see management features
      await expect(page.locator('[data-testid="nav-vehicles"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-drivers"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-reports"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible()

      // Check personal dashboard
      await page.goto('/dashboard')
      await expect(page.locator('[data-testid="driver-stats"]')).toBeVisible()
      await expect(page.locator('[data-testid="assigned-vehicle-card"]')).toBeVisible()
      await expect(page.locator('[data-testid="recent-trips"]')).toBeVisible()
      await expect(page.locator('[data-testid="upcoming-maintenance"]')).toBeVisible()

      // Check my vehicle page
      await page.goto('/my-vehicle')
      await expect(page.locator('[data-testid="vehicle-details"]')).toBeVisible()
      await expect(page.locator('[data-testid="vehicle-condition"]')).toBeVisible()
      await expect(page.locator('[data-testid="report-issue-btn"]')).toBeVisible()

      // Cannot edit vehicle details
      await expect(page.locator('[data-testid="edit-vehicle-btn"]')).not.toBeVisible()

      // Check my trips
      await page.goto('/my-trips')
      await expect(page.locator('[data-testid="trips-list"]')).toBeVisible()

      // Verify only own trips are shown
      const trips = await page.locator('[data-testid="trip-row"]').all()
      for (const trip of trips) {
        const driverId = await trip.getAttribute('data-driver-id')
        expect(driverId).toBe(testUsers.driver.driverId)
      }
    })

    test('Driver can submit fuel entries and reports', async ({ page }) => {
      // Submit fuel entry
      await page.goto('/fuel-entry')
      await expect(page.locator('[data-testid="fuel-entry-form"]')).toBeVisible()

      // Fill fuel entry
      await page.fill('[data-testid="fuel-date"]', '2024-01-15')
      await page.fill('[data-testid="fuel-station"]', 'Shell Station')
      await page.fill('[data-testid="fuel-gallons"]', '12.5')
      await page.fill('[data-testid="fuel-price"]', '3.45')
      await page.fill('[data-testid="fuel-odometer"]', '45678')

      // Upload receipt
      const receiptInput = page.locator('[data-testid="fuel-receipt"]')
      await receiptInput.setInputFiles({
        name: 'receipt.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })

      await page.locator('[data-testid="submit-fuel-entry"]').click()
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

      // Report vehicle issue
      await page.goto('/my-vehicle')
      await page.locator('[data-testid="report-issue-btn"]').click()
      await expect(page.locator('[data-testid="issue-form"]')).toBeVisible()

      // Fill issue report
      await page.selectOption('[data-testid="issue-type"]', 'Mechanical')
      await page.selectOption('[data-testid="issue-severity"]', 'Medium')
      await page.fill('[data-testid="issue-description"]', 'Strange noise from engine when accelerating')

      // Add photo
      const photoInput = page.locator('[data-testid="issue-photo"]')
      await photoInput.setInputFiles({
        name: 'engine-issue.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data')
      })

      await page.locator('[data-testid="submit-issue"]').click()
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Issue reported')

      // Check documents
      await page.goto('/documents')
      await expect(page.locator('[data-testid="my-documents"]')).toBeVisible()
      await expect(page.locator('[data-testid="driver-license"]')).toBeVisible()
      await expect(page.locator('[data-testid="medical-certificate"]')).toBeVisible()
      await expect(page.locator('[data-testid="training-certificates"]')).toBeVisible()
    })
  })

  test.describe('Viewer Role', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUsers.viewer)
    })

    test('Viewer has read-only access', async ({ page }) => {
      // Check navigation - all view options available
      await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-vehicles"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-drivers"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-maintenance"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-fuel"]')).toBeVisible()
      await expect(page.locator('[data-testid="nav-reports"]')).toBeVisible()

      // No admin features
      await expect(page.locator('[data-testid="nav-settings"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="nav-users"]')).not.toBeVisible()

      // Check vehicles page - no action buttons
      await page.goto('/vehicles')
      await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-vehicle-btn"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="edit-vehicle-btn"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="delete-vehicle-btn"]')).not.toBeVisible()

      // Can view details
      const firstVehicle = page.locator('[data-testid="vehicle-row"]').first()
      await firstVehicle.locator('[data-testid="view-vehicle-btn"]').click()
      await expect(page.locator('[data-testid="vehicle-details"]')).toBeVisible()

      // No edit options in details
      await expect(page.locator('[data-testid="edit-details-btn"]')).not.toBeVisible()
      await expect(page.locator('[data-testid="schedule-maintenance-btn"]')).not.toBeVisible()

      // Check drivers page - read only
      await page.goto('/drivers')
      await expect(page.locator('[data-testid="drivers-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-driver-btn"]')).not.toBeVisible()

      // Check reports - can view but not export
      await page.goto('/reports')
      await expect(page.locator('[data-testid="reports-dashboard"]')).toBeVisible()
      await expect(page.locator('[data-testid="export-report-btn"]')).not.toBeVisible()

      // Check maintenance - view only
      await page.goto('/maintenance')
      await expect(page.locator('[data-testid="maintenance-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-maintenance-btn"]')).not.toBeVisible()

      // Check fuel - view only
      await page.goto('/fuel')
      await expect(page.locator('[data-testid="fuel-transactions-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-fuel-transaction"]')).not.toBeVisible()
    })

    test('Viewer cannot perform any modifications', async ({ page }) => {
      // Try to access restricted URLs directly
      const restrictedUrls = [
        '/vehicles/new',
        '/vehicles/edit/1',
        '/drivers/new',
        '/drivers/edit/1',
        '/settings',
        '/users',
        '/api-keys'
      ]

      for (const url of restrictedUrls) {
        await page.goto(url)

        // Should either redirect or show access denied
        const currentUrl = page.url()
        const accessDenied = page.locator('[data-testid="access-denied"]')

        expect(
          !currentUrl.includes(url) || await accessDenied.isVisible()
        ).toBeTruthy()
      }

      // Try to manipulate forms via console (should be blocked by backend)
      await page.goto('/vehicles')

      // Attempt to enable disabled button via JS
      await page.evaluate(() => {
        const addBtn = document.querySelector('[data-testid="add-vehicle-btn"]')
        if (addBtn) {
          addBtn.removeAttribute('disabled')
          addBtn.style.display = 'block'
        }
      })

      // Even if button is enabled client-side, clicking should fail
      const addBtn = page.locator('[data-testid="add-vehicle-btn"]')
      if (await addBtn.isVisible()) {
        await addBtn.click()

        // Should show permission error
        await expect(page.locator('[data-testid="permission-error"]')).toBeVisible()
      }
    })
  })

  test('Permission inheritance and overrides', async ({ page }) => {
    // Login as admin to test permission system
    await login(page, testUsers.admin)
    await page.goto('/users')

    // Create custom role
    await page.locator('[data-testid="manage-roles-btn"]').click()
    await page.locator('[data-testid="create-role-btn"]').click()

    // Define custom role with mixed permissions
    await page.fill('[data-testid="role-name"]', 'Custom Operations')
    await page.fill('[data-testid="role-description"]', 'Custom role for special operations')

    // Set granular permissions
    await page.locator('[data-testid="perm-vehicles-read"]').check()
    await page.locator('[data-testid="perm-vehicles-write"]').check()
    await page.locator('[data-testid="perm-vehicles-delete"]').uncheck()

    await page.locator('[data-testid="perm-drivers-read"]').check()
    await page.locator('[data-testid="perm-drivers-write"]').uncheck()

    await page.locator('[data-testid="perm-maintenance-read"]').check()
    await page.locator('[data-testid="perm-maintenance-write"]').check()

    await page.locator('[data-testid="perm-fuel-read"]').check()
    await page.locator('[data-testid="perm-fuel-write"]').uncheck()

    await page.locator('[data-testid="perm-reports-read"]').check()
    await page.locator('[data-testid="perm-reports-export"]').uncheck()

    // Save role
    await page.locator('[data-testid="save-role"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Role created')

    // Assign role to user
    await page.locator('[data-testid="add-user-btn"]').click()
    await page.fill('[data-testid="user-email"]', 'customops@test.com')
    await page.fill('[data-testid="user-name"]', 'Custom Ops User')
    await page.selectOption('[data-testid="user-role"]', 'Custom Operations')

    // Test permission override
    await page.locator('[data-testid="permission-overrides"]').click()

    // Override to add delete permission for specific resource
    await page.locator('[data-testid="add-override"]').click()
    await page.selectOption('[data-testid="override-resource"]', 'Vehicle-123')
    await page.locator('[data-testid="override-perm-delete"]').check()

    await page.locator('[data-testid="save-user"]').click()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('User created')
  })
})