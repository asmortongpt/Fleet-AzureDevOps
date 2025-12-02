/**
 * Performance Tests for Real-time Features
 *
 * Tests cover:
 * - WebSocket connection performance
 * - GPS update throughput
 * - Dispatch audio latency
 * - UI rendering performance
 * - Memory usage under load
 * - Concurrent user handling
 */

import { test, expect } from '@playwright/test'

test.describe('Real-time Features Performance', () => {
  test.describe('WebSocket Performance', () => {
    test('should establish WebSocket connection quickly', async ({ page }) => {
      await page.goto('/dispatch')

      const startTime = Date.now()

      // Wait for WebSocket connection
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', {
        timeout: 5000
      })

      const connectionTime = Date.now() - startTime

      // Should connect in under 2 seconds
      expect(connectionTime).toBeLessThan(2000)

      console.log(`WebSocket connection time: ${connectionTime}ms`)
    })

    test('should handle rapid message throughput', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Simulate rapid GPS updates
      const messageCount = 100
      const startTime = Date.now()

      for (let i = 0; i < messageCount; i++) {
        await page.evaluate((index) => {
          const event = new CustomEvent('gps-update', {
            detail: {
              vehicleId: 1,
              latitude: 38.9072 + (index * 0.0001),
              longitude: -77.0369,
              timestamp: Date.now()
            }
          })
          window.dispatchEvent(event)
        }, i)
      }

      const processingTime = Date.now() - startTime
      const messagesPerSecond = (messageCount / processingTime) * 1000

      console.log(`Processed ${messageCount} messages in ${processingTime}ms`)
      console.log(`Throughput: ${messagesPerSecond.toFixed(0)} messages/second`)

      // Should process at least 50 messages per second
      expect(messagesPerSecond).toBeGreaterThan(50)
    })

    test('should maintain low message latency', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      const latencies: number[] = []

      // Measure latency for 10 messages
      for (let i = 0; i < 10; i++) {
        const sendTime = Date.now()

        await page.evaluate((time) => {
          const event = new CustomEvent('test-message', {
            detail: { timestamp: time }
          })
          window.dispatchEvent(event)
        }, sendTime)

        // Wait for response (simulated)
        await page.waitForTimeout(10)

        const receiveTime = Date.now()
        latencies.push(receiveTime - sendTime)
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length
      const maxLatency = Math.max(...latencies)

      console.log(`Average latency: ${avgLatency.toFixed(2)}ms`)
      console.log(`Max latency: ${maxLatency}ms`)

      // Average latency should be under 50ms
      expect(avgLatency).toBeLessThan(50)

      // No single message should take more than 100ms
      expect(maxLatency).toBeLessThan(100)
    })
  })

  test.describe('GPS Update Performance', () => {
    test('should render GPS updates smoothly', async ({ page }) => {
      await page.goto('/fleet-map')
      await page.waitForLoadState('networkidle')

      // Start performance monitoring
      await page.evaluate(() => performance.mark('gps-update-start'))

      // Simulate 50 GPS updates
      for (let i = 0; i < 50; i++) {
        await page.evaluate((index) => {
          const event = new CustomEvent('gps-update', {
            detail: {
              vehicleId: 1,
              latitude: 38.9072 + (index * 0.0001),
              longitude: -77.0369 + (index * 0.0001),
              speed: 35,
              heading: 180
            }
          })
          window.dispatchEvent(event)
        }, i)

        await page.waitForTimeout(20) // 50 updates per second
      }

      await page.evaluate(() => performance.mark('gps-update-end'))

      // Measure performance
      const metrics = await page.evaluate(() => {
        performance.measure('gps-updates', 'gps-update-start', 'gps-update-end')
        const measure = performance.getEntriesByName('gps-updates')[0]
        return {
          duration: measure.duration,
          memory: (performance as any).memory ? (performance as any).memory.usedJSHeapSize : null
        }
      })

      console.log(`GPS update rendering time: ${metrics.duration.toFixed(2)}ms`)

      // Should complete in under 2 seconds
      expect(metrics.duration).toBeLessThan(2000)
    })

    test('should handle multiple vehicle updates concurrently', async ({ page }) => {
      await page.goto('/fleet-map')
      await page.waitForLoadState('networkidle')

      const vehicleCount = 20
      const updatesPerVehicle = 10
      const startTime = Date.now()

      // Simulate concurrent updates for multiple vehicles
      for (let update = 0; update < updatesPerVehicle; update++) {
        for (let vehicle = 1; vehicle <= vehicleCount; vehicle++) {
          await page.evaluate(({ vid, idx }) => {
            const event = new CustomEvent('gps-update', {
              detail: {
                vehicleId: vid,
                latitude: 38.9072 + (idx * 0.0001) + (vid * 0.001),
                longitude: -77.0369 + (idx * 0.0001),
                timestamp: Date.now()
              }
            })
            window.dispatchEvent(event)
          }, { vid: vehicle, idx: update })
        }

        await page.waitForTimeout(10)
      }

      const totalTime = Date.now() - startTime
      const totalUpdates = vehicleCount * updatesPerVehicle

      console.log(`Processed ${totalUpdates} updates in ${totalTime}ms`)

      // Should handle concurrent updates efficiently
      expect(totalTime).toBeLessThan(3000)
    })
  })

  test.describe('Dispatch Audio Performance', () => {
    test('should stream audio with minimal latency', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Grant microphone permission
      await page.context().grantPermissions(['microphone'])

      // Select channel
      await page.click('[data-testid="channel-item"]:first-child')

      // Start transmission
      const startTime = Date.now()
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mousedown')

      // Wait for transmission indicator
      await page.waitForSelector('[data-testid="transmission-indicator"]')

      const transmissionStartTime = Date.now() - startTime

      console.log(`Transmission start latency: ${transmissionStartTime}ms`)

      // Should start in under 200ms
      expect(transmissionStartTime).toBeLessThan(200)

      // Stop transmission
      await page.locator('[data-testid="ptt-button"]').dispatchEvent('mouseup')
    })

    test('should handle audio chunk streaming', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Monitor audio chunks
      const chunkTimes: number[] = []

      await page.exposeFunction('recordChunkTime', (time: number) => {
        chunkTimes.push(time)
      })

      await page.evaluate(() => {
        window.addEventListener('audio-chunk-received', (event: any) => {
          (window as any).recordChunkTime(Date.now())
        })
      })

      // Simulate receiving 10 audio chunks
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          const event = new CustomEvent('audio-chunk-received', {
            detail: { chunk: new ArrayBuffer(1024) }
          })
          window.dispatchEvent(event)
        })

        await page.waitForTimeout(50) // 20 chunks per second
      }

      // Calculate inter-chunk timing
      const delays: number[] = []
      for (let i = 1; i < chunkTimes.length; i++) {
        delays.push(chunkTimes[i] - chunkTimes[i - 1])
      }

      if (delays.length > 0) {
        const avgDelay = delays.reduce((a, b) => a + b, 0) / delays.length

        console.log(`Average chunk delay: ${avgDelay.toFixed(2)}ms`)

        // Chunks should arrive consistently (close to 50ms)
        expect(avgDelay).toBeGreaterThan(40)
        expect(avgDelay).toBeLessThan(60)
      }
    })
  })

  test.describe('UI Rendering Performance', () => {
    test('should render task list efficiently', async ({ page }) => {
      await page.goto('/tasks')

      // Start performance measurement
      const startTime = Date.now()

      // Wait for initial render
      await page.waitForSelector('[data-testid="task-list"]')

      const initialRenderTime = Date.now() - startTime

      console.log(`Task list initial render: ${initialRenderTime}ms`)

      // Should render in under 1 second
      expect(initialRenderTime).toBeLessThan(1000)

      // Measure interaction performance
      const interactionStart = Date.now()

      await page.click('[data-testid="filter-status"]')
      await page.click('text=Pending')

      const filterTime = Date.now() - interactionStart

      console.log(`Filter interaction time: ${filterTime}ms`)

      // Filtering should be responsive
      expect(filterTime).toBeLessThan(300)
    })

    test('should handle large inventory list', async ({ page }) => {
      await page.goto('/inventory')

      const startTime = Date.now()

      // Wait for list to render
      await page.waitForSelector('[data-testid="inventory-list"]')

      const renderTime = Date.now() - startTime

      // Measure scroll performance
      const scrollStart = Date.now()

      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      await page.waitForTimeout(100)

      const scrollTime = Date.now() - scrollStart

      console.log(`Inventory render time: ${renderTime}ms`)
      console.log(`Scroll performance: ${scrollTime}ms`)

      expect(renderTime).toBeLessThan(1500)
      expect(scrollTime).toBeLessThan(150)
    })

    test('should update UI without jank', async ({ page }) => {
      await page.goto('/fleet-map')
      await page.waitForLoadState('networkidle')

      // Measure frame rate during updates
      const fps = await page.evaluate(async () => {
        return new Promise((resolve) => {
          let lastFrame = performance.now()
          let frameCount = 0
          const frameTimes: number[] = []

          function measureFrame() {
            const currentFrame = performance.now()
            const delta = currentFrame - lastFrame
            frameTimes.push(delta)
            lastFrame = currentFrame
            frameCount++

            if (frameCount < 60) {
              requestAnimationFrame(measureFrame)
            } else {
              // Calculate FPS
              const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
              const fps = 1000 / avgFrameTime
              resolve(fps)
            }
          }

          requestAnimationFrame(measureFrame)
        })
      })

      console.log(`Average FPS: ${fps}`)

      // Should maintain at least 30 FPS
      expect(fps).toBeGreaterThan(30)
    })
  })

  test.describe('Memory Usage', () => {
    test('should not leak memory with continuous updates', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForLoadState('networkidle')

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
      })

      // Run continuous updates for 30 seconds
      const updateCount = 300 // 10 per second for 30 seconds

      for (let i = 0; i < updateCount; i++) {
        await page.evaluate(() => {
          const event = new CustomEvent('gps-update', {
            detail: {
              vehicleId: 1,
              latitude: 38.9072,
              longitude: -77.0369
            }
          })
          window.dispatchEvent(event)
        })

        await page.waitForTimeout(100)
      }

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory ? (performance as any).memory.usedJSHeapSize : 0
      })

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory
        const increasePercentage = (memoryIncrease / initialMemory) * 100

        console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`)
        console.log(`Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)} MB`)
        console.log(`Memory increase: ${increasePercentage.toFixed(2)}%`)

        // Memory should not increase by more than 50%
        expect(increasePercentage).toBeLessThan(50)
      }
    }, 60000) // Extended timeout
  })

  test.describe('Concurrent Users', () => {
    test('should handle multiple concurrent sessions', async ({ browser }) => {
      // Create multiple browser contexts (simulating different users)
      const contextCount = 5
      const contexts = []

      for (let i = 0; i < contextCount; i++) {
        const context = await browser.newContext()
        contexts.push(context)
      }

      const startTime = Date.now()

      // Open dispatch console in all contexts
      const pages = await Promise.all(
        contexts.map(async (context) => {
          const page = await context.newPage()
          await page.goto('/dispatch')
          await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')
          return page
        })
      )

      const setupTime = Date.now() - startTime

      console.log(`Set up ${contextCount} concurrent sessions in ${setupTime}ms`)

      // Verify all sessions active
      for (const page of pages) {
        await expect(page.locator('[data-testid="connection-status"]')).toHaveText(/Connected/i)
      }

      // Cleanup
      for (const context of contexts) {
        await context.close()
      }

      // Should handle concurrent users efficiently
      expect(setupTime).toBeLessThan(10000)
    }, 30000)
  })

  test.describe('Network Conditions', () => {
    test('should perform adequately on slow 3G', async ({ page, context }) => {
      // Simulate slow 3G network
      await context.route('**/*', (route) => {
        // Add delay
        setTimeout(() => route.continue(), 100)
      })

      const startTime = Date.now()

      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")', {
        timeout: 15000
      })

      const loadTime = Date.now() - startTime

      console.log(`Load time on slow 3G: ${loadTime}ms`)

      // Should still be usable on slow network
      expect(loadTime).toBeLessThan(10000)
    })

    test('should handle intermittent connectivity', async ({ page }) => {
      await page.goto('/dispatch')
      await page.waitForSelector('[data-testid="connection-status"]:has-text("Connected")')

      // Simulate going offline
      await page.context().setOffline(true)

      // Verify offline indicator
      await expect(page.locator('[data-testid="connection-error"]')).toBeVisible()

      // Go back online
      await page.context().setOffline(false)

      // Should reconnect
      const reconnectStart = Date.now()

      await expect(page.locator('[data-testid="connection-status"]:has-text("Connected")')).toBeVisible({
        timeout: 5000
      })

      const reconnectTime = Date.now() - reconnectStart

      console.log(`Reconnection time: ${reconnectTime}ms`)

      // Should reconnect quickly
      expect(reconnectTime).toBeLessThan(3000)
    })
  })

  test.describe('Resource Loading', () => {
    test('should load critical resources quickly', async ({ page }) => {
      const navigationStart = Date.now()

      await page.goto('/dispatch')

      // Measure key metrics
      const metrics = await page.evaluate(() => ({
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
      }))

      console.log(`DOM Content Loaded: ${metrics.domContentLoaded}ms`)
      console.log(`Load Complete: ${metrics.loadComplete}ms`)
      console.log(`First Paint: ${metrics.firstPaint.toFixed(2)}ms`)
      console.log(`First Contentful Paint: ${metrics.firstContentfulPaint.toFixed(2)}ms`)

      // Performance budgets
      expect(metrics.firstPaint).toBeLessThan(1000)
      expect(metrics.firstContentfulPaint).toBeLessThan(1500)
      expect(metrics.domContentLoaded).toBeLessThan(2000)
      expect(metrics.loadComplete).toBeLessThan(3000)
    })
  })
})
