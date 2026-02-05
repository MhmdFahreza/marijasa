// app/components/contexts/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  type:
    | "order"
    | "promo"
    | "system"
    | "reminder"
    | "additional_service"
    | "payment"
    | "completion"
    | "cancellation";
  read: boolean;
  orderId?: string;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string, e?: React.MouseEvent) => void;
  deleteAllNotifications: (e?: React.MouseEvent) => void;
  resetNotifications: () => void;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// ⚡ OPTIMIZED POLLING: Smart intervals with exponential backoff
const FAST_POLLING_INTERVAL = 5000; // 5 seconds - when tab is visible
const SLOW_POLLING_INTERVAL = 30000; // 30 seconds - when tab is hidden
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRY_DELAY = 30000; // 30 seconds
const FETCH_TIMEOUT = 10000; // 10 seconds timeout

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated, refreshUser } = useAuth();
  
  // Refs for optimization
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const audioInitializedRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryCountRef = useRef<number>(0);
  const isTabVisibleRef = useRef<boolean>(true);
  const consecutiveErrorsRef = useRef<number>(0);
  const lastSuccessTimestampRef = useRef<number>(Date.now());
  const backoffDelayRef = useRef<number>(INITIAL_RETRY_DELAY);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ============================================
  // AUDIO SETUP - Simplified & Optimized
  // ============================================
  const initializeAudio = useCallback(() => {
    if (audioInitializedRef.current || typeof window === "undefined") {
      return true;
    }
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || 
          (window as any).webkitAudioContext)();
        
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().then(() => {
            audioInitializedRef.current = true;
          }).catch(() => {
            // Silent fail
          });
        } else {
          audioInitializedRef.current = true;
        }
        return true;
      }
    } catch (error) {
      // Silent fail - audio is optional
    }
    return false;
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      
      if (audioContextRef.current?.state !== "closed") {
        audioContextRef.current?.close().catch(() => {});
      }
    };
  }, [initializeAudio]);

  // Play notification sound - Simple & Fast
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current || !audioInitializedRef.current) return;

      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume().then(() => {
          playTones(ctx);
        }).catch(() => {});
      } else {
        playTones(ctx);
      }
    } catch (error) {
      // Silent fail
    }
  }, []);

  const playTones = (ctx: AudioContext) => {
    try {
      const now = ctx.currentTime;
      
      // Two-tone bell sound
      playTone(ctx, 880, now, 0.1);
      playTone(ctx, 660, now + 0.1, 0.15);
    } catch (error) {
      // Silent fail
    }
  };

  const playTone = (
    ctx: AudioContext,
    freq: number,
    start: number,
    dur: number
  ) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = "sine";

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.3, start + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.01, start + dur);

      osc.start(start);
      osc.stop(start + dur);
    } catch (error) {
      // Silent fail
    }
  };

  // ============================================
  // VISIBILITY API - Smart Polling Management
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasVisible = isTabVisibleRef.current;
      isTabVisibleRef.current = !document.hidden;
      
      console.log(
        `[Notification] Tab visibility: ${isTabVisibleRef.current ? "VISIBLE" : "HIDDEN"}`
      );

      // If tab becomes visible, reset backoff and fetch immediately
      if (!wasVisible && isTabVisibleRef.current && isAuthenticated && user) {
        console.log("[Notification] Tab became visible - resetting errors and fetching");
        consecutiveErrorsRef.current = 0;
        backoffDelayRef.current = INITIAL_RETRY_DELAY;
        
        // Immediate fetch when tab becomes visible
        fetchNotifications();
        
        // Setup fast polling
        setupPolling(FAST_POLLING_INTERVAL);
      } else if (!isTabVisibleRef.current) {
        // Slow down polling when tab is hidden
        setupPolling(SLOW_POLLING_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, user]);

  // ============================================
  // TOKEN REFRESH HELPER - Critical for AFK scenarios
  // ============================================
  const ensureValidToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log("[Notification] Ensuring valid token...");
      
      // Call refresh endpoint to ensure token is valid
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log("[Notification] Token validation success:", refreshData.message);
        
        // If token was refreshed, update user context
        if (refreshData.tokenRefreshed) {
          console.log("[Notification] Token was refreshed, updating user context");
          await refreshUser();
        }
        
        return true;
      } else {
        const errorData = await refreshResponse.json();
        console.error("[Notification] Token validation failed:", errorData.message);
        
        // If we should logout, don't retry
        if (errorData.shouldLogout) {
          console.log("[Notification] Session expired, stopping polling");
          return false;
        }
        
        return false;
      }
    } catch (error) {
      console.error("[Notification] Token validation error:", error);
      return false;
    }
  }, [refreshUser]);

  // ============================================
  // FETCH NOTIFICATIONS - Enhanced with Token Refresh & Retry Logic
  // ============================================
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) {
      return;
    }

    // Cancel previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller with timeout
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
      console.log("[Notification] Fetch timeout - aborting");
    }, FETCH_TIMEOUT);

    isFetchingRef.current = true;

    try {
      setIsLoading(true);

      // CRITICAL: Ensure token is valid before fetching (especially after AFK)
      const tokenValid = await ensureValidToken();
      
      if (!tokenValid) {
        console.log("[Notification] Token invalid and cannot be refreshed");
        
        // Increase error count and backoff
        consecutiveErrorsRef.current++;
        
        if (consecutiveErrorsRef.current >= MAX_RETRY_ATTEMPTS) {
          console.log("[Notification] Max token refresh failures - stopping polling");
          clearPolling();
          return;
        }
        
        // Apply exponential backoff
        backoffDelayRef.current = Math.min(
          backoffDelayRef.current * 2,
          MAX_RETRY_DELAY
        );
        
        console.log(
          `[Notification] Will retry in ${backoffDelayRef.current}ms (${consecutiveErrorsRef.current}/${MAX_RETRY_ATTEMPTS})`
        );
        
        return;
      }

      console.log("[Notification] Fetching notifications with valid token...");

      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.notifications || !Array.isArray(data.notifications)) {
        throw new Error("Invalid response format");
      }

      const formattedNotifications = data.notifications.map((notif: any) => ({
        id: notif.notification_id,
        title: notif.title,
        message: notif.message,
        time: new Date(notif.created_at).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date(notif.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        type: notif.type,
        read: notif.is_read,
        orderId: notif.order_id,
        createdAt: notif.created_at,
      }));

      // Detect NEW notifications
      const currentIds = new Set<string>(
        formattedNotifications.map((n: Notification) => n.id)
      );
      const newNotifications = formattedNotifications.filter(
        (n: Notification) => !n.read && !lastNotificationIdsRef.current.has(n.id)
      );

      // Update state only if mounted
      if (mountedRef.current) {
        setNotifications(formattedNotifications);
      }

      // Play sound for NEW unread notifications (skip initial load)
      if (!isInitialLoadRef.current && newNotifications.length > 0) {
        console.log(
          `[Notification] 🔔 ${newNotifications.length} new notification(s)!`
        );
        playNotificationSound();
      }

      // Mark initial load complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }

      // Update tracking
      lastNotificationIdsRef.current = currentIds;

      // Reset error tracking on success
      consecutiveErrorsRef.current = 0;
      backoffDelayRef.current = INITIAL_RETRY_DELAY;
      lastSuccessTimestampRef.current = Date.now();

      console.log(
        `[Notification] ✅ Fetched: ${formattedNotifications.length} | Unread: ${formattedNotifications.filter((n: Notification) => !n.read).length}`
      );

    } catch (error: any) {
      clearTimeout(timeoutId);
      
      // Handle abort (not an error)
      if (error.name === "AbortError") {
        console.log("[Notification] Request aborted (normal)");
        return;
      }

      // Handle other errors with retry logic
      console.error("[Notification] Fetch error:", error.message);

      consecutiveErrorsRef.current++;

      // Check if we should stop trying
      const timeSinceLastSuccess = Date.now() - lastSuccessTimestampRef.current;
      
      if (
        consecutiveErrorsRef.current >= MAX_RETRY_ATTEMPTS &&
        timeSinceLastSuccess > 5 * 60 * 1000 // 5 minutes
      ) {
        console.error(
          "[Notification] Too many consecutive errors - stopping polling"
        );
        clearPolling();
        return;
      }

      // Apply exponential backoff
      backoffDelayRef.current = Math.min(
        backoffDelayRef.current * 2,
        MAX_RETRY_DELAY
      );
      
      console.log(
        `[Notification] Will retry in ${backoffDelayRef.current}ms (${consecutiveErrorsRef.current}/${MAX_RETRY_ATTEMPTS})`
      );

      // Schedule retry with backoff
      setTimeout(() => {
        if (mountedRef.current && isAuthenticated && user) {
          fetchNotifications();
        }
      }, backoffDelayRef.current);

    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [isAuthenticated, user, playNotificationSound, ensureValidToken, refreshUser]);

  // ============================================
  // NOTIFICATION ACTIONS - Optimized
  // ============================================
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok && mountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("[Notification] Mark read error:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok && mountedRef.current) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
      }
    } catch (error) {
      console.error("[Notification] Mark all read error:", error);
    }
  }, []);

  const deleteNotification = useCallback(
    async (notificationId: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok && mountedRef.current) {
          setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
          );
          lastNotificationIdsRef.current.delete(notificationId);
        }
      } catch (error) {
        console.error("[Notification] Delete error:", error);
      }
    },
    []
  );

  const deleteAllNotifications = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok && mountedRef.current) {
        setNotifications([]);
        lastNotificationIdsRef.current.clear();
      }
    } catch (error) {
      console.error("[Notification] Delete all error:", error);
    }
  }, []);

  const resetNotifications = useCallback(() => {
    setNotifications([]);
    lastNotificationIdsRef.current.clear();
    isInitialLoadRef.current = true;
    consecutiveErrorsRef.current = 0;
    backoffDelayRef.current = INITIAL_RETRY_DELAY;
    console.log("[Notification] Reset complete");
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        read: false,
      };

      if (mountedRef.current) {
        setNotifications((prev) => [newNotification, ...prev]);
        lastNotificationIdsRef.current.add(newNotification.id);
        
        playNotificationSound();
      }
    },
    [playNotificationSound]
  );

  // ============================================
  // SMART POLLING SETUP - Adaptive Interval with Auto-Restart
  // ============================================
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      console.log("[Notification] Polling stopped");
    }
  }, []);

  const setupPolling = useCallback((interval: number) => {
    // Clear existing interval
    clearPolling();

    // Setup new interval
    pollingIntervalRef.current = setInterval(() => {
      if (isAuthenticated && user && mountedRef.current) {
        fetchNotifications();
      }
    }, interval);

    console.log(
      `[Notification] ⚡ Polling setup: ${interval / 1000}s interval`
    );
  }, [fetchNotifications, isAuthenticated, user, clearPolling]);

  // Mounted tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ============================================
  // MAIN POLLING EFFECT - Real-time Updates with Auto-Recovery
  // ============================================
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("[Notification] 🚀 Starting REAL-TIME notifications");

      // Reset error tracking
      consecutiveErrorsRef.current = 0;
      backoffDelayRef.current = INITIAL_RETRY_DELAY;

      // Initial fetch
      fetchNotifications();

      // Setup polling based on visibility
      const interval = isTabVisibleRef.current
        ? FAST_POLLING_INTERVAL
        : SLOW_POLLING_INTERVAL;
      
      setupPolling(interval);

      return () => {
        clearPolling();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      resetNotifications();
      clearPolling();
    }
  }, [isAuthenticated, user, fetchNotifications, resetNotifications, setupPolling, clearPolling]);

  // ============================================
  // ONLINE/OFFLINE HANDLER - Auto-Restart on Reconnect
  // ============================================
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && user && mountedRef.current) {
        console.log("[Notification] Back online - restarting polling");
        consecutiveErrorsRef.current = 0;
        backoffDelayRef.current = INITIAL_RETRY_DELAY;
        
        // Immediate fetch
        fetchNotifications();
        
        // Restart polling
        const interval = isTabVisibleRef.current
          ? FAST_POLLING_INTERVAL
          : SLOW_POLLING_INTERVAL;
        setupPolling(interval);
      }
    };

    const handleOffline = () => {
      console.log("[Notification] Gone offline - pausing polling");
      clearPolling();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isAuthenticated, user, fetchNotifications, setupPolling, clearPolling]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    resetNotifications,
    addNotification,
    isLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}