import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

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
        throw new Error('Authentication token missing');
      }

      // TODO: Implement proper JWT verification when JWT_SECRET is configured
      // For now, we'll skip auth in development mode
      if (process.env.NODE_ENV === 'development') {
        socket.data.userId = 'dev-user';
        socket.data.tenantId = 'dev-tenant';
        next();
      } else {
        throw new Error('JWT authentication not yet configured');
      }
    } catch (error) {
      console.error('WebSocket authentication error:', error);
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