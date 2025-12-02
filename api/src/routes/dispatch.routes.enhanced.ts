import express, { Request, Response } from 'express';
import { z } from 'zod';
import dispatchService from '../services/dispatch.service';
import webrtcService from '../services/webrtc.service';
import { pool } from '../config/database';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import csurf from 'csurf';
import { Server } from 'socket.io';
import http from 'http';

const router = express.Router();
const server = http.createServer(router);
const io = new Server(server);

// Security Enhancements
router.use(helmet());
router.use(express.json());
router.use(csurf());
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
}));

// Apply authentication to all routes
router.use(authenticateJWT);

// Channel Schema for validation
const channelSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  channelType: z.string(),
  priorityLevel: z.number().int(),
  colorCode: z.string().regex(/^#[0-9A-F]{6}$/i),
});

// Error handling middleware
const errorHandler = (err, req: Request, res: Response, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
};

// Real-time WebSocket setup
io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinChannel', (channelId) => {
    socket.join(channelId);
    console.log(`User joined channel ${channelId}`);
  });

  socket.on('leaveChannel', (channelId) => {
    socket.leave(channelId);
    console.log(`User left channel ${channelId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Routes
router.get('/channels', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // From auth middleware, with TypeScript strict mode

    const channels = await dispatchService.getChannels(userId);

    res.json({
      success: true,
      channels,
    });
  } catch (error) {
    console.error('Error getting dispatch channels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dispatch channels',
    });
  }
});

// POST /api/dispatch/channels - Create new channel (admin)
router.post('/channels', requirePermission('admin:create:channel'), async (req: Request, res: Response) => {
  try {
    const channelData = channelSchema.parse(req.body);
    const newChannel = await dispatchService.createChannel(channelData);

    // Emit event to all clients about the new channel
    io.emit('channelCreated', newChannel);

    res.status(201).json({
      success: true,
      channel: newChannel,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: error.errors });
    }
    console.error('Error creating new dispatch channel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create new dispatch channel',
    });
  }
});

// Error handling middleware should be the last piece of middleware to use
router.use(errorHandler);

export { router, server, io };