import type { RedisClientType } from "redis";
import { Server, Socket } from "socket.io";
import { z } from "zod";
import { Pool } from "pg";
import { pool } from "../db";

interface Presence {
  userId: string;
  taskId: string;
}

const presenceSchema = z.object({
  userId: z.string(),
  taskId: z.string(),
});

export class PresenceService {
  private io: Server;
  private redis: RedisClientType;
  private presenceMap: Map<string, Presence[]> = new Map();
  private db: Pool;

  constructor(io: Server, redis: RedisClientType, dbPool?: Pool) {
    this.io = io;
    this.redis = redis;
    this.db = dbPool || pool;
    this.initializeListeners();
  }

  private initializeListeners(): void {
    this.io.on("connection", (socket: Socket) => {
      socket.on("JOIN_TASK", async (data: unknown) => {
        try {
          const validatedData = presenceSchema.parse(data);
          await this.joinTask(socket, validatedData.userId, validatedData.taskId);
        } catch (error) {
          console.error("Error joining task:", error);
          socket.emit("ERROR", { message: "Invalid data format for joining task." });
        }
      });

      socket.on("LEAVE_TASK", async (data: unknown) => {
        try {
          const validatedData = presenceSchema.parse(data);
          await this.leaveTask(socket, validatedData.userId, validatedData.taskId);
        } catch (error) {
          console.error("Error leaving task:", error);
          socket.emit("ERROR", { message: "Invalid data format for leaving task." });
        }
      });

      socket.on("disconnect", async () => {
        try {
          await this.handleDisconnect(socket);
        } catch (error) {
          console.error("Error handling disconnect:", error);
        }
      });
    });
  }

  private async joinTask(socket: Socket, userId: string, taskId: string): Promise<void> {
    // SECURITY FIX: Validate task belongs to user's tenant
    const tenantId = (socket as any).tenantId;

    if (!tenantId) {
      console.warn(`[Presence] User ${userId} attempted to join task ${taskId} without tenant context`);
      socket.emit("ERROR", {
        code: "ACCESS_DENIED",
        message: "No tenant context available"
      });
      return;
    }

    try {
      const taskExists = await this.db.query(
        'SELECT id FROM tasks WHERE id = $1 AND tenant_id = $2',
        [taskId, tenantId]
      );

      if (taskExists.rows.length === 0) {
        console.warn(`[Presence] User ${userId} attempted to join task ${taskId} without access`);
        socket.emit("ERROR", {
          code: "ACCESS_DENIED",
          message: "Task not found or access denied"
        });
        return;
      }

      // Task validation passed, proceed with join
      const presence: Presence = { userId, taskId };
      if (!this.presenceMap.has(taskId)) {
        this.presenceMap.set(taskId, []);
      }
      this.presenceMap.get(taskId)!.push(presence);
      socket.join(taskId);
      this.io.to(taskId).emit("USER_JOINED", { userId, taskId });
      await this.redis.sadd(`task:${taskId}:viewers`, userId);
    } catch (error) {
      console.error(`[Presence] Error validating task access: ${error}`);
      socket.emit("ERROR", {
        code: "INTERNAL_ERROR",
        message: "Failed to validate task access"
      });
    }
  }

  private async leaveTask(socket: Socket, userId: string, taskId: string): Promise<void> {
    const presences = this.presenceMap.get(taskId);
    if (presences) {
      const index = presences.findIndex((p) => p.userId === userId);
      if (index !== -1) {
        presences.splice(index, 1);
        if (presences.length === 0) {
          this.presenceMap.delete(taskId);
        } else {
          this.presenceMap.set(taskId, presences);
        }
        this.io.to(taskId).emit("USER_LEFT", { userId, taskId });
        await this.redis.srem(`task:${taskId}:viewers`, userId);
      }
    }
    socket.leave(taskId);
  }

  private async handleDisconnect(socket: Socket): Promise<void> {
    // This method would ideally iterate over all tasks the user is viewing and remove them accordingly.
    // For brevity, the implementation details are omitted.
  }
}