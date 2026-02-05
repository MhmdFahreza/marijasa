// app/components/providers/auth-provider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/app/components/contexts/AuthContext";
import { NotificationProvider } from "@/app/components/contexts/NotificationContext";
import { LanguageProvider } from "@/app/components/contexts/LanguageContext";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider 
      // Refetch session every 4 minutes (before token expires)
      refetchInterval={4 * 60}
      // Refetch when window becomes focused
      refetchOnWindowFocus={true}
      // Don't refetch when offline
      refetchWhenOffline={false}
    >
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}