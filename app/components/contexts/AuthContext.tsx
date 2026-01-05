// app/components/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // First check if we have a session from NextAuth (Google OAuth)
      if (status === "authenticated" && session?.user) {
        const userFromSession: User = {
          id: (session.user as any).id || "",
          name: session.user.name || "",
          email: session.user.email || "",
          phone: (session.user as any).phone || null,
          avatar: session.user.image || "/profile.svg",
          role: (session.user as any).role || "USER",
        };
        setUser(userFromSession);
        setIsLoading(false);
        return;
      }

      // If no NextAuth session, check JWT cookie via API
      if (status !== "loading") {
        const fetchedUser = await fetchCurrentUser();
        if (!fetchedUser) {
          setUser(null);
        }
        setIsLoading(false);
      }
    };

    initAuth();
  }, [session, status, fetchCurrentUser]);

  // Login function - set user after successful login
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // If using NextAuth (Google OAuth), sign out from there
      if (session) {
        await nextAuthSignOut({ redirect: false });
      }

      // Call our logout API to clear the cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear user state
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Clear user state even if API fails
      setUser(null);
    }
  }, [session]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    await fetchCurrentUser();
  }, [fetchCurrentUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}