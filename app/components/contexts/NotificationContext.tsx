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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const audioContextRef = useRef<AudioContext | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const audioInitializedRef = useRef<boolean>(false);

  // Initialize AudioContext dengan user interaction
  const initializeAudio = useCallback(() => {
    if (audioInitializedRef.current) return true;
    
    try {
      if (typeof window !== "undefined" && !audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || 
          (window as any).webkitAudioContext)();
        
        // Resume context jika suspended
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().then(() => {
            console.log("[Notification] AudioContext resumed");
            audioInitializedRef.current = true;
          });
        } else {
          audioInitializedRef.current = true;
          console.log("[Notification] AudioContext initialized");
        }
        return true;
      }
    } catch (error) {
      console.error("[Notification] Failed to initialize audio:", error);
    }
    return false;
  }, []);

  // Initialize audio on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (initializeAudio()) {
        document.removeEventListener("click", handleUserInteraction);
        document.removeEventListener("keydown", handleUserInteraction);
        document.removeEventListener("touchstart", handleUserInteraction);
      }
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
      }
    };
  }, [initializeAudio]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Play notification sound - Instant and reliable
  const playNotificationSound = useCallback(() => {
    try {
      if (!audioContextRef.current || !audioInitializedRef.current) {
        console.warn("[Notification] Audio not ready, attempting init...");
        initializeAudio();
        
        // Retry after short delay
        setTimeout(() => {
          if (audioContextRef.current && audioInitializedRef.current) {
            playTones(audioContextRef.current);
          }
        }, 100);
        return;
      }

      const audioContext = audioContextRef.current;
      
      if (audioContext.state === "suspended") {
        audioContext.resume().then(() => {
          playTones(audioContext);
        });
      } else {
        playTones(audioContext);
      }
    } catch (error) {
      console.error("[Notification] Error playing sound:", error);
    }
  }, [initializeAudio]);

  // Helper function to play tones - INSTANT
  const playTones = (audioContext: AudioContext) => {
    try {
      const currentTime = audioContext.currentTime;
      
      // Two-tone notification bell sound
      playTone(audioContext, 880, currentTime, 0.1);
      playTone(audioContext, 660, currentTime + 0.1, 0.15);

      console.log("[Notification] 🔔 Sound played!");
    } catch (error) {
      console.error("[Notification] Error in playTones:", error);
    }
  };

  // Create and play a single tone
  const playTone = (
    audioContext: AudioContext,
    frequency: number,
    startTime: number,
    duration: number
  ) => {
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
  };

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.notifications && Array.isArray(data.notifications)) {
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

          // Detect NEW notifications by comparing IDs
          const currentIds = new Set<string>(formattedNotifications.map((n: Notification) => n.id));
          const newNotifications = formattedNotifications.filter(
            (n: Notification) => !n.read && !lastNotificationIdsRef.current.has(n.id)
          );

          // Update notifications state
          setNotifications(formattedNotifications);

          // Play sound for NEW unread notifications (skip initial load)
          if (!isInitialLoadRef.current && newNotifications.length > 0) {
            console.log(`[Notification] 🔔 ${newNotifications.length} new notification(s)!`);
            playNotificationSound();
          }

          // Mark initial load as complete
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            console.log("[Notification] Initial load complete");
          }

          // Update last known IDs
          lastNotificationIdsRef.current = currentIds;

          console.log(
            `[Notification] Total: ${formattedNotifications.length} | Unread: ${formattedNotifications.filter((n: Notification) => !n.read).length}`
          );
        }
      } else {
        console.error("[Notification] Failed to fetch:", response.status);
      }
    } catch (error) {
      console.error("[Notification] Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, playNotificationSound]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("[Notification] Error marking as read:", error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, read: true }))
        );
      }
    } catch (error) {
      console.error("[Notification] Error marking all as read:", error);
    }
  }, []);

  // Delete single notification
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

        if (response.ok) {
          setNotifications((prev) =>
            prev.filter((notif) => notif.id !== notificationId)
          );
          // Remove from tracking
          lastNotificationIdsRef.current.delete(notificationId);
        }
      } catch (error) {
        console.error("[Notification] Error deleting notification:", error);
      }
    },
    []
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const response = await fetch("/api/notifications", {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications([]);
        lastNotificationIdsRef.current.clear();
      }
    } catch (error) {
      console.error("[Notification] Error deleting all notifications:", error);
    }
  }, []);

  // Reset notifications (call on logout)
  const resetNotifications = useCallback(() => {
    setNotifications([]);
    lastNotificationIdsRef.current.clear();
    isInitialLoadRef.current = true;
    console.log("[Notification] Notifications reset");
  }, []);

  // Add new notification (for testing or real-time updates)
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      lastNotificationIdsRef.current.add(newNotification.id);
      
      console.log("[Notification] New notification added:", newNotification.title);
      playNotificationSound();
    },
    [playNotificationSound]
  );

  // Auto-fetch notifications - FASTER POLLING (10 seconds)
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch
      fetchNotifications();

      // Fast polling for instant notifications (10 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 10000); // 10 seconds for faster updates

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