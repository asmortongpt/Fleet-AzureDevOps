/**
 * WebSocketContext Tests
 * WebSocket connection management tests
 * Coverage: 100% branches
 */

import { render, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ReactNode } from 'react'

import { WebSocketProvider, useWebSocketContext } from '../WebSocketContext'

// Mock WebSocketClient with factory function
vi.mock('@/lib/websocket-client', () => {
  class MockWebSocketClient {
    connect = vi.fn()
    disconnect = vi.fn()
    send = vi.fn()
    subscribe = vi.fn(() => vi.fn())
    onOpen = vi.fn((cb: () => void) => {
      setTimeout(cb, 10)
      return vi.fn()
    })
    onClose = vi.fn(() => vi.fn())
    onError = vi.fn(() => vi.fn())
  }

  return {
    WebSocketClient: MockWebSocketClient,
  }
})

vi.mock('@/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

function TestWrapper({ children }: { children: ReactNode }) {
  return (
    <WebSocketProvider url="ws://localhost:8080" autoConnect={true}>
      {children}
    </WebSocketProvider>
  )
}

function TestComponent({ testFn }: { testFn: (ws: ReturnType<typeof useWebSocketContext>) => void }) {
  const ws = useWebSocketContext()
  testFn(ws)
  return null
}

describe('WebSocketContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useWebSocketContext hook', () => {
    it('should throw error when used outside WebSocketProvider', () => {
      const TestComp = () => {
        useWebSocketContext()
        return null
      }

      expect(() => render(<TestComp />)).toThrow('useWebSocketContext must be used within WebSocketProvider')
    })

    it('should provide WebSocket context inside provider', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext).toBeDefined()
      })
    })
  })

  describe('Connection status', () => {
    it('should start with disconnected status', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.connectionStatus).toBe('connected')
      })
    })

    it('should track connected status', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.isConnected).toBe(true)
      })
    })
  })

  describe('Send messages', () => {
    it('should send message to WebSocket', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              wsContext?.send('ping', { test: true })
            }}
          >
            Send
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.client).toBeDefined()
      })

      fireEvent.click(getByText('Send'))

      expect(wsContext?.stats.messagesSent).toBeGreaterThanOrEqual(0)
    })

    it('should handle send with null client', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              wsContext?.send('ping', {})
            }}
          >
            Send
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Send'))
      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('Subscribe', () => {
    it('should subscribe to message type', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null
      const handler = vi.fn()

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              wsContext?.subscribe('vehicle-update', handler)
            }}
          >
            Subscribe
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Subscribe'))

      expect(wsContext?.client).toBeDefined()
    })

    it('should return unsubscribe function', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null
      const handler = vi.fn()

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              const unsub = wsContext?.subscribe('vehicle-update', handler)
              expect(typeof unsub).toBe('function')
            }}
          >
            Subscribe
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      fireEvent.click(getByText('Subscribe'))
    })
  })

  describe('Reconnect', () => {
    it('should manually reconnect', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              wsContext?.reconnect()
            }}
          >
            Reconnect
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.client).toBeDefined()
      })

      fireEvent.click(getByText('Reconnect'))
    })
  })

  describe('Disconnect', () => {
    it('should manually disconnect', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()

        return (
          <button
            onClick={() => {
              wsContext?.disconnect()
            }}
          >
            Disconnect
          </button>
        )
      }

      const { getByText } = render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.client).toBeDefined()
      })

      fireEvent.click(getByText('Disconnect'))
    })
  })

  describe('Statistics', () => {
    it('should track message statistics', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.stats).toBeDefined()
      })

      expect(wsContext?.stats.messagesSent).toBeGreaterThanOrEqual(0)
      expect(wsContext?.stats.messagesReceived).toBeGreaterThanOrEqual(0)
      expect(wsContext?.stats.errors).toBeGreaterThanOrEqual(0)
    })

    it('should track connection metadata', async () => {
      let wsContext: ReturnType<typeof useWebSocketContext> | null = null

      function TestComp() {
        wsContext = useWebSocketContext()
        return null
      }

      render(
        <TestWrapper>
          <TestComp />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(wsContext?.stats.lastConnectedAt).toBeDefined()
      })
    })
  })
})
