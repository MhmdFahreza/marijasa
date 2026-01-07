// app/components/contexts/MitraAuthContext.tsx
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

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string;
  description?: string | null;
  verified: boolean;
  status: string;
  rating: number;
  review_count: number;
  service_areas: string[];
  specialties: string[];
  tags: string[];
  category: string;
  join_date: Date;
  role: string;
}

interface MitraAuthContextType {
  vendor: Vendor | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (vendorData: Vendor) => void;
  logout: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

const MitraAuthContext = createContext<MitraAuthContextType | undefined>(undefined);

// Token refresh interval: 50 minutes (before 1 hour expiry)
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000;

export function MitraAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  // Fetch current vendor from API
  const fetchCurrentVendor = useCallback(async () => {
    try {
      console.log('[Mitra Auth] Fetching current vendor...');
      
      const response = await fetch("/api/mitra/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.vendor) {
          console.log('[Mitra Auth] Vendor authenticated:', data.vendor.email);
          setVendor(data.vendor);
          return data.vendor;
        }
      } else if (response.status === 401) {
        // Unauthorized - clear vendor
        console.log('[Mitra Auth] Unauthorized');
        setVendor(null);
      }
      return null;
    } catch (error) {
      console.error("[Mitra Auth] Error fetching current vendor:", error);
      return null;
    }
  }, []);

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) {
      console.log("[Mitra Auth] Token refresh already in progress, skipping...");
      return false;
    }

    isRefreshingRef.current = true;

    try {
      console.log("[Mitra Auth] Attempting to refresh access token...");
      
      const response = await fetch("/api/mitra/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("[Mitra Auth] Access token refreshed successfully");
        // Fetch vendor to ensure we have latest data
        await fetchCurrentVendor();
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Mitra Auth] Failed to refresh access token:", {
          status: response.status,
          message: errorData.message
        });
        
        // If refresh fails, logout vendor
        setVendor(null);
        clearTokenRefresh();
        return false;
      }
    } catch (error) {
      console.error("[Mitra Auth] Error refreshing access token:", error);
      setVendor(null);
      clearTokenRefresh();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [fetchCurrentVendor]);

  // Setup auto token refresh
  const setupTokenRefresh = useCallback(() => {
    // Clear existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }

    // Set up new interval
    refreshIntervalRef.current = setInterval(() => {
      console.log("[Mitra Auth] Auto-refreshing access token (scheduled)...");
      refreshAccessToken();
    }, TOKEN_REFRESH_INTERVAL);

    console.log("[Mitra Auth] Token auto-refresh enabled (every 50 minutes)");
  }, [refreshAccessToken]);

  // Clear token refresh interval
  const clearTokenRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
      console.log("[Mitra Auth] Token auto-refresh disabled");
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      console.log("[Mitra Auth] Initializing authentication...");

      const fetchedVendor = await fetchCurrentVendor();
      if (fetchedVendor) {
        console.log("[Mitra Auth] Authentication successful");
        // Setup auto token refresh
        setupTokenRefresh();
      } else {
        console.log("[Mitra Auth] No valid authentication found");
        setVendor(null);
        clearTokenRefresh();
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      clearTokenRefresh();
    };
  }, [fetchCurrentVendor, setupTokenRefresh, clearTokenRefresh]);

  // Login function - set vendor after successful login
  const login = useCallback(
    (vendorData: Vendor) => {
      console.log("[Mitra Auth] Vendor logged in:", vendorData.email);
      setVendor(vendorData);
      // Setup auto token refresh
      setupTokenRefresh();
    },
    [setupTokenRefresh]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      console.log("[Mitra Auth] Logging out...");
      
      // Clear token refresh interval
      clearTokenRefresh();

      // Call our logout API to clear the cookies and Redis data
      await fetch("/api/mitra/logout", {
        method: "POST",
        credentials: "include",
      });

      // Clear vendor state
      setVendor(null);
      
      console.log("[Mitra Auth] Logout successful");
    } catch (error) {
      console.error("[Mitra Auth] Logout error:", error);
      // Clear vendor state even if API fails
      setVendor(null);
      clearTokenRefresh();
    }
  }, [clearTokenRefresh]);

  // Refresh vendor data from database
  const refreshVendor = useCallback(async () => {
    try {
      console.log("[Mitra Auth] Refreshing vendor data...");
      
      // Fetch fresh vendor data from API
      const fetchedVendor = await fetchCurrentVendor();
      if (fetchedVendor) {
        console.log("[Mitra Auth] Vendor data refreshed from database");
      }
    } catch (error) {
      console.error("[Mitra Auth] Error refreshing vendor data:", error);
    }
  }, [fetchCurrentVendor]);

  const value: MitraAuthContextType = {
    vendor,
    isLoading,
    isAuthenticated: !!vendor,
    login,
    logout,
    refreshVendor,
  };

  return (
    <MitraAuthContext.Provider value={value}>
      {children}
    </MitraAuthContext.Provider>
  );
}

export function useMitraAuth() {
  const context = useContext(MitraAuthContext);
  if (context === undefined) {
    throw new Error("useMitraAuth must be used within a MitraAuthProvider");
  }
  return context;
}