// app/auth/google-callback/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoaderTwo } from "@/app/components/transition/loader";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const setCookiesAndRedirect = async () => {
      try {
        console.log("[Google Callback Page] Status:", status);
        console.log("[Google Callback Page] Session:", session);

        // Wait for session to be loaded
        if (status === "loading") {
          console.log("[Google Callback Page] Session loading...");
          return;
        }

        // If no session and we've retried too many times, redirect to login with error
        if (status === "unauthenticated") {
          console.error("[Google Callback Page] No session found");
          
          if (retryCount < MAX_RETRIES) {
            console.log(`[Google Callback Page] Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
            setRetryCount(prev => prev + 1);
            
            // Wait a bit before retrying
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            return;
          }
          
          // Max retries reached
          console.error("[Google Callback Page] Max retries reached, redirecting to login");
          router.push("/login?error=NO_SESSION");
          return;
        }

        // Session found, set cookies
        if (status === "authenticated" && session?.user) {
          const sessionId = (session.user as any).sessionId;
          const accessToken = (session.user as any).accessToken;
          const refreshToken = (session.user as any).refreshToken;
          const customCookiesSet = (session.user as any).customCookiesSet;

          console.log("[Google Callback Page] Session data:", {
            hasSessionId: !!sessionId,
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            customCookiesSet,
          });

          // If cookies already set, just redirect
          if (customCookiesSet) {
            console.log("[Google Callback Page] Cookies already set, redirecting to home");
            router.push("/");
            return;
          }

          // Validate session data
          if (!sessionId || !accessToken || !refreshToken) {
            console.error("[Google Callback Page] Missing session data");
            setError("Session data incomplete. Please try logging in again.");
            setTimeout(() => {
              router.push("/login?error=SESSION_ERROR");
            }, 2000);
            return;
          }

          console.log("[Google Callback Page] Setting cookies via API...");

          // Call API to set cookies
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

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("[Google Callback Page] Failed to set cookies:", errorData);
            setError("Failed to set cookies. Please try logging in again.");
            setTimeout(() => {
              router.push("/login?error=COOKIE_ERROR");
            }, 2000);
            return;
          }

          const data = await response.json();
          console.log("[Google Callback Page] Cookies set successfully:", data);

          // Small delay to ensure cookies are set
          await new Promise(resolve => setTimeout(resolve, 500));

          // Redirect to home
          console.log("[Google Callback Page] Redirecting to home...");
          window.location.href = "/"; // Use window.location for hard refresh
        }
      } catch (error) {
        console.error("[Google Callback Page] Error:", error);
        setError("An error occurred. Please try logging in again.");
        setTimeout(() => {
          router.push("/login?error=CALLBACK_ERROR");
        }, 2000);
      }
    };

    setCookiesAndRedirect();
  }, [session, status, router, retryCount]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center">
          <LoaderTwo />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {error ? "⚠️ Error" : "🔐 Completing Sign In"}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {error || "Setting up your session... Please wait."}
          </p>
          
          {retryCount > 0 && !error && (
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Retry attempt {retryCount} of {MAX_RETRIES}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-500">
          <span>🔒</span>
          <p>Secure authentication in progress</p>
        </div>
      </div>
    </div>
  );
}