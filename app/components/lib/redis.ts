// app/components/lib/redis.ts
import { Redis } from "@upstash/redis";

// Singleton pattern untuk Redis client
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not defined. Redis features will be disabled."
    );
    return null;
  }

  try {
    return new Redis({
      url,
      token,
    });
  } catch (error) {
    console.error("[Redis] Failed to create Redis client:", error);
    return null;
  }
}

// Bisa null jika environment variables tidak ada
export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// Helper untuk cek apakah Redis tersedia
export function isRedisAvailable(): boolean {
  return redis !== null;
}

// Export function untuk mendapatkan Redis client
export async function getRedisClient(): Promise<Redis> {
  if (!redis) {
    throw new Error("Redis client is not available");
  }
  return redis;
}

export default redis;