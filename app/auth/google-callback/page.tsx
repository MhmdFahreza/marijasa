// app/auth/google-callback/page.tsx - CORRECT FILE (NOT route.tsx!)
"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";

export default function GoogleCallbackPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Memproses login Google...");
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in React Strict Mode
    if (hasProcessed.current) {
      return;
    }

    const processGoogleLogin = async () => {
      try {
        console.log("[Google Callback Page] ========== START ==========");
        console.log("[Google Callback Page] Session status:", status);

        // Wait for session to be determined
        if (status === "loading") {
          console.log("[Google Callback Page] Waiting for session...");
          return;
        }

        // Check if user denied access
        const urlParams = new URLSearchParams(window.location.search);
        const errorParam = urlParams.get("error");
        
        if (errorParam) {
          console.error("[Google Callback Page] Error from URL:", errorParam);
          setError(errorParam);
          
          // Redirect to login with error
          setTimeout(() => {
            router.push(`/login?error=${errorParam}`);
          }, 2000);
          return;
        }

        // If not authenticated, redirect to login
        if (status === "unauthenticated" || !session) {
          console.error("[Google Callback Page] Not authenticated");
          setError("NO_SESSION");
          
          setTimeout(() => {
            router.push("/login?error=NO_SESSION");
          }, 2000);
          return;
        }

        // Session exists, now set custom cookies
        console.log("[Google Callback Page] Session found:", session.user?.email);

        // Get session data from NextAuth session
        const sessionId = (session.user as any).sessionId;
        const accessToken = (session.user as any).accessToken;
        const refreshToken = (session.user as any).refreshToken;
        const customCookiesSet = (session.user as any).customCookiesSet;

        console.log("[Google Callback Page] Session data:", {
          hasSessionId: !!sessionId,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          customCookiesSet: customCookiesSet,
          sessionIdPreview: sessionId ? `${sessionId.substring(0, 8)}...` : 'none',
        });

        // Check if cookies already set
        if (customCookiesSet) {
          console.log("[Google Callback Page] ✅ Cookies already set, redirecting to home");
          
          // Small delay to ensure cookies are propagated
          await new Promise(resolve => setTimeout(resolve, 500));
          
          router.push("/");
          router.refresh();
          return;
        }

        // Validate session data
        if (!sessionId || !accessToken || !refreshToken) {
          console.error("[Google Callback Page] ❌ Missing session data");
          setError("SESSION_ERROR");
          
          setTimeout(() => {
            router.push("/login?error=SESSION_ERROR");
          }, 2000);
          return;
        }

        // Mark as processed
        hasProcessed.current = true;

        // Set cookies via POST endpoint
        setStatusMessage("Menyiapkan sesi login...");
        
        console.log("[Google Callback Page] Calling set-cookies endpoint...");

        const response = await fetch("/api/auth/google/set-cookies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sessionId,
            accessToken,
            refreshToken,
          }),
        });

        console.log("[Google Callback Page] Set-cookies response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[Google Callback Page] ❌ Failed to set cookies:", errorData);
          
          setError("COOKIE_ERROR");
          
          setTimeout(() => {
            router.push("/login?error=COOKIE_ERROR");
          }, 2000);
          return;
        }

        const data = await response.json();
        console.log("[Google Callback Page] ✅ Set-cookies response:", data);

        // Success! Redirect to home
        setStatusMessage("Login berhasil! Mengalihkan...");
        
        // Small delay to ensure cookies are set
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("[Google Callback Page] ✅ Redirecting to home");
        
        router.push("/");
        router.refresh();
        
      } catch (error) {
        console.error("[Google Callback Page] ========== ERROR ==========");
        console.error("[Google Callback Page] Error:", error);
        
        setError("CALLBACK_ERROR");
        
        setTimeout(() => {
          router.push("/login?error=CALLBACK_ERROR");
        }, 2000);
      }
    };

    processGoogleLogin();
  }, [session, status, router]);

  // Render loading state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 space-y-6">
          {/* Logo or Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#7CE0A8] to-[#5AB894] rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {error ? "Login Gagal" : "Menghubungkan Google"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error 
                ? "Terjadi kesalahan saat login dengan Google" 
                : statusMessage
              }
            </p>
          </div>

          {/* Loader */}
          <div className="flex justify-center py-4">
            {error ? (
              <div className="text-center space-y-2">
                <div className="text-5xl">❌</div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Error: {error}
                </p>
                <p className="text-xs text-gray-500">
                  Mengalihkan kembali ke halaman login...
                </p>
              </div>
            ) : (
              <LoaderTwo />
            )}
          </div>

          {/* Info */}
          {!error && (
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mohon tunggu, jangan tutup halaman ini
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Proses ini biasanya memakan waktu beberapa detik
              </p>
            </div>
          )}
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-gray-800 text-gray-100 rounded-lg text-xs font-mono space-y-1">
            <div>Status: {status}</div>
            <div>Has Session: {session ? "✅" : "❌"}</div>
            <div>Has Error: {error || "None"}</div>
            <div>User: {session?.user?.email || "None"}</div>
          </div>
        )}
      </div>
    </div>
  );
}