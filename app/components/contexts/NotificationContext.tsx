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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef<number>(0);

  // Initialize notification sound
  useEffect(() => {
    // Create notification sound (you can replace this with a URL to an audio file)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const createNotificationSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    audioRef.current = { play: createNotificationSound } as any;
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.play();
      }
    } catch (error) {
      console.error("[Notification] Error playing sound:", error);
    }
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log("[Notification] Not authenticated, skipping fetch");
      return;
    }

    try {
      setIsLoading(true);
      console.log("[Notification] Fetching notifications from API...");

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

          // Check if there are new notifications
          const newNotificationCount = formattedNotifications.filter(
            (n: Notification) => !n.read
          ).length;

          if (
            lastNotificationCountRef.current > 0 &&
            newNotificationCount > lastNotificationCountRef.current
          ) {
            // New notification arrived, play sound
            playNotificationSound();
          }

          lastNotificationCountRef.current = newNotificationCount;
          setNotifications(formattedNotifications);
          console.log(
            "[Notification] Notifications loaded:",
            formattedNotifications.length
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
      }
    } catch (error) {
      console.error("[Notification] Error deleting all notifications:", error);
    }
  }, []);

  // Reset notifications (call on logout)
  const resetNotifications = useCallback(() => {
    setNotifications([]);
    lastNotificationCountRef.current = 0;
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
      playNotificationSound();
      console.log("[Notification] New notification added:", newNotification.title);
    },
    [playNotificationSound]
  );

  // Auto-fetch notifications when auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      // Initial fetch
      fetchNotifications();

      // Set up polling interval (every 10 seconds)
      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 10000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    } else {
      // Clear notifications and stop polling when user logs out
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