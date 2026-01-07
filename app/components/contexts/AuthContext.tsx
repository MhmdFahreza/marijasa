// app/components/contexts/AuthContext.tsx
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
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { usePathname } from "next/navigation";

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

// Token refresh interval: 50 minutes (before 1 hour expiry)
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Check if current path is mitra route
  const isMitraRoute = pathname?.startsWith('/mitra') || false;

  // Fetch current user from API
  const fetchCurrentUser = useCallback(async () => {
    // Skip if on mitra routes
    if (isMitraRoute) {
      return null;
    }

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
      } else if (response.status === 401) {
        // Unauthorized - clear user
        setUser(null);
      }
      return null;
    } catch (error) {
      console.error("[Auth] Error fetching current user:", error);
      return null;
    }
  }, [isMitraRoute]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    // Skip if on mitra routes
    if (isMitraRoute) {
      return false;
    }

    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      console.log("[Auth] Token refresh already in progress, skipping...");
      return false;
    }

    isRefreshingRef.current = true;

    try {
      console.log("[Auth] Attempting to refresh access token...");
      
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("[Auth] Access token refreshed successfully");
        // Fetch user to ensure we have latest data
        await fetchCurrentUser();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Auth] Failed to refresh access token:", {
          status: response.status,
          message: errorData.message
        });
        
        // If refresh fails, logout user
        setUser(null);
        clearTokenRefresh();
        return false;
      }
    } catch (error) {
      console.error("[Auth] Error refreshing access token:", error);
      setUser(null);
      clearTokenRefresh();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCurrentUser, isMitraRoute]);

  // Setup auto token refresh
  const setupTokenRefresh = useCallback(() => {
    // Skip if on mitra routes
    if (isMitraRoute) {
      return;
    }

    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      console.log("[Auth] Auto-refreshing access token (scheduled)...");
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Auth] Token auto-refresh enabled (every 50 minutes)");
  }, [refreshAccessToken, isMitraRoute]);

  // Clear token refresh interval
  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log("[Auth] Token auto-refresh disabled");
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Skip auth check for mitra routes
      if (isMitraRoute) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      setIsLoading(true);

      // First check if we have a session from NextAuth (Google OAuth)
      if (status === "authenticated" && session?.user) {
        console.log("[Auth] NextAuth session detected");
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
        console.log("[Auth] Checking JWT cookie authentication...");
        const fetchedUser = await fetchCurrentUser();
        if (fetchedUser) {
          console.log("[Auth] JWT authentication successful");
          // Setup auto token refresh
          setupTokenRefresh();
        } else {
          console.log("[Auth] No valid authentication found");
          setUser(null);
          clearTokenRefresh();
        }
        setIsLoading(false);
      }
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      clearTokenRefresh();
    };
  }, [session, status, fetchCurrentUser, setupTokenRefresh, clearTokenRefresh, isMitraRoute]);

  // Login function - set user after successful login
  const login = useCallback(
    (userData: User) => {
      console.log("[Auth] User logged in:", userData.email);
      setUser(userData);
      // Setup auto token refresh
      setupTokenRefresh();
    },
    [setupTokenRefresh]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] Logging out...");
      
      // Clear token refresh interval
      clearTokenRefresh();

      // If using NextAuth (Google OAuth), sign out from there
      if (session) {
        await nextAuthSignOut({ redirect: false });
      }

      // Call our logout API to clear the cookies and Redis data
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear user state
      setUser(null);
      
      console.log("[Auth] Logout successful");
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // Clear user state even if API fails
      setUser(null);
      clearTokenRefresh();
    }
  }, [session, clearTokenRefresh]);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    try {
      console.log("[Auth] Refreshing user data...");
      
      // Fetch fresh profile data from API
      const response = await fetch("/api/user/profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Update user state with fresh data
          setUser({
            id: data.profile.user_id,
            name: data.profile.name,
            email: data.profile.email,
            phone: data.profile.phone,
            avatar: data.profile.avatar || "/profile.svg",
            role: data.profile.role,
          });
          console.log("[Auth] User data refreshed from database");
        }
      }
    } catch (error) {
      console.error("[Auth] Error refreshing user data:", error);
    }
  }, []);

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