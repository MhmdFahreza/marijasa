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
  useMemo,
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
  isInitialized: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes
const FETCH_TIMEOUT_MS = 8000;

// Storage keys
const STORAGE_KEY = "auth_user_cache";
const STORAGE_TIMESTAMP_KEY = "auth_user_cache_ts";
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const isLoggingOutRef = useRef(false);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasInitializedRef = useRef(false);

  const isMitraRoute = pathname?.startsWith("/mitra") || false;
  const isAdminRoute = pathname?.startsWith("/admin") || false;

  // Cache helpers
  const cacheUser = useCallback((userData: User | null) => {
    if (typeof window === "undefined") return;
    try {
      if (userData) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    } catch (e) {
      console.error("[Auth] Cache error:", e);
    }
  }, []);

  const getCachedUser = useCallback((): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          return JSON.parse(cached);
        }
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    } catch (e) {
      console.error("[Auth] Get cache error:", e);
    }
    return null;
  }, []);

  // Fetch current user
  const fetchCurrentUser = useCallback(
    async (skipLoadingState = false): Promise<User | null> => {
      if (isMitraRoute || isAdminRoute || isLoggingOutRef.current) {
        return null;
      }

      if (isFetchingRef.current) {
        console.log("[Auth] Fetch already in progress");
        return null;
      }

      isFetchingRef.current = true;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        FETCH_TIMEOUT_MS
      );

      try {
        console.log("[Auth] 🔍 Fetching user from /api/auth/me");

        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          signal: abortControllerRef.current.signal,
        });

        clearTimeout(timeoutId);

        if (!mountedRef.current) return null;

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
              role: data.user.role || "USER",
            };

            setUser(userData);
            cacheUser(userData);
            
            if (!skipLoadingState) {
              setIsLoading(false);
              setIsInitialized(true);
            }
            
            return userData;
          }
        }

        console.log("[Auth] ❌ Not authenticated");
        setUser(null);
        cacheUser(null);
        
        if (!skipLoadingState) {
          setIsLoading(false);
          setIsInitialized(true);
        }
        
        return null;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[Auth] Request aborted");
        } else {
          console.error("[Auth] Fetch error:", error);
        }
        
        if (!skipLoadingState) {
          setIsLoading(false);
          setIsInitialized(true);
        }
        
        return null;
      } finally {
        clearTimeout(timeoutId);
        isFetchingRef.current = false;
      }
    },
    [isMitraRoute, isAdminRoute, cacheUser]
  );

  // Update user profile
  const updateUserProfile = useCallback(
    (updates: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return null;
        const updated = { ...prev, ...updates };
        cacheUser(updated);
        return updated;
      });
    },
    [cacheUser]
  );

  // Refresh access token
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    if (isMitraRoute || isAdminRoute || isLoggingOutRef.current || isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      console.log("[Auth] 🔄 Refreshing token");

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Auth] ✅ Token refreshed:", data.message);
        
        // Only fetch user if token was actually refreshed
        if (data.tokenRefreshed) {
          await fetchCurrentUser(true);
        }
        
        return true;
      }
      
      console.error("[Auth] ❌ Token refresh failed");
      return false;
    } catch (error) {
      console.error("[Auth] Refresh error:", error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCurrentUser, isMitraRoute, isAdminRoute]);

  // Setup token refresh
  const setupTokenRefresh = useCallback(() => {
    if (isMitraRoute || isAdminRoute) return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (!isLoggingOutRef.current && mountedRef.current) {
        refreshAccessToken();
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Auth] ✅ Auto-refresh enabled (every 45 minutes)");
  }, [refreshAccessToken, isMitraRoute, isAdminRoute]);

  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }, []);

  // Login
  const login = useCallback(
    (userData: User) => {
      console.log("[Auth] 🚀 User logged in:", userData.email);

      setUser(userData);
      cacheUser(userData);
      setIsLoading(false);
      setIsInitialized(true);

      setupTokenRefresh();

      // Background refresh
      setTimeout(() => {
        if (mountedRef.current && !isLoggingOutRef.current) {
          fetchCurrentUser(true).catch(console.error);
        }
      }, 500);
    },
    [setupTokenRefresh, fetchCurrentUser, cacheUser]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] 🚪 Logging out");

      isLoggingOutRef.current = true;

      setUser(null);
      cacheUser(null);
      clearTokenRefresh();

      if (session) {
        try {
          await nextAuthSignOut({ redirect: false });
        } catch (error) {
          console.error("[Auth] NextAuth signout error:", error);
        }
      }

      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("[Auth] Logout API error:", error);
      }

      console.log("[Auth] ✅ Logout complete");

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    } finally {
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  }, [session, clearTokenRefresh, router, cacheUser]);

  // Refresh user - PUBLIC API untuk NotificationContext
  const refreshUser = useCallback(async () => {
    console.log("[Auth] 🔄 Refreshing user data (public API)");
    await fetchCurrentUser(true);
  }, [fetchCurrentUser]);

  // CRITICAL: Initial auth check - SIMPLIFIED VERSION
  useEffect(() => {
    // Prevent duplicate initialization
    if (hasInitializedRef.current) {
      console.log("[Auth] Already initialized, skipping");
      return;
    }

    hasInitializedRef.current = true;

    const initAuth = async () => {
      // Skip for mitra/admin routes
      if (isMitraRoute || isAdminRoute) {
        console.log("[Auth] Skipping init for mitra/admin route");
        setIsLoading(false);
        setIsInitialized(true);
        setUser(null);
        return;
      }

      console.log("[Auth] 🚀 Initializing authentication");

      // STEP 1: Try cache first for instant UI
      const cachedUser = getCachedUser();
      
      if (cachedUser) {
        console.log("[Auth] ✅ Using cached user:", cachedUser.email);
        setUser(cachedUser);
        setIsLoading(false);
        setIsInitialized(true);
      }

      // STEP 2: Fetch from API (will set isInitialized when done)
      const fetchedUser = await fetchCurrentUser(!cachedUser);
      
      if (fetchedUser) {
        console.log("[Auth] ✅ User validated:", fetchedUser.email);
        setupTokenRefresh();
      } else {
        console.log("[Auth] ❌ No user found");
        clearTokenRefresh();
      }
    };

    initAuth();

    return () => {
      clearTokenRefresh();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty deps - run ONCE

  // Sync with NextAuth
  useEffect(() => {
    if (!isInitialized || isMitraRoute || isAdminRoute) return;

    if (sessionStatus === "authenticated" && session?.user?.email) {
      console.log("[Auth] NextAuth session:", session.user.email);

      if (!user || user.email !== session.user.email) {
        fetchCurrentUser(true).then((fetchedUser) => {
          if (fetchedUser) {
            setupTokenRefresh();
          }
        });
      }
    }
  }, [sessionStatus, session, isInitialized, isMitraRoute, isAdminRoute, user]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && !isLoggingOutRef.current) {
        console.log("[Auth] Tab visible, validating");
        fetchCurrentUser(true).catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchCurrentUser]);

  // Online handler
  useEffect(() => {
    const handleOnline = () => {
      if (user && !isLoggingOutRef.current) {
        console.log("[Auth] Back online, validating");
        fetchCurrentUser(true).catch(console.error);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [user, fetchCurrentUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      isInitialized,
      login,
      logout,
      refreshUser,
      updateUserProfile,
    }),
    [user, isLoading, isInitialized, login, logout, refreshUser, updateUserProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}