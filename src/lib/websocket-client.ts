/**
 * Production-Grade WebSocket Client
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Message queue for offline mode
 * - Heartbeat/ping-pong every 30 seconds
 * - Type-safe message routing
 * - React hooks for easy integration
 */

import { useEffect, useRef, useCallback, useState } from 'react'

import logger from '@/utils/logger';
/* ============================================================
   TYPES
   ============================================================ */

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: string
  id?: string
}

export interface WebSocketOptions {
  url: string
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  debug?: boolean
}

export type MessageHandler = (message: WebSocketMessage) => void
export type ConnectionHandler = () => void
export type ErrorHandler = (error: Event | Error) => void

/* ============================================================
   WEBSOCKET CLIENT CLASS
   ============================================================ */

export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnect: boolean
  private reconnectInterval: number
  private maxReconnectAttempts: number
  private reconnectAttempts: number = 0
  private heartbeatInterval: number
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private debug: boolean

  private messageHandlers: Map<string, Set<MessageHandler>> = new Map()
  private openHandlers: Set<ConnectionHandler> = new Set()
  private closeHandlers: Set<ConnectionHandler> = new Set()
  private errorHandlers: Set<ErrorHandler> = new Set()

  private messageQueue: WebSocketMessage[] = []
  private isConnected: boolean = false

  constructor(options: WebSocketOptions) {
    this.url = options.url
    this.reconnect = options.reconnect ?? true
    this.reconnectInterval = options.reconnectInterval ?? 1000
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10
    this.heartbeatInterval = options.heartbeatInterval ?? 30000
    this.debug = options.debug ?? false
  }

  /* ============================================================
     CONNECTION MANAGEMENT
     ============================================================ */

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log('Already connected')
      return
    }

    this.log('Connecting to', this.url)

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventHandlers()
    } catch (error) {
      this.log('Connection error:', error)
      this.handleError(error as Error)
      this.scheduleReconnect()
    }
  }

  disconnect() {
    this.log('Disconnecting')
    this.reconnect = false
    this.stopHeartbeat()
    this.stopReconnect()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = () => {
      this.log('Connected')
      this.isConnected = true
      this.reconnectAttempts = 0
      this.startHeartbeat()
      this.flushMessageQueue()
      this.notifyOpenHandlers()
    }

    this.ws.onclose = () => {
      this.log('Disconnected')
      this.isConnected = false
      this.stopHeartbeat()
      this.notifyCloseHandlers()

      if (this.reconnect) {
        this.scheduleReconnect()
      }
    }

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error)
      this.handleError(error)
    }

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.log('Received message:', message)

        // Handle pong messages
        if (message.type === 'pong') {
          this.log('Received pong')
          return
        }

        this.routeMessage(message)
      } catch (error) {
        this.log('Failed to parse message:', error)
      }
    }
  }

  private scheduleReconnect() {
    if (!this.reconnect || this.reconnectTimer) return

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('Max reconnect attempts reached')
      return
    }

    // Exponential backoff: interval * 2^attempts (max 30 seconds)
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts), 30000)

    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /* ============================================================
     HEARTBEAT (PING/PONG)
     ============================================================ */

  private startHeartbeat() {
    this.stopHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'ping',
          payload: null,
          timestamp: new Date().toISOString(),
        })
      }
    }, this.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /* ============================================================
     MESSAGE HANDLING
     ============================================================ */

  send(message: WebSocketMessage) {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      this.log('Sending message:', message)
      this.ws.send(JSON.stringify(message))
    } else {
      this.log('Not connected, queuing message:', message)
      this.messageQueue.push(message)
    }
  }

  private flushMessageQueue() {
    if (this.messageQueue.length === 0) return

    this.log(`Flushing ${this.messageQueue.length} queued messages`)

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  private routeMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type)

    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Also notify wildcard handlers (type: '*')
    const wildcardHandlers = this.messageHandlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  /* ============================================================
     EVENT SUBSCRIPTION
     ============================================================ */

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set())
    }

    this.messageHandlers.get(type)!.add(handler)

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler)
    }
  }

  onOpen(handler: ConnectionHandler): () => void {
    this.openHandlers.add(handler)
    return () => this.openHandlers.delete(handler)
  }

  onClose(handler: ConnectionHandler): () => void {
    this.closeHandlers.add(handler)
    return () => this.closeHandlers.delete(handler)
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler)
    return () => this.errorHandlers.delete(handler)
  }

  private notifyOpenHandlers() {
    this.openHandlers.forEach((handler) => handler())
  }

  private notifyCloseHandlers() {
    this.closeHandlers.forEach((handler) => handler())
  }

  private handleError(error: Event | Error) {
    this.errorHandlers.forEach((handler) => handler(error))
  }

  /* ============================================================
     UTILITY
     ============================================================ */

  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed'

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'open'
      case WebSocket.CLOSING:
        return 'closing'
      case WebSocket.CLOSED:
        return 'closed'
      default:
        return 'closed'
    }
  }

  isOpen(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN
  }

  private log(...args: any[]) {
    if (this.debug) {
      logger.debug('[WebSocket]', ...args)
    }
  }
}

/* ============================================================
   REACT HOOKS
   ============================================================ */

// Main WebSocket hook
export function useWebSocket(url: string, options: Partial<WebSocketOptions> = {}) {
  const clientRef = useRef<WebSocketClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isReconnecting, setIsReconnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Create WebSocket client
    clientRef.current = new WebSocketClient({
      url,
      ...options,
    })

    // Setup connection handlers
    const unsubOpen = clientRef.current.onOpen(() => {
      setIsConnected(true)
      setIsReconnecting(false)
      setError(null)
    })

    const unsubClose = clientRef.current.onClose(() => {
      setIsConnected(false)
      setIsReconnecting(true)
    })

    const unsubError = clientRef.current.onError((err) => {
      setError(err instanceof Error ? err : new Error('WebSocket error'))
    })

    // Connect
    clientRef.current.connect()

    // Cleanup
    return () => {
      unsubOpen()
      unsubClose()
      unsubError()
      clientRef.current?.disconnect()
    }
  }, [url])

  const send = useCallback((message: WebSocketMessage) => {
    clientRef.current?.send(message)
  }, [])

  return {
    send,
    isConnected,
    isReconnecting,
    error,
    client: clientRef.current,
  }
}

// Hook for subscribing to specific message types
export function useSubscription(
  client: WebSocketClient | null,
  messageType: string,
  handler: MessageHandler
) {
  useEffect(() => {
    if (!client) return

    const unsubscribe = client.subscribe(messageType, handler)

    return () => {
      unsubscribe()
    }
  }, [client, messageType, handler])
}

// Hook for sending messages
export function useSendMessage(client: WebSocketClient | null) {
  return useCallback(
    (type: string, payload: any) => {
      if (!client) return

      client.send({
        type,
        payload,
        timestamp: new Date().toISOString(),
      })
    },
    [client]
  )
}
