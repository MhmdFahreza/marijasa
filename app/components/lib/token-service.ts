// app/components/lib/token-service.ts
import jwt from "jsonwebtoken";
import { redis, isRedisAvailable } from "./redis";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-jwt-secret-key";
const ACCESS_TOKEN_EXPIRES_IN = "1h"; // 1 hour
const REFRESH_TOKEN_EXPIRES_IN = "30d"; // 30 days
const SESSION_EXPIRES_IN = 30 * 24 * 60 * 60; // 30 days in seconds

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  type: "access" | "refresh";
}

interface SessionData {
  userId: string;
  email: string;
  role: string;
  createdAt: number;
  lastActivity: number;
  userAgent?: string;
  ip?: string;
}

// Helper to safely handle Upstash Redis data
function parseRedisData<T>(data: any): T | null {
  if (!data) return null;
  
  // If data is already an object (Upstash auto-deserialized it)
  if (typeof data === 'object' && !Buffer.isBuffer(data)) {
    return data as T;
  }
  
  // If data is a string, parse it
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('[Redis] Failed to parse JSON:', error);
      return null;
    }
  }
  
  console.error('[Redis] Unexpected data type:', typeof data);
  return null;
}

// Generate Access Token (1 hour)
export function generateAccessToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

// Generate Refresh Token (30 days)
export function generateRefreshToken(payload: Omit<TokenPayload, "type">): string {
  return jwt.sign(
    { ...payload, type: "refresh" },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

// Verify Token - now allows expired tokens for refresh flow
export function verifyToken(token: string, ignoreExpiration: boolean = false): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { 
      ignoreExpiration 
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError && ignoreExpiration) {
      // If we're ignoring expiration, decode without verification
      try {
        const decoded = jwt.decode(token) as TokenPayload;
        return decoded;
      } catch (decodeError) {
        console.error("[Token] Decode failed:", decodeError);
        return null;
      }
    }
    console.error("[Token] Verification failed:", error);
    return null;
  }
}

// Create Session ID
export function createSessionId(): string {
  return uuidv4();
}

// Store Session in Redis
export async function storeSession(
  sessionId: string,
  sessionData: SessionData
): Promise<{ success: boolean; error?: string }> {
  if (!isRedisAvailable()) {
    console.warn("[Session] Redis not available, session will not persist");
    return { success: false, error: "Redis not available" };
  }

  try {
    const key = `session:${sessionId}`;
    
    // Store as JSON string to ensure consistency
    await redis!.set(key, JSON.stringify(sessionData), { ex: SESSION_EXPIRES_IN });
    
    console.log(`[Session] Created: ${sessionId} for user ${sessionData.userId}`);
    return { success: true };
  } catch (error) {
    console.error("[Session] Store error:", error);
    return { success: false, error: "Failed to store session" };
  }
}

// Get Session from Redis
export async function getSession(sessionId: string): Promise<SessionData | null> {
  if (!isRedisAvailable()) {
    console.warn("[Session] Redis not available");
    return null;
  }

  try {
    const key = `session:${sessionId}`;
    const data = await redis!.get(key);
    
    if (!data) {
      console.log(`[Session] Not found: ${sessionId}`);
      return null;
    }

    // Parse the data
    const parsed = parseRedisData<SessionData>(data);
    
    if (!parsed) {
      console.error(`[Session] Failed to parse session data for: ${sessionId}`);
      // Clean up corrupted data
      await redis!.del(key);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[Session] Get error:", error);
    return null;
  }
}

// Update Session Last Activity
export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const session = await getSession(sessionId);
    if (!session) return false;

    session.lastActivity = Date.now();
    
    const key = `session:${sessionId}`;
    await redis!.set(key, JSON.stringify(session), { ex: SESSION_EXPIRES_IN });
    
    return true;
  } catch (error) {
    console.error("[Session] Update activity error:", error);
    return false;
  }
}

// Delete Session from Redis
export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const key = `session:${sessionId}`;
    await redis!.del(key);
    
    console.log(`[Session] Deleted: ${sessionId}`);
    return true;
  } catch (error) {
    console.error("[Session] Delete error:", error);
    return false;
  }
}

