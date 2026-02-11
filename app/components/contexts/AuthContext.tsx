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

// Auth routes where login/register happens
const AUTH_ROUTES = ["/login", "/register", "/verify"];

function isAuthRoute(path: string | null): boolean {
  if (!path) return false;
  return AUTH_ROUTES.some((route) => path.startsWith(route));
}

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
  const prevPathnameRef = useRef<string | null>(null);
  const googleSyncAttemptedRef = useRef(false);

  const isMitraRoute = pathname?.startsWith("/mitra") || false;
  const isAdminRoute = pathname?.startsWith("/admin") || false;

  // ============================================
  // CACHE HELPERS
  // ============================================
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

  // ============================================
  // FETCH CURRENT USER
  // ============================================
  const fetchCurrentUser = useCallback(
    async (skipLoadingState = false): Promise<User | null> => {
      // ✅ CRITICAL FIX: Don't fetch during logout
      if (isMitraRoute || isAdminRoute || isLoggingOutRef.current) {
        console.log("[Auth] Skipping fetch - logout in progress or wrong route");
        return null;
      }

      // If already fetching, abort previous and start fresh
      if (isFetchingRef.current && abortControllerRef.current) {
        console.log("[Auth] Fetch in progress, aborting previous...");
        abortControllerRef.current.abort();
        await new Promise((r) => setTimeout(r, 50));
      }

      isFetchingRef.current = true;

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      try {
        console.log("[Auth] 🔍 Fetching user from /api/auth/me");

        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if component is still mounted and not logging out
        if (!mountedRef.current || isLoggingOutRef.current) {
          console.log("[Auth] Component unmounted or logging out, ignoring result");
          return null;
        }

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

            if (!isLoggingOutRef.current) {
              setUser(userData);
              cacheUser(userData);
              setIsLoading(false);
              setIsInitialized(true);
            }

            return userData;
          }
        }

        console.log("[Auth] ❌ Not authenticated");
        if (mountedRef.current && !isLoggingOutRef.current) {
          setUser(null);
          cacheUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }

        return null;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          console.log("[Auth] Request aborted");
          return null;
        }

        console.error("[Auth] Fetch error:", error);

        if (mountedRef.current && !isLoggingOutRef.current) {
          setIsLoading(false);
          setIsInitialized(true);
        }

        return null;
      } finally {
        isFetchingRef.current = false;
      }
    },
    [isMitraRoute, isAdminRoute, cacheUser]
  );

  // ============================================
  // UPDATE USER PROFILE
  // ============================================
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

  // ============================================
  // TOKEN REFRESH
  // ============================================
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    // ✅ CRITICAL FIX: Don't refresh during logout
    if (
      isMitraRoute ||
      isAdminRoute ||
      isLoggingOutRef.current ||
      isRefreshingRef.current
    ) {
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

        // ✅ CRITICAL FIX: Check logout state before updating
        if (data.tokenRefreshed && !isLoggingOutRef.current) {
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
      console.log("[Auth] ✅ Auto-refresh disabled");
    }
  }, []);

  // ============================================
  // LOGIN
  // ============================================
  const login = useCallback(
    (userData: User) => {
      console.log("[Auth] 🚀 User logged in:", userData.email);

      setUser(userData);
      cacheUser(userData);
      setIsLoading(false);
      setIsInitialized(true);

      setupTokenRefresh();

      // Background refresh to get latest data from server
      setTimeout(() => {
        if (mountedRef.current && !isLoggingOutRef.current) {
          fetchCurrentUser(true).catch(console.error);
        }
      }, 500);
    },
    [setupTokenRefresh, fetchCurrentUser, cacheUser]
  );

  // ============================================
  // LOGOUT - IMPROVED
  // ============================================
  const logout = useCallback(async () => {
    try {
      console.log("[Auth] 🚪 Starting logout process");

      // ✅ Set flag FIRST to prevent any refresh attempts
      isLoggingOutRef.current = true;

      // ✅ Stop all intervals immediately
      clearTokenRefresh();

      // ✅ Abort any ongoing fetches
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // ✅ Clear state immediately
      setUser(null);
      cacheUser(null);
      googleSyncAttemptedRef.current = false;

      // ✅ Sign out from NextAuth FIRST (this clears NextAuth cookies)
      if (session) {
        try {
          console.log("[Auth] Signing out from NextAuth");
          await nextAuthSignOut({ redirect: false });
          console.log("[Auth] ✅ NextAuth signout complete");
        } catch (error) {
          console.error("[Auth] NextAuth signout error:", error);
        }
      }

      // ✅ Call backend logout (this clears custom cookies)
      try {
        console.log("[Auth] Calling backend logout");
        const response = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        
        if (response.ok) {
          console.log("[Auth] ✅ Backend logout successful");
        } else {
          console.error("[Auth] Backend logout failed:", response.status);
        }
      } catch (error) {
        console.error("[Auth] Logout API error:", error);
      }

      console.log("[Auth] ✅ Logout complete, redirecting");

      // ✅ Redirect and refresh
      router.push("/");
      router.refresh();
      
      // ✅ Small delay before allowing new auth attempts
      setTimeout(() => {
        isLoggingOutRef.current = false;
        console.log("[Auth] Logout flag cleared");
      }, 1500);
      
    } catch (error) {
      console.error("[Auth] Logout error:", error);
      // ✅ Ensure flag is cleared even on error
      setTimeout(() => {
        isLoggingOutRef.current = false;
      }, 1500);
    }
  }, [session, clearTokenRefresh, router, cacheUser]);

  // ============================================
  // REFRESH USER (public API)
  // ============================================
  const refreshUser = useCallback(async () => {
    if (isLoggingOutRef.current) {
      console.log("[Auth] Skipping refresh - logout in progress");
      return;
    }
    console.log("[Auth] 🔄 Refreshing user data (public API)");
    await fetchCurrentUser(true);
  }, [fetchCurrentUser]);

  // ============================================
  // EFFECT 1: Mounted tracking
  // ============================================
  useEffect(() => {
    mountedRef.current = true;
    console.log("[Auth] Component mounted");

    return () => {
      mountedRef.current = false;
      console.log("[Auth] Component unmounting");
    };
  }, []);

  // ============================================
  // EFFECT 2: Initial auth check
  // ============================================
  useEffect(() => {
    let effectCancelled = false;

    const initAuth = async () => {
      if (isMitraRoute || isAdminRoute) {
        console.log("[Auth] Skipping init for mitra/admin route");
        if (!effectCancelled) {
          setIsLoading(false);
          setIsInitialized(true);
          setUser(null);
        }
        return;
      }

      console.log("[Auth] 🚀 Initializing authentication");

      // STEP 1: Try cache first for instant UI
      const cachedUser = getCachedUser();

      if (cachedUser && !effectCancelled && !isLoggingOutRef.current) {
        console.log("[Auth] ✅ Using cached user:", cachedUser.email);
        setUser(cachedUser);
        setIsLoading(false);
        setIsInitialized(true);
      }

      // STEP 2: Fetch from API to validate/update
      const fetchedUser = await fetchCurrentUser(!!cachedUser);

      if (effectCancelled || isLoggingOutRef.current) {
        console.log("[Auth] Init effect was cancelled or logging out");
        return;
      }

      if (fetchedUser) {
        console.log("[Auth] ✅ User validated:", fetchedUser.email);
        setupTokenRefresh();
      } else {
        console.log("[Auth] ❌ No user found");
        clearTokenRefresh();

        if (cachedUser) {
          setUser(null);
          cacheUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    prevPathnameRef.current = pathname;
    initAuth();

    return () => {
      effectCancelled = true;
      clearTokenRefresh();

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      isFetchingRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================
  // EFFECT 3: Re-fetch after navigating FROM auth routes
  // ============================================
  useEffect(() => {
    const prevPath = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (
      !isInitialized ||
      isMitraRoute ||
      isAdminRoute ||
      isLoggingOutRef.current
    ) {
      return;
    }

    const wasOnAuth = isAuthRoute(prevPath);
    const isOnAuth = isAuthRoute(pathname);

    if (wasOnAuth && !isOnAuth && !user) {
      console.log(
        "[Auth] 🔄 Navigated from auth route - re-checking session..."
      );

      setIsLoading(true);

      const timer = setTimeout(() => {
        if (!mountedRef.current || isLoggingOutRef.current) return;

        fetchCurrentUser(false)
          .then((fetchedUser) => {
            if (fetchedUser) {
              console.log("[Auth] ✅ Session found after login");
              setupTokenRefresh();
            } else {
              console.log("[Auth] ❌ No session after login");
              clearTokenRefresh();
            }
          })
          .catch((err) => {
            console.error("[Auth] Error re-checking session:", err);
            if (mountedRef.current) {
              setIsLoading(false);
            }
          });
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [
    pathname,
    isInitialized,
    isMitraRoute,
    isAdminRoute,
    user,
    fetchCurrentUser,
    setupTokenRefresh,
    clearTokenRefresh,
  ]);

  // ============================================
  // EFFECT 4: Sync with NextAuth session (Google OAuth)
  // ============================================
  useEffect(() => {
    if (!isInitialized || isMitraRoute || isAdminRoute) return;
    if (isLoggingOutRef.current) return;

    if (
      sessionStatus === "authenticated" &&
      session?.user?.email &&
      !user
    ) {
      if (googleSyncAttemptedRef.current) return;
      googleSyncAttemptedRef.current = true;

      console.log("[Auth] 🔄 NextAuth session detected, syncing");

      const timer = setTimeout(() => {
        if (!mountedRef.current || isLoggingOutRef.current) return;

        fetchCurrentUser(false).then((fetchedUser) => {
          if (fetchedUser) {
            console.log("[Auth] ✅ Google OAuth user synced");
            setupTokenRefresh();
          } else {
            console.log("[Auth] ⚠️ Google OAuth sync failed, retrying");
            
            setTimeout(() => {
              if (!mountedRef.current || isLoggingOutRef.current) return;
              
              fetchCurrentUser(false).then((retryUser) => {
                if (retryUser) {
                  console.log("[Auth] ✅ Google OAuth synced on retry");
                  setupTokenRefresh();
                } else {
                  console.log("[Auth] ❌ Google OAuth sync failed");
                  googleSyncAttemptedRef.current = false;
                }
              });
            }, 1500);
          }
        });
      }, 300);

      return () => clearTimeout(timer);
    }

    if (sessionStatus === "unauthenticated") {
      googleSyncAttemptedRef.current = false;
    }
  }, [
    sessionStatus,
    session,
    isInitialized,
    isMitraRoute,
    isAdminRoute,
    user,
    fetchCurrentUser,
    setupTokenRefresh,
  ]);

  // ============================================
  // EFFECT 5: Visibility change (tab focus)
  // ============================================
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        user &&
        !isLoggingOutRef.current
      ) {
        console.log("[Auth] Tab visible, validating");
        fetchCurrentUser(true).catch(console.error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [user, fetchCurrentUser]);

  // ============================================
  // EFFECT 6: Online handler
  // ============================================
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

  // ============================================
  // CONTEXT VALUE
  // ============================================
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