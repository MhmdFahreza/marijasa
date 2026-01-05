// app/components/providers/auth-provider.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/app/components/contexts/AuthContext";
import { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}