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
const FETCH_DEBOUNCE_MS = 500;
const FETCH_TIMEOUT_MS = 8000;

// Storage keys
const STORAGE_KEY = "auth_user_cache";
const STORAGE_TIMESTAMP_KEY = "auth_user_cache_ts";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  // IMPORTANT: Initialize as null to prevent hydration mismatch
  // localStorage will be read in useEffect after mount
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Refs for preventing race conditions
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastFetchAttemptRef = useRef<number>(0);
  const isLoggingOutRef = useRef(false);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isMitraRoute = pathname?.startsWith("/mitra") || false;
  const isAdminRoute = pathname?.startsWith("/admin") || false;

  // Cache user to localStorage (only call after mount)
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
      // Ignore localStorage errors
    }
  }, []);

  // Get cached user from localStorage (only call after mount)
  const getCachedUser = useCallback((): User | null => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      const timestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
      if (cached && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < CACHE_DURATION) {
          return JSON.parse(cached);
        } else {
          // Cache expired, clear it
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return null;
  }, []);

  // Fetch current user with proper abort handling
  const fetchCurrentUser = useCallback(
    async (skipLoadingState = false): Promise<User | null> => {
      if (isMitraRoute || isAdminRoute || isLoggingOutRef.current) {
        return null;
      }

      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        console.log("[Auth] Fetch already in progress, skipping...");
        return null;
      }

      // Debounce
      const now = Date.now();
      if (now - lastFetchAttemptRef.current < FETCH_DEBOUNCE_MS) {
        console.log("[Auth] Debouncing fetch attempt");
        return null;
      }
      lastFetchAttemptRef.current = now;

      isFetchingRef.current = true;

      // Cancel previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(
        () => abortControllerRef.current?.abort(),
        FETCH_TIMEOUT_MS
      );

      try {
        console.log("[Auth] Fetching current user from /api/auth/me...");

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
            return userData;
          }
        }

        if (response.status === 401) {
          console.log("[Auth] User not authenticated (401)");
        }

        setUser(null);
        cacheUser(null);
        return null;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("[Auth] Request aborted/timeout");
        } else {
          console.error("[Auth] Error fetching user:", error);
        }
        // Don't clear user on error - might be temporary network issue
        return null;
      } finally {
        clearTimeout(timeoutId);
        isFetchingRef.current = false;
        if (!skipLoadingState && mountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [isMitraRoute, isAdminRoute, cacheUser]
  );

  // Update user profile locally
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
      console.log("[Auth] Refreshing access token...");

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        console.log("[Auth] ✅ Token refreshed successfully");
        // Fetch fresh user data after token refresh
        await fetchCurrentUser(true);
        return true;
      } else {
        console.error("[Auth] Token refresh failed:", response.status);
        return false;
      }
    } catch (error) {
      console.error("[Auth] Refresh error:", error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCurrentUser, isMitraRoute, isAdminRoute]);

  // Setup auto token refresh
  const setupTokenRefresh = useCallback(() => {
    if (isMitraRoute || isAdminRoute) return;

    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    refreshIntervalRef.current = setInterval(() => {
      if (!isLoggingOutRef.current && mountedRef.current) {
        console.log("[Auth] Auto-refresh token...");
        refreshAccessToken();
      }
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Auth] Auto-refresh enabled (every 45 min)");
  }, [refreshAccessToken, isMitraRoute, isAdminRoute]);

  // Clear token refresh interval
  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log("[Auth] Auto-refresh disabled");
    }
  }, []);

  // Login handler - immediate state update
  const login = useCallback(
    (userData: User) => {
      console.log("[Auth] User logged in:", userData.email);

      // Immediately update state
      setUser(userData);
      cacheUser(userData);
      setIsLoading(false);
      setIsInitialized(true);

      // Setup token refresh
      setupTokenRefresh();

      // Fetch fresh data in background after short delay
      setTimeout(async () => {
        if (mountedRef.current && !isLoggingOutRef.current) {
          try {
            await fetchCurrentUser(true);
          } catch (error) {
            console.error("[Auth] Error fetching fresh data:", error);
          }
        }
      }, 500);
    },
    [setupTokenRefresh, fetchCurrentUser, cacheUser]
  );

  // Logout handler
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] 🚪 Starting logout...");

      isLoggingOutRef.current = true;

      // Clear state immediately
      setUser(null);
      cacheUser(null);
      clearTokenRefresh();

      // Sign out from NextAuth if session exists
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
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      } catch (error) {
        console.error("[Auth] Logout API error:", error);
      }

      console.log("[Auth] ✅ Logout complete");

      // Navigate to home
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      setUser(null);
      cacheUser(null);
      clearTokenRefresh();
      router.push("/");
    } finally {
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1000);
    }
  }, [session, clearTokenRefresh, router, cacheUser]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    console.log("[Auth] 🔄 Refreshing user data...");
    const freshUser = await fetchCurrentUser(true);
    if (freshUser) {
      console.log("[Auth] ✅ User data refreshed:", freshUser.email);
    }
  }, [fetchCurrentUser]);

  // Set mounted state after hydration
  useEffect(() => {
    setIsMounted(true);
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial auth check - runs after component is mounted (client-side only)
  useEffect(() => {
    if (!isMounted) return;

    const initAuth = async () => {
      if (isMitraRoute || isAdminRoute) {
        setIsLoading(false);
        setIsInitialized(true);
        setUser(null);
        return;
      }

      console.log("[Auth] Initializing authentication...");

      // Try to get cached user first for instant display
      const cachedUser = getCachedUser();
      
      if (cachedUser) {
        console.log("[Auth] Found cached user:", cachedUser.email);
        setUser(cachedUser);
        setIsLoading(false);
        setIsInitialized(true);
        
        // Validate cached user in background
        fetchCurrentUser(true).then((fetchedUser) => {
          if (fetchedUser) {
            setupTokenRefresh();
          } else {
            // Cached user is invalid, clear it
            setUser(null);
            cacheUser(null);
            clearTokenRefresh();
          }
        });
      } else {
        // No cached user, fetch from API
        const fetchedUser = await fetchCurrentUser();
        if (fetchedUser) {
          setupTokenRefresh();
        } else {
          clearTokenRefresh();
        }
        setIsInitialized(true);
      }
    };

    initAuth();

    return () => {
      clearTokenRefresh();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [isMounted, isMitraRoute, isAdminRoute]); // Only re-run if these change

  // Sync with NextAuth session changes
  useEffect(() => {
    if (!isMounted || isMitraRoute || isAdminRoute || !isInitialized) return;

    // When NextAuth session becomes authenticated
    if (sessionStatus === "authenticated" && session?.user?.email) {
      console.log("[Auth] NextAuth session detected:", session.user.email);

      // If we don't have a user or email doesn't match, fetch fresh data
      if (!user || user.email !== session.user.email) {
        fetchCurrentUser(true).then((fetchedUser) => {
          if (fetchedUser) {
            setupTokenRefresh();
          }
        });
      }
    }
  }, [sessionStatus, session, isInitialized, isMounted, isMitraRoute, isAdminRoute, user]);

  // Handle visibility change - refresh token when tab becomes visible
  useEffect(() => {
    if (!isMounted) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user && !isLoggingOutRef.current) {
        console.log("[Auth] Tab became visible, checking token...");
        // Just validate, don't show loading
        fetchCurrentUser(true).catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isMounted, user, fetchCurrentUser]);

  // Handle online/offline
  useEffect(() => {
    if (!isMounted) return;

    const handleOnline = () => {
      if (user && !isLoggingOutRef.current) {
        console.log("[Auth] Back online, validating session...");
        fetchCurrentUser(true).catch(console.error);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [isMounted, user, fetchCurrentUser]);

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