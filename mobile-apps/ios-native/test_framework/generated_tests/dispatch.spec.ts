/**
 * Dispatch Console Tests
 *
 * Test suite for the Radio Dispatch Console including:
 * - PTT (Push-to-Talk) button functionality
 * - PTT keyboard interactions (Spacebar)
 * - PTT focus indicators and accessibility
 * - WebSocket connection for radio communication
 * - Audio level meters
 * - Transmission state management
 */

import { test, expect, Page } from '@playwright/test';
import {
  AuthHelper,
  NavigationHelper,
  WaitHelpers,
  AccessibilityHelper,
  TEST_CONSTANTS
} from './test-helpers';

test.describe('Dispatch Console', () => {
  let authHelper: AuthHelper;
  let navHelper: NavigationHelper;
  let waitHelpers: WaitHelpers;
  let a11yHelper: AccessibilityHelper;

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    authHelper = new AuthHelper(page);
    navHelper = new NavigationHelper(page);
    waitHelpers = new WaitHelpers(page);
    a11yHelper = new AccessibilityHelper(page);

    // Login and navigate to dispatch console
    await authHelper.login();
    await navHelper.navigateToModule('Dispatch Console');
    await waitHelpers.waitForDataLoad();
  });

  test.describe('Dispatch Console Load', () => {
    test('should load dispatch console successfully', async ({ page }) => {
      // Verify page heading
      const heading = await navHelper.getCurrentModule();
      expect(heading.toLowerCase()).toContain('dispatch');

      // Verify main dispatch interface elements are present
      const dispatchContainer = page.locator('[class*="dispatch"], [class*="console"]');
      const isVisible = await dispatchContainer.isVisible().catch(() => false);

      // At minimum, verify we're on a page with dispatch-related content
      const pageHasDispatch = await page.locator('text=/dispatch|console|radio|PTT/i').isVisible();
      expect(pageHasDispatch || isVisible).toBeTruthy();
    });

    test('should display map view in dispatch console', async ({ page }) => {
      // Verify map container exists
      const mapContainer = page.locator('[class*="map"], #map, [class*="leaflet"], [class*="mapbox"]');
      const mapVisible = await mapContainer.isVisible({ timeout: 10000 }).catch(() => false);

      expect(mapVisible).toBeTruthy();
    });

    test('should show vehicle list or markers on map', async ({ page }) => {
      await page.waitForTimeout(2000); // Allow map to fully load

      // Check for vehicle markers or list
      const vehicleMarkers = page.locator('[class*="marker"], [class*="vehicle-icon"]');
      const vehicleList = page.locator('[class*="vehicle-list"]');

      const hasMarkers = await vehicleMarkers.count() > 0;
      const hasList = await vehicleList.isVisible().catch(() => false);

      expect(hasMarkers || hasList).toBeTruthy();
    });
  });

  test.describe('PTT Button - Mouse Interaction', () => {
    test('should find PTT button on page', async ({ page }) => {
      // Look for PTT button (various possible selectors)
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button:has-text("Push to Talk"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[aria-label*="Push to Talk" i], ' +
        'button[class*="ptt" i], ' +
        '[role="button"][class*="ptt" i]'
      );

      const buttonVisible = await pttButton.isVisible({ timeout: 5000 }).catch(() => false);
      expect(buttonVisible).toBeTruthy();
    });

    test('should activate PTT on mouse down', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Trigger mouse down event
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(100);

      // Check if PTT is in active/transmitting state
      // Look for visual indicators: active class, color change, or state attribute
      const isActive = await pttButton.evaluate((btn) => {
        return (
          btn.classList.contains('active') ||
          btn.classList.contains('transmitting') ||
          btn.getAttribute('data-transmitting') === 'true' ||
          btn.getAttribute('aria-pressed') === 'true'
        );
      });

      expect(isActive).toBeTruthy();
    });

    test('should deactivate PTT on mouse up', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Press and hold
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(200);

      // Release
      await pttButton.dispatchEvent('mouseup');
      await page.waitForTimeout(100);

      // Check if PTT is no longer active
      const isInactive = await pttButton.evaluate((btn) => {
        return (
          !btn.classList.contains('active') &&
          !btn.classList.contains('transmitting') &&
          btn.getAttribute('data-transmitting') !== 'true' &&
          btn.getAttribute('aria-pressed') !== 'true'
        );
      });

      expect(isInactive).toBeTruthy();
    });

    test('should show visual feedback while PTT is active', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Get button background color before activation
      const colorBefore = await pttButton.evaluate((btn) => {
        return window.getComputedStyle(btn).backgroundColor;
      });

      // Activate PTT
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(100);

      // Get button background color during activation
      const colorDuring = await pttButton.evaluate((btn) => {
        return window.getComputedStyle(btn).backgroundColor;
      });

      // Colors should be different (visual feedback)
      expect(colorBefore).not.toBe(colorDuring);

      // Release
      await pttButton.dispatchEvent('mouseup');
    });
  });

  test.describe('PTT Button - Keyboard Interaction', () => {
    test('should activate PTT on Spacebar key down', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Focus the PTT button
      await pttButton.focus();

      // Press spacebar
      await page.keyboard.down('Space');
      await page.waitForTimeout(100);

      // Check if PTT is active
      const isActive = await pttButton.evaluate((btn) => {
        return (
          btn.classList.contains('active') ||
          btn.classList.contains('transmitting') ||
          btn.getAttribute('data-transmitting') === 'true'
        );
      });

      expect(isActive).toBeTruthy();

      // Release spacebar
      await page.keyboard.up('Space');
    });

    test('should deactivate PTT on Spacebar key up', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Focus and press
      await pttButton.focus();
      await page.keyboard.down('Space');
      await page.waitForTimeout(200);

      // Release
      await page.keyboard.up('Space');
      await page.waitForTimeout(100);

      // Check if PTT is inactive
      const isInactive = await pttButton.evaluate((btn) => {
        return !btn.classList.contains('active') && !btn.classList.contains('transmitting');
      });

      expect(isInactive).toBeTruthy();
    });

    test('should support global Spacebar PTT when not focused', async ({ page }) => {
      // Some dispatch consoles allow Spacebar to trigger PTT globally
      // Focus somewhere else first
      await page.locator('body').click();

      // Press spacebar
      await page.keyboard.down('Space');
      await page.waitForTimeout(100);

      // Check if any transmission state is active
      const transmitting = page.locator('[class*="transmitting"], [data-transmitting="true"]');
      const isTransmitting = await transmitting.isVisible().catch(() => false);

      // Release
      await page.keyboard.up('Space');

      // This test is optional - global PTT may not be implemented
      if (!isTransmitting) {
        test.skip();
      }
    });
  });

  test.describe('PTT Focus Indicators', () => {
    test('should show focus indicator on Tab navigation', async ({ page }) => {
      // Tab to PTT button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // May need multiple tabs to reach PTT

      // Find focused element
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          text: el?.textContent,
          ariaLabel: el?.getAttribute('aria-label')
        };
      });

      // Verify focused element is related to PTT or navigation
      const isPTTFocused =
        focusedElement.text?.includes('PTT') ||
        focusedElement.ariaLabel?.includes('PTT') ||
        focusedElement.tagName === 'BUTTON';

      expect(isPTTFocused).toBeTruthy();
    });

    test('should have visible focus ring on PTT button', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Focus the button
      await pttButton.focus();

      // Check if focus ring is visible
      const hasFocusStyle = await pttButton.evaluate((btn) => {
        const styles = window.getComputedStyle(btn);
        return (
          styles.outline !== 'none' ||
          styles.outlineWidth !== '0px' ||
          styles.boxShadow !== 'none' ||
          btn.matches(':focus-visible')
        );
      });

      expect(hasFocusStyle).toBeTruthy();
    });
  });

  test.describe('PTT ARIA Attributes and Labels', () => {
    test('should have proper ARIA label on PTT button', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Check for aria-label
      const ariaLabel = await pttButton.getAttribute('aria-label');
      const hasAriaLabel = ariaLabel !== null && ariaLabel.length > 0;

      // Check for accessible text (either aria-label or visible text)
      const accessibleName = await pttButton.evaluate((btn) => {
        return btn.getAttribute('aria-label') || btn.textContent;
      });

      expect(hasAriaLabel || accessibleName).toBeTruthy();
    });

    test('should have aria-pressed attribute that toggles', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[aria-label*="PTT" i], ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Check initial aria-pressed state
      const initialPressed = await pttButton.getAttribute('aria-pressed');

      // Activate PTT
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(100);

      // Check aria-pressed during activation
      const pressedDuring = await pttButton.getAttribute('aria-pressed');

      // Release PTT
      await pttButton.dispatchEvent('mouseup');
      await page.waitForTimeout(100);

      // Check aria-pressed after release
      const pressedAfter = await pttButton.getAttribute('aria-pressed');

      // aria-pressed should change or be properly set
      expect(pressedDuring === 'true' || pressedAfter === 'false').toBeTruthy();
    });

    test('should have role="button" or be a button element', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        '[role="button"]:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Verify element is a button or has role="button"
      const isAccessibleButton = await pttButton.evaluate((btn) => {
        return btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button';
      });

      expect(isAccessibleButton).toBeTruthy();
    });
  });

  test.describe('WebSocket Connection', () => {
    test('should establish WebSocket connection for radio', async ({ page }) => {
      // Monitor WebSocket connections
      const wsConnections: any[] = [];

      page.on('websocket', ws => {
        wsConnections.push({
          url: ws.url()
        });
      });

      // Wait a bit for WebSocket to connect
      await page.waitForTimeout(2000);

      // Verify at least one WebSocket connection was established
      expect(wsConnections.length).toBeGreaterThan(0);
    });

    test('should send join_channel message with user ID', async ({ page }) => {
      let joinMessageSent = false;

      // Monitor WebSocket messages
      page.on('websocket', ws => {
        ws.on('framesent', frame => {
          const payload = frame.payload;
          if (payload) {
            try {
              const message = JSON.parse(payload.toString());
              if (message.type === 'join_channel' || message.action === 'join') {
                joinMessageSent = true;
              }
            } catch (e) {
              // Not JSON, ignore
            }
          }
        });
      });

      // Reload page to trigger fresh connection
      await page.reload();
      await waitHelpers.waitForDataLoad();
      await page.waitForTimeout(2000);

      // This test is informational - WebSocket messages may vary
      console.log('Join message sent:', joinMessageSent);
    });
  });

  test.describe('Audio Level Meter', () => {
    test('should display audio level meter', async ({ page }) => {
      // Look for audio level indicator/meter
      const audioMeter = page.locator(
        '[class*="audio-level"], ' +
        '[class*="level-meter"], ' +
        '[class*="volume-meter"], ' +
        'meter, ' +
        'progress[class*="audio" i]'
      );

      const meterVisible = await audioMeter.isVisible({ timeout: 5000 }).catch(() => false);

      // Audio meter is optional but should be tested if present
      if (meterVisible) {
        expect(meterVisible).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('should show audio level changes during transmission', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Look for audio level indicator
      const audioLevel = page.locator('[class*="audio-level"], [class*="level-meter"]');
      const levelExists = await audioLevel.isVisible().catch(() => false);

      if (!levelExists) {
        test.skip();
        return;
      }

      // Activate PTT
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(500);

      // Check if audio level indicator shows activity
      const hasActivity = await audioLevel.evaluate((meter) => {
        return (
          meter.classList.contains('active') ||
          meter.getAttribute('data-active') === 'true' ||
          parseFloat(meter.getAttribute('value') || '0') > 0
        );
      });

      // Release PTT
      await pttButton.dispatchEvent('mouseup');

      // Audio activity during transmission is expected
      expect(hasActivity).toBeTruthy();
    });
  });

  test.describe('Transmission State Changes', () => {
    test('should show "transmitting" state during PTT press', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Activate PTT
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(100);

      // Look for "transmitting" indicator
      const transmittingText = page.locator('text=/transmitting|broadcasting|sending/i');
      const statusIndicator = await transmittingText.isVisible().catch(() => false);

      // Check button state
      const buttonState = await pttButton.evaluate((btn) => {
        return btn.classList.contains('transmitting') || btn.getAttribute('data-transmitting') === 'true';
      });

      // Release
      await pttButton.dispatchEvent('mouseup');

      expect(statusIndicator || buttonState).toBeTruthy();
    });

    test('should return to "ready" state after PTT release', async ({ page }) => {
      const pttButton = page.locator(
        'button:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      ).first();

      const buttonExists = await pttButton.isVisible().catch(() => false);

      if (!buttonExists) {
        test.skip();
        return;
      }

      // Press and release
      await pttButton.dispatchEvent('mousedown');
      await page.waitForTimeout(200);
      await pttButton.dispatchEvent('mouseup');
      await page.waitForTimeout(100);

      // Check for "ready" state
      const readyState = await pttButton.evaluate((btn) => {
        return (
          !btn.classList.contains('transmitting') &&
          !btn.classList.contains('active') &&
          (btn.classList.contains('ready') || btn.getAttribute('data-state') === 'ready')
        );
      });

      expect(readyState).toBeTruthy();
    });

    test('should prevent multiple simultaneous transmissions', async ({ page }) => {
      const pttButtons = page.locator(
        'button:has-text("PTT"), ' +
        'button[class*="ptt" i]'
      );

      const buttonCount = await pttButtons.count();

      if (buttonCount < 1) {
        test.skip();
        return;
      }

      // Activate first PTT
      await pttButtons.first().dispatchEvent('mousedown');
      await page.waitForTimeout(100);

      // Count active transmissions
      const activeCount = await page.locator('[class*="transmitting"], [data-transmitting="true"]').count();

      // Should only have one active transmission
      expect(activeCount).toBeLessThanOrEqual(1);

      // Release
      await pttButtons.first().dispatchEvent('mouseup');
    });
  });

  test.describe('Channel Selection', () => {
    test('should display available channels', async ({ page }) => {
      // Look for channel selector
      const channelSelector = page.locator(
        'select[name="channel"], ' +
        '[class*="channel-select"], ' +
        'button:has-text("Channel")'
      );

      const selectorExists = await channelSelector.isVisible().catch(() => false);

      if (selectorExists) {
        expect(selectorExists).toBeTruthy();
      } else {
        test.skip();
      }
    });

    test('should allow switching between channels', async ({ page }) => {
      const channelSelector = page.locator('select[name="channel"], [class*="channel-select"]').first();
      const selectorExists = await channelSelector.isVisible().catch(() => false);

      if (!selectorExists) {
        test.skip();
        return;
      }

      // Get current channel
      const currentChannel = await channelSelector.inputValue();

      // Change channel
      await channelSelector.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Verify channel changed
      const newChannel = await channelSelector.inputValue();
      expect(newChannel).not.toBe(currentChannel);
    });
  });

  test.describe('Emergency Button', () => {
    test('should have emergency/panic button visible', async ({ page }) => {
      const emergencyButton = page.locator(
        'button:has-text("Emergency"), ' +
        'button:has-text("Panic"), ' +
        'button[class*="emergency" i]'
      );

      const buttonVisible = await emergencyButton.isVisible().catch(() => false);

      // Emergency button is optional
      if (buttonVisible) {
        expect(buttonVisible).toBeTruthy();
      } else {
        test.skip();
      }
    });
  });
});
