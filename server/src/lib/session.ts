import crypto from 'crypto';

import RedisStore from 'connect-redis';
import session from 'express-session';

import { redis } from './cache';


export const sessionMiddleware = session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  name: 'fleet.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
});

interface SessionData {
  userId: number;
  tenantId: number;
  deviceInfo: string;
  createdAt: number;
  lastActivity: number;
}

export async function createSession(
  userId: number,
  tenantId: number,
  deviceInfo: string
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const sessionKey = `session:${tenantId}:${userId}:${sessionId}`;

  const sessionData: SessionData = {
    userId,
    tenantId,
    deviceInfo,
    createdAt: Date.now(),
    lastActivity: Date.now()
  };

  await redis.setex(
    sessionKey,
    30 * 60, // 30 minutes
    JSON.stringify(sessionData)
  );

  await redis.sadd(`user_sessions:${tenantId}:${userId}`, sessionId);

  const sessions = await redis.smembers(`user_sessions:${tenantId}:${userId}`);
  if (sessions.length > 5) {
    const sortedSessions = await Promise.all(
      sessions.map(async (sid) => {
        const data = await redis.get(`session:${tenantId}:${userId}:${sid}`);
        return { sid, lastActivity: JSON.parse(data || '{}').lastActivity };
      })
    );

    sortedSessions.sort((a, b) => a.lastActivity - b.lastActivity);

    for (let i = 0; i < sortedSessions.length - 5; i++) {
      await revokeSession(userId, tenantId, sortedSessions[i].sid);
    }
  }

  return sessionId;
}

export async function refreshSession(
  userId: number,
  tenantId: number,
  sessionId: string
): Promise<void> {
  const sessionKey = `session:${tenantId}:${userId}:${sessionId}`;
  const data = await redis.get(sessionKey);

  if (data) {
    const sessionData: SessionData = JSON.parse(data);
    sessionData.lastActivity = Date.now();
    await redis.setex(sessionKey, 30 * 60, JSON.stringify(sessionData));
  }
}

export async function revokeSession(
  userId: number,
  tenantId: number,
  sessionId: string
): Promise<void> {
  await redis.del(`session:${tenantId}:${userId}:${sessionId}`);
  await redis.srem(`user_sessions:${tenantId}:${userId}`, sessionId);
}

export async function revokeAllSessions(
  userId: number,
  tenantId: number
): Promise<void> {
  const sessions = await redis.smembers(`user_sessions:${tenantId}:${userId}`);
  for (const sessionId of sessions) {
    await revokeSession(userId, tenantId, sessionId);
  }
}