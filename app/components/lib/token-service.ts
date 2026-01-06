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

// Verify Token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
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
    await redis!.setex(key, SESSION_EXPIRES_IN, JSON.stringify(sessionData));
    
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
    return null;
  }

  try {
    const key = `session:${sessionId}`;
    const data = await redis!.get(key);
    
    if (!data) {
      console.log(`[Session] Not found: ${sessionId}`);
      return null;
    }

    return JSON.parse(data as string) as SessionData;
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
    await redis!.setex(key, SESSION_EXPIRES_IN, JSON.stringify(session));
    
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
    await redis!.setex(accessKey, 60 * 60, accessToken); // 1 hour in seconds

    // Store refresh token (30 days)
    const refreshKey = `refresh_token:${sessionId}`;
    await redis!.setex(refreshKey, SESSION_EXPIRES_IN, refreshToken);

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

// Refresh Access Token
export async function refreshAccessToken(
  oldAccessToken: string,
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    // Verify refresh token
    const refreshPayload = verifyToken(refreshToken);
    if (!refreshPayload || refreshPayload.type !== "refresh") {
      return { success: false, error: "Invalid refresh token" };
    }

    // Check if refresh token exists in Redis
    const storedRefreshToken = await getRefreshToken(refreshPayload.sessionId);
    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      return { success: false, error: "Refresh token not found or invalid" };
    }

    // Check if session is still valid
    const session = await getSession(refreshPayload.sessionId);
    if (!session) {
      return { success: false, error: "Session expired" };
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: refreshPayload.userId,
      email: refreshPayload.email,
      role: refreshPayload.role,
      sessionId: refreshPayload.sessionId,
    });

    // Store new access token in Redis
    const accessKey = `access_token:${refreshPayload.sessionId}`;
    await redis!.setex(accessKey, 60 * 60, newAccessToken);

    // Update session activity
    await updateSessionActivity(refreshPayload.sessionId);

    console.log(`[Tokens] Refreshed access token for session: ${refreshPayload.sessionId}`);

    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    console.error("[Tokens] Refresh error:", error);
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