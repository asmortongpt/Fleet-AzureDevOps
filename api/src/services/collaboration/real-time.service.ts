/**
 * Real-Time Collaboration Service
 * WebSocket-based real-time updates for tasks and assets
 *
 * Features:
 * - Live task/asset updates
 * - Real-time comments and mentions
 * - Presence tracking (who's viewing what)
 * - Collaborative editing indicators
 * - Activity broadcasts
 * - Typing indicators
 */

import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import jwt from 'jsonwebtoken'
import pool from '../../config/database'

// Allowlist of valid comment tables
const COMMENT_TABLES = ['task_comments', 'asset_comments'] as const;
type CommentTable = typeof COMMENT_TABLES[number];

function isValidCommentTable(table: string): table is CommentTable {
  return COMMENT_TABLES.includes(table as CommentTable);
}

interface CollaborationUser {
  userId: string
  userName: string
  socketId: string
  currentView?: {
    type: 'task' | 'asset'
    id: string
  }
  isTyping?: boolean
}

interface ActivityEvent {
  type: 'task_updated' | 'asset_updated' | 'comment_added' | 'status_changed' | 'assignment_changed'
  entityType: 'task' | 'asset'
  entityId: string
  userId: string
  userName: string
  data: any
  timestamp: Date
}

export class CollaborationService {
  private io: SocketIOServer | null = null
  private activeUsers: Map<string, CollaborationUser> = new Map()
  private entityViewers: Map<string, Set<string>> = new Map() // entityId -> Set of userIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
        credentials: true
      },
      path: '/ws/collaboration'
    })

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication required'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
        socket.data.user = decoded
        next()
      } catch (error) {
        next(new Error('Invalid token'))
      }
    })

    this.io.on('connection', (socket) => {
      const user = socket.data.user
      console.log(`User connected: ${user.email} (${socket.id})`)

      // Register user
      this.activeUsers.set(socket.id, {
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        socketId: socket.id
      })

      // Join tenant room
      socket.join(`tenant:${user.tenant_id}`)

      // Handle viewing entity
      socket.on('view:entity', (data: { type: 'task' | 'asset', id: string }) => {
        this.handleViewEntity(socket, data)
      })

      // Handle leave entity
      socket.on('leave:entity', (data: { type: 'task' | 'asset', id: string }) => {
        this.handleLeaveEntity(socket, data)
      })

      // Handle typing indicator
      socket.on('typing:start', (data: { entityId: string }) => {
        this.handleTypingStart(socket, data)
      })

      socket.on('typing:stop', (data: { entityId: string }) => {
        this.handleTypingStop(socket, data)
      })

      // Handle real-time comment
      socket.on('comment:add', async (data: { entityType: 'task' | 'asset', entityId: string, text: string }) => {
        await this.handleAddComment(socket, data)
      })

      // Handle cursor position (for collaborative editing)
      socket.on('cursor:move', (data: { entityId: string, position: any }) => {
        this.handleCursorMove(socket, data)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })

    console.log('✨ Real-time collaboration service initialized')
  }

  /**
   * Handle user viewing an entity
   */
  private handleViewEntity(socket: any, data: { type: 'task' | 'asset', id: string }): void {
    const user = this.activeUsers.get(socket.id)
    if (!user) return

    const entityKey = `${data.type}:${data.id}`

    // Update user's current view
    user.currentView = { type: data.type, id: data.id }

    // Add to entity viewers
    if (!this.entityViewers.has(entityKey)) {
      this.entityViewers.set(entityKey, new Set())
    }
    this.entityViewers.get(entityKey)!.add(user.userId)

    // Join entity room
    socket.join(entityKey)

    // Broadcast to others viewing this entity
    socket.to(entityKey).emit('viewer:joined', {
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    })

    // Send current viewers to joining user
    const viewers = Array.from(this.entityViewers.get(entityKey) || [])
      .map(userId => {
        const viewerSocket = Array.from(this.activeUsers.values()).find(u => u.userId === userId)
        return viewerSocket ? { userId: viewerSocket.userId, userName: viewerSocket.userName } : null
      })
      .filter(Boolean)

    socket.emit('viewers:list', { viewers })
  }

  /**
   * Handle user leaving an entity view
   */
  private handleLeaveEntity(socket: any, data: { type: 'task' | 'asset', id: string }): void {
    const user = this.activeUsers.get(socket.id)
    if (!user) return

    const entityKey = `${data.type}:${data.id}`

    // Remove from entity viewers
    this.entityViewers.get(entityKey)?.delete(user.userId)

    // Leave entity room
    socket.leave(entityKey)

    // Broadcast to others
    socket.to(entityKey).emit('viewer:left', {
      userId: user.userId,
      userName: user.userName,
      timestamp: new Date()
    })

    // Clear current view
    user.currentView = undefined
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(socket: any, data: { entityId: string }): void {
    const user = this.activeUsers.get(socket.id)
    if (!user) return

    user.isTyping = true

    const entityKey = user.currentView ? `${user.currentView.type}:${user.currentView.id}` : null
    if (entityKey) {
      socket.to(entityKey).emit('typing:indicator', {
        userId: user.userId,
        userName: user.userName,
        isTyping: true
      })
    }
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(socket: any, data: { entityId: string }): void {
    const user = this.activeUsers.get(socket.id)
    if (!user) return

    user.isTyping = false

    const entityKey = user.currentView ? `${user.currentView.type}:${user.currentView.id}` : null
    if (entityKey) {
      socket.to(entityKey).emit('typing:indicator', {
        userId: user.userId,
        userName: user.userName,
        isTyping: false
      })
    }
  }

  /**
   * Handle add comment in real-time
   */
  private async handleAddComment(socket: any, data: { entityType: 'task' | 'asset', entityId: string, text: string }): Promise<void> {
    const user = socket.data.user

    try {
      const table: CommentTable = data.entityType === 'task' ? 'task_comments' : 'asset_comments'

      // Validate table name against allowlist to prevent SQL injection
      if (!isValidCommentTable(table)) {
        socket.emit('error', { message: 'Invalid entity type' })
        return
      }

      // Table and column names are validated/constant, safe to use in query
      const idColumn = data.entityType === 'task' ? 'task_id' : 'asset_id'
      const result = await pool.query(
        `INSERT INTO ${table} (${idColumn}, created_by, comment_text)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [data.entityId, user.id, data.text]
      )

      const comment = {
        ...result.rows[0],
        created_by_name: `${user.first_name} ${user.last_name}`
      }

      // Broadcast to all viewers
      const entityKey = `${data.entityType}:${data.entityId}`
      this.io!.to(entityKey).emit('comment:added', {
        entityType: data.entityType,
        entityId: data.entityId,
        comment
      })

      // Track activity
      this.trackActivity({
        type: 'comment_added',
        entityType: data.entityType,
        entityId: data.entityId,
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        data: { comment: data.text },
        timestamp: new Date()
      })
    } catch (error) {
      socket.emit('error', { message: 'Failed to add comment' })
    }
  }

  /**
   * Handle cursor movement for collaborative editing
   */
  private handleCursorMove(socket: any, data: { entityId: string, position: any }): void {
    const user = this.activeUsers.get(socket.id)
    if (!user || !user.currentView) return

    const entityKey = `${user.currentView.type}:${user.currentView.id}`
    socket.to(entityKey).emit('cursor:position', {
      userId: user.userId,
      userName: user.userName,
      position: data.position
    })
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(socket: any): void {
    const user = this.activeUsers.get(socket.id)
    if (!user) return

    // Remove from all entity viewers
    if (user.currentView) {
      const entityKey = `${user.currentView.type}:${user.currentView.id}`
      this.entityViewers.get(entityKey)?.delete(user.userId)

      // Notify others
      socket.to(entityKey).emit('viewer:left', {
        userId: user.userId,
        userName: user.userName,
        timestamp: new Date()
      })
    }

    // Remove from active users
    this.activeUsers.delete(socket.id)

    console.log(`User disconnected: ${user.userName}`)
  }

  /**
   * Broadcast entity update to all viewers
   */
  broadcastEntityUpdate(entityType: 'task' | 'asset', entityId: string, update: any, userId: string, userName: string): void {
    if (!this.io) return

    const entityKey = `${entityType}:${entityId}`
    this.io.to(entityKey).emit('entity:updated', {
      entityType,
      entityId,
      update,
      userId,
      userName,
      timestamp: new Date()
    })

    this.trackActivity({
      type: entityType === 'task' ? 'task_updated' : 'asset_updated',
      entityType,
      entityId,
      userId,
      userName,
      data: update,
      timestamp: new Date()
    })
  }

  /**
   * Broadcast status change
   */
  broadcastStatusChange(entityType: 'task' | 'asset', entityId: string, oldStatus: string, newStatus: string, userId: string, userName: string): void {
    if (!this.io) return

    const entityKey = `${entityType}:${entityId}`
    this.io.to(entityKey).emit('status:changed', {
      entityType,
      entityId,
      oldStatus,
      newStatus,
      userId,
      userName,
      timestamp: new Date()
    })

    this.trackActivity({
      type: 'status_changed',
      entityType,
      entityId,
      userId,
      userName,
      data: { oldStatus, newStatus },
      timestamp: new Date()
    })
  }

  /**
   * Broadcast assignment change
   */
  broadcastAssignmentChange(entityType: 'task' | 'asset', entityId: string, oldAssignee: string | null, newAssignee: string, userId: string, userName: string): void {
    if (!this.io) return

    const entityKey = `${entityType}:${entityId}`
    this.io.to(entityKey).emit('assignment:changed', {
      entityType,
      entityId,
      oldAssignee,
      newAssignee,
      userId,
      userName,
      timestamp: new Date()
    })

    this.trackActivity({
      type: 'assignment_changed',
      entityType,
      entityId,
      userId,
      userName,
      data: { oldAssignee, newAssignee },
      timestamp: new Date()
    })
  }

  /**
   * Broadcast to tenant
   */
  broadcastToTenant(tenantId: string, event: string, data: any): void {
    if (!this.io) return
    this.io.to(`tenant:${tenantId}`).emit(event, data)
  }

  /**
   * Get active viewers for an entity
   */
  getActiveViewers(entityType: 'task' | 'asset', entityId: string): CollaborationUser[] {
    const entityKey = `${entityType}:${entityId}`
    const viewerIds = this.entityViewers.get(entityKey) || new Set()

    return Array.from(this.activeUsers.values())
      .filter(user => viewerIds.has(user.userId))
  }

  /**
   * Get online users count for tenant
   */
  getOnlineUsersCount(tenantId: string): number {
    return this.io?.sockets.adapter.rooms.get(`tenant:${tenantId}`)?.size || 0
  }

  /**
   * Track activity for audit trail
   */
  private async trackActivity(event: ActivityEvent): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO activity_log (entity_type, entity_id, event_type, user_id, user_name, event_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          event.entityType,
          event.entityId,
          event.type,
          event.userId,
          event.userName,
          JSON.stringify(event.data),
          event.timestamp
        ]
      )
    } catch (error) {
      console.error('Failed to track activity:', error)
    }
  }
}

// Global instance
export const collaborationService = new CollaborationService()

export default collaborationService
