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

// CRITICAL FIX: Polling interval diperlambat ke 30 detik untuk mengurangi beban
const POLLING_INTERVAL = 30000; // 30 seconds

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Refs untuk audio dan tracking
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const audioInitializedRef = useRef<boolean>(false);
  const isFetchingRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // IMPROVED: Audio initialization dengan better error handling
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
            console.log("[Notification] AudioContext resumed");
            audioInitializedRef.current = true;
          }).catch(err => {
            console.warn("[Notification] Failed to resume audio:", err);
          });
        } else {
          audioInitializedRef.current = true;
          console.log("[Notification] AudioContext initialized");
        }
        return true;
      }
    } catch (error) {
      console.warn("[Notification] Audio init failed (this is OK):", error);
    }
    return false;
  }, []);

  // One-time audio initialization
  useEffect(() => {
    const handleUserInteraction = () => {
      if (initializeAudio()) {
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
      }
    };

    document.addEventListener("click", handleUserInteraction, { once: true });
    document.addEventListener("keydown", handleUserInteraction, { once: true });
    document.addEventListener("touchstart", handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [initializeAudio]);

  // IMPROVED: Simplified sound playback
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current || !audioInitializedRef.current) {
        // Silently fail jika audio tidak ready
        return;
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === "suspended") {
        audioContext.resume().then(() => {
          playTones(audioContext);
        }).catch(() => {});
      } else {
        playTones(audioContext);
      }
    } catch (error) {
      // Silent fail untuk audio errors
    }
  }, []);

  const playTones = (audioContext: AudioContext) => {
    try {
      const currentTime = audioContext.currentTime;
      
      // Simple two-tone notification
      playTone(audioContext, 880, currentTime, 0.1);
      playTone(audioContext, 660, currentTime + 0.1, 0.15);

      console.log("[Notification] 🔔 Sound played");
    } catch (error) {
      // Silent fail
    }
  };

  const playTone = (
    audioContext: AudioContext,
    frequency: number,
    startTime: number,
    duration: number
  ) => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    } catch (error) {
      // Silent fail
    }
  };

  // CRITICAL FIX: Prevent concurrent fetches
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      setIsLoading(true);

      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.error("[Notification] Fetch failed:", response.status);
        return;
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
      const currentIds = new Set<string>(formattedNotifications.map((n: Notification) => n.id));
      const newNotifications = formattedNotifications.filter(
        (n: Notification) => !n.read && !lastNotificationIdsRef.current.has(n.id)
      );

      // Update state
      if (mountedRef.current) {
        setNotifications(formattedNotifications);
      }

      // Play sound for NEW notifications (skip initial load)
      if (!isInitialLoadRef.current && newNotifications.length > 0) {
        console.log(`[Notification] 🔔 ${newNotifications.length} new notification(s)`);
        playNotificationSound();
      }

      // Mark initial load complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        console.log("[Notification] Initial load complete");
      }

      // Update tracking
      lastNotificationIdsRef.current = currentIds;

      console.log(
        `[Notification] Total: ${formattedNotifications.length} | Unread: ${formattedNotifications.filter((n: Notification) => !n.read).length}`
      );

    } catch (error) {
      console.error("[Notification] Fetch error:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuthenticated, user, playNotificationSound]);

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
        
        console.log("[Notification] Added:", newNotification.title);
        playNotificationSound();
      }
    },
    [playNotificationSound]
  );

  // Mounted tracking
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // CRITICAL FIX: Slower polling interval (30 seconds)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch
      fetchNotifications();

      // Setup polling dengan interval yang lebih lambat
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, POLLING_INTERVAL);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      resetNotifications();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  }, [isAuthenticated, user, fetchNotifications, resetNotifications]);

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