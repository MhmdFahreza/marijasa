// app/components/hooks/useNotificationSound.ts
"use client";

import { useEffect, useRef } from 'react';
import { useNotification } from '@/app/components/contexts/NotificationContext';

export function useNotificationSound() {
  const { notifications } = useNotification();
  const previousCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio element
    if (typeof window !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, []);

  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    const currentCount = unreadNotifications.length;

    // Play sound when new notification arrives
    if (currentCount > previousCountRef.current) {
      if (audioRef.current) {
        audioRef.current.play().catch(error => {
          console.log('Could not play notification sound:', error);
        });
      }
    }

    previousCountRef.current = currentCount;
  }, [notifications]);

  return null;
}

// Usage in layout:
// import { useNotificationSound } from '@/app/components/hooks/useNotificationSound';
// 
// export default function UserLayout({ children }: { children: ReactNode }) {
//   useNotificationSound(); // Add this line
//   // ... rest of your component
// }