/**
 * Task Management E2E Tests
 *
 * Tests cover:
 * - Task creation and editing
 * - Task assignment to vehicles/drivers
 * - Task priority management
 * - Task status updates
 * - AI-powered task prioritization
 * - Task filtering and search
 * - Task notifications
 */

import { test, expect } from '@playwright/test'

test.describe('Task Management Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Fleet app
    await page.goto('/')

    // Wait for app to load
    await page.waitForLoadState('networkidle')

    // Navigate to Task Management
    await page.click('text=Task Management')
    await page.waitForURL('**/tasks')
  })

  test.describe('Task CRUD Operations', () => {
    test('should display task list', async ({ page }) => {
      // Verify task list is visible
      await expect(page.locator('[data-testid="task-list"]')).toBeVisible()

      // Verify table headers
      await expect(page.locator('th:has-text("Title")')).toBeVisible()
      await expect(page.locator('th:has-text("Status")')).toBeVisible()
      await expect(page.locator('th:has-text("Priority")')).toBeVisible()
      await expect(page.locator('th:has-text("Assigned To")')).toBeVisible()
    })

    test('should create new task', async ({ page }) => {
      // Click create task button
      await page.click('button:has-text("Create Task")')

      // Fill task form
      await page.fill('[name="title"]', 'Test Task - Oil Change')
      await page.fill('[name="description"]', 'Perform oil change on Vehicle #123')

      // Select priority
      await page.selectOption('[name="priority"]', 'high')

      // Select task type
      await page.selectOption('[name="taskType"]', 'maintenance')

      // Select assigned vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.click('text=Vehicle #123')

      // Set due date
      await page.fill('[name="dueDate"]', '2025-12-31')

      // Submit form
      await page.click('button:has-text("Create")')

      // Verify success message
      await expect(page.locator('text=Task created successfully')).toBeVisible()

      // Verify task appears in list
      await expect(page.locator('text=Test Task - Oil Change')).toBeVisible()
    })

    test('should edit existing task', async ({ page }) => {
      // Click first task edit button
      await page.click('[data-testid="task-row"]:first-child button:has-text("Edit")')

      // Update title
      await page.fill('[name="title"]', 'Updated Task Title')

      // Update priority
      await page.selectOption('[name="priority"]', 'urgent')

      // Save changes
      await page.click('button:has-text("Save")')

      // Verify success message
      await expect(page.locator('text=Task updated successfully')).toBeVisible()

      // Verify changes are reflected
      await expect(page.locator('text=Updated Task Title')).toBeVisible()
      await expect(page.locator('[data-testid="priority-badge"]:has-text("Urgent")')).toBeVisible()
    })

    test('should delete task', async ({ page }) => {
      // Click delete button
      await page.click('[data-testid="task-row"]:first-child button:has-text("Delete")')

      // Confirm deletion
      await page.click('button:has-text("Confirm")')

      // Verify success message
      await expect(page.locator('text=Task deleted successfully')).toBeVisible()
    })
  })

  test.describe('Task Status Management', () => {
    test('should update task status', async ({ page }) => {
      // Click on task to open details
      await page.click('[data-testid="task-row"]:first-child')

      // Change status
      await page.click('[data-testid="status-dropdown"]')
      await page.click('text=In Progress')

      // Verify status updated
      await expect(page.locator('[data-testid="status-badge"]:has-text("In Progress")')).toBeVisible()

      // Change to completed
      await page.click('[data-testid="status-dropdown"]')
      await page.click('text=Completed')

      // Verify completion timestamp
      await expect(page.locator('[data-testid="completed-at"]')).toBeVisible()
    })

    test('should track status history', async ({ page }) => {
      // Open task details
      await page.click('[data-testid="task-row"]:first-child')

      // Open history tab
      await page.click('text=History')

      // Verify status change history
      await expect(page.locator('[data-testid="status-history"]')).toBeVisible()
      await expect(page.locator('text=Created')).toBeVisible()
    })
  })

  test.describe('Task Assignment', () => {
    test('should assign task to vehicle', async ({ page }) => {
      // Open task form
      await page.click('button:has-text("Create Task")')

      // Fill basic info
      await page.fill('[name="title"]', 'Vehicle Assignment Test')

      // Assign to vehicle
      await page.click('[data-testid="vehicle-select"]')
      await page.fill('[placeholder="Search vehicles"]', 'VEH-001')
      await page.click('text=VEH-001')

      // Create task
      await page.click('button:has-text("Create")')

      // Verify assignment
      await expect(page.locator('text=VEH-001')).toBeVisible()
    })

    test('should assign task to driver', async ({ page }) => {
      // Open task details
      await page.click('[data-testid="task-row"]:first-child')

      // Click assign driver
      await page.click('button:has-text("Assign Driver")')

      // Select driver
      await page.fill('[placeholder="Search drivers"]', 'John Doe')
      await page.click('text=John Doe')

      // Confirm assignment
      await page.click('button:has-text("Assign")')

      // Verify assignment
      await expect(page.locator('text=John Doe')).toBeVisible()
    })

    test('should reassign task', async ({ page }) => {
      // Open task
      await page.click('[data-testid="task-row"]:first-child')

      // Click reassign
      await page.click('button:has-text("Reassign")')

      // Select new assignee
      await page.click('text=Jane Smith')

      // Confirm
      await page.click('button:has-text("Confirm")')

      // Verify reassignment logged
      await page.click('text=History')
      await expect(page.locator('text=Reassigned')).toBeVisible()
    })
  })

  test.describe('Task Filtering and Search', () => {
    test('should filter tasks by status', async ({ page }) => {
      // Click status filter
      await page.click('[data-testid="filter-status"]')
      await page.click('text=Pending')

      // Verify only pending tasks shown
      const tasks = page.locator('[data-testid="task-row"]')
      const count = await tasks.count()

      for (let i = 0; i < count; i++) {
        await expect(tasks.nth(i).locator('[data-testid="status-badge"]')).toHaveText('Pending')
      }
    })

    test('should filter tasks by priority', async ({ page }) => {
      // Select priority filter
      await page.click('[data-testid="filter-priority"]')
      await page.click('text=High')

      // Verify filtering
      const tasks = page.locator('[data-testid="task-row"]')
      await expect(tasks.first().locator('[data-testid="priority-badge"]')).toContainText('High')
    })

    test('should search tasks by title', async ({ page }) => {
      // Enter search query
      await page.fill('[data-testid="task-search"]', 'oil change')

      // Verify search results
      await expect(page.locator('[data-testid="task-row"]')).toContainText('oil change', { ignoreCase: true })
    })

    test('should filter tasks by date range', async ({ page }) => {
      // Open date filter
      await page.click('[data-testid="filter-date"]')

      // Set date range
      await page.fill('[name="startDate"]', '2025-01-01')
      await page.fill('[name="endDate"]', '2025-12-31')

      // Apply filter
      await page.click('button:has-text("Apply")')

      // Verify tasks within range
      await expect(page.locator('[data-testid="task-row"]')).toBeVisible()
    })
  })

  test.describe('AI-Powered Features', () => {
    test('should use AI to prioritize tasks', async ({ page }) => {
      // Click AI prioritize button
      await page.click('button:has-text("AI Prioritize")')

      // Wait for AI processing
      await page.waitForSelector('[data-testid="ai-processing"]', { state: 'hidden', timeout: 10000 })

      // Verify tasks reordered
      await expect(page.locator('[data-testid="ai-priority-indicator"]').first()).toBeVisible()

      // Verify priority scores visible
      await expect(page.locator('[data-testid="priority-score"]')).toBeVisible()
    })

    test('should show AI task recommendations', async ({ page }) => {
      // Open recommendations panel
      await page.click('button:has-text("AI Recommendations")')

      // Verify recommendations displayed
      await expect(page.locator('[data-testid="ai-recommendations"]')).toBeVisible()
      await expect(page.locator('[data-testid="recommendation-item"]')).toHaveCount({ min: 1 })

      // Click to create recommended task
      await page.click('[data-testid="recommendation-item"]:first-child button:has-text("Create")')

      // Verify task form pre-filled
      await expect(page.locator('[name="title"]')).not.toBeEmpty()
    })

    test('should use AI to suggest task assignments', async ({ page }) => {
      // Create new task
      await page.click('button:has-text("Create Task")')
      await page.fill('[name="title"]', 'Complex Repair Job')

      // Click AI suggest assignment
      await page.click('button:has-text("AI Suggest")')

      // Wait for suggestions
      await page.waitForSelector('[data-testid="ai-suggestions"]')

      // Verify suggestions with reasoning
      await expect(page.locator('[data-testid="suggestion-reason"]').first()).toBeVisible()

      // Accept suggestion
      await page.click('[data-testid="suggestion-item"]:first-child button:has-text("Accept")')

      // Verify assignment applied
      await expect(page.locator('[data-testid="assigned-to"]')).not.toBeEmpty()
    })
  })

  test.describe('Task Notifications', () => {
    test('should show overdue task notifications', async ({ page }) => {
      // Navigate to notifications
      await page.click('[data-testid="notifications-icon"]')

      // Verify overdue notifications
      await expect(page.locator('[data-testid="notification-overdue"]')).toBeVisible()
    })

    test('should notify on task completion', async ({ page }) => {
      // Complete a task
      await page.click('[data-testid="task-row"]:first-child')
      await page.click('[data-testid="status-dropdown"]')
      await page.click('text=Completed')

      // Check notifications
      await page.click('[data-testid="notifications-icon"]')

      // Verify completion notification
      await expect(page.locator('text=Task completed')).toBeVisible()
    })
  })

  test.describe('Task Templates', () => {
    test('should create task from template', async ({ page }) => {
      // Open templates
      await page.click('button:has-text("Templates")')

      // Select template
      await page.click('[data-testid="template-item"]:has-text("Routine Maintenance")')

      // Click use template
      await page.click('button:has-text("Use Template")')

      // Verify form pre-filled
      await expect(page.locator('[name="title"]')).toHaveValue(/Routine Maintenance/)
      await expect(page.locator('[name="description"]')).not.toBeEmpty()
    })

    test('should save task as template', async ({ page }) => {
      // Create task
      await page.click('button:has-text("Create Task")')
      await page.fill('[name="title"]', 'Custom Task Template')
      await page.fill('[name="description"]', 'Template description')

      // Click save as template
      await page.click('button:has-text("Save as Template")')

      // Name template
      await page.fill('[name="templateName"]', 'My Custom Template')
      await page.click('button:has-text("Save Template")')

      // Verify template saved
      await expect(page.locator('text=Template saved successfully')).toBeVisible()
    })
  })

  test.describe('Task Export and Reporting', () => {
    test('should export tasks to CSV', async ({ page }) => {
      // Click export button
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("Export")')
      await page.click('text=Export as CSV')

      // Verify download
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
    })

    test('should generate task summary report', async ({ page }) => {
      // Open reports
      await page.click('button:has-text("Reports")')

      // Generate summary
      await page.click('text=Task Summary')

      // Verify report displays
      await expect(page.locator('[data-testid="report-total-tasks"]')).toBeVisible()
      await expect(page.locator('[data-testid="report-completed-tasks"]')).toBeVisible()
      await expect(page.locator('[data-testid="report-overdue-tasks"]')).toBeVisible()
    })
  })

  test.describe('Task Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Focus first task
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')

      // Verify task details opened
      await expect(page.locator('[data-testid="task-details"]')).toBeVisible()

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')

      // Verify selection changed
      await expect(page.locator('[data-testid="task-details"]')).toBeVisible()
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Verify main elements have aria labels
      await expect(page.locator('[data-testid="task-list"]')).toHaveAttribute('role', 'table')
      await expect(page.locator('button:has-text("Create Task")')).toHaveAttribute('aria-label')
    })
  })

  test.describe('Performance', () => {
    test('should load large task list efficiently', async ({ page }) => {
      const startTime = Date.now()

      // Navigate to tasks
      await page.goto('/tasks')
      await page.waitForSelector('[data-testid="task-list"]')

      const loadTime = Date.now() - startTime

      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle rapid task updates', async ({ page }) => {
      // Rapidly update task status
      for (let i = 0; i < 5; i++) {
        await page.click('[data-testid="task-row"]:first-child')
        await page.click('[data-testid="status-dropdown"]')
        await page.click('text=In Progress')
        await page.waitForTimeout(100)
      }

      // Verify no errors
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
    })
  })
})
