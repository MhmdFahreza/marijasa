// app/components/lib/activity-logger.ts
import prisma from './prisma';
import { trackAnonymousActivity } from './visitor-tracker';

type ActivityLogData = {
  type: string;
  action: string;
  description?: string;
  userId?: string;
  vendorId?: string;
  adminId?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  page?: string;
};

export async function logActivity(data: ActivityLogData) {
  try {
    // If it's an anonymous activity, also track in Redis
    if (!data.userId && !data.vendorId && !data.adminId) {
      await trackAnonymousActivity(data.action, {
        type: data.type,
        page: data.page,
        ...data.metadata,
      });
    }

    // Log to database
    const activity = await prisma.activityLog.create({
      data: {
        type: data.type as any,
        action: data.action,
        description: data.description,
        user_id: data.userId,
        vendor_id: data.vendorId,
        admin_id: data.adminId,
        metadata: data.metadata || {},
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        page: data.page,
      },
    });

    return activity;
  } catch (error) {
    console.error('[Activity Logger] Error:', error);
    // Don't throw error, just log it
    return null;
  }
}

// Helper functions for common activities

export async function logUserActivity(
  userId: string,
  type: string,
  action: string,
  metadata?: any,
  request?: { ip?: string; userAgent?: string; page?: string }
) {
  return logActivity({
    type,
    action,
    userId,
    metadata,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
    page: request?.page,
  });
}

export async function logMitraActivity(
  vendorId: string,
  type: string,
  action: string,
  metadata?: any,
  request?: { ip?: string; userAgent?: string; page?: string }
) {
  return logActivity({
    type,
    action,
    vendorId,
    metadata,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
    page: request?.page,
  });
}

export async function logAdminActivity(
  adminId: string,
  type: string,
  action: string,
  metadata?: any,
  request?: { ip?: string; userAgent?: string; page?: string }
) {
  return logActivity({
    type,
    action,
    adminId,
    metadata,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
    page: request?.page,
  });
}

export async function logAnonymousActivity(
  type: string,
  action: string,
  metadata?: any,
  request?: { ip?: string; userAgent?: string; page?: string }
) {
  return logActivity({
    type,
    action,
    metadata,
    ipAddress: request?.ip,
    userAgent: request?.userAgent,
    page: request?.page,
  });
}