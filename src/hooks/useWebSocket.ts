/**
 * WebSocket Hook for Real-time Updates
 * Connects to the dispatch WebSocket service for real-time events
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import logger from '@/utils/logger'

export interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  url?: string
  reconnectInterval?: number
  reconnectAttempts?: number
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onMessage?: (message: WebSocketMessage) => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/dispatch/ws`,
    reconnectInterval = 3000,
    reconnectAttempts = 10,
    onOpen,
    onClose,
    onError,
    onMessage
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectCountRef = useRef(0)
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        logger.info('WebSocket connected')
        setIsConnected(true)
        reconnectCountRef.current = 0
        onOpen?.()
      }

      ws.onclose = () => {
        logger.info('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null
        onClose?.()

        // Attempt to reconnect
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++
          logger.info(`Reconnecting... (${reconnectCountRef.current}/${reconnectAttempts})`)
          setTimeout(connect, reconnectInterval)
        }
      }

      ws.onerror = (error) => {
        logger.error('WebSocket error:', { error })
        onError?.(error)
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          setLastMessage(message)
          onMessage?.(message)

          // Notify type-specific listeners
          const listeners = listenersRef.current.get(message.type)
          if (listeners) {
            listeners.forEach(callback => callback(message))
          }

          // Notify wildcard listeners
          const wildcardListeners = listenersRef.current.get('*')
          if (wildcardListeners) {
            wildcardListeners.forEach(callback => callback(message))
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message:', { error })
        }
      }

      wsRef.current = ws
    } catch (error) {
      logger.error('Error creating WebSocket:', { error })
    }
  }, [url, reconnectInterval, reconnectAttempts, onOpen, onClose, onError, onMessage])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
      setIsConnected(false)
    }
  }, [])

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      logger.warn('WebSocket is not connected')
    }
  }, [])

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const listeners = listenersRef.current.get(eventType)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          listenersRef.current.delete(eventType)
        }
      }
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    connect,
    disconnect
  }
}

// Specific hooks for Teams and Outlook

export function useTeamsWebSocket() {
  const [teamsMessages, setTeamsMessages] = useState<any[]>([])

  const { isConnected, subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribeNew = subscribe('teams:new-message', (message) => {
      setTeamsMessages(prev => [...prev, message.data.message])
    })

    const unsubscribeUpdated = subscribe('teams:message-updated', (message) => {
      setTeamsMessages(prev =>
        prev.map(msg => msg.id === message.data.message.id ? message.data.message : msg)
      )
    })

    const unsubscribeDeleted = subscribe('teams:message-deleted', (message) => {
      setTeamsMessages(prev =>
        prev.filter(msg => msg.id !== message.data.messageId)
      )
    })

    return () => {
      unsubscribeNew()
      unsubscribeUpdated()
      unsubscribeDeleted()
    }
  }, [subscribe])

  return {
    isConnected,
    teamsMessages
  }
}

export function useOutlookWebSocket() {
  const [newEmails, setNewEmails] = useState<any[]>([])

  const { isConnected, subscribe } = useWebSocket()

  useEffect(() => {
    const unsubscribeNew = subscribe('outlook:new-email', (message) => {
      setNewEmails(prev => [...prev, message.data.email])
    })

    const unsubscribeUpdated = subscribe('outlook:email-updated', (message) => {
      setNewEmails(prev =>
        prev.map(email => email.id === message.data.email.id ? message.data.email : email)
      )
    })

    return () => {
      unsubscribeNew()
      unsubscribeUpdated()
    }
  }, [subscribe])

  return {
    isConnected,
    newEmails
  }
}
