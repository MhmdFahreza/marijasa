// app/components/lib/redis-helpers.ts
// Helper functions for Redis data handling

/**
 * Safely parse Redis data that might be string or object
 */
export function parseRedisData<T = any>(data: any): T | null {
  if (!data) {
    return null;
  }

  // If already an object, return as is
  if (typeof data === 'object' && data !== null) {
    return data as T;
  }

  // If string, try to parse as JSON
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('[Redis Helper] Failed to parse JSON:', error);
      return null;
    }
  }

  // Unknown type
  console.error('[Redis Helper] Unknown data type:', typeof data);
  return null;
}

/**
 * Safely convert Redis data to string
 */
export function redisDataToString(data: any): string | null {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object') {
    try {
      return JSON.stringify(data);
    } catch (error) {
      console.error('[Redis Helper] Failed to stringify object:', error);
      return String(data);
    }
  }

  return String(data);
}

/**
 * Type guard to check if data is a valid session object
 */
export interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  createdAt: string;
  lastAccess: string;
}

export function isValidAdminSession(data: any): data is AdminSession {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.adminId === 'string' &&
    typeof data.email === 'string' &&
    typeof data.name === 'string' &&
    typeof data.createdAt === 'string' &&
    typeof data.lastAccess === 'string'
  );
}

/**
 * Safely get and parse session from Redis
 */
export async function getAdminSession(
  redis: any,
  sessionId: string
): Promise<AdminSession | null> {
  try {
    const data = await redis.get(`admin_session:${sessionId}`);
    const parsed = parseRedisData<AdminSession>(data);
    
    if (parsed && isValidAdminSession(parsed)) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.error('[Redis Helper] Error getting admin session:', error);
    return null;
  }
}

/**
 * Safely get token from Redis
 */
export async function getAdminToken(
  redis: any,
  sessionId: string,
  tokenType: 'access' | 'refresh'
): Promise<string | null> {
  try {
    const key = `admin_${tokenType}_token:${sessionId}`;
    const data = await redis.get(key);
    return redisDataToString(data);
  } catch (error) {
    console.error(`[Redis Helper] Error getting ${tokenType} token:`, error);
    return null;
  }
}