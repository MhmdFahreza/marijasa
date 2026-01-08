// app/components/contexts/NotificationContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user, isAuthenticated } = useAuth();

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      console.log("[Notification] Not authenticated, skipping fetch");
      return;
    }

    try {
      console.log("[Notification] Fetching notifications from API...");
      
      // TODO: Ganti dengan API endpoint yang sesungguhnya
      // const response = await fetch("/api/notifications");
      // if (response.ok) {
      //   const data = await response.json();
      //   setNotifications(data.notifications);
      // }
      
      // Mock data untuk sekarang
      const mockNotifications: Notification[] = [
        {
          id: "1",
          title: "Pesanan Diterima",
          message: "Pesanan Anda untuk jasa kebersihan telah diterima vendor",
          time: "10:30",
          date: "2024-01-15",
          type: "order",
          read: false,
          orderId: "ORD-001",
        },
        {
          id: "2",
          title: "Pembayaran Berhasil",
          message: "Pembayaran untuk pesanan ORD-001 telah berhasil",
          time: "11:45",
          date: "2024-01-15",
          type: "payment",
          read: true,
          orderId: "ORD-001",
        },
        {
          id: "3",
          title: "Promo Spesial",
          message: "Dapatkan diskon 20% untuk pemesanan berikutnya",
          time: "09:15",
          date: "2024-01-14",
          type: "promo",
          read: false,
        },
      ];
      
      setNotifications(mockNotifications);
      console.log("[Notification] Notifications loaded:", mockNotifications.length);
    } catch (error) {
      console.error("[Notification] Error fetching notifications:", error);
    }
  }, [isAuthenticated, user]);

  // Mark single notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  // Delete single notification
  const deleteNotification = useCallback((notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  }, []);

  // Delete all notifications
  const deleteAllNotifications = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    setNotifications([]);
  }, []);

  // Reset notifications (call on logout)
  const resetNotifications = useCallback(() => {
    setNotifications([]);
    console.log("[Notification] Notifications reset");
  }, []);

  // Add new notification (for testing or real-time updates)
  const addNotification = useCallback((notification: Omit<Notification, "id" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    };
    
    setNotifications((prev) => [newNotification, ...prev]);
    console.log("[Notification] New notification added:", newNotification.title);
  }, []);

  // Auto-fetch notifications when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      
      // Simulate real-time notifications (polling setiap 30 detik)
      const interval = setInterval(() => {
        // Di production, ini akan memanggil API untuk check notifikasi baru
        // fetchNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      // Clear notifications when user logs out
      resetNotifications();
    }
  }, [isAuthenticated, fetchNotifications, resetNotifications]);

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
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}