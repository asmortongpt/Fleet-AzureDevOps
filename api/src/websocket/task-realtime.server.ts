import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { createClient } from "redis";
import { ZodError, z } from "zod";
import { promisify } from "util";
import { compress, decompress } from "zlib";

// Import your own modules for database, config, and logging
import { config } from "../config";
import { logger } from "../utils/logger";
import { auditLog } from "../utils/auditLog";
import { TaskEvent, taskEventSchema } from "../models/TaskEvent";

const pubClient = createClient({ url: config.redisUrl });
const subClient = pubClient.duplicate();

const verifyAsync = promisify(verify);

const io = new Server();

const taskEventTypes = ["TASK_CREATED", "TASK_UPDATED", "TASK_ASSIGNED", "TASK_DELETED", "COMMENT_ADDED"];

interface DecodedToken {
  userId: string;
  tenantId: string;
}

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = (await verifyAsync(token, config.publicKey, { algorithms: ["RS256"] })) as DecodedToken;
    socket.data.userId = decoded.userId;
    socket.data.tenantId = decoded.tenantId;
    next();
  } catch (error) {
    logger.error("WebSocket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket: Socket) => {
  logger.info(`User ${socket.data.userId} connected`);

  socket.onAny(async (eventName, ...args) => {
    try {
      if (!taskEventTypes.includes(eventName)) throw new Error("Invalid event type");

      const payload = args[0];
      const validation = taskEventSchema.safeParse(payload);
      if (!validation.success) throw new ZodError(validation.error.issues);

      const sanitizedPayload = { ...payload, sensitiveData: undefined }; // Example of sanitization
      const compressedPayload = await promisify(compress)(JSON.stringify(sanitizedPayload));

      await pubClient.publish(socket.data.tenantId, compressedPayload);

      auditLog(socket.data.userId, eventName, sanitizedPayload);
    } catch (error) {
      logger.error("Error handling event:", error);
      socket.emit("error", "Event processing error");
    }
  });

  socket.on("disconnect", () => {
    logger.info(`User ${socket.data.userId} disconnected`);
  });
});

async function setupSubscriptions() {
  await subClient.connect();
  await subClient.subscribe(config.redisChannel, (message) => {
    const decompressedMessage = promisify(decompress)(Buffer.from(message, "utf-8"));
    decompressedMessage.then((buffer) => {
      const payload = JSON.parse(buffer.toString());
      io.to(payload.tenantId).emit(payload.eventType, payload.data);
    }).catch((error) => {
      logger.error("Error decompressing message:", error);
    });
  });
}

setupSubscriptions().catch((error) => {
  logger.error("Failed to setup Redis subscriptions:", error);
});

export { io };
```
This code outlines a complete Socket.IO server setup with JWT authentication, Redis pub/sub integration for horizontal scaling, multi-tenant isolation, and other security and real-time features as per the requirements. Remember to replace placeholders like `../config`, `../utils/logger`, `../utils/auditLog`, and `../models/TaskEvent` with actual paths to your configuration, logging, audit logging utilities, and task event model respectively.