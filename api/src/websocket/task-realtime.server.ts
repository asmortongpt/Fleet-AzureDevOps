import { Server as HttpServer } from 'http';

import jwt from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';

import { getJwtSecret } from '../config/jwt.config';
import logger from '../utils/logger';

/**
 * Task Real-Time WebSocket Server
 *
 * Provides real-time updates for task management:
 * - Task creation, updates, assignments, and deletions
 * - Comment additions
 * - Multi-tenant isolation
 * - JWT authentication
 */

let io: Server | null = null;

const taskEventTypes = ['TASK_CREATED', 'TASK_UPDATED', 'TASK_ASSIGNED', 'TASK_DELETED', 'COMMENT_ADDED'];

interface DecodedToken {
  userId: string;
  tenantId: string;
  iat?: number;
  exp?: number;
}

/**
 * Initialize the WebSocket server for task real-time updates
 * @param httpServer - The HTTP server instance to attach to
 */
export function initializeWebSocketServer(httpServer: HttpServer): void {
  console.log('🔌 Initializing Task Real-Time WebSocket Server...');

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
    path: '/socket.io/tasks',
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        logger.error('[WebSocket Auth] Token missing', {
          socketId: socket.id,
          handshake: socket.handshake.address
        });
        return next(new Error('Authentication token missing'));
      }

      // Extract tenant ID from token query parameter or default to env variable
      const queryTenantId = socket.handshake.query.tenantId as string;
      const tenantId = queryTenantId || process.env.TENANT_ID;

      if (!tenantId) {
        logger.error('[WebSocket Auth] Tenant ID missing', {
          socketId: socket.id
        });
        return next(new Error('Tenant ID missing'));
      }

      try {
        // Retrieve JWT secret for the tenant
        const jwtSecret = await getJwtSecret(tenantId);

        // Verify JWT token
        const decoded = jwt.verify(token, jwtSecret, {
          algorithms: ['HS256'],
          issuer: 'fleet-management-api',
          audience: 'fleet-management-client'
        }) as DecodedToken;

        // Validate decoded token structure
        if (!decoded.userId || !decoded.tenantId) {
          logger.error('[WebSocket Auth] Invalid token structure', {
            socketId: socket.id,
            hasUserId: !!decoded.userId,
            hasTenantId: !!decoded.tenantId
          });
          return next(new Error('Invalid token structure'));
        }

        // Verify tenant ID matches
        if (decoded.tenantId !== tenantId) {
          logger.error('[WebSocket Auth] Tenant ID mismatch', {
            socketId: socket.id,
            tokenTenantId: decoded.tenantId,
            requestedTenantId: tenantId
          });
          return next(new Error('Tenant ID mismatch'));
        }

        // Store authenticated user data
        socket.data.userId = decoded.userId;
        socket.data.tenantId = decoded.tenantId;

        logger.info('[WebSocket Auth] Authentication successful', {
          socketId: socket.id,
          userId: decoded.userId,
          tenantId: decoded.tenantId
        });

        next();
      } catch (jwtError) {
        if (jwtError instanceof jwt.TokenExpiredError) {
          logger.error('[WebSocket Auth] Token expired', {
            socketId: socket.id,
            expiredAt: jwtError.expiredAt
          });
          return next(new Error('Token expired'));
        } else if (jwtError instanceof jwt.JsonWebTokenError) {
          logger.error('[WebSocket Auth] Invalid token', {
            socketId: socket.id,
            message: jwtError.message
          });
          return next(new Error('Invalid token'));
        } else {
          logger.error('[WebSocket Auth] JWT verification failed', {
            socketId: socket.id,
            error: jwtError
          });
          return next(new Error('JWT verification failed'));
        }
      }
    } catch (error) {
      logger.error('[WebSocket Auth] Authentication error', {
        socketId: socket.id,
        error: error instanceof Error ? error.message : String(error)
      });
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Task WebSocket: User ${socket.data.userId} connected`);

    // Join tenant-specific room for multi-tenant isolation
    socket.join(`tenant:${socket.data.tenantId}`);

    // Handle task events
    socket.onAny(async (eventName, ...args) => {
      try {
        if (!taskEventTypes.includes(eventName)) {
          throw new Error('Invalid event type');
        }

        const payload = args[0];

        // Broadcast to all users in the same tenant
        io?.to(`tenant:${socket.data.tenantId}`).emit(eventName, payload);

        console.log(`📡 Task event: ${eventName} from user ${socket.data.userId}`);
      } catch (error) {
        console.error('Error handling task event:', error);
        socket.emit('error', 'Event processing error');
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Task WebSocket: User ${socket.data.userId} disconnected`);
    });
  });

  console.log('✅ Task Real-Time WebSocket Server initialized');
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketServer(): Server | null {
  return io;
}

/**
 * Emit a task event to all connected clients in a tenant
 */
export function emitTaskEvent(tenantId: string, eventName: string, payload: any): void {
  if (!io) {
    console.warn('WebSocket server not initialized');
    return;
  }

  io.to(`tenant:${tenantId}`).emit(eventName, payload);
}