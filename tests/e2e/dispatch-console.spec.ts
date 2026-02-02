/**
 * Dispatch Console E2E Tests
 *
 * Tests cover:
 * - WebSocket connection and real-time audio
 * - Push-to-talk (PTT) functionality
 * - Multi-channel support
 * - Emergency alerts
 * - Live transcription
 * - Transmission history
 * - Audio level visualization
 * - Active listener tracking
 */

import { test, expect } from '@playwright/test'

test.describe('Dispatch Console', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to Dispatch Console
    await page.click('text=Dispatch Console')
    await page.waitForURL('**/dispatch')
  })

  test.describe('Console Initialization', () => {
    test('should display dispatch console interface', async ({ page }) => {
      // Verify main components visible
      await expect(page.locator('[data-testid="dispatch-console"]')).toBeVisible()
      await expect(page.locator('[data-testid="channel-list"]')).toBeVisible()
      await expect(page.locator('[data-testid="ptt-button"]')).toBeVisible()
      await expect(page.locator('[data-testid="emergency-panel"]')).toBeVisible()
    })

    test('should load available channels', async ({ page }) => {
      // Wait for channels to load
      await page.waitForSelector('[data-testid="channel-item"]')

      // Verify at least one channel exists
      const channels = page.locator('[data-testid="channel-item"]')
      await expect(channels).toHaveCount({ min: 1 })

      // Verify channel details
      await expect(channels.first().locator('[data-testid="channel-name"]')).toBeVisible()
      await expect(channels.first().locator('[data-testid="channel-status"]')).toBeVisible()
    })

    test('should show connection status indicator', async ({ page }) => {
      // Verify connection indicator
      await expect(page.locator('[data-testid="connection-status"]')).toBeVisible()

      // Should show connecting or connected
      const statusText = await page.locator('[data-testid="connection-status"]').textContent()
      expect(statusText).toMatch(/connected|connecting/i)
    })
  })

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection', async ({ page }) => {
      // Wait for WebSocket connection
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', { timeout: 10000 })

      // Verify connection established
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/Connected/i)
    })

    test('should handle connection errors gracefully', async ({ page }) => {
      // Simulate connection failure by going offline
      await page.context().setOffline(true)

      // Wait for error state
      await page.waitForSelector('[data-testid="connection-error"]', { timeout: 5000 })

      // Verify error message displayed
      await expect(page.locator('[data-testid="connection-error"]')).toBeVisible()

      // Go back online
      await page.context().setOffline(false)

      // Should reconnect
      await expect(page.locator('[data-testid="connection-status"]:has-text("Connected")')).toBeVisible({ timeout: 10000 })
    })

    test('should auto-reconnect on disconnection', async ({ page }) => {
      // Verify connected
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Simulate disconnect
      await page.evaluate(() => {
        // Force close WebSocket
        const ws = (window as any).__testWs
        if (ws) ws.close()
      })

      // Should show reconnecting
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/Reconnecting/i)

      // Should reconnect
      await expect(page.locator('[data-testid="connection-status"]:has-text("Connected")')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Channel Management', () => {
    test('should select channel', async ({ page }) => {
      // Click first channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Verify channel selected
      await expect(page.locator('[data-testid="channel-item"]:first-child')).toHaveClass(/selected|active/)

      // Verify channel details displayed
      await expect(page.locator('[data-testid="channel-details"]')).toBeVisible()
    })

    test('should display channel information', async ({ page }) => {
      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Verify channel info
      await expect(page.locator('[data-testid="channel-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="channel-type"]')).toBeVisible()
      await expect(page.locator('[data-testid="channel-priority"]')).toBeVisible()
    })

    test('should show active listeners count', async ({ page }) => {
      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Verify listener count
      await expect(page.locator('[data-testid="active-listeners"]')).toBeVisible()
      const listenerText = await page.locator('[data-testid="active-listeners"]').textContent()
      expect(listenerText).toMatch(/\d+ listener/)
    })

    test('should filter channels by type', async ({ page }) => {
      // Open filter
      await page.click('[data-testid="channel-filter"]')

      // Select emergency channels only
      await page.click('text=Emergency')

      // Verify filtered results
      const channels = page.locator('[data-testid="channel-item"]')
      const count = await channels.count()

      for (let i = 0; i < count; i++) {
        await expect(channels.nth(i)).toContainText('Emergency')
      }
    })
  })

  test.describe('Push-to-Talk (PTT) Functionality', () => {
    test('should enable PTT on button press', async ({ page }) => {
      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Request microphone permission (mock)
      await page.context().grantPermissions(['microphone'])

      // Press PTT button
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mousedown')

      // Verify transmitting state
      await expect(page.locator('[data-testid="ptt-button"]')).toHaveClass(/transmitting|active/)
      await expect(page.locator('[data-testid="transmission-indicator"]')).toBeVisible()

      // Release PTT button
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mouseup')

      // Verify stopped transmitting
      await expect(page.locator('[data-testid="ptt-button"]')).not.toHaveClass(/transmitting|active/)
    })

    test('should show audio level during transmission', async ({ page }) => {
      // Grant permissions
      await page.context().grantPermissions(['microphone'])

      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Start transmission
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mousedown')

      // Verify audio level indicator visible
      await expect(page.locator('[data-testid="audio-level"]')).toBeVisible()

      // End transmission
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mouseup')
    })

    test('should use keyboard shortcut for PTT', async ({ page }) => {
      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Grant permissions
      await page.context().grantPermissions(['microphone'])

      // Press spacebar to transmit
      await page.keyboard.down('Space')

      // Verify transmitting
      await expect(page.locator('[data-testid="transmission-indicator"]')).toBeVisible()

      // Release spacebar
      await page.keyboard.up('Space')

      // Verify stopped
      await expect(page.locator('[data-testid="transmission-indicator"]')).not.toBeVisible()
    })

    test('should prevent simultaneous transmissions', async ({ page }) => {
      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Simulate another user transmitting
      await page.evaluate(() => {
        const event = new CustomEvent('transmissionStarted', {
          detail: { userId: 999, channelId: 1 }
        })
        window.dispatchEvent(event)
      })

      // Try to transmit
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mousedown')

      // Verify blocked
      await expect(page.locator('[data-testid="channel-busy-warning"]')).toBeVisible()
    })
  })

  test.describe('Transmission History', () => {
    test('should display transmission history', async ({ page }) => {
      // Open history panel
      await page.click('[data-testid="history-tab"]')

      // Verify history list
      await expect(page.locator('[data-testid="transmission-history"]')).toBeVisible()

      // Verify transmission items
      const items = page.locator('[data-testid="transmission-item"]')
      await expect(items).toHaveCount({ min: 0 })
    })

    test('should show transmission details', async ({ page }) => {
      // Open history
      await page.click('[data-testid="history-tab"]')

      // Click first transmission
      await page.click('[data-testid="transmission-item"]:first-child')

      // Verify details displayed
      await expect(page.locator('[data-testid="transmission-user"]')).toBeVisible()
      await expect(page.locator('[data-testid="transmission-timestamp"]')).toBeVisible()
      await expect(page.locator('[data-testid="transmission-duration"]')).toBeVisible()
    })

    test('should playback recorded transmission', async ({ page }) => {
      // Open history
      await page.click('[data-testid="history-tab"]')

      // Click play button
      await page.click('[data-testid="transmission-item"]:first-child [data-testid="play-button"]')

      // Verify playback started
      await expect(page.locator('[data-testid="playback-progress"]')).toBeVisible()

      // Stop playback
      await page.click('[data-testid="stop-button"]')

      // Verify stopped
      await expect(page.locator('[data-testid="playback-progress"]')).not.toBeVisible()
    })

    test('should display transcription', async ({ page }) => {
      // Open history
      await page.click('[data-testid="history-tab"]')

      // Select transmission with transcription
      await page.click('[data-testid="transmission-item"]:has([data-testid="transcription-badge"])')

      // Verify transcription visible
      await expect(page.locator('[data-testid="transcription-text"]')).toBeVisible()

      // Verify confidence score
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible()
    })
  })

  test.describe('Emergency Alerts', () => {
    test('should display emergency alerts', async ({ page }) => {
      // Verify emergency panel
      await expect(page.locator('[data-testid="emergency-panel"]')).toBeVisible()

      // Check for active alerts
      const alerts = page.locator('[data-testid="emergency-alert"]')
      const count = await alerts.count()

      if (count > 0) {
        // Verify alert details
        await expect(alerts.first().locator('[data-testid="alert-type"]')).toBeVisible()
        await expect(alerts.first().locator('[data-testid="alert-status"]')).toBeVisible()
      }
    })

    test('should trigger emergency alert', async ({ page }) => {
      // Click emergency button
      await page.click('[data-testid="emergency-button"]')

      // Select alert type
      await page.click('text=Officer Down')

      // Add description
      await page.fill('[name="alertDescription"]', 'Test emergency alert')

      // Submit alert
      await page.click('button:has-text("Send Alert")')

      // Verify alert created
      await expect(page.locator('text=Emergency alert sent')).toBeVisible()

      // Verify alert appears in panel
      await expect(page.locator('[data-testid="emergency-alert"]:has-text("Officer Down")')).toBeVisible()
    })

    test('should acknowledge emergency alert', async ({ page }) => {
      // Assuming alert exists
      const alert = page.locator('[data-testid="emergency-alert"]:first-child')

      // Click acknowledge
      await alert.locator('button:has-text("Acknowledge")').click()

      // Verify acknowledged
      await expect(alert.locator('[data-testid="alert-status"]')).toHaveText(/Acknowledged/i)
    })

    test('should resolve emergency alert', async ({ page }) => {
      // Find active alert
      const alert = page.locator('[data-testid="emergency-alert"]:first-child')

      // Click resolve
      await alert.locator('button:has-text("Resolve")').click()

      // Add resolution notes
      await page.fill('[name="resolutionNotes"]', 'Situation resolved')

      // Confirm resolution
      await page.click('button:has-text("Confirm")')

      // Verify resolved
      await expect(alert.locator('[data-testid="alert-status"]')).toHaveText(/Resolved/i)
    })

    test('should highlight priority alerts', async ({ page }) => {
      // Emergency alerts should be visually distinct
      const highPriorityAlert = page.locator('[data-testid="emergency-alert"][data-priority="high"]')

      if (await highPriorityAlert.count() > 0) {
        // Verify visual styling
        await expect(highPriorityAlert.first()).toHaveClass(/high-priority|urgent|critical/)
      }
    })
  })

  test.describe('Live Transcription', () => {
    test('should enable live transcription', async ({ page }) => {
      // Toggle transcription
      await page.click('[data-testid="transcription-toggle"]')

      // Verify enabled
      await expect(page.locator('[data-testid="transcription-panel"]')).toBeVisible()
    })

    test('should display real-time transcription', async ({ page }) => {
      // Enable transcription
      await page.click('[data-testid="transcription-toggle"]')

      // Grant permissions
      await page.context().grantPermissions(['microphone'])

      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Start transmission
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mousedown')

      // Simulate transcription update
      await page.evaluate(() => {
        const event = new CustomEvent('transcriptionUpdate', {
          detail: { text: 'Test transcription text', confidence: 0.95 }
        })
        window.dispatchEvent(event)
      })

      // Verify transcription displayed
      await expect(page.locator('[data-testid="live-transcription"]')).toContainText('Test transcription')

      // Stop transmission
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mouseup')
    })

    test('should show transcription confidence', async ({ page }) => {
      // Open history with transcription
      await page.click('[data-testid="history-tab"]')

      // Select item with transcription
      const itemWithTranscript = page.locator('[data-testid="transmission-item"]:has([data-testid="transcription-badge"])')

      if (await itemWithTranscript.count() > 0) {
        await itemWithTranscript.first().click()

        // Verify confidence score
        const confidence = page.locator('[data-testid="confidence-score"]')
        await expect(confidence).toBeVisible()

        // Should be percentage
        const scoreText = await confidence.textContent()
        expect(scoreText).toMatch(/\d+%/)
      }
    })
  })

  test.describe('Audio Controls', () => {
    test('should mute/unmute audio', async ({ page }) => {
      // Click mute button
      await page.click('[data-testid="mute-button"]')

      // Verify muted state
      await expect(page.locator('[data-testid="mute-button"]')).toHaveAttribute('aria-pressed', 'true')
      await expect(page.locator('[data-testid="mute-icon"]')).toBeVisible()

      // Unmute
      await page.click('[data-testid="mute-button"]')

      // Verify unmuted
      await expect(page.locator('[data-testid="mute-button"]')).toHaveAttribute('aria-pressed', 'false')
    })

    test('should adjust volume', async ({ page }) => {
      // Find volume slider
      const volumeSlider = page.locator('[data-testid="volume-slider"]')

      // Set volume to 50%
      await volumeSlider.fill('50')

      // Verify volume updated
      await expect(volumeSlider).toHaveValue('50')
    })
  })

  test.describe('Performance and Real-time', () => {
    test('should handle rapid channel switching', async ({ page }) => {
      const channels = page.locator('[data-testid="channel-item"]')
      const count = await channels.count()

      // Rapidly switch channels
      for (let i = 0; i < Math.min(5, count); i++) {
        await channels.nth(i).click()
        await page.waitForTimeout(100)
      }

      // Verify no errors
      await expect(page.locator('[data-testid="error-message"]')).not.toBeVisible()
    })

    test('should receive real-time updates', async ({ page }) => {
      // Verify connected
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Simulate incoming transmission
      await page.evaluate(() => {
        const event = new CustomEvent('incomingTransmission', {
          detail: {
            channelId: 1,
            userId: 100,
            userEmail: 'test@example.com',
            timestamp: new Date().toISOString()
          }
        })
        window.dispatchEvent(event)
      })

      // Verify transmission appears in real-time
      await expect(page.locator('[data-testid="incoming-transmission-indicator"]')).toBeVisible({ timeout: 2000 })
    })

    test('should maintain WebSocket connection during long session', async ({ page }) => {
      // Wait for initial connection
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Wait for extended period
      await page.waitForTimeout(30000)

      // Verify still connected
      await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/Connected/i)

      // Verify can still interact
      await page.click('[data-testid="channel-item"]:first-child')
      await expect(page.locator('[data-testid="channel-details"]')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Tab to first channel
      await page.keyboard.press('Tab')

      // Select with Enter
      await page.keyboard.press('Enter')

      // Verify selection
      await expect(page.locator('[data-testid="channel-details"]')).toBeVisible()

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
    })

    test('should announce important events to screen readers', async ({ page }) => {
      // Emergency alert should have aria-live region
      await expect(page.locator('[data-testid="emergency-panel"]')).toHaveAttribute('aria-live', 'assertive')

      // Transcription should have aria-live
      await expect(page.locator('[data-testid="transcription-panel"]')).toHaveAttribute('aria-live')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // PTT button should have descriptive label
      await expect(page.locator('[data-testid="ptt-button"]')).toHaveAttribute('aria-label', /push.*talk/i)

      // Emergency button should have label
      await expect(page.locator('[data-testid="emergency-button"]')).toHaveAttribute('aria-label')
    })
  })
})
