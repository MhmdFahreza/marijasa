// app/components/VisitorTracker.tsx
"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    const trackPageView = async () => {
      try {
        await fetch('/api/track/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'page_view',
            page: pathname,
            details: {
              timestamp: new Date().toISOString(),
              referrer: document.referrer,
            },
          }),
        });
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    };

    trackPageView();
  }, [pathname]);

  // Track user activity
  useEffect(() => {
    let activityTimer: NodeJS.Timeout;

    const trackActivity = async () => {
      try {
        await fetch('/api/track/visitor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'user_active',
            page: pathname,
            details: {
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        // Silently fail
      }
    };

    // Track activity every 2 minutes while user is active
    const resetActivityTimer = () => {
      if (activityTimer) clearTimeout(activityTimer);
      activityTimer = setTimeout(trackActivity, 2 * 60 * 1000);
    };

    // Listen for user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });

    // Initial activity track
    resetActivityTimer();

    return () => {
      if (activityTimer) clearTimeout(activityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
    };
  }, [pathname]);

  return null; // This component doesn't render anything
}

// Helper hook for tracking custom events
export function useTrackEvent() {
  const pathname = usePathname();

  const trackEvent = async (action: string, details?: any) => {
    try {
      await fetch('/api/track/visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          page: pathname,
          details: {
            ...details,
            timestamp: new Date().toISOString(),
          },
        }),
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  };

  return trackEvent;
}