// Store Tokens in Redis
export async function storeTokens(
  sessionId: string,
  accessToken: string,
  refreshToken: string
): Promise<{ success: boolean; error?: string }> {
  if (!isRedisAvailable()) {
    console.warn("[Tokens] Redis not available, tokens will not persist");
    return { success: false, error: "Redis not available" };
  }

  try {
    // Store access token (1 hour)
    const accessKey = `access_token:${sessionId}`;
    await redis!.set(accessKey, accessToken, { ex: 60 * 60 });

    // Store refresh token (30 days)
    const refreshKey = `refresh_token:${sessionId}`;
    await redis!.set(refreshKey, refreshToken, { ex: SESSION_EXPIRES_IN });

    console.log(`[Tokens] Stored for session: ${sessionId}`);
    return { success: true };
  } catch (error) {
    console.error("[Tokens] Store error:", error);
    return { success: false, error: "Failed to store tokens" };
  }
}

// Get Access Token from Redis
export async function getAccessToken(sessionId: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const key = `access_token:${sessionId}`;
    const token = await redis!.get(key);
    return token as string | null;
  } catch (error) {
    console.error("[Tokens] Get access token error:", error);
    return null;
  }
}

// Get Refresh Token from Redis
export async function getRefreshToken(sessionId: string): Promise<string | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const key = `refresh_token:${sessionId}`;
    const token = await redis!.get(key);
    return token as string | null;
  } catch (error) {
    console.error("[Tokens] Get refresh token error:", error);
    return null;
  }
}

// Delete Tokens from Redis
export async function deleteTokens(sessionId: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const accessKey = `access_token:${sessionId}`;
    const refreshKey = `refresh_token:${sessionId}`;
    
    await redis!.del(accessKey);
    await redis!.del(refreshKey);
    
    console.log(`[Tokens] Deleted for session: ${sessionId}`);
    return true;
  } catch (error) {
    console.error("[Tokens] Delete error:", error);
    return false;
  }
}

// Refresh Access Token - UPDATED SIGNATURE
export async function refreshAccessToken(
  sessionId: string,
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  console.log("[Token Refresh] Starting refresh process for session:", sessionId);
  
  if (!isRedisAvailable()) {
    console.error("[Token Refresh] Redis not available");
    return { success: false, error: "Redis not available" };
  }

  try {
    // Verify refresh token
    const refreshPayload = verifyToken(refreshToken);
    if (!refreshPayload || refreshPayload.type !== "refresh") {
      console.error("[Token Refresh] Invalid refresh token type");
      return { success: false, error: "Invalid refresh token" };
    }

    console.log("[Token Refresh] Refresh token payload:", {
      userId: refreshPayload.userId,
      sessionId: refreshPayload.sessionId,
      type: refreshPayload.type
    });

    // Verify session ID matches
    if (refreshPayload.sessionId !== sessionId) {
      console.error("[Token Refresh] Session ID mismatch:", {
        fromToken: refreshPayload.sessionId,
        fromCookie: sessionId
      });
      return { success: false, error: "Session ID mismatch" };
    }

    // Check if refresh token exists in Redis
    const storedRefreshToken = await getRefreshToken(sessionId);
    if (!storedRefreshToken) {
      console.error("[Token Refresh] Refresh token not found in Redis for session:", sessionId);
      return { success: false, error: "Refresh token not found" };
    }

    if (storedRefreshToken !== refreshToken) {
      console.error("[Token Refresh] Refresh token mismatch");
      return { success: false, error: "Invalid refresh token" };
    }

    // Check if session is still valid
    const session = await getSession(sessionId);
    if (!session) {
      console.error("[Token Refresh] Session not found or expired:", sessionId);
      return { success: false, error: "Session expired" };
    }

    console.log("[Token Refresh] Session validated for user:", session.userId);

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      role: refreshPayload.role,
      sessionId: refreshPayload.sessionId,
    });

    // Store new access token in Redis
    const accessKey = `access_token:${sessionId}`;
    await redis!.set(accessKey, newAccessToken, { ex: 60 * 60 });

    // Update session activity
    await updateSessionActivity(sessionId);

    console.log(`[Token Refresh] Successfully refreshed token for session: ${sessionId}`);

    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    console.error("[Token Refresh] Unexpected error:", error);
    return { success: false, error: "Failed to refresh token" };
  }
}

// Cleanup expired sessions (can be called by cron job)
export async function cleanupExpiredSessions(): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    // Redis automatically removes expired keys, so this is just for logging
    console.log("[Session] Cleanup completed (Redis handles expiration automatically)");
    return 0;
  } catch (error) {
    console.error("[Session] Cleanup error:", error);
    return 0;
  }
}

// Delete all sessions for a user (useful for security)
export async function deleteAllUserSessions(userId: string): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    // This would require maintaining a user-sessions mapping
    // For now, we'll just log it
    console.log(`[Session] Delete all sessions for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("[Session] Delete all user sessions error:", error);
    return false;
  }
}