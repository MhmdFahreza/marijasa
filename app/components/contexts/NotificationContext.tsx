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

// ⚡ REAL-TIME POLLING: Fast 5-second updates untuk notifikasi instant
const FAST_POLLING_INTERVAL = 5000; // 5 seconds - untuk real-time experience
const SLOW_POLLING_INTERVAL = 30000; // 30 seconds - saat tab tidak aktif
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Refs untuk optimization
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
      isTabVisibleRef.current = !document.hidden;
      
      console.log(
        `[Notification] Tab visibility: ${isTabVisibleRef.current ? "VISIBLE" : "HIDDEN"}`
      );

      // Restart polling dengan interval yang sesuai
      if (isTabVisibleRef.current && isAuthenticated && user) {
        setupPolling(FAST_POLLING_INTERVAL);
      } else if (!isTabVisibleRef.current) {
        // Slow down polling saat tab hidden
        setupPolling(SLOW_POLLING_INTERVAL);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, user]);

  // ============================================
  // FETCH NOTIFICATIONS - Optimized dengan Abort Controller
  // ============================================
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) {
      return;
    }

    // Cancel previous request jika masih running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    isFetchingRef.current = true;

    try {
      setIsLoading(true);

      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.notifications || !Array.isArray(data.notifications)) {
        return;
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

      // Reset retry count on success
      retryCountRef.current = 0;

      console.log(
        `[Notification] ✅ Fetched: ${formattedNotifications.length} | Unread: ${formattedNotifications.filter((n: Notification) => !n.read).length}`
      );

    } catch (error: any) {
      // Handle abort (not an error)
      if (error.name === "AbortError") {
        console.log("[Notification] Request aborted (normal)");
        return;
      }

      // Handle other errors with retry logic
      console.error("[Notification] Fetch error:", error.message);

      retryCountRef.current++;

      // Exponential backoff untuk retry
      if (retryCountRef.current <= MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY * retryCountRef.current;
        console.log(
          `[Notification] Retry ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`
        );

        setTimeout(() => {
          if (mountedRef.current) {
            fetchNotifications();
          }
        }, delay);
      } else {
        console.error(
          "[Notification] Max retry attempts reached, will retry on next interval"
        );
        retryCountRef.current = 0;
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [isAuthenticated, user, playNotificationSound]);

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
    retryCountRef.current = 0;
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
  // SMART POLLING SETUP - Adaptive Interval
  // ============================================
  const setupPolling = useCallback((interval: number) => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Setup new interval
    pollingIntervalRef.current = setInterval(() => {
      fetchNotifications();
    }, interval);

    console.log(
      `[Notification] ⚡ Polling setup: ${interval / 1000}s interval`
    );
  }, [fetchNotifications]);

  // Mounted tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ============================================
  // MAIN POLLING EFFECT - Real-time Updates
  // ============================================
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("[Notification] 🚀 Starting REAL-TIME notifications");

      // Initial fetch
      fetchNotifications();

      // Setup fast polling (5 seconds) untuk real-time experience
      const interval = isTabVisibleRef.current
        ? FAST_POLLING_INTERVAL
        : SLOW_POLLING_INTERVAL;
      
      setupPolling(interval);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      resetNotifications();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [isAuthenticated, user, fetchNotifications, resetNotifications, setupPolling]);

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