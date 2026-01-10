// app/components/lib/visitor-tracker.ts
import { getRedisClient } from './redis';

export async function trackVisitor(visitorId: string, metadata?: any) {
  try {
    const redis = await getRedisClient();
    const visitorKey = `visitor:${visitorId}`;
    
    const visitorData = {
      id: visitorId,
      lastActivity: Date.now(),
      ...metadata,
    };

    // Store visitor data with 30 minute expiry
    await redis.setex(visitorKey, 30 * 60, JSON.stringify(visitorData));

    return true;
  } catch (error) {
    console.error('[Visitor Tracker] Error:', error);
    return false;
  }
}

export async function trackAnonymousActivity(
  action: string,
  details?: any
) {
  try {
    const redis = await getRedisClient();
    const now = new Date();
    const dateKey = now.toISOString().split('T')[0];
    const hour = now.getHours();

    // Track hourly activity count
    const hourlyKey = `activity:anonymous:${dateKey}:${hour}`;
    await redis.incr(hourlyKey);
    await redis.expire(hourlyKey, 7 * 24 * 60 * 60); // Expire after 7 days

    // Track daily activity count
    const dailyKey = `activity:anonymous:${dateKey}:day`;
    await redis.incr(dailyKey);
    await redis.expire(dailyKey, 30 * 24 * 60 * 60); // Expire after 30 days

    // Store recent activity detail
    const activityId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const activityKey = `activity:anonymous:recent:${activityId}`;
    const activityData = {
      action,
      details,
      timestamp: now.toISOString(),
    };

    await redis.setex(activityKey, 7 * 24 * 60 * 60, JSON.stringify(activityData)); // 7 days

    return true;
  } catch (error) {
    console.error('[Anonymous Activity Tracker] Error:', error);
    return false;
  }
}

export async function getOrCreateVisitorId(headers: Headers): Promise<string> {
  // Try to get visitor ID from various sources
  const forwarded = headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : headers.get('x-real-ip') || 'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';
  
  // Create a simple hash for visitor ID
  const visitorString = `${ip}_${userAgent}`;
  const visitorId = Buffer.from(visitorString).toString('base64').substring(0, 32);
  
  return visitorId;
}