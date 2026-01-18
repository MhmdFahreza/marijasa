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
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  
  // Refs untuk prevent race conditions
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchAttemptRef = useRef<number>(0);
  const isLoggingOutRef = useRef(false);
  const mountedRef = useRef(false);
  const initDoneRef = useRef(false);

  const isMitraRoute = pathname?.startsWith('/mitra') || false;

  // CRITICAL FIX: Debounced fetch dengan abort controller
  const fetchCurrentUser = useCallback(async (skipLoadingState = false) => {
    if (isMitraRoute || isLoggingOutRef.current) {
      return null;
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      console.log("[Auth] Fetch already in progress, skipping...");
      return null;
    }

    // Debounce: minimum 1s between requests
    const now = Date.now();
    if (now - lastFetchAttemptRef.current < 1000) {
      console.log("[Auth] Debouncing fetch attempt");
      return null;
    }
    lastFetchAttemptRef.current = now;

    isFetchingRef.current = true;

    // Abort controller untuk cleanup
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      console.log("[Auth] Fetching current user from /api/auth/me...");
      
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
          console.log("[Auth] ✅ User authenticated:", data.user.email);
          
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
          setUser(null);
        }
      } else if (response.status === 401) {
        console.log("[Auth] User not authenticated (401)");
        setUser(null);
      } else {
        console.log("[Auth] Unexpected response:", response.status);
        setUser(null);
      }
      return null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("[Auth] Request timeout");
      } else {
        console.error("[Auth] Error fetching user:", error);
      }
      setUser(null);
      return null;
    } finally {
      clearTimeout(timeoutId);
      isFetchingRef.current = false;
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  }, [isMitraRoute]);

  const updateUserProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (isMitraRoute || isLoggingOutRef.current || isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      console.log("[Auth] Refreshing access token...");
      
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        console.log("[Auth] ✅ Token refreshed");
        await fetchCurrentUser(true);
        return true;
      } else {
        console.error("[Auth] Token refresh failed");
        setUser(null);
        clearTokenRefresh();
        return false;
      }
    } catch (error) {
      console.error("[Auth] Refresh error:", error);
      setUser(null);
      clearTokenRefresh();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCurrentUser, isMitraRoute]);

  const setupTokenRefresh = useCallback(() => {
    if (isMitraRoute) return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      console.log("[Auth] Auto-refresh token...");
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Auth] Auto-refresh enabled (every 50 min)");
  }, [refreshAccessToken, isMitraRoute]);

  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log("[Auth] Auto-refresh disabled");
    }
  }, []);

  // CRITICAL FIX: Single initialization dengan flag
  useEffect(() => {
    // Prevent double initialization
    if (initDoneRef.current) {
      console.log("[Auth] Init already done, skipping...");
      return;
    }

    const initAuth = async () => {
      if (isMitraRoute) {
        setIsLoading(false);
        setUser(null);
        return;
      }

      setIsLoading(true);
      console.log("[Auth] Initializing authentication...");

      const fetchedUser = await fetchCurrentUser();
      
      if (fetchedUser) {
        console.log("[Auth] ✅ User authenticated:", fetchedUser.email);
        setupTokenRefresh();
      } else {
        console.log("[Auth] No authentication found");
        setUser(null);
        clearTokenRefresh();
      }
      
      setIsLoading(false);
      initDoneRef.current = true;
    };

    initAuth();

    return () => {
      clearTokenRefresh();
    };
  }, []); // Empty deps - run ONLY once

  // Mounted flag
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const login = useCallback(
    async (userData: User) => {
      console.log("[Auth] User logged in:", userData.email);
      
      setUser(userData);
      setupTokenRefresh();
      
      // Fetch fresh data setelah delay singkat
      setTimeout(async () => {
        if (mountedRef.current) {
          try {
            const freshUser = await fetchCurrentUser(true);
            if (freshUser) {
              console.log("[Auth] ✅ Fresh data loaded:", freshUser.email);
            }
          } catch (error) {
            console.error("[Auth] Error fetching fresh data:", error);
          }
        }
      }, 100);
    },
    [setupTokenRefresh, fetchCurrentUser]
  );

  const logout = useCallback(async () => {
    try {
      console.log("[Auth] 🚪 Starting logout...");
      
      isLoggingOutRef.current = true;
      
      // Clear state IMMEDIATELY
      setUser(null);
      clearTokenRefresh();

      // Sign out from NextAuth if exists
      if (session) {
        console.log("[Auth] Signing out from NextAuth...");
        try {
          await nextAuthSignOut({ redirect: false });
        } catch (error) {
          console.error("[Auth] NextAuth signout error:", error);
        }
      }

      // Call logout API
      try {
        console.log("[Auth] Calling logout API...");
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        
        if (response.ok) {
          console.log("[Auth] ✅ Logout API successful");
        }
      } catch (error) {
        console.error("[Auth] Logout API error:", error);
      }
      
      console.log("[Auth] ✅ Logout complete");
      
      // Small delay untuk propagate state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      router.push("/");
      router.refresh();
      
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      setUser(null);
      clearTokenRefresh();
      router.push("/");
      router.refresh();
    } finally {
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  }, [session, clearTokenRefresh, router]);

  const refreshUser = useCallback(async () => {
    try {
      console.log("[Auth] 🔄 Refreshing user data...");
      
      const freshUser = await fetchCurrentUser(true);
      
      if (freshUser) {
        console.log("[Auth] ✅ User data refreshed:", freshUser.email);
      }
    } catch (error) {
      console.error("[Auth] Refresh error:", error);
    }
  }, [fetchCurrentUser]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    updateUserProfile,
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