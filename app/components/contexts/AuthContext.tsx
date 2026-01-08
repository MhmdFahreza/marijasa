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
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchAttemptRef = useRef<number>(0);
  const isLoggingOutRef = useRef(false);

  // Check if current path is mitra route
  const isMitraRoute = pathname?.startsWith('/mitra') || false;

  // Fetch current user from API - IMPROVED
  const fetchCurrentUser = useCallback(async (skipLoadingState = false) => {
    // Skip if on mitra routes or currently logging out
    if (isMitraRoute || isLoggingOutRef.current) {
      return null;
    }

    // Prevent multiple simultaneous fetch attempts
    if (isFetchingRef.current) {
      console.log("[Auth] Fetch already in progress, skipping...");
      return null;
    }

    // Prevent rapid consecutive fetches (debounce)
    const now = Date.now();
    if (now - lastFetchAttemptRef.current < 1000) {
      console.log("[Auth] Debouncing fetch attempt");
      return null;
    }
    lastFetchAttemptRef.current = now;

    isFetchingRef.current = true;

    try {
      console.log("[Auth] Fetching current user from /api/auth/me...");
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          console.log("[Auth] ✅ User authenticated:", {
            email: data.user.email,
            name: data.user.name,
            avatar: data.user.avatar
          });
          
          // CRITICAL: Set user with ALL data from database
          const userData: User = {
            id: data.user.id || data.user.user_id,
            name: data.user.name || "User",
            email: data.user.email,
            phone: data.user.phone || null,
            avatar: data.user.avatar || "/profile.svg",
            role: data.user.role || "USER"
          };
          
          setUser(userData);
          return userData;
        } else {
          console.log("[Auth] Response OK but not authenticated");
          setUser(null);
        }
      } else if (response.status === 401) {
        console.log("[Auth] User not authenticated (401)");
        setUser(null);
      } else {
        console.log("[Auth] Unexpected response status:", response.status);
        setUser(null);
      }
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("[Auth] Request timeout");
      } else {
        console.error("[Auth] Error fetching current user:", error);
      }
      // On error, clear user state
      setUser(null);
      return null;
    } finally {
      isFetchingRef.current = false;
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [isMitraRoute]);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    // Skip if on mitra routes or currently logging out
    if (isMitraRoute || isLoggingOutRef.current) {
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
        cache: "no-store",
      });

      if (response.ok) {
        console.log("[Auth] Access token refreshed successfully");
        // Fetch user to ensure we have latest data
        await fetchCurrentUser(true);
        return true;
      } else {
        console.error("[Auth] Failed to refresh access token");
        
        // If refresh fails, logout user
        console.log("[Auth] Clearing user due to failed refresh");
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
      console.log("[Auth] Initializing authentication...");

      // First check if we have a session from NextAuth (Google OAuth)
      if (status === "authenticated" && session?.user) {
        console.log("[Auth] NextAuth session detected for:", session.user.email);
        const userFromSession: User = {
          id: (session.user as any).id || "",
          name: session.user.name || "User",
          email: session.user.email || "",
          phone: (session.user as any).phone || null,
          avatar: session.user.image || "/profile.svg",
          role: (session.user as any).role || "USER",
        };
        setUser(userFromSession);
        setupTokenRefresh();
        setIsLoading(false);
        return;
      }

      // If no NextAuth session, check JWT cookie via API
      if (status !== "loading") {
        console.log("[Auth] Checking JWT cookie authentication...");
        const fetchedUser = await fetchCurrentUser();
        if (fetchedUser) {
          console.log("[Auth] JWT authentication successful for:", fetchedUser.email);
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

  // Login function
  const login = useCallback(
    async (userData: User) => {
      console.log("[Auth] User logged in:", userData.email);
      setUser(userData);
      
      // Setup auto token refresh
      setupTokenRefresh();
      
      // Fetch fresh user data asynchronously to ensure we have latest from DB
      setTimeout(() => {
        fetchCurrentUser(true);
      }, 100);
    },
    [setupTokenRefresh, fetchCurrentUser]
  );

  // Logout function - SIGNIFICANTLY IMPROVED
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] 🚪 Starting logout process...");
      
      // Set logout flag to prevent any ongoing operations
      isLoggingOutRef.current = true;
      
      // CRITICAL: Clear user state FIRST - this immediately triggers UI update
      console.log("[Auth] Clearing user state immediately...");
      setUser(null);
      
      // Clear token refresh interval IMMEDIATELY
      clearTokenRefresh();

      // If using NextAuth (Google OAuth), sign out from there
      if (session) {
        console.log("[Auth] Signing out from NextAuth...");
        try {
          await nextAuthSignOut({ redirect: false });
        } catch (error) {
          console.error("[Auth] NextAuth signout error:", error);
        }
      }

      // Call our logout API to clear the cookies and Redis data
      try {
        console.log("[Auth] Calling logout API...");
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        
        if (response.ok) {
          console.log("[Auth] ✅ Logout API successful");
        } else {
          console.error("[Auth] ⚠️ Logout API failed:", response.status);
        }
      } catch (error) {
        console.error("[Auth] Error calling logout API:", error);
      }
      
      console.log("[Auth] ✅ Logout complete, redirecting to home...");
      
      // Small delay to ensure state propagates
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Redirect to home
      router.push("/");
      
      // Force router refresh to clear any cached data
      router.refresh();
      
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // Ensure user state is cleared even if API fails
      setUser(null);
      clearTokenRefresh();
      router.push("/");
      router.refresh();
    } finally {
      // Reset logout flag after a delay
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  }, [session, clearTokenRefresh, router]);

  // Refresh user data from database
  const refreshUser = useCallback(async () => {
    try {
      console.log("[Auth] 🔄 Manually refreshing user data...");
      
      // Fetch fresh data from /api/auth/me which always gets from database
      await fetchCurrentUser(true);
      
      console.log("[Auth] ✅ User data refresh complete");
    } catch (error) {
      console.error("[Auth] Error refreshing user data:", error);
    }
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