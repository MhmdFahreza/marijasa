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
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
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