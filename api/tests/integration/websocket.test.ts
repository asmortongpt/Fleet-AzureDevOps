/**
 * WebSocket Integration Tests
 *
 * Tests cover:
 * - WebSocket connection and authentication
 * - Real-time GPS updates
 * - Dispatch audio streaming
 * - Live notifications
 * - Multi-client synchronization
 * - Connection resilience
 */

import { describe, it, expect, afterEach } from 'vitest'
import WebSocket from 'ws'

const WS_URL = process.env.WS_URL || 'ws://localhost:3000'

describe('WebSocket Integration', () => {
  let ws: WebSocket

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
  })

  describe('Connection Management', () => {
    it('should establish WebSocket connection', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          expect(ws.readyState).toBe(WebSocket.OPEN)
          resolve()
        })

        ws.on('error', reject)

        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      })
    })

    it('should authenticate WebSocket connection', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          // Send authentication message
          ws.send(JSON.stringify({
            type: 'auth',
            token: 'test-auth-token'
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'auth-success') {
            expect(message).toHaveProperty('userId')
            expect(message).toHaveProperty('sessionId')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      })
    })

    it('should reject invalid authentication', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'auth',
            token: 'invalid-token'
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'auth-error') {
            expect(message).toHaveProperty('error')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Auth rejection timeout')), 5000)
      })
    })

    it('should handle connection close gracefully', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.close()
        })

        ws.on('close', (code, reason) => {
          expect(code).toBe(1000) // Normal closure
          resolve()
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Close timeout')), 5000)
      })
    })

    it('should send heartbeat pings', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let receivedPing = false

        ws.on('ping', () => {
          receivedPing = true
        })

        ws.on('open', () => {
          // Wait for ping
          setTimeout(() => {
            expect(receivedPing).toBe(true)
            resolve()
          }, 35000) // Heartbeat typically every 30 seconds
        })

        ws.on('error', reject)
      })
    }, 40000) // Extended timeout for heartbeat
  })

  describe('Real-time GPS Updates', () => {
    it('should subscribe to GPS updates', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          // Subscribe to vehicle GPS updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'gps',
            vehicleId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'subscription-confirmed') {
            expect(message.channel).toBe('gps')
            expect(message.vehicleId).toBe(1)
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Subscribe timeout')), 5000)
      })
    })

    it('should receive GPS position updates', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'gps',
            vehicleId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'gps-update') {
            expect(message).toHaveProperty('vehicleId')
            expect(message).toHaveProperty('latitude')
            expect(message).toHaveProperty('longitude')
            expect(message).toHaveProperty('speed')
            expect(message).toHaveProperty('heading')
            expect(message).toHaveProperty('timestamp')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('GPS update timeout')), 10000)
      })
    }, 15000)

    it('should unsubscribe from GPS updates', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let subscribedVehicleId: number

        ws.on('open', () => {
          // Subscribe first
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'gps',
            vehicleId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'subscription-confirmed') {
            subscribedVehicleId = message.vehicleId

            // Now unsubscribe
            ws.send(JSON.stringify({
              type: 'unsubscribe',
              channel: 'gps',
              vehicleId: subscribedVehicleId
            }))
          }

          if (message.type === 'unsubscribe-confirmed') {
            expect(message.vehicleId).toBe(subscribedVehicleId)
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Unsubscribe timeout')), 5000)
      })
    })
  })

  describe('Dispatch Audio Streaming', () => {
    it('should join dispatch channel', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'join-channel',
            channelId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'channel-joined') {
            expect(message).toHaveProperty('channelId', 1)
            expect(message).toHaveProperty('activeListeners')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Join channel timeout')), 5000)
      })
    })

    it('should start audio transmission', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let channelJoined = false

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'join-channel',
            channelId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'channel-joined') {
            channelJoined = true

            // Start transmission
            ws.send(JSON.stringify({
              type: 'start-transmission',
              channelId: 1
            }))
          }

          if (message.type === 'transmission-started' && channelJoined) {
            expect(message).toHaveProperty('transmissionId')
            expect(message).toHaveProperty('channelId', 1)
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Transmission start timeout')), 5000)
      })
    })

    it('should stream audio chunks', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let transmissionStarted = false

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'join-channel',
            channelId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'channel-joined') {
            ws.send(JSON.stringify({
              type: 'start-transmission',
              channelId: 1
            }))
          }

          if (message.type === 'transmission-started') {
            transmissionStarted = true

            // Send audio chunk (mock data)
            const audioChunk = Buffer.from([0, 1, 2, 3, 4, 5])
            ws.send(JSON.stringify({
              type: 'audio-chunk',
              transmissionId: message.transmissionId,
              data: audioChunk.toString('base64')
            }))
          }

          if (message.type === 'chunk-received' && transmissionStarted) {
            expect(message).toHaveProperty('sequenceNumber')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Audio stream timeout')), 5000)
      })
    })

    it('should end audio transmission', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let transmissionId: string

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'join-channel',
            channelId: 1
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'channel-joined') {
            ws.send(JSON.stringify({
              type: 'start-transmission',
              channelId: 1
            }))
          }

          if (message.type === 'transmission-started') {
            transmissionId = message.transmissionId

            // End transmission
            ws.send(JSON.stringify({
              type: 'end-transmission',
              transmissionId
            }))
          }

          if (message.type === 'transmission-ended') {
            expect(message.transmissionId).toBe(transmissionId)
            expect(message).toHaveProperty('duration')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('End transmission timeout')), 5000)
      })
    })
  })

  describe('Live Notifications', () => {
    it('should receive task notifications', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'notifications'
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'notification') {
            expect(message).toHaveProperty('notificationId')
            expect(message).toHaveProperty('title')
            expect(message).toHaveProperty('message')
            expect(message).toHaveProperty('priority')
            expect(message).toHaveProperty('timestamp')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Notification timeout')), 10000)
      })
    }, 15000)

    it('should receive emergency alerts', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'emergency-alerts'
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'emergency-alert') {
            expect(message).toHaveProperty('alertId')
            expect(message).toHaveProperty('alertType')
            expect(message).toHaveProperty('location')
            expect(message).toHaveProperty('severity')
            expect(message.priority).toBe('urgent')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Alert timeout')), 10000)
      })
    }, 15000)
  })

  describe('Multi-client Synchronization', () => {
    it('should broadcast updates to all connected clients', async () => {
      return new Promise<void>((resolve, reject) => {
        const client1 = new WebSocket(`${WS_URL}/api/ws`)
        const client2 = new WebSocket(`${WS_URL}/api/ws`)

        let client1Ready = false
        let client2Ready = false
        let client2ReceivedUpdate = false

        const checkCompletion = () => {
          if (client1Ready && client2Ready && client2ReceivedUpdate) {
            client1.close()
            client2.close()
            resolve()
          }
        }

        client1.on('open', () => {
          client1.send(JSON.stringify({
            type: 'subscribe',
            channel: 'fleet-updates'
          }))
        })

        client2.on('open', () => {
          client2.send(JSON.stringify({
            type: 'subscribe',
            channel: 'fleet-updates'
          }))
        })

        client1.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'subscription-confirmed') {
            client1Ready = true

            // Client 1 sends update
            if (client1Ready && client2Ready) {
              client1.send(JSON.stringify({
                type: 'broadcast',
                channel: 'fleet-updates',
                data: { test: 'sync-message' }
              }))
            }
          }
        })

        client2.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'subscription-confirmed') {
            client2Ready = true

            if (client1Ready && client2Ready) {
              client1.send(JSON.stringify({
                type: 'broadcast',
                channel: 'fleet-updates',
                data: { test: 'sync-message' }
              }))
            }
          }

          if (message.type === 'broadcast') {
            expect(message.data).toEqual({ test: 'sync-message' })
            client2ReceivedUpdate = true
            checkCompletion()
          }
        })

        client1.on('error', reject)
        client2.on('error', reject)

        setTimeout(() => reject(new Error('Sync timeout')), 10000)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed messages', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          // Send invalid JSON
          ws.send('invalid-json-{')
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'error') {
            expect(message.error).toContain('Invalid message format')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Error handling timeout')), 5000)
      })
    })

    it('should handle unknown message types', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'unknown-message-type',
            data: {}
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'error') {
            expect(message.error).toContain('Unknown message type')
            resolve()
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Unknown type timeout')), 5000)
      })
    })

    it('should recover from connection drops', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          // Simulate connection drop
          ws.terminate()

          // Reconnect
          setTimeout(() => {
            ws = new WebSocket(`${WS_URL}/api/ws`)

            ws.on('open', () => {
              expect(ws.readyState).toBe(WebSocket.OPEN)
              resolve()
            })
          }, 1000)
        })

        ws.on('error', (err) => {
          // Expected error on terminate
          if (!err.message.includes('socket hang up')) {
            reject(err)
          }
        })

        setTimeout(() => reject(new Error('Reconnect timeout')), 10000)
      })
    })
  })

  describe('Performance', () => {
    it('should handle high-frequency updates', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)
        let updateCount = 0
        const targetUpdates = 50

        ws.on('open', () => {
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'high-frequency-test',
            rateLimit: 100 // 100 updates per second
          }))
        })

        ws.on('message', (data: Buffer) => {
          const message = JSON.parse(data.toString())

          if (message.type === 'update') {
            updateCount++

            if (updateCount >= targetUpdates) {
              expect(updateCount).toBeGreaterThanOrEqual(targetUpdates)
              resolve()
            }
          }
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('High frequency timeout')), 5000)
      })
    })

    it('should maintain low latency', async () => {
      return new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`${WS_URL}/api/ws`)

        ws.on('open', () => {
          const sendTime = Date.now()

          ws.send(JSON.stringify({
            type: 'ping',
            timestamp: sendTime
          }))

          ws.on('message', (data: Buffer) => {
            const message = JSON.parse(data.toString())

            if (message.type === 'pong') {
              const receiveTime = Date.now()
              const latency = receiveTime - sendTime

              // Latency should be under 100ms
              expect(latency).toBeLessThan(100)
              resolve()
            }
          })
        })

        ws.on('error', reject)
        setTimeout(() => reject(new Error('Latency test timeout')), 5000)
      })
    })
  })
})
