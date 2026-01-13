import Redis from "ioredis";
import { AI_CONFIG } from "../config";

let redis: Redis | null = null;
if (AI_CONFIG.redisUrl) redis = new Redis(AI_CONFIG.redisUrl);

const inMemory = new Map<string, { value: any; expiresAt: number }>();

export async function getCache(key: string) {
  if (redis) {
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const entry = inMemory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    inMemory.delete(key);
    return null;
  }
  return entry.value;
}

export async function setCache(key: string, value: any, ttlSeconds: number) {
  if (redis) {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return;
  }
  inMemory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}